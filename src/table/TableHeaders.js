import React, { Component } from "react";
import { utils, ContextualMenuClient, Input } from "zebulon-controls";
// import { Input } from "./Input";
import { computeMetaPositions } from "./utils/compute.meta";
import { cellData } from "./utils/compute.data";
import { getRowErrors } from "./utils/utils";
import classnames from "classnames";

const filter = (
  column,
  position,
  height,
  width,
  filterTo,
  onChange,
  openFilter,
  focusedId,
  componentId
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
    value = "Y";
  } else if (column.filterType === "values") {
    value = "";
  }
  const focused =
    (focusedId || document.activeElement.id) ===
    String(column.index_ + 1000 * filterTo);
  const id = `filter${filterTo ? "To" : ""}: ${componentId}--${column.index_}`;
  return (
    <Input
      column={column}
      id={id}
      key={id}
      className={className}
      style={{
        // position: "absolute",
        height,
        width,
        textAlign
      }}
      editable={true}
      focused={focused}
      inputType="filter"
      tabIndex={column.index_ * 2 + (filterTo || 0) + 100}
      value={value}
      filterTo={filterTo}
      onChange={onChange}
      onFocus={e => openFilter(e, column)}
    />
  );
};
const header = (
  column,
  position,
  height,
  width,
  handleClick,
  handleDragStart,
  handleDragOver,
  handleDrop,
  componentId
  // handleDragEnd
) => {
  let sort = "";
  if (column.sort === "asc") {
    sort = "↑";
  } else if (column.sort === "desc") {
    sort = "↓";
  }
  const id = `header: ${componentId}--${column.index_}`;
  return (
    <ContextualMenuClient
      id={id}
      key={id}
      column={column}
      menuId="column-header-menu"
      componentId={componentId}
    >
      <div
        key={id}
        id={id}
        draggable={true}
        className="zebulon-table-cell zebulon-table-header"
        onClick={() => handleClick(column, false)}
        onDoubleClick={() => handleClick(column, true)}
        onDragStart={e => handleDragStart(e, "move")}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          height,
          width,
          justifyContent: "space-between",
          display: "flex"
        }}
      >
        <div id={id} style={{ width: width - 12 }}>
          {column.caption || column.id}
        </div>
        <div style={{ display: "flex" }}>
          <div>{sort}</div>
          <div
            id={id}
            draggable={true}
            style={{
              width: 3,
              cursor: "col-resize",
              opacity: 0
            }}
            onDragStart={e => handleDragStart(e, "resize")}
          />
        </div>
      </div>
    </ContextualMenuClient>
  );
};
const auditCell = (row, column, status, data, params, style, componentId) => {
  const { value } = cellData(row, column, status, data, params, false);
  let textAlign = column.alignement || "left";
  if (!column.alignement) {
    if (column.dataType === "number") {
      textAlign = "right";
    } else if (column.dataType === "date" || column.dataType === "boolean") {
      textAlign = "center";
    }
  }
  style.textAlign = textAlign;
  const className = classnames({
    "zebulon-table-cell": true,
    "zebulon-table-cell-audit": true,
    "zebulon-table-cell-odd": true
    // "zebulon-table-cell-selected": selected,
    // "zebulon-table-cell-focused": focused,
    // "zebulon-table-cell-editable": editable && focused
  });
  // if (column.dataType === "boolean") value = value || false;
  const id = `audit-cell: ${componentId}-${row.index_}-${column.index_}`;
  return (
    <Input
      row={row}
      column={column}
      style={style}
      className={className}
      value={value}
      key={id}
      id={id}
    />
  );
};
const filterEmpty = (id, position, width, height) => {
  return (
    <div
      key={`${id}-filter-empty`}
      className="zebulon-table-cell zebulon-table-header zebulon-table-filter-empty"
      style={{
        height,
        width,
        border: "0.02em solid rgba(0, 0, 0, 0.2) "
      }}
    />
  );
};

// ↑↓
export class Headers extends Component {
  handleClick = (column, double) => {
    if (!this.props.isActive && this.props.onActivation) {
      this.props.onActivation();
    }
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
  getColumnIndex = id => {
    const ids = id.split("-");
    return ids[ids.length - 1];
  };
  handleDragStart = (e, type) => {
    this.dragId = e.target.id;
    this.dragType = type;
    this.dragX = e.pageX;
    e.stopPropagation();
  };

  handleDragOver = e => {
    if (
      this.dragType === "move" ||
      (this.dragType === "resize" &&
        this.props.meta.properties[this.getColumnIndex(this.dragId)]
          .computedWidth +
          e.pageX -
          this.dragX >
          20)
    ) {
      e.preventDefault();
    }
  };

  handleDrop = e => {
    e.preventDefault();
    const meta = this.props.meta.properties;
    if (this.dragType) {
      if (
        this.dragType === "move" &&
        !utils.isNullOrUndefined(this.dragId) &&
        this.dragId !== e.target.id
      ) {
        meta[this.getColumnIndex(this.dragId)].index_ =
          meta[this.getColumnIndex(e.target.id)].index_ + 0.1;
        meta.sort((a, b) => a.index_ - b.index_);
        computeMetaPositions(this.props.meta);
        this.props.onMetaChange();
      } else if (
        this.dragType === "resize" &&
        !utils.isNullOrUndefined(this.dragX) &&
        !utils.isNullOrUndefined(e.pageX)
      ) {
        const column = meta[this.getColumnIndex(this.dragId)];
        const zoom = column.computedWidth / column.width;
        column.computedWidth += e.pageX - this.dragX;
        column.width = column.computedWidth / zoom;
        computeMetaPositions(this.props.meta);
        this.props.onMetaChange();
      }
    }
    this.dragId = null;
    this.dragType = null;
    this.dragX = null;
  };

  render() {
    let { shift, startIndex: index } = this.props.scroll;
    const {
      meta,
      width,
      height,
      onChange,
      openFilter,
      focusedId,
      headersLength,
      locked,
      auditedRow,
      auditStatus,
      componentId,
      data,
      params
    } = this.props;
    const cells = [];
    let position = 0,
      first = true;
    if (!locked) {
      index = Math.max(
        index,
        utils.isNullOrUndefined(meta.lockedIndex) ? 0 : meta.lockedIndex + 1
      );
    } else {
      index = 0;
      shift = 0;
    }
    while (index < meta.properties.length && position < width) {
      const column = meta.properties[index];
      const columnWidth = Math.max(
        Math.min(
          first ? column.computedWidth + shift : column.computedWidth,
          width - position
        ),
        0
      );
      let div = null;
      if (!column.hidden && columnWidth) {
        first = false;
        div = header(
          column,
          position,
          height / headersLength,
          columnWidth,
          this.handleClick,
          this.handleDragStart,
          this.handleDragOver,
          this.handleDrop,
          componentId
        );
        if (headersLength > 1) {
          if (auditedRow) {
            div = [div];
            const style = {
              // position: "absolute",
              // left: position,
              width: columnWidth,
              // top: height / 2,
              height: height / 2
            };
            div.push(
              auditCell(
                auditedRow,
                column,
                auditStatus,
                data,
                params,
                style,
                componentId
              )
            );
          } else {
            div = [div];
            if (
              !["object", "array", "function", "text"].includes(
                utils.nullValue(column.dataType, "object")
              )
            ) {
              div.push(
                filter(
                  column,
                  position,
                  height / headersLength,
                  columnWidth,
                  false,
                  onChange,
                  openFilter,
                  focusedId,
                  componentId
                )
              );
            } else {
              div.push(
                filterEmpty(
                  column.id,
                  position,
                  columnWidth,
                  height / headersLength
                )
              );
            }
            if (headersLength === 3) {
              if (
                column.filterType === "between" &&
                !["object", "array", "function", "text"].includes(
                  utils.nullValue(column.dataType, "object")
                )
              ) {
                div.push(
                  filter(
                    column,
                    position,
                    height / headersLength,
                    columnWidth,
                    column.filterType === "between",
                    onChange,
                    openFilter,
                    focusedId,
                    componentId
                  )
                );
              } else {
                div.push(
                  filterEmpty(
                    `${column.id}-to`,
                    position,
                    columnWidth,
                    height / headersLength
                  )
                );
              }
            }
          }
          div = (
            <div
              key={column.id}
              style={{ display: "block", width: columnWidth, height }}
            >
              {div}
            </div>
          );
        }
        cells.push(div);
        position += columnWidth;
      }
      index += 1;
    }
    const style = {
      width,
      height,
      overflow: "hidden",
      display: "flex"
    };
    if (cells.length) {
      return (
        <div
          key={-2 - locked}
          // id={type + filterTo ? "To" : ""}
          style={{ ...this.props.style, ...style }}
        >
          {cells}
        </div>
      );
    } else {
      return null;
    }
  }
}
export const statusCell = (
  style,
  className,
  index,
  row,
  status,
  onClick,
  onDoubleClick,
  handleErrors,
  componentId,
  checkable,
  onChange,
  draggable,
  handleDragStart
) => {
  let glyph;
  if (status.deleted_) {
    glyph = "X";
  } else if (status.new_) {
    glyph = "+";
  } else if (status.updated_) {
    glyph = "√";
  } else {
    glyph = null;
  }
  const errors = getRowErrors(status, status.index_);
  if (errors.length && !status.deleted_) {
    style.color = "red";
  }
  if (checkable) {
    glyph = (
      <input
        type="checkbox"
        checked={status.checked_ || false}
        onChange={() => onChange(row.index_)}
        // style={{ height: 20 }}
      />
    );
  }
  const id = `status: ${componentId}-${row.index_}-`;
  return (
    <ContextualMenuClient
      // id={"row-status: " + index}
      // key={index}
      id={id}
      key={id}
      status={status}
      row={row}
      menuId="row-header-menu"
      componentId={componentId}
    >
      <div
        id={id}
        key={id}
        className={className}
        style={style}
        onClick={() => onClick(index)}
        // onDoubleClick={e => onDoubleClick(e, status)}
        onMouseOver={e => handleErrors(e, errors)}
        onMouseOut={e => handleErrors(e, [])}
        onDoubleClick={onDoubleClick ? e => onDoubleClick(e, row) : () => {}}
        draggable={draggable}
        onDragStart={handleDragStart}
      >
        {glyph}
      </div>
    </ContextualMenuClient>
  );
};
export class Status extends Component {
  constructor(props) {
    super(props);
    this.state = { updatedRows: this.props.updatedRows };
  }
  componentWillReceiveProps(nextProps) {
    if (this.state.updatedRows !== nextProps.updatedRows) {
      this.setState({ updatedRows: nextProps.updatedRows });
    }
  }
  shouldComponentUpdate(nextProps) {
    return !nextProps.status.loadingPage && !nextProps.noUpdate;
  }
  onClick = index => {
    this.props.selectRange({
      end: { rows: index, columns: 0 },
      start: { rows: index, columns: this.props.meta.length - 1 }
    });
  };
  onChange = index => {
    if (this.props.checkable) {
      const updatedRows = this.state.updatedRows;
      if (!updatedRows[index]) {
        updatedRows[index] = { errors: {} };
      }
      updatedRows[index].checked_ = !updatedRows[index].checked_;
      if (this.props.checkable === 2) {
        updatedRows[index + 1 - 2 * (index % 2)].checked_ = !updatedRows[index]
          .checked_;
      }
      this.setState({ updatedRows });
    }
  };
  handleDragStart = e => {
    e.dataTransfer.setData("text", `status: ${e.target.id}`);
  };
  render() {
    const {
      height,
      rowHeight,
      data,
      scroll,
      selectedIndex,
      handleErrors,
      dataLength,
      componentId,
      checkable,
      onDoubleClick,
      draggable
    } = this.props;
    const updatedRows = this.state.updatedRows;
    let index = 0,
      indexPage = 0,
      rows = data;
    if (typeof data === "object" && data.page) {
      rows = data.page;
      indexPage = data.pageStartIndex;
    }
    const cells = [];
    while (
      index < Math.min(dataLength || data.length, Math.ceil(height / rowHeight))
    ) {
      const style = {
        // position: "relative",
        top: scroll.shift + index * rowHeight,
        width: rowHeight,
        height: rowHeight
      };
      if (index + scroll.startIndex - indexPage < (dataLength || data.length)) {
        const row = rows[index + scroll.startIndex - indexPage];
        const updatedRow = updatedRows[row.index_] || { errors: {} };
        const className = classnames({
          "zebulon-table-status": true,
          "zebulon-table-status-selected":
            selectedIndex === index + scroll.startIndex
        });
        const ix = index;
        cells.push(
          statusCell(
            style,
            className,
            index + scroll.startIndex,
            row,
            updatedRow,
            this.onClick,
            onDoubleClick,
            (e, errors) => handleErrors(e, ix, errors),
            componentId,
            checkable,
            this.onChange,
            draggable
          )
        );
      }
      index += 1;
    }
    return (
      <div
        key={"status: " + componentId}
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
