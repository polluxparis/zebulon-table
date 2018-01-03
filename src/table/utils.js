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
export const computeMeta = (meta, functions) => {
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
    action.disableFunction = getFunction(
      functions,
      meta.table.object,
      "editable",
      action.disable
    );
  });
  meta.properties.forEach((column, index) => {
    const width = column.hidden ? 0 : column.width || 0;
    column.position = position;
    column.index_ = index;
    position += width;
    meta.visibleLength += width !== 0;
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
  });
  // const a = buildObject(meta, null, functions);
};
// return meta;
// };
export const computeMetaFromData = (data, meta, functions) => {
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
        hidden: dataType === "object",
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
  computeMeta(meta, functions);
};
// compute new description
export const computeData = ({ data, meta, updatedRows, params }) => {
  const columns = meta.properties.filter(
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
        (row[column.id] = column.accessorFunction({
          row,
          status: updatedRows[row.index_],
          data,
          params
        }))
    )
  );
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
