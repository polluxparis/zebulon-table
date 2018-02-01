import { constants, utils } from "zebulon-controls";
// ----------------------------------------------------------
// custom navigation handler
// -> adapt following function and pass it as a prop (navigationKeyHandler)
// ----------------------------------------------------------
export const navigationKeyHandler = (e, cells) => {
  if (!((e.which > 32 && e.which < 41) || e.which === 9)) {
    return false;
  }
  let direction, cell, axis;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    if (
      document.activeElement.tagName === "SELECT" ||
      document.activeElement.tagName === "TEXTAREA"
    ) {
      return false;
    }
    direction = e.key === "ArrowDown" ? 1 : -1;
    axis = constants.AxisType.ROWS;
    cell = cells.nextCell(axis, direction, 1);
  } else if (
    e.key === "ArrowRight" ||
    e.key === "ArrowLeft" ||
    e.key === "Tab"
  ) {
    if (
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA") &&
      e.key !== "Tab" &&
      !e.altKey
    ) {
      return false;
    }
    direction =
      e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey) ? 1 : -1;
    axis = constants.AxisType.COLUMNS;
    cell = cells.nextCell(axis, direction, 1);
  } else if (e.key === "PageUp" || e.key === "PageDown") {
    direction = e.key === "PageDown" ? 1 : -1;
    axis = e.altKey ? constants.AxisType.COLUMNS : constants.AxisType.ROWS;
    cell = cells.nextPageCell(axis, direction);
  } else if (e.key === "Home" || e.key === "End") {
    direction = e.key === "End" ? 1 : -1;
    axis = e.altKey ? constants.AxisType.COLUMNS : constants.AxisType.ROWS;
    cell = cells.endCell(axis, direction);
  }
  // selection
  e.preventDefault();
  if (cells.selectCell(cell, e.shiftKey && e.key !== "Tab") === false) {
    return false;
  }
  return { cell, axis, direction };
};
// ------------------------------------------
// end navigation handler
// ------------------------------------------
