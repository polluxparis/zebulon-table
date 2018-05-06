import React from "react";
import { utils } from "zebulon-controls";

// -----------------------------------------------------------
// Error management
// -----------------------------------------------------------
export const rollback = status => {
  if (!status.new_) {
    Object.keys(status.rowUpdated).forEach(
      key => (status.rowUpdated[key] = null)
    );
    Object.keys(status.row).forEach(
      key => (status.rowUpdated[key] = status.row[key])
    );
  }
  status.deleted_ = false;
  status.updated_ = false;
  // status.new_ = false;
  if (!status.new_) {
    status.errors = {};
  }
};
export const rollbackAll = (updatedRows, data) => {
  Object.keys(updatedRows).forEach(index => {
    const status = updatedRows[index];
    if (status.new_) {
      data.splice(status.rowUpdated.index_, 1);
      delete updatedRows[index];
    } else if (status.updated_) {
      rollback(status);
    }
  });
};

export const getRowStatus = (updatedRows, row) => {
  let status = updatedRows[row.index_];
  if (!status) {
    status = {
      // updated_: true,
      rowUpdated: row,
      row: { ...row },
      errors: {}
    };
    updatedRows[row.index_] = status;
  }
  return status;
};
export const setStatus = (status, type) => {
  status[type] = true;
  status.timeStamp = new Date().getTime();
};
//------------------------------------------------------------
export const manageRowError = (
  updatedRows,
  index,
  column,
  type,
  error,
  onServer
) => {
  const status = updatedRows[index] || {};
  const existsErrors = !utils.isNullOrUndefined(
    onServer ? status.errorsServer : status.errors
  );
  const errors = (onServer ? status.errorsServer : status.errors) || {};
  const existsObject = !utils.isNullOrUndefined(errors[column.id]);
  const objectErrors = errors[column.id] || {};
  const existsType = !utils.isNullOrUndefined(objectErrors[type]);
  if (error) {
    objectErrors[type] = error;
    if (!existsType) {
      objectErrors.n_ = (objectErrors.n_ || 0) + 1;
      if (!existsObject) {
        errors[column.id] = objectErrors;
      }
      errors.n_ = (errors.n_ || 0) + 1;
      if (!existsErrors) {
        if (onServer) {
          status.errorsServer = errors;
        } else {
          status.errors = errors;
        }
      }
      if (onServer) {
        updatedRows.nErrorsServer = (updatedRows.nErrorsServer || 0) + 1;
      } else {
        updatedRows.nErrors = (updatedRows.nErrors || 0) + 1;
      }
    }
  } else {
    if (existsType) {
      delete objectErrors[type];
      objectErrors.n_--;
      if (objectErrors.n_ === 0) {
        delete errors[column.id];
      }
      errors.n_--;
      if (onServer) {
        updatedRows.nErrorsServer = (updatedRows.nErrorsServer || 0) - 1;
      } else {
        updatedRows.nErrors = (updatedRows.nErrors || 0) - 1;
      }
    }
  }
};
export const getRowErrors = (status, rowIndex) => {
  const errors = [];
  if (!status.deleted_ && status.errors) {
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
  }
  if (!status.deleted_ && status.errorsServer) {
    Object.keys(status.errorsServer).forEach(column => {
      if (status.errorsServer[column] || column !== "n_") {
        Object.keys(status.errorsServer[column]).forEach(type => {
          if (type !== "n_") {
            errors.push({
              column,
              type,
              error: status.errorsServer[column][type],
              rowIndex
            });
          }
        });
      }
    });
  }
  return errors;
};
export const getErrors = updatedRows => {
  let errors = [];
  Object.values(updatedRows).forEach(status => {
    if (!status.deleted_ && (status.errors || {}).n_) {
      errors = errors.concat(getRowErrors(status, status.rowUpdated.index_));
    }
  });
  return errors;
};
export const errorHandler = {
  onTableChange: message => {
    if (message.type !== "sort") {
      message.modalBody = `Do you want to save before ${message.type}?`;
    }
    return true;
  },
  onSaveBefore: message => {
    const { meta, updatedRows } = message;
    const key = meta.table.lk || meta.table.pk;
    const errors = getErrors(updatedRows).map(error => {
      const rowUpdated = updatedRows[error.rowIndex].rowUpdated;
      return `\n${key.caption} ${rowUpdated[key.id]} : ${error.error}`;
    });
    if (errors.length > 1) {
      message.modalBody = ["Can't save with errors: "].concat(errors);
      return false;
    } else {
      message.modalBody = null;
    }
    return true;
  },
  onSave: message => {
    if (message.serverError) {
      message.modalBody = message.serverError;
      return false;
    }
    return true;
  }
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
export const loadFileButton = ({
  disabled,
  index,
  style,
  onClick,
  className
}) => {
  const onLoad = e => {
    const file = document.getElementById("file-selector").files[0];
    const reader = new FileReader();
    reader.onload = ee => {
      onClick({ ...ee, file, text: reader.result });
    };
    reader.readAsText(file);
  };
  return (
    <div key={index} style={{ ...style, display: "inherit" }}>
      <input
        type="file"
        id="file-selector"
        onChange={onLoad}
        style={{ display: "none" }}
      />
      <button
        style={{ width: "inherit" }}
        className={className}
        disabled={disabled}
        onClick={() => document.getElementById("file-selector").click()}
      >
        Load
      </button>
    </div>
  );
};
// -------------------------------------------
// miscelaneous
// -------------------------------------------
export const hasParent = (element, id) => {
  if (!element.parentElement) {
    return false;
  } else if (element.parentElement.id.slice(0, id.length) === id) {
    return true;
  } else {
    return hasParent(element.parentElement, id);
  }
};
export const isEqual = (v0, v1) => {
  if (
    v0 === v1 ||
    (utils.isDate(v0) && utils.isDate(v1) && v0.getTime() === v1.getTime()) ||
    (utils.isDate(v0) &&
      typeof v1 === "string" &&
      v0.getTime() === new Date(v1).getTime()) ||
    (utils.isDate(v1) &&
      typeof v0 === "string" &&
      v1.getTime() === new Date(v0).getTime()) ||
    (typeof v0 === "object" &&
      typeof v1 === "object" &&
      Object.keys(v0).length === Object.keys(v1).length &&
      Object.keys(v0).reduce(
        (acc, key) => acc && isEqual(v0[key], v1[key], true)
      ))
  ) {
    return true;
  }
  return false;
};
