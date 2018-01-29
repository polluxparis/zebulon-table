import React, { Component } from "react";
import { Headers, Status } from "./TableHeaders";
import { Rows } from "./Rows";
import { utils, Filter } from "zebulon-controls";
import { getSelection, buildPasteArray } from "./utils";

// import { Filter } from "./controls-o/Filter";
import {
  manageRowError,
  filtersFunction,
  getSorts,
  sortsFunction
} from "./utils";

// import { utils } from "zebulon-controls";
export class Table extends Component {
  constructor(props) {
    super(props);

    let filteredData = this.filters(props.data, props.filters);
    let status = props.status;
    if (props.meta.serverPagination && status.loaded) {
      status = { loaded: false, loading: true };
      props.data({ startIndex: 0 }).then(filteredData => {
        this.setState({
          filteredData,
          filteredDataLength: filteredData.filteredDataLength,
          status: { loaded: true, loading: false }
        });
        // this.indexPage = filteredData.pageStartIndex;
      });
    }
    this.sorts(filteredData, props.meta.properties);
    this.state = {
      data: props.data,
      filteredData,
      meta: props.meta,
      filters: props.filters || {},
      status,
      updatedRows: props.updatedRows,
      scroll: {
        rows: {
          index: 0,
          direction: 1,
          startIndex: 0,
          shift: 0,
          position: 0
        },
        columns: {
          index: 0,
          direction: 1,
          startIndex: 0,
          shift: 0,
          position: 0
        }
      },
      selectedRange: { start: {}, end: {} },
      detail: {},
      text: {}
    };

    this.rowHeight = this.props.rowHeight;
    this.range = { start: {}, end: {} };
    this.onTableEnter();
    // this.filtersOut = props.filters;
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.data !== this.props.data ||
      nextProps.meta !== this.props.meta ||
      nextProps.status !== this.props.status ||
      nextProps.updatedRows !== this.props.updatedRows
    ) {
      // const filteredData = this.filters(nextProps.data, nextProps.filters);
      let filteredData = [];
      let status = nextProps.status;
      if (nextProps.meta.serverPagination) {
        if (status.loaded && !this.props.status.loaded) {
          status = { loaded: false, loading: true };
          nextProps.data({ startIndex: 0 }).then(filteredData => {
            this.setState({
              filteredData,
              filteredDataLength: filteredData.filteredDataLength,
              status: { loaded: true, loading: false }
            });
          });
        }
      } else {
        filteredData = this.filters(nextProps.data, nextProps.filters);
        this.sorts(filteredData, nextProps.meta.properties);
      }
      this.setState({
        data: nextProps.data,
        filteredData,
        meta: nextProps.meta,
        status,
        updatedRows: nextProps.updatedRows
      });
    }
    this.rowHeight = nextProps.rowHeight;
    if (nextProps.visible && !this.props.visible) this.onTableEnter();
    else if (!nextProps.visible && this.props.visible) {
      this.onTableQuit();
    }
  }
  componentWillUnmount() {
    this.onTableClose();
  }
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
    const isFilter = this.hasParent(document.activeElement, "filter");
    if (e.key === "Escape") {
      this.closeOpenedWindows();
    }
    if (this.state.openedFilter && e.key === "Tab") {
      return false;
    }
    if (this.state.detail.content && e.key === "Tab") {
      return false;
    }
    if (
      !isFilter &&
      this.rows &&
      this.rows.handleNavigationKeys &&
      utils.isNavigationKey(e)
    ) {
      if (this.state.openedFilter) {
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
      this.state.filteredData
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
  handleClickButton = index => {
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
        return this.onSave();
      } else if (button.type === "detail" && button.content) {
        this.setState({ detail: button });
      } else {
        return this.handleAction(button);
      }
    }
  };
  handleAction = button => {
    if (button.action) {
      const { selectedRange, updatedRows, data, meta } = this.state;
      button.actionFunction({
        selectedRange,
        updatedRows,
        data,
        meta,
        params: this.props.params
      });
    }
  };
  handleDelete = row => {
    let updatedRow = this.state.updatedRows[row.index_];
    if (!updatedRow) {
      updatedRow = { row: { ...row }, errors: {}, rowUpdated: row }; // a voir pour rollback ->valeur initial
    } else {
      updatedRow.deleted_ = !updatedRow.deleted_;
    }
    this.setState({
      updatedRows: {
        ...this.state.updatedRows,
        [row.index_]: updatedRow,
        rowUpdated: row,
        timeStamp: new Date().getTime()
      }
    });
  };
  newRow = (row, index) => {
    const range = this.state.selectedRange;
    if (this.selectRange(range, this.row, "quit") === false) return false;
    let rows,
      ix = index;
    const status = {
        new_: true,
        errors: {},
        rowUpdated: row,
        timeStamp: new Date().getTime()
      },
      filteredData = this.state.filteredData;

    this.state.updatedRows[this.getDataLength()] = status;
    if (!this.state.meta.serverPagination) {
      rows: filteredData;
      this.state.data.push(row);
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
    if (this.state.meta.serverPagination) {
      filteredData.page = rows;
    }
    this.setState({ filteredData });
    if (this.onRowNew(row)) {
      this.selectRange(
        {
          end: { rows: range.end.rows, columns: 0 },
          start: {
            rows: range.end.rows,
            columns: this.state.meta.properties.length - 1
          }
        },
        row,
        "enter"
      );
    }
  };
  handleNew = index => {
    const row = { index_: this.getDataLength() };
    //  default values
    this.state.meta.properties
      .filter(column => column.defaultFunction)
      .forEach(column => (row[column.id] = column.defaultFunction({ row })));
    this.newRow(row, index);
  };
  handleDuplicate = index => {
    if (this.row) {
      const row = { ...this.row, index_: this.getDataLength() };
      this.newRow(row, index);
    }
  };
  // ----------------------------------------
  // filtering
  // ----------------------------------------
  adjustScroll = filteredDataLength => {
    if (
      this.state &&
      filteredDataLength !== this.getFilteredDataLength &&
      this.state.scroll.rows.startIndex !== 0 &&
      this.state.scroll.rows.index +
        (this.state.scroll.rows.direction === 1
          ? this.rowsHeight / this.rowHeight
          : 0) >
        filteredDataLength
    ) {
      this.setState({
        scroll: {
          columns: this.state.scroll.columns,
          rows: {
            index: 0,
            direction: 1,
            startIndex: 0,
            shift: 0,
            position: 0
          }
        }
      });
    }
  };
  filters = (data, filters, noFocus) => {
    if (!Array.isArray(data)) {
      if (this.state && this.state.meta.serverPagination) {
        return this.pagination({
          filters,
          callbackAfter: page => {
            this.selectRange_(this.range, undefined, "enter", noFocus);
            this.adjustScroll(page.filteredDataLength);
          }
        });
      }
      return [];
    }
    const filter = filtersFunction(filters, this.props.params, data);
    const filteredData = data.filter(filter);
    this.adjustScroll(filteredData.length);
    if (this.props.onFilter) {
      this.props.onFilter({ filters, filteredData });
    }
    return filteredData;
  };
  // a voir si pagination server ???
  //
  getFilterItems = (filter, column) => {
    if (!this.state.meta.serverPagination) {
      if (!filter || !filter.items) {
        const items = {};
        this.props.data.forEach(row => {
          const id = (column.accessorFunction || (row => row[column.id]))(
            row,
            this.props.params,
            {},
            this.state.data
          ); // a voir status
          const label =
            column.selectItems &&
            !Array.isArray(column.selectItems) &&
            typeof column.selectItems === "object"
              ? (column.selectItems[id] || {}).caption
              : id;
          items[id] = {
            id,
            label: (column.formatFunction || utils.formatValue)(
              label,
              row,
              this.props.params,
              {},
              this.state.data
            )
          };
        });
        column.items = Object.values(items);
        filter = column;
      }
    } else {
      column.items = [];
      filter = column;
      // ????
    }
    return filter;
  };
  openFilter = (e, column) => {
    if (this.selectRange(this.state.selectedRange, this.row, "quit") === false)
      return false;
    let filter = this.state.filters[column.id];
    filter = this.getFilterItems(filter, column);
    filter.top = 2 * this.rowHeight; // pourquoi 2?
    filter.left =
      column.position + this.rowHeight - this.state.scroll.columns.position;
    this.setState({
      openedFilter: column.id,
      filters: { ...this.state.filters, [column.id]: filter }
    });
  };

  onChangeFilter = (e, row, column, filterTo) => {
    // console.log("filter", e, column);
    const range = this.state.selectedRange;
    if (this.selectRange(range, this.row, "quit") === false) return false;
    this.closeOpenedWindows();
    const v = e === undefined ? null : e;
    // if (this.selectRange(this.range, this.row) === false) return false;
    if ((v !== column.v && !filterTo) || (v !== column.vTo && filterTo)) {
      if (column.filterType === "between" && filterTo) {
        column.vTo = v;
      } else {
        column.v = v;
      }
      const filters = this.state.filters;
      filters[column.id] = column;
      const filteredData = this.filters(this.state.data, filters, true);
      if (!this.state.meta.serverPagination) {
        this.sorts(filteredData, this.state.meta.properties);
        this.setState({ filteredData });
        this.selectRange(range, undefined, "enter", true);
        // this.hasFocus = false;
      }
      // if (range.end.rows > filteredData.length - 1) {
      //   this.selectRange({ end: {}, start: {} }, undefined, "enter");
      //   this.hasFocus = false;
      // } else this.selectRange(range, undefined, "enter");
    }
  };
  onChangeFilterValues = filter => {
    const id = this.state.openedFilter;
    const column = this.state.filters[this.state.openedFilter];
    column.v = filter;
    const filters = this.state.filters;
    filters[column.id] = column;
    const filteredData = this.filters(this.state.data, filters);
    if (!this.state.meta.serverPagination) {
      this.sorts(filteredData, this.state.meta.properties);
      this.setState({ filteredData, openedFilter: undefined });
      // const range = this.state.selectedRange;
      // if (range.end.rows > filteredData.length - 1)
      //   this.selectRange({ end: {}, start: {} }, undefined, "enter");
      this.selectRange(this.range, undefined, "enter");
    } else {
      this.setState({ openedFilter: undefined });
    }
  };

  // ----------------------------------------
  //sorting
  // ----------------------------------------
  sorts = (data, columns) => {
    const sorts = getSorts(columns);
    if (!Array.isArray(data)) {
      if (this.state && this.state.meta.serverPagination) {
        return this.pagination({
          sorts,
          callbackAfter: () => {
            this.selectRange_(this.range, undefined, "enter");
          }
        });
      }
      return [];
    }
    if (sorts.length) {
      data.sort(sortsFunction(sorts));
    }
    if (this.props.onSort) {
      this.props.onSort({ sorts: columns, fiteredData: data });
    }
  };
  onSort = (column, doubleClick) => {
    this.closeOpenedWindows();
    if (this.selectRange(this.range, this.row) === false) {
      return false;
    }
    const columns = this.state.meta.properties;
    let sorts = [];
    columns.forEach(col => {
      if (doubleClick && col.id !== column.id) {
        col.sort = undefined;
        col.sortOrder = undefined;
      }
      if (col.id === column.id) {
        if (col.sort === undefined) {
          col.sort = "asc";
        } else if (col.sort === "asc") {
          col.sort = "desc";
        } else if (col.sort === "desc") {
          col.sort = undefined;
          col.sortOrder = undefined;
        }
      }
      if (col.sort !== undefined) {
        sorts.push({
          index: col.index_,
          sortOrder: col.sortOrder === undefined ? 1000 : col.sortOrder
        });
      }
    });
    sorts.sort(
      (a, b) => (a.sortOrder > b.sortOrder) - (b.sortOrder > a.sortOrder)
    );
    sorts.forEach((col, index) => (columns[col.index].sortOrder = index));
    this.sorts(this.state.filteredData, columns);
    if (!this.state.meta.serverPagination) {
      this.selectRange(this.range, undefined, "enter");
      this.setState({ filteredData: this.state.filteredData });
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
    const updatedRows = this.state.updatedRows;
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
        const filteredData = this.state.filteredData;
        filteredData.page = data.page;
        filteredData.pageLength = data.pageLength;
        filteredData.filteredDataLength = data.filteredDataLength;
        filteredData.pageStartIndex = data.pageStartIndex;
        console.log("page", startIndex, stopIndex, filteredData);
        if (callbackAfter) {
          callbackAfter(data);
        }
        this.setState({
          filteredDataLength: filteredData.filteredDataLength,
          status: { loaded: true, loading: false, loadingPage: false }
        });
      });
  };
  // getDataLength()this.state.data.length
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
      // console.log("getrow", index, rows);
      return rows.page[index - rows.pageStartIndex] || { index_: undefined };
    } else {
      return rows[index];
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
    console.log("scroll", scroll.rows.startIndex, stopIndex, cell);
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
      const range = { ...this.state.range };
      range.end = cell;
      if (!extension) {
        range.start = cell;
      }
      this.selectRange_(range);
    }
    this.setState({ scroll });
  };
  selectRange = (range, row, type, noFocus) => {
    console.log("selectrange", range);
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
  selectRange_ = (range, row, type, noFocus) => {
    // avoid focus on cell when changing filters (set to false on changed filter ok)
    this.hasFocus = !noFocus;
    if (range.end.rows > this.getDataLength() - 1) {
      (range.end = {}), (range.start = {});
      this.hasFocus = false;
    }
    const prevEnd = this.state.selectedRange.end;
    const prevStart = this.state.selectedRange.start;
    const endChanged =
      prevEnd.rows !== range.end.rows || prevEnd.columns !== range.end.columns;
    if (endChanged || type) {
      this.closeOpenedWindows();
      if (this.row && type !== "enter") {
        if (
          this.onCellQuit(
            this.row[this.column.id],
            this.previousValue,
            this.row,
            this.column
          ) === false
        ) {
          return false;
        }
        if (prevEnd.rows !== range.end.rows || row) {
          if (
            this.onRowQuit(
              this.row,
              this.previousRow,
              this.state.updatedRows[this.row.index_]
            ) === false
          ) {
            return false;
          }
        }
      }
      if (type === "quit") return true;
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
        this.column = this.state.meta.properties[range.end.columns];
        this.previousValue = this.row[this.column.id];
        if (prevEnd.rows !== range.end.rows || type === "enter") {
          this.onRowEnter(this.row);
        }
        this.onCellEnter(this.previousValue, this.row, this.column);
        if (this.state.meta.properties[range.end.columns].dataType === "text") {
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
  // -------------------------------
  //  Cell events
  //  -------------------------------
  onChange = (value, row, column) => {
    this.updated = true;
    this.rowUpdated = true;
    this.tableUpdated = true;
    let updatedRow = this.state.updatedRows[row.index_];
    if (!updatedRow) {
      updatedRow = {
        row: { ...row, [column.id]: this.previousValue },
        errors: {},
        updated_: true,
        rowUpdated: row,
        timeStamp: new Date().getTime()
      };
      // eslint-disable-next-line
      this.state.updatedRows[row.index_] = updatedRow;
    } else if (!updatedRow.updated_) {
      updatedRow.updated_ = true;
      updatedRow.timeStamp = new Date().getTime();
    }
    row[column.id] = value;
    const message = {
      value,
      previousValue: this.previousValue,
      row,
      status: updatedRow,
      column,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    let b = this.onChange_(message);
    if (!b && this.props.errorHandler.onChange) {
      b = this.props.errorHandler.onChange(message);
    }
    // console.log("onChange", message);
    return b;
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
  onCellQuit = (value, previousValue, row, column) => {
    const status = this.state.updatedRows[row.index_];
    const message = {
      updated: this.updated,
      value,
      previousValue,
      row,
      status,
      column,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    let b = this.onCellQuit_(message);
    if (!b && this.props.errorHandler.onCellQuit) {
      b = this.props.errorHandler.onCellQuit(message);
    }
    // console.log("onCellQuit", message);
    return b;
  };
  onCellQuit_ = message => {
    const onCellQuit =
      this.props.onCellQuit || this.state.meta.properties.onQuitFunction;
    if (this.updated && onCellQuit && onCellQuit(message) === false) {
      return false;
    }
    return true;
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
    if (this.props.onCellEnter) this.props.onCellEnter(row, column);
    // console.log("onCellEnter", message);
  };
  // -------------------------------
  //  row events
  //  -------------------------------
  onRowQuit = (row, previousRow, status) => {
    if (!status) {
      return true;
    }
    const message = {
      updated: this.rowUpdated,
      row,
      previousRow,
      status,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    // mandatory data

    let b = this.onRowQuit_(message);
    if (
      (!b || (message.status.errors || {}).n_) &&
      this.props.errorHandler.onRowQuit
    ) {
      b = this.props.errorHandler.onRowQuit(message);
    }
    return b;
  };
  onRowQuit_ = message => {
    if (this.rowUpdated) {
      // return false;
      this.state.meta.properties
        .filter(property => property.mandatory)
        .forEach(property => {
          const error = message.status.errors[property.id] || {};

          manageRowError(
            this.state.updatedRows,
            message.row.index_,
            property.id,
            "mandatory",
            utils.isNullOrUndefined(message.row[property.id]) ||
            message.row[property.id] === ""
              ? "mandatory data"
              : null
          );
        });
      const onRowQuit =
        this.props.onRowQuit || this.state.meta.row.onQuitFunction;
      if (onRowQuit && onRowQuit(message) === false) {
        return false;
      }
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
  canQuit = () => {
    if (this.onTableQuit(true)) {
      this.tableUpdated = false;
      return true;
    }
    return false;
  };
  onTableQuit = bExternal => {
    if (bExternal && !this.tableUpdated) {
      return true;
    }
    const message = {
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    let b = this.onTableQuit_(message);
    if (!b && this.props.errorHandler.onTableQuit) {
      b = this.props.errorHandler.onTableQuit(message);
    }
    return b;
  };
  onTableQuit_ = message => {
    if (this.range.end.rows) {
      if (
        !this.onCellQuit(
          this.row[this.column.id],
          this.previousValue,
          this.row,
          this.column
        )
      ) {
        return false;
      }
      this.previousValue = this.row[this.column.id];
      if (
        !this.onRowQuit(
          this.row,
          this.previousRow,
          this.state.updatedRows[this.row.index_]
        )
      ) {
        return false;
      }
      this.previousRow = { ...this.row };
    }
    const onTableQuit = this.props.onTableQuit || this.state.meta.table.onQuit;
    if (onTableQuit && onTableQuit(message) === false) {
      return false;
    }
    return true;
  };
  onTableClose = () => {
    const message = {
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    if (this.props.onTableClose) {
      this.props.onTableClose(message);
    }
  };
  handleErrors = (e, rowIndex, errors) => {
    if (errors.length || this.state.toolTip) {
      const toolTip = errors.length
        ? {
            top: (3 + rowIndex) * this.rowHeight + this.state.scroll.rows.shift,
            left: this.rowHeight,
            rowIndex,
            content: errors
          }
        : null;
      this.setState({ toolTip });
    }
  };
  // -------------------------------
  //  Save events
  //  -------------------------------
  onSave = () => {
    const message = {
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    let b = this.onSave_(message);
    if (
      (!b || (message.updatedRows || {}).nErrors_) &&
      this.props.errorHandler.onSave
    ) {
      b = this.props.errorHandler.onSave(message);
    }
    if (b) {
      this.setState({ data: message.data, updatedRows: {} });
    }
    return b;
  };
  onSave_ = message => {
    if (!this.onSaveBefore(message)) return false;
    const onSave = this.props.onSave || this.state.meta.table.onSaveFunction;
    if (onSave && onSave(message) === false) {
      return false;
    }
    return true;
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
      return false;
    }
    return true;
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
      v: (column.accessorFunction || (row => row[column.id]))(row),
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
  onMetaChange = () => this.setState({ scroll: this.state.scroll });
  render() {
    const height = this.props.height,
      width = this.props.width;
    const { visible } = this.props;

    // let filter;

    if (!visible) {
      return null;
    } else if (this.state.status.loading || this.state.status.loadingConfig) {
      return <div>Loading data...</div>;
    } else if (this.state.status.error) {
      if (this.state.status.error.message === "No rows retrieved") {
        return <div style={{ width: "max-content" }}>No rows retrieved</div>;
      } else {
        return (
          <div style={{ color: "red", width: "max-content" }}>
            <p>{this.state.status.error.type}</p>
            <p>{this.state.status.error.message}</p>
          </div>
        );
      }
    }
    // -----------------------------
    //   action buttons
    // -----------------------------
    const actions = (this.state.meta.table.actions || [])
      .map((action, index) => {
        if (!this.doubleclickAction && action.type === "detail") {
          this.doubleclickAction = action;
        }
        let enable = action.enable || false;
        if (this.state.status.loadingPage) {
          enable = false;
        } else if (action.enableFunction) {
          const row =
            this.range.end.rows !== undefined
              ? this.getRow(this.range.end.rows)
              : { index_: undefined };
          const status = this.state.updatedRows[row.index_];
          enable = action.enableFunction({ row, status });
        }
        return (
          <button
            key={index}
            disabled={!enable}
            style={{
              width: `${96 / this.state.meta.table.actions.length}%`,
              margin: 2,
              marginTop: 6,
              backgroundColor: "lightgrey"
            }}
            onClick={() => this.handleClickButton(index)}
          >
            {action.caption}
          </button>
        );
      });
    // -----------------------------------
    // filters
    // -----------------------------------
    // between
    // ----------------------------------
    let filterHeaders;

    if (this.state.meta.table.noFilter) {
      filterHeaders = [];
    } else {
      filterHeaders = [
        <Headers
          type="filter"
          key="filters"
          openFilter={this.openFilter}
          onChange={this.onChangeFilter}
          meta={this.state.meta.properties}
          data={this.state.data}
          height={this.rowHeight}
          width={width}
          scroll={this.state.scroll.columns}
        />
      ];
      if (
        this.state.meta.properties.findIndex(
          column => column.filterType === "between"
        ) !== -1
      ) {
        filterHeaders.push(
          <Headers
            type="filter"
            key="filtersBetween"
            openFilter={this.openFilter}
            onChange={this.onChangeFilter}
            meta={this.state.meta.properties}
            data={this.state.data}
            height={this.rowHeight}
            width={width}
            scroll={this.state.scroll.columns}
            filterTo={true}
          />
        );
      }
    }

    // -----------------------------------
    // Filter check list
    // -----------------------------------
    const { openedFilter, filters } = this.state;
    if (openedFilter !== undefined) {
      const { top, left, items, v, caption, computedWidth } = filters[
        openedFilter
      ];
      this.filter = (
        <Filter
          items={items}
          title={caption}
          filter={v}
          style={{
            position: "absolute",
            border: "solid 0.1em rgba(0, 0, 0, 0.5)",
            backgroundColor: "white",
            fontFamily: "inherit",
            top,
            left,
            width: Math.max(computedWidth * 1.2, 150),
            zIndex: 3,
            opacity: 1
          }}
          onOk={this.onChangeFilterValues}
        />
      );
    } else {
      this.filter = undefined;
    }
    // ------------------------
    // text area
    // ------------------------
    const { top, left, v, editable, label } = this.state.text;
    if (top !== undefined) {
      this.text = (
        <div
          style={{
            position: "absolute",
            border: "solid 0.1em rgba(0, 0, 0, 0.5)",
            backgroundColor: "white",
            top: top + filterHeaders.length * this.rowHeight,
            left,
            zIndex: 3,
            opacity: 1
          }}
        >
          <div>{label} </div>
          <textarea
            rows="10"
            cols="80"
            id={"textarea"}
            tabIndex={0}
            style={{ top, left, font: "inherit" }}
            disabled={!editable}
            autoFocus={true}
            value={v || ""}
            onChange={this.handleTextChange}
            // ref={ref => (this.focused = ref)}
          />
        </div>
      );
    } else {
      this.text = undefined;
    }
    // ------------------------
    // Detail
    // ------------------------
    let detail = this.state.detail.content;
    if (detail) {
      const row =
        this.range.end.rows !== undefined
          ? this.getRow(this.range.end.rows)
          : {};
      const status = this.state.updatedRows[row.index_];
      //       top: (3 + rowIndex) * this.rowHeight + this.state.scroll.rows.shift,
      // left:
      //   column.position + this.rowHeight - this.state.scroll.columns.position
      detail = this.getDetail({
        Detail: detail,
        row,
        data: this.state.data,
        meta: this.state.meta.properties,
        status,
        params: this.props.params,
        top:
          (3 +
            filterHeaders.length +
            this.state.selectedRange.end.rows -
            this.state.scroll.rows.startIndex) *
            this.rowHeight +
          this.state.scroll.rows.shift,

        onChange: this.state.meta.row.onChange,
        onClose: this.closeOpenedWindows
      });
    }
    // ------------------------
    // errors
    // ------------------------
    let toolTip = this.state.toolTip || null;
    if (toolTip) {
      const content = (
        <ul style={{ paddingLeft: 20, maxWidth: 300 }}>
          {toolTip.content.map((error, index) => {
            return (
              <li
                key={index}
              >{`${error.column} :  ${error.type}, ${error.error}.`}</li>
            );
          })}
        </ul>
      );
      toolTip = (
        <div
          key={"tool-tip"}
          className="zebulon-tool-tip"
          style={{ top: toolTip.top, left: toolTip.left }}
        >
          {content}
        </div>
      );
    }
    // ----------------------------------
    // Status bar
    // ----------------------------------
    this.rowsHeight =
      height -
      (1 + filterHeaders.length) * this.rowHeight -
      (actions.length ? 30 : 0);
    const noUpdate = !this.isInPage(this.state.scroll.rows);
    let statusBar = null;
    if (this.state.meta.table.noStatus) {
    } else {
      statusBar = (
        <Status
          data={this.state.filteredData}
          status={this.state.status}
          dataLength={this.state.filteredDataLength}
          height={this.rowsHeight}
          rowHeight={this.rowHeight}
          scroll={this.state.scroll.rows}
          updatedRows={this.state.updatedRows}
          selectRange={this.selectRange}
          selectedIndex={this.state.selectedRange.end.rows}
          meta={this.state.meta.properties}
          handleErrors={this.handleErrors}
          noUpdate={noUpdate}
        />
      );
    }
    return (
      <div
        style={{
          width: "max-content",
          height: "fit-content"
        }}
        // onMouseUp={e => console.log("mouseup", e.target)}
        // onMouseleave={e => console.log("mouseleave", e.target)}
      >
        {detail}
        {this.filter}
        {this.text}
        {toolTip}
        <Headers
          type="header"
          onSort={this.onSort}
          meta={this.state.meta.properties}
          data={this.state.data}
          height={this.rowHeight}
          width={width}
          scroll={this.state.scroll.columns}
          onMetaChange={this.onMetaChange}
          statusBar={statusBar !== null}
        />
        {filterHeaders}
        <div style={{ display: "-webkit-box" }}>
          {statusBar}
          <Rows
            meta={this.state.meta}
            data={this.state.filteredData}
            status={this.state.status}
            dataLength={this.state.filteredDataLength}
            height={this.rowsHeight}
            width={width - this.rowHeight * (statusBar !== null)}
            rowHeight={this.rowHeight}
            scroll={this.state.scroll}
            onScroll={this.onScroll}
            selectedRange={this.state.selectedRange}
            selectRange={this.selectRange}
            onChange={this.onChange}
            onFocus={() => {}}
            hasFocus={this.hasFocus}
            updatedRows={this.state.updatedRows}
            params={this.props.params}
            navigationKeyHandler={this.props.navigationKeyHandler}
            ref={ref => (this.rows = ref)}
            noUpdate={noUpdate}
          />
        </div>
        <div style={{ height: actions.length ? 30 : 0 }}>{actions}</div>
      </div>
    );
  }
}
