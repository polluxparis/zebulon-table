import { utils } from "zebulon-controls";

export const getSizes = (meta, rowHeight) => {
  const headersLength =
    1 +
    !meta.table.noFilter *
      (1 +
        (meta.properties.findIndex(
          column => column.filterType === "between" && !column.hidden
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
export const computeMeta = (meta, zoom = 1, functions, privileges) => {
  let position = 0;
  // table
  // if (!meta.functions) {
  //   meta.functions = functions;
  // }
  const object = meta.table.object;
  meta.promises = [];
  // functions.setVisibility(object);
  meta.visibleIndexes = [];
  meta.table.editable = meta.table.editable && !meta.table.checkable;
  grantPrivilege(object, null, meta.table, privileges, "table");
  meta.zoom = zoom;
  meta.table.selectFunction = functions.getAccessorFunction(
    object,
    "dmls",
    meta.table.select
  );
  meta.table.onTableChangeFunction = functions.getAccessorFunction(
    object,
    "dmls",
    meta.table.onTableChange
  );
  meta.table.onSaveFunction = functions.getAccessorFunction(
    object,
    "dmls",
    meta.table.onSave
  );
  meta.table.onSaveBeforeFunction = functions.getAccessorFunction(
    object,
    "dmls",
    meta.table.onSaveBefore
  );
  meta.table.onSaveAfterFunction = functions.getAccessorFunction(
    object,
    "dmls",
    meta.table.onSaveAfter
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
  meta.row.descriptorFunction = functions.getAccessorFunction(
    object,
    "accessors",
    meta.row.descriptor
  );
  // row
  meta.row.onQuitFunction = functions.getAccessorFunction(
    object,
    "validators",
    meta.row.onQuit
  );
  meta.row.auditFunction = functions.getAccessorFunction(
    object,
    "accessors",
    meta.row.audit
  );
  if (meta.table.actions) {
    meta.table.actions.forEach(action => {
      grantPrivilege(
        meta.table.object,
        action.id || action.caption,
        action,
        privileges,
        "actions"
      );
      if (action.action) {
        action.actionFunction =
          typeof action.action === "function"
            ? action.action
            : functions.getAccessorFunction(object, "actions", action.action);
      }
      action.enableFunction = functions.getAccessorFunction(
        object,
        "editables",
        action.enable
      );
    });
  }
  if (meta.table.subscription) {
    meta.table.subscription.observableFunction = functions.getAccessorFunction(
      object,
      "dmls",
      meta.table.subscription.observable
    );
    meta.table.subscription.observerFunctions = {
      onNext: functions.getAccessorFunction(
        object,
        "observers",
        (meta.table.subscription.observer || { onNext: "onNext" }).onNext
      ),
      onCompleted: functions.getAccessorFunction(
        object,
        "observers",
        (meta.table.subscription.observer || { onCompleted: "onCompleted" })
          .onCompleted
      ),
      onError: functions.getAccessorFunction(
        object,
        "observers",
        (meta.table.subscription.observer || { onError: "onError" }).onError
      )
    };
  }

  // properties
  meta.properties.forEach((column, index) => {
    if (column.deleted_) {
      column.hidden = true;
      column.mandatory = false;
    }
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
    column.editableFunction = functions.getAccessorFunction(
      object,
      "editables",
      column.editable
    );
    column.formatFunction = functions.getAccessorFunction(
      object,
      "formats",
      column.format
    );
    // a voir bricole avec les joined objects
    if (column.select === " ") {
      column.select = undefined;
    }
    column.selectFunction = functions.getAccessorFunction(
      object,
      "selects",
      column.select
    );
    column.foreignObjectFunction = functions.getAccessorFunction(
      object,
      "foreignObjects",
      column.foreignObject
    );
    // select items can be defined as
    // - an array
    // - an object {id:caption...}
    // - an object {items:[select items],filter:[function to filter items with parameters as row,data...
    // if (Array.isArray(column.select)) {
    column.accessorFunction = functions.getAccessorFunction(
      object,
      "accessors",
      column.accessor
    );
    column.selectItems = column.select;
    if (column.selectFunction) {
      if (typeof column.selectFunction === "function") {
        column.selectItems = column.selectFunction({ meta });
      } else {
        column.selectItems = column.selectFunction;
      }
      //  promises must be resolved before compute data
      if (utils.isPromise(column.selectItems)) {
        column.selectItems.then(data => {
          column.selectItems = data;
          return data;
        });
        meta.promises.push(column.selectItems);
      }
    }
    if (column.dataType === "joined object" && column.select) {
      column.primaryKeyAccessorFunction = ({ row }) => row.pk_;

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
    column.onChangeFunction = functions.getAccessorFunction(
      object,
      "validators",
      column.onChange
    );
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
          column.primaryKeyAccessorFunction = functions.getAccessorFunction(
            object,
            "accessors",
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
            if (utils.isPromise(referencedColumn.selectItems)) {
              referencedColumn.selectItems.then(data => {
                column.selectItems = data;
                referencedColumn.selectItems = data;
                return data;
              });
              meta.promises.push(referencedColumn.selectItems);
            } else {
              column.selectItems = referencedColumn.selectItems;
            }
            column.mandatory = column.mandatory || referencedColumn.mandatory;
            const f = column.onChangeFunction || (x => true);
            column.onChangeFunction = ({ value, row, column }) => {
              row[column.reference] = column.selectItems[value.value];
              row[column.id] = column.accessorFunction({ column, row });
              column.setForeignKeyAccessorFunction({ value: value.value, row });
              return f({ value, row, column });
            };
          }
        }
      }
    }
    // column.sortAccessorFunction = functions.getAccessorFunction(
    //   object,
    //   "accessors",
    //   column.sortAccessor || column.accessor
    // );
    column.defaultFunction = functions.getAccessorFunction(
      object,
      "defaults",
      column.default
    );

    column.onQuitFunction = functions.getAccessorFunction(
      object,
      "validators",
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
    if (column.analytic) {
      const analytic = functions.getAccessorFunction(
        meta.table.object,
        "analytics",
        column.analytic
      );
      column.groupByAccessorFunction = functions.getAccessorFunction(
        meta.table.object,
        "accessors",
        analytic.groupByAccessor
      );
      column.aggregationFunction = functions.getAccessorFunction(
        meta.table.object,
        "aggregations",
        analytic.aggregation
      );
      // window
      if (analytic.comparisonAccessor) {
        column.comparisonAccessorFunction = functions.getAccessorFunction(
          meta.table.object,
          "accessors",
          analytic.comparisonAccessor
        );
        column.sortAccessorFunction = functions.getAccessorFunction(
          meta.table.object,
          "accessors",
          analytic.sortAccessor
        );
        column.startFunction = functions.getAccessorFunction(
          meta.table.object,
          "windows",
          analytic.windowStart
        );
        column.endFunction = functions.getAccessorFunction(
          meta.table.object,
          "windows",
          analytic.windowEnd
        );
      }
    }
    if (
      column.accessor &&
      !column.reference &&
      !column.onQuit &&
      !column.onChange
    ) {
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
        editable: !!meta.table.editables,
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
  computeMeta(meta, zoom, functions, privileges);
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
