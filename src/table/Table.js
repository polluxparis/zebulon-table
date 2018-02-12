import React from "react";
import { Headers, Status } from "./TableHeaders";
import { TableFilterSort } from "./Table.filters.sorts";
import { Rows } from "./Rows";
import {
  utils,
  Filter,
  ContextualMenu,
  ContextualMenuClient
} from "zebulon-controls";
import { computeData, computeAudit } from "./utils/compute.data";
import { computeMetaPositions } from "./utils/compute.meta";

// import { utils } from "zebulon-controls";
export class Table extends TableFilterSort {
  constructor(props) {
    super(props);

    let filteredData = this.filters(props.data, props.filters);
    let status = props.status;
    if (props.meta.serverPagination && status.loaded) {
      status = { loaded: false, loading: true };
      props.data({ startIndex: 0 }).then(filteredData => {
        computeData(filteredData.page, props.meta, 0);
        if (props.onGetPage) {
          props.onGetPage(filteredData);
        }
        this.setState({
          filteredData,
          filteredDataLength: filteredData.filteredDataLength,
          status: { loaded: true, loading: false }
        });
      });
    }
    this.sorts(filteredData, props.meta.properties);
    this.state = {
      data: props.data,
      filteredData,
      meta: props.meta,
      filters: props.filters || {},
      status,
      updatedRows: props.updatedRows,
      scroll: {
        rows: {
          index: 0,
          direction: 1,
          startIndex: 0,
          shift: 0,
          position: 0
        },
        columns: {
          index: 0,
          direction: 1,
          startIndex: 0,
          shift: 0,
          position: 0
        }
      },
      selectedRange: { start: {}, end: {} },
      detail: {},
      text: {},
      checkAll: false
    };

    this.rowHeight = this.props.rowHeight;
    this.range = { start: {}, end: {} };
    this.onTableEnter();
    // this.filtersOut = props.filters;
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.data !== this.props.data ||
      nextProps.meta !== this.props.meta ||
      nextProps.status !== this.props.status ||
      nextProps.updatedRows !== this.props.updatedRows
    ) {
      // const filteredData = this.filters(nextProps.data, nextProps.filters);
      let filteredData = [];
      let status = nextProps.status;
      if (nextProps.meta.serverPagination) {
        if (status.loaded && !this.props.status.loaded) {
          status = { loaded: false, loading: true };
          nextProps.data({ startIndex: 0 }).then(filteredData => {
            computeData(filteredData.page, nextProps.meta, 0);
            if (nextProps.onGetPage) {
              nextProps.onGetPage(filteredData);
            }
            this.setState({
              filteredData,
              filteredDataLength: filteredData.filteredDataLength,
              status: { loaded: true, loading: false }
            });
          });
        }
      } else {
        filteredData = this.filters(nextProps.data, this.state.filters);
        this.sorts(filteredData, nextProps.meta.properties);
      }
      this.setState({
        data: nextProps.data || [],
        filteredData,
        meta: nextProps.meta,
        status,
        updatedRows: nextProps.updatedRows,
        selectedRange: { start: {}, end: {} },
        scroll: {
          rows: {
            index: 0,
            direction: 1,
            startIndex: 0,
            shift: 0,
            position: 0
          },
          columns: {
            index: 0,
            direction: 1,
            startIndex: 0,
            shift: 0,
            position: 0
          }
        }
      });
    }
    this.rowHeight = nextProps.rowHeight;
    if (nextProps.visible && !this.props.visible) this.onTableEnter();
    else if (!nextProps.visible && this.props.visible) {
      this.onTableQuit();
    }
  }
  componentWillUnmount() {
    this.onTableClose();
  }
  onCheckAll = () => {
    const checked_ = !this.state.checkAll;

    this.state.filteredData.forEach(
      row => (this.state.updatedRows[row.index_] = { checked_, errors: {} })
    );
    this.setState({ checkAll: checked_, updatedRows: this.state.updatedRows });
  };
  render() {
    const height = this.props.height,
      width = this.props.width;
    const { visible, params } = this.props;
    let {
      status,
      meta,
      scroll,
      selectedRange,
      updatedRows,
      data,
      filteredData,
      filteredDataLength,
      auditedRow,
      audits
    } = this.state;

    if (!visible) {
      return null;
    } else if (status.loading || status.loadingConfig) {
      return <div>Loading data...</div>;
    } else if (status.error) {
      if (status.error.message === "No rows retrieved") {
        return <div style={{ width: "max-content" }}>No rows retrieved</div>;
      } else {
        return (
          <div style={{ color: "red", width: "max-content" }}>
            <p>{status.error.type}</p>
            <p>{status.error.message}</p>
          </div>
        );
      }
    }
    const noUpdate = !this.isInPage(scroll.rows);
    let headersLength =
      1 +
      !meta.table.noFilter *
        (1 +
          (meta.properties.findIndex(
            column => column.filterType === "between"
          ) !==
            -1));

    // -----------------------------------
    // Filter check list
    // -----------------------------------
    const { openedFilter, filters } = this.state;
    if (openedFilter !== undefined) {
      const { top, left, items, v, caption, computedWidth } = filters[
        openedFilter
      ];
      this.filter = (
        <Filter
          items={items}
          title={caption}
          filter={v}
          style={{
            position: "absolute",
            border: "solid 0.1em rgba(0, 0, 0, 0.5)",
            backgroundColor: "white",
            fontFamily: "inherit",
            top,
            left,
            width: Math.max(computedWidth * 1.2, 150),
            zIndex: 3,
            opacity: 1
          }}
          onOk={this.onChangeFilterValues}
        />
      );
    } else {
      this.filter = undefined;
    }
    // ------------------------
    // text area
    // ------------------------
    const { top, left, v, editable, label } = this.state.text;
    if (top !== undefined) {
      this.text = (
        <div
          style={{
            position: "absolute",
            border: "solid 0.1em rgba(0, 0, 0, 0.5)",
            backgroundColor: "white",
            top: top + (headersLength - 1) * this.rowHeight,
            left,
            zIndex: 3,
            opacity: 1
          }}
        >
          <div>{label} </div>
          <textarea
            rows="10"
            cols="80"
            id={"textarea"}
            tabIndex={0}
            style={{ top, left, font: "inherit" }}
            disabled={!editable}
            autoFocus={true}
            value={v || ""}
            onChange={this.handleTextChange}
            // ref={ref => (this.focused = ref)}
          />
        </div>
      );
    } else {
      this.text = undefined;
    }
    // ------------------------
    // Detail
    // ------------------------
    let detail = this.state.detail.content;
    if (detail) {
      const row =
        selectedRange.end.rows !== undefined
          ? this.getRow(selectedRange.end.rows)
          : {};
      const status = updatedRows[row.index_];
      //       top: (3 + rowIndex) * this.rowHeight + scroll.rows.shift,
      // left:
      //   column.position + this.rowHeight - scroll.columns.position
      detail = this.getDetail({
        Detail: detail,
        row,
        data: data,
        meta: meta.properties,
        status,
        params: params,
        top:
          (2 +
            headersLength +
            selectedRange.end.rows -
            scroll.rows.startIndex) *
            this.rowHeight +
          scroll.rows.shift,
        onChange: meta.row.onChange,
        onClose: this.closeOpenedWindows
      });
    }
    // ------------------------
    // errors
    // ------------------------
    let toolTip = this.state.toolTip || null;
    if (toolTip) {
      const content = (
        <ul style={{ paddingLeft: 20, maxWidth: 300 }}>
          {toolTip.content.map((error, index) => {
            return <li key={index}>{error.error}</li>;
          })}
        </ul>
      );
      toolTip = (
        <div
          key={"tool-tip"}
          className="zebulon-tool-tip"
          style={{ top: toolTip.top, left: toolTip.left, position: "absolute" }}
        >
          {content}
        </div>
      );
    }
    this.rowsHeight =
      height -
      (meta.table.caption ? 30 : 0) -
      headersLength * this.rowHeight -
      ((meta.table.actions || []).length ? 30 : 0);
    // -----------------------------
    // simulation of audit
    // -----------------------------
    let auditStatus;
    if (auditedRow && audits) {
      headersLength = 2;
      auditStatus = updatedRows[auditedRow.index_];
      meta = {
        ...meta,
        properties: [
          {
            id: "user_",
            caption: "User",
            width: 80
          },
          {
            id: "time_",
            caption: "Time",
            dataType: "date",
            format: "time",
            formatFunction: ({ value }) =>
              utils.formatValue(value, "dd/mm/yyyy hh:mi:ss"),
            width: 130
          },
          ...meta.properties
        ]
      };
      computeMetaPositions(meta, this.props.zoom); // A voir zoom
      meta.lockedIndex = 1;
      meta.lockedWidth = 210 * this.props.zoom;
      filteredData = computeAudit(auditedRow, meta, audits);
    }
    // ----------------------------------
    // Status bar
    // ----------------------------------

    let statusBar;
    if (meta.table.noStatus) {
      statusBar = null;
    } else {
      statusBar = (
        <Status
          data={filteredData}
          status={status}
          dataLength={filteredDataLength}
          height={this.rowsHeight}
          rowHeight={this.rowHeight}
          scroll={scroll.rows}
          updatedRows={updatedRows}
          selectRange={this.selectRange}
          selectedIndex={selectedRange.end.rows}
          meta={meta.properties}
          handleErrors={this.handleErrors}
          noUpdate={noUpdate}
          componentId={this.props.id}
          checkable={meta.table.checkable}
        />
      );
    }
    // -----------------------------
    //   action buttons
    // -----------------------------
    const actions = auditedRow
      ? []
      : (meta.table.actions || []).map((action, index) => {
          if (!this.doubleclickAction && action.type === "detail") {
            this.doubleclickAction = action;
          }
          let enable = action.enable || false;
          if (status.loadingPage) {
            enable = false;
          } else if (action.enableFunction) {
            const row =
              selectedRange.end.rows !== undefined
                ? this.getRow(selectedRange.end.rows)
                : { index_: undefined };
            const status = updatedRows[row.index_];
            enable = action.enableFunction({ row, status });
          }
          const lastColumn = meta.properties[meta.properties.length - 1];
          const actionsWidth =
            Math.min(
              lastColumn.position +
                lastColumn.computedWidth +
                this.rowHeight * (statusBar !== null),
              width - 12
            ) / meta.table.actions.length;
          return (
            <button
              key={index}
              disabled={!enable}
              style={{
                width: actionsWidth, //`${96 / meta.table.actions.length}%`,
                margin: 2,
                marginTop: 6,
                backgroundColor: "lightgrey"
              }}
              onClick={() => this.handleClickButton(index)}
            >
              {action.caption}
            </button>
          );
        });
    let style = {};
    const locked =
      !utils.isNullOrUndefined(meta.lockedIndex) && meta.lockedWidth;
    if (locked) {
      style = {
        borderLeft: "solid 0.021em rgba(0, 0, 0, 1)",
        boxSizing: "border-box"
      };
    }
    const rows = (
      <Rows
        meta={meta}
        data={filteredData}
        status={status}
        dataLength={filteredDataLength}
        height={this.rowsHeight}
        width={
          width -
          this.rowHeight * (statusBar !== null) -
          (meta.lockedWidth || 0)
        }
        rowHeight={this.rowHeight}
        scroll={scroll}
        onScroll={this.onScroll}
        selectedRange={selectedRange}
        selectRange={this.selectRange}
        onChange={this.onChange}
        onFocus={() => {}}
        hasFocus={this.hasFocus}
        updatedRows={updatedRows}
        params={params}
        navigationKeyHandler={this.props.navigationKeyHandler}
        ref={ref => (this.rows = ref)}
        noUpdate={noUpdate}
        style={style}
      />
    );
    let lockedColumns = null;
    if (locked) {
      lockedColumns = (
        <Rows
          meta={meta}
          data={filteredData}
          status={status}
          dataLength={filteredDataLength}
          height={this.rowsHeight}
          width={meta.lockedWidth}
          rowHeight={this.rowHeight}
          scroll={scroll}
          onScroll={this.onScroll}
          selectedRange={selectedRange}
          selectRange={this.selectRange}
          onChange={this.onChange}
          onFocus={() => {}}
          hasFocus={this.hasFocus}
          updatedRows={updatedRows}
          params={params}
          navigationKeyHandler={this.props.navigationKeyHandler}
          ref={ref => (this.rows = ref)}
          noUpdate={noUpdate}
          noVerticalScrollbar={true}
        />
      );
    }

    const headers = (
      <Headers
        onSort={this.onSort}
        meta={meta}
        data={data}
        height={this.rowHeight * headersLength}
        width={
          width -
          this.rowHeight * (statusBar !== null) -
          (meta.lockedWidth || 0)
        }
        scroll={scroll.columns}
        headersLength={headersLength}
        onMetaChange={this.onMetaChange}
        openFilter={this.openFilter}
        onChange={this.onChangeFilter}
        style={style}
        componentId={this.props.id}
        auditedRow={auditedRow}
        auditStatus={auditStatus}
      />
    );
    let lockedLockedHeader = null;
    if (!utils.isNullOrUndefined(meta.lockedIndex) && meta.lockedWidth) {
      lockedLockedHeader = (
        <Headers
          onSort={this.onSort}
          meta={meta}
          data={data}
          height={this.rowHeight * headersLength}
          width={meta.lockedWidth}
          scroll={scroll.columns}
          headersLength={headersLength}
          onMetaChange={this.onMetaChange}
          openFilter={this.openFilter}
          onChange={this.onChangeFilter}
          locked={true}
          componentId={this.props.id}
          auditedRow={auditedRow}
          auditStatus={auditStatus}
        />
      );
    }
    let statusBarHeader = [];
    if (statusBar !== null) {
      for (let i = 0; i < headersLength; i++) {
        let checkbox = null;
        if (i === 0 && meta.table.checkable) {
          checkbox = (
            <input
              type="checkbox"
              checked={this.state.checkAll}
              onChange={this.onCheckAll}
            />
          );
        }
        statusBarHeader.push(
          <div
            key={`status-${i}`}
            className="zebulon-table-corner"
            style={{
              width: this.rowHeight,
              height: this.rowHeight,
              border: "0.02em solid rgba(0, 0, 0, 0.3)",
              padding: 4
            }}
          >
            {checkbox}
          </div>
        );
      }
      statusBarHeader = (
        <ContextualMenuClient
          id={"header-status"}
          menuId="top-left-corner-menu"
          componentId={this.props.id}
        >
          <div style={{ display: "block" }}>{statusBarHeader}</div>
        </ContextualMenuClient>
      );
    } else {
      statusBarHeader = null;
    }
    // statusBar !== null ? <div style={{ display: "block" }}>{1}</div> : null;
    // {filterHeaders}
    let title = null;
    if (meta.table.caption) {
      title = (
        <div
          key="title"
          className="zebulon-table-title"
          style={{
            fontWeight: "bold",
            textAlign: "center",
            padding: 4,
            border: "solid 0.03em rgba(0,0,0,.2)",
            height: 30,
            width,
            boxSizing: "border-box"
          }}
        >
          {meta.table.caption}
        </div>
      );
    }
    // const className = "zebulon-table";
    return (
      <div
        id={this.props.id}
        style={{
          width: "max-content",
          height: "fit-content"
        }}
        // onMouseUp={e => console.log("mouseup", e.target)}
        // onMouseleave={e => console.log("mouseleave", e.target)}
      >
        {detail}
        {this.filter}
        {this.text}
        {toolTip}
        {title}
        <div style={{ display: "-webkit-box" }}>
          {statusBarHeader}
          {lockedLockedHeader}
          {headers}
        </div>
        <div
          style={{
            display: "-webkit-box"
          }}
        >
          {statusBar}
          {lockedColumns}
          {rows}
        </div>
        <div style={{ height: actions.length ? 30 : 0 }}>{actions}</div>
        <ContextualMenu
          key="table-menu"
          getMenu={this.getMenu}
          componentId={this.props.id}
          id="table-menu"
          ref={ref => (this.contextualMenu = ref)}
        />
      </div>
    );
  }
}
