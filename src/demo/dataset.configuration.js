import React, { Component } from "react";
import { ZebulonTableAndConfiguration } from "../table/ZebulonTableAndConfiguration";
import { get_subscription } from "./datasources";
import { onNext, onCompleted, onError } from "../table/MetaDescriptions";
import { getRowErrors, getErrors, loadFileButton } from "../table/utils/utils";
import { computeMetaPositions } from "../table/utils/compute.meta";
import { computeAnalytic } from "../table/utils/compute.data";
import { customMenuFunctions, errorHandler } from "./dataset.functions";
import { meta, rollingAverage, totalAmount } from "./dataset.meta";
import { getMockDataset } from "./datasources";
import { MyThirdparties } from "./thirdparties";
// customMenuFunctions;

export class MyDatasetConfiguration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: {}
    };
  }
  render() {
    const { sizes, params, keyEvent, functions } = this.props;
    const metaDataset = { ...meta };
    metaDataset.properties = [];
    metaDataset.lockedIndex = null;
    metaDataset.lockedWidth = null;
    const data = getMockDataset(25000);
    const text =
      "Dataset row object:{d:<date>,id:<number>,product_id:<number>,currency_id:<number>,country_id:<number>,qty:<number>,color:<string>,thirdparty:{id:<number>,cd:<string>,lb:<string>}}.\nProduct object:{id:<number>,label:<string>,price:<number>,shape:<string>,size:<string>}.\nCurrency object:{id:<number>,code:<string>,label:<string>,symbol:<string>rate:<number>}.\nCountry object:{id:<number>,code:<string>,label:<string>,currency_id:<number>}.\nN.B. Accessors, formats...exists allready.\n\nOn the Properties tab.\nJoined the objects products, countries, currencies:\n• create 3 new properties (product, country, currency) with \n  • type = joined object.\n  • accessor = respectively row.product_id, row.country_id, row.currency_id.\n  • select = respectively products, countries, currencies.\n\nOn the Dataset tab.\nRefresh the dataset (refresh button) to load the instances of the objects, new accessors on objects keys won't be accessible otherwise.\n\nOn the Properties tab.\nCreate the 4 new properties for products:\n• product_cd, editable = true, accessor = row.product.label (only the properties used for the select Input must be editable)\n• price, editable = false, accessor = row.product.price\n• shape, editable = false, accessor = row.product.shape\n• size, editable = false, accessor = row.product.price\nSet the price format to price property,\nCreate the 2 new properties for countries:\n• country_cd, editable = true, accessor = row.country.code (only the properties used for the select Input must be editable)\n• flag, editable = false, accessor = flag, width = 50\nCreate the new property for currencies:\n• currency_cd, editable = true, accessor = row.currency.code (only the properties used for the select Input must be editable)\nCreate the new property for thirdparties foreign table object:\n• thirdparty_cd, editable = true, accessor = row.thirdparty.cd, foreign object = thirdparties\nSet row color select = colors.\nHide the ids (product, currency, country).\nCreate the 2 calculated properties \n• amount, editable =  false, format = amt_cur, accessor = amt_cur, width = 150\n• amountEUR, editable =  false, format = amt_€, accessor = amt_€, width = 150\nRename the columns (caption column).\nSet the appropriate filter type on the properties..\n.\nTest the result on the Dataset tab.";
    return (
      <div>
        <ZebulonTableAndConfiguration
          functions={functions}
          params={params}
          data={data.data}
          meta={metaDataset}
          status={this.state.status}
          sizes={sizes}
          keyEvent={keyEvent}
          // errorHandler={this.errorHandler}
        />
        <div
          style={{
            fontFamily: "sans-serif",
            border: "unset",
            paddingTop: 50,
            fontWeight: "bold"
            // fontSize: "medium"
          }}
        >
          Create the configuration from the original dataset as in the 'Dataset
          and server' tab.
        </div>
        <textarea
          readOnly
          rows="40"
          cols="180"
          value={text}
          style={{
            fontFamily: "sans-serif",
            border: "unset",
            paddingTop: 10
            // fontSize: "medium"
          }}
        />
      </div>
    );
  }
}
// <ZebulonTable
//          key="dataset"
//          id="dataset"
//          meta={meta}
//          filters={filters}
//          sorts={sorts}
//          status={status}
//          sizes={sizes}
//          functions={functions}
//          keyEvent={keyEvent}
//          errorHandler={errorHandler}
//          // navigationKeyHandler={navigationKeyHandler}
//          onFilter={this.getLengths}
//          onGetPage={this.getPageLengths}
//          // contextualMenu={customMenuFunctions}
//          ref={ref => (this.table = ref)}
//          isActive={activeTable === "dataset"}
//          onActivation={() => this.onActivation("dataset")}
//          saveConfirmationRequired={saveConfirmationRequired}
//        />
