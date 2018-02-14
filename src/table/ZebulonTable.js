import React, { Component } from "react";
import { Table } from "./Table";
import "./index.css";
import { utils } from "zebulon-controls";

import {
  computeMeta,
  computeMetaFromData,
  functionsTable,
  getFunction
} from "./utils/compute.meta";
import { computeData } from "./utils/compute.data";
import { getFilters, getSorts } from "./utils/filters.sorts";
import { ConfirmationModal, rollbackAll } from "./utils/utils";
// import { utils.isPromise, isDate } from "./utils/generic";

export class ZebulonTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      meta: props.meta,
      updatedRows: props.updatedRows || {},
      sizes: props.sizes,
      keyEvent: props.keyEvent,
      confirmationModal: false
    };
    this.zoomValue = props.sizes.zoom || 1;
    this.keyEvent = false;
    // functions
    if (Array.isArray(props.functions)) {
      this.state.functions = props.functions;
    } else {
      this.state.functions = functionsTable(props.functions);
    }
    this.sorts = props.sorts;
    const { data, status, filters } = this.getData(props);
    this.state.data = data;
    this.state.status = status;
    this.state.filters = filters;
    this.closeAnswer = ok => {
      this.setState({ closeAnswer: null });
      if (this.props.closeAnswer) {
        this.props.closeAnswer(ok);
      }
      return ok;
    };
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
        filters: getFilters(meta.properties, filters),
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
        filters: getFilters(meta.properties, filters),
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
        // console.log("observable", x.length);
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
      closeRequired
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
    if (closeRequired) {
      if (Object.keys(this.state.updatedRows).length) {
        this.setState({ confirmationModal: true });
      } else {
        this.closeAnswer(true);
      }
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (this.keyEvent) {
      this.keyEvent = false;
      return false;
    }
    return true;
  }
  handleKeyEvent = e => {
    const zoom = utils.isZoom(e);
    if (zoom && (this.props.isActive === undefined || this.props.isActive)) {
      e.preventDefault();
      this.zoomValue *= zoom === 1 ? 1.1 : 1 / 1.1;
      this.setState({ sizes: { ...this.props.sizes, zoom: this.zoomValue } });
      computeMeta(this.state.meta, this.zoomValue, this.state.functions);
      return;
    }
    this.keyEvent = true;
    if (!this.table) return;
    else if (e.type === "copy") this.handleCopy(e);
    else if (e.type === "paste") this.handlePaste(e);
    else if (e.type === "keydown") this.handleKeyDown(e);
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
  // select = ({ from, columns, where }) => {
  //   if (this.props.select) return this.props.select(from, columns, where);
  // };
  // save = (data, updatedRows, params) => {
  //   let ok = true,
  //     updatedData = Object.keys(updatedRows).map(index => ({
  //       ...updatedRows[index],
  //       initialRow: updatedRows[index].row,
  //       row: data[index]
  //     }));
  //   if (this.props.check) {
  //     ok = this.props.check(updatedData, params);
  //   }
  //   if (ok && this.props.save) {
  //     this.props.save(updatedData, params);
  //   } else {
  //     if (ok && this.props.delete) {
  //       const deletedData = updatedData.filter(row => row.deleted_);
  //       ok = this.props.delete(deletedData, params);
  //     }
  //     if (ok && this.props.insert) {
  //       const insertedData = updatedData.filter(
  //         row => row.inserted_ && !row.deleted_
  //       );
  //       ok = this.props.insert(insertedData, params);
  //     }
  //     if (ok && this.props.update) {
  //       updatedData = updatedData.filter(
  //         row => row.updated_ && !row.inserted_ && !row.deleted_
  //       );
  //       ok = this.props.update(updatedData, params);
  //     }
  //   }
  //   return ok;
  // };
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
    if (
      (message.updatedRows || {}).nErrors &&
      this.props.errorHandler &&
      this.props.errorHandler.onSave &&
      !this.props.errorHandler.onSave(message)
    ) {
      return this.closeAnswer(false);
    }
    const onSave = this.props.onSave || this.state.meta.table.onSaveFunction;
    message.callback = this.onSaveAfter;
    if (onSave) {
      const ok = onSave(message);
      if (ok === false) {
        return this.closeAnswer(false);
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
    const onSaveAfter =
      this.props.onSaveAfter || this.state.meta.table.onSaveAfterFunction;
    if (onSaveAfter && onSaveAfter(message) === false) {
      return this.closeAnswer(false);
    }
    this.setState({ updatedRows: {} });
    return this.closeAnswer(true);
  };
  // confirmation modal management for external close
  onYes = () => {
    this.setState({ confirmationModal: false, closeAnswer: true });
    this.onSave();
  };
  onNo = () => {
    rollbackAll(this.state.updatedRows, this.state.data);
    this.setState({
      confirmationModal: false,
      closeAnswer: null,
      updatedRows: {}
    });
    this.closeAnswer(true);
  };
  onCancel = () => {
    this.setState({ confirmationModal: false, closeAnswer: false });
    this.closeAnswer(false);
  };

  render() {
    let div = (
      <div
        style={{ fontSize: `${this.zoomValue * 100}%`, position: "relative" }}
        className="zebulon-table"
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
          ref={ref => (this.table = ref)}
          getActions={this.props.getActions}
          onChange={this.props.onChange}
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
          // onSaveBefore={this.props.onSaveBefore}
          // onSaveAfter={this.props.onSaveAfter}
          callbacks={this.props.callbacks}
          errorHandler={this.props.errorHandler || {}}
          navigationKeyHandler={this.props.navigationKeyHandler}
          contextualMenu={this.props.contextualMenu}
        />{" "}
        <ConfirmationModal
          show={this.state.confirmationModal}
          children="Do you want to save before closing the table?"
          onYes={this.onYes}
          onNo={this.onNo}
          onCancel={this.onCancel}
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
