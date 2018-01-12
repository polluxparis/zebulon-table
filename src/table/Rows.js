import React from "react";
import classnames from "classnames";
import { ScrollableGrid, utils, constants } from "zebulon-controls";
import { Input } from "./Input";
import { cellData } from "./utils";
console.log("constants", constants);
export class Rows extends ScrollableGrid {
  getRatios = props => {
    const { height, width, meta, rowHeight, scroll, data } = props;
    const lastColumn = meta[meta.length - 1];
    const columnsWidth = lastColumn.position + lastColumn.computedWidth;
    // const verticalDisplay=height / (data.length * rowHeight);
    const horizontalDisplay =
      (width -
        (data.length * rowHeight > height ? constants.ScrollbarSize : 0)) /
      columnsWidth;
    const verticalDisplay =
      (height - (columnsWidth > width ? constants.ScrollbarSize : 0)) /
      (data.length * rowHeight);
    return {
      vertical: {
        display: verticalDisplay,
        position: Math.min(
          scroll.rows.startIndex / data.length,
          1 - verticalDisplay
        )
      },
      horizontal: {
        display: horizontalDisplay,
        position: Math.min(
          scroll.columns.position / columnsWidth,
          1 - horizontalDisplay
        )
      }
    };
  };

  cell = (
    row,
    column,
    status,
    data,
    params,
    style,
    focused,
    hasFocus,
    selected,
    onClick,
    onMouseOver,
    onChange,
    onFocus,
    rowIndex
  ) => {
    const { editable, value, select } = cellData(
      row,
      column,
      status,
      data,
      params,
      focused
    );
    const className = classnames({
      "zebulon-table-cell": true,
      "zebulon-table-cell-selected": selected,
      "zebulon-table-cell-focused": focused,
      "zebulon-table-cell-editable": editable && focused
    });
    // if (column.dataType === "boolean") value = value || false;
    return (
      <Input
        row={row}
        column={column}
        style={style}
        className={className}
        value={value}
        editable={editable}
        focused={focused}
        hasFocus={hasFocus}
        select={select}
        key={`cell-${row.index_}-${column.id}`}
        onChange={onChange}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onFocus={onFocus}
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
    rowIndex,
    hasFocus
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
            updatedRows[row.index_],
            this.props.data,
            this.props.params,
            {
              position: "absolute",
              left,
              width: column.computedWidth,
              height: rowHeight,
              textAlign
            },
            focused,
            hasFocus && focused,
            selected,
            onClick,
            onMouseOver,
            this.props.onChange,
            // () => {}, //onDoubleClick,
            onFocus,
            rowIndex
          )
        );
        left += column.computedWidth;
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
      updatedRows,
      hasFocus
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
          hasFocus,
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
