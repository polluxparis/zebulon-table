import React, { Component } from "react";
import { Table } from "./Table";
import "./index.css";
import { utils } from "zebulon-controls";
import {
  computeMeta,
  computeMetaFromData,
  functionsTable,
  getFunction
} from "./utils";

// import { utils.isPromise, isDate } from "./utils/generic";

export class ZebulonTable extends Component {
  constructor(props) {
    super(props);
    let data = props.data,
      status = { loaded: false, loading: true };
    // if data is passed as a dataset array
    // typically for dataset configuration
    // the data prop will mutate
    // else ( if the data prop is a promise or a function or a get function is defined in the meta description)
    // data prop will not mutate but the (updated) dataset will be a parameter of the callbacks
    if (Array.isArray(data)) {
      status = { loaded: true, loading: false };
    }
    this.state = {
      data: data,
      status,
      meta: props.meta,
      updatedRows: props.updatedRows || {},
      sizes: props.sizes,
      keyEvent: props.keyEvent
    };
    this.zoomValue = props.sizes.zoom || 1;
    if (Array.isArray(props.functions)) {
      this.state.functions = props.functions;
    } else {
      this.state.functions = functionsTable(props.functions);
    }
    if (typeof data === "function") {
      data(this.props.params, (data, status) => {
        this.setState({ data, status });
      });
    } else if (utils.isPromise(data)) {
      data
        .then(data => {
          this.init(
            data,
            this.state.meta,
            this.zoomValue,
            this.state.functions
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
    } else if (props.meta && props.meta.table.get) {
      const f = getFunction(
        this.state.functions,
        "dataset",
        "dml",
        props.meta.table.get
      );
      f({
        params: this.props.params,
        callback: (data, status) => {
          this.init(
            data,
            this.state.meta,
            this.zoomValue,
            this.state.functions
          );
          this.setState({ data, status });
        }
      });
    }
    this.errorHandler = this.props.errorHandler || {};
  }
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
  init = (data, meta, zoom, functions) => {
    if (data) {
      data.forEach((row, index) => (row.index_ = index));
      computeMetaFromData(data, meta, zoom, functions);
    }
  };
  componentWillMount() {
    if (utils.isPromise(this.props.data)) {
      this.props.data.then(data => {
        this.init(
          data,
          this.props.meta.properties,
          this.zoomValue,
          this.state.functions
        );
      });
    } else {
      this.init(
        this.props.data,
        this.props.meta,
        this.zoomValue,
        this.state.functions
      );
    }
  }
  componentWillReceiveProps(nextProps) {
    const { data, meta, sizes, keyEvent, updatedRows } = nextProps;
    if (this.state.sizes !== nextProps.sizes) {
      if (sizes.zoom) {
        if (this.zoomValue !== sizes.zoom) {
          this.zoomValue = sizes.zoom;
          computeMeta(meta, this.zoomValue, this.props.functions);
        }
      }
      this.setState({ sizes: { ...sizes, zoom: this.zoomValue } });
    }
    if (this.props.data !== data || this.props.meta !== meta) {
      this.setState({ data, meta });
      this.init(data, meta, this.zoomValue, this.state.functions);
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
