import React from "react";
import { Headers, Status } from "./TableHeaders";
import { TableFilterSort } from "./Table.filters.sorts";
import { Rows } from "./Rows";
import { Search } from "./Search";

import { utils, Filter, ContextualMenuClient } from "zebulon-controls";
import { computeData } from "./utils/compute.data";
import { computeMetaPositions } from "./utils/compute.meta";

// import { utils } from "zebulon-controls";
export class Table extends TableFilterSort {
  constructor(props) {
    super(props);
    let filteredData = this.filters(props.data, props.filters);
    // if (props.meta.serverPagination && props.status.loaded) {
    //   status = {
    //     loaded: false,
    //     loading: true
    //   };
    //   props.data({ startIndex: 0 }).then(filteredData => {
    //     computeData(filteredData.page, props.meta, 0);
    //     if (props.onGetPage) {
    //       props.onGetPage(filteredData);
    //     }
    //     this.setState({
    //       filteredData,
    //       filteredDataLength: filteredData.filteredDataLength,
    //       status: { loaded: true, loading: false }
    //     });
    //   });
    // }
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
      status: props.status,
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
        start: { rows: undefined, columns },
        end: { rows: undefined, columns }
      },
      detail: {},
      text: {},
      checkAll: false,
      search: false,
      dataStrings: {}
    };
    // this.state.selectedRangeAudit = this.state.selectedRange;
    // this.state.scrollAudit = this.state.scroll;
    this.rowHeight = this.props.rowHeight;
    this.range = { start: {}, end: {} };
    this.onTableEnter();
    if (status && status.loaded) {
      this.bLoaded = true;
    }
    // if (this.props.contextualMenu) {
    //   if (typeof this.props.contextualMenu === "function") {
    //     this.customContextualMenu = this.props.contextualMenu(
    //       this.state,
    //       props
    //     );
    //   } else {
    //     this.customContextualMenu = this.props.contextualMenu;
    //   }
    // }
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.data !== this.props.data ||
      nextProps.meta !== this.props.meta ||
      nextProps.status !== this.props.status ||
      nextProps.updatedRows !== this.props.updatedRows ||
      nextProps.filters !== this.props.filters
    ) {
      // const filteredData = this.filters(nextProps.data, nextProps.filters);
      let filteredData = [];
      let status = nextProps.status;

      filteredData = this.filters(
        nextProps.data,
        nextProps.filters,
        undefined,
        nextProps.updatedRows
      );
      this.sorts(filteredData, nextProps.meta.properties);
      // }

      this.setState({
        data: nextProps.data || [],
        filteredData,
        filteredDataLength: filteredData.length,
        filters: nextProps.filters || {},
        meta: nextProps.meta,
        status,
        updatedRows: nextProps.updatedRows
        // scroll: this.state.scroll
        // selectedRange: { start: {}, end: {} },
        // scroll: {
        //   rows: {
        //     index: 0,
        //     direction: 1,
        //     startIndex: 0,
        //     shift: 0,
        //     position: 0
        //   },
        //   columns: {
        //     index: 0,
        //     direction: 1,
        //     startIndex: 0,
        //     shift: 0,
        //     position: 0
        //   }
        // }
      });
      if (status && status.loaded && this.bLoaded === undefined) {
        this.bLoaded = true;
      }
      if (status && status.loading) {
        this.bLoaded = undefined;
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
    if (!nextProps.isActive && this.props.isActive) {
      this.closeOpenedWindows();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !nextProps.modal;
  }
  componentWillUnmount() {
    return this.onTableClose();
  }
  onLoad = () => {
    if (this.bLoaded && this.state.filteredData.length) {
      this.updated = false;
      this.rowUpdated = false;
      this.tableUpdated = false;
      this.adjustScrollRows(this.state.filteredData);
      // const { selectedRange, scroll } = this.state;
      // if (selectedRange.end.rows <= this.state.filteredData.length) {
      //   const rowDirection = Math.sign(
      //     selectedRange.end.rows - (scroll.rows.startIndex || 0)
      //   );
      //   const columnDirection = Math.sign(
      //     selectedRange.end.columns - scroll.columns.startIndex
      //   );
      //   this.selectRange(
      //     selectedRange,
      //     undefined,
      //     this.state.filteredData[selectedRange.end.rows],
      //     "enter"
      //   );
      //   this.rowUpdated = true;
      //   this.scrollTo(
      //     selectedRange.end.rows,
      //     rowDirection,
      //     selectedRange.end.columns,
      //     columnDirection
      //   );
      // } else {
      // const columns = (this.state.meta.visibleIndexes || [0])[0];
      // this.selectRange(
      //   {
      //     start: { rows: 0, columns },
      //     end: { rows: 0, columns }
      //   },
      //   undefined,
      //   this.state.filteredData[0],
      //   "enter",
      //   true
      // );

      this.hasFocus = true;
      this.bLoaded = null;
    }
  };
  componentDidMount() {
    this.onLoad();
  }
  componentDidUpdate() {
    this.onLoad();
    this.changingFilter = false;
  }
  onCheckAll = () => {
    const checked_ = !this.state.checkAll;

    this.state.filteredData.forEach(row => (row.checked_ = checked_));
    this.setState({ checkAll: checked_, updatedRows: this.state.updatedRows });
  };
  render() {
    const { height, width, isModal, visible, params, id } = this.props;
    let {
        status,
        meta,
        selectedRange,
        updatedRows,
        data,
        auditedRow,
        audits,
        scroll,
        statusChanged
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
    let key;

    filteredData = this.state.filteredData;
    filteredDataLength = this.state.filteredData.length;
    // }
    //  actions
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
      key = `filter-${id}`;
      this.filter = (
        <Filter
          id={key}
          key={key}
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
            width: Math.max(computedWidth * 1.5, 150),
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
      key = `textarea-${id}`;
      this.text = (
        <div
          id={key}
          key={key}
          style={{
            // position: "absolute", toto
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
      key = `tooltip-${id}`;
      toolTip = (
        <div
          id={key}
          key={key}
          className="zebulon-tool-tip"
          style={{
            top: toolTip.top,
            left: toolTip.left
            // position: "absolute" toto
          }}
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
      key = `search-${id}`;
      const content = (
        <Search
          id={key}
          key={key}
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
          id={key}
          key={key}
          className="zebulon-tool-tip"
          style={{
            top: 0,
            left: 0,
            position: "absolute"
          }}
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
      key = `statusbar-${id}`;
      statusBar = (
        <Status
          id={key}
          key={key}
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
          componentId={this.props.componentId}
          checkable={meta.table.checkable}
          onDoubleClick={this.onDoubleClick}
          draggable={meta.table.statusDraggable}
          isAudit={auditedRow ? true : false}
          statusChanged={statusChanged}
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
        minWidth: 50,
        margin: 2,
        marginTop: 3,
        height: 22
        // backgroundColor: "lightgrey"
      };
      const className = enable
        ? ".zebulon-action-button"
        : ".zebulon-action-button-disabled";
      if (action.jsxFunction) {
        return action.jsxFunction({
          disabled: !enable,
          className,
          index,
          style,
          onClick: e => this.handleAction(action, e)
        });
      }
      key = `action-${id}-${index}`;
      return (
        <button
          id={key}
          key={key}
          disabled={!enable}
          className={className}
          style={style}
          draggable={false}
          onClick={e => {
            return this.handleAction(action, e);
          }}
        >
          {action.caption}
        </button>
      );
    });
    // -----------------------------
    //   rows
    // -----------------------------
    // let style = {};
    const locked =
      !utils.isNullOrUndefined(meta.lockedIndex) && meta.lockedWidth;
    key = `rows-${id}`;
    const rows = (
      <Rows
        id={key}
        key={key}
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
        onFocus={this.onFocus}
        hasFocus={this.hasFocus && this.props.isActive !== false}
        updatedRows={updatedRows}
        params={params}
        navigationKeyHandler={this.props.navigationKeyHandler}
        ref={ref => (this.rows = ref)}
        noUpdate={noUpdate}
        // style={style}
        onDoubleClick={this.onDoubleClick}
        componentId={this.props.componentId}
        openedFilter={this.state.openedFilter}
      />
    );
    let lockedColumns = null;
    if (locked) {
      key = `locked-columns-${id}`;
      lockedColumns = (
        <Rows
          id={key}
          key={key}
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
          hasFocus={this.hasFocus && this.props.isActive !== false}
          updatedRows={updatedRows}
          params={params}
          noUpdate={noUpdate}
          noVerticalScrollbar={true}
          onDoubleClick={this.onDoubleClick}
          locked={locked}
          componentId={this.props.componentId}
          openedFilter={this.state.openedFilter}
        />
      );
    }
    // -----------------------------
    //   headers
    // -----------------------------
    key = `headers-${id}`;
    const headers = (
      <Headers
        id={key}
        key={key}
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
        // style={style}
        componentId={this.props.componentId}
        // auditedRow={auditedRow}
        // auditStatus={{}}
        isActive={this.props.isActive}
        onActivation={this.props.onActivation}
        changingFilter={this.changingFilter}
      />
    );
    let lockedHeaders = null;
    if (!utils.isNullOrUndefined(meta.lockedIndex) && meta.lockedWidth) {
      key = `locked-headers-${id}`;
      lockedHeaders = (
        <Headers
          id={key}
          key={key}
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
          componentId={this.props.componentId}
          // auditedRow={auditedRow}
          // auditStatus={{}}
          isActive={this.props.isActive}
          onActivation={this.props.onActivation}
          changingFilter={this.changingFilter}
        />
      );
    }
    // -----------------------------
    //   status bar
    // -----------------------------
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
        key = `status-bar-headers-${id}-${i}`;
        statusBarHeader.push(
          <div
            id={key}
            key={key}
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
      key = `header-status-${id}`;
      statusBarHeader = (
        <ContextualMenuClient
          id={key}
          key={key}
          menu="top-left-corner-menu"
          componentId={this.props.componentId}
        >
          {statusBarHeader}
        </ContextualMenuClient>
      );
    } else {
      statusBarHeader = null;
    }
    // -----------------------------
    //   title
    // -----------------------------
    let title = null;
    const caption =
      this.props.caption === ""
        ? null
        : this.props.caption || meta.table.caption;
    if (caption) {
      key = `title-${id}`;
      title = (
        <ContextualMenuClient
          id={key}
          key={key}
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
          menu="title-menu"
          componentId={this.props.componentId}
          onClick={() => this.props.onActivation(this.props.componentId || id)}
        >
          {caption}
        </ContextualMenuClient>
      );
    }
    // const className = "zebulon-table";
    return (
      <div
        id={id}
        // style={{
        //   width: "max-content",
        //   height: "fit-content",
        //   ...this.props.style
        // }}
        style={{
          width,
          height,
          ...this.props.style
        }}
      >
        <div
          id={`table-${id}`}
          style={{
            width,
            height,
            display: "block",
            position: "absolute"
          }}
        >
          {detail}
          {this.filter}
          {this.text}
          {toolTip}
          {search}
          {title}
          <div id={"columns"} style={{ display: "flex" }}>
            {statusBarHeader}
            {lockedHeaders}
            {headers}
          </div>
          <div id={"rows"} style={{ display: "flex" }}>
            {statusBar}
            {lockedColumns}
            {rows}
          </div>
          <div
            id={"actions"}
            style={{ height: actions.length ? 30 : 0, display: "flex" }}
          >
            {actions}
          </div>
        </div>
      </div>
    );
  }
}
