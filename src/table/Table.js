import React, { Component } from "react";
import { Headers, Status } from "./TableHeaders";
import { Rows } from "./Rows";
import { utils, Filter } from "zebulon-controls";
// import { Filter } from "./controls-o/Filter";
import { computeData } from "./utils";

// import { utils } from "zebulon-controls";

// import { actionDescriptions } from "../PivotGrid/MetaDescriptions";
export class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      filteredData: props.data,
      meta: props.meta,
      filters: {},
      updatedRows: {},
      scroll: {
        rows: {
          index: 0,
          direction: 1,
          startIndex: 0,
          shift: 0,
          position: 0,
          error: {}
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
    this.rowHeight = this.props.rowHeight || 25;
    this.range = { start: {}, end: {} };
    // this.meta = this.getMeta(props.meta, props.data);
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.data !== this.props.data ||
      nextProps.meta !== this.props.meta
    ) {
      this.setState({
        data: nextProps.data,
        filteredData: this.filters(nextProps.data, this.state.filters),
        meta: nextProps.meta
      });
    }
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
        const ok = this.handleSave();
        return ok;
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
      button.action({ selectedRange, updatedRows, data, meta });
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
    let filteredData = [...this.state.filteredData];
    const status = { new_: true, errors: {} };
    // const updatedRows = {
    //   ...this.state.updatedRows,
    //   [this.state.data.length]: status
    // };
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
    this.onRowNew(row);
    this.selectRange(
      {
        end: { rows: index, columns: 0 },
        start: { rows: index, columns: this.state.meta.properties.length - 1 }
      },
      row
    );
  };
  handleDuplicate = index => {
    if (this.row) {
      let filteredData = [...this.state.filteredData];
      const status = { new_: true, errors: {} };
      this.state.updatedRows[this.state.data.length] = status;
      // const updatedRows = {
      //   ...this.state.updatedRows,
      //   [this.state.data.length]: status
      // };
      const row = { ...this.row, index_: this.state.data.length };
      // this.state.meta.properties
      //   .filter(column => column.defaultFunction)
      //   .forEach(column => (row[column.id] = column.defaultFunction(row)));
      this.state.data.push(row);
      filteredData = filteredData
        .slice(0, index)
        .concat(row)
        .concat(filteredData.slice(index));
      this.setState({ filteredData });
      this.onRowNew(row);
      this.selectRange(
        {
          end: { rows: index, columns: 0 },
          start: { rows: index, columns: this.state.meta.properties.length - 1 }
        },
        row
      );
    }
  };
  // ----------------------------------------
  // filtering
  // ----------------------------------------
  filters = (data, filters) => {
    const f = Object.values(filters).filter(filter => filter.v !== null);
    if (!f.length) {
      return data;
    }
    const filter = row => f.reduce((acc, filter) => acc && filter.f(row), true);
    return data.filter(filter);
  };
  openFilter = (e, column) => {
    let filter = this.state.filters[column.id];
    if (!filter) {
      const items = {};
      this.props.data.forEach(row => {
        items[row[column.id]] = { id: row[column.id], label: row[column.id] };
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

  onChangeFilter = (e, column, filterTo) => {
    // console.log("filter", e, column);
    this.closeOpenedWindows();
    if (e !== column.v) {
      if (column.filterType === "=") {
        column.f = row => row[column.id] === e;
      } else if (column.filterType === ">=") {
        column.f = row => row[column.id] >= e;
      } else if (column.filterType === "between" && filterTo) {
        column.f = row =>
          row[column.id] <= e &&
          (column.v !== null ? row[column.id] >= column.v : true);
      } else if (column.filterType === "between" && !filterTo) {
        column.f = row =>
          row[column.id] >= e &&
          (column.vTo !== null ? row[column.id] <= column.vTo : true);
      } else if (column.filterType === "<=") {
        column.f = row => row[column.id] <= e;
      } else {
        column.f = row =>
          String(row[column.id] || "").startsWith(String(e || ""));
      }
      if (column.filterType === "between" && filterTo) {
        column.vTo = e;
      } else {
        column.v = e;
      }
      const filters = { ...this.state.filters, [column.id]: column };
      const filteredData = this.filters(this.state.data, filters);
      this.sorts(filteredData, this.state.sorts);
      this.setState({
        filters,
        filteredData
      });
    }
  };
  onChangeFilterValues = filter => {
    // console.log("filter", e, column);
    const id = this.state.openedFilter;
    const column = this.state.filters[this.state.openedFilter];
    column.f = row => filter[row[id]] !== undefined;
    column.v = filter;
    const filters = { ...this.state.filters, [column.id]: column };
    const filteredData = this.filters(this.state.data, filters);
    this.sorts(filteredData, this.state.sorts);

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
          sort.accessor ||
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
      accessor: column.accessor,
      dataType: column.dataType
    };
    if (column.sort === undefined) {
      delete sorts[column.id];
    }
    this.sorts(this.state.filteredData, sorts);
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
  selectRange = (range, row) => {
    const prevFocus = this.state.selectedRange.end;
    if (
      prevFocus.rows !== range.end.rows ||
      prevFocus.columns !== range.end.columns ||
      row
    ) {
      this.closeOpenedWindows();
      if (this.row) {
        this.onCellQuit(this.row, this.column);
        if (prevFocus.rows !== range.end.rows || row) {
          this.onRowQuit(this.row, this.state.updatedRows[this.row.index_]);
        }
      }
      if (prevFocus.rows !== range.end.rows || row) {
        this.rowUpdated = !!row;
      }
      this.row = row || this.state.filteredData[range.end.rows];
      this.column = this.state.meta.properties[range.end.columns];
      this.updated = false;
      if (prevFocus.rows !== range.end.rows || row) {
        this.onRowEnter(this.row);
      }
      this.onCellEnter(this.row, this.column);
      if (this.state.meta.properties[range.end.columns].dataType === "text") {
        this.handleText(range.end, this.row, this.column);
      }
    }
    this.setState({ selectedRange: range });
    this.range = range;
  };
  rowCheck = row => true;
  onChange = (e, row, column) => {
    this.updated = true;
    this.rowUpdated = true;
    let updatedRow = this.state.updatedRows[row.index_];
    if (!updatedRow) {
      updatedRow = { row: { ...row }, errors: {} }; // a voir pour rollback ->valeur initial
    }
    if (!updatedRow.updated_) {
      updatedRow.updated_ = true;
      this.setState({
        updatedRows: { ...this.state.updatedRows, [row.index_]: updatedRow }
      });
    }
    row[column.id] = e;
    if (column.onChange) {
      column.onChange(row);
    }
    if (this.props.onChange) {
      this.props.onChange(e, row, column);
    }
  };
  onCellQuit = (row, column) => {
    if (column.onQuit && this.updated) {
      const status = this.state.updatedRows[row.index_];
      if (status !== undefined)
        column.onQuit({
          row,
          status,
          data: this.state.data,
          params: this.props.params
        });
    }
    if (this.props.onCellQuit) {
      this.props.onCellQuit(row, column);
    }
  };
  onCellEnter = (row, column) => {
    if (this.props.onCellEnter) {
      this.props.onCellEnter(row, column);
    }
  };
  onRowQuit = (row, status) => {
    // mandatory data
    if (this.rowUpdated) {
      this.state.meta.properties
        .filter(property => property.mandatory)
        .forEach(property => {
          const error = status.errors[property.id] || {};
          if (
            utils.isNullOrUndefined(row[property.id]) ||
            row[property.id] === ""
          ) {
            error.mandatory = "mandatory data";
          } else {
            delete error.mandatory;
          }
          status.errors[property.id] = error;
        });
    }
  };
  onRowEnter = row => {
    if (this.props.onRowEnter) {
      this.props.onRowEnter(row);
    }
  };
  onRowNew = row => {
    if (this.props.onRowNew) {
      this.props.onRowNew(row);
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

  handleText = (cell, row, column) => {
    let label;
    //  ca n'a rien a faire la. A voir
    if (row.tp === "accessor") {
      label = "Parameters: (row,params)";
    } else if (row.tp === "format") {
      label = "Parameters: (value)";
    } else if (row.tp === "aggregation") {
      label = "Parameters: ([values])";
    } else if (row.tp === "sort") {
      label = "Parameters: (rowA, rowB)";
    } else if (row.tp === "window") {
      label = "Parameters: (value)";
    }
    const text = {
      top:
        (3 + cell.rows - this.state.scroll.rows.startIndex) * this.rowHeight +
        this.state.scroll.rows.shift,
      left:
        column.position + this.rowHeight - this.state.scroll.columns.position,
      v: (column.accessor || (({ row }) => row[column.id]))({ row }),
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
  render() {
    const height = this.props.height,
      width = this.props.width;
    const { visible } = this.props;
    // let filter;

    if (!visible) {
      return null;
    }
    // -----------------------------
    //   action buttons
    // -----------------------------
    const actions = (this.state.meta.table.actions || [])
      .map((action, index) => {
        if (!this.doubleclickAction && action.type === "detail") {
          this.doubleclickAction = action;
        }
        let disable = false;
        if (typeof action.disable === "function") {
          const row =
            this.range.end.rows !== undefined
              ? this.state.filteredData[this.range.end.rows]
              : { index_: undefined };
          const status = this.state.updatedRows[row.index_];
          disable = action.disable({ row, status });
        }
        return (
          <button
            key={index}
            disabled={disable}
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
      detail = detail(
        row,
        this.state.data,
        this.state.meta.properties,
        status,
        this.props.params,
        (4 +
          (betweens !== null) +
          this.state.selectedRange.end.rows -
          this.state.scroll.rows.startIndex) *
          this.rowHeight +
          this.state.scroll.rows.shift
      );
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
    //   const content:toolTip.errors.map(

    //  ? (
    //   <div
    //     key={"tool-tip"}
    //     className="zebulon-tool-tip"
    //     style={this.state.toolTip.style}
    //   >
    //     {this.state.toolTip.content}
    //   </div>
    // ) : null;
    // ----------------------------------
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
            height={
              height -
              (2 + (betweens !== null)) * this.rowHeight -
              (actions.length ? 30 : 0)
            }
            rowHeight={this.rowHeight}
            scroll={this.state.scroll.rows}
            updatedRows={this.state.updatedRows}
            selectRange={this.selectRange}
            meta={this.state.meta.properties}
            handleErrors={this.handleErrors}
          />
          <Rows
            meta={this.state.meta.properties}
            columnVisibleLength={this.state.meta.visibleLength}
            data={this.state.filteredData}
            height={
              height -
              (2 + (betweens !== null)) * this.rowHeight -
              (actions.length ? 30 : 0)
            }
            width={width - this.rowHeight}
            rowHeight={this.rowHeight}
            scroll={this.state.scroll}
            onScroll={this.onScroll}
            selectedRange={this.state.selectedRange}
            selectRange={this.selectRange}
            onChange={this.onChange}
            // onFocus={this.onFocus}
            onFocus={() => {}}
            updatedRows={this.state.updatedRows}
            // functions={this.props.functions}
            params={this.props.params}
            ref={ref => (this.rows = ref)}
          />
        </div>
        <div style={{ height: actions.length ? 30 : 0 }}>{actions}</div>
      </div>
    );
  }
}
