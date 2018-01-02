import React, { Component } from "react";
import { Table } from "./Table";
import "./index.css";
import { utils } from "zebulon-controls";
import { computeMetaFromData, functionsTable } from "./utils";

// import { utils.isPromise, isDate } from "./utils/generic";

export class ZebulonTable extends Component {
  constructor(props) {
    super(props);
    let data = props.data;
    if (
      !Array.isArray(data) &&
      typeof data === "object" &&
      data.from &&
      (props.select || props.meta.table.selectFunction)
    ) {
    }
    this.state = {
      data: data,
      meta: props.meta,
      sizes: props.sizes,
      keyEvent: props.keyEvent
    };

    if (Array.isArray(props.functions)) {
      this.state.functions = props.functions;
    } else {
      this.state.functions = functionsTable(props.functions);
    }
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
  handleKeyEvent = e => {
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
  init = (data, meta) => {
    data.forEach((row, index) => (row.index_ = index));
    computeMetaFromData(data, meta, this.props.functions);
  };
  componentWillMount() {
    if (utils.isPromise(this.props.data)) {
      this.props.data.then(data => {
        this.init(data, this.props.meta.properties);
      });
    } else {
      this.init(this.props.data, this.props.meta);
    }
  }
  componentWillReceiveProps(nextProps) {
    const { data, meta, sizes, keyEvent } = nextProps;
    if (this.state.sizes !== nextProps.sizes) this.setState({ sizes });
    if (this.props.data !== data || this.props.meta !== meta)
      this.init(nextProps.data, nextProps.meta);
    if (this.props.keyEvent !== keyEvent) this.handleKeyEvent(keyEvent);
  }
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
    if (!Array.isArray(this.state.data)) {
      return null;
    }
    let div = (
      <div>
        <Table
          id={this.props.id}
          data={this.state.data}
          meta={this.state.meta}
          key={this.props.id}
          visible={this.props.visible === undefined ? true : this.props.visible}
          width={this.state.sizes.width}
          height={this.state.sizes.height}
          rowHeight={this.state.sizes.rowHeight}
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
