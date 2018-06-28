import React, { Component } from "react";
import { Table } from "./Table";
import "./index.css";
import {
  utils,
  ConfirmationModal,
  accessors,
  constants
} from "zebulon-controls";
import { metaFunctions } from "./MetaDescriptions";
import {
  getFilters,
  getSorts,
  functions,
  computeData,
  computeMeta,
  computeMetaFromData,
  getSizes
} from "./utils";
import {
  rollback,
  rollbackAll,
  errorHandler,
  getUpdatedRows
} from "./utils/utils";
export class ZebulonTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      meta: props.meta,
      updatedRows: props.updatedRows || {},
      sizes: props.sizes || {},
      keyEvent: props.keyEvent,
      confirmationModal: false,
      params: props.params || {},
      sorts: props.sorts || {}
    };
    props.sizes.zoom = props.sizes.zoom || 1;
    this.keyEvent = false;
    this.state.functions = props.functions;
    this.state.functions.mergeFunctionsObjects([accessors, metaFunctions]);
    this.sorts = this.state.sorts;
    const { data, status, filters } = this.getData(props);
    this.state.data = data;
    this.state.status = status;
    this.state.filters = filters;
    this.saveConfirmationAnswer = ok => ok;
  }
  // initFunctions = (functions, object) => {
  //   // if (Array.isArray(functions_)) {
  //   //   return functions_;
  //   // } else {
  //     functions.mergeFunctionsObjects(    [accessors, metaFunctions]);
  //   }
  // };
  setFilters = (filters, columns) => {
    columns.forEach(column => {
      if (filters[column.id]) {
        column.filterType = filters[column.id].filterType;
        column.v = filters[column.id].v;
        column.vTo = filters[column.id].vTo;
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
  getData = (props, sorts) => {
    this.observable = null;
    let { data, meta, params, filters, filteredData } = props,
      status = { loaded: false, loading: true };
    const message = {
      dataObject: meta.table.object,
      params,
      meta,
      filters: getFilters(meta.properties, filters || {}),
      sorts: this.sorts ? Object.values(this.sorts) : getSorts(meta.properties)
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
      status = { loaded: true, loading: false };
      if (meta.table.noDataMutation) {
        data = [...data];
      }
      this.initData(
        data,
        meta,
        this.state.sizes.zoom,
        this.state.functions,
        0,
        filters,
        sorts,
        status
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
    return { data, meta, status, filters, sorts };
  };
  initData = (data, meta, zoom, functions, startIndex, filters, status) => {
    if (Array.isArray(data)) {
      computeMetaFromData(
        data,
        meta,
        zoom,
        functions,
        (this.props.params || {}).privileges_
      );
      computeData(data, meta, startIndex, meta.table.noDataMutation);
      if (this.props.filteredData && meta.indexPk) {
        const updatedRows = this.state.updatedRows;
        Object.values(this.props.filteredData).forEach(
          data => (updatedRows[meta.indexPk[data.id]] = data)
        );
      }
      if (this.props.onGetData) {
        this.props.onGetData({ data, meta, status });
      }
    }
    this.initSizes(meta, data);
    if (filters && meta.properties.length !== 0) {
      this.setFilters(filters, meta.properties);
    }
    // sorts are applied only the first time
    if (this.sorts && meta.properties.length !== 0) {
      this.setSorts(this.sorts, meta.properties);
      this.sorts = null;
    }
  };
  resolvePromise = (data, message) => {
    data
      .then(data => {
        const { meta, functions, filters, sizes } = this.state;
        const status = { loaded: true, loading: false };
        if (!meta.serverPagination) {
          this.initData(data, meta, sizes.zoom, functions, 0, filters, status);
        } else if (meta.properties.length === 0) {
          data({ startIndex: 0 }).then(page => {
            this.initData(
              page.page,
              meta,
              sizes.zoom,
              functions,
              0,
              filters,
              status
            );
          });
          this.setState({ data, status });
          return data;
        }
        this.setState({ data, status });
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
        const status = { loaded: true, loading: false };

        this.initData(
          x,
          this.state.meta,
          this.state.sizes.zoom,
          this.state.functions,
          this.state.data.length,
          this.state.filters,
          status
        );
        if (this.observable) {
          this.setState({
            data: this.state.data.concat(x),
            meta: this.state.meta,
            status
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
        // console.log("end");
        // this.observable.unsubscribe();
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
  initSizes = (meta, data) => {
    const { sizes } = this.state;
    if (!sizes.height || !sizes.width) {
      const tableSizes = getSizes(
        meta,
        sizes.rowHeight || meta.row.height || 25
      );
      // if (this.props.isModal) {
      //   tableSizes.headersHeight += 30;
      // }
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
  componentDidMount() {
    if (this.props.keyEvent === undefined) {
      document.addEventListener("copy", this.handleCopy);
      document.addEventListener("paste", this.handlePaste);
      document.addEventListener("keydown", this.handleKeyEvent);
    }
  }
  componentWillUnmount() {
    if (this.props.keyEvent === undefined) {
      document.removeEventListener("copy", this.handleCopy);
      document.removeEventListener("paste", this.handlePaste);
      document.removeEventListener("keydown", this.handleKeyEvent);
    }
  }
  componentWillReceiveProps(nextProps) {
    const {
      data,
      meta,
      sizes,
      keyEvent,
      updatedRows,
      filters,
      status,
      saveConfirmationRequired,
      refresh
    } = nextProps;

    if (this.props.keyEvent !== keyEvent) {
      this.handleKeyEvent(keyEvent);
    } else {
      if (updatedRows && this.props.updatedRows !== updatedRows) {
        this.setState({ updatedRows });
      }
      if (
        this.props.data !== data ||
        this.props.status !== status ||
        this.props.filters !== filters ||
        this.props.refresh !== refresh
      ) {
        let ok = true;
        if (!saveConfirmationRequired && !this.props.saveConfirmationRequired) {
          ok = this.onTableChange("refresh", ok => {
            if (ok) {
              this.setState(this.getData(nextProps));
            }
          });
        }
        if (ok) {
          this.setState(this.getData(nextProps));
        }
      } else if (this.props.sizes !== sizes) {
        this.setState({ sizes });
      }
    }
    if (saveConfirmationRequired && !this.props.saveConfirmationRequired) {
      this.onTableChange("close", saveConfirmationRequired);
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (this.keyEvent && !this.confirmationModal) {
      this.keyEvent = false;
      return false;
    }
    this.keyEvent = false;
    return true;
  }
  handleKeyEvent = e => {
    if (this.confirmationModal) {
      this.setState({ keyEvent: e });
      return;
    } else if (this.state.keyEvent) {
      this.setState({ keyEvent: null });
    }
    const zoom = utils.isZoom(e);
    if (zoom && (this.props.isActive === undefined || this.props.isActive)) {
      e.preventDefault();
      const sizes = this.state.sizes;
      sizes.zoom *= zoom === 1 ? 1.1 : 1 / 1.1;
      this.setState({ sizes: { ...sizes } });
      computeMeta(
        this.state.meta,
        sizes.zoom,
        this.state.functions,
        (this.props.params || {}).privileges_
      );
      return;
    }
    if (this.props.keyEvent) {
      this.keyEvent = true;
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
      this.table.handleKeyDown &&
      (this.props.isActive === undefined || this.props.isActive)
    ) {
      this.table.handleKeyDown(e);
    }
  };
  handleCopy = e => {
    if (
      !e.defaultPrevented &&
      this.table.handleCopy &&
      (this.props.isActive === undefined || this.props.isActive)
    ) {
      this.table.handleCopy(e);
    }
  };
  handlePaste = e => {
    if (
      !e.defaultPrevented &&
      this.table.handlePaste &&
      (this.props.isActive === undefined || this.props.isActive)
    ) {
      this.table.handlePaste(e);
    }
  };
  // ----------------------------------------
  // comunication with server
  // ----------------------------------------
  errorHandler = (message, action, callback) => {
    let handler = (this.props.errorHandler || errorHandler)[action];
    if (
      (action === "onTableQuit" && !(message.updatedRows || {}).nErrors) ||
      (action === "onSave" && !(message.updatedRows || {}).nErrorsServer)
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
          this.confirmationModal = true;
          this.setState({
            confirmationModal: true,
            modal: { body, type: "Ok" }
          });
        }
        return false;
      } else if (body) {
        this.confirmationModal = true;
        const type = action === "onTableChange" ? "YesNoCancel" : "YesNo";
        this.setState({
          confirmationModal: true,
          modal: { body, type, callback }
        });
        return;
      } else if (conflicts) {
        const resolveConflicts = (ok, data) => {
          if (ok) {
            // back to server version
            data.forEach(index => {
              const row = conflicts[index].server;
              row.index_ = index;
              message.updatedRows[index].row = row;
              rollback(message.updatedRows, index);
            });
            callback(ok);
          }
        };
        this.confirmationModal = true;
        this.setState({
          confirmationModal: true,
          modal: {
            body: this.onConflict(conflicts),
            type: "conflict",
            callback: resolveConflicts
          }
        });
        return;
      }
    }
    return true;
  };
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
  onTableChange_ = (type, callback_) => {
    const callback =
      !callback_ && type === "refresh"
        ? ok => {
            if (ok) {
              this.setState(this.getData(this.props));
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
        rollbackAll(this.state.updatedRows, this.state.data);
        this.setState({ updatedRows: {} });
        if (this.table) {
          this.table.updated = false;
          this.table.rowUpdated = false;
          this.table.tableUpdated = false;
          this.table.adjustScrollRows(this.table.state.filteredData);
        }
        callback(true);
      } else {
        callback(false);
      }
    };
    const ok = this.errorHandler(message, "onTableChange", save);
    if (ok !== undefined) {
      // console.log("errorHandler", ok, this.state);
      callback(ok);
    }
  };
  onSave = callback => {
    const message = {
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    if (this.onSave_(message, callback)) {
      return true;
    }
    return false;
  };
  onSave_ = (message, callback) => {
    // local checks and process
    // console.log("save", this.state);
    const end = ok_ => {
      if (ok_) {
        const { data, meta, serverData } = message;
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
            } else {
              delete row.status_;

              Object.keys(row).forEach(
                key => (data[row.index_][key] = row[key])
              );
            }
          });
        } else {
          Object.values(message.updatedRows)
            .filter(status => status.deleted_)
            .forEach((status, index) => {
              deleteds.push(status.rowUpdated.index_);
            });
        }
        if (deleteds.length) {
          deleteds.sort((x, y) => (x > y) - (y > x));
          deleteds.forEach((index_, index) => data.splice(index_ - index, 1));
        }
        // a voir startIndex en mode pagination
        // this.setState({ updatedRows: {} });
        Object.keys(message.updatedRows).forEach(
          key => delete message.updatedRows[key]
        );
        if (this.table) {
          const filteredData = this.table.state.filteredData;
          if (deleteds.length) {
            deleteds.forEach(index_ => {
              const index = filteredData.findIndex(
                row => row.index_ === index_
              );
              if (index !== -1) {
                filteredData.splice(index, 1);
              }
            });
            this.table.adjustScrollRows(filteredData);
            this.table.updated = false;
            this.table.rowUpdated = false;
            this.table.tableUpdated = false;
          }
          this.table.setState({ filteredDataLength: filteredData.length });
        }
        computeData(data, meta, 0);
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
      const ok = ok_ && this.errorHandler(message, "onSave", saveAfter);
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
      confirmationModal: false,
      keyEvent: null
    });
    this.confirmationModal = false;
  };
  // foreign key modal
  onForeignKey = (ForeignObject, filters, callback) => {
    const { rowHeight, zoom, height, width } = this.state.sizes;
    const element = (
      <ForeignObject
        sizes={{
          minHeight: 200,
          maxHeight: height,
          minWidth: 300,
          maxWidth: width,
          rowHeight: rowHeight * zoom
        }}
        filters={filters}
        keyEvent={this.state.keyEvent}
        functions={this.props.functions}
      />
    );
    this.confirmationModal = true;
    this.setState({
      confirmationModal: true,
      modal: { body: element, type: "foreignKey", callback }
    });
    this.keyEvent = false;
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

  render() {
    const style = {
      fontSize: `${(this.props.isModal ? 1 : this.state.sizes.zoom) * 100}%`,
      position: "relative"
    };
    let div = (
      <div
        style={style}
        className="zebulon-table"
        id={`zebulon-table-${this.props.id}`}
      >
        <Table
          id={this.props.id}
          style={this.props.style}
          status={this.state.status}
          data={this.state.data}
          meta={this.state.meta}
          params={this.props.params}
          filters={this.state.filters}
          updatedRows={this.state.updatedRows}
          key={this.props.id}
          visible={this.props.visible === undefined ? true : this.props.visible}
          // sizes={this.state.sizes}
          width={this.state.sizes.width}
          height={this.state.sizes.height}
          zoom={this.state.sizes.zoom}
          rowHeight={
            (this.state.sizes.rowHeight || 25) * (this.state.sizes.zoom || 1)
          }
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
          callbacks={this.props.callbacks}
          errorHandler={this.errorHandler}
          navigationKeyHandler={this.props.navigationKeyHandler}
          contextualMenu={this.props.contextualMenu}
          callbackForeignKey={this.props.callbackForeignKey}
          onForeignKey={this.onForeignKey}
          isModal={this.props.isModal}
          modal={this.state.confirmationModal || this.state.modalCancel}
        />
        <ConfirmationModal
          show={this.state.confirmationModal}
          detail={this.state.modal}
          onConfirm={this.onConfirm}
          keyEvent={this.state.keyEvent}
          ref={ref => (this.modal = ref)}
        />
      </div>
    );
    return div;
  }
}
ZebulonTable.prototype["getState"] = function() {
  return this.state;
};
