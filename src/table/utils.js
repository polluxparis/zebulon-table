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
    column.selectFunction = getFunction(
      functions,
      meta.table.object,
      "select",
      column.select
    );
    column.accessorFunction = getFunction(
      functions,
      meta.table.object,
      "accessor",
      column.valueAccessor
    );
    column.defaultFunction =
      getFunction(functions, meta.table.object, "default", column.default) ||
      (() => {
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
      });
  });
  // return meta;
};
export const computeMetaFromData = (data, meta, functions) => {
  let position = 0;
  if (!meta.properties.length && data.length) {
    const row = data[0];
    Object.keys(row).forEach((key, index) => {
      let dataType = typeof row[key],
        filterType = "";
      if (dataType === "object" && utils.isDate(row[key])) {
        dataType = "date";
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
      // return meta;
    });
    // return meta;
  } else {
    computeMeta(meta, functions);
  }
};
// compute new description
export const computeData = ({ data, meta, updatedRows, params }) => {
  const columns = meta.properties.filter(
    column =>
      column.tp === "Computed" && typeof column.accessorFunction === "function"
  );
  columns.forEach(column => {
    // column.f = f[column.valueAccessor];
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
  // computeMeta(meta, f);
  // this.setState({
  //   data,
  //   meta: computeMeta(meta, f)
  // });
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
