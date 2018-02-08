import { utils } from "zebulon-controls";

// -----------------------------------------------------------
// Error management
// -----------------------------------------------------------
export const rollback = status => {
  Object.keys(status.rowUpdated).forEach(
    key => (status.rowUpdated[key] = null)
  );
  Object.keys(status.row).forEach(
    key => (status.rowUpdated[key] = status.row[key])
  );
  status.updated_ = false;
  status.errors = {};
};
//------------------------------------------------------------
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
      errors.push(...getRowErrors(status, status.rowUpdated.index_));
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
