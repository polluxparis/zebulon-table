import { utils } from "zebulon-controls";
export const getFunction = (functions, object, type, value) => {
  if (typeof value === "function") {
    return value;
  }
  const v =
    typeof value === "string"
      ? functions
          .filter(
            f =>
              f.id === value &&
              f.tp === type &&
              (f.visibility === "global" || f.visibility === object)
          )
          .sort(
            (f0, f1) => (f0.visibility !== object) - (f1.visibility !== object)
          )
      : [];
  return v.length ? v[0].functionJS : undefined;
};
export const computeMetaPositions = meta => {
  let position = 0;
  meta.forEach((column, index) => {
    column.index_ = index;
    column.position = position;
    position += column.computedWidth;
  });
};
export const computeMeta = (meta, zoom = 1, functions) => {
  let position = 0;

  meta.visibleLength = 0;
  meta.row.descriptorFunction = getFunction(
    functions,
    meta.table.object,
    "accessor",
    meta.row.descriptor
  );
  meta.row.onQuitFunction = getFunction(
    functions,
    meta.table.object,
    "validator",
    meta.row.onQuit
  );
  meta.table.actions.forEach(action => {
    if (action.action) {
      action.actionFunction =
        typeof action.action === "function"
          ? action.action
          : getFunction(functions, meta.table.object, "action", action.action);
    }
    action.enableFunction = getFunction(
      functions,
      meta.table.object,
      "editable",
      action.enable
    );
  });
  meta.properties.forEach((column, index) => {
    if (column.id === "index_" && column.hidden === undefined) {
      column.hidden = true;
    }
    const width = zoom * (column.hidden ? 0 : column.width || 0);
    column.computedWidth = width;
    column.position = position;
    column.index_ = index;
    position += width;
    meta.visibleLength += width !== 0;
    column.editableFunction = getFunction(
      functions,
      meta.table.object,
      "editable",
      column.editable
    );
    column.formatFunction = getFunction(
      functions,
      meta.table.object,
      "format",
      column.format
    );
    const selectFunction = getFunction(
      functions,
      meta.table.object,
      "select",
      column.select
    );
    // select items can be defined as
    // - an array
    // - an object {id:caption...}
    // - an object {items:[select items],filter:[function to filter items with parameters as row,data...
    let select = column.select;
    if (selectFunction) {
      select = selectFunction({ column }); //a voir
      if (!Array.isArray(select) && typeof select === "object") {
        if (typeof select.filter === "function") {
          column.selectFilter = select.filter;
          column.selectItems = select.items || [""];
        } else column.selectItems = select || [""];
      } else column.selectItems = select || [""];
    }
    column.accessorFunction = getFunction(
      functions,
      meta.table.object,
      "accessor",
      column.accessor
    );
    column.defaultFunction = getFunction(
      functions,
      meta.table.object,
      "default",
      column.default
    );
    column.onChangeFunction = getFunction(
      functions,
      meta.table.object,
      "validator",
      column.onChange
    );
    column.onQuitFunction = getFunction(
      functions,
      meta.table.object,
      "validator",
      column.onQuit
    );

    if (!column.defaultFunction && column.default) {
      column.defaultFunction = () => {
        if (
          typeof column.default === "string" &&
          !(column.dataType === "string" || column.dataType === "text")
        ) {
          if (column.dataType === "boolean") {
            return column.default === "true";
          } else if (
            column.dataType === "number" &&
            utils.isNumber(column.default)
          ) {
            return Number(column.default);
          } else if (
            column.dataType === "date" &&
            utils.isDate(column.default)
          ) {
            return new Date(column.default);
          } else {
            return null;
          }
        } else {
          return column.default;
        }
      };
    }
    if (column.comparisonAccessor) {
      // a voir
      column.groupByAccessorFunction = getFunction(
        functions,
        meta.table.object,
        "accessor",
        column.groupByAccessor
      );
      column.sortAccessorFunction = getFunction(
        functions,
        meta.table.object,
        "accessor",
        column.sortAccessor || column.accessor
      );
      column.comparisonAccessorFunction = getFunction(
        functions,
        meta.table.object,
        "accessor",
        column.comparisonAccessor
      );
      column.startFunctionFunction = getFunction(
        functions,
        meta.table.object,
        "window",
        column.startFunction
      );
      column.endFunctionFunction = getFunction(
        functions,
        meta.table.object,
        "window",
        column.endFunction
      );
      column.aggregationFunction = getFunction(
        functions,
        meta.table.object,
        "aggregation",
        column.aggregation
      );
    }
  });
  // const a = buildObject(meta, null, functions);
};
// return meta;
// };
export const computeMetaFromData = (data, meta, zoom, functions) => {
  let position = 0;
  if (!meta.properties.length && data.length) {
    const row = data[0];
    Object.keys(row).forEach((key, index) => {
      let dataType = typeof row[key],
        filterType = "";
      if (dataType === "object") {
        if (utils.isDate(row[key])) {
          dataType = "date";
        } else {
          dataType = "object";
        }
        // format = dateToString;
      }
      let alignement = "unset";
      if (dataType === "string") {
        alignement = "left";
      } else if (dataType === "number") {
        alignement = "right";
        filterType = "between";
      } else if (dataType === "date") {
        alignement = "center";
        filterType = "between";
      }
      const width = 100;
      meta.properties.push({
        id: key,
        caption: key,
        tp: "Initial",
        width,
        dataType,
        alignement,
        hidden: dataType === "object" || key === "index_",
        position,
        editable: !!meta.table.editable,
        index_: index,
        formatFunction: x => x,
        selectFunction: undefined,
        filterType,
        v: null,
        vTo: null
      });
      position += width;
    });
  }
  computeMeta(meta, zoom, functions);
};

// -----------------------------------------------------------
// build a table of functions from the initial function object
// -----------------------------------------------------------
const functionsByObject = (object, functions) => {
  const f = functions[object];
  const f_ = [];
  Object.keys(f).forEach(type => {
    const tp = type.slice(0, type.length - 1);
    Object.keys(f[type]).forEach(code =>
      f_.push({
        id: code,
        visibility: object === "globals_" ? "global" : object,
        caption: code,
        tp,
        functionJS: f[type][code]
      })
    );
  });
  return f_;
};
export const functionsTable = functions => {
  return Object.keys(functions).reduce(
    (acc, object) => acc.concat(functionsByObject(object, functions)),
    []
  );
};
// -----------------------------------------------------------
// Error management
// -----------------------------------------------------------
export const manageRowError = (status, object, type, error) => {
  const existsErrors = !utils.isNullOrUndefined(status.errors);
  const errors = status.errors || {};
  const existsObject = !utils.isNullOrUndefined(errors[object]);
  const objectErrors = errors[object] || {};
  const existsType = !utils.isNullOrUndefined(objectErrors[type]);
  if (error) {
    objectErrors[type] = error;
    if (!existsType) {
      objectErrors.n_ = (objectErrors.n_ || 0) + 1;
    }
    if (!existsObject) {
      errors[object] = objectErrors;
    }
    errors.n_ = (errors.n_ || 0) + 1;
    if (!existsErrors) {
      status.errors = errors;
    }
  } else {
    if (existsType) {
      delete objectErrors[type];
      objectErrors.n_--;
      if (objectErrors.n_ === 0) {
        delete errors[object];
      }
      errors.n_--;
    }
  }
};
// -----------------------------------------------------------
// Export configuration
// -----------------------------------------------------------
const excludeProperties = {
  visibleLength: true,
  selectItems: true,
  selectFilter: true,
  // accessorFunction: true,
  // formatFunction: true,
  // defaultFunction: true,
  // alignement: true,
  position: true,
  index_: true
};
// const hasFunction = {
//   editable: true,
//   accessor: true,
//   select: true,
//   format: true,
//   disable: true,
//   action: true,
//   onChange: true,
//   onQuit: true,
//   descriptor: true
// };
// const getItem = (key, value, parent, functions) => {
//   let v = value;
//   if (!utils.isNullOrUndefined(v) && !excludes.includes(key)) {
//     if (typeof v === "function") {
//       v: parent;
//       // manage function
//     } else if (typeof v === "function") {
//       v: parent;
//       // manage function
//     } else if (typeof v === "function") {
//       v: parent;
//       // manage function
//     }
//   }
// };
export const buildObject = (item, excludes = excludeProperties) => {
  if (Array.isArray(item)) {
    return item.map(item => buildObject(item));
  } else if (typeof item === "object") {
    return Object.keys(item).reduce((acc, key) => {
      if (!utils.isNullOrUndefined(item[key]) && !excludes[key]) {
        acc[key] = buildObject(item[key]);
      }
      return acc;
    }, {});
  } else {
    return item;
  }
};

export const exportFunctions = functions => {
  const f = {};
  functions.forEach(fct => {
    if (!f[fct.visibility]) f[fct.visibility] = {};
    if (!f[fct.visibility][fct.tp]) f[fct.visibility][fct.tp] = {};
    f[fct.visibility][fct.tp][fct.id] = "~~~" + String(fct.functionJS) + "~~~";
  });
  return JSON.stringify(f)
    .replace(/"~~~/g, "")
    .replace(/~~~"/g, "")
    .replace(/\\n/g, "")
    .replace(/\\t/g, "")
    .replace(/\\"/g, '"');
};
// ----------------------------------
// common data access (row or fiels)
// ----------------------------------
export const cellData = (row, column, status, data, params, focused) => {
  const editable =
    // focused &&
    column.editableFunction
      ? column.editableFunction({
          row,
          status,
          data,
          params
        })
      : column.editable;
  let value = column.accessorFunction
    ? column.accessorFunction(row, params, status, data)
    : row[column.id];
  // if (column.formatFunction && !(editable && focused)) {
  //   value = column.formatFunction(value, row, params, status, data);
  // }
  let select = column.selectItems || column.select;
  if (
    editable &&
    focused &&
    column.selectFilter &&
    typeof column.selectFilter === "function"
  ) {
    select = column.selectFilter({
      row,
      status,
      data,
      params
    });
  }
  //  map the data
  if (select && !Array.isArray(select) && typeof select === "object") {
    if (!(editable && focused)) {
      value = (select[value] || {}).caption;
      select = null;
    } else select = Object.values(select);
  }
  return { editable, select, value };
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
export const computeData = ({ data, meta, updatedRows, params }) => {
  let columns = meta.properties.filter(
    column =>
      column.tp === "Computed" && typeof column.accessorFunction === "function"
  );
  columns.forEach(column => {
    column.dataType = typeof column.accessorFunction({
      row: data[0],
      status: updatedRows[data[0].index_],
      data,
      params
    });
  });
  data.forEach(row =>
    columns.forEach(
      column =>
        (row[column.id] = column.accessorFunction(
          row,
          updatedRows[row.index_],
          data,
          params
        ))
    )
  );
  columns = meta.properties.filter(
    column =>
      column.tp === "Analytic" && typeof column.accessorFunction === "function"
  );
  columns.forEach(column => {
    computeAnalytic(data, column);
  });
};
// const computeAnalytics = query => {
//   const measures = query.query.measures.filter(
//     measure => measure.tp === "analytics"
//   );
//   query.data = measures.reduce((data, measure) => {
//     query.measures[measure.id] = null;
//     return computeAnalytic(
//       data,
//       configurationFunctions.analytics[measure.id],
//       measure.id
//     );
//   }, query.data);
//   return query;
// };
const computeAnalytic = (data, column) => {
  let d = data.concat([]);
  let groups = [[]],
    min = 0,
    max;
  // sort;
  let sortAccessor =
    column.sortAccessorFunction || (row => row[column.sortAccessor]);
  let groupByAccessor =
    column.groupByAccessorFunction || (row => row[column.groupByAccessor]);
  // const a=[]
  // if (sortAccessor){
  //   sort = sortAccessor(data[0]);
  //   if (!Array.isArray(sort))
  const accessor = row => {
    let acc = [];
    if (groupByAccessor) {
      acc = acc.concat(groupByAccessor(row));
    }
    if (sortAccessor) {
      acc = acc.concat(sortAccessor(row));
    }
    return acc;
  };
  if (sortAccessor || groupByAccessor) {
    // const groupBy = groupByAccessorFunction(data[0]);
    //   const sort = groupByAccessorFunction(data[0]);
    //   if (Array.isArray(groupBy0)) {
    //     accessor = row => groupByAccessorFunction(row).concat(sortAccessor(row));
    //   } else {
    //     accessor = [groupByAccessorFunction(row)].concat(sortAccessor(row));
    //   }
    // } else {
    //    accessor = groupByAccessorFunction||sortAccessor;
    //     if(accessor){const groupBy0 = groupByAccessorFunction(data[0]);
    // }
    // const accessor=row=>{const gb=groupByAccessorFunction(row);sortAccessor(row)]);

    // if (sortAccessor) {
    //   const sortLength = Array.isArray(sortAccessor(d[0]))
    //     ? sortAccessor(d[0]).length
    //     : null;
    d.sort(sortFunction(accessor));
  }
  // group by and window interval
  d.forEach((row, index) => {
    row._index = groups[groups.length - 1].length;
    row._window = {
      ref: (column.comparisonAccessorFunction ||
        (row => row[column.comparisonAccessor]))(row),
      value: (column.accessorFunction || (row => row[column.accessor]))(row),
      groupBy: JSON.stringify(groupByAccessor(row))
    };
    row._window.start = column.startFunctionFunction(row._window.ref);
    row._window.end = column.endFunctionFunction(row._window.ref);
    if (index > 0 && row._window.groupBy !== d[index - 1]._window.groupBy) {
      groups.push([]);
    }
    groups[groups.length - 1].push(row);
  });
  // computation
  groups.forEach(group =>
    group.forEach((row, index) => {
      let i = index - 1,
        values = [row._window.value];
      while (i >= 0 && group[i]._window.ref >= row._window.start) {
        values.push(group[i]._window.value);
        i--;
      }
      i = index + 1;
      while (i < group.length && group[i]._window.ref <= row._window.end) {
        values.push(group[i]._window.value);
        i++;
      }
      row[column.id] = column.aggregationFunction(values);
    })
  );

  return data;
};
