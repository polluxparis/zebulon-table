import React, { Component } from "react";
import { icons, utils } from "zebulon-controls";
import {
  computeRowSearch,
  rowSearch,
  cellSearch,
  getRegExp
} from "./utils/compute.data";
export class Search extends Component {
  constructor(props) {
    super(props);
    const {
      filteredData,
      meta,
      dataStrings,
      rowStartIndex,
      rowStopIndex
    } = props;
    const properties = meta.properties.filter(property => !property.hidden);
    this.state = {
      dataStrings: computeRowSearch(filteredData, properties, dataStrings),
      value: "",
      properties,
      cell: {},
      rowStartIndex,
      rowStopIndex
    };
  }
  handleClickNext = direction => {
    const { cell, value, rowIndexes, indexRowIndex, properties } = this.state;
    const exp = getRegExp(value);
    const cell_ = { ...cell };
    let index = indexRowIndex;
    cell_.columns = cellSearch(
      this.props.filteredData[cell_.rows],
      properties,
      exp,
      cell_.columns + direction,
      direction
    );
    if (
      cell_.columns === null &&
      ((direction === 1 && index < rowIndexes.length - 1) ||
        (direction === -1 && index !== 0))
    ) {
      index += direction;
      cell_.rows = rowIndexes[index];
      cell_.columns = cellSearch(
        this.props.filteredData[cell_.rows],
        properties,
        exp,
        direction === -1 ? properties.length - 1 : 0,
        direction
      );
    }
    if (cell_.columns !== null) {
      const cellRange = { ...cell_, columns: properties[cell_.columns].index_ };
      this.props.scrollTo(
        cellRange.rows,
        Math.sign(cellRange.rows - (this.state.cell.rows || 0)),
        cellRange.columns,
        Math.sign(cellRange.columns - (this.props.selectedCell.columns || 0))
      );
      this.setState({ cell: cell_, indexRowIndex: index });
    }
  };
  handleChange = e => {
    const value = e.target.value;
    const exp = getRegExp(value);
    const cell = { rows: undefined, columns: undefined };
    let ix = -1;
    if (!utils.isNullValue(value && value !== this.state.value)) {
      const { rowStartIndex, rowStopIndex, filteredData } = this.props;
      const rows = this.state.dataStrings;
      const rowIndexes = rowSearch(rows, exp);
      this.setState({ value, rowIndexes });
      if (rowIndexes.length) {
        ix = rowIndexes.findIndex(
          index => index >= rowStartIndex && index <= rowStopIndex
        );
        if (ix === -1) {
          if (rowIndexes[rowIndexes.length - 1] > rowStopIndex) {
            ix = rowIndexes.findIndex(index => index > rowStopIndex);
          } else {
            ix = rowIndexes.length - 1;
          }
        }
        cell.rows = rowIndexes[ix];
        const row = filteredData[cell.rows];
        cell.columns = cellSearch(row, this.state.properties, exp);
        const cellRange = {
          ...cell,
          columns: this.state.properties[cell.columns].index_
        };
        this.props.scrollTo(
          cellRange.rows,
          Math.sign(cellRange.rows - (this.props.selectedCell.rows || 0)),
          cellRange.columns,
          Math.sign(cellRange.columns - (this.props.selectedCell.columns || 0)),
          true
        );
      }
      this.setState({ value, rowIndexes, cell, indexRowIndex: ix });
    } else {
      this.setState({ value, rowIndexes: [], cell, indexRowIndex: -1 });
    }
    this.input.focus();
  };
  render() {
    return (
      <div style={{ display: "flex" }}>
        <input
          style={{ width: 200 }}
          onChange={e => this.handleChange(e)}
          value={this.state.value}
          autoFocus={true}
          ref={ref => (this.input = ref)}
        />
        <div
          style={{
            background: icons.downArrow,
            backgroundSize: "cover",
            height: "1em",
            width: "1em",
            marginTop: "0.1em",
            marginRight: "0.1em"
          }}
          onClick={() => this.handleClickNext(1)}
        />
        <div
          style={{
            background: icons.upArrow,
            backgroundSize: "cover",
            height: "1em",
            width: "1em",
            marginTop: "0.4em",
            marginRight: "0.1em",
            zoom: 0.7
          }}
          onClick={() => this.handleClickNext(-1)}
        />
        <div
          style={{
            background: icons.close,
            backgroundSize: "cover",
            height: "1em",
            width: "1em",
            marginTop: "0.7em",
            zoom: 0.5,
            marginRight: "0.1em",
            marginLeft: ".6em"
          }}
          onClick={this.props.onClose}
        />
      </div>
    );
  }
}
