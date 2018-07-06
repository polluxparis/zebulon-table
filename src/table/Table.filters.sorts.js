import { TableEvent } from "./Table.events";
import { utils } from "zebulon-controls";
import {
  filtersFunction,
  getSorts,
  sortsFunction
} from "./utils/filters.sorts";

export class TableFilterSort extends TableEvent {
  // ----------------------------------------
  // filtering
  // ----------------------------------------
  adjustScrollRows = filteredData => {
    if (this.state) {
      const { selectedRange, scroll, meta } = this.state;
      // let { rows, columns } = scroll;
      if (!filteredData.length) {
        selectedRange.end = {};
        selectedRange.start = {};
        this.hasFocus = false;
        this.bLoaded = undefined;
      } else if (selectedRange.end.rows === undefined) {
        const columns = (meta.visibleIndexes || [0])[0];
        selectedRange.end = { rows: 0, columns };
        selectedRange.start = { rows: 0, columns };
        this.bLoaded = true;
        this.scrollTo(
          selectedRange.end.rows,
          1,
          selectedRange.end.columns,
          scroll.columns.direction,
          false,
          filteredData.length
        );
      } else if (selectedRange.end.rows > filteredData.length - 1) {
        selectedRange.end.rows = filteredData.length - 1;
        this.scrollTo(
          selectedRange.end.rows,
          1,
          selectedRange.end.columns,
          scroll.columns.direction,
          false,
          filteredData.length
        );
      } else {
        this.scrollTo(
          selectedRange.end.rows,
          scroll.rows.direction,
          selectedRange.end.columns,
          scroll.columns.direction,
          false,
          filteredData.length
        );
      }
      return filteredData[selectedRange.end.rows];
    }
  };
  filters = (data, filters, noFocus, updatedRows) => {
    if (!Array.isArray(data)) {
      return [];
    }
    const filter = filtersFunction(
      filters,
      this.props.params,
      data,
      updatedRows
    );
    const filteredData = data.filter(filter);
    if (this.props.onFilter) {
      this.props.onFilter({
        filters,
        filteredData,
        data,
        params: this.props.params,
        updatedRows
      });
    }
    return filteredData;
  };
  // a voir si pagination server ???
  //
  getFilterItems = (filter, column) => {
    const { meta, data, updatedRows } = this.state;
    if (!meta.serverPagination) {
      if (!filter || !filter.items) {
        const items = {};
        this.props.data.forEach(row => {
          const id = (column.accessorFunction ||
            (({ row }) => row[column.id]))({
            row,
            column,
            status: updatedRows[row.index_],
            params: this.props.params,
            data: data
          }); // a voir status
          const label =
            column.selectItems &&
            !column.reference &&
            !Array.isArray(column.selectItems) &&
            typeof column.selectItems === "object"
              ? (column.selectItems[id] || {}).caption
              : id;
          items[id] = {
            id,
            label:
              (column.formatFunction ||
                (({ value }) =>
                  utils.formatValue(value, null, column.decimals)))({
                value: label,
                column,
                row,
                params: this.props.params,
                status: updatedRows[row.index_],
                data: data
              }) || id
          };
        });
        column.items = Object.values(items);
        column.items.sort((itemA, itemB) => {
          return utils.isNullValue(itemA.label)
            ? -1
            : (itemA.label > itemB.label) - (itemA.label < itemB.label);
        });
        filter = column;
      }
    } else {
      column.items = [];
      filter = column;
    }
    return filter;
  };
  openFilter = (e, column) => {
    if (this.isOpening) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.persist();
    let filter = this.state.filters[column.id];
    filter = this.getFilterItems(filter, column);
    filter.top = this.rowHeight + (this.state.meta.table.caption ? 30 : 0); // e.target.offsetParent.offsetTop; //this.nFilterRows * this.rowHeight;
    filter.left = e.target.offsetLeft;
    const ok = this.canQuit("rowQuit", ok => {
      if (ok) {
        return this.openFilter_(e, column, filter);
      }
    });
    if (ok) {
      return this.openFilter_(e, column, filter);
    }
  };
  openFilter_ = (e, column, filter) => {
    if (column.filterType !== "values") {
      e.target.focus();
      this.hasFocus = false;
      return this.closeOpenedWindows();
    }
    // column.position + this.rowHeight - this.state.scroll.columns.position;
    // console.log("filtersort", this.hasFocus);
    this.hasFocus = false;
    this.setState({
      openedFilter: column.id,
      filters: { ...this.state.filters, [column.id]: filter }
    });
  };
  onChangeFilter = (e, row, column, filterTo) => {
    const ok = this.props.onTableChange("filter", ok => {
      if (ok) {
        this.onChangeFilter_(e, row, column, filterTo);
      }
    });
    if (ok) {
      this.onChangeFilter_(e, row, column, filterTo);
    }
  };
  onChangeFilter_ = (e, row, column, filterTo) => {
    const { selectedRange, filters, meta, data, updatedRows } = this.state;
    // const ok = this.selectRange(selectedRange, undefined, this.row, "quit");
    // return false;
    this.closeOpenedWindows();
    const v = e;
    if (v === undefined) {
      return;
    }
    if ((v !== column.v && !filterTo) || (v !== column.vTo && filterTo)) {
      this.hasFocus = false;
      if (column.filterType === "between" && filterTo) {
        column.vTo = v;
      } else {
        column.v = v;
      }
      filters[column.id] = column;
      this.changingFilter = true;
      const filteredData = this.filters(data, filters, true, updatedRows);
      // if (!meta.serverPagination) {
      this.sorts(filteredData, meta.properties);
      this.setState({ filteredData });
      this.selectRange(
        selectedRange,
        undefined,
        this.adjustScrollRows(filteredData),
        "enter",
        true
      );
      // }
    }
  };
  onChangeFilterValues = filter => {
    const openedFilter = this.state.openedFilter;
    this.setState({ openedFilter: undefined });
    const ok = this.props.onTableChange("filter", ok => {
      if (ok) {
        this.onChangeFilterValues_(openedFilter, filter);
      }
    });
    if (ok) {
      this.onChangeFilterValues_(openedFilter, filter);
    }
  };
  onChangeFilterValues_ = (openedFilter, filter) => {
    const { filters, meta, data } = this.state;
    const column = filters[openedFilter];
    column.v = filter;
    filters[column.id] = column;
    const filteredData = this.filters(data, filters);
    // if (!meta.serverPagination) {
    this.sorts(filteredData, meta.properties);
    this.setState({ filteredData });
    this.selectRange(
      this.range,
      undefined,
      this.adjustScrollRows(filteredData),
      "enter"
    );
    // }
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
            this.selectRange_(this.range, undefined, undefined, "enter");
          }
        });
      }
      return [];
    }
    if (sorts.length) {
      data.sort(sortsFunction(sorts));
    }
    if (this.props.onSort) {
      this.props.onSort({
        sorts: columns,
        filteredData: data,
        data: this.props.data,
        params: this.props.params
      });
    }
  };
  onSort = (column, doubleClick) => {
    if (!this.state.meta.table.noOrder) {
      const ok = this.props.onTableChange("sort", ok => {
        if (ok) {
          this.onSort_(column, doubleClick);
        }
      });
      if (ok) {
        this.onSort_(column, doubleClick);
      }
    }
  };
  onSort_ = (column, doubleClick) => {
    const { filteredData, meta } = this.state;
    this.closeOpenedWindows();
    if (this.selectRange(this.range, undefined, this.row, "quit") === false) {
      return false;
    }
    const columns = meta.properties;
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
    this.sorts(filteredData, columns);
    if (!meta.serverPagination) {
      this.selectRange(this.range, undefined, undefined, "enter");
      this.setState({ filteredData: filteredData });
    }
  };
}
// const dataStrings = computeRowSearch(this.state.data, this.state.meta, {});
//    const indexes = rowSearch(dataStrings, "22/02");
