import React from "react";
import { utils, constants } from "zebulon-controls";
import { computeData } from "./utils/compute.data";
import { buildPasteArray, getSelection } from "./utils/copy.paste";
import {
  hasParent,
  getUpdatedRows,
  manageRowError,
  rollback,
  getRowStatus,
  setStatus
} from "./utils/utils";
import { TableMenu } from "./Table.menu";
export class TableEvent extends TableMenu {
  // ------------------------------------
  // Navigation
  // ------------------------------------
  closeOpenedWindows = (keepSearch, column) => {
    if (this.state.openedFilter) {
      this.setState({ openedFilter: undefined });
    }
    if (
      this.state.text.top !== undefined &&
      !(column && column.dataType === "text")
    ) {
      this.setState({ text: {} });
    }
    if (this.state.detail.content !== undefined) {
      this.setState({ detail: {} });
    }
    if (this.state.toolTip !== undefined) {
      this.setState({ toolTip: undefined });
    }
    if (!keepSearch && this.state.search !== undefined) {
      this.setState({ search: undefined });
    }
    if (this.props.contextualMenu) {
      this.props.contextualMenu.close();
    }
  };
  fKeyMap = {
    f12: "save",
    f11: "filter",
    f10: "refresh"
  };
  toggleFilter = () => {
    if (this.hasFocus) {
      const element = document.getElementById(
        `filter: ${this.props.id}--${this.state.selectedRange.end.columns}`
      );
      if (element && element.children[0]) {
        element.children[0].focus();
        this.hasFocus = false;
      }
    } else {
      document.activeElement.blur();
      this.hasFocus = true;
      this.setState({ selectedRange: this.state.selectedRange });
    }
  };
  handleKeyDown = e => {
    // a voir
    const keyCode = e.which || e.keyCode;
    const key = utils.keyMap[keyCode];
    if (key === undefined) {
      return;
    }
    const { openedFilter, detail } = this.state;
    const isFilter = hasParent(document.activeElement, "filter");
    if (key === "Escape") {
      if (openedFilter) {
        this.hasFocus = true;
      }
      this.closeOpenedWindows();
    }
    if (key === "Tab" && (openedFilter || detail.content || isFilter)) {
      this.hasFocus = false;
      return false;
    }
    //function Keys
    if (keyCode > 112 && keyCode < 124) {
      const action = this.state.meta.table.actions.find(
        action => action.key === key
      );
      if (action) {
        e.preventDefault();
        this.handleAction(action);
      }
    }
    // ctrl+F
    if (70 === (e.which || e.keyCode) && e.ctrlKey) {
      this.hasFocus = false;
      this.handleSearch(e);
    } else if (
      // can't garantee that the focus in on the selected cell
      key === "Space" &&
      this.hasFocus &&
      this.column.dataType === "boolean" &&
      document.activeElement.id !==
        `cell: zebulon-table-${this.props.id}-${this.row.index_}-${this.column
          .index_}`
    ) {
      e.preventDefault();
      this.onChange({
        row: this.row,
        column: this.column,
        value: { value: !this.row[this.column.id] }
      });
    } else if (utils.isNavigationKey(e)) {
      if (openedFilter) {
        if (key === "Enter") {
          e.preventDefault();
          this.hasFocus = true;
          return this.openedFilter.onOk();
        } else {
          return this.openedFilter.values.handleNavigationKeys(e);
        }
      } else if (isFilter && ["ArrowLeft", "ArrowRight"].includes(key)) {
        return false;
      } else if (this.rows) {
        return this.rows.handleNavigationKeys(e);
      }
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
      cell =>
        this.selectRange_(
          { start: cell, end: cell },
          x => x,
          undefined,
          "enter"
        ),
      this.onChange,
      this.canQuit,
      this.state.filteredData,
      this.state.updatedRows,
      this.state.data,
      this.props.params
    );
  };
  handleSearch = e => {
    e.preventDefault();
    this.setState({ search: true });
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
  onDoubleClick = (e, row, column) => {
    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(row, column);
    } else if (this.doubleClickAction) {
      this.handleAction(this.doubleClickAction, e, row, column);
    }
  };
  onFocus = (e, row, column) => {
    this.closeOpenedWindows(true, column);
  };
  handleAction = (action, e, row, column) => {
    if (action.statusEnable === false || action.enable === false) {
      return false;
    }
    this.closeOpenedWindows();
    const rowIndex = this.state.selectedRange.end.rows;
    // let row = {};
    if (!row && rowIndex !== undefined) {
      row = this.getRow(rowIndex);
    }
    if (
      this.state.selectedRange ||
      !(action.type === "delete" || action.type === "select")
    ) {
      if (action.type === "delete") {
        return this.handleDelete(row);
      } else if (action.type === "insert") {
        return this.handleNew(rowIndex || 0);
      } else if (action.type === "duplicate") {
        return this.handleDuplicate(rowIndex || 0);
      } else if (action.type === "save") {
        return this.props.onSave();
      } else if (action.type === "refresh") {
        this.props.onTableChange("refresh");
      } else {
        if (action.type === "detail" && action.content) {
          this.setState({ detail: action });
        } else if (action.action) {
          const {
            selectedRange,
            updatedRows,
            data,
            meta,
            filters
          } = this.state;
          const f = () =>
            action.actionFunction(
              {
                row: row || this.row,
                column,
                selectedRange,
                updatedRows,
                filters,
                data,
                meta,
                params: this.props.params,
                action: action,
                ref: this
              },
              e
            );
          // if changes save is required
          if (action.onTableChange) {
            this.props.onTableChange(action.onTableChange, ok => {
              if (ok) {
                f();
              }
            });
          } else {
            f();
          }
          this.setState({ status: this.state.status });
        }
      }
    }
  };

  handleDelete = row => {
    const status = getRowStatus(this.state.updatedRows, row);
    if (status.deleted_) {
      status.deleted_ = false;
    } else {
      if (!status.new_) {
        rollback(this.state.updatedRows, row.index_);
      }
      setStatus(status, "deleted_");
    }
    this.setState({ status: this.state.status });
    if (this.props.onRowDelete) {
      const message = {
        row,
        status,
        meta: this.state.meta,
        data: this.state.data,
        params: this.props.params
      };
      this.props.onRowDelete(message);
    }
  };
  newRow = (row, index) => {
    const ok = this.canQuit("new", ok => {
      if (ok) {
        this.newRow_(row, index);
      }
    });
    if (ok) {
      this.newRow_(row, index);
    }
  };

  newRow_ = (row, index) => {
    const {
      selectedRange,
      updatedRows,
      filteredData,
      meta,
      data,
      scroll
    } = this.state;
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
    rows.splice(ix, 0, row);
    if (meta.serverPagination) {
      filteredData.page = rows;
      this.setState({ filteredData });
    } else {
      this.setState({ filteredData: rows });
    }
    if (this.onRowNew(row)) {
      const columns = (meta.visibleIndexes || [0])[0];
      const range = {
        end: { rows: selectedRange.end.rows || 0, columns },
        start: {
          rows: selectedRange.end.rows,
          columns: meta.properties.length - 1
        }
      };
      const rowDirection = Math.sign(
        range.end.rows - (scroll.rows.startIndex || 0)
      );
      const columnDirection = Math.sign(
        range.end.columns - scroll.columns.startIndex
      );
      this.selectRange(range, undefined, row, "enter");
      this.rowUpdated = true;
      this.scrollTo(
        range.end.rows,
        rowDirection,
        range.end.columns,
        columnDirection
      );
    }
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
      if (this.state.meta.table.rowId) {
        row[this.state.meta.table.rowId] = undefined;
      }
      if (this.state.meta.table.primaryKey) {
        row[this.state.meta.table.primaryKey] = null;
      }
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
  scrollTo = (
    rowIndex,
    rowDirection,
    columnIndex,
    columnDirection,
    noFocus,
    dataLength
  ) => {
    // console.log("scroll", rowIndex, noFocus);
    if (this.rows && (rowDirection || columnDirection)) {
      this.rows.scrollOnKey(
        { rows: rowIndex, columns: columnIndex },
        null,
        rowDirection,
        columnDirection,
        false,
        dataLength
      );
    }
    if (noFocus) {
      this.hasFocus = false;
    }
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
    this.closeOpenedWindows(true);
    const range = { ...this.state.selectedRange };
    if (cell) {
      range.end = cell;
      if (!extension) {
        range.start = cell;
      }
      this.selectRange_(range, x => x);
    }
    this.setState({ scroll });
  };
  selectRange = (range, callback, row, type, noFocus, scrollOnClick) => {
    // console.log("selectRange", type, noFocus);
    if (!this.state.status.loadingPage && !this.state.status.loading) {
      const startIndex = range.end.rows,
        stopIndex = range.end.rows;
      if (this.paginationIsRequired({ startIndex, stopIndex })) {
        this.pagination({
          startIndex,
          stopIndex,
          callbackAfter: () =>
            this.selectRange_(
              range,
              callback || (x => x),
              row,
              type,
              noFocus,
              scrollOnClick
            )
        });
      } else {
        this.closeOpenedWindows(true);
        const ok = this.selectRange_(
          range,
          callback || (x => x),
          row,
          type,
          noFocus,
          scrollOnClick
        );
        if (ok !== undefined) {
          if (callback) {
            return callback(ok);
          } else {
            return ok;
          }
        }
      }
    }
  };
  selectRange_ = (range, callback, row, type, noFocus, scrollOnClick) => {
    if (!this.props.isActive && this.props.onActivation) {
      this.props.onActivation(this.props.componentId || this.props.id);
    }
    let { selectedRange, scroll } = this.state;
    const meta = this.state.meta;
    // if (this.state.auditedRow) {
    //   selectedRange = this.state.selectedRangeAudit;
    //   scroll = this.state.scrollAudit;
    // }
    // this.hasFocus = !noFocus && !search;
    this.hasFocus = !noFocus;
    const prevEnd = selectedRange.end;
    const prevStart = selectedRange.start;
    const endChanged =
      prevEnd.rows !== range.end.rows || prevEnd.columns !== range.end.columns;
    const enter = ok => {
      if (!ok) {
        callback(false);
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
          if (scrollOnClick) {
            this.rows.scrollOnKey(
              { rows: range.end.rows, columns: range.end.columns },
              constants.AxisType.ROWS
            );
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
        // if (this.state.auditedRow) {
        //   this.setState({ selectedRangeAudit: range });
        // } else {
        this.setState({ selectedRange: range });
      }
      this.range = range;
      // }
      callback(true);
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
    if (type === "enter") {
      return enter(true);
    }
    return quit();
  };
  // -------------------------------
  //  Cell events
  //  -------------------------------
  onChange = ({ value, row, column }) => {
    this.updated = true;
    this.rowUpdated = true;
    this.tableUpdated = true;
    const { updatedRows, data, meta, dataStrings } = this.state;
    delete dataStrings[row.index_];
    const status = getRowStatus(updatedRows, row);
    if (!status.updated_) {
      setStatus(status, "updated_");
      this.setState({ statusChanged: !this.state.statusChanged });
    }
    console.log("change", status);
    column.items = undefined;
    const message = {
      value,
      previousValue: this.previousValue,
      row,
      status,
      column,
      meta: meta,
      data: data,
      params: this.props.params
    };
    return (
      this.onChange_(message) && this.props.errorHandler(message, "onChange")
    );
  };
  onChange_ = message => {
    const { row, column, value } = message;
    row[column.id] = value.value;
    if (
      !column.foreignObjectFunction &&
      column.onChangeFunction &&
      column.onChangeFunction(message) === false
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
      const id = this.props.id;
      const value = row[column.id];
      if (!column.foreignObjectFunction) {
        return cellQuit(ok_);
      }
      if (utils.isNullValue(value)) {
        if (column.onChangeFunction) {
          column.onChangeFunction({ value: { id: null, cd: null }, row });
        }
        return cellQuit(ok_);
      }
      let element = document.activeElement;
      // let col = column.accessor.replace("row.", "");
      // col = col.replace(column.reference + ".", "");
      const col = column.foreignColumn || "cd";
      const filters = {
        [col]: {
          id: col,
          filterType: "starts",
          v: value
        }
      };
      const callback = (ok, data) => {
        if (!ok) {
          this.noUpdate = true;
          element = document.getElementById(
            `cell: zebulon-table-${id}-${row.index_}-${column.index_}`
          );
          if (element) {
            element = element.children[0];
          }
        } else if (column.onChangeFunction) {
          column.onChangeFunction({ value: data, row });
        } else {
          row[column.reference] = data;
        }
        if (element) {
          this.isOpening = true;
          element.focus();
          this.isOpening = false;
        }
        return cellQuit(ok);
      };
      this.props.onForeignKey(column.foreignObjectFunction, filters, callback);
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
  checkUnicity = (type, key, message) => {
    const keyIndex = message.meta[type][message.row[key.id]];
    const error = keyIndex !== message.row.index_ && keyIndex !== undefined;
    manageRowError(
      message.updatedRows,
      message.row.index_,
      key,
      "duplicate key",
      error ? `${key.caption}: duplicate key.` : null
    );
    if (!error) {
      delete message.meta[type][message.previousRow[key.id]];
      message.meta[type][message.row[key.id]] = message.row.index_;
    }
  };
  onRowQuit_ = (message, callback) => {
    const { meta, updatedRows, row, rowUpdated } = message;
    if (rowUpdated) {
      message.status = updatedRows[row.index_];
      // mandatory data
      meta.properties
        .filter(property => property.mandatory)
        .forEach(property => {
          manageRowError(
            updatedRows,
            row.index_,
            property,
            "mandatory",
            utils.isNullValue(
              property.accessorFunction
                ? property.accessorFunction({ row: message.row })
                : row[property.id]
            ) && !message.status.deleted_
              ? (property.caption || property.id) + ": mandatory data."
              : null
          );
        });
      // duplicate key
      const pk = meta.table.pk;
      const lk = meta.table.lk;
      if (pk && !pk.hidden) {
        this.checkUnicity("indexPk", pk, message);
      }
      if (lk && !lk.hidden) {
        this.checkUnicity("indexLk", lk, message);
      }
      const onRowQuit = this.props.onRowQuit || meta.row.onQuitFunction;
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
      status: getRowStatus(this.state.updatedRows, row),
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
      filteredData: this.state.filteredData,
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
    if (getUpdatedRows(this.state.updatedRows).length) {
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
        return (action === "cellQuit" ? message.callback : rowQuit)(ok);
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
            type: "error",
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
      label = this.state.meta.row.descriptorFunction({ row });
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
    // console.log("onMetaChange", this.state.scroll.rows);
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
