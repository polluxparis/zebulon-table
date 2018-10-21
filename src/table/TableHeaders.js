import React, { Component } from "react";
import { utils, ContextualMenuClient, Input, icons } from "zebulon-controls";
// import { Input } from "./Input";
import { computeMetaPositions } from "./utils/compute.meta";
import { cellData } from "./utils/compute.data";
import { getRowErrors, getRowStatus } from "./utils/utils";
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
  component
) => {
  const className = classnames({
    "zebulon-table-cell": true,
    "zebulon-table-header": true,
    "zebulon-table-filter": true,
    "zebulon-table-filter-checkbox": column.dataType === "boolean",
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
  const id = `filter${filterTo ? "To" : ""}: ${component}--${column.index_}`;
  const focused = (document.activeElement || {}).id === id;
  let value = column.v,
    div;
  if (column.filterType === "values" && column.v) {
    // value = "Y";
    div = (
      <div
        style={{
          height,
          width
        }}
        id={id}
        key={id}
        className={className}
        onClick={e => openFilter(e, column)}
      >
        <div
          style={{
            background: icons.filter,
            backgroundSize: "cover",
            height: "1em",
            width: "1em",
            marginTop: "0.1em",
            marginRight: "0.1em"
          }}
        />
      </div>
    );
  } else {
    if (filterTo) {
      value = column.vTo;
    } else if (column.filterType === "values") {
      value = "";
    }
    div = (
      <Input
        column={column}
        id={id}
        key={id}
        className={className}
        style={{
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
        onFocus={e => {
          // console.log("filter", this);
          openFilter(e, column);
        }}
      />
    );
  }

  return div;
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
  component
  // handleDragEnd
) => {
  let sort = "";
  if (column.sort === "asc") {
    sort = "↑";
  } else if (column.sort === "desc") {
    sort = "↓";
  }
  const id = `header: ${component}--${column.index_}`;
  return (
    <ContextualMenuClient
      key={id}
      id={id}
      className="zebulon-table-cell zebulon-table-header"
      onClick={() => handleClick(column, false)}
      onDoubleClick={() => handleClick(column, true)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        height,
        width,
        justifyContent: "space-between",
        display: "flex",
        paddingRight: "unset"
      }}
      column={column}
      menu="column-header-menu"
      component={component}
    >
      <div
        id={id}
        key={0}
        style={{ width: width - 15 }}
        draggable={true}
        onDragStart={e => handleDragStart(e, "move")}
      >
        {column.caption || column.id}
      </div>
      <div id={id} key={1} style={{ width: 8 }}>
        {sort}
      </div>
      <div
        id={id}
        key={2}
        style={{
          width: 6,
          cursor: "col-resize",
          opacity: 0
        }}
        draggable={true}
        onDragStart={e => handleDragStart(e, "resize")}
      />
    </ContextualMenuClient>
  );
};
const auditCell = (row, column, status, data, params, style, component) => {
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
  const id = `audit-cell: ${component}-${row.index_}-${column.index_}`;
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
        width
        // ,
        // border: "0.02em solid rgba(0, 0, 0, 0.2) ",
        // borderRight
      }}
    />
  );
};

// ↑↓
export class Headers extends Component {
  shouldComponentUpdate() {
    return !this.props.changingFilter;
  }
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
    // console.log("handleDragStart", this.dragId, e);
    e.dataTransfer.setData("text", this.dragId);
    e.stopPropagation();
  };

  handleDragOver = e => {
    // console.log("handleDragOver", e);
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
      // focusedId,
      headersLength,
      locked,
      auditedRow,
      auditStatus,
      component,
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
          component
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
                component
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
                  // focusedId,
                  component
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
                    // focusedId,
                    component
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
              key={column.id || `undefined ${column.index_}`}
              style={{
                position: "absolute",
                left: position,
                display: "block",
                width: columnWidth,
                height
              }}
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
      // overflow: "hidden",
      display: "flex"
    };
    if (!locked) {
      style.overflow = "hidden";
    }

    if (cells.length) {
      return (
        <div
          id="tutut"
          key={-2 - locked}
          className={locked ? "zebulon-locked-headers" : ""}
          // id={type + filterTo ? "To" : ""}
          style={{ ...this.props.style, ...style, position: "relative" }}
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
  status,
  onClick,
  onDoubleClick,
  handleErrors,
  component,
  checkable,
  onChange,
  isAudit,
  draggable,
  handleDragStart,
  checked
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
        checked={checked || false}
        onChange={() => onChange(status.rowUpdated.index_)}
        // style={{ height: 20 }}
      />
    );
  }
  const id = `status: ${component}-${index}-`;
  return (
    <ContextualMenuClient
      id={id}
      key={id}
      index={index}
      className={className}
      style={style}
      onClick={e => onClick(index, e.shiftKey)}
      onMouseOver={e => handleErrors(e, errors)}
      onMouseOut={e => handleErrors(e, [])}
      onDoubleClick={
        onDoubleClick ? e => onDoubleClick(e, status.rowUpdated) : () => {}
      }
      draggable={draggable}
      onDragStart={handleDragStart}
      status={status}
      // row={row}
      menu="row-header-menu"
      component={component}
    >
      {glyph}
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
  onClick = (index, extension) => {
    const { meta, scroll } = this.props;
    const columns = (meta.visibleIndexes || [0])[0];
    const startRowIndex = extension ? this.props.selectedIndex : index;
    this.props.selectRange(
      {
        end: { rows: index, columns },
        start: { rows: startRowIndex, columns: meta.properties.length - 1 }
      },
      undefined,
      undefined,
      undefined,
      undefined,
      index === scroll.startIndex || index === this.stopIndex
    );
  };
  onChange = index => {
    if (this.props.checkable) {
      const updatedRows = this.state.updatedRows;
      // if (!updatedRows[index]) {
      //   updatedRows[index] = { errors: {} };
      // }
      const checked = !updatedRows[index].rowUpdated.checked_;
      // updatedRows[index].checked_ = checked;
      updatedRows[index].rowUpdated.checked_ = checked;
      if (this.props.checkable === 2) {
        // updatedRows[index + 1 - 2 * (index % 2)].checked_ = !checked;
        updatedRows[index + 1 - 2 * (index % 2)].rowUpdated.checked_ = !checked;
      }
      this.setState({ updatedRows });
    }
  };
  handleDragStart = e => {
    e.stopPropagation();
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
      component,
      checkable,
      onDoubleClick,
      isAudit,
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
        top: index === 0 ? 0 : scroll.shift + index * rowHeight,
        width: rowHeight,
        height:
          index === 0
            ? rowHeight + scroll.shift
            : Math.min(rowHeight, height - (scroll.shift + index * rowHeight))
      };
      if (index + scroll.startIndex - indexPage < rows.length) {
        const row = rows[index + scroll.startIndex - indexPage];
        const status = getRowStatus(updatedRows, row); //updatedRows[index].checked_updatedRows[row.index_];

        // if (checkable) {
        //   if (row.checked_ !== undefined && updatedRow.checked_ === undefined) {
        //     updatedRow.checked_ = row.checked_;
        //   } else if (
        //     row.checked_ === undefined &&
        //     updatedRow.checked_ !== undefined
        //   ) {
        //     row.checked_ = updatedRow.checked_;
        //   }
        // }

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
            ix + scroll.startIndex,
            status,
            this.onClick,
            onDoubleClick,
            (e, errors) => handleErrors(e, ix, errors),
            component,
            checkable,
            this.onChange,
            isAudit,
            draggable,
            row.checked_
          )
        );
      }
      index += 1;
    }
    this.stopIndex = index + scroll.startIndex - 1;
    return (
      <div
        key={"status: " + component}
        id={"status: " + component}
        style={{
          width: rowHeight,
          height,
          // overflow: "hidden",
          position: "relative",
          diplay: "flex"
        }}
      >
        {cells}
      </div>
    );
  }
}
