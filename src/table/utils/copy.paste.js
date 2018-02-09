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
        }
        output += columnSeparator + JSON.stringify(value);
      }
    }
    outputs.push(output.slice(1));
  }
  return outputs.join("\n");
};
export const buildPasteArray = (
  type = "xls",
  clipboard,
  columns,
  selectedCell,
  selectCell,
  onChange,
  filteredData,
  updatedRows,
  data,
  params
) => {
  const columnSeparator = type === "csv" ? "," : "\t";
  // let { columnIndex, rowIndex } = cell;
  const lines = clipboard.replace(/\r/g, "").split("\n");
  lines.pop();
  const cells = lines.map(line => line.split(columnSeparator));
  // const nRows = lines.length,
  //   nColumns = cells[0].length;
  cells.forEach((rowCells, rowIndex) => {
    const cell = {};
    const row = filteredData[selectedCell.rows + rowIndex];
    let columnIndex = 0;
    rowCells.forEach(value => {
      cell.rows = selectedCell.rows + rowIndex;
      cell.columns = selectedCell.columns + columnIndex;
      let column = columns[cell.columns];
      while (
        column.hidden &&
        selectedCell.columns + columnIndex < columns.length
      ) {
        columnIndex++;
        cell.columns = selectedCell.columns + columnIndex;
        column = columns[cell.columns];
      }
      columnIndex++;
      const editable = column.editableFunction
        ? column.editableFunction({
            column,
            row,
            status: updatedRows[row.index_] || {},
            data,
            params
          })
        : column.editable;
      if (editable) {
        if (!selectCell(cell)) {
          return;
        }
        let v = value;
        const { dataType, format } = column;
        if (column.reference && column.selectItems) {
          const item = Object.values(column.selectItems).find(
            item =>
              column.accessorFunction({ row: { [column.reference]: item } }) ===
              v
          );
          row[column.reference] = item;
          if (column.setForeignKeyAccessorFunction) {
            column.setForeignKeyAccessorFunction({
              value: column.primaryKeyAccessorFunction({
                row: { [column.reference]: item }
              }),
              row
            });
          }
        } else {
          if (dataType === "boolean") {
            v = v === "true";
          } else if (dataType === "date") {
            v = utils.stringToDate(v, format);
          } else if (dataType === "number") {
            v = v === "" ? null : Number(value);
          }
          row[column.id] = v;
        }

        if (!onChange(v, row, column)) {
          return;
        }
      }
    });
  });
  return cells;
};
