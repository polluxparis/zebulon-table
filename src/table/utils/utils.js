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
  status.updated_ = false;
  status.errors = {};
};
export const rollbackAll = (updatedRows, data) => {
  Object.keys(updatedRows).forEach(index => {
    const status = updatedRows[index];
    if (status.new_) {
      data.splice(status.rowUpdated.index_, 1);
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
  if (status.errors) {
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
  return errors;
};
export const getErrors = updatedRows => {
  const errors = [];
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

// export class ConfirmationModal extends React.Component {
//   render() {
//     // Render nothing if the "show" prop is false
//     if (!this.props.show) {
//       return null;
//     }
//     const { text, type } = this.props.detail;
//     let buttons;
//     if (type === "YesNoCancel") {
//       buttons = [
//         <button
//           style={{ minWidth: 70, margin: 5 }}
//           onClick={() => this.props.onConfirm("yes")}
//           tabIndex={0}
//           key={0}
//           autoFocus={true}
//         >
//           Yes
//         </button>,
//         <button
//           style={{ minWidth: 70, margin: 5 }}
//           onClick={() => this.props.onConfirm("no")}
//           tabIndex={1}
//           key={1}
//         >
//           No
//         </button>,
//         <button
//           style={{ minWidth: 70, margin: 5 }}
//           onClick={() => this.props.onConfirm("cancel")}
//           tabIndex={2}
//           key={2}
//         >
//           Cancel
//         </button>
//       ];
//     } else if (type === "Ok") {
//       buttons = [
//         <button
//           style={{ minWidth: 70, margin: 5 }}
//           onClick={() => this.props.onConfirm("ok")}
//           tabIndex={0}
//           key={0}
//           autoFocus={true}
//         >
//           Ok
//         </button>
//       ];
//     }
//     const body = Array.isArray(text) ? (
//       text.map((line, index) => <div key={index}>{line}</div>)
//     ) : (
//       <div>{text}</div>
//     );
//     return (
//       <div className="backdrop zebulon-modal-backdrop">
//         <div
//           className="modal zebulon-modal-confirmation"
//           style={{ display: "flex", top: 100 }}
//         >
//           {body}
//           <div className="footer" style={{ display: "flex" }}>
//             {buttons}
//           </div>
//         </div>
//       </div>
//     );
//   }
// }
