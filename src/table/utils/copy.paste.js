import { utils } from "zebulon-controls";
import { cellData } from "./compute.data";
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
        } else if (utils.isObject(value)) {
          value = value.caption;
        }
        output += columnSeparator + JSON.stringify(value);
      }
    }
    outputs.push(output.slice(1));
  }
  return outputs.join("\n");
};
export const buildPasteArray = (type = "xls", clipboard, this_, selectCell) => {
  const columns = this_.state.meta.properties,
    selectedCell = this_.state.selectedRange.end,
    onChange = this_.onChange,
    canQuit = this_.canQuit,
    filteredData = this_.state.filteredData,
    updatedRows = this_.state.updatedRows,
    data = this_.state.data,
    params = this_.props.params;
  const columnSeparator = type === "csv" ? "," : "\t"; // a voir detection du separateur
  const lines = clipboard.replace(/\r/g, "").split("\n");
  lines.pop();
  const cells = lines.map(line => line.split(columnSeparator));

  const cellsValue = [];
  cells.forEach((rowCells, rowIndex) => {
    const row = filteredData[selectedCell.rows + rowIndex];
    let columnIndex = 0;
    rowCells.forEach(value => {
      let col = selectedCell.columns + columnIndex < columns.length;
      let column = columns[selectedCell.columns + columnIndex];
      while (col && column.hidden && column.index_ + 1 < columns.length) {
        columnIndex++;
        col = selectedCell.columns + columnIndex < columns.length;
        column = columns[selectedCell.columns + columnIndex];
      }
      const cell = {
        rows: selectedCell.rows + rowIndex,
        columns: column.index_
      };
      const editable =
        col && column.editableFunction
          ? column.editableFunction({
              column,
              row,
              status: updatedRows[row.index_] || {},
              data,
              params
            })
          : column.editable;
      if (editable) {
        let v = value;
        const { dataType, format } = column;
        if (dataType === "boolean") {
          v = v === "true";
        } else if (dataType === "date") {
          v = utils.stringToDate(v, format);
        } else if (dataType === "number") {
          v = v === "" ? null : Number(value);
        }
        cell.value = v;
        cell.columnId = column.id;
        cellsValue.push(cell);
      }
      columnIndex++;
    });
  });
  //  mangement of callback and users interractions
  cellsValue.reverse();
  const cellValue = (ok_, previousRow) => {
    if (!ok_ || cellsValue.length === 0) {
      this_.isPasting = false;
      this_.forceUpdate();
      return;
    }
    let ok = ok_;
    const cell = cellsValue.pop();
    this_.isPasting = true;
    const cellV = ok_ => {
      const endCell = ok_ => {
        if (ok_) {
          cellValue(ok_, cell.rows);
        }
      };
      if (!ok_) {
        return false;
      }
      selectCell(cell);
      const row = filteredData[cell.rows];
      const column = columns[cell.columns];
      // can change value
      if (!onChange({ value: { value: cell.value }, row, column })) {
        return false;
      }
      row[cell.columnId] = cell.value;
      // object in select input
      if (column.reference && column.selectItems) {
        const item = Object.values(column.selectItems).find(
          item =>
            column.accessorFunction({ row: { [column.reference]: item } }) ===
            cell.value
        );
        row[column.reference] = item;
        if (column.setForeignKeyAccessorFunction) {
          column.setForeignKeyAccessorFunction({
            value: item.pk_,
            row
          });
          // column.setForeignKeyAccessorFunction({
          //   value: column.primaryKeyAccessorFunction({
          //     row: { [column.reference]: item }
          //   }),
          //   row
          // });
        }
      }
      // can quit cell
      const ok = canQuit("cellQuit", endCell);
      if (ok !== undefined) {
        endCell(ok);
      }
    };
    // can quit row
    if (previousRow !== undefined && previousRow !== cell.rows) {
      ok = canQuit("rowQuit", cellV);
    }
    if (ok !== undefined) {
      cellV(ok);
    }
  };
  cellValue(true, undefined);
  this_.isPasting = false;

  return cells;
};
