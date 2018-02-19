import React, { Component } from "react";
import { Table } from "./Table";
import "./index.css";
import { utils, ConfirmationModal } from "zebulon-controls";
import { MyThirdparties } from "../demo/thirdparties";

import {
  computeMeta,
  computeMetaFromData,
  functionsTable,
  getFunction,
  getSizes
} from "./utils/compute.meta";
import { computeData } from "./utils/compute.data";
import { getFilters, getSorts } from "./utils/filters.sorts";
import { rollbackAll } from "./utils/utils";
// import { utils.isPromise, isDate } from "./utils/generic";

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
    this.zoomValue = props.sizes.zoom || 1;
    this.keyEvent = false;
    // functions
    if (Array.isArray(props.functions)) {
      this.state.functions = props.functions;
    } else {
      this.state.functions = functionsTable(props.functions);
    }
    this.sorts = this.state.sorts;
    const { data, status, filters } = this.getData(props);
    this.state.data = data;
    this.state.status = status;
    this.state.filters = filters;
    this.saveConfirmationAnswer = ok => ok;
  }
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
    let { data, meta, params, filters } = props,
      status = { loaded: false, loading: true };
    if (typeof data === "function") {
      // this.select = data;
      data = data({
        dataObject: meta.table.object,
        params,
        meta,
        filters: getFilters(meta.properties, filters || {}),
        sorts: this.sorts
          ? Object.values(this.sorts)
          : getSorts(meta.properties)
      });
    } else if ((meta && props.onGetData) || meta.table.select) {
      data =
        props.onGetData ||
        getFunction(
          this.state.functions,
          meta.table.object || "dataset",
          "dml",
          meta.table.select
        );
      // this.select = data;
      data = data({
        params,
        meta,
        filters: getFilters(meta.properties, filters || {}),
        sorts: this.sorts
          ? Object.values(this.sorts)
          : getSorts(meta.properties)
      });
    }
    if (Array.isArray(data)) {
      this.initData(
        data,
        meta,
        this.zoomValue,
        this.state.functions,
        0,
        filters,
        sorts
      );
      status = { loaded: true, loading: false };
    } else if (utils.isPromise(data)) {
      this.resolvePromise(data);
    } else if (utils.isObservable(data)) {
      this.subscribeObservable(data);
      data = [];
    } else {
      data = [];
    }
    // }
    return { data, meta, status, filters, sorts };
  };
  initData = (data, meta, zoom, functions, startIndex, filters) => {
    if (data) {
      computeMetaFromData(data, meta, zoom, functions);
      computeData(data, meta, startIndex);
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
  resolvePromise = data => {
    data
      .then(data => {
        if (!this.state.meta.serverPagination) {
          this.initData(
            data,
            this.state.meta,
            this.zoomValue,
            this.state.functions,
            0,
            this.state.filters
          );
        } else if (this.state.meta.properties.length === 0) {
          data({ startIndex: 0 }).then(page => {
            this.initData(
              page.page,
              this.state.meta,
              this.zoomValue,
              this.state.functions,
              0,
              this.state.filters
            );
          });
          this.setState({ data, status: { loaded: true, loading: false } });
          return data;
        }
        this.setState({ data, status: { loaded: true, loading: false } });
        return data;
      })
      .catch(error =>
        this.setState({
          data: [],
          status: { loaded: false, loading: false, error }
        })
      );
  };
  subscribeObservable = observable => {
    this.observable = observable;
    this.observable.subscribe(
      x => {
        this.initData(
          x,
          this.state.meta,
          this.zoomValue,
          this.state.functions,
          this.state.data.length,
          this.state.filters
        );
        if (this.observable) {
          this.setState({
            data: this.state.data.concat(x),
            status: { loaded: true, loading: false }
          });
        }
      },
      e =>
        this.setState({
          data: [],
          status: { loaded: false, loading: false, error: e }
        }),
      () => this.setState({ status: { loaded: true, loading: false } })
    );
  };
  initSizes = (meta, data) => {
    const { sizes } = this.state;
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
        sizes.width =
          meta.row.width ||
          Math.min(
            sizes.maxWidth || 2000,
            Math.max(
              sizes.minWidth || 100,
              tableSizes.headersWidth + tableSizes.rowWidth
            )
          );
      }
      // this.setState({ sizes });
    }
  };
  componentDidMount() {
    if (!this.props.keyEvent === undefined) {
      document.addEventListener("copy", this.handleCopy);
      document.addEventListener("paste", this.handlePaste);
      document.addEventListener("keydown", this.handleKeyDown);
    }
  }
  componentDidUnMount() {
    if (this.props.keyEvent === undefined) {
      document.removeEventListener("copy", this.handleCopy);
      document.removeEventListener("paste", this.handlePaste);
      document.removeEventListener("keydown", this.handleKeyDown);
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
      saveConfirmationRequired
    } = nextProps;
    if (this.state.sizes !== nextProps.sizes) {
      if (sizes.zoom) {
        if (this.zoomValue !== sizes.zoom) {
          this.zoomValue = sizes.zoom;
          computeMeta(meta, this.zoomValue, this.props.functions);
        }
      }
      this.setState({ sizes: { ...sizes, zoom: this.zoomValue } });
    }
    if (
      this.props.data !== data ||
      this.props.meta !== meta ||
      this.props.status !== status ||
      this.props.filters !== filters
    ) {
      this.observable = null;
      this.setState(this.getData(nextProps));
    }
    if (updatedRows && this.props.updatedRows !== updatedRows) {
      this.setState({ updatedRows });
    }
    if (this.props.keyEvent !== keyEvent) {
      this.handleKeyEvent(keyEvent);
    }
    if (saveConfirmationRequired) {
      this.saveConfirmationAnswer = ok => {
        saveConfirmationRequired(ok);
        this.saveConfirmationAnswer = ok => ok;
        return ok;
      };
      if (
        Object.values(this.state.updatedRows).find(
          status => status.new_ || status.deleted_ || status.updated_
        ) !== undefined
      ) {
        this.setState({
          confirmationModal: true,
          modal: { text: "Do you want to save before?", type: "YesNoCancel" }
        });
      } else {
        this.saveConfirmationAnswer(true);
      }
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (this.keyEvent && !this.state.confirmationModal) {
      this.keyEvent = false;
      return false;
    }
    this.keyEvent = false;
    return true;
  }
  handleKeyEvent = e => {
    if (this.state.confirmationModal) {
      this.setState({ keyEvent: e });
      return;
    }
    const zoom = utils.isZoom(e);
    if (zoom && (this.props.isActive === undefined || this.props.isActive)) {
      e.preventDefault();
      this.zoomValue *= zoom === 1 ? 1.1 : 1 / 1.1;
      this.setState({ sizes: { ...this.props.sizes, zoom: this.zoomValue } });
      computeMeta(this.state.meta, this.zoomValue, this.state.functions);
      return;
    }
    if (e.key === "Escape" && this.state.confirmationModal) {
      this.setState({ confirmationModal: false });
    } else {
      this.keyEvent = true;
      if (!this.table) return;
      else if (e.type === "copy") this.handleCopy(e);
      else if (e.type === "paste") this.handlePaste(e);
      else if (e.type === "keydown") this.handleKeyDown(e);
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
  errorHandler = (message, action) => {
    let handler = this.props.errorHandler && this.props.errorHandler[action];
    if (action === "onTableQuit" || action === "onSave") {
      handler = handler && (message.updatedRows || {}).nErrors;
    } else if (action === "onRowQuit") {
      handler = handler && message.updated && (message.status.errors || {}).n_;
    }
    if (handler) {
      const ok = this.props.errorHandler[action](message);
      if (ok === false) {
        if (message.error) {
          this.setState({
            confirmationModal: true,
            modal: { text: message.error, type: "Ok" }
          });
          return false;
        }
      } else if (message.error) {
        this.setState({
          confirmationModal: true,
          modal: {
            text: message.error,
            type: "YesNo",
            callback: (button, type) => {
              (message.callback || (() => {}))(button, type);
            }
          }
        });
        return;
      }
    }
    return true;
  };
  onSave = () => {
    const message = {
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    if (this.onSave_(message)) {
      return true;
    }
    return false;
  };
  onSave_ = message => {
    // local checks and process
    if (!this.onSaveBefore(message)) return false;
    if (!this.errorHandler(message, "onSave")) {
      return this.saveConfirmationAnswer(false);
    }
    const onSave = this.props.onSave || this.state.meta.table.onSaveFunction;
    message.callback = this.onSaveAfter;
    if (onSave) {
      const ok = onSave(message);
      if (ok === false) {
        return this.saveConfirmationAnswer(false);
      } else if (ok === true) {
        message.callback(message);
      }
    }
  };
  onSaveBefore = message => {
    const onSaveBefore =
      this.props.onSaveBefore || this.state.meta.table.onSaveBeforeFunction;
    if (onSaveBefore && onSaveBefore(message) === false) return false;
    return true;
  };
  onSaveAfter = message => {
    if (message.error) {
      this.setState({
        confirmationModal: true,
        modal: { text: message.error, type: "Ok" }
      });
      return this.saveConfirmationAnswer(false);
    }
    const onSaveAfter =
      this.props.onSaveAfter || this.state.meta.table.onSaveAfterFunction;
    if (onSaveAfter && onSaveAfter(message) === false) {
      return this.saveConfirmationAnswer(false);
    }
    this.setState({ updatedRows: {} });
    return this.saveConfirmationAnswer(true);
  };
  // confirmation modal management for external close
  onConfirm = (button, type) => {
    if (button === "yes") {
      this.setState({
        modalCancel: false,
        confirmationModal: false,
        saveConfirmationAnswer: true
      });
      if (type === "YesNoCancel") {
        if (!this.table.onTableQuit(true)) {
          return this.onConfirm("cancel");
        }
        this.onSave();
      }
    } else if (button === "no" && type === "YesNoCancel") {
      rollbackAll(this.state.updatedRows, this.state.data);
      this.setState({
        modalCancel: false,
        confirmationModal: false,
        saveConfirmationAnswer: null,
        updatedRows: {}
      });
      this.saveConfirmationAnswer(true);
    } else if (button === "cancel") {
      this.setState({
        modalCancel: true,
        confirmationModal: false,
        saveConfirmationAnswer: false
      });
      this.saveConfirmationAnswer(false);
    } else {
      // if (button === "ok") {
      this.setState({
        modalCancel: false,
        confirmationModal: false,
        saveConfirmationAnswer: false
      });
    }
  };
  onForeignKey = (ForeignObject, filters, callback) => {
    const element = (
      <ForeignObject
        sizes={{ minHeight: 200, maxHeight: 400, minWidth: 300, maxWidth: 800 }}
        filters={filters}
        keyEvent={this.state.keyEvent}
      />
    );
    this.setState({
      confirmationModal: true,
      modal: { text: element, type: "foreignKey", callback }
    });
    this.keyEvent = false;
  };
  render() {
    let div = (
      <div
        style={{ fontSize: `${this.zoomValue * 100}%`, position: "relative" }}
        className="zebulon-table"
        id={`zebulon-table-${this.props.id}`}
      >
        <Table
          id={this.props.id}
          status={this.state.status}
          data={this.state.data}
          meta={this.state.meta}
          params={this.props.params}
          filters={this.state.filters}
          updatedRows={this.state.updatedRows}
          key={this.props.id}
          visible={this.props.visible === undefined ? true : this.props.visible}
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
          onRowEnter={this.props.onRowEnter}
          onRowQuit={this.props.onRowQuit}
          onTableEnter={this.props.onTableEnter}
          onTableQuit={this.props.onTableQuit}
          onTableClose={this.props.onTableClose}
          onFilter={this.props.onFilter}
          onSort={this.props.onSort}
          onGetData={this.props.onGetData}
          onGetPage={this.props.onGetPage}
          onSave={this.onSave}
          callbacks={this.props.callbacks}
          errorHandler={this.errorHandler}
          navigationKeyHandler={this.props.navigationKeyHandler}
          contextualMenu={this.props.contextualMenu}
          callbackForeignKey={this.props.callbackForeignKey}
          onForeignKey={this.onForeignKey}
          modal={this.state.confirmationModal || this.state.modalCancel}
        />
        <ConfirmationModal
          show={this.state.confirmationModal}
          detail={this.state.modal}
          onConfirm={this.onConfirm}
          keyEvent={this.state.keyEvent}
        />
      </div>
    );

    return div;
  }
}

ZebulonTable.prototype["getState"] = function() {
  return this.state;
};
// export  ZebulonTable;
