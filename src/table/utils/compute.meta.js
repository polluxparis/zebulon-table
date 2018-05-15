import { utils } from "zebulon-controls";
// export const utils.getFunction = (functions, object, type, value, utils_) => {
//   if (typeof value === "function") {
//     return value;
//   } else if (typeof value === "string") {
//     //  accessor
//     const indexDot = value.indexOf(".");
//     if (indexDot !== -1) {
//       let v = value;
//       if (value.slice(0, indexDot) === "row") {
//         v = value.slice(indexDot + 1);
//       }
//       const keys = v.split(".");
//       return ({ row }) => {
//         return keys.reduce(
//           (acc, key, index) =>
//             acc[key] === undefined && index < keys.length - 1 ? {} : acc[key],
//           row
//         );
//       };
//     } else {
//       const v =
//         typeof value === "string"
//           ? functions
//               .filter(
//                 f =>
//                   f.id === value &&
//                   f.tp === type &&
//                   (f.visibility === "global" || f.visibility === object)
//               )
//               .sort(
//                 (f0, f1) =>
//                   (f0.visibility !== object) - (f1.visibility !== object)
//               )
//           : [];
//       return v.length
//         ? message => v[0].functionJS({ ...message, utils: utils_ || utils })
//         : undefined;
//     }
//   }
// };
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
const grantPrivilege = (object, subObject, target, privileges, type) => {
  if (privileges && privileges[object] && privileges[object][type]) {
    let priv = privileges[object][type];
    if (type !== "table") {
      priv = priv[subObject];
    }
    if (priv) {
      if (type === "actions") {
        if (priv === "enable") {
          target.enable = true;
          target.hidden = false;
        } else if (priv === "disable") {
          target.enable = false;
          target.hidden = false;
        } else if (priv === "hidden") {
          target.hidden = true;
          target.enable = false;
        } else {
          target.enable = priv;
        }
      } else if (type === "properties") {
        if (priv === "editable") {
          target.editable = true;
          target.hidden = false;
        } else if (priv === "visible") {
          target.editable = false;
          target.enable = false;
        } else if (priv === "hidden") {
          target.editable = false;
          target.hidden = true;
        } else {
          target.editable = priv;
        }
      }
    }
  }
};
export const computeMeta = (meta, zoom = 1, functions, utils_, privileges) => {
  let position = 0;
  // table
  if (!meta.functions) {
    meta.functions = functions;
  }
  meta.visibleIndexes = [];
  meta.table.editable = meta.table.editable && !meta.table.checkable;
  grantPrivilege(meta.table.object, null, meta.table, privileges, "table");
  meta.zoom = zoom;
  meta.table.selectFunction = utils.getFunction(
    functions,
    "dml",
    meta.table.onSave,
    utils_
  );
  meta.table.onTableChangeFunction = utils.getFunction(
    functions,
    "dml",
    meta.table.onTableChange,
    utils_
  );
  meta.table.onSaveFunction = utils.getFunction(
    functions,
    "dml",
    meta.table.onSave,
    utils_
  );
  meta.table.onSaveBeforeFunction = utils.getFunction(
    functions,
    "dml",
    meta.table.onSaveBefore,
    utils_
  );
  meta.table.onSaveAfterFunction = utils.getFunction(
    functions,
    "dml",
    meta.table.onSaveAfter,
    utils_
  );
  if (!meta.indexPk && !utils.isNullValue(meta.table.primaryKey)) {
    meta.indexPk = {};
  }
  if (!meta.indexLk && !utils.isNullValue(meta.table.logicalKey)) {
    meta.indexLk = {};
  }
  if (!meta.indexRowId && !utils.isNullValue(meta.table.rowId)) {
    meta.indexRowId = {};
  }
  meta.row.descriptorFunction = utils.getFunction(
    functions,
    "accessor",
    meta.row.descriptor,
    utils_
  );
  // row
  meta.row.onQuitFunction = utils.getFunction(
    functions,
    "validator",
    meta.row.onQuit,
    utils_
  );
  meta.row.auditFunction = utils.getFunction(
    functions,
    "accessor",
    meta.row.audit,
    utils_
  );
  if (meta.table.actions) {
    meta.table.actions.forEach(action => {
      grantPrivilege(
        action.id || action.caption,
        action,
        privileges,
        "actions"
      );
      if (action.action) {
        action.actionFunction =
          typeof action.action === "function"
            ? action.action
            : utils.getFunction(functions, "action", action.action, utils_);
      }
      action.enableFunction = utils.getFunction(
        functions,
        "editable",
        action.enable,
        utils_
      );
    });
  }
  if (meta.table.subscription) {
    meta.table.subscription.observableFunction = utils.getFunction(
      functions,
      "dml",
      meta.table.subscription.observable,
      utils_
    );
    meta.table.subscription.observerFunctions = {
      onNext: utils.getFunction(
        functions,
        "observer",
        (meta.table.subscription.observer || { onNext: "onNext" }).onNext,
        utils_
      ),
      onCompleted: utils.getFunction(
        functions,
        "observer",
        (meta.table.subscription.observer || { onCompleted: "onCompleted" })
          .onCompleted,
        utils_
      ),
      onError: utils.getFunction(
        functions,
        "observer",
        (meta.table.subscription.observer || { onError: "onError" }).onError,
        utils_
      )
    };
  }

  // properties
  meta.properties.forEach((column, index) => {
    grantPrivilege(
      meta.table.object,
      column.id,
      column,
      privileges,
      "properties"
    );
    if (column.id === "index_" && column.hidden === undefined) {
      column.hidden = true;
    }
    if (
      !utils.isNullOrUndefined(column.id) &&
      column.id === meta.table.primaryKey
    ) {
      meta.table.pk = column;
    }
    if (
      !utils.isNullOrUndefined(column.id) &&
      column.id === meta.table.logicalKey
    ) {
      meta.table.lk = column;
    }
    if (!utils.isNullOrUndefined(column.id) && column.id === meta.table.rowId) {
      column.dataType = "number";
      column.hidden = true;
      meta.table.rwd = column;
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
    column.editableFunction = utils.getFunction(
      functions,
      "editable",
      column.editable,
      utils_
    );
    column.formatFunction = utils.getFunction(
      functions,
      "format",
      column.format,
      utils_
    );
    column.selectFunction = utils.getFunction(
      functions,
      "select",
      column.select,
      utils_
    );
    column.foreignObjectFunction = utils.getFunction(
      functions,
      "foreignObject",
      column.foreignObject,
      utils_
    );
    // select items can be defined as
    // - an array
    // - an object {id:caption...}
    // - an object {items:[select items],filter:[function to filter items with parameters as row,data...
    if (Array.isArray(column.select)) {
      column.selectItems = column.select;
    }
    // column.selectItems = select || [""];

    column.accessorFunction = utils.getFunction(
      functions,
      "accessor",
      column.accessor,
      utils_
    );
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
          column.primaryKeyAccessorFunction = utils.getFunction(
            functions,
            "accessor",
            referencedColumn.accessor,
            utils_
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
    column.sortAccessorFunction = utils.getFunction(
      functions,
      "accessor",
      column.sortAccessor || column.accessor,
      utils_
    );
    column.defaultFunction = utils.getFunction(
      functions,
      "default",
      column.default,
      utils_
    );
    column.onChangeFunction = utils.getFunction(
      functions,
      "validator",
      column.onChange,
      utils_
    );
    column.onQuitFunction = utils.getFunction(
      functions,
      "validator",
      column.onQuit,
      utils_
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
      column.groupByAccessorFunction = utils.getFunction(
        functions,
        "accessor",
        column.groupByAccessor,
        utils_
      );
      column.comparisonAccessorFunction = utils.getFunction(
        functions,
        "accessor",
        column.comparisonAccessor,
        utils_
      );
      column.aggregationFunction = utils.getFunction(
        functions,
        "aggregation",
        column.aggregation,
        utils_
      );
      column.startFunction = utils.getFunction(
        functions,
        "window",
        column.windowStart,
        utils_
      );
      column.endFunction = utils.getFunction(
        functions,
        "window",
        column.windowEnd,
        utils_
      );
    }
    if (column.accessor && !column.reference && !column.onQuit) {
      column.editable = false;
    }
  });
};
// return meta;
// };
export const getDataType = value => {
  let dataType = typeof value;
  if (dataType === "object") {
    if (utils.isDate(value)) {
      dataType = "date";
    } else if (Array.isArray(value)) {
      dataType = "array";
    } else {
      dataType = "object";
    }
  } else if (dataType === "string" && value === new Date(value).toJSON()) {
    dataType = "date";
  }
  return dataType;
};
export const computeMetaFromData = (
  data,
  meta,
  zoom,
  functions,
  utils_,
  privileges
) => {
  let position = 0;
  if (!meta.properties.length && data && data.length) {
    const row = data[0];
    Object.keys(row).forEach((key, index) => {
      let dataType = getDataType(row[key]),
        filterType = "";

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
        tp: "Dataset",
        width,
        dataType,
        alignement,
        hidden:
          dataType === "object" ||
          dataType === "joined object" ||
          dataType === "array" ||
          key === "index_" ||
          key === "timestamp_" ||
          key === "rowId_",
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
  computeMeta(meta, zoom, functions, utils_, privileges);
};
// -----------------------------------------------------------
// build a table of functions from the initial function object
// -----------------------------------------------------------
// const functionsByObject = (object, functions) => {
//   const f = functions[object];
//   // const accessor = accessor => {
//   //   return f.accessors[accessor];
//   // };
//   const f_ = [];
//   Object.keys(f).forEach(type => {
//     const tp = type.slice(0, type.length - 1);
//     Object.keys(f[type]).forEach(code => {
//       const functionJS = f[type][code];
//       if (functionJS) {
//         f_.push({
//           id: code,
//           visibility: object === "globals_" ? "global" : object,
//           caption: code,
//           tp,
//           functionJS
//         });
//       }
//     });
//   });
//   return f_;
// };
// export const functionsTable = functions => {
//   if (functions === undefined) {
//     return [];
//   }
//   return Object.keys(functions).reduce(
//     (acc, object) => acc.concat(functionsByObject(object, functions)),
//     []
//   );
// };
