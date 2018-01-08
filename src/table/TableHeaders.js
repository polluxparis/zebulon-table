import React, { Component } from "react";
// import { Input } from "zebulon-controls";
import { Input } from "./Input";
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
    if (row.errors[column]) {
      Object.keys(row.errors[column]).forEach(type =>
        errors.push({ column, type, error: row.errors[column][type] })
      );
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
const filter = (column, position, width, filterTo, onChange, openFilter) => {
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
      inputType="filter"
      value={
        column.filterType === "values" ? column.v ? (
          "Ỵ"
        ) : (
          ""
        ) : filterTo ? (
          column.vTo
        ) : (
          column.v
        )
      }
      onChange={onChange}
      onFocus={e => openFilter(e, column)}
    />
  );
  // }
};
const header = (column, position, width, handleClick) => {
  let sort = "";
  if (column.sort === "asc") {
    sort = "↑";
  } else if (column.sort === "desc") {
    sort = "↓";
  }

  return (
    <div
      key={column.id}
      className="zebulon-table-cell zebulon-table-header"
      onClick={() => handleClick(column, false)}
      onDoubleClick={() => handleClick(column, true)}
      style={{
        position: "absolute",
        left: position,
        width,
        justifyContent: "space-between",
        display: "flex"
        // border: "0.02em solid rgba(0, 0, 0, 0.3) "
      }}
    >
      <div style={{ width: width - 12 }}>{column.caption || column.id}</div>
      <div>{sort}</div>
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
  // onDoubleClick = () => {
  //   onSort(e, column, true);
  // };
  render() {
    let { shift, startIndex: index } = this.props.scroll;
    const {
      meta,
      width,
      height,
      type,
      onChange,
      openFilter,
      filterTo
    } = this.props;
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
          div = header(column, position, columnWidth, this.handleClick);
        } else if (type === "filter") {
          if (filterTo && column.filterType !== "between") {
            div = filterEmpty(column.id, position, columnWidth);
          } else {
            div = filter(
              column,
              position,
              columnWidth,
              filterTo,
              onChange,
              column.filterType === "values" ? openFilter : () => {}
            );
          }
        }

        // if (!filterTo || column.filterType === "between") {
        cells.push(div);
        // }
        position += columnWidth;
      }
      index += 1;
    }
    if (cells.length) {
      return (
        <div
          key={-2}
          id={type}
          style={{
            width,
            height,
            overflow: "hidden"
          }}
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
      handleErrors
    } = this.props;
    let index = 0;

    // const shift = scroll.shift;
    const cells = [];
    while (index < Math.min(data.length, Math.ceil(height / rowHeight))) {
      const style = {
        position: "absolute",
        top: scroll.shift + index * rowHeight,
        width: rowHeight,
        height: rowHeight
      };
      if (index + scroll.startIndex < data.length) {
        const updatedRow = updatedRows[
          data[index + scroll.startIndex].index_
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
