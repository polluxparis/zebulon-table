import React, { Component } from "react";
import { Table } from "./Table";
import "./index.css";
import { utils } from "zebulon-controls";

import {
  computeMeta,
  computeMetaFromData,
  functionsTable,
  getFunction,
  filterFunction,
  getFilters
} from "./utils";

// import { utils.isPromise, isDate } from "./utils/generic";

export class ZebulonTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // data: daa,
      meta: props.meta,
      updatedRows: props.updatedRows || {},
      sizes: props.sizes,
      keyEvent: props.keyEvent
    };
    this.zoomValue = props.sizes.zoom || 1;
    // functions
    if (Array.isArray(props.functions)) {
      this.state.functions = props.functions;
    } else {
      this.state.functions = functionsTable(props.functions);
    }
    const { data, status, filters } = this.getData(props);
    this.state.data = data;
    this.state.status = status;
    this.state.filters = filters;
    this.errorHandler = this.props.errorHandler || {};
  }
  getFilters = (filters, columns) => {
    columns.forEach(column => {
      if (filters[column.id]) {
        column.filterType = filters[column.id].filterType;
        column.v = filters[column.id].v;
        column.vTo = filters[column.id].vTo;
        // filterFunction(column, params, data);
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
  getData = props => {
    let { data, meta, params, filters } = props,
      status = { loaded: false, loading: true };
    if (Array.isArray(data)) {
      this.initData(
        data,
        meta,
        this.zoomValue,
        this.state.functions,
        0,
        filters
      );
      status = { loaded: true, loading: false };
    } else {
      if (typeof data === "function") {
        this.select = data;
        data = data({ params, filters: getFilters(meta.properties, filters) });
      } else if (meta && meta.table.select) {
        data = getFunction(
          this.state.functions,
          meta.table.object || "dataset",
          "dml",
          meta.table.select
        );
        this.select = data;
        data = data({ params, filters: getFilters(meta.properties, filters) });
      }
      if (Array.isArray(data)) {
        this.initData(
          data,
          meta,
          this.zoomValue,
          this.state.functions,
          0,
          filters
        );
        status = { loaded: true, loading: false };
      } else if (utils.isPromise(data)) {
        this.resolvePromise(data);
      } else if (utils.isObservable(data)) {
        this.subscribeObservable(data);
        data = [];
      }
    }
    return { data, status, filters };
  };
  initData = (data, meta, zoom, functions, startIndex, filters) => {
    if (data) {
      data.forEach((row, index) => (row.index_ = index + (startIndex || 0)));
      if (meta.properties.length === 0) {
        computeMetaFromData(data, meta, zoom, functions);
      }
    }
    if (filters && meta.properties.length !== 0) {
      this.getFilters(filters, meta.properties);
    }
  };
  resolvePromise = data => {
    data
      .then(data => {
        this.initData(
          data,
          this.state.meta,
          this.zoomValue,
          this.state.functions,
          0,
          this.state.filters
        );
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
        console.log("observable", x.length);
        this.setState({
          data: this.state.data.concat(x),
          status: { loaded: true, loading: false }
        });
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

  // componentWillMount() {
  //   if (this.props.filters) {
  //     const { meta, params, data, filters } = this.state;
  //     this.setState({
  //       filters: this.getFilters(
  //         this.props.filters,
  //         meta.properties,
  //         params,
  //         data,
  //         0,
  //         filters
  //       )
  //     });
  //   }
  // }
  componentWillReceiveProps(nextProps) {
    const { data, meta, sizes, keyEvent, updatedRows, filters } = nextProps;
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
      this.props.filters !== filters
    ) {
      this.setState(this.getData(nextProps));
    }
    if (updatedRows && this.props.updatedRows !== updatedRows) {
      this.setState({ updatedRows });
    }
    if (this.props.keyEvent !== keyEvent) {
      this.handleKeyEvent(keyEvent);
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return this.props.keyEvent === nextProps.keyEvent;
  }
  handleKeyEvent = e => {
    const zoom = utils.isZoom(e);
    if (zoom) {
      e.preventDefault();
      this.zoomValue *= zoom === 1 ? 1.1 : 1 / 1.1;
      this.setState({ ...this.props.sizes, zoom: this.zoomValue });
      computeMeta(this.state.meta, this.zoomValue, this.state.functions);
      return;
    }
    if (!this.table) return;
    else if (e.type === "copy") this.handleCopy(e);
    else if (e.type === "paste") this.handlepaste(e);
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

  // comunication with server
  select = ({ from, columns, where }) => {
    if (this.props.select) return this.props.select(from, columns, where);
  };
  save = (data, updatedRows, params) => {
    let ok = true,
      updatedData = Object.keys(updatedRows).map(index => ({
        ...updatedRows[index],
        initialRow: updatedRows[index].row,
        row: data[index]
      }));
    if (this.props.check) ok = this.props.check(updatedData, params);
    if (ok && this.props.save) this.props.save(updatedData, params);
    else {
      if (ok && this.props.delete) {
        const deletedData = updatedData.filter(row => row.deleted_);
        ok = this.props.delete(deletedData, params);
      }
      if (ok && this.props.insert) {
        const insertedData = updatedData.filter(
          row => row.inserted_ && !row.deleted_
        );
        ok = this.props.insert(insertedData, params);
      }
      if (ok && this.props.update) {
        updatedData = updatedData.filter(
          row => row.updated_ && !row.inserted_ && !row.deleted_
        );
        ok = this.props.update(updatedData, params);
      }
    }
    return ok;
  };

  render() {
    // this.id = `table-${this.props.id || 0}`;
    // if (!Array.isArray(this.state.data)) {
    //   return null;
    // }
    let div = (
      <div>
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
          callbacks={this.props.callbacks}
          errorHandler={this.errorHandler}
          navigationKeyHandler={this.props.navigationKeyHandler}
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
