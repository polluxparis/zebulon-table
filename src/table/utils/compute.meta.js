import { utils } from "zebulon-controls";
export const getFunction = (functions, object, type, value) => {
  if (typeof value === "function") {
    return value;
  } else if (typeof value === "string") {
    const indexDot = value.indexOf(".");
    if (indexDot !== -1) {
      let v = value;
      if (value.slice(0, indexDot) === "row") {
        v = value.slice(indexDot + 1);
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
export const getSizes = (meta, rowHeight) => {
  const headersLength =
    1 +
    !meta.table.noFilter *
      (1 +
        (meta.properties.findIndex(
          column => column.filterType === "between"
        ) !==
          -1));
  const headersHeight =
    (meta.table.caption ? 30 : 0) +
    headersLength * rowHeight * meta.zoom +
    ((meta.table.actions || []).length ? 30 : 0);

  const lastColumn = meta.properties[meta.properties.length - 1];
  const rowWidth = lastColumn.position + lastColumn.computedWidth;
  const headersWidth = !meta.table.noStatus * rowHeight * meta.zoom;
  return {
    headersHeight,
    headersWidth,
    rowWidth,
    rowHeight: rowHeight * meta.zoom
  };
};
export const computeMetaPositions = (meta, zoom) => {
  let position = 0;
  meta.visibleIndexes = [];
  meta.lockedIndex = null;
  meta.lockedWidth = null;
  meta.properties.forEach((column, index) => {
    column.index_ = index;
    column.position = position;
    if (column.dataType === "object" || column.dataType === "joined object") {
      column.hidden = true;
    }
    if (zoom !== undefined) {
      column.computedWidth = zoom * (column.hidden ? 0 : column.width || 0);
    }
    if (column.computedWidth !== 0) {
      column.visibleIndex_ = meta.visibleIndexes.length;
      meta.visibleIndexes.push(column.index_);
    }
    position += column.computedWidth;
    if (column.locked) {
      meta.lockedIndex = column.index_;
      meta.lockedWidth = position;
    }
  });
  return meta.visibleIndexes;
};
export const computeMeta = (meta, zoom = 1, functions) => {
  let position = 0;
  // table
  meta.visibleIndexes = [];
  meta.table.editable = meta.table.editable && !meta.table.checkable;
  meta.zoom = zoom;
  meta.table.selectFunction = getFunction(
    functions,
    meta.table.object,
    "dml",
    meta.table.onSave
  );
  meta.table.onTableChangeFunction = getFunction(
    functions,
    meta.table.object,
    "dml",
    meta.table.onTableChange
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
  meta.row.auditFunction = getFunction(
    functions,
    meta.table.object,
    "accessor",
    meta.row.audit
  );
  if (meta.table.actions) {
    meta.table.actions.forEach(action => {
      if (action.action) {
        action.actionFunction =
          typeof action.action === "function"
            ? action.action
            : getFunction(
                functions,
                meta.table.object,
                "action",
                action.action
              );
      }
      action.enableFunction = getFunction(
        functions,
        meta.table.object,
        "editable",
        action.enable
      );
    });
  }
  if (meta.table.subscription) {
    meta.table.subscription.observableFunction = getFunction(
      functions,
      meta.table.object,
      "dml",
      meta.table.subscription.observable
    );
    meta.table.subscription.observerFunctions = {
      onNext: getFunction(
        functions,
        meta.table.object,
        "observer",
        (meta.table.subscription.observer || { onNext: "onNext" }).onNext
      ),
      onCompleted: getFunction(
        functions,
        meta.table.object,
        "observer",
        (meta.table.subscription.observer || { onCompleted: "onCompleted" })
          .onCompleted
      ),
      onError: getFunction(
        functions,
        meta.table.object,
        "observer",
        (meta.table.subscription.observer || { onError: "onError" }).onError
      )
    };
  }

  // properties
  meta.properties.forEach((column, index) => {
    if (column.id === "index_" && column.hidden === undefined) {
      column.hidden = true;
    }
    if (column.dataType === "object" || column.dataType === "joined object") {
      column.hidden = true;
    }
    const width = zoom * (column.hidden ? 0 : column.width || 0);
    column.computedWidth = width;
    column.position = position;
    column.index_ = index;

    position += width;
    if (column.locked) {
      meta.lockedIndex = column.index_;
      meta.lockedWidth = position;
    }
    if (width !== 0) {
      column.visibleIndex_ = meta.visibleIndexes.length;
      meta.visibleIndexes.push(column.index_);
    }
    if (!meta.table.editable) {
      column.editable = false;
    } else if (column.editable === undefined) {
      column.editable = true;
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
    column.selectFunction = getFunction(
      functions,
      meta.table.object,
      "select",
      column.select
    );
    column.foreignObjectFunction = getFunction(
      functions,
      meta.table.object,
      "foreignObject",
      column.foreignObject
    );
    // select items can be defined as
    // - an array
    // - an object {id:caption...}
    // - an object {items:[select items],filter:[function to filter items with parameters as row,data...
    if (Array.isArray(column.select)) {
      column.selectItems = column.select;
    }
    // column.selectItems = select || [""];

    column.accessorFunction = getFunction(
      functions,
      meta.table.object,
      "accessor",
      column.accessor
    );
    // column.primaryKeyAccessorFunction = getFunction(
    //   functions,
    //   meta.table.object,
    //   "accessor",
    //   column.primaryKeyAccessor
    // );
    if (column.dataType === "joined object" && column.select) {
      column.primaryKeyAccessorFunction = ({ row }) => row.pk_;
      // column.primaryKeyAccessorFunction=({row})=>
      if (
        column.selectFunction &&
        typeof column.selectFunction === "function"
      ) {
        column.selectItems = column.selectFunction();
      } else if (column.selectFunction) {
        column.selectItems = column.selectFunction;
      } else {
        column.selectItems = column.select;
      }
      const f = column.accessorFunction;
      column.setForeignKeyAccessorFunction = message => {
        const { value, row } = message;
        row[column.accessor.replace("row.", "")] = value;
      };
      column.accessorFunction = ({ row }) => {
        const v = f({ row });
        return column.selectItems[v];
      };
    }
    // reference to an object
    if (column.accessor && typeof column.accessor === "string") {
      let accessor = column.accessor;
      let index = column.accessor.indexOf(".");
      if (index !== -1 && accessor.slice(0, index) === "row") {
        accessor = accessor.slice(index + 1);
        index = accessor.indexOf(".");
      }
      if (index !== -1) {
        column.reference = accessor.slice(0, accessor.indexOf("."));
        const referencedColumn = meta.properties.find(
          col => col.id === column.reference
        );
        if (referencedColumn) {
          column.primaryKeyAccessorFunction = getFunction(
            functions,
            meta.table.object,
            "accessor",
            referencedColumn.accessor
          );
          // referencedColumn.accessorFunction;
          column.setForeignKeyAccessorFunction = ({ value, row }) => {
            row[referencedColumn.accessor.slice(4)] = value;
          };
          if (
            referencedColumn.dataType === "joined object" &&
            column.editable
          ) {
            column.select = " ";
            column.selectItems = referencedColumn.selectItems;
            column.mandatory = column.mandatory || referencedColumn.mandatory;
          }
        }
      }
    }
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
};
// return meta;
// };
export const computeMetaFromData = (data, meta, zoom, functions) => {
  let position = 0;
  if (!meta.properties.length && data && data.length) {
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
        hidden:
          dataType === "object" ||
          dataType === "joined object" ||
          key === "index_",
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
