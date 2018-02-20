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
  adjustScrollRows = filteredDataLength => {
    if (this.state) {
      let { rows, columns } = this.state.scroll;
      if (
        filteredDataLength !== this.getFilteredDataLength &&
        rows.startIndex !== 0 &&
        rows.index +
          (rows.direction === 1 ? this.rowsHeight / this.rowHeight : 0) >
          filteredDataLength
      ) {
        rows = {
          index: 0,
          direction: 1,
          startIndex: 0,
          shift: 0,
          position: 0
        };
        this.setState({ scroll: { rows, columns } });
      }
    }
  };
  filters = (data, filters, noFocus, updatedRows) => {
    if (!Array.isArray(data)) {
      if (this.state && this.state.meta.serverPagination) {
        return this.pagination({
          filters,
          callbackAfter: page => {
            this.selectRange_(this.range, undefined, "enter", noFocus);
            this.adjustScrollRows(page.filteredDataLength);
          }
        });
      }
      return [];
    }
    const filter = filtersFunction(
      filters,
      this.props.params,
      data,
      updatedRows
    );
    const filteredData = data.filter(filter);
    this.adjustScrollRows(filteredData.length);
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
            label: (column.formatFunction ||
              (({ value }) =>
                utils.formatValue(value, null, column.decimals)))({
              value: label,
              column,
              row,
              params: this.props.params,
              status: updatedRows[row.index_],
              data: data
            })
          };
        });
        column.items = Object.values(items);
        column.items.sort(
          (itemA, itemB) =>
            (itemA.label > itemB.label) - (itemA.label < itemB.label)
        );
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
    filter.top = this.rowHeight + (this.state.meta.table.caption ? 30 : 0); // e.target.offsetParent.offsetTop; //this.nFilterRows * this.rowHeight;
    filter.left = e.target.offsetLeft;
    // column.position + this.rowHeight - this.state.scroll.columns.position;
    this.setState({
      openedFilter: column.id,
      filters: { ...this.state.filters, [column.id]: filter }
    });
  };

  onChangeFilter = (e, row, column, filterTo) => {
    const { selectedRange, filters, meta, data, updatedRows } = this.state;
    if (this.selectRange(selectedRange, this.row, "quit") === false)
      return false;
    this.closeOpenedWindows();
    const v = e;
    if (v === undefined) {
      return;
    }
    if ((v !== column.v && !filterTo) || (v !== column.vTo && filterTo)) {
      if (column.filterType === "between" && filterTo) {
        column.vTo = v;
      } else {
        column.v = v;
      }
      filters[column.id] = column;
      const filteredData = this.filters(data, filters, true, updatedRows);
      if (!meta.serverPagination) {
        this.sorts(filteredData, meta.properties);
        this.setState({ filteredData });
        this.selectRange(selectedRange, undefined, "enter", true);
      }
    }
  };
  onChangeFilterValues = filter => {
    this.setState({ openedFilter: undefined });
    const ok = this.props.onSave(ok => {
      if (ok) {
        this.onChangeFilterValues_(filter);
      }
    }, true);
    if (ok !== undefined) {
      this.onChangeFilterValues_(filter);
    }
  };
  onChangeFilterValues_ = filter => {
    const { openedFilter, filters, meta, data } = this.state;
    const column = filters[openedFilter];
    column.v = filter;
    filters[column.id] = column;
    const filteredData = this.filters(data, filters);
    if (!meta.serverPagination) {
      this.sorts(filteredData, meta.properties);
      this.setState({ filteredData });
      this.selectRange(this.range, undefined, "enter");
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
      this.props.onSort({
        sorts: columns,
        filteredData: data,
        data: this.props.data,
        params: this.props.params
      });
    }
  };
  onSort = (column, doubleClick) => {
    const { filteredData, meta } = this.state;
    this.closeOpenedWindows();
    if (this.selectRange(this.range, this.row) === false) {
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
      this.selectRange(this.range, undefined, "enter");
      this.setState({ filteredData: filteredData });
    }
  };
}
