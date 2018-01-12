import React, { Component } from "react";
import { Headers, Status } from "./TableHeaders";
import { Rows } from "./Rows";
import { utils, Filter } from "zebulon-controls";
// import { Filter } from "./controls-o/Filter";
import { manageRowError } from "./utils";

// import { utils } from "zebulon-controls";
export class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      filteredData: props.data,
      meta: props.meta,
      filters: {},
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
      sorts: {},
      selectedRange: { start: {}, end: {} },
      detail: {},
      text: {}
    };
    // props.getRef(this);
    // if (props.getActions) {
    //   this.actions = props.getActions(props.id, {
    //     ...(props.callbacks || {}),
    //     onChange: this.onChange,
    //     close: this.closeOpenedWindows
    //   });
    // }
    this.rowHeight = this.props.rowHeight;
    this.range = { start: {}, end: {} };
    this.onTableEnter();
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.data !== this.props.data ||
      nextProps.meta !== this.props.meta ||
      nextProps.status !== this.props.status ||
      nextProps.updatedRows !== this.props.updatedRows
    ) {
      this.setState({
        data: nextProps.data,
        filteredData: this.filters(nextProps.data, this.state.filters),
        meta: nextProps.meta,
        status: nextProps.status,
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
  onScroll = scroll => {
    this.closeOpenedWindows();
    this.setState({ scroll });
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
      row = this.state.filteredData[rowIndex];
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
      updatedRow = { row: { ...row }, errors: {} }; // a voir pour rollback ->valeur initial
    } else {
      updatedRow.deleted_ = !updatedRow.deleted_;
    }
    this.setState({
      updatedRows: { ...this.state.updatedRows, [row.index_]: updatedRow }
    });
  };
  handleNew = index => {
    const range = this.state.selectedRange;
    if (this.selectRange(range, this.row, "quit") === false) return false;
    let filteredData = [...this.state.filteredData];
    const status = { new_: true, errors: {} };
    // eslint-disable-next-line
    this.state.updatedRows[this.state.data.length] = status;
    const row = { index_: this.state.data.length };
    this.state.meta.properties
      .filter(column => column.defaultFunction)
      .forEach(
        column => (row[column.id] = column.defaultFunction({ row, status }))
      );
    this.state.data.push(row);
    filteredData = filteredData
      .slice(0, index)
      .concat(row)
      .concat(filteredData.slice(index));
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
  handleDuplicate = index => {
    if (this.row) {
      const range = this.state.selectedRange;
      if (this.selectRange(range, this.row, "quit") === false) return false;

      let filteredData = [...this.state.filteredData];
      const status = { new_: true, errors: {} };
      // eslint-disable-next-line
      this.state.updatedRows[this.state.data.length] = status;
      const row = { ...this.row, index_: this.state.data.length };
      this.state.meta.properties
        .filter(column => column.defaultFunction)
        .forEach(
          column => (row[column.id] = column.defaultFunction({ row, status }))
        );
      this.state.data.push(row);
      filteredData = filteredData
        .slice(0, index)
        .concat(row)
        .concat(filteredData.slice(index));
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
    }
  };
  // ----------------------------------------
  // filtering
  // ----------------------------------------
  filters = (data, filters) => {
    const f = Object.values(filters).filter(filter => filter.v !== null);
    if (!f.length) return data;
    const filter = row => f.reduce((acc, filter) => acc && filter.f(row), true);
    const filteredData = data.filter(filter);
    if (
      filteredData.length !== this.state.filteredData.length &&
      this.state.scroll.rows.startIndex !== 0 &&
      this.state.scroll.rows.index +
        (this.state.scroll.rows.direction === 1
          ? this.rowsHeight / this.rowHeight
          : 0) >
        filteredData.length
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
    return filteredData;
  };
  openFilter = (e, column) => {
    if (this.selectRange(this.state.selectedRange, this.row, "quit") === false)
      return false;
    let filter = this.state.filters[column.id];
    if (!filter || !filter.items) {
      const items = {};
      this.props.data.forEach(row => {
        const id = (column.accessorFunction || (row => row[column.id]))(
          row,
          this.props.params,
          {},
          this.state.data
        ); // a voir status
        // items[row[column.id]] = { id, label:id };
        items[id] = {
          id,
          label: (column.formatFunction || utils.formatValue)(
            id,
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
      const facc = row =>
        (column.accessorFunction || (row => row[column.id]))(
          row,
          this.props.params,
          {},
          this.state.data
        );
      if (column.dataType === "boolean") {
        column.f = row => (facc(row) || false) === v;
      } else if (column.filterType === "=") {
        column.f = row => facc(row) === v;
      } else if (column.filterType === ">=") {
        column.f = row => facc(row) >= v;
      } else if (column.filterType === "between" && filterTo) {
        column.f = row =>
          (v !== null ? facc(row) <= v : true) &&
          (column.v !== null ? facc(row) >= column.v : true);
      } else if (column.filterType === "between" && !filterTo) {
        column.f = row =>
          (v !== null ? facc(row) >= v : true) &&
          (column.vTo !== null ? facc(row) <= column.vTo : true);
      } else if (column.filterType === "<=") {
        column.f = row => facc(row) <= v;
      } else {
        column.f = row => String(facc(row) || "").startsWith(String(v || ""));
      }
      if (column.filterType === "between" && filterTo) {
        column.vTo = v;
      } else {
        column.v = v;
      }
      const filters = { ...this.state.filters, [column.id]: column };
      const filteredData = this.filters(this.state.data, filters);
      // if (filteredData === false) return false;

      this.sorts(filteredData, this.state.sorts);
      if (range.end.rows > filteredData.length - 1) {
        this.selectRange({ end: {}, start: {} }, undefined, "enter");
        this.hasFocus = false;
      } else this.selectRange(range, undefined, "enter");
      this.setState({
        filters,
        filteredData
      });
    }
  };
  onChangeFilterValues = filter => {
    const id = this.state.openedFilter;
    const column = this.state.filters[this.state.openedFilter];
    const facc = row =>
      (column.accessorFunction || (row => row[column.id]))(
        row,
        this.props.params,
        {},
        this.state.data
      );
    column.f = row => filter[facc(row)] !== undefined;
    column.v = filter;
    const filters = { ...this.state.filters, [column.id]: column };
    const filteredData = this.filters(this.state.data, filters);
    this.sorts(filteredData, this.state.sorts);
    const range = this.state.selectedRange;
    if (range.end.rows > filteredData.length - 1)
      this.selectRange({ end: {}, start: {} }, undefined, "enter");
    else this.selectRange(range, undefined, "enter");
    this.setState({
      filters,
      filteredData,
      openedFilter: undefined
    });
  };

  // ----------------------------------------
  //sorting
  // ----------------------------------------
  sorts = (data, sorting) => {
    const sorts = Object.values(sorting)
      .filter(sort => sort !== undefined)
      .map(sort => {
        let nullValue = "";
        if (sort.dataType === "number" || sort.dataType === "boolean") {
          nullValue = null;
        } else if (sort.dataType === "date") {
          nullValue = new Date(null);
        }
        // if (sort.dataType==="number"){nullValue=null}
        sort.accessorFunction =
          sort.accessorFunction ||
          (row =>
            utils.isNullOrUndefined(row[sort.id]) ? nullValue : row[sort.id]);
        return sort;
      });
    if (sorts.length) {
      const sort = (rowA, rowB) =>
        sorts.reduce((acc, sort) => {
          if (acc === 0) {
            acc =
              ((sort.accessorFunction(rowA) > sort.accessorFunction(rowB)) -
                (sort.accessorFunction(rowB) > sort.accessorFunction(rowA))) *
              (sort.direction === "asc" ? 1 : -1);
          }
          return acc;
        }, 0);
      data.sort(sort);
    }
  };
  onSort = (column, doubleClick) => {
    this.closeOpenedWindows();
    if (this.selectRange(this.range, this.row) === false) {
      return false;
    }
    // if (this.state.filteredData===this.state.data)
    let sorts = { ...this.state.sorts };
    if (doubleClick) {
      Object.keys(sorts).forEach(
        columnId =>
          (this.props.meta.properties[sorts[columnId].index].sort = undefined)
      );
      sorts = {};
    }
    // console.log("click", column, doubleClick);
    if (column.sort === undefined) {
      column.sort = "asc";
    } else if (column.sort === "asc") {
      column.sort = "desc";
    } else if (column.sort === "desc") {
      column.sort = undefined;
    }
    sorts[column.id] = {
      index: column.index_,
      direction: column.sort,
      id: column.id,
      accessorFunction: column.accessorFunction,
      dataType: column.dataType
    };
    if (column.sort === undefined) {
      delete sorts[column.id];
    }
    this.sorts(this.state.filteredData, sorts, column);
    this.setState({ filteredData: this.state.filteredData, sorts });
  };
  // handleSave = () => {
  //   let ok = true;
  //   let rows;
  //   const updatedData = this.props.checkable
  //     ? this.state.checkedData
  //     : this.state.updatedData;
  //   if (this.props.editable) {
  //     rows = Object.keys(updatedData).map(key => {
  //       const updatedRow = updatedData[key];
  //       const row = this.props.metaColumn.reduce((acc, column) => {
  //         acc[column.code] = column.setAccessor(updatedRow.row[column.code]);
  //         return acc;
  //       }, {});
  //       row.index_ = updatedRow.row._index;
  //       row.status_ = updatedRow.deleted
  //         ? "deleted"
  //         : updatedRow.inserted ? "inserted" : "updated";
  //       const checked = this.rowCheck(updatedRow);
  //       if (checked !== true) {
  //         ok = false;
  //       } else {
  //         ok = true;
  //       }
  //       return row;
  //     });
  //   }
  //   if (ok && this.props.save) {
  //     if (this.props.editable) {
  //       this.props.save({ updatedData: rows });
  //       this.setState({ updatedData: {} });
  //     } else {
  //       console.log("handleSave", updatedData);
  //       this.props.save({ checkedData: updatedData });
  //     }
  //   }
  //   return ok;
  // };

  // ------------------------------------------------------
  // selection and validations
  // ------------------------------------------------------
  selectRange = (range, row, type) => {
    // avoid focus on cell when changing filters (set to false on changed filter ok)
    this.hasFocus = true;

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
          this.row = row || this.state.filteredData[range.end.rows];
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
  //  table events
  onChange = (value, row, column) => {
    this.updated = true;
    this.rowUpdated = true;
    this.tableUpdated = true;
    let updatedRow = this.state.updatedRows[row.index_];
    if (!updatedRow) {
      updatedRow = {
        row: { ...row, [column.id]: this.previousValue },
        errors: {},
        updated_: true
      };
      // eslint-disable-next-line
      this.state.updatedRows[row.index_] = updatedRow;
    } else if (!updatedRow.updated_) {
      updatedRow.updated_ = true;
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
    console.log("onChange", message);
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
    console.log("onCellQuit", message);
    return b;
  };
  onCellQuit_ = message => {
    if (
      message.column.onQuitFunction &&
      this.updated &&
      message.column.onQuitFunction(message) === false
    ) {
      return false;
    }
    if (this.props.onCellQuit && this.props.onCellQuit(message) === false) {
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
    console.log("onCellEnter", message);
  };
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
    console.log("onRowQuit", message);
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
            message.status,
            property.id,
            "mandatory",
            utils.isNullOrUndefined(message.row[property.id]) ||
            message.row[property.id] === ""
              ? "mandatory data"
              : null
          );
        });
      if (
        this.state.meta.row.onQuitFunction &&
        this.state.meta.row.onQuitFunction(message) === false
      ) {
        return false;
      }
    }
    if (this.props.onRowQuit && this.props.onRowQuit(message) === false) {
      return false;
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
    console.log("onRowEnter", message);
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
    console.log("onRowNew", message);
    return true;
  };
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
    console.log("onTableEnter", message);
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
    console.log("onTableQuit", message);
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
    if (this.props.onTableQuit && this.props.onTableQuit(message) === false) {
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
    console.log("onTableQuit", message);
  };
  onSaveBefore = message => {
    if (this.props.onSaveBefore) return this.props.onSaveBefore(message);
    return true;
  };
  onSave = () => {
    const message = {
      updatedRows: this.state.updatedRows,
      meta: this.state.meta,
      data: this.state.data,
      params: this.props.params
    };
    if (!this.onSaveBefore(message)) return false;
    if (this.props.onSave && !this.props.onSave(message)) return false;
    return true;
  };
  onSaveAfter = message => {
    if (this.props.onSaveAfter) return this.props.onSaveAfter(message);
    return true;
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
    } else if (this.props.status.loading || this.props.status.loadingConfig) {
      return <div>Loading data...</div>;
    } else if (this.props.status.error) {
      if (this.props.status.error.message === "No rows retrieved") {
        return <div style={{ width: "max-content" }}>No rows retrieved</div>;
      } else {
        return (
          <div style={{ color: "red", width: "max-content" }}>
            <p>{this.props.status.error.type}</p>
            <p>{this.props.status.error.message}</p>
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
        if (action.enableFunction) {
          const row =
            this.range.end.rows !== undefined
              ? this.state.filteredData[this.range.end.rows]
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
    let betweens = null;
    if (
      this.props.meta.properties.findIndex(
        column => column.filterType === "between"
      ) !== -1
    ) {
      betweens = (
        <Headers
          type="filter"
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
    // -----------------------------------
    // Filter check list
    // -----------------------------------
    const { openedFilter, filters } = this.state;
    if (openedFilter !== undefined) {
      const { top, left, items, v } = filters[openedFilter];
      this.filter = (
        <Filter
          items={items}
          title={openedFilter}
          filter={v}
          style={{
            position: "absolute",
            border: "solid 0.1em rgba(0, 0, 0, 0.5)",
            backgroundColor: "white",
            fontFamily: "inherit",
            top,
            left,
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
            top: top + (betweens !== null) * this.rowHeight,
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
          ? this.state.filteredData[this.range.end.rows]
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
          (4 +
            (betweens !== null) +
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
    this.rowsHeight =
      height -
      (2 + (betweens !== null)) * this.rowHeight -
      (actions.length ? 30 : 0);
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
        />
        <Headers
          type="filter"
          openFilter={this.openFilter}
          onChange={this.onChangeFilter}
          meta={this.state.meta.properties}
          data={this.state.data}
          height={this.rowHeight}
          width={width}
          scroll={this.state.scroll.columns}
        />
        {betweens}
        <div style={{ display: "-webkit-box" }}>
          <Status
            data={this.state.filteredData}
            height={this.rowsHeight}
            rowHeight={this.rowHeight}
            scroll={this.state.scroll.rows}
            updatedRows={this.state.updatedRows}
            selectRange={this.selectRange}
            selectedIndex={this.state.selectedRange.end.rows}
            meta={this.state.meta.properties}
            handleErrors={this.handleErrors}
          />
          <Rows
            meta={this.state.meta.properties}
            columnVisibleLength={this.state.meta.visibleLength}
            data={this.state.filteredData}
            height={this.rowsHeight}
            width={width - this.rowHeight}
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
          />
        </div>
        <div style={{ height: actions.length ? 30 : 0 }}>{actions}</div>
      </div>
    );
  }
}
