import React from "react";
import classnames from "classnames";
import { ScrollableGrid, utils, Input } from "zebulon-controls";
import { cellData } from "./utils/compute.data";
export class Rows extends ScrollableGrid {
  shouldComponentUpdate(nextProps) {
    return !nextProps.status.loadingPage && !nextProps.noUpdate;
  }
  componentDidUpdate() {
    if (this.focused) {
      // console.log("focus", this.focused);
      document.getElementById(this.focused).focus();
      // document.getElementById(this.focused).children[0].focus();
      this.focused = undefined;
    }
    this.noOver = false;
  }
  cell = (
    tableEditable,
    row,
    column,
    status,
    data,
    params,
    style,
    focused,
    hasFocus,
    selected,
    onMouseDown,
    onMouseUp,
    onMouseOver,
    onChange,
    onFocus,
    rowIndex,
    onDoubleClick,
    componentId
  ) => {
    const { editable, value, select, dataType } = cellData(
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
      "zebulon-table-cell-editable": editable && focused,
      "zebulon-table-cell-select": editable && focused && select,
      "zebulon-table-cell-checkbox": dataType === "boolean"
    });
    const id = `cell: ${componentId}-${row.index_}-${column.index_}`;
    if (focused && hasFocus && editable) {
      this.focused = id;
    }
    return (
      <Input
        row={row}
        column={column}
        style={style}
        className={className}
        value={value}
        editable={editable && tableEditable}
        focused={focused}
        hasFocus={hasFocus}
        select={select}
        dataType={dataType}
        inputType="cell"
        id={id}
        key={id}
        onChange={onChange}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseOver={onMouseOver}
        onFocus={onFocus}
        onDoubleClick={
          onDoubleClick ? e => onDoubleClick(e, row, column) : () => {}
        }
        menu="cell-menu"
        component={componentId}
      />
    );
  };
  rowRenderer = (
    tableEditable,
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
  ) => {
    const cells = [];
    let left = shift,
      index = startIndex;
    const selectedRange = this.selectedRange();
    while (index < meta.length && left < visibleWidth) {
      const column = meta[index];
      if (!column.hidden) {
        let textAlign = column.alignement || "left";
        if (!column.alignement) {
          if (column.dataType === "number") {
            textAlign = "right";
          } else if (
            column.dataType === "date" ||
            column.dataType === "month" ||
            column.dataType === "year" ||
            column.dataType === "boolean"
          ) {
            textAlign = "center";
          }
        }
        const columnIndex = index;
        const selected = utils.isInRange(
            { columns: index, rows: rowIndex },
            selectedRange.start,
            selectedRange.end
          ),
          focused =
            selectedRange.end.rows === rowIndex &&
            selectedRange.end.columns === index,
          onMouseDown = e => {
            // e.preventDefault();
            this.selectCell(
              { rows: rowIndex, columns: columnIndex },
              e.shiftKey,
              false
            );
          },
          onMouseOver = e => {
            if (
              (e.buttons & 1) === 1 &&
              !(this.noOver || this.props.openedFilter)
            ) {
              // e.preventDefault();
              this.selectCell({ rows: rowIndex, columns: columnIndex }, false);
            }
          },
          onMouseUp = e => {
            // e.preventDefault();
            this.mouseDown = false;
          };
        cells.push(
          this.cell(
            tableEditable,
            row,
            column,
            status,
            this.props.data,
            this.props.params,
            {
              position: "absolute", //, toto
              left,
              width: Math.min(
                false ? column.computedWidth + shift : column.computedWidth,
                visibleWidth - left
              ),
              height: rowHeight,
              textAlign
            },
            focused,
            hasFocus && focused,
            selected,
            onMouseDown,
            onMouseUp,
            onMouseOver,
            this.props.onChange,
            this.props.onFocus,
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
        }}
      >
        {cells}
      </div>
    );
  };

  getContent = () => {
    this.noOver = true;
    const items = [];
    const {
      data,
      meta,
      height,
      rowHeight,
      width,
      updatedRows,
      hasFocus,
      componentId,
      locked
    } = this.props;
    console.log("render rows", hasFocus, this.selectedRange(), meta);
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
    while (index < rows.length && i < height / rowHeight) {
      let row = rows[index - indexPage];
      const status = updatedRows[row.index_];
      if (meta.serverPagination && status && status.rowUpdated) {
        row = status.rowUpdated;
      }
      items.push(
        this.rowRenderer(
          meta.table.editable,
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
        )
      );
      index++;
      i++;
    }
    const style = {
      top: this.props.scroll.rows.shift || 0,
      width: visibleWidth,
      position: "inherit",
      height: "inherit"
    };
    return (
      <div
        id="content"
        style={style}
        onWheel={this.onWheel}
        className={locked ? "zebulon-locked-columns" : ""}
      >
        {items}
      </div>
    );
  };
}
