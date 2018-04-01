import { utils } from "zebulon-controls";
// ----------------------------------
// common data access (row or fiels)
// ----------------------------------
export const cellData = (row, column, status, data, params, focused) => {
  const editable =
    // focused &&
    !(status || {}).deleted_ &&
    (column.editableFunction
      ? column.editableFunction({
          column,
          row,
          status: status || {},
          data,
          params
        })
      : column.editable);
  //  dont use accessor for analytics computed data
  let value = column.aggregation
    ? row[column.id]
    : column.accessorFunction
      ? column.accessorFunction({ column, row, params, status, data })
      : row[column.id];
  if (column.dataType === "date" && typeof value === "string") {
    value = new Date(value);
  }

  let select =
    column.select && editable && focused
      ? column.selectItems || column.select
      : undefined;
  //  map the data
  if (select) {
    if (column.selectFunction && editable && focused && !column.selectItems) {
      select = column.selectFunction({ column, row, data });
    }
    if (
      !utils.isPromise(select) &&
      !Array.isArray(select) &&
      typeof select === "object" &&
      !column.accessorFunction
    ) {
      select = Object.values(select);
    }
  }
  return { editable, select, value };
};
export const computeRows = (data, meta, startIndex) => {
  let foreignObjects = [];
  foreignObjects = meta.properties.filter(
    column =>
      column.dataType === "joined object" && column.accessor !== undefined
  );
  const pk = meta.table.pk;
  const lk = meta.table.lk;

  data.forEach((row, index) => {
    // if (calcIndex) {
    row.index_ = index + (startIndex || 0);
    // }
    if (pk) {
      meta.indexPk[row[pk.id]] = row.index_;
    }
    if (lk) {
      meta.indexLk[row[lk.id]] = row.index_;
    }
    foreignObjects.forEach(
      column => (row[column.id] = column.accessorFunction({ row }))
    );
    if (meta.table.noDataMutation) {
      data[index] = { ...row };
    }
  });
};
export const computeAnalytics = (data, meta) => {
  const columns = meta.properties.filter(
    column =>
      column.aggregation &&
      typeof column.accessorFunction === "function" &&
      !column.hidden
  );
  columns.forEach(column => {
    computeAnalytic(data, column);
  });
};
export const computeData = (data, meta, startIndex) => {
  computeRows(data, meta, startIndex);
  computeAnalytics(data, meta);
};
// ----------------------------
//  aggregations
//  ---------------------------
export const aggregations = {
  count: values => values.length,
  sum: values => values.reduce((sum, value) => (sum += value), null),
  min: values =>
    values.reduce(
      (min, value) => (min = min === null || value < min ? value : min),
      null
    ),
  max: values =>
    values.reduce(
      (max, value) => (max = max === null || value > max ? value : max),
      null
    ),
  avg: values =>
    values.length === 0 ? null : aggregations.sum(values) / values.length,
  weighted_avg: values => {
    const wavg = values.reduce(
      (wavg, value) => {
        wavg.v0 += value.v0;
        wavg.v1 += value.v1;
        return wavg;
      },
      { v0: null, v1: null }
    );
    return wavg.v0 === 0 && wavg.v1 === 0 ? null : wavg.v0 / wavg.v1;
  },
  delta: values => {
    const delta = values.reduce(
      (delta, value) => {
        delta.v0 += value.v0;
        delta.v1 += value.v1;
        return delta;
      },
      { v0: null, v1: null }
    );
    return delta.v0 - delta.v1;
  },
  prod: values => values.reduce((prod, value) => (prod *= value), null)
};
// -------------------------------------
// compute new description
// -------------------------------------
const sortFunction = accessor => (rowA, rowB) => {
  const a = accessor(rowA),
    b = accessor(rowB);
  let x = 0,
    i = 0;

  while (!x && i < a.length) {
    x = (a[i] > b[i]) - (b[i] > a[i]);
    i++;
  }

  return x;
};
export const computeAnalytic = (data, column) => {
  let d = data.concat([]);
  let groups = [[]];
  // sort;
  let sortAccessor =
    column.sortAccessorFunction || (({ row }) => row[column.sortAccessor]);
  let groupByAccessor =
    column.groupByAccessorFunction ||
    (({ row }) => row[column.groupByAccessor]);
  const accessor = row => {
    let acc = [];
    if (groupByAccessor) {
      acc = acc.concat(groupByAccessor({ row }));
    }
    if (sortAccessor) {
      acc = acc.concat(sortAccessor({ row }));
    }
    return acc;
  };
  if (sortAccessor || groupByAccessor) {
    d.sort(sortFunction(accessor));
  }
  // group by and window interval
  let values = [];
  d.forEach((row, index) => {
    row._index = groups[groups.length - 1].length;
    row._window = {
      value: (column.accessorFunction || (({ row }) => row[column.accessor]))({
        row
      }),
      groupBy: JSON.stringify(groupByAccessor({ row }))
    };
    if (column.comparisonAccessor) {
      row._window.ref = (column.comparisonAccessorFunction ||
        (row => row[column.comparisonAccessor]))({ row });
      if (column.windowStart) {
        row._window.start = column.startFunction(row._window.ref);
      }
      if (column.windowEnd) {
        row._window.end = column.endFunction(row._window.ref);
      }
    }
    if (index > 0 && row._window.groupBy !== d[index - 1]._window.groupBy) {
      if (!column.comparisonAccessor) {
        const value = column.aggregationFunction(values);
        groups[groups.length - 1].forEach(row => (row[column.id] = value));
        values = [];
      }
      groups.push([]);
    }
    if (!column.comparisonAccessor) {
      values.push(row._window.value);
    }
    groups[groups.length - 1].push(row);
  });
  // computation
  if (column.comparisonAccessor) {
    groups.forEach(group =>
      group.forEach((row, index) => {
        let i = index - 1,
          values = [row._window.value];
        while (
          i >= 0 &&
          (row._window.start === undefined ||
            group[i]._window.ref >= row._window.start)
        ) {
          values.push(group[i]._window.value);
          i--;
        }
        i = index + 1;
        while (
          i < group.length &&
          (row._window.end === undefined ||
            group[i]._window.ref <= row._window.end)
        ) {
          values.push(group[i]._window.value);
          i++;
        }
        row[column.id] = column.aggregationFunction(values);
      })
    );
  }

  return data;
};
export const computeAudit = (row, meta, audits) => {
  const rows = [];

  if (audits.length) {
    const audits_ = [...audits].reverse();
    let nextRow = row;
    audits_.forEach(audit => {
      nextRow = { ...nextRow, ...audit };
      rows.push(nextRow);
    });
    const foreignObjects = meta.properties.filter(
      column => column.dataType === "joined object"
    );
    if (foreignObjects.length) {
      rows.forEach(row => {
        foreignObjects.forEach(
          column => (row[column.id] = column.accessorFunction({ row }))
        );
      });
    }
  }
  return rows;
};
