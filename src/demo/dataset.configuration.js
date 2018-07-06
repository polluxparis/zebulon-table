import React, { Component } from "react";
import { ZebulonTableAndConfiguration } from "../table/ZebulonTableAndConfiguration";
import { meta } from "./dataset.meta";
import { get_array } from "./datasources";
// customMenuFunctions;

export class MyDatasetConfiguration extends Component {
  constructor(props) {
    super(props);
    const metaDataset = { ...meta };
    metaDataset.table = { ...metaDataset.table };
    metaDataset.table.actions = [
      ...metaDataset.table.actions,
      {
        type: "action",
        caption: "Export Meta",
        enable: true,
        hidden: true,
        action: "exportMeta"
      }
    ];
    metaDataset.properties = [];
    metaDataset.lockedIndex = null;
    metaDataset.lockedWidth = null;
    const data = get_array({ noJoins: true });
    const status = {};
    this.state = {
      status,
      data,
      meta: metaDataset,
      params: { user_: "Zebulon" }
    };
  }
  render() {
    const text =
      "Dataset row object:{d:<date>,id:<number>,product_id:<number>,currency_id:<number>,country_id:<number>,qty:<number>,color:<string>,thirdparty:{id:<number>,cd:<string>,lb:<string>}}.\nProduct object:{id:<number>,label:<string>,price:<number>,shape:<string>,size:<string>}.\nCurrency object:{id:<number>,code:<string>,label:<string>,symbol:<string>rate:<number>}.\nCountry object:{id:<number>,code:<string>,label:<string>,currency_id:<number>,vat:<number>}.\nN.B. Accessors, formats...exists allready.\n\nOn the Properties tab.\nJoined the objects products, countries, currencies:\n• create 3 new properties (product, country, currency) with \n  • type = joined object.\n  • accessor = respectively row.product_id, row.country_id, row.currency_id.\n  • select = respectively getProducts, getCountries, currencies.Apply changes on the dataset (apply button) to load the instances of the objects, new accessors on objects keys won't be accessible otherwise.\n\nOn the Dataset tab.\n\nOn the Properties tab.\nCreate the 4 new properties for products:\n• product_cd, data type = string, editable = true, accessor = row.product.label (only the properties used for the select Input must be editable)\n• price, data type = number, editable = false, accessor = row.product.price\n• shape, data type = string, editable = false, accessor = row.product.shape\n• size, data type = string, editable = false, accessor = row.product.size\nSet the price format to price property,\nCreate the 2 new properties for countries:\n• country_cd, data type = string, editable = true, accessor = row.country.code (only the properties used for the select Input must be editable)\n• flag, editable = false, accessor = flag, format = image, width = 40\nCreate the new property for currencies:\n• currency_cd, data type = string, editable = true, accessor = row.currency.code (only the properties used for the select Input must be editable)\nCreate the new property for thirdparties foreign table object:\n• thirdparty_cd, data type = string, editable = true, accessor = row.thirdparty.cd, foreign object = thirdparties\nSet row color select = getColors, data type = string.\nCreate a new property:\n• code = month, data type = date, format = mm/yyyy, accessor = mth, filter = values\nHide the ids (product, currency, country).\nCreate the 2 calculated properties \n• amount, data type = number, editable =  false, format = amt_cur, accessor = amt_cur, width = 150\n• amountEUR, data type = number, editable =  false, format = amt_€, accessor = amt_€, width = 150.\nApply changes and check on the Dataset tab\n\nOn the Functions tab.\nCreate a new accessor: gross_amount.\n• code = gross_amt.\n• visibility = dataset.\n• type = accessor.\n• function = ({row})=>accessor('amt_cur')({row})*(1+(row.country||{vat:0}).vat).\nN.B. The accessor function let you use an other accessor in your function.\nApply changes and check on the Dataset tab.\n\nOn the Properties tab.\nCreate a new property:\n• code = gross_amt.\n• format = amt_cur.\n• accessor = gross_amt.\nCreate the 2 new properties calculated by analytics functions:\n• code = totalAmountByCountry, data type = number, accessor = totalAmt, analytic function = total_amt.\n• code = rollingAverage, data type = number, accessor = amt_cur, analytic function = rolling_avg.\nApply changes and check on the Dataset tab. \n\nAdd an init function to set country currency by default when country changes and currency is null (country_cd/onChange = onChangeCountry).\nRename the columns (caption column).\nSet the appropriate filter type on the properties..\nApply changes and check on the Dataset tab.\n.\nTest the result on the Dataset tab.";
    const { sizes, keyEvent, functions, id } = this.props;
    // ({row})=>{const acc=accessor('amt_cur');return acc({row})*(1+(row.country||{vat:0}).vat);}
    const { data, meta, status, params } = this.state;
    return (
      <div>
        <ZebulonTableAndConfiguration
          id={id}
          functions={functions}
          params={params}
          data={data}
          meta={meta}
          status={status}
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
          rows="25"
          cols="180"
          value={text}
          style={{
            fontFamily: "sans-serif",
            border: "unset",
            paddingTop: 10
          }}
        />
      </div>
    );
  }
}
