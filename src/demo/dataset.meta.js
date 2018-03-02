// import React, { Component } from "react";
// import { ZebulonTable } from "../table/ZebulonTable";
import { countries, currencies, colors, products } from "./datasources";
// import { onNext, onCompleted, onError } from "../table/MetaDescriptions";
// import { getRowErrors, getErrors, loadFileButton } from "../table/utils/utils";
// import { computeMetaPositions } from "../table/utils/compute.meta";
// import { computeAnalytic } from "../table/utils/compute.data";
// import { customMenuFunctions, errorHandler } from "./dataset.functions";
import { MyThirdparties } from "./thirdparties";
// customMenuFunctions;

export const rollingAverage = {
  id: "rolling_avg",
  caption: "Rolling average",
  width: 140,
  dataType: "number",
  editable: false,
  aggregation: "avg",
  groupByAccessor: "country.id",
  accessor: "amt_€",
  comparisonAccessor: "row.d",
  sortAccessor: "row.d",
  windowStart: "since30d",
  hidden: true,
  windowEnd: x => x,
  format: "amt_€"
};
export const totalAmount = {
  id: "total_amt",
  caption: "Total amount",
  width: 140,
  dataType: "number",
  editable: false,
  hidden: true,
  aggregation: "sum",
  groupByAccessor: "country.id",
  accessor: "amt_€",
  format: "amt_€"
};
// const loadFileAction = e => {
//   console.log("onClickLogFile", e);
// };
export const meta = {
  table: {
    object: "dataset",
    editable: true,
    select: "get_array",
    primaryKey: "id",
    onSave: "onSave",
    onSaveAfter: "onSaveAfter",
    onSaveBefore: "onSaveBefore",
    onTableChange: "onTableChange",
    noFilter: false,
    caption: "Dataset",
    // subscription: {
    //   observable: "get_subscription"
    // },
    actions: [
      { type: "insert", caption: "New", enable: true },
      {
        type: "delete",
        caption: "Delete",
        enable: "is_selected"
      },
      {
        type: "duplicate",
        caption: "Duplicate",
        enable: "is_selected"
      },
      // {
      //   type: "action",
      //   caption: "Load",
      //   enable: "is_selected",
      //   action: loadFileAction,
      //   jsxFunction: loadFileButton
      // },
      {
        type: "save",
        caption: "Save",
        enable: true
      },
      {
        type: "refresh",
        caption: "Refresh",
        enable: true
      },
      {
        type: "action",
        caption: "Test",
        enable: true,
        onTableChange: "test",
        action: ({ row, column }) =>
          alert(
            `test row: order# ${row.id} column: ${column ? column.id : null}`
          ),
        doubleClick: true
      }
    ]
  },
  row: {
    audit: undefined //"audit"
  },
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
      editable: "is_new",
      filterType: "between"
      // accessor: ({ row }) => row.id
    },
    {
      id: "product",
      caption: "Product",
      width: 100,
      dataType: "joined object",
      mandatory: true,
      hidden: true,
      // accessor: "product_a",
      // setForeignKeyAccessor: ({ value, row }) => {
      //   row.product_id = value;
      // },
      select: "products",
      accessor: "row.product_id"
      // primaryKeyAccessor: "product.id"
    },
    {
      id: "product_id",
      caption: "product_id",
      width: 100,
      dataType: "number",
      hidden: true
    },
    {
      id: "product_lb",
      caption: "Product",
      width: 120,
      dataType: "string",
      editable: true,
      filterType: "values",
      // select: "products",
      accessor: "row.product.label",
      sortAccessor: "product.id",
      locked: true
    },
    {
      id: "shape",
      caption: "Shape",
      width: 100,
      dataType: "string",
      editable: false,
      accessor: "row.product.shape",
      filterType: "values"
    },
    {
      id: "size",
      caption: "Size",
      width: 100,
      dataType: "string",
      editable: false,
      accessor: "row.product.size",
      filterType: "values"
    },
    {
      id: "color",
      caption: "Color",
      width: 100,
      dataType: "string",
      editable: true,
      select: "colors",
      mandatory: true,
      filterType: "values"
    },

    {
      id: "price",
      caption: "Price",
      width: 90,
      dataType: "number",
      editable: false,
      accessor: "row.product.price",
      format: "price",
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
      caption: "Country",
      mandatory: true,
      width: 100,
      dataType: "joined object",
      hidden: true,
      select: "countries",
      accessor: "row.country_id"
      // primaryKeyAccessor: "country.id"
      // setForeignKeyAccessor: ({ value, row }) => (row.country_id = value)
    },
    {
      id: "country_cd",
      caption: "Country",
      width: 100,
      dataType: "string",
      editable: true,
      filterType: "values",
      accessor: "row.country.code"
    },
    {
      id: "flag",
      caption: "Flag",
      width: 40,
      accessor: "flag"
    },
    {
      id: "currency_id",
      width: 0,
      dataType: "number",
      hidden: true
    },
    {
      id: "currency",
      caption: "Currency",
      width: 0,
      dataType: "joined object",
      mandatory: true,
      hidden: true,
      select: "currencies",
      accessor: "row.currency_id"
      // primaryKeyAccessor: "currency.id"
      // setForeignKeyAccessor: ({ value, row }) => (row.currency_id = value)
    },
    {
      id: "currency_cd",
      caption: "Currency",
      width: 100,
      dataType: "string",
      accessor: "row.currency.code",
      filterType: "values",
      editable: true
      // select: "get_currencies"
    },
    {
      id: "thirdparty",
      caption: "Thirdparty",
      width: 0,
      dataType: "object",
      mandatory: true,
      hidden: true //,
      // primaryKeyAccessor: "thirdparty.id"
    },
    {
      id: "thirdparty_cd",
      caption: "Thirdparty",
      width: 80,
      dataType: "string",
      accessor: "row.thirdparty.cd",
      filterType: "values",
      editable: true,
      foreignObject: "thirdparties",
      noRefresh: false
    },
    {
      id: "qty",
      caption: "Quantity",
      mandatory: true,
      width: 90,
      dataType: "number",
      editable: true,
      filterType: "between"
      // select: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    {
      id: "amt_eur",
      caption: "Amount in €",
      width: 120,
      dataType: "number",
      filterType: ">=",
      editable: false,
      accessor: "amt_€",
      format: "amt_€"
    },
    {
      id: "amt",
      caption: "Amount",
      width: 120,
      dataType: "number",
      editable: false,
      accessor: "amt_cur",
      format: "amt_cur"
    },
    totalAmount,
    rollingAverage
  ]
};
