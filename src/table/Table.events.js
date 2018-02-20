import React from "react";
// import ReactDOM from "react-dom";

// import { ZebulonTable } from "../table/ZebulonTable";

import { TableMenu } from "./Table.menu";
import { utils } from "zebulon-controls";
import { computeData } from "./utils/compute.data";
import { buildPasteArray, getSelection } from "./utils/copy.paste";
import {
  manageRowError,
  rollback,
  getRowStatus,
  setStatus
} from "./utils/utils";

export class TableEvent extends TableMenu {
  // ------------------------------------
  // Navigation
  // ------------------------------------
  closeOpenedWindows = () => {
    if (this.state.openedFilter) {
      this.setState({ openedFilter: undefined });
    }
    if (this.state.text.top !== undefined) {
      this.setState({ text: {} });
    }
    if (this.state.detail.content !== undefined) {
      this.setState({ detail: {} });
    }
    if (this.state.toolTip !== undefined) {
      this.setState({ toolTip: undefined });
    }
    this.contextualMenu.close();
  };
  hasParent(element, id) {
    if (!element.parentElement) {
      return false;
    } else if (element.parentElement.id === id) {
      return true;
    } else {
      return this.hasParent(element.parentElement, id);
    }
  }
  handleKeyDown = e => {
    // a voir
    const { openedFilter, detail } = this.state;
    const isFilter = this.hasParent(document.activeElement, "filter");
    if (e.key === "Escape") {
      this.closeOpenedWindows();
    }
    if (openedFilter && e.key === "Tab") {
      return false;
    }
    if (detail.content && e.key === "Tab") {
      return false;
    }
    if (
      !isFilter &&
      this.rows &&
      this.rows.handleNavigationKeys &&
      utils.isNavigationKey(e)
    ) {
      if (openedFilter) {
        this.setState({ openedFilter: undefined });
      }
      return this.rows.handleNavigationKeys(e);
    }
  };
  handleCopy = e => {
    utils.copy(
      getSelection(
        "xls",
        this.state.selectedRange,
        this.state.meta.properties,
        this.state.filteredData,
        this.state.updatedRows,
        this.state.data,
        this.props.params
      )
    );
  };
  handlePaste = e => {
    return buildPasteArray(
      "xls",
      e.clipboardData.getData("text"),
      this.state.meta.properties,
      this.state.selectedRange.end,
      cell => this.selectRange_({ start: cell, end: cell }),
      this.onChange,
      this.state.filteredData,
      this.state.updatedRows,
      this.state.data,
      this.props.params
    );
  };
  //-----------------------------------------
  // buttons and actions management
  //-----------------------------------------
  getDetail = ({
    Detail,
    row,
    data,
    meta,
    status,
    params,
    top,
    onClose,
    onChange
  }) => {
    return (
      <Detail
        row={row}
        data={data}
        meta={meta}
        params={params}
        status={status}
        onChange={onChange}
        close={onClose}
        top={top}
      />
    );
  };
  handleClickButton = (index, e) => {
    this.closeOpenedWindows();
    const button = this.state.meta.table.actions[index];
    const rowIndex = this.state.selectedRange.end.rows;
    let row = {};
    if (rowIndex !== undefined) {
      row = this.getRow(rowIndex);
    }
    if (
      this.state.selectedRange ||
      !(button.type === "delete" || button.type === "select")
    ) {
      if (button.type === "delete") {
        return this.handleDelete(row);
      } else if (button.type === "insert") {
        return this.handleNew(rowIndex || 0);
      } else if (button.type === "duplicate") {
        return this.handleDuplicate(rowIndex || 0);
      } else if (button.type === "save") {
        return this.props.onSave();
      } else if (button.type === "detail" && button.content) {
        this.setState({ detail: button });
      } else {
        return this.handleAction(button, e);
      }
    }
  };
  handleAction = (button, e) => {
    if (button.action) {
      const { selectedRange, updatedRows, data, meta } = this.state;
      button.actionFunction({
        row: this.row,
        selectedRange,
        updatedRows,
        data,
        meta,
        params: this.props.params,
        action: button,
        ...(e || {})
      });
      this.setState({ status: this.state.status });
    }
  };

  handleDelete = row => {
    const status = getRowStatus(this.state.updatedRows, row);
    if (status.deleted_) {
      status.deleted_ = false;
    } else {
      setStatus(status, "deleted_");
      rollback(status);
    }
    this.setState({ status: this.state.status });
  };
  newRow = (row, index) => {
    const { selectedRange, updatedRows, filteredData, meta, data } = this.state;
    if (this.selectRange(selectedRange, this.row, "quit") === false)
      return false;

    const status = {
      new_: true,
      errors: {},
      rowUpdated: row,
      timeStamp: new Date().getTime()
    };
    let rows = filteredData,
      ix = index;
    updatedRows[this.getDataLength()] = status;
    if (!meta.serverPagination) {
      rows = filteredData;
      data.push(row);
    } else {
      rows = filteredData.page;
      ix = index - filteredData.pageStartIndex;
      filteredData.pageLength++;
      filteredData.filteredDataLength++;
      filteredData.dataLength++;
    }
    rows = rows
      .slice(0, ix)
      .concat(row)
      .concat(rows.slice(ix));
    if (meta.serverPagination) {
      filteredData.page = rows;
      this.setState({ filteredData });
    } else {
      this.setState({ filteredData: rows });
    }
    if (this.onRowNew(row)) {
      this.selectRange(
        {
          end: { rows: selectedRange.end.rows || 0, columns: 0 },
          start: {
            rows: selectedRange.end.rows,
            columns: meta.properties.length - 1
          }
        },
        row,
        "enter"
      );
    }
    this.rowUpdated = true;
  };
  handleNew = index => {
    const row = { index_: this.getDataLength() };
    //  default values
    this.state.meta.properties.filter(column => column.defaultFunction).forEach(
      column =>
        (row[column.id] = column.defaultFunction({
          column,
          row,
          params: this.props.params
        }))
    );
    this.newRow(row, index);
  };
  handleDuplicate = index => {
    if (this.row) {
      const row = { ...this.row, index_: this.getDataLength() };
      this.newRow(row, index);
    }
  };
  // ------------------------------------------------------
  // selection and validations
  // ------------------------------------------------------
  pagination = ({
    startIndex,
    stopIndex,
    callbackBefore,
    callbackAfter,
    filters,
    sorts
  }) => {
    const { updatedRows, filteredData, meta } = this.state;
    this.setState({
      status: { loaded: false, loading: false, loadingPage: true }
    });
    this.state
      .data({
        startIndex,
        stopIndex,
        filters,
        sorts,
        updatedRows
      })
      .then(data => {
        if (callbackBefore) {
          callbackBefore(data);
        }
        filteredData.page = data.page;
        filteredData.pageLength = data.pageLength;
        filteredData.filteredDataLength = data.filteredDataLength;
        filteredData.pageStartIndex = data.pageStartIndex;
        computeData(data.page, meta, 0);
        if (this.props.onGetPage) {
          this.props.onGetPage(data);
        }
        // console.log("page", startIndex, stopIndex, filteredData);
        if (callbackAfter) {
          callbackAfter(data);
        }
        this.setState({
          filteredDataLength: filteredData.filteredDataLength,
          status: { loaded: true, loading: false, loadingPage: false }
        });
      });
  };
  getDataLength = () =>
    this.state.meta.serverPagination
      ? this.state.filteredData.dataLength
      : this.state.data.length;
  getFilteredDataLength = () =>
    this.state.meta.serverPagination
      ? this.state.filteredData.filteredDataLength
      : this.state.filteredData.length;
  getRow = index => {
    const rows = this.state.filteredData;
    if (this.state.meta.serverPagination) {
      return rows.page[index - rows.pageStartIndex] || { index_: undefined };
    } else {
      return rows[index] || { index_: undefined };
    }
  };
  isInPage = scroll => {
    return (
      !this.state.meta.serverPagination ||
      (scroll.startIndex >= this.state.filteredData.pageStartIndex &&
        scroll.startIndex + Math.ceil(this.rowsHeight / this.rowHeight) - 1 <
          this.state.filteredData.pageStartIndex +
            this.state.filteredData.pageLength)
    );
  };
  paginationIsRequired = ({ startIndex, stopIndex }) => {
    return (
      this.state.meta.serverPagination &&
      (startIndex < this.state.filteredData.pageStartIndex ||
        stopIndex >=
          this.state.filteredData.pageStartIndex +
            this.state.filteredData.pageLength)
    );
  };
  onScroll = (scroll, cell, extention) => {
    const startIndex = scroll.rows.startIndex;
    const stopIndex =
      startIndex + Math.ceil(this.rowsHeight / this.rowHeight) - 1;
    if (this.paginationIsRequired({ startIndex, stopIndex })) {
      this.pagination({
        startIndex,
        stopIndex,
        callbackAfter: () => this.onScroll_(scroll, cell, extention)
      });
    } else {
      this.onScroll_(scroll, cell, extention);
    }
  };
  onScroll_ = (scroll, cell, extension) => {
    this.closeOpenedWindows();
    if (cell) {
      const range = { ...this.state.selectedRange };
      range.end = cell;
      if (!extension) {
        range.start = cell;
      }
      this.selectRange_(range);
    }
    this.setState({ scroll });
  };
  selectRange = (range, row, type, noFocus) => {
    if (!this.state.status.loadingPage) {
      const startIndex = range.end.rows,
        stopIndex = range.end.rows;
      if (this.paginationIsRequired({ startIndex, stopIndex })) {
        this.pagination({
          startIndex,
          stopIndex,
          callbackAfter: () => this.selectRange_(range, row, type, noFocus)
        });
      } else {
        this.selectRange_(range, row, type, noFocus);
      }
    }
  };
  selectRange_ = (range, row, type, noFocus, callback) => {
    if (!this.props.isActive && this.props.onActivation) {
      this.props.onActivation();
    }
    const { updatedRows, selectedRange, meta } = this.state;
    // avoid focus on cell when changing filters (set to false on changed filter ok)
    this.hasFocus = !noFocus;
    if (range.end.rows > this.getDataLength() - 1) {
      range.end = {};
      range.start = {};
      this.hasFocus = false;
    }
    let ok = true;
    const prevEnd = selectedRange.end;
    const prevStart = selectedRange.start;
    const endChanged =
      prevEnd.rows !== range.end.rows || prevEnd.columns !== range.end.columns;
    const enter = ok => {
      if (!ok) {
        return false;
      }
      if (endChanged || type) {
        if (prevEnd.rows !== range.end.rows || type === "enter") {
          this.rowUpdated = false;
          if (range.end.rows !== undefined) {
            this.row = row || this.getRow(range.end.rows);
            this.previousRow = { ...this.row };
          } else {
            this.row = undefined;
            this.previousRow = undefined;
          }
        }
        this.updated = false;
        if (range.end.rows !== undefined) {
          this.column = meta.properties[range.end.columns];
          this.previousValue = this.row[this.column.id];
          if (prevEnd.rows !== range.end.rows || type === "enter") {
            this.onRowEnter(this.row);
          }
          this.onCellEnter(this.previousValue, this.row, this.column);
          if (meta.properties[range.end.columns].dataType === "text") {
            this.handleText(range.end, this.row, this.column);
          }
        } else {
          this.column = undefined;
          this.previousValue = undefined;
        }
      }
      if (
        endChanged ||
        prevStart.rows !== range.start.rows ||
        prevStart.columns !== range.start.columns
      ) {
        this.setState({ selectedRange: range });
        this.range = range;
      }
      return true;
    };
    const quit = () => {
      const action =
        prevEnd.rows !== range.end.rows || row ? "rowQuit" : "cellQuit";
      const ok = this.canQuit(action, enter);
      if (ok !== undefined) {
        return enter(ok);
      }
    };
    this.closeOpenedWindows();
    return quit();
  };
  // -------------------------------
  //  Cell events
  //  -------------------------------
  onChange = (value, row, column) => {
    this.updated = true;
    this.rowUpdated = true;
    this.tableUpdated = true;
    const status = getRowStatus(this.state.updatedRows, row);
    setStatus(status, "updated_");
    const message = {
      value,
      previousValue: this.previousValue,
      row,
      status,
      column,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    return (
      this.onChange_(message) && this.props.errorHandler(message, "onChange")
    );
  };
  onChange_ = message => {
    if (
      message.column.onChangeFunction &&
      message.column.onChangeFunction(message) === false
    ) {
      return false;
    }
    if (this.props.onChange) {
      if (this.props.onChange(message) === false) {
        return false;
      }
    }
    return true;
  };
  onCellQuit = message => this.onCellQuit_(message, message.callback);
  onCellQuit_ = (message, callback) => {
    const cellQuit = ok_ => {
      message.status = this.state.updatedRows[message.row.index_];
      const onCellQuit = this.props.onCellQuit || message.column.onQuitFunction;
      let ok = onCellQuit && ok_ ? onCellQuit(message) : ok_;
      ok = ok && this.props.errorHandler(message, "onCellQuit");
      if (ok !== undefined && callback) {
        return callback(ok);
      }
      return ok;
    };
    const foreignObjectQuit = ok_ => {
      const { column, row } = message;
      const value = row[column.id];
      if (!(column.reference && column.foreignObject)) {
        return cellQuit(ok_);
      }
      if (utils.isNullValue(value)) {
        row[column.reference] = undefined;
        return cellQuit(ok_);
      }

      const element = document.activeElement;
      const col = column.accessor.replace(column.reference + ".", "");
      const filters = {
        [col]: { id: col, filterType: "startsNoCase", v: value }
      };
      const callback = data => {
        if (data === false) {
          element.focus();
        } else {
          if (column.setForeignKeyAccessorFunction) {
            column.setForeignKeyAccessorFunction({
              value: column.primaryKeyAccessorFunction({
                row: data
              }),
              row
            });
          }
          row[column.reference] = data;
        }
        return cellQuit(data);
      };
      this.props.onForeignKey(column.foreignObject, filters, callback);
      return;
    };
    if (!message.row || !message.updated) {
      return true;
    }
    return foreignObjectQuit(true);
  };
  onCellEnter = (value, row, column) => {
    const status = this.state.updatedRows[row.index_];
    const message = {
      value,
      row,
      status,
      column,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    if (this.props.onCellEnter) this.props.onCellEnter(message);
  };
  // -------------------------------
  //  row events
  //  -------------------------------
  onRowQuit = message => this.onRowQuit_(message, message.callback);
  onRowQuit_ = (message, callback) => {
    if (message.rowUpdated) {
      message.status = this.state.updatedRows[message.row.index_];
      this.state.meta.properties
        .filter(property => property.mandatory)
        .forEach(property => {
          // mandatory data
          manageRowError(
            message.updatedRows,
            message.row.index_,
            property.id,
            "mandatory",
            utils.isNullValue(message.row[property.id]) &&
            !message.status.deleted_
              ? (property.caption || property.id) + ": mandatory data."
              : null
          );
        });
      const onRowQuit =
        this.props.onRowQuit || this.state.meta.row.onQuitFunction;
      let ok = onRowQuit ? onRowQuit(message) : true;
      ok = ok && this.props.errorHandler(message, "onRowQuit", callback);

      if (ok !== undefined && callback) {
        return callback(ok);
      }
      return ok;
    }
    return true;
  };
  onRowEnter = row => {
    const message = {
      row,
      status: this.state.updatedRows[row.index_],
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    if (this.props.onRowEnter) {
      this.props.onRowEnter(message);
    }
  };
  onRowNew = row => {
    const message = {
      row,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    if (this.props.onRowNew)
      if (this.props.onRowNew(message) === false) return false;
    return true;
  };
  // -------------------------------
  //  Table  events
  //  -------------------------------
  // onTableQuit_ = (message, callback) => {
  //   if (message.tableUpdated) {
  //     const onTableQuit =
  //       this.props.onTableQuit || this.state.meta.table.onQuitFunction;
  //     let ok = onRowQuit ? onRowQuit(message) : true;
  //     ok = ok && this.props.errorHandler(message, "onRowQuit", callback);

  //     if (ok !== undefined && callback) {
  //       return callback(ok);
  //     }
  //     return ok;
  //   }
  //   return true;
  // };
  onTableEnter = () => {
    const message = {
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    this.tableUpdated = false;
    this.rowUpdated = false;
    this.updated = false;
    if (this.props.onTableEnter) {
      this.props.onTableEnter(message);
    }
  };
  beforeTableClose = () => {
    const message = {
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    if (this.props.beforeTableClose) {
      this.props.beforeTableClose(message);
    }
  };
  onTableClose = () => {
    const message = {
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    if (Object.keys(this.state.updatedRows || {}).length) {
      this.setState({ confirmationModal: true });
      return false;
    } else {
      if (this.props.onTableClose) {
        this.props.onTableClose(message);
      }
    }
  };

  // ---------------------------------------------------------
  // successive checks and validations
  // with callbacks to manage users interraction
  // and asynchronous processes
  // ---------------------------------------------------------
  buildMessage = callback => {
    const message = {
      updated: this.updated,
      rowUpdated: this.rowUpdated,
      tableUpdated: this.tableUpdated,
      previousValue: this.previousValue,
      row: this.row,
      previousRow: this.previousRow,
      column: this.column,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params,
      updatedRows: this.state.updatedRows,
      callback
    };
    return message;
  };
  canQuit = (action, callback) => {
    const message = this.buildMessage(callback || (() => {}));
    const rowQuit = ok_ => {
      const callback = ok => {
        if (ok) {
          this.rowUpdated = false;
        }
        message.callback(ok);
      };
      const ok = ok_ && this.onRowQuit_(message, callback);
      if (ok !== undefined) {
        return callback(ok);
      }
    };

    const cellQuit = ok_ => {
      let ok = true;
      const callback = ok => {
        if (ok) {
          this.updated = false;
        }
        (action === "cellQuit" ? message.callback : rowQuit)(ok);
      };
      // if (!utils.isNullValue(this.range.end.rows)) {
      ok = ok_ && this.onCellQuit_(message, callback);
      if (ok !== undefined) {
        return callback(ok);
      }
    };
    return cellQuit(true);
  };

  handleErrors = (e, rowIndex, errors) => {
    if (errors.length || this.state.toolTip) {
      const toolTip = errors.length
        ? {
            top:
              e.target.offsetParent.offsetTop +
              rowIndex * this.rowHeight +
              this.state.scroll.rows.shift,
            left: this.rowHeight,
            rowIndex,
            content: errors
          }
        : null;
      this.setState({ toolTip });
    }
  };
  //-------------------------------------------
  // end events
  // ------------------------------------------
  handleText = (cell, row, column) => {
    let label;
    if (this.state.meta.row.descriptorFunction)
      label = this.state.meta.row.descriptorFunction(row);
    const text = {
      top:
        (3 + cell.rows - this.state.scroll.rows.startIndex) * this.rowHeight +
        this.state.scroll.rows.shift,
      left:
        column.position + this.rowHeight - this.state.scroll.columns.position,
      v: (column.accessorFunction || (({ row }) => row[column.id]))({ row }),
      label,
      editable: column.editable,
      row,
      column
    };
    this.setState({ text });
  };
  handleTextChange = e => {
    const { row, column } = this.state.text;
    this.setState({ text: { ...this.state.text, v: e.target.value } });
    this.onChange(e.target.value, row, column);
  };
  onMetaChange = resetScroll => {
    const bReset = false;
    this.setState({
      scroll: {
        rows: this.state.scroll.rows,
        columns:
          resetScroll || bReset
            ? {
                index: 0,
                direction: 1,
                startIndex: 0,
                shift: 0,
                position: 0
              }
            : this.state.scroll.columns
      }
    });
  };
}
