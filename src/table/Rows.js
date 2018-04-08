import React from "react";
import classnames from "classnames";
import { ScrollableGrid, utils, Input } from "zebulon-controls";
import { cellData } from "./utils/compute.data";
export class Rows extends ScrollableGrid {
  shouldComponentUpdate(nextProps) {
    return !nextProps.status.loadingPage && !nextProps.noUpdate;
  }

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
    rowIndex,
    onDoubleClick,
    componentId
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
      "zebulon-table-cell-odd": rowIndex % 2 === 1,
      "zebulon-table-cell-selected": selected,
      "zebulon-table-cell-focused": focused,
      "zebulon-table-cell-editable": editable && focused
    });
    // if (column.dataType === "boolean") value = value || false;
    const id = `cell: ${componentId}-${row.index_}-${column.index_}`;
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
        id={id}
        key={id}
        onChange={onChange}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onFocus={onFocus}
        onDoubleClick={
          onDoubleClick ? e => onDoubleClick(e, row, column) : () => {}
        }
      />
    );
  };
  rowRenderer = (
    row,
    status,
    meta,
    startIndex,
    shift,
    visibleWidth,
    rowHeight,
    rowIndex,
    hasFocus,
    componentId
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
          if (column.dataType === "number") {
            textAlign = "right";
          } else if (
            column.dataType === "date" ||
            column.dataType === "boolean"
          ) {
            textAlign = "center";
          }
        }
        const columnIndex = index;
        const selectedRange = this.selectedRange();
        const selected = utils.isInRange(
            { columns: index, rows: rowIndex },
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
            status,
            this.props.data,
            this.props.params,
            {
              position: "absolute",
              left,
              width: Math.min(
                false ? column.computedWidth + shift : column.computedWidth,
                visibleWidth - left
              ),
              // column.computedWidth,
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
            rowIndex,
            this.props.onDoubleClick,
            componentId
          )
        );
        left += column.computedWidth;
      }
      index += 1;
    }
    return (
      <div
        key={rowIndex}
        id={rowIndex}
        style={{
          display: "flex",
          height: rowHeight
          // position: "inherit",
          // left: 0
        }}
      >
        {cells}
      </div>
    );
  };

  getContent = () => {
    const items = [];
    const {
      data,
      meta,
      height,
      rowHeight,
      width,
      // selectedCell,
      // selectCell,
      updatedRows,
      hasFocus,
      dataLength,
      componentId
    } = this.props;
    console.log(
      "getContent",
      this.props.noVerticalScrollbar,
      height,
      this.props.scroll.rows
    );
    // if (data.length === 0) {
    //   return null;
    // }
    let i = 0,
      index = this.props.scroll.rows.startIndex,
      indexPage = 0,
      rows = data,
      columnStartIndex = this.props.scroll.columns.startIndex,
      columnShift = this.props.scroll.columns.shift;
    if (typeof data === "object" && data.page) {
      rows = data.page;
      indexPage = data.pageStartIndex;
    }
    const visibleWidth = width - this.scrollbars.vertical.width;
    if (!this.props.noVerticalScrollbar) {
      columnStartIndex = Math.max(
        columnStartIndex,
        utils.isNullOrUndefined(meta.lockedIndex) ? 0 : meta.lockedIndex + 1
      );
    } else {
      columnStartIndex = 0;
      columnShift = 0;
    }
    while (index < (dataLength || data.length) && i < height / rowHeight) {
      let row = rows[index - indexPage];
      const status = updatedRows[row.index_];
      if (meta.serverPagination && status && status.rowUpdated) {
        row = status.rowUpdated;
      }
      items.push(
        this.rowRenderer(
          row,
          status,
          meta.properties,
          columnStartIndex,
          columnShift,
          visibleWidth,
          rowHeight,
          index,
          hasFocus,
          componentId
          // ,
          // selectedCell,
          // selectCell
        )
      );
      index++;
      i++;
    }
    const style = {
      // position: "absolute",
      top: this.props.scroll.rows.shift || 0,
      width: visibleWidth,
      position: "inherit",
      height: "inherit"
    };
    // if (this.props.noVerticalScrollbar) {
    //   style.borderRight = "solid 0.03em rgba(0, 0, 0, 0.5)";
    // }
    return (
      <div id="totot" style={style} onWheel={this.onWheel}>
        {items}
      </div>
    );
  };
}
