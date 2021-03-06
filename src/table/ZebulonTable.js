import React, { Component } from "react";
import ReactDOM from "react-dom";
import { ZebulonTableMenu } from "./ZebulonTable.menu";
import { Table } from "./Table";
import { computeMetaPositions } from "./utils/compute.meta";
import { ResizableBox } from "react-resizable";

import "./index.css";
import {
  utils,
  ConfirmationModal,
  accessors,
  constants,
  functions,
  ContextualMenu,
  EventHandler
} from "zebulon-controls";
import { metaFunctions } from "./MetaDescriptions";
import {
  getFilters,
  getSorts,
  computeData,
  // computeMeta,
  computeMetaFromData,
  getSizes
} from "./utils";
import {
  rollback,
  rollbackAll,
  rollbackFiltered,
  errorHandler,
  getUpdatedRows
} from "./utils/utils";
export class ZebulonTable extends ZebulonTableMenu {
  constructor(props) {
    super(props);
    // this.onClose.bind(this);
    this.state = {
      meta: props.meta,
      updatedRows: props.updatedRows || {},
      sizes: props.sizes || { auto: true },
      keyEvent: props.keyEvent,
      confirmationModal: false,
      params: props.params || {},
      sorts: props.sorts || {},
      filters: props.filters || {},
      status: { loaded: false, loading: true }
    };
    this.state.sizes.zoom = this.state.sizes.zoom || 1;
    this.state.sizes.rowHeight = this.state.sizes.rowHeight || 25;
    this.state.functions = props.functions || functions.functions([]);
    this.state.functions.mergeFunctionsObjects([accessors, metaFunctions]);
    // this.sorts = this.state.sorts;
    this.config = props.config;
    if (this.config && this.config.sizes) {
      this.state.sizes = { ...this.state.sizes, ...this.config.sizes };
    }
    this.state.data = props.data;
    this.getData(props);
    this.saveConfirmationAnswer = ok => ok;
  }
  setFilters = (filters, columns) => {
    columns.forEach(column => {
      if (filters[column.id]) {
        column.filterType = filters[column.id].filterType;
        column.v = filters[column.id].v;
        column.vTo = filters[column.id].vTo;
        column.link = filters[column.id].link;
        filters[column.id] = column;
      } else if (
        !utils.isNullOrUndefined(column.v) ||
        (column.filterType === "between" &&
          !utils.isNullOrUndefined(column.vTo))
      ) {
        filters[column.id] = column;
      }
    });
    return filters;
  };
  setSorts = (sorts, columns) => {
    columns.forEach(column => {
      if (sorts[column.id]) {
        column.sortOrder = sorts[column.id].sortOrder;
        column.sort = sorts[column.id].direction;
      } else {
        column.sortOrder = undefined;
        column.sort = undefined;
      }
    });
  };
  refresh = () => this.setState(this.getData(this.props));
  getData = props => {
    if (this._isMounted) {
      this.setState({
        status: { loaded: false, loading: true }
      });
    }
    this.observable = null;
    let { data, meta, params, filteredData } = props;
    const { sorts, filters } = this.state;
    if (props.filters) {
      Object.values(props.filters)
        .filter(filter => filter.link)
        .forEach(filter => (filters[filter.id] = filter));
    }
    const message = {
      dataObject: meta.table.object,
      params,
      meta,
      filters: getFilters(meta.properties, filters || {}),
      sorts: sorts ? Object.values(sorts) : getSorts(meta.properties),
      props,
      state: this.state
    };
    if (typeof data === "function") {
      data = data(message);
    } else if (
      !Array.isArray(data) &&
      ((meta && props.select) || meta.table.select)
    ) {
      data =
        props.select ||
        this.state.functions.getAccessorFunction(
          meta.table.object,
          "dmls",
          meta.table.select
        );
      data = data(message);
    }
    if (Array.isArray(data)) {
      if (meta.table.noDataMutation) {
        data = [...data];
      }
      this.initData(
        data,
        meta,
        this.state.sizes.zoom,
        this.state.functions,
        0,
        filters
      );
      this.subscribe(message, this.state.meta.table.subscription);
    } else if (utils.isPromise(data)) {
      this.resolvePromise(data, message);
    } else if (utils.isObservable(data)) {
      this.subscribeObservable(data, message);
      data = [];
    } else {
      data = [];
    }
    // }
    return { data, meta, filters, sorts, updatedRows: {} };
  };
  initData = (data, meta, zoom, functions, startIndex, filters) => {
    if (Array.isArray(data)) {
      meta.config = this.config ? this.config.properties : undefined;
      computeMetaFromData(
        data,
        meta,
        zoom,
        functions,
        this.props.privileges
          ? this.props.privileges.get(this.props.componentName)
          : null
      );
      this.config = undefined;
      Promise.all(meta.promises).then(values => {
        this.initData2(data, meta, zoom, functions, startIndex, filters);
      });
    }
  };
  initData2 = (data_, meta, zoom, functions, startIndex) => {
    // !! filters may have change after getData call
    const filters = this.state.filters;
    if (Array.isArray(data_)) {
      const data = meta.table.noDataMutation ? [...data_] : data_;
      computeData(data, meta, startIndex, meta.table.noDataMutation);
      if (this.props.filteredData && meta.indexPk) {
        const updatedRows = this.state.updatedRows;
        Object.values(this.props.filteredData).forEach(
          data => (updatedRows[meta.indexPk[data.id]] = data)
        );
      }
      if (this.props.onGetData) {
        this.props.onGetData({
          data,
          meta,
          updatedRows: this.state.updatedRows
        });
      }

      this.initSizes(meta, data, this.state.sizes);
      if (filters && meta.properties.length !== 0) {
        this.setFilters(filters, meta.properties);
      }
      // sorts are applied only the first time
      if (this.state.sorts && meta.properties.length !== 0) {
        this.setSorts(this.state.sorts, meta.properties);
        // this.sorts = null;
      }
      if (this._isMounted) {
        this.setState({
          data,
          status: { loaded: true, loading: false },
          filters
        });
      } else {
        this.state.data = data;
        this.state.filters = filters;
        this.state.status = { loaded: true, loading: false };
      }
    }
  };
  resolvePromise = (data, message) => {
    data
      .then(data => {
        const { meta, functions, sizes } = this.state;
        this.initData(data, meta, sizes.zoom, functions, 0, message.filters);
        this.subscribe(message, meta.table.subscription);
        return data;
      })
      .catch(error =>
        this.setState({
          data: [],
          status: { loaded: false, loading: false, error }
        })
      );
  };
  subscribeObservable = (observable, message) => {
    this.observable = observable;
    this.observable.subscribe(
      x => {
        this.initData(
          x,
          this.state.meta,
          this.state.sizes.zoom,
          this.state.functions,
          this.state.data.length,
          this.state.filters
        );
        if (this.observable) {
          this.setState({
            data: this.state.data.concat(x),
            meta: this.state.meta
          });
        }
      },
      e =>
        this.setState({
          data: [],
          status: { loaded: false, loading: false, error: e }
        }),
      () => {
        this.setState({ status: { loaded: true, loading: false } });
        this.subscribe(message, this.state.meta.table.subscription);
      }
    );
  };
  subscribe = (message, subscription) => {
    if (subscription) {
      const { data, meta, updatedRows } = this.state;
      message.index = meta.indexRowId || meta.indexPk;
      message.data = data;
      message.updatedRows = updatedRows;
      this.observable = subscription.observableFunction(message);
      const { onNext, onError, onCompleted } = subscription.observerFunctions;
      const onNextFunction = data => {
        onNext(data, message);
        this.setState({ status: { loaded: true, loading: false } });
      };
      const onErrorFunction = error => {
        onError(error, message);
        this.setState({ status: { loaded: false, loading: false, error } });
      };
      this.observable.subscribe(onNextFunction, onErrorFunction, () =>
        onCompleted(message)
      );
    }
  };
  initSizes = (meta, data, sizes) => {
    if (sizes.auto) {
      sizes.height = null;
      sizes.width = null;
    }
    if (!sizes.height || !sizes.width) {
      const tableSizes = getSizes(
        meta,
        sizes.rowHeight || meta.row.height || 25
      );
      if (!sizes.height && data) {
        sizes.height =
          meta.table.height ||
          Math.min(
            sizes.maxHeight || 1000,
            Math.max(
              sizes.minHeight || 100,
              tableSizes.headersHeight + data.length * tableSizes.rowHeight
            )
          );
      }
      if (!sizes.width) {
        const scrollbarSize =
          tableSizes.headersHeight + data.length * tableSizes.rowHeight >
          (sizes.maxHeight || 1000)
            ? constants.ScrollbarSize
            : 0;
        sizes.width =
          meta.row.width ||
          Math.min(
            sizes.maxWidth || 2000,
            Math.max(
              sizes.minWidth || 100,
              tableSizes.headersWidth + tableSizes.rowWidth + scrollbarSize
            )
          );
      }
    }
  };
  componentDidMount = () => {
    this._isMounted = true;
    if (this.props.getComponent) {
      this.props.getComponent(this);
    }
  };
  componentWillUnmount = () => (this._isMounted = false);
  componentWillReceiveProps(nextProps) {
    const {
      data,
      meta,
      sizes,
      keyEvent,
      updatedRows,
      filters,
      status,
      closeRequired,
      refresh,
      config
    } = nextProps;
    if (config !== this.props.config) {
      this.config = config;
    }
    if (updatedRows && this.props.updatedRows !== updatedRows) {
      this.setState({ updatedRows });
    }
    if (
      this.props.data !== data ||
      (this.props.status !== status && status.loaded) ||
      (this.props.filters !== filters && meta.table.filteredByServer) ||
      (this.props.refresh !== refresh && refresh !== undefined)
    ) {
      let ok = true;
      // if (!closeRequired && !this.props.closeRequired) {
      ok = this.onTableChange("refresh", ok => {
        if (ok) {
          // this.sorts = this.state.sorts;
          if (this.props.filters !== filters && meta.table.filteredByServer) {
            const state = this.state;
            state.filters = filters;
          }
          this.getData(nextProps);
          if (this.props.linkedObjects) {
            this.props.linkedObjects.forEach(object => object.refresh());
          }
        }
      });
      // }
      if (ok) {
        this.getData(nextProps);
      }
    } else {
      if (this.props.sizes !== sizes) {
        this.setState({ sizes });
      }
    }
    if (this.props.filters !== filters) {
      this.setState({ filters });
    }
    // }
    if (
      nextProps.auditedRow &&
      nextProps.auditedRow !== this.state.auditedRow
    ) {
      this.setState({ auditedRow: nextProps.auditedRow, audits: undefined });
      if (nextProps.auditedRow) {
        let audits = this.state.meta.row.auditFunction({
          row: nextProps.auditedRow,
          type: 2,
          filters: nextProps.filters
        });
        if (utils.isPromise(audits)) {
          this.setState({ status: { loaded: false, loading: true } });
          audits.then(audits => {
            this.setState({
              auditedRow: nextProps.auditedRow,
              audits: audits || [],
              status: { loaded: true, loading: false }
            });
          });
        } else {
          this.setState({
            auditedRow: nextProps.auditedRow,
            audits: audits || []
          });
        }
      }
    }
    // if (closeRequired && !this.props.closeRequired) {
    //   this.onClose(closeRequired);
    // }
  }
  handleKeyEvent = e => {
    if (this.state.confirmationModal && this.modal) {
      if ((e.which || e.keyCode) === 27) {
        // escape
        e.preventDefault();
        this.modal.onEscape();
      }
      if ((e.which || e.keyCode) === 13) {
        // enter
        e.preventDefault();
        this.modal.onEnter();
      } else if (this.modal.component && this.modal.component.handleKeyDown) {
        this.modal.component.handleKeyDown(e);
      }
      return;
    }
    const zoom = utils.isZoom(e);
    if (zoom && (this.props.isActive === undefined || this.props.isActive)) {
      e.preventDefault();
      const sizes = this.state.sizes;
      sizes.zoom *= zoom === 1 ? 1.1 : 1 / 1.1;
      computeMetaPositions(this.state.meta, sizes.zoom);
      this.setState({ sizes: { ...sizes } });
      return;
    }
    if (!this.table) {
      return;
    } else if (e.type === "copy") {
      this.handleCopy(e);
    } else if (e.type === "paste") {
      this.handlePaste(e);
    } else if (e.type === "keydown") {
      this.handleKeyDown(e);
    }
  };
  handleKeyDown = e => {
    if (
      !e.defaultPrevented &&
      this.table &&
      this.table.handleKeyDown &&
      (this.props.isActive === undefined || this.props.isActive)
    ) {
      this.table.handleKeyDown(e);
    }
  };
  handleCopy = e => {
    if (
      !e.defaultPrevented &&
      this.table &&
      this.table.handleCopy &&
      (this.props.isActive === undefined || this.props.isActive)
    ) {
      // e.preventDefault();
      this.table.handleCopy(e);
    }
  };
  handlePaste = e => {
    if (
      !e.defaultPrevented &&
      this.table &&
      this.table.handlePaste &&
      (this.props.isActive === undefined || this.props.isActive)
    ) {
      // e.preventDefault();
      this.table.handlePaste(e);
    }
  };
  // ----------------------------------------
  // comunication with server
  // ----------------------------------------
  rollback = (updatedRows, index) => {
    rollback(updatedRows, index);
    if (this.props.linkedObjects) {
      this.props.linkedObjects.forEach(object => object.rollbackFiltered());
    }
  };
  rollbackFiltered = () => {
    rollbackFiltered(this.state.updatedRows, this.props.filters);
    this.setState({ status: this.state.status });
  };
  errorHandler = (message, action, callback, callbackReDo) => {
    let handler = (this.props.errorHandler || errorHandler)[action];
    if (
      (action === "onTableQuit" && !(message.updatedRows || {}).nErrors) ||
      (action === "onSave" &&
        !(message.updatedRows || {}).nErrorsServer &&
        !message.conflicts)
    ) {
      handler = null;
    } else if (
      action === "onRowQuit" &&
      !((message.status || {}).errors || {}).n_
    ) {
      handler = null;
    }
    if (handler) {
      const ok = handler(message);
      const body = message.modalBody;
      message.modalBody = null;
      const conflicts = message.conflicts;
      message.conflicts = null;
      if (ok === false) {
        if (body) {
          this.setState({
            confirmationModal: true,
            modal: { body, type: "Ok" }
          });
        }
        return false;
      } else if (body) {
        const type = action === "onTableChange" ? "YesNoCancel" : "YesNo";
        this.setState({
          confirmationModal: true,
          modal: { body, type, callback }
        });
        return;
      } else if (conflicts) {
        const resolveConflicts = updatedRows => (ok, data) => {
          if (ok) {
            // back to server version
            data.forEach(index => {
              const row = conflicts.data[index].server;
              row.index_ = index;
              updatedRows[index].row = row;
              this.rollback(updatedRows, index);
            });
            (action === "onSave" && callbackReDo ? callbackReDo : callback)(ok);
          }
        };
        const index = message.messages.findIndex(
          msg => msg.meta.table.object === conflicts.object
        );
        const zebulonTable =
          message.meta.table.object === conflicts.object
            ? this
            : this.props.linkedObjects.find(
                object => object.state.meta.table.object === conflicts.object
              );
        // zebulonTable.confirmationModal = true;
        zebulonTable.setState({
          confirmationModal: true,
          modal: {
            body: zebulonTable.onConflict(conflicts.data),
            type: "conflict",
            callback: resolveConflicts(message.messages[index].updatedRows)
          }
        });
        return;
      }
    }
    return true;
  };
  onClose = callback_ => this.onTableChange("close", callback_);
  onTableChange = (type, callback_) => {
    const ok = this.table.canQuit("rowQuit", ok => {
      if (ok) {
        this.onTableChange_(type, callback_);
      }
    });
    if (ok) {
      this.onTableChange_(type, callback_);
    }
  };
  rollbackAll = () => {
    rollbackAll(this.state.updatedRows, this.state.data);
    this.setState({ updatedRows: {} });
    if (this.table) {
      this.table.updated = false;
      this.table.rowUpdated = false;
      this.table.tableUpdated = false;
      this.table.adjustScrollRows(this.table.state.filteredData);
    }
    if (this.props.linkedObjects) {
      this.props.linkedObjects.forEach(object => {
        if (object.rollbackAll) {
          object.rollbackAll();
        }
      });
    }
  };
  onTableChange_ = (type, callback_) => {
    const callback =
      !callback_ && type === "refresh"
        ? ok => {
            if (ok) {
              this.getData(this.props);
              this.table.updated = false;
              this.table.rowUpdated = false;
              this.table.tableUpdated = false;
              if (this.props.linkedObjects) {
                this.props.linkedObjects.forEach(object => {
                  if (object.refresh) {
                    object.refresh();
                  }
                });
              }
            }
          }
        : callback_;
    if (!getUpdatedRows(this.state.updatedRows).length) {
      return callback(true);
    }
    const message = {
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params,
      type
    };
    const save = (carryOn, ok) => {
      if (carryOn && ok) {
        this.onSave(callback);
      } else if (carryOn) {
        this.rollbackAll();
        callback(true);
      } else {
        callback(false);
      }
    };
    const ok = this.errorHandler(message, "onTableChange", save);
    if (ok !== undefined) {
      callback(ok);
    }
  };
  onSave = callback => {
    const message = {
      messages: [
        {
          updatedRows: this.state.updatedRows,
          // linkedUpdatedRows: this.props.linkedUpdatedRows,
          meta: this.state.meta,
          data: this.state.data,
          params: this.props.params,
          table: this.table
        }
      ],
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params,
      table: this.table
    };
    if (this.props.linkedObjects) {
      this.props.linkedObjects.forEach(object => {
        const { meta, data } = object.state;
        if (
          meta &&
          meta.table.object &&
          (meta.table.onSaveFunction || this.props.onSave)
        ) {
          message.messages.push({
            updatedRows: object.state.updatedRows,
            meta,
            data,
            params: this.props.params,
            table: object.table
          });
        }
      });
    }
    if (this.onSave_(message, callback)) {
      return true;
    }
    return false;
  };
  onSave_ = (message, callback) => {
    // in layouts save can be done without "data" as  data to update may be not anymore in the grid
    // in this case, refresh is required as we can't recompute data
    const end = ok_ => {
      if (ok_) {
        message.messages.forEach(message => {
          const { data, meta, serverData, updatedRows } = message;
          const deleteds = [];
          // deleteds new rows are not sent to the server
          Object.keys(message.updatedRows)
            .filter(
              key =>
                !Number.isNaN(Number(key)) &&
                message.updatedRows[key].new_ &&
                message.updatedRows[key].deleted_
            )
            .forEach(key =>
              deleteds.push(message.updatedRows[key].rowUpdated.index_)
            );
          // retrieve changes made on server
          if (serverData) {
            serverData.forEach(row => {
              if (row.status_ === "deleted") {
                deleteds.push(row.index_);
                if (!data) {
                  updatedRows[row.index_].hidden_ = true;
                }
              } else {
                delete row.status_;
                const rowUpdated = updatedRows[row.index_].rowUpdated;
                Object.keys(row).forEach(key => (rowUpdated[key] = row[key]));
              }
            });
          } else {
            Object.values(message.updatedRows)
              .filter(status => status.deleted_)
              .forEach((status, index) => {
                deleteds.push(status.rowUpdated.index_);
              });
          }
          if (deleteds.length && data) {
            deleteds.sort((x, y) => (x > y) - (y > x));
            deleteds.forEach((index_, index) => data.splice(index_ - index, 1));
          }
          // a voir startIndex en mode pagination
          // this.setState({ updatedRows: {} });
          Object.keys(message.updatedRows).forEach(
            key => delete message.updatedRows[key]
          );
          if (message.table) {
            const filteredData = message.table.state.filteredData;
            if (deleteds.length) {
              deleteds.forEach(index_ => {
                const index = filteredData.findIndex(
                  row => row.index_ === index_
                );
                if (index !== -1) {
                  filteredData.splice(index, 1);
                }
              });
              message.table.adjustScrollRows(filteredData);
              message.table.updated = false;
              message.table.rowUpdated = false;
              message.table.tableUpdated = false;
            }
            message.table.setState({ filteredDataLength: filteredData.length });
          }
          if (data) {
            computeData(data, meta, 0);
          }
        });
      }
      if (this.props.onSaveOk) {
        this.props.onSaveOk(message);
      }
      if (callback) {
        callback(ok_);
      }
    };
    const errorAfter = ok_ => {
      const ok = ok_ && this.errorHandler(message, "onSaveAfter", end);
      if (ok !== undefined) {
        end(ok);
      }
    };
    const saveAfter = ok_ => {
      const onSaveAfter =
        this.props.onSaveAfter ||
        this.state.meta.table.onSaveAfterFunction ||
        (() => true);
      const ok = ok_ && onSaveAfter(message, errorAfter);
      if (ok !== undefined) {
        errorAfter(ok);
      }
    };
    const errorSave = ok_ => {
      const ok =
        ok_ && this.errorHandler(message, "onSave", saveAfter, saveBefore);
      if (ok !== undefined) {
        saveAfter(ok);
      }
    };
    const save = ok_ => {
      const onSave =
        this.props.onSave ||
        this.state.meta.table.onSaveFunction ||
        (() => true);
      const ok = ok_ && onSave(message, errorSave);
      if (ok !== undefined) {
        errorSave(ok);
      }
    };
    const errorBefore = ok_ => {
      const ok = ok_ && this.errorHandler(message, "onSaveBefore", save);
      if (ok !== undefined) {
        save(ok);
      }
    };
    const saveBefore = ok_ => {
      const updatedRows = message.updatedRows;
      if (!getUpdatedRows(updatedRows).length) {
        return end(true);
      }
      const onSaveBefore =
        this.props.onSaveBefore ||
        this.state.meta.table.onSaveBeforeFunction ||
        (() => true);
      const ok = ok_ && onSaveBefore(message, errorBefore);
      if (ok !== undefined) {
        errorBefore(ok);
      }
    };
    const canQuit = ok_ => {
      const ok = ok_ && this.table.canQuit("rowQuit", saveBefore);
      if (ok !== undefined) {
        saveBefore(ok);
      }
    };
    canQuit(true);
  };
  // confirmation modal management
  onConfirm = (button, type) => {
    this.setState({
      modalCancel: false,
      modal: null,
      confirmationModal: false
    });
    // this.confirmationModal = false;
  };
  // foreign key modal
  onForeignKey = (ForeignObject, filters, selection, callback) => {
    const { rowHeight, zoom, height, width } = this.state.sizes;
    const body = (
      <ForeignObject
        sizes={{
          minHeight: 200,
          maxHeight: height,
          minWidth: 300,
          maxWidth: width,
          rowHeight: rowHeight * zoom
        }}
        filters={filters}
        functions={this.props.functions}
      />
    );
    // this.confirmationModal = true;
    const state = this.state;
    state.confirmationModal = true;
    state.modal = { body, type: "foreignKey", selection, callback };
    this.setState({
      confirmationModal: true,
      modal: { body, type: "foreignKey", selection, callback }
    });
  };
  onConflict = conflicts => {
    const properties = [{ id: "From", width: 55 }];
    this.state.meta.properties.forEach(property =>
      properties.push({ ...property })
    );
    const meta = {
      ...this.state.meta,
      indexPk: {},
      table: {
        ...this.state.meta.table,
        editable: false,
        checkable: 2,
        select: undefined,
        subscription: undefined,
        noFilter: true,
        caption: `Conflicts resolution.`
      },
      properties
    };
    const data = [];
    let index = 0,
      updatedRows = {};

    Object.keys(conflicts).forEach(index_ => {
      const conflict = conflicts[index_];
      conflict.server.From = conflict.server.deleted_ ? (
        <div style={{ color: "red" }}>Server</div>
      ) : (
        "Server"
      );
      updatedRows[index] = { checked_: true, index_ };
      const ix = index;
      conflict.server.index_ = ix;
      data.push(conflict.server);
      updatedRows[index + 1] = { checked_: false };
      data.push({
        ...conflict.client,
        From: conflict.client.deleted_ ? (
          <div style={{ color: "red" }}>Client</div>
        ) : (
          "Client"
        ),
        index_: ix + 1
      });
      index += 2;
    });
    const { rowHeight, zoom, height, width } = this.state.sizes;
    return (
      <ZebulonTable
        sizes={{
          minHeight: 200,
          maxHeight: height,
          minWidth: 300,
          maxWidth: width,
          rowHeight: rowHeight * zoom
        }}
        meta={meta}
        data={data}
        isModal={true}
        functions={this.state.functions}
        updatedRows={updatedRows}
      />
    );
  };
  onResize = (e, data) => {
    this.setState({
      sizes: {
        ...this.state.sizes,
        height: data.size.height,
        width: data.size.width
      }
    });
  };

  // getConfiguration_ = (configuration, layout) => {
  //   const {
  //     height,
  //     width,
  //     display,
  //     tabs,
  //     ratioHeight,
  //     ratioWidth,
  //     layouts,
  //     content,
  //     caption
  //   } = layout;

  //   configuration.height = height;
  //   configuration.width = width;
  //   configuration.display = display;
  //   configuration.tabs = tabs;
  //   configuration.ratioHeight = ratioHeight;
  //   configuration.ratioWidth = ratioWidth;
  //   configuration.content = content;
  //   configuration.caption = caption;
  //   if (layouts && layouts.length) {
  //     configuration.layouts = [];
  //     layouts.forEach((layout, index) => {
  //       configuration.layouts.push({});
  //       this.getConfiguration_(configuration.layouts[index], layout);
  //     });
  //   }
  // };
  getConfiguration = () => ({
    sizes: {
      ...this.state.sizes,
      auto: false,
      minHeight: null,
      maxHeight: null,
      minWidth: null,
      maxWidth: null
    },
    properties: this.state.meta.properties.reduce((acc, property) => {
      acc[property.id] = {
        index_: property.index_,
        width: property.width,
        locked: property.locked
      };
      return acc;
    }, {})
  });
  render() {
    const style = {
      fontSize: `${(this.props.isModal ? 1 : this.state.sizes.zoom) * 100}%`,
      position: "relative",
      height: "fitContent"
    };
    let {
      data,
      meta,
      filters,
      updatedRows,
      sizes,
      status,
      auditedRow,
      audits
    } = this.state;
    if (auditedRow && audits) {
      meta = {
        ...meta,
        table: {
          ...meta.table,
          editable: false,
          noOrder: true,
          actions: [],
          caption: `${meta.table.caption || meta.table.object} (audit :${
            meta.row.descriptorFunction
              ? meta.row.descriptorFunction({ row: auditedRow })
              : auditedRow.index_
          })`
        }
      };
      // linked object
      data = audits;
      filters = {};
      updatedRows = {};
      if (this.props.auditedRow) {
        meta.table.caption = `${meta.table.caption || meta.table.object}`;
      } else {
        meta.properties = [
          {
            id: "user_",
            caption: "User",
            width: 80
          },
          {
            id: "timestamp_",
            caption: "Time",
            dataType: "number",
            format: "time",
            formatFunction: ({ value }) =>
              utils.formatValue(
                new Date(value / 1000000),
                "dd/mm/yyyy hh:mi:ss"
              ),
            width: 150,
            sort: "desc"
          },
          {
            id: "status_",
            caption: "Status",
            dataType: "string",
            width: 70,
            locked: true
          },
          ...meta.properties.map(property => ({
            ...property,
            locked: false,
            v: undefined
          }))
        ];
        computeMetaPositions(meta, this.state.sizes.zoom);
        meta.lockedIndex = 2;
        meta.lockedWidth = 300 * this.state.sizes.zoom;
        let rowAudited = updatedRows[auditedRow.index_];
        if (
          rowAudited &&
          (rowAudited.deleted_ || rowAudited.updated_ || rowAudited.new_) &&
          !(rowAudited.deleted_ && rowAudited.new_)
        ) {
          rowAudited = {
            ...rowAudited.rowUpdated,
            status_: rowAudited.deleted_
              ? "deleted"
              : rowAudited.new_
              ? "inserted"
              : "updated"
          };
          data = [rowAudited].concat(data);
        }
      }

      sizes = { ...sizes };
      this.initSizes(meta, data, sizes);
    }
    const componentId =
      this.props.componentId || `zebulon-table-${this.props.id}`;

    // const modal = null;
    let div = (
      <EventHandler
        id={componentId}
        component={this}
        style={style}
        className="zebulon-table"
        componentId={componentId}
      >
        <ContextualMenu
          key="table-menu"
          getMenu={this.getMenu}
          componentId={componentId}
          id="table-menu"
          ref={ref => (this.contextualMenu = ref)}
        />
        <Table
          id={this.props.id}
          componentId={componentId}
          style={this.props.style}
          status={status}
          data={data}
          meta={meta}
          params={this.props.params}
          filters={filters}
          updatedRows={updatedRows}
          key={this.props.id}
          visible={this.props.visible === undefined ? true : this.props.visible}
          // sizes={this.state.sizes}
          width={sizes.width}
          height={sizes.height}
          zoom={sizes.zoom}
          rowHeight={
            (this.state.sizes.rowHeight || 25) * (this.state.sizes.zoom || 1)
          }
          caption={this.props.caption}
          isActive={this.props.isActive}
          onActivation={this.props.onActivation}
          ref={ref => (this.table = ref)}
          getActions={this.props.getActions}
          onChange={this.props.onChange}
          onDoubleClick={this.props.onDoubleClick}
          onCellEnter={this.props.onCellEnter}
          onCellQuit={this.props.onCellQuit}
          onRowNew={this.props.onRowNew}
          onRowDelete={this.props.onRowDelete}
          onRowEnter={this.props.onRowEnter}
          onRowQuit={this.props.onRowQuit}
          onTableEnter={this.props.onTableEnter}
          onTableChange={this.onTableChange}
          onTableQuit={this.props.onTableQuit}
          onTableClose={this.props.onTableClose}
          onFilter={this.props.onFilter}
          onSort={this.props.onSort}
          select={this.props.select}
          onGetData={this.props.onGetData}
          onGetPage={this.props.onGetPage}
          onSave={this.onSave}
          onAction={this.props.onAction}
          callbacks={this.props.callbacks}
          errorHandler={this.errorHandler}
          navigationKeyHandler={this.props.navigationKeyHandler}
          contextualMenu={this.contextualMenu} // {this.props.contextualMenu}
          callbackForeignKey={this.props.callbackForeignKey}
          onForeignKey={this.onForeignKey}
          isModal={this.props.isModal}
          modal={this.state.confirmationModal || this.state.modalCancel}
          selection={this.props.selection}
        />
      </EventHandler>
    );
    if (this.props.resizable || this.props.resizable === undefined) {
      div = (
        <ResizableBox
          width={sizes.width || 100}
          height={sizes.height || 30}
          onResize={this.onResize}
        >
          {div}
        </ResizableBox>
      );
    }
    console.log("render zt", meta.table, this.state.modal);
    return (
      // confirmation modal must be outside of previous elements
      // else it doesnt render in some cases???
      <div>
        {div}
        <ConfirmationModal
          show={this.state.confirmationModal}
          detail={this.state.modal}
          onConfirm={this.onConfirm}
          ref={ref => (this.modal = ref)}
          id={`modal-${this.props.id}`}
          key={`modal-${this.props.id}`}
        />
      </div>
    );
  }
}
ZebulonTable.prototype["getState"] = function() {
  return this.state;
};
