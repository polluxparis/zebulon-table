import React from "react";
import classnames from "classnames";
import { Input, ScrollableGrid, utils, constants } from "zebulon-controls";
// import { Input } from "./controls-o/Input";
export class Rows extends ScrollableGrid {
  getRatios = () => {
    const { height, width, meta, rowHeight, scroll, data } = this.props;
    const lastColumn = meta[meta.length - 1];
    const columnsWidth =
      lastColumn.position + (lastColumn.hidden ? 0 : lastColumn.width || 0);
    // const verticalDisplay=height / (data.length * rowHeight);
    // const horizontalDisplay=height / (data.length * rowHeight);
    return {
      vertical: {
        display:
          (height - (columnsWidth > width ? constants.ScrollbarSize : 0)) /
          (data.length * rowHeight),
        position: scroll.rows.index / data.length
      },
      horizontal: {
        display:
          (width -
            (data.length * rowHeight > height ? constants.ScrollbarSize : 0)) /
          columnsWidth,
        position: scroll.columns.position / columnsWidth
      }
    };
  };
  // onFocus = (e, row, column) => {
  //   let label;
  //   if (row.tp === "accessor") {
  //     label = "Parameters: (row)";
  //   } else if (row.tp === "format") {
  //     label = "Parameters: (value)";
  //   } else if (row.tp === "aggregation") {
  //     label = "Parameters: ([values])";
  //   } else if (row.tp === "sort") {
  //     label = "Parameters: (rowA, rowB)";
  //   }
  //   const text = {
  //     top:
  //       (0 + this.range.end.rows) * this.rowHeight +
  //       this.state.scroll.rows.shift,
  //     left:
  //       column.position + this.rowHeight - this.state.scroll.columns.position,
  //     v: (column.accessorFunction || (row => row[column.id]))(row),
  //     label,
  //     editable: column.editable,
  //     row,
  //     column
  //   };
  //   this.setState({ text });
  // };
  cell = (
    row,
    column,
    updatedRows,
    style,
    focused,
    selected,
    onClick,
    onMouseOver,
    onChange,
    onFocus,
    rowIndex
  ) => {
    const editable =
      // focused &&
      typeof (column.editable || false) === "function"
        ? column.editable({ row, status: updatedRows[row.index_] || {} })
        : column.editable;
    const className = classnames({
      "zebulon-table-cell": true,
      "zebulon-table-cell-selected": selected,
      "zebulon-table-cell-focused": focused,
      "zebulon-table-cell-editable": editable && focused
    });
    let value = column.accessorFunction
      ? column.accessorFunction({ row, status: updatedRows[row.index_] || {} })
      : row[column.id];
    if (column.formatFunction && !(editable && focused)) {
      value = column.formatFunction({
        value,
        row,
        status: updatedRows[row.index_],
        data: this.props.data,
        params: this.props.params
      });
    }
    let select = column.select;
    if (editable && focused && column.selectFunction) {
      select = column.selectFunction({
        row,
        status: this.props.updatedRows[row.index_],
        data: this.props.data,
        params: this.props.params
      });
    }
    // if(typeof select ==="string"){select =this.props.function.find(f=>f.code===select&&(f.visibility==="global"||f.visibility===this.props.meta.table.object)).functionJS }
    // if(typeof select ==="function"){select=select()}

    // if (!editable && column.dataType === "date" && utils.isDate(value)) {
    //   value = utils.dateToString(value);
    // }
    return (
      <Input
        style={style}
        className={className}
        id={column.id}
        value={value}
        dataType={column.dataType || "string"}
        format={column.format}
        editable={editable}
        focused={focused}
        select={select}
        key={`cell-${row.index_}-${column.id}`}
        onChange={e => onChange(e, row, column)}
        row={row}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onFocus={e => onFocus(e, row, column, rowIndex)}
      />
    );
  };
  rowRenderer = (
    row,
    updatedRows,
    meta,
    startIndex,
    shift,
    visibleWidth,
    rowHeight,
    rowIndex
    // selectedCell,
    // selectCell
  ) => {
    const cells = [];
    let left = shift,
      index = startIndex;
    while (index < meta.length && left < visibleWidth) {
      const column = meta[index];
      if (!column.hidden) {
        let textAlign = column.alignement || "left";
        if (!column.alignement) {
          if (column.dataType === "number") textAlign = "right";
          else if (column.dataType === "date" || column.dataType === "boolean")
            textAlign = "center";
        }

        const columnIndex = index;
        const selectedRange = this.selectedRange();
        const selected = utils.isInRange(
            {
              columns: index,
              rows: rowIndex
            },
            selectedRange.start,
            selectedRange.end
          ),
          focused =
            selectedRange.end.rows === rowIndex &&
            selectedRange.end.columns === index,
          onClick = e => {
            e.preventDefault();
            this.selectCell(
              { rows: rowIndex, columns: columnIndex },
              e.shiftKey
            );
          },
          onMouseOver = e => {
            e.preventDefault();
            if (e.buttons === 1) {
              this.selectCell({ rows: rowIndex, columns: columnIndex }, true);
            }
          },
          onFocus = column.dataType === "text" ? this.props.onFocus : () => {};
        cells.push(
          this.cell(
            row,
            column,
            updatedRows,
            {
              position: "absolute",
              left,
              width: column.width || 0,
              height: rowHeight,
              textAlign
            },
            focused,
            selected,
            onClick,
            onMouseOver,
            this.props.onChange,
            // () => {}, //onDoubleClick,
            onFocus,
            rowIndex
          )
        );
        left += column.width || 0;
      }
      index += 1;
    }
    return (
      <div key={rowIndex} style={{ display: "flex", height: rowHeight }}>
        {cells}
      </div>
    );
  };

  getContent = () => {
    const items = [];
    let i = 0,
      index = this.props.scroll.rows.startIndex;
    const {
      data,
      meta,
      height,
      rowHeight,
      width,
      selectedCell,
      selectCell,
      updatedRows
    } = this.props;
    const visibleWidth = width - this.scrollbars.vertical.width;
    while (index < data.length && i < height / rowHeight) {
      items.push(
        this.rowRenderer(
          data[index],
          updatedRows,
          meta,
          this.props.scroll.columns.startIndex,
          this.props.scroll.columns.shift,
          visibleWidth,
          rowHeight,
          index,
          selectedCell,
          selectCell
        )
      );
      index++;
      i++;
    }
    return (
      <div
        style={{
          position: "absolute",
          top: this.props.scroll.rows.shift
        }}
        onWheel={this.onWheel}
      >
        {items}
      </div>
    );
  };
}
