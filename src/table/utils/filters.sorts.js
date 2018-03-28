import { utils } from "zebulon-controls";
import { getFunction } from "./compute.meta";
// ----------------------------
//  filters
//  ---------------------------
export const filterFunction = (column, params, data, updatedRows) => {
  const facc = row => {
    let f = column.accessorFunction;
    if (column.id === "status_") {
      const status = (updatedRows || {})[row.index_] || {};
      return (
        1 * (status.updated_ || 0) +
        2 * (status.new_ || 0) +
        4 * (status.deleted_ || 0) +
        8 * ((status.errors || { n_: 0 }).n_ > 0)
      );
    }
    if (!f) {
      if (column.accessor) {
        f = getFunction([], "", "accessor", column.accessor);
      } else {
        f = ({ row, column }) => row[column.id];
      }
    }
    return f({
      row,
      column,
      params,
      status: (updatedRows || {})[row.index_],
      data
    });
  };
  if (column.id === "status_") {
    column.f = row => {
      const vRow = facc(row);
      return vRow && (vRow & column.v) !== 0;
    };
  } else if (column.filterType === "values") {
    column.f = row => column.v[facc(row)] !== undefined;
  } else if (column.dataType === "boolean") {
    column.f = row => (facc(row) || false) === column.v;
  } else if (column.filterType === "=") {
    column.f = row => facc(row) === column.v;
  } else if (column.filterType === ">=") {
    column.f = row => facc(row) >= column.v;
  } else if (column.filterType === "between") {
    column.f = row => {
      return (
        (!utils.isNullOrUndefined(column.vTo)
          ? facc(row) <= column.vTo
          : true) &&
        (!utils.isNullOrUndefined(column.v) ? facc(row) >= column.v : true)
      );
    };
  } else if (column.filterType === "<=") {
    column.f = row => facc(row) <= column.v;
  } else if (column.filterType === "starts (case sensitive)") {
    column.f = row =>
      String(facc(row) || "").startsWith(String(column.v || ""));
  } else if (column.filterType === "starts") {
    const v = column.v.toUpperCase();
    column.f = row =>
      String(facc(row) || "")
        .toUpperCase()
        .startsWith(String(v) || "");
  }
};
// -----------------------------
export const filtersFunction = (filters, params, data, updatedRows) => {
  if (!filters) {
    return x => x;
  }
  const f = Object.values(filters)
    .filter(filter => {
      return (
        !utils.isNullOrUndefined(filter.v) ||
        (filter.filterType === "between" &&
          !utils.isNullOrUndefined(filter.vTo))
      );
    })
    .map(filter => {
      filterFunction(filter, params, data, updatedRows);
      return filter;
    });
  if (!f.length) {
    return x => x;
  }
  return row => {
    return f.reduce((acc, filter) => acc && filter.f(row), true);
  };
};
// -----------------------------
export const getFilters = (columns, filters) => {
  if (!columns.length) {
    return filters;
  }
  return columns.reduce((acc, column) => {
    let v = column.v,
      vTo = column.vTo,
      filterType = column.filterType;
    if (filters[column.id]) {
      (v = filters[column.id].v),
        (vTo = filters[column.id].vTo),
        (filterType = filters[column.id].filterType);
    }
    if (
      !utils.isNullOrUndefined(v) ||
      (column.filterType === "between" && !utils.isNullOrUndefined(column.vTo))
    ) {
      acc[column.id] = {
        id: column.id,
        filterType,
        v,
        vTo,
        accessor: column.accessor,
        accessorFunction: column.accessorFunction
      };
    }
    return acc;
  }, {});
};
// ----------------------------
//  sorts
//  ---------------------------
export const sortsFunction = sorts => {
  return (rowA, rowB) =>
    sorts.reduce((acc, sort) => {
      const accessor = sort.accessor || (({ row }) => row[sort.id]);
      if (acc === 0) {
        const a = accessor({ row: rowA }),
          b = accessor({ row: rowB });
        // if (sort.id !== "d") {
        //   console.log("sort", a, b);
        // }
        acc = ((a > b) - (b > a)) * (sort.direction === "asc" ? 1 : -1);
      }
      return acc;
    }, 0);
};
// -----------------------------------------
export const getSorts = columns => {
  const sorts = columns
    .filter(column => column.sort !== undefined)
    .map(column => {
      let nullValue = "";
      if (column.dataType === "number" || column.dataType === "boolean") {
        nullValue = null;
      } else if (column.dataType === "date") {
        nullValue = new Date(null);
      }
      return {
        id: column.id,
        sortOrder: column.sortOrder,
        direction: column.sort,
        accessor:
          column.sortAccessorFunction ||
          column.accessorFunction ||
          (({ row }) => {
            return utils.nullValue(row[column.id], nullValue);
          })
      };
    });
  sorts.sort(
    (a, b) => (a.sortOrder > b.sortOrder) - (b.sortOrder > a.sortOrder)
  );
  return sorts;
};
