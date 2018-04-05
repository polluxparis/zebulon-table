import React, { Component } from "react";
import { ZebulonTable } from "../table/ZebulonTable";
import { get_subscription } from "./datasources";
import { onNext, onCompleted, onError } from "../table/MetaDescriptions";
import { getRowErrors, getErrors } from "../table/utils/utils";
import { computeMetaPositions } from "../table/utils/compute.meta";
import { computeAnalytic } from "../table/utils/compute.data";
import { errorHandler } from "./dataset.functions";
import { meta, rollingAverage, totalAmount } from "./dataset.meta";
// customMenuFunctions;

export class MyDataset extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: {},
      // filters: { qty: { id: "qty", filterType: "between", v: 123, vTo: 256 } },
      sorts: {
        // d: { id: "d", direction: "asc", sortOrder: 0 },
        // product_lb: { id: "product_lb", direction: "desc", sortOrder: 1 },
        id: { id: "id", direction: "asc", sortOrder: 1 }
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
      saveConfirmationRequired: false
    };
    this.text =
      "An array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
  }

  getLengths = ({ data, filteredData }) => {
    if (Array.isArray(data)) {
      this.setState({
        dataLength: data.length,
        filteredDataLength: filteredData.length,
        loadedDataLength: data.length,
        pageStartIndex: undefined
      });
    }
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
      computeAnalytic(this.table.state.data, totalAmount);
    }
    meta.visibleIndexes = computeMetaPositions(meta, this.table.zoomValue);
    this.setState({
      totalAmount: !this.state.totalAmount,
      status: this.state.status
    });
    this.table.table.onMetaChange(true);
  };
  handleRollingAverage = () => {
    rollingAverage.hidden = this.state.rollingAverage;
    this.setState({ rollingAverage: !this.state.rollingAverage });
    if (!rollingAverage.hidden) {
      computeAnalytic(this.table.state.data, rollingAverage);
    }
    meta.visibleIndexes = computeMetaPositions(meta, this.table.zoomValue);
    this.setState({
      rollingAverage: !this.state.rollingAverage,
      status: this.state.status
    });
    this.table.table.onMetaChange(true);
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
    const { meta, params } = this.table.state;
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
    this.table.subscribe(message, subscription);
  };
  // radio buttons datasource
  handleRadioDataset = e => {
    console.log("radio", e.target);
    const value = e.target.value;
    this.setState({
      saveConfirmationRequired: ok => {
        console.log("confirmation", ok);
        if (ok) {
          if (value === "get_array") {
            this.text =
              "An array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
          } else if (value === "get_promise") {
            this.text =
              "A server is simulated that returns a promise resolved as an array stored in the client.\nFilters are managed by the server.\nfunction: get_promise @ demo/datasources.";
          } else if (value === "get_observable") {
            this.text =
              "A server is simulated that returns an observable.\nPages of 1000 rows are pushed by the server and loaded in background by the client .\nSorting is managed by the server to avoid visible reorders.\nfunction: get_observable @ demo/datasources.";
          } else if (value === "get_pagination_manager") {
            this.text =
              "A server is simulated that returns a pagination manager function.\nA page of 100 rows including the start and the end row is returned as a promise at each call from the client.\nOnly the current page is stored by the client.\nSorting and filtering are managed by the server.\nfunction: get_pagination_manager @ demo/datasources.";
          }
          this.setState({
            radioDataset: value,
            status: { loading: true },
            saveConfirmationRequired: false
          });
        } else {
          this.setState({
            radioDataset: this.state.radioDataset,
            saveConfirmationRequired: false
          });
        }
      }
    });
  };
  render() {
    const { keyEvent, functions } = this.props;
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
      saveConfirmationRequired
    } = this.state;
    let header = null,
      footer = null;
    const sizes = { ...this.props.sizes };

    meta.serverPagination = radioDataset === "get_pagination_manager";
    meta.table.select = radioDataset;
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
              height: 140,
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
              <label htmlFor="radioArray">an array </label>
              <input
                type="radio"
                id="radioPromise"
                name="radioDataset"
                value="get_promise"
                checked={radioDataset === "get_promise"}
                onChange={this.handleRadioDataset}
              />
              <label htmlFor="radioPromise"> a promise or </label>
              <input
                type="radio"
                id="radioObservable"
                name="radioDataset"
                value="get_observable"
                checked={radioDataset === "get_observable"}
                onChange={this.handleRadioDataset}
              />
              <label htmlFor="radioObservable"> an observable </label>{" "}
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
          </div>
          <textarea
            readOnly
            rows="6"
            cols="120"
            value={this.text}
            style={{
              fontFamily: "sans-serif",
              border: "unset",
              fontSize: "medium",
              color: "blue",
              marginLeft: 30
            }}
          />
        </div>
      </div>
    );
    const text =
      "Test key, navigation, zoom, scroll, wheel...\n• resize the grid using the handle at right, down corner. \n• ctrl  -, ctrl + for zoom in zoom out.\n• ctrl -, \n• shift to extend the selection,\n• left and right arrows to select previous or next cell in the row,\n• up and down arrows to select the same cell in previous or next row,\n• page up and page down to select the same cell at previous or next page,\n• alt + page up or page down to select on the same row the on previous next, page,\n• home and end to select the cell on the first or last row,\n• alt + home or end to select the first or last cell on the row,\nIn an editable cell, left and right arrow must keep the default behaviour .\n• Alt key is used to force the navigation.\n\nUpdate editable columns\n• update a product -> linked columns from product object are updated.\n• update a quantity -> computed columns (amounts) are updated.\n• update a thirdparty, enter 'a' then quit the cell to select one in the thirdparties beginning by 'a'.\n• update a date to null -> check the status bar tooltip after row change.\n• copy paste from excel (ctrl + C to copy selected  range, ctrl + V to paste from the focused cell. Only editables cells are updates. All validations are done.\n\nTry filters, sorts...\n• Click on a column will toggle the sort direction from none to ascending then descending. The column is added to columns allready sorted (multisort). Reset multisort by double click.\n• Lock and unlock columns with the contectual menu on column headers (right click). \n• Test 'between filters' (date, quantity...), 'values filters' (product, thirdparties..., 'starts filters' (order).\n• Test 'status filters' : right click on top left status cells.\n• Test 'ctrl f' to search values in the grid.\n• Resize and move columns by drag and drop.\n• Test conflict resolution by updatating rows in the 10 first rows by order#, subscribe to a server event then save.\n• Test the 'audit' functionality : right click on status cell on an updated and saved rows (exit of audit by right click on top left status cells).\n...";
    footer = (
      <div style={{ marginTop: 10, marginLeft: 2 }}>
        <button onClick={this.subscribe}>
          Subscription to one server event updating the quantity of the 10th
          first rows by order#
        </button>
        <textarea
          readOnly
          rows="40"
          cols="180"
          value={text}
          style={{
            fontFamily: "sans-serif",
            border: "unset"
          }}
        />
      </div>
    );

    sizes.height = sizes.height - 215;
    return (
      <div style={{ fontFamily: "sans-serif" }} id="zebulon">
        {header}
        <ZebulonTable
          id="dataset"
          meta={meta}
          filters={filters}
          sorts={sorts}
          status={status}
          sizes={sizes}
          functions={functions}
          keyEvent={keyEvent}
          errorHandler={errorHandler}
          // navigationKeyHandler={navigationKeyHandler}
          onFilter={this.getLengths}
          onGetPage={this.getPageLengths}
          // contextualMenu={customMenuFunctions}
          ref={ref => (this.table = ref)}
          isActive={activeTable === "dataset"}
          onActivation={() => this.onActivation("dataset")}
          saveConfirmationRequired={saveConfirmationRequired}
        />
        {footer}
      </div>
    );
  }
}
/*
 <input
                type="radio"
                id="radioPagination"
                name="radioDataset"
                value="get_pagination_manager"
                checked={radioDataset === "get_pagination_manager"}
                onChange={this.handleRadioDataset}
              />
              <label htmlFor="radioPagination"> a pagination manager </label>
 */
