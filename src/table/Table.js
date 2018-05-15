import React from "react";
import { Headers, Status } from "./TableHeaders";
import { TableFilterSort } from "./Table.filters.sorts";
import { Rows } from "./Rows";
import { Search } from "./Search";

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
    //  else if (this.props.callbackForeignKey && filteredData.length < 2) {
    //   this.props.callbackForeignKey(
    //     filteredData.length ? filteredData.length[0] : false
    //   );
    // } // a voir serverPagination
    this.sorts(filteredData, props.meta.properties);
    const columns =
      props.meta && props.meta.visibleIndexes
        ? props.meta.visibleIndexes[0]
        : 0;
    this.state = {
      data: props.data,
      filteredData,
      params: props.params,
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
      selectedRange: {
        start: { rows: 0, columns },
        end: { rows: 0, columns }
      },
      detail: {},
      text: {},
      checkAll: false,
      search: false,
      dataStrings: {}
    };

    this.rowHeight = this.props.rowHeight;
    this.range = { start: {}, end: {} };
    this.onTableEnter();
    if (status.loaded) {
      this.bLoaded = true;
    }
    if (this.props.contextualMenu) {
      if (typeof this.props.contextualMenu === "function") {
        this.customContextualMenu = this.props.contextualMenu(
          this.state,
          props
        );
      } else {
        this.customContextualMenu = this.props.contextualMenu;
      }
    }
    // this.filtersOut = props.filters;
  }
  // componentDidMount() {
  //   this.selectRange(this.state.selectedRange, undefined, undefined, "enter");
  // }
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
      // if (nextProps.meta.serverPagination) {
      //   if (status.loaded && !this.props.status.loaded) {
      //     status = { loaded: false, loading: true };
      //     nextProps.data({ startIndex: 0 }).then(filteredData => {
      //       computeData(filteredData.page, nextProps.meta, 0);
      //       if (nextProps.onGetPage) {
      //         nextProps.onGetPage(filteredData);
      //       }
      //       this.setState({
      //         filteredData,
      //         filteredDataLength: filteredData.filteredDataLength,
      //         status: { loaded: true, loading: false }
      //       });
      //     });
      //   }
      // } else {
      filteredData = this.filters(nextProps.data, this.state.filters);
      this.sorts(filteredData, nextProps.meta.properties);
      // }

      this.setState({
        data: nextProps.data || [],
        filteredData,
        filteredDataLength: filteredData.length,
        meta: nextProps.meta,
        status,
        updatedRows: nextProps.updatedRows,
        // selectedRange: { start: {}, end: {} },
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
      if (status.loaded && this.bLoaded === undefined) {
        this.bLoaded = true;
      }
      if (
        status.loaded &&
        this.props.callbackForeignKey &&
        filteredData.length < 2
      ) {
        this.props.callbackForeignKey(
          filteredData.length === 1,
          filteredData[0]
        );
        return null;
      }
    }
    this.rowHeight = nextProps.rowHeight;
    if (nextProps.visible && !this.props.visible) this.onTableEnter();
    // else if (!nextProps.visible && this.props.visible) {
    //   this.onTableQuit();
    // }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return !nextProps.modal;
  }
  componentWillUnmount() {
    return this.onTableClose();
  }
  componentDidUpdate() {
    if (this.bLoaded && this.state.filteredData.length) {
      const columns = (this.state.meta.visibleIndexes || [0])[0];
      this.selectRange(
        {
          start: { rows: 0, columns },
          end: { rows: 0, columns }
        },
        undefined,
        this.state.filteredData[0],
        "enter",
        true
      );
      this.hasFocus = true;
      this.bLoaded = null;
    }
    this.changingFilter = false;
    // this.hasFocus = true;
  }
  onCheckAll = () => {
    const checked_ = !this.state.checkAll;

    this.state.filteredData.forEach(
      row => (this.state.updatedRows[row.index_] = { checked_, errors: {} })
    );
    this.setState({ checkAll: checked_, updatedRows: this.state.updatedRows });
  };
  render() {
    const { height, width, isModal, visible, params } = this.props;
    let {
        status,
        meta,
        selectedRange,
        updatedRows,
        data,
        auditedRow,
        audits,
        scroll
      } = this.state,
      filteredData,
      filteredDataLength;
    let { selectRange, onScroll } = this;
    let headersLength =
      1 +
      !meta.table.noFilter *
        (1 +
          (meta.properties.findIndex(
            column => column.filterType === "between" && !column.hidden
          ) !==
            -1));
    // -----------------------------
    // audit
    // -----------------------------
    // console.log("render", scroll, selectedRange);
    let auditStatus;
    if (auditedRow) {
      selectRange = undefined;
      headersLength = 2;
      auditStatus = updatedRows[auditedRow.index_] || {};
      meta = {
        ...meta,
        table: { ...meta.table, editable: false },
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
          {
            id: "status_",
            caption: "Status",
            dataType: "string",
            width: 70
          },
          ...meta.properties
        ]
      };
      computeMetaPositions(meta, this.props.zoom); // A voir zoom
      meta.lockedIndex = 2;
      meta.lockedWidth = 280 * this.props.zoom;
      const row = auditStatus.row || auditStatus.rowUpdated || auditedRow;
      const rowUpdated =
        auditStatus.updated_ && !auditStatus.new_
          ? auditStatus.rowUpdated
          : undefined;
      filteredData = computeAudit(rowUpdated, row, meta, audits);
      auditedRow = filteredData[0];
      filteredData.splice(0, 1);
      filteredDataLength = filteredData.length;
    } else {
      filteredData = this.state.filteredData;
      filteredDataLength = this.state.filteredDataLength;
    }

    let actions =
      auditedRow || isModal || meta.properties.length === 0
        ? []
        : meta.table.actions.filter(action => !action.hidden) || [];
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
    } else if (data.length === 0 && meta.properties.length === 0) {
      return null;
    }
    const noUpdate = !this.isInPage(scroll.rows) || this.noUpdate;
    this.noUpdate = false;
    // -----------------------------------
    // Filter check list
    // -----------------------------------
    const { openedFilter, filters } = this.state;
    this.openedFilter = null;
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
          ref={ref => (this.openedFilter = ref)}
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
            top: top + (headersLength - 2) * this.rowHeight,
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
      (actions.length ? 30 : 0);
    // ------------------------
    // search
    // ------------------------
    let search = null;

    if (this.state.search) {
      const { filteredData, meta, dataStrings, scroll } = this.state;
      const content = (
        <Search
          filteredData={filteredData}
          meta={meta}
          dataStrings={dataStrings}
          scroll={scroll}
          rowStartIndex={
            scroll.rows.startIndex + scroll.rows.shift === 0 ? 0 : 1
          }
          rowStopIndex={Math.min(
            scroll.rows.startIndex +
              Math.floor(this.rowsHeight / this.rowHeight) -
              (scroll.rows.shift === 0 ? 1 : 0),
            filteredData.length - 1
          )}
          onClose={() => this.setState({ search: false })}
          // selectRange={this.selectRange_}
          selectedCell={this.state.selectedRange.end}
          scrollTo={this.scrollTo}
        />
      );
      search = (
        <div
          key={"tool-tip"}
          className="zebulon-tool-tip"
          style={{ top: 0, left: 0, position: "absolute" }}
        >
          {content}
        </div>
      );
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
          key="statusBar"
          data={filteredData}
          status={status}
          dataLength={filteredDataLength}
          height={this.rowsHeight}
          rowHeight={this.rowHeight}
          scroll={scroll.rows}
          updatedRows={updatedRows}
          selectRange={this.selectRange}
          selectedIndex={selectedRange.end.rows}
          meta={meta}
          handleErrors={this.handleErrors}
          noUpdate={noUpdate}
          component={this.props.id}
          checkable={meta.table.checkable}
          onDoubleClick={this.onDoubleClick}
          draggable={meta.table.statusDraggable}
          isAudit={auditedRow ? true : false}
        />
      );
    }
    // -----------------------------
    //   action buttons
    // -----------------------------
    actions = actions.map((action, index) => {
      if (!this.doubleClickAction && action.doubleClick) {
        this.doubleClickAction = action;
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
      action.statusEnable = action.enable && enable;
      const lastColumn = meta.properties[meta.properties.length - 1];
      const actionsWidth =
        Math.min(
          lastColumn.position +
            lastColumn.computedWidth +
            this.rowHeight * (statusBar !== null),
          width - 4 * actions.length
        ) / actions.length || 0;
      const style = {
        width: actionsWidth,
        margin: 2,
        marginTop: 6
        // backgroundColor: "lightgrey"
      };
      const className = enable
        ? "zebulon-action-button"
        : "zebulon-action-button-disabled";
      if (action.jsxFunction) {
        return action.jsxFunction({
          disabled: !enable,
          className,
          index,
          style,
          onClick: e => this.handleAction(action, e)
        });
      }
      return (
        <button
          key={index}
          disabled={!enable}
          className={className}
          style={style}
          onClick={e => {
            return this.handleAction(action, e);
          }}
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
        borderLeft: "solid 0.05em rgba(0, 0, 0, .5)",
        boxSizing: "border-box"
      };
    }
    // console.log("table", this.hasFocus, this.changingFilter);
    const rows = (
      <Rows
        key="rows"
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
        onScroll={onScroll}
        selectedRange={selectedRange}
        selectRange={selectRange}
        onChange={this.onChange}
        onFocus={(e, row, column) => this.closeOpenedWindows(true, column)}
        hasFocus={this.hasFocus}
        updatedRows={updatedRows}
        params={params}
        navigationKeyHandler={this.props.navigationKeyHandler}
        ref={ref => (this.rows = ref)}
        noUpdate={noUpdate}
        style={style}
        onDoubleClick={this.onDoubleClick}
        component={this.props.id}
      />
    );
    let lockedColumns = null;
    if (locked) {
      lockedColumns = (
        <Rows
          key="lockedColumns"
          meta={meta}
          data={filteredData}
          status={status}
          dataLength={filteredDataLength}
          height={this.rowsHeight}
          width={meta.lockedWidth}
          rowHeight={this.rowHeight}
          scroll={scroll}
          onScroll={onScroll}
          selectedRange={selectedRange}
          selectRange={selectRange}
          onChange={this.onChange}
          onFocus={(e, row, column) => this.closeOpenedWindows(true, column)}
          hasFocus={this.hasFocus}
          updatedRows={updatedRows}
          params={params}
          noUpdate={noUpdate}
          noVerticalScrollbar={true}
          onDoubleClick={this.onDoubleClick}
          locked={locked}
          component={this.props.id}
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
        component={this.props.id}
        auditedRow={auditedRow}
        auditStatus={auditStatus}
        isActive={this.props.isActive}
        onActivation={this.props.onActivation}
        changingFilter={this.changingFilter}
      />
    );
    let lockedHeaders = null;
    if (!utils.isNullOrUndefined(meta.lockedIndex) && meta.lockedWidth) {
      lockedHeaders = (
        <Headers
          onSort={this.onSort}
          meta={meta}
          data={auditedRow ? data : null}
          height={this.rowHeight * headersLength}
          width={meta.lockedWidth}
          scroll={scroll.columns}
          headersLength={headersLength}
          onMetaChange={this.onMetaChange}
          openFilter={this.openFilter}
          onChange={this.onChangeFilter}
          locked={true}
          component={this.props.id}
          auditedRow={auditedRow}
          auditStatus={auditStatus}
          isActive={this.props.isActive}
          onActivation={this.props.onActivation}
          changingFilter={this.changingFilter}
        />
      );
    }
    let statusBarHeader = [];
    if (statusBar !== null) {
      for (let i = 0; i < headersLength; i++) {
        let checkbox = null;
        if (i === 0 && meta.table.checkable === true) {
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
              top: i * this.rowHeight
              // border: "0.02em solid rgba(0, 0, 0, 0.3)",
              // padding: 4
            }}
          >
            {checkbox}
          </div>
        );
      }
      statusBarHeader = (
        <ContextualMenuClient
          key={"header-status"}
          id={"header-status"}
          menu="top-left-corner-menu"
          component={this.props.id}
        >
          {statusBarHeader}
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
          height: "fit-content",
          // border: "solid grey 0.05em",
          ...this.props.style
        }}
      >
        <div>
          <ContextualMenu
            key="table-menu"
            getMenu={this.getMenu}
            component={this.props.id}
            id="table-menu"
            ref={ref => (this.contextualMenu = ref)}
          />
          {detail}
          {this.filter}
          {this.text}
          {toolTip}
          {search}
          {title}
          <div
            style={{
              // display: "-webkit-box"
              display: "flex"
            }}
          >
            {statusBarHeader}
            {lockedHeaders}
            {headers}
          </div>
          <div style={{ display: "flex" }}>
            {statusBar}
            {lockedColumns}
            {rows}
          </div>
        </div>
        <div style={{ height: actions.length ? 30 : 0, display: "flex" }}>
          {actions}
        </div>{" "}
      </div>
    );
  }
}
