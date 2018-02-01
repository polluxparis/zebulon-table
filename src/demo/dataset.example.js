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
const getCountryFlag = ({ row }) => {
  if (
    !row.country ||
    row.country.code === "" ||
    utils.isNullOrUndefined(row.country.code)
  ) {
    return null;
  }
  return (
    <img
      height="100%"
      width="100%"
      padding="unset"
      src={`//www.drapeauxdespays.fr/data/flags/small/${row.country.code.toLowerCase()}.png`}
    />
  );
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
      id: "product",
      caption: "Product",
      width: 100,
      dataType: "object",
      mandatory: true,
      hidden: true,
      accessor: "product.id"
    },
    {
      id: "product_lb",
      caption: "Product",
      width: 100,
      dataType: "string",
      editable: true,
      filterType: "values",
      select: products,
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
      format: "decimals",
      decimals: 3,
      filterType: "between"
    },
    {
      id: "country",
      width: 100,
      dataType: "object",
      mandatory: true,
      hidden: true,
      accessor: "country.id"
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
      accessor: getCountryFlag
    },
    {
      id: "currency",
      width: 10,
      dataType: "object",
      mandatory: true,
      hidden: true,
      accessor: "currency.id"
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
            <div>{row.country_cur_sym}</div>
            <div style={{ textAlign: "right" }}>
              {utils.formatValue(value, null, 2)}
            </div>
          </div>
        );
      }
    }
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
      updatedRows: {}
    };
    this.text =
      "\nAn array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
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
      footer = (
        <textarea
          readOnly
          rows="6"
          cols="120"
          value={this.text}
          style={{
            fontFamily: "sans-serif",
            border: "unset",
            fontSize: "medium"
          }}
        />
      );
    const sizes = { ...this.props.sizes };

    meta.serverPagination = radioDataset === "get_pagination_manager";
    meta.table.select = radioDataset;
    header = (
      <div
        style={{
          display: "block",
          padding: 5,
          height: 50,
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            display: "flex",
            width: 600,
            justifyContent: "space-between"
          }}
        >
          Dataset as
          <input
            type="radio"
            id="radioArray"
            name="radioDataset"
            value="get_array"
            checked={radioDataset === "get_array"}
            onChange={e => {
              this.text =
                "\nAn array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
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
                "\nA server is simulated that returns a promise resolved as an array stored in the client.\nFilters are managed by the server.\nfunction: get_array @ demo/datasources.";
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
                "\nA server is simulated that returns an observable.\nPages of 1000 rows are pushed by the server and loaded in background by the client .\nSorting is managed by the server to avoid visible reorders.\nfunction: get_observable @ demo/datasources.";
              this.setState({
                radioDataset: "get_observable",
                status: { loading: true }
              });
            }}
          />
          <label htmlFor="radioObservable"> an observable </label>{" "}
          <input
            type="radio"
            id="radioPagination"
            name="radioDataset"
            value="get_pagination_manager"
            checked={radioDataset === "get_pagination_manager"}
            onChange={e => {
              this.text =
                "\nA server is simulated that returns a pagination manager function.\nA page of 100 rows including the start and the end row is returned as a promise at each call from the client.\nOnly the current page is stored by the client.\nSorting and filtering are managed by the server.\nfunction: get_pagination_manager @ demo/datasources.";

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
            : ""}`}{" "}
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
        />
        {footer}
      </div>
    );
  }
}
