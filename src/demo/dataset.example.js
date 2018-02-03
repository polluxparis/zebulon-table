import React, { Component } from "react";
import { ZebulonTable } from "../table/ZebulonTable";
import { utils } from "zebulon-controls";
import {
  countries,
  currencies,
  shapes,
  sizes,
  colors,
  products
} from "./datasources";
import { computeAnalytic, computeMetaPositions } from "../table/utils";
// import { ZebulonTableAndConfiguration } from "../table/ZebulonTableAndConfiguration";
// import { ZebulonTable } from "../table/ZebulonTable";
// // import ZebulonTable from "../table/ZebulonTable";
// import "zebulon-controls/lib/index.css";
// import "../table/index.css";
// import { Input, constants, utils } from "zebulon-controls";
// import { metaDescriptions, functions } from "../table/MetaDescriptions";
// import { functionsTable, getFilters } from "../table/utils";
// // import { Layout, components, layout } from "./Layout";
// import { MyLayout } from "./layout.example";
// import { MyDataset } from "./dataset.example";
// import { ResizableBox } from "react-resizable";
// import { navigationKeyHandler } from "./navigation.handler";
// import cx from "classnames";
// import {
//   countries,
//   metaCountries,
//   currencies,
//   metaCurrencies,
//   thirdparties,
//   metaThirdparties
// } from "./meta.thirdparties";
// import { metaDataset } from "./meta.dataset";
// const getCountryFlag = ({ row }) => {
//   if (
//     !row.country ||
//     row.country.code === "" ||
//     utils.isNullOrUndefined(row.country.code)
//   ) {
//     return null;
//   }
//   return (
//     <img
//       height="100%"
//       width="100%"
//       padding="unset"
//       src={`//www.drapeauxdespays.fr/data/flags/small/${row.country.code.toLowerCase()}.png`}
//     />
//   );
// };
const rollingAverage = {
  id: "rolling_avg",
  caption: "Rolling average",
  width: 140,
  dataType: "number",
  editable: false,
  aggregation: "avg",
  groupByAccessor: "country.id",
  accessor: ({ row }) => row.qty * (row.product || {}).price,
  comparisonAccessor: "row.d",
  sortAccessor: "row.d",
  windowStart: "since30d",
  hidden: true,
  windowEnd: d => d,
  format: ({ value, row }) => {
    return (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>€</div>
        <div style={{ textAlign: "right" }}>
          {utils.formatValue(value, null, 2)}
        </div>
      </div>
    );
  }
};
const totalAmount = {
  id: "total_amt",
  caption: "Total amount",
  width: 140,
  dataType: "number",
  editable: false,
  hidden: true,
  aggregation: "sum",
  groupByAccessor: "product.id",
  accessor: ({ row }) => row.qty * (row.product || {}).price,
  format: ({ value, row }) => {
    return (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>€</div>
        <div style={{ textAlign: "right" }}>
          {utils.formatValue(value, null, 2)}
        </div>
      </div>
    );
  }
};

const meta = {
  table: {
    object: "dataset",
    editable: true,
    select: "get_array",
    primaryKey: "id",
    onSave: "set",
    noFilter: false,
    actions: [
      { type: "insert", caption: "New", enable: true },
      {
        type: "delete",
        caption: "Delete",
        enable: "isSelected"
      },
      {
        type: "duplicate",
        caption: "Duplicate",
        enable: "isSelected"
      },
      {
        type: "action",
        caption: "Compute",
        enable: true
      },
      {
        type: "save",
        caption: "Save",
        enable: true
      }
    ]
  },
  row: {},
  properties: [
    {
      id: "d",
      caption: "Date",
      width: 100,
      dataType: "date",
      editable: true,
      mandatory: true,
      filterType: "between"
    },
    {
      id: "id",
      caption: "Order #",
      width: 100,
      dataType: "number",
      mandatory: true,
      editable: ({ status }) => status.new_,
      filterType: "between"
    },
    {
      id: "product_id",
      caption: "product_id",
      width: 100,
      dataType: "number",
      hidden: true
    },
    {
      id: "product",
      caption: "Product",
      width: 100,
      dataType: "object",
      mandatory: true,
      hidden: true,
      accessor: "product",
      foreignKeyAccessor: "product.id",
      locked: true
    },
    {
      id: "product_lb",
      caption: "Product",
      width: 100,
      dataType: "string",
      editable: true,
      filterType: "values",
      select: ({ column }) =>
        new Promise(resolve => setTimeout(resolve, 20)).then(
          () => (column.selectItems = products)
        ),
      accessor: "product.label",
      sortAccessor: "product.id"
    },
    {
      id: "shape",
      caption: "Shape",
      width: 100,
      dataType: "string",
      editable: false,
      accessor: "product.shape",
      filterType: "values"
    },
    {
      id: "size",
      caption: "Size",
      width: 100,
      dataType: "string",
      editable: false,
      accessor: "product.size",
      filterType: "values"
    },
    {
      id: "color",
      caption: "Color",
      width: 100,
      dataType: "string",
      editable: true,
      select: [""].concat(colors),
      filterType: "values"
    },

    {
      id: "price",
      caption: "Price",
      width: 90,
      dataType: "number",
      editable: false,
      accessor: "product.price",
      format: ({ value }) => {
        return (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>€</div>
            <div style={{ textAlign: "right" }}>
              {utils.formatValue(value, null, 2)}
            </div>
          </div>
        );
      },
      filterType: "between"
    },
    {
      id: "country_id",
      width: 100,
      dataType: "number",
      hidden: true
    },
    {
      id: "country",
      width: 100,
      dataType: "object",
      mandatory: true,
      hidden: true,
      accessor: "country",
      foreignKeyAccessor: "country.id"
    },
    {
      id: "country_cd",
      caption: "Country",
      width: 100,
      dataType: "string",
      editable: true,
      filterType: "values",
      accessor: "country.code",
      select: countries
    },
    {
      id: "flag",
      caption: "Flag",
      width: 40,
      accessor: "flag"
    },
    {
      id: "currency_id",
      width: 10,
      dataType: "number",
      hidden: true
    },
    {
      id: "currency",
      width: 10,
      dataType: "object",
      mandatory: true,
      hidden: true,
      accessor: "currency",
      foreignKeyAccessor: "currency.id"
    },
    {
      id: "currency_cd",
      caption: "Currency",
      width: 100,
      dataType: "string",
      accessor: "currency.code",
      filterType: "values",
      editable: true,
      select: currencies
    },
    {
      id: "qty",
      caption: "Quantity",
      width: 90,
      dataType: "number",
      editable: true,
      filterType: "between"
    },
    {
      id: "amt_eur",
      caption: "Amount in €",
      width: 120,
      dataType: "number",
      filterType: ">=",
      editable: false,
      accessor: ({ row }) => row.qty * (row.product || {}).price,
      format: ({ value }) => {
        return (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>€</div>
            <div style={{ textAlign: "right" }}>
              {utils.formatValue(value, null, 2)}
            </div>
          </div>
        );
      }
    },
    {
      id: "amt",
      caption: "Amount",
      width: 120,
      dataType: "number",
      editable: false,
      accessor: ({ row }) =>
        row.qty * (row.product || {}).price * (row.currency || {}).rate,
      format: ({ value, row }) => {
        return (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>{row.currency.symbol}</div>
            <div style={{ textAlign: "right" }}>
              {utils.formatValue(value, null, 2)}
            </div>
          </div>
        );
      }
    },

    totalAmount,
    rollingAverage
  ]
};
export class MyDataset extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: {},
      // filters: { qty: { id: "qty", filterType: "between", v: 123, vTo: 256 } },
      sorts: {
        d: { id: "d", direction: "asc", sortOrder: 0 },
        product_lb: { id: "product_lb", direction: "desc", sortOrder: 1 },
        id: { id: "id", direction: "asc", sortOrder: 1 }
      },
      radioDataset: "get_array",
      dataLength: 0,
      filteredDataLength: 0,
      loadedDataLength: 0,
      meta,
      updatedRows: {},
      totalAmount: false,
      rollingAverage: false
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
    computeMetaPositions(meta.properties, this.table.zoomValue);
    this.setState({
      totalAmount: !this.state.totalAmount,
      status: this.state.status
    });
  };
  handleRollingAverage = () => {
    rollingAverage.hidden = this.state.rollingAverage;
    this.setState({ rollingAverage: !this.state.rollingAverage });
    if (!rollingAverage.hidden) {
      computeAnalytic(this.table.state.data, rollingAverage);
    }
    computeMetaPositions(meta.properties, this.table.zoomValue);
    this.setState({
      rollingAverage: !this.state.rollingAverage,
      status: this.state.status
    });
  };
  render() {
    const {
      // updatedRows,
      keyEvent,
      functions
      // params,
    } = this.props;
    const {
      filters,
      sorts,
      meta,
      dataLength,
      filteredDataLength,
      loadedDataLength,
      pageStartIndex,
      radioDataset,
      status
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
            height: 30,
            boxSizing: "border-box"
          }}
        >
          Dummy dataset with 4 joined tables: orders (date,#,color,quantitiy),
          products(id, shape, size, price), countries (id, code) and currencies
          (id, code, symbol, rate).
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
                width: 670,
                justifyContent: "space-between"
              }}
            >
              Dataset is generated as
              <input
                type="radio"
                id="radioArray"
                name="radioDataset"
                value="get_array"
                checked={radioDataset === "get_array"}
                onChange={e => {
                  this.text =
                    "An array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
                  this.setState({
                    radioDataset: "get_array",
                    status: { loading: true }
                  });
                }}
              />
              <label htmlFor="radioArray">an array </label>
              <input
                type="radio"
                id="radioPromise"
                name="radioDataset"
                value="get_promise"
                checked={radioDataset === "get_promise"}
                onChange={e => {
                  this.text =
                    "A server is simulated that returns a promise resolved as an array stored in the client.\nFilters are managed by the server.\nfunction: get_array @ demo/datasources.";
                  this.setState({
                    radioDataset: "get_promise",
                    status: { loading: true }
                  });
                }}
              />
              <label htmlFor="radioPromise"> a promise </label>
              <input
                type="radio"
                id="radioObservable"
                name="radioDataset"
                value="get_observable"
                checked={radioDataset === "get_observable"}
                onChange={e => {
                  this.text =
                    "A server is simulated that returns an observable.\nPages of 1000 rows are pushed by the server and loaded in background by the client .\nSorting is managed by the server to avoid visible reorders.\nfunction: get_observable @ demo/datasources.";
                  this.setState({
                    radioDataset: "get_observable",
                    status: { loading: true }
                  });
                }}
              />
              <label htmlFor="radioObservable"> an observable or </label>{" "}
              <input
                type="radio"
                id="radioPagination"
                name="radioDataset"
                value="get_pagination_manager"
                checked={radioDataset === "get_pagination_manager"}
                onChange={e => {
                  this.text =
                    "A server is simulated that returns a pagination manager function.\nA page of 100 rows including the start and the end row is returned as a promise at each call from the client.\nOnly the current page is stored by the client.\nSorting and filtering are managed by the server.\nfunction: get_pagination_manager @ demo/datasources.";

                  this.setState({
                    radioDataset: "get_pagination_manager",
                    status: { loading: true }
                  });
                }}
              />
              <label htmlFor="radioPagination"> a pagination manager </label>
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

    sizes.height = Math.min(sizes.height - 50, 700);
    return (
      <div style={{ fontFamily: "sans-serif" }} id="zebulon">
        {header}
        <ZebulonTable
          key="dataset"
          id="dataset"
          // visible={selectedTab === 0}
          // isActive={selectedTab === 0}
          // data={data}
          meta={meta}
          filters={filters}
          sorts={sorts}
          // updatedRows={updatedRows}
          status={status}
          sizes={sizes}
          functions={functions}
          // params={params}
          keyEvent={keyEvent}
          errorHandler={this.errorHandler}
          // navigationKeyHandler={navigationKeyHandler}
          onFilter={this.getLengths}
          onSort={this.getLengths}
          onGetPage={this.getPageLengths}
          ref={ref => (this.table = ref)}
        />
        {footer}
      </div>
    );
  }
}