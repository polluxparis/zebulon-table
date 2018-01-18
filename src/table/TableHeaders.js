import React, { Component } from "react";
import { utils } from "zebulon-controls";
import { Input } from "./Input";
import { computeMetaPositions } from "./utils";
import classnames from "classnames";
export const editCell = (
  style,
  className,
  index,
  row,
  onClick,
  onDoubleClick,
  handleErrors
) => {
  let glyph;
  if (row.deleted_) {
    glyph = "X";
  } else if (row.new_) {
    glyph = "+";
  } else if (row.updated_) {
    glyph = "√";
  } else {
    glyph = null;
  }
  const errors = [];
  Object.keys(row.errors).forEach(column => {
    if (row.errors[column] || column !== "n_") {
      Object.keys(row.errors[column]).forEach(type => {
        if (type !== "n_") {
          errors.push({ column, type, error: row.errors[column][type] });
        }
      });
    }
  });
  if (errors.length && !row.deleted_) {
    style.color = "red";
  }
  return (
    <div
      key={index}
      className={className}
      style={style}
      onClick={() => onClick(index)}
      onDoubleClick={e => onDoubleClick(e, row)}
      onMouseOver={e => handleErrors(e, errors)}
      onMouseOut={e => handleErrors(e, [])}
    >
      {glyph}
    </div>
  );
};
const filter = (
  column,
  position,
  width,
  filterTo,
  onChange,
  openFilter,
  handleDragOver,
  handleDrop,
  focusedId
) => {
  const className = classnames({
    "zebulon-table-cell": true,
    "zebulon-table-header": true,
    "zebulon-table-filter": true,
    "zebulon-table-filter-checkbox-undefined":
      (column.v === undefined || column.v === null) &&
      column.dataType === "boolean"
  });
  let textAlign = column.alignement || "left";
  if (!column.alignement) {
    if (column.dataType === "number") textAlign = "right";
    else if (column.dataType === "date" || column.dataType === "boolean")
      textAlign = "center";
  }
  let value = column.v;
  if (filterTo) {
    value = column.vTo;
  } else if (column.filterType === "values" && column.v) {
    value = "Ỵ";
  } else if (column.filterType === "values") {
    value = "";
  }
  const focused =
    (focusedId || document.activeElement.id) ===
    String(column.index_ + 1000 * filterTo);

  return (
    <Input
      column={column}
      key={column.id}
      className={className}
      style={{
        position: "absolute",
        left: position,
        width,
        textAlign
      }}
      editable={true}
      focused={focused}
      // autofocus={focused}
      inputType="filter"
      tabIndex={column.index_ * 2 + (filterTo || 0) + 100}
      value={value}
      filterTo={filterTo}
      onChange={onChange}
      onFocus={e => openFilter(e, column)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  );
};
const header = (
  column,
  position,
  width,
  handleClick,
  handleDragStart,
  handleDragOver,
  handleDrop
  // handleDragEnd
) => {
  let sort = "";
  if (column.sort === "asc") {
    sort = "↑";
  } else if (column.sort === "desc") {
    sort = "↓";
  }

  return (
    <div
      key={column.id}
      id={column.index_}
      draggable={true}
      className="zebulon-table-cell zebulon-table-header"
      onClick={() => handleClick(column, false)}
      onDoubleClick={() => handleClick(column, true)}
      onDragStart={e => handleDragStart(e, "move")}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        position: "absolute",
        left: position,
        width,
        justifyContent: "space-between",
        display: "flex"
      }}
    >
      <div id={column.index_} style={{ width: width - 12 }}>
        {column.caption || column.id}
      </div>
      <div style={{ display: "flex" }}>
        <div>{sort}</div>
        <div
          id={column.index_}
          draggable={true}
          style={{
            // height,
            width: 3,
            cursor: "col-resize",
            opacity: 0
          }}
          onDragStart={e => handleDragStart(e, "resize")}
        />
      </div>
    </div>
  );
};

const filterEmpty = (id, position, width) => {
  return (
    <div
      key={id}
      className="zebulon-table-cell zebulon-table-header zebulon-table-filter-empty"
      style={{
        position: "absolute",
        left: position,
        width,
        border: "0.02em solid rgba(0, 0, 0, 0.2) "
      }}
    />
  );
};

// ↑↓
export class Headers extends Component {
  // constructor(props) {
  //   super(props);
  //   console.log("constructor");
  // }
  handleClick = (column, double) => {
    const { onSort } = this.props;
    if (!double) {
      this.timer = setTimeout(() => {
        if (!this.prevent) {
          onSort(column, false);
        }
        this.prevent = false;
      }, 200);
    } else {
      clearTimeout(this.timer);
      this.prevent = true;
      onSort(column, true);
    }
  };

  handleDragStart = (e, type) => {
    this.dragMessage = { type, index: e.target.id, x: e.pageX };
    e.dataTransfer.setData("text", JSON.stringify(this.dragMessage));
    e.stopPropagation();
  };

  handleDragOver = e => {
    // console.log("dragover", e.target, e.dataTransfer.getData("text"));
    if (
      this.dragMessage.type === "move" ||
      (this.dragMessage.type === "resize" &&
        this.props.meta[this.dragMessage.index].computedWidth +
          e.pageX -
          this.dragMessage.x >
          20)
    ) {
      e.preventDefault();
    }
  };

  handleDrop = e => {
    e.preventDefault();
    const msg = JSON.parse(e.dataTransfer.getData("text"));
    // console.log("drop", e.target.id, msg);
    const { meta } = this.props;
    if (msg.type) {
      if (
        msg.type === "move" &&
        !utils.isNullOrUndefined(msg.index) &&
        msg.index !== e.target.id
      ) {
        // console.log("drag end", msg.index, e.target.id);
        meta[msg.index].index_ = meta[e.target.id].index_ + 0.1;
        meta.sort((a, b) => (a.index_ > b.index_) - (a.index_ < b.index));
        computeMetaPositions(meta);
        this.props.onMetaChange();
        // console.log("drag end", e);
      } else if (
        msg.type === "resize" &&
        !utils.isNullOrUndefined(msg.x) &&
        !utils.isNullOrUndefined(e.pageX)
      ) {
        const column = meta[msg.index];
        const zoom = column.computedWidth / column.width;
        column.computedWidth += e.pageX - msg.x;
        column.width = column.computedWidth / zoom;
        computeMetaPositions(meta);
        this.props.onMetaChange();
      }
    }
  };

  render() {
    let { shift, startIndex: index } = this.props.scroll;
    const {
      meta,
      width,
      height,
      onChange,
      openFilter,
      filterTo,
      type,
      focusedId
    } = this.props;
    // const type = this.state.type;
    const cells = [
      <div
        key="status"
        className="zebulon-table-corner"
        style={{
          position: "absolute",
          width: height,
          left: 0,
          border: "0.02em solid rgba(0, 0, 0, 0.3)"
        }}
      />
    ];
    let position = height;
    while (index < meta.length && position < width) {
      const column = meta[index];
      const columnWidth = Math.max(
        Math.min(
          index === this.props.scroll.startIndex
            ? column.computedWidth + shift
            : column.computedWidth,
          width - position
        ),
        0
      );
      if (!column.hidden && columnWidth) {
        let div;
        if (type === "header") {
          div = header(
            column,
            position,
            columnWidth,
            this.handleClick,
            this.handleDragStart,
            this.handleDragOver,
            this.handleDrop
            // this.handleDragEnd
          );
        } else if (type === "filter") {
          if (
            (filterTo && column.filterType !== "between") ||
            utils.isNullOrUndefined(column.dataType)
          ) {
            div = filterEmpty(column.id, position, columnWidth);
          } else {
            div = filter(
              column,
              position,
              columnWidth,
              filterTo || false,
              onChange,
              column.filterType === "values" ? openFilter : () => {},
              this.handleDragOver,
              this.handleDrop,
              focusedId
            );
          }
        }
        cells.push(div);
        position += columnWidth;
      }
      index += 1;
    }
    if (cells.length) {
      return (
        <div
          key={-2}
          id={type + filterTo ? "To" : ""}
          style={{
            width,
            height,
            overflow: "hidden"
          }}
          // onDragOver={e => this.handleDragOver(e)}
          // onDrop={e => this.handleDrop(e)}
        >
          {cells}
        </div>
      );
    } else {
      return null;
    }
  }
}
export class Status extends Component {
  shouldComponentUpdate(nextProps) {
    return !nextProps.status.loadingPage;
  }
  onClick = index =>
    this.props.selectRange({
      end: { rows: index, columns: 0 },
      start: { rows: index, columns: this.props.meta.length - 1 }
    });
  // onMouseOver = (e, row, errors) => {
  //   if (errors.length) {
  //     console.log("mouse over", e, row, error);
  //   }
  // };
  render() {
    const {
      height,
      rowHeight,
      data,
      scroll,
      updatedRows,
      selectedIndex,
      handleErrors,
      dataLength
    } = this.props;
    let index = 0,
      indexPage = 0,
      rows = data;
    if (typeof data === "object" && data.page) {
      rows = data.page;
      indexPage = data.pageStartIndex;
    }
    // const shift = scroll.shift;
    const cells = [];
    while (
      index < Math.min(dataLength || data.length, Math.ceil(height / rowHeight))
    ) {
      const style = {
        position: "absolute",
        top: scroll.shift + index * rowHeight,
        width: rowHeight,
        height: rowHeight
      };
      if (index + scroll.startIndex - indexPage < (dataLength || data.length)) {
        const updatedRow = updatedRows[
          rows[index + scroll.startIndex - indexPage].index_
        ] || { errors: {} };
        const className = classnames({
          "zebulon-table-status": true,
          "zebulon-table-status-selected":
            selectedIndex === index + scroll.startIndex
        });
        const ix = index;
        cells.push(
          editCell(
            style,
            className,
            index + scroll.startIndex,
            updatedRow,
            this.onClick,
            () => {},
            (e, errors) => handleErrors(e, ix, errors)
          )
        );
      }
      index += 1;
    }
    return (
      <div
        key={-1}
        style={{
          width: rowHeight,
          height,
          overflow: "hidden",
          position: "relative",
          diplay: "flex"
        }}
      >
        {cells}
      </div>
    );
  }
}
// <div
//   id="resize-bar"
//   style={{
//     position: "relative",
//     top: 0,
//     height: "inherit",
//     width: 2,
//     backgroundColor: "grey",
//     overflow: "hidden"
//     // ...this.getItemPosition()
//   }}
// />
