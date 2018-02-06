import { utils } from "zebulon-controls";
export const getFunction = (functions, object, type, value) => {
  if (typeof value === "function") {
    return value;
  } else if (typeof value === "string") {
    const indexDot = value.indexOf(".");
    if (indexDot !== -1) {
      let v = value;
      if (value.slice(0, indexDot) === "row") {
        v = value.slice(indexDot);
      }
      const keys = v.split(".");
      return ({ row }) => {
        return keys.reduce(
          (acc, key, index) =>
            acc[key] === undefined && index < keys.length - 1 ? {} : acc[key],
          row
        );
      };
    } else {
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
                (f0, f1) =>
                  (f0.visibility !== object) - (f1.visibility !== object)
              )
          : [];
      return v.length ? v[0].functionJS : undefined;
    }
  }
};
export const computeMetaPositions = (meta, zoom) => {
  let position = 0;
  const visibleIndexes = [];
  meta.forEach((column, index) => {
    column.index_ = index;
    column.position = position;
    if (zoom !== undefined) {
      column.computedWidth = zoom * (column.hidden ? 0 : column.width || 0);
      if (column.computedWidth !== 0) {
        column.visibleIndex_ = visibleIndexes.length;
        visibleIndexes.push(column.index_);
      }
    }
    position += column.computedWidth;
  });
  return visibleIndexes;
};
export const computeMeta = (meta, zoom = 1, functions) => {
  let position = 0;
  // table
  meta.visibleIndexes = [];
  meta.table.selectFunction = getFunction(
    functions,
    meta.table.object,
    "dml",
    meta.table.onSave
  );
  meta.table.onSaveFunction = getFunction(
    functions,
    meta.table.object,
    "dml",
    meta.table.onSave
  );
  meta.table.onSaveBeforeFunction = getFunction(
    functions,
    meta.table.object,
    "dml",
    meta.table.onSaveBefore
  );
  meta.table.onSaveAfterFunction = getFunction(
    functions,
    meta.table.object,
    "dml",
    meta.table.onSaveAfter
  );
  meta.row.descriptorFunction = getFunction(
    functions,
    meta.table.object,
    "accessor",
    meta.row.descriptor
  );
  // row
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
  // properties
  meta.properties.forEach((column, index) => {
    if (column.id === "index_" && column.hidden === undefined) {
      column.hidden = true;
    }
    const width = zoom * (column.hidden ? 0 : column.width || 0);
    column.computedWidth = width;
    column.position = position;
    column.index_ = index;
    position += width;
    if (width !== 0) {
      column.visibleIndex_ = meta.visibleIndexes.length;
      meta.visibleIndexes.push(column.index_);
    }
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
        } else {
          column.selectItems = select || [""];
        }
      } else {
        column.selectItems = select || [""];
      }
    } else {
      column.selectItems = select || [""];
    }
    // reference to an object
    if (
      column.accessor &&
      typeof column.accessor === "string" &&
      column.accessor.indexOf(".") !== -1
    ) {
      column.reference = column.accessor.slice(0, column.accessor.indexOf("."));
      const referencedColumn = meta.properties.find(
        col => col.id === column.reference
      );
      column.primaryKeyAccessorFunction = getFunction(
        functions,
        meta.table.object,
        "accessor",
        referencedColumn.primaryKeyAccessor
      );
      column.setForeignKeyAccessorFunction = getFunction(
        functions,
        meta.table.object,
        "setAccessor",
        referencedColumn.setForeignKeyAccessor
      );
    }
    column.accessorFunction = getFunction(
      functions,
      meta.table.object,
      "accessor",
      column.accessor
    );
    column.primaryKeyAccessorFunction = getFunction(
      functions,
      meta.table.object,
      "accessor",
      column.primaryKeyAccessor
    );
    column.setForeignKeyAccessorFunction = getFunction(
      functions,
      meta.table.object,
      "setAccessor",
      column.setForeignKeyAccessorFunction
    );
    column.sortAccessorFunction = getFunction(
      functions,
      meta.table.object,
      "accessor",
      column.sortAccessor || column.accessor
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
    if (column.aggregation) {
      // a voir
      column.groupByAccessorFunction = getFunction(
        functions,
        meta.table.object,
        "accessor",
        column.groupByAccessor
      );
      column.comparisonAccessorFunction = getFunction(
        functions,
        meta.table.object,
        "accessor",
        column.comparisonAccessor
      );
      column.aggregationFunction = getFunction(
        functions,
        meta.table.object,
        "aggregation",
        column.aggregation
      );
      column.startFunction = getFunction(
        functions,
        meta.table.object,
        "window",
        column.windowStart
      );
      column.endFunction = getFunction(
        functions,
        meta.table.object,
        "window",
        column.windowEnd
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
      } else if (
        dataType === "string" &&
        row[key] === new Date(row[key]).toJSON()
      ) {
        dataType = "date";
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
        formatFunction: ({ value }) => value,
        selectFunction: undefined,
        filterType,
        v: null,
        vTo: null
      });
      position += width;
    });
  }
  computeMeta(meta, zoom, functions);
  // computeData({ data, meta });
  // const columns = meta.properties.filter(
  //   column =>
  //     column.aggregation && typeof column.accessorFunction === "function"
  // );
  // columns.forEach(column => {
  //   computeAnalytic(data, column);
  // });
};
export const computeData = (data, meta, startIndex) => {
  let foreignObjects = [];
  const calcIndex = data[0] && data[0].index_ === undefined;
  const calcObjects = calcIndex || meta.serverPagination;
  if (calcObjects) {
    foreignObjects = meta.properties.filter(
      column => column.primaryKeyAccessor !== undefined
    );
  }
  if (calcIndex || calcObjects) {
    data.forEach((row, index) => {
      if (calcIndex) {
        row.index_ = index + (startIndex || 0);
      }
      if (calcObjects) {
        foreignObjects.forEach(
          column => (row[column.id] = column.accessorFunction({ row }))
        );
      }
    });
  }
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
  if (functions === undefined) {
    return [];
  }
  return Object.keys(functions).reduce(
    (acc, object) => acc.concat(functionsByObject(object, functions)),
    []
  );
};
// -----------------------------------------------------------
// Error management
// -----------------------------------------------------------
export const manageRowError = (updatedRows, index, object, type, error) => {
  const status = updatedRows[index];
  const existsErrors = !utils.isNullOrUndefined(status.errors);
  const errors = status.errors || {};
  const existsObject = !utils.isNullOrUndefined(errors[object]);
  const objectErrors = errors[object] || {};
  const existsType = !utils.isNullOrUndefined(objectErrors[type]);
  if (error) {
    objectErrors[type] = error;
    if (!existsType) {
      objectErrors.n_ = (objectErrors.n_ || 0) + 1;
      if (!existsObject) {
        errors[object] = objectErrors;
      }
      errors.n_ = (errors.n_ || 0) + 1;
      if (!existsErrors) {
        status.errors = errors;
      }
      updatedRows.nErrors = (updatedRows.nErrors || 0) + 1;
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
export const getRowErrors = (status, rowIndex) => {
  const errors = [];
  Object.keys(status.errors).forEach(column => {
    if (status.errors[column] || column !== "n_") {
      Object.keys(status.errors[column]).forEach(type => {
        if (type !== "n_") {
          errors.push({
            column,
            type,
            error: status.errors[column][type],
            rowIndex
          });
        }
      });
    }
  });
  return errors;
};
export const getErrors = updatedRows => {
  const errors = [];
  let errorIndex = 0;
  Object.values(updatedRows).forEach(status => {
    if ((status.errors || {}).n_) {
      errors.push(...getRowErrors(status, status.row.index_));
    }
  });
  return errors;
};
// -----------------------------------------------------------
// Export configuration
// -----------------------------------------------------------
const excludeProperties = {
  visibleIndexes: true,
  selectItems: true,
  selectFilter: true,
  // accessorFunction: true,
  // formatFunction: true,
  // defaultFunction: true,
  // alignement: true,
  position: true,
  index_: true,
  visibleIndex_: true
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
          column,
          row,
          status: status || {},
          data,
          params
        })
      : column.editable;
  //  dont use accessor for analytics computed data
  let value = column.aggregation
    ? row[column.id]
    : column.accessorFunction
      ? column.accessorFunction({ column, row, params, status, data })
      : row[column.id];
  if (column.dataType === "date" && typeof value === "string") {
    value = new Date(value);
  }
  // if (column.formatFunction && !(editable && focused)) {
  //   value = column.formatFunction(value, row, params, status, data);
  // }

  let select = column.select ? column.selectItems || column.select : undefined;
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
  if (
    select &&
    !Array.isArray(select) &&
    typeof select === "object" &&
    !column.accessorFunction
  ) {
    if (!(editable && focused)) {
      // if (column.reference){value=
      value = (select[value] || {}).caption;
      select = null;
    } else select = Object.values(select);
  }
  return { editable, select, value };
};
// ----------------------------
//  filters
//  ---------------------------
export const filterFunction = (column, params, data, updatedRows) => {
  const facc = row => {
    let f = column.accessorFunction;
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
  if (column.filterType === "values") {
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
  } else {
    column.f = row =>
      String(facc(row) || "").startsWith(String(column.v || ""));
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
        filter.v !== null ||
        (filter.filterType === "between" && filter.vTo !== null)
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
    if (
      !utils.isNullOrUndefined(column.v) ||
      (column.filterType === "between" && !utils.isNullOrUndefined(column.vTo))
    ) {
      acc[column.id] = {
        id: column.id,
        filterType: column.filterType,
        v: column.v,
        vTo: column.vTo,
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
// export const computeData = ({ data, meta, updatedRows, params }) => {
//   // let columns = meta.properties.filter(
//   //   column =>
//   //     column.tp === "Computed" && typeof column.accessorFunction === "function"
//   // );
//   // columns.forEach(column => {
//   //   column.dataType = typeof column.accessorFunction({
//   //     row: data[0],
//   //     column,
//   //     status: updatedRows[data[0].index_],
//   //     data,
//   //     params
//   //   });
//   // });
//   // data.forEach(row =>
//   //   columns.forEach(
//   //     column =>
//   //       (row[column.id] = column.accessorFunction(
//   //         row,
//   //         updatedRows[row.index_],
//   //         data,
//   //         params
//   //       ))
//   //   )
//   // );
//   columns = meta.properties.filter(
//     column =>
//       column.aggregation && typeof column.accessorFunction === "function"
//   );
//   columns.forEach(column => {
//     computeAnalytic(data, column);
//   });
// };
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
export const computeAnalytic = (data, column) => {
  let d = data.concat([]);
  let groups = [[]],
    min = 0,
    max;
  // sort;
  let sortAccessor =
    column.sortAccessorFunction || (({ row }) => row[column.sortAccessor]);
  let groupByAccessor =
    column.groupByAccessorFunction ||
    (({ row }) => row[column.groupByAccessor]);
  // const a=[]
  // if (sortAccessor){
  //   sort = sortAccessor(data[0]);
  //   if (!Array.isArray(sort))
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
export const getSelection = (
  type = "xls",
  selectedRange,
  columns,
  filteredData,
  updatedRows,
  data,
  params
) => {
  const columnSeparator = type === "csv" ? "," : "\t";
  const rowStart = Math.min(selectedRange.start.rows, selectedRange.end.rows);
  const rowEnd = Math.max(selectedRange.start.rows, selectedRange.end.rows);
  const columnStart = Math.min(
    selectedRange.start.columns,
    selectedRange.end.columns
  );
  const columnEnd = Math.max(
    selectedRange.start.columns,
    selectedRange.end.columns
  );
  const outputs = [];
  let output = "";
  for (let iColumn = columnStart; iColumn <= columnEnd; iColumn++) {
    if (!columns[iColumn].hidden) {
      output += columnSeparator + JSON.stringify(columns[iColumn].caption);
    }
  }
  outputs.push(output.slice(1));
  for (let iRow = rowStart; iRow <= rowEnd; iRow++) {
    const row = filteredData[iRow];
    output = "";
    for (let iColumn = columnStart; iColumn <= columnEnd; iColumn++) {
      const column = columns[iColumn];
      if (!column.hidden) {
        let value = cellData(
          row,
          column,
          updatedRows[row.index_],
          data,
          params,
          true
        ).value;
        if (utils.isNullOrUndefined(value)) {
          value = "";
        } else if (column.dataType === "date" && value !== null) {
          value = utils.dateToString(value, undefined || "dd/mm/yyyy");
        }
        output += columnSeparator + JSON.stringify(value);
      }
    }
    outputs.push(output.slice(1));
  }
  return outputs.join("\n");
};
export const buildPasteArray = (
  type = "xls",
  clipboard,
  columns,
  selectedCell,
  selectCell,
  onChange,
  filteredData,
  updatedRows,
  data,
  params
) => {
  const columnSeparator = type === "csv" ? "," : "\t";
  // let { columnIndex, rowIndex } = cell;
  const lines = clipboard.replace(/\r/g, "").split("\n");
  lines.pop();
  const cells = lines.map(line => line.split(columnSeparator));
  const nRows = lines.length,
    nColumns = cells[0].length;
  cells.forEach((rowCells, rowIndex) => {
    const cell = {};
    const row = filteredData[selectedCell.rows + rowIndex];
    let columnIndex = 0;
    rowCells.forEach(value => {
      cell.rows = selectedCell.rows + rowIndex;
      cell.columns = selectedCell.columns + columnIndex;
      let column = columns[cell.columns];
      while (
        column.hidden &&
        selectedCell.columns + columnIndex < columns.length
      ) {
        columnIndex++;
        cell.columns = selectedCell.columns + columnIndex;
        column = columns[cell.columns];
      }
      columnIndex++;
      const editable = column.editableFunction
        ? column.editableFunction({
            column,
            row,
            status: updatedRows[row.index_] || {},
            data,
            params
          })
        : column.editable;
      if (editable) {
        if (!selectCell(cell)) {
          return;
        }
        let v = value;
        const { dataType, format } = column;
        if (column.reference && column.selectItems) {
          const item = Object.values(column.selectItems).find(
            item =>
              column.accessorFunction({ row: { [column.reference]: item } }) ===
              v
          );
          row[column.reference] = item;
          if (column.setForeignKeyAccessorFunction) {
            column.setForeignKeyAccessorFunction({
              value: column.primaryKeyAccessorFunction({
                row: { [column.reference]: item }
              }),
              row
            });
          }
        } else {
          if (dataType === "boolean") {
            v = v === "true";
          } else if (dataType === "date") {
            v = utils.stringToDate(v, format);
          } else if (dataType === "number") {
            v = v === "" ? null : Number(value);
          }
          row[column.id] = v;
        }

        if (!onChange(v, row, column)) {
          return;
        }
      }
    });
  });
  return cells;
  // let iRow = 0,
  //   iColumn = 0,
  //   measure,
  //   data = [];
  // const columnSeparator = type === "csv" ? "," : "\t";
  // const rowStart = Math.min(selectedRange.start.rows, selectedRange.end.rows);
  // const rowEnd = Math.max(selectedRange.start.rows, selectedRange.end.rows);
  // const columnStart = Math.min(
  //   selectedRange.start.columns,
  //   selectedRange.end.columns
  // );
  // const columnEnd = Math.max(
  //   selectedRange.start.columns,
  //   selectedRange.end.columns
  // );
  // const outputs = [];
  // let output = "";
  // for (let iColumn = columnStart; iColumn <= columnEnd; iColumn++) {
  //   if (!columns[iColumn].hidden) {
  //     output += columnSeparator + JSON.stringify(columns[iColumn].caption);
  //   }
  // }
  // outputs.push(output.slice(1));
  // for (let iRow = rowStart; iRow <= rowEnd; iRow++) {
  //   const row = filteredData[iRow];
  //   output = "";
  //   for (let iColumn = columnStart; iColumn <= columnEnd; iColumn++) {
  //     const column = columns[iColumn];
  //     if (!column.hidden) {
  //       let value = cellData(
  //         row,
  //         column,
  //         updatedRows[row.index_],
  //         data,
  //         params,
  //         true
  //       ).value;
  //       if (utils.isNullOrUndefined(value)) {
  //         value = "";
  //       } else if (column.dataType === "date" && value !== null) {
  //         value = utils.dateToString(value, undefined || "dd/mm/yyyy");
  //       }
  //       output += columnSeparator + JSON.stringify(value);
  //     }
  //   }
  //   outputs.push(output.slice(1));
  // }
  // return outputs.join("\n");
};
