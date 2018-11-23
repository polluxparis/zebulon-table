import React, { Component } from "react";
import { ZebulonTable } from "../table/ZebulonTable";
import { onNext, onCompleted, onError } from "../table/MetaDescriptions";
import { ResizableBox } from "react-resizable";

import {
  getRowErrors,
  getErrors,
  computeMetaPositions,
  computeAnalytic,
  functions
} from "../table/utils";
import {
  errorHandler,
  get_subscription
  // customMenuFunctions,
  // navigationKeyHandler
} from "./dataset.functions";
import { meta, rollingAverage, totalAmount } from "./dataset.meta";
// ;

export class MyDataset extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sizes: {
        height: 500,
        width: 1300,
        rowHeight: 25,
        zoom: 1
      },
      status: {},
      // filters: { qty: { id: "qty", filterType: "between", v: 123, vTo: 256 } },
      sorts: {
        // d: { id: "d", direction: "asc", sortOrder: 0 },
        // product_lb: { id: "product_lb", direction: "desc", sortOrder: 1 },
        id: { id: "id", direction: "asc", sortOrder: 0 }
      },
      radioDataset: "get_promise",
      dataLength: 0,
      filteredDataLength: 0,
      loadedDataLength: 0,
      meta,
      updatedRows: {},
      totalAmount: false,
      rollingAverage: false,
      confirmationModal: false,
      activeTable: "dataset",
      closeRequired: false,
      params: { user_: "Pollux" },
      userZebulon: false
    };
    this.text =
      "An array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
  }
  // componentWillReceiveProps(nextProps) {
  //   const a = 1;
  //   console.log("ex", this.props);
  //   console.log("ex", nextProps);
  // }
  getLengths = ({ data, filteredData }) => {
    // if (Array.isArray(data)) {
    //   this.setState({
    //     dataLength: data.length,
    //     filteredDataLength: filteredData.length,
    //     loadedDataLength: data.length,
    //     pageStartIndex: undefined
    //   });
    // }
  };
  getPageLengths = ({
    pageLength,
    filteredDataLength,
    dataLength,
    pageStartIndex
  }) => {
    this.setState({
      dataLength,
      filteredDataLength,
      loadedDataLength: pageLength,
      pageStartIndex
    });
  };
  handleTotalAmount = () => {
    totalAmount.hidden = this.state.totalAmount;
    if (!totalAmount.hidden) {
      computeAnalytic(this.zebulonTable.state.data, totalAmount);
    }
    meta.visibleIndexes = computeMetaPositions(
      meta,
      this.zebulonTable.state.sizes.zoom
    );
    this.setState({
      totalAmount: !this.state.totalAmount,
      status: this.state.status
    });
    this.zebulonTable.table.onMetaChange(true);
  };
  handleRollingAverage = () => {
    rollingAverage.hidden = this.state.rollingAverage;
    this.setState({ rollingAverage: !this.state.rollingAverage });
    if (!rollingAverage.hidden) {
      computeAnalytic(this.zebulonTable.state.data, rollingAverage);
    }
    meta.visibleIndexes = computeMetaPositions(
      meta,
      this.zebulonTable.state.sizes.zoom
    );
    this.setState({
      rollingAverage: !this.state.rollingAverage,
      status: this.state.status
    });
    this.zebulonTable.table.onMetaChange(true);
  };
  errorHandler = {
    onRowQuit: message => {
      message.modalBody = ["Errors: "].concat(
        getRowErrors(message.status, message.row.index_)
          .map(error => `\n Order# ${message.row.id} : ${error.error}`)
          .concat(["Do you wan't to continue?"])
      );
      return true;
    },
    onTableChange: message => {
      if (message.type !== "sort") {
        message.modalBody = "Do you want to save before refresh?";
      }
      return true;
    },
    onSaveBefore: message => {
      message.modalBody = ["Can't save with errors: "].concat(
        getErrors(message.updatedRows).map(
          error =>
            `\nOrder# ${message.updatedRows[error.rowIndex].rowUpdated
              .id} : ${error.error}`
        )
      );
      if (message.modalBody.length > 1) {
        return false;
      }
      message.modalBody = null;
      return true;
    }
  };
  onActivation = table => this.setState({ activeTable: table });
  handleRefresh = () => {
    this.setState({ status: { loading: true } });
  };
  subscribe = () => {
    const { meta, params } = this.zebulonTable.state;
    const subscription = {
      observableFunction: get_subscription,
      observerFunctions: { onNext, onCompleted, onError }
    };
    const message = {
      dataObject: meta.table.object,
      params,
      meta,
      filters: {},
      sorts: []
    };
    this.zebulonTable.subscribe(message, subscription);
  };
  // radio buttons datasource
  onGetData = () => {
    const value = this.state.radioDataset;
    let text;
    if (value === "get_array") {
      text =
        "An array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
    } else if (value === "get_promise") {
      text =
        "A server is simulated that returns a promise resolved as an array stored in the client.\nFilters are managed by the server.\nfunction: get_promise @ demo/datasources.";
    } else if (value === "get_observable") {
      text =
        "A server is simulated that returns an observable.\nPages of 1000 rows are pushed by the server and loaded in background by the client .\nSorting is managed by the server to avoid visible reorders.\nfunction: get_observable @ demo/datasources.";
    } else if (value === "get_pagination_manager") {
      text =
        "A server is simulated that returns a pagination manager function.\nA page of 100 rows including the start and the end row is returned as a promise at each call from the client.\nOnly the current page is stored by the client.\nSorting and filtering are managed by the server.\nfunction: get_pagination_manager @ demo/datasources.";
    }
    this.setState({ text });
  };
  handleRadioDataset = e => {
    this.setState({
      config: this.config,
      radioDataset: e.target.value,
      status: { loading: true, loaded: false }
    });
    // this.previousConfig = this.config;
    this.config = this.zebulonTable.getConfiguration();
  };

  //   const value = e.target.value;
  //   this.setState({
  //     closeRequired: ok => {
  //       // console.log("confirmation", ok);
  //       if (ok) {
  //         if (value === "get_array") {
  //           this.state.text =
  //             "An array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
  //         } else if (value === "get_promise") {
  //           this.state.text =
  //             "A server is simulated that returns a promise resolved as an array stored in the client.\nFilters are managed by the server.\nfunction: get_promise @ demo/datasources.";
  //         } else if (value === "get_observable") {
  //           this.state.text =
  //             "A server is simulated that returns an observable.\nPages of 1000 rows are pushed by the server and loaded in background by the client .\nSorting is managed by the server to avoid visible reorders.\nfunction: get_observable @ demo/datasources.";
  //         } else if (value === "get_pagination_manager") {
  //           this.state.text =
  //             "A server is simulated that returns a pagination manager function.\nA page of 100 rows including the start and the end row is returned as a promise at each call from the client.\nOnly the current page is stored by the client.\nSorting and filtering are managed by the server.\nfunction: get_pagination_manager @ demo/datasources.";
  //         }
  //         this.setState({
  //           radioDataset: value,
  //           status: { loading: true },
  //           closeRequired: false
  //         });
  //       } else {
  //         this.setState({
  //           radioDataset: this.state.radioDataset,
  //           closeRequired: false
  //         });
  //       }
  //     }
  //   });
  // };
  handleUser = () => {
    let params;
    if (!this.state.userZebulon) {
      params = {
        user_: "Zébulon",
        privileges_: {
          dataset: {
            table: "editable",
            actions: { New: "hidden", Duplicate: "hidden", Delete: "hidden" },
            properties: {
              thirdparty_cd: "hidden",
              qty: "visible",
              color: "visible",
              currency: "visible",
              d: "visible",
              product_lb: "visible",
              country_cd: "visible",
              id: "editable"
            }
          }
        },
        filter_: [
          {
            filterType: "values",
            id: "country_id",
            v: { 2: 2 }
          }
        ]
      };
    } else {
      params = { user_: "Pollux" };
    }
    this.setState({
      userZebulon: !this.state.userZebulon,
      params,
      status: { loading: true }
    });
  };
  // onResize = (e, data) => {
  //   this.setState({
  //     sizes: {
  //       ...this.state.sizes,
  //       height: data.size.height,
  //       width: data.size.width
  //     }
  //   });
  // };
  // Object.keys(this.previousState).map(key=>({key, ok:this.previousState[key]===this.state[key]}))
  render() {
    const { keyEvent, functions, getComponent } = this.props;
    const {
      filters,
      sorts,
      meta,
      dataLength,
      filteredDataLength,
      loadedDataLength,
      pageStartIndex,
      radioDataset,
      status,
      activeTable,
      params
    } = this.state;
    let header = null,
      footer = null;
    const sizes = { ...this.props.sizes };
    console.log("ex render", this.props, this.state);
    meta.serverPagination = radioDataset === "get_pagination_manager";
    meta.table.select = radioDataset;
    this.previousState = this.state;
    header = (
      <div>
        <div
          style={{
            display: "block",
            padding: 5,
            height: 50,
            boxSizing: "border-box"
          }}
        >
          Dummy dataset with 5 joined tables: orders (date,#,color,quantitiy),
          products(id, shape, size, price), countries (id, code), currencies
          (id, code, symbol, rate) and thirdparties (id,code). Thirdparties are
          managed with a foreign key controlled by an other zebulon table
          component.
        </div>
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "block",
              padding: 5,
              height: 170,
              boxSizing: "border-box"
            }}
          >
            <div
              style={{
                display: "flex",
                width: 670
                // justifyContent: "space-between"
              }}
            >
              Dataset is generated as
              <input
                type="radio"
                id="radioArray"
                name="radioDataset"
                value="get_array"
                checked={radioDataset === "get_array"}
                onChange={this.handleRadioDataset}
              />
              <div>an array </div>
              <input
                type="radio"
                id="radioPromise"
                name="radioDataset"
                value="get_promise"
                checked={radioDataset === "get_promise"}
                onChange={this.handleRadioDataset}
              />
              <div> a promise or </div>
              <input
                type="radio"
                id="radioObservable"
                name="radioDataset"
                value="get_observable"
                checked={radioDataset === "get_observable"}
                onChange={this.handleRadioDataset}
              />
              <div> an observable </div>
            </div>
            <div>
              {`Dataset length : ${dataLength}, filtered : ${filteredDataLength}, loaded :  ${loadedDataLength} ${pageStartIndex !==
              undefined
                ? ", page start at " + String(pageStartIndex)
                : ""}.`}
            </div>
            <div style={{ marginTop: 5 }}>
              Amount and Amount in € are computed on the fly as quantity*price
              and quantity*price*rate.
            </div>
            <div style={{ marginTop: 5 }}>
              Rolling amount and Total amount are computed initially then on
              demand as :
            </div>
            <div style={{ display: "flex" }}>
              <input
                type="checkbox"
                disabled={this.state.radioDataset === "get_pagination_manager"}
                checked={
                  this.state.rollingAverage &&
                  this.state.radioDataset !== "get_pagination_manager"
                }
                onChange={this.handleRollingAverage}
              />
              rolling average of amounts in € order by date since 30 days.
            </div>
            <div style={{ display: "flex" }}>
              <input
                type="checkbox"
                disabled={this.state.radioDataset === "get_pagination_manager"}
                checked={
                  this.state.totalAmount &&
                  this.state.radioDataset !== "get_pagination_manager"
                }
                onChange={this.handleTotalAmount}
              />sum of amounts in € by country.
            </div>
            <div style={{ display: "flex", marginTop: 10, height: 30 }}>
              <input
                type="checkbox"
                checked={this.state.userZebulon}
                onChange={this.handleUser}
              />
              Connect with a restricted user only allowed to update # of US
              orders,thirdparty hidden.
            </div>
          </div>
          <div style={{ display: "block" }}>
            <textarea
              readOnly
              rows="6"
              cols="120"
              value={this.state.text}
              style={{
                fontFamily: "sans-serif",
                border: "unset",
                fontSize: "medium",
                color: "blue",
                marginLeft: 30
              }}
            />
            <button
              onClick={this.subscribe}
              style={{ marginTop: 15, marginLeft: 30 }}
            >
              Subscription to three server events updating the quantity of the
              12th (by four) first rows by order#
            </button>
          </div>
        </div>
      </div>
    );
    const text =
      "Test key, navigation, zoom, scroll, wheel, accelerators...\n• resize the grid using the handle at right, down corner. \n• ctrl +, ctrl - for zoom in zoom out.\n• ctrl A to select all.\n• F2 New,F3 Duplicate,F4 Delete,F10 Refresh, F11 toggle from/to filters bar, F12 Save.\n• shift to extend the selection,\n• left and right arrows to select previous or next cell in the row,\n• up and down arrows to select the same cell in previous or next row,\n• page up and page down to select the same cell at previous or next page,\n• alt + page up or page down to select on the same row the on previous next, page,\n• home and end to select the cell on the first or last row,\n• alt + home or end to select the first or last cell on the row,\nIn an editable cell, left and right arrow must keep the default behaviour .\n• Alt key is used to force the navigation.\n\nUpdate editable columns\n• update a product -> linked columns from product object are updated.\n• update a quantity -> computed columns (amounts) are updated.\n• update a thirdparty, enter 'a' then quit the cell to select one in the thirdparties beginning by 'a'.\n• update a date to null -> check the status bar tooltip after row change.\n• copy paste from excel (ctrl + C to copy selected  range, ctrl + V to paste from the focused cell. Only editables cells are updates. All validations are done.\n\nTry filters, sorts...\n• Click on a column will toggle the sort direction from none to ascending then descending. The column is added to columns allready sorted (multisort). Reset multisort by double click.\n• Lock and unlock columns with the contectual menu on column headers (right click). \n• Test 'between filters' (date, quantity...), 'values filters' (product, thirdparties..., 'starts filters' (order).\n• Test 'status filters' : right click on top left status cells.\n• Test 'ctrl f' to search values in the grid.\n• Resize and move columns by drag and drop.\n• Test conflict resolution by updatating rows in the 10 first rows by order#, subscribe to a server event then save.\n• Test the 'audit' functionality : right click on status cell on an updated and saved rows (exit of audit by right click on top left status cells).\n• Test privileges management with the 'Connect with a restricted user' check box  ...";
    footer = (
      <div style={{ marginTop: 10, marginLeft: 2 }}>
        <textarea
          readOnly
          rows="20"
          cols="180"
          value={text}
          style={{
            fontFamily: "sans-serif",
            border: "unset"
          }}
        />
      </div>
    );

    // sizes.height = sizes.height - 245;
    return (
      <div style={{ fontFamily: "sans-serif" }} id="zebulon">
        {header}
        <ZebulonTable
          id="dataset"
          style={{ border: "solid grey 0.06em" }}
          meta={meta}
          params={params}
          filters={filters}
          sorts={sorts}
          status={status}
          sizes={this.state.sizes}
          functions={functions}
          keyEvent={keyEvent}
          errorHandler={errorHandler}
          // navigationKeyHandler={navigationKeyHandler}
          onFilter={this.getLengths}
          onGetPage={this.getPageLengths}
          // contextualMenu={customMenuFunctions}
          ref={ref => (this.zebulonTable = ref)}
          isActive={activeTable === "dataset"}
          onActivation={() => this.onActivation("dataset")}
          // closeRequired={closeRequired}
          getComponent={getComponent}
          config={this.state.config}
          onGetData={this.onGetData}
        />
        {footer}
      </div>
    );
  }
}
// return (
//    <div style={{ fontFamily: "sans-serif" }} id="zebulon">
//      {header}
//      <ResizableBox
//        height={this.state.sizes.height}
//        width={this.state.sizes.width}
//        onResize={this.onResize}
//      >
//        <ZebulonTable
//          id="dataset"
//          style={{ border: "solid grey 0.06em" }}
//          meta={meta}
//          params={params}
//          filters={filters}
//          sorts={sorts}
//          status={status}
//          sizes={this.state.sizes}
//          functions={functions}
//          keyEvent={keyEvent}
//          errorHandler={errorHandler}
//          // navigationKeyHandler={navigationKeyHandler}
//          onFilter={this.getLengths}
//          onGetPage={this.getPageLengths}
//          // contextualMenu={customMenuFunctions}
//          ref={ref => (this.zebulonTable = ref)}
//          isActive={activeTable === "dataset"}
//          onActivation={() => this.onActivation("dataset")}
//          closeRequired={closeRequired}
//        />
//      </ResizableBox>
//      {footer}
//    </div>
//  );
