export const rollingAverage = {
  id: "rolling_avg",
  caption: "Rolling average",
  width: 140,
  dataType: "number",
  editable: false,
  hidden: true,
  format: "amt_€",
  accessor: "amt_€",
  analytic: {
    aggregation: "avg",
    groupByAccessor: "country.id",
    comparisonAccessor: "row.d",
    sortAccessor: "row.d",
    windowStart: "since30d",
    windowEnd: x => x
  }
};
export const totalAmount = {
  id: "total_amt",
  caption: "Total amount",
  width: 140,
  dataType: "number",
  editable: false,
  hidden: true,
  format: "amt_€",
  accessor: "amt_€",
  analytic: {
    aggregation: "sum",
    groupByAccessor: "country.id"
  }
};
export const meta = {
  table: {
    object: "dataset",
    editable: true,
    select: "get_array",
    rowId: "rowId_",
    onSave: "onSave",
    onSaveAfter: "onSaveAfter",
    onSaveBefore: "onSaveBefore",
    onTableChange: "onTableChange",
    statusDraggable: true,
    noFilter: false,
    noStatus: false,
    noOrder: false,
    actions: [
      { type: "insert", caption: "New", enable: true, key: "f2" },
      {
        type: "delete",
        caption: "Delete",
        enable: "is_selected",
        key: "f3"
      },
      {
        type: "duplicate",
        caption: "Duplicate",
        enable: "is_selected",
        key: "f4"
      },
      {
        type: "save",
        caption: "Save",
        enable: true,
        key: "f12"
      },
      {
        type: "refresh",
        caption: "Refresh",
        enable: true,
        key: "f10"
      },
      {
        type: "action",
        enable: true,
        hidden: true,
        action: "toggleFilter",
        key: "f11"
      }
    ]
  },
  row: {
    audit: "audit"
  },
  properties: [
    {
      id: "rowId_"
    },
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
    },
    {
      id: "product",
      caption: "Product",
      width: 100,
      dataType: "joined object",
      mandatory: true,
      hidden: true,
      select: "getProducts",
      accessor: "row.product_id"
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
      select: "getColors",
      // mandatory: true,
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
      select: "getCountries",
      accessor: "row.country_id"
    },
    {
      id: "country_cd",
      caption: "Country",
      width: 100,
      dataType: "string",
      editable: true,
      filterType: "values",
      accessor: "row.country.code",
      onQuit: "onChangeCountry"
    },
    {
      id: "flag",
      caption: "Flag",
      width: 40,
      accessor: "flag",
      format: "image"
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
      select: "getCurrencies",
      accessor: "row.currency_id"
    },
    {
      id: "currency_cd",
      caption: "Currency",
      width: 100,
      dataType: "string",
      accessor: "row.currency.code",
      filterType: "values",
      editable: true
    },
    {
      id: "thirdparty",
      caption: "Thirdparty",
      width: 0,
      dataType: "object",
      mandatory: true,
      hidden: true
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
