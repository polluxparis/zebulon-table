# Zebulon pivot grid
React editabled table component.
## Available demo at: http://polluxparis.github.io/zebulon-table/
## Main features
* Sorting, filtering
* Formats
* Auto description
* Computed columns
* Server comunication
## Getting started

Install `zebulon-table` using npm.

```shell
npm install zebulon-table --save
```

And in your code:
```js
import ZebulonTable from 'zebulon-table'
// or 
import ZebulonTableAndConfiguration from 'zebulon-table'
```

## Simple Example

```js
import React, { Component } from "react";
import ReactDOM from "react-dom";
import ZebulonTable from "zebulon-table";

const buildData = (n0, n1, n2) => {
  let data = [];
  for (let i0 = 0; i0 < n0; i0++) {
    for (let i1 = 0; i1 < n1; i1++) {
      for (let i2 = 0; i2 < n2; i2++) {
        data.push({
          totoId: i0,
          totoLabel: `toto${i0}`,
          titi: i1,
          tutu: `tutu${i2}`,
          qty: Math.round(50 * Math.random()) + 1,
          amt: Math.round(150 * Math.random()) + 3
        });
      }
    }
  }
  return data;
};
const buildMeta = () => {
	return {
		// serverPagination: true,
		table: {
			object: "dataset",
			editable: true,
			select: "get_promise",
			primaryKey: "id",
			onSave: "set",
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
					action: "computeData",
					enable: true
				}
			]
		},
		row: {},
		properties: []
	};
};
class MyEditableTable extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  data = buildData(20, 12, 7);
  meta = buildMeta();
  render() {
    return (
      <ZebulonTable
        data={this.data}
        meta={this.meta}
        sizes={{
          height: 600,
          width: 1000,
          cellWidth: 80,
          cellHeight: 28,
          zoom: 0.9
        }}

      />
    );
  }
}
ReactDOM.render(<MyEditableTable  />, document.getElementById("root"));
```
## React zebulon table props
| Property | Type | Description |
|:---|:---|:---|
| data| `PropTypes.object` | Meta description  of the multidimensional matrix linked to the data set|
| updatedRows | `PropTypes.object)` | Updated rows with status (new, updated, deleted), row image before (row value when loaded), row image after (row updated value) |
| meta| `PropTypes.object` | Meta description of the dataset and the way the dataset is managed by the table |
| functions| `PropTypes.object` | JS functions that can be referenced in the meta description|
| filters | `PropTypes.object)` |  |
| sorts | `PropTypes.object)` |  |
| status | `PropTypes.object)` | dataset loading status |
| sizes | `PropTypes.object)` | sizes of the grid (height, width), zoom, default cell sizes |

## Data set
The data set (data property) can be:
####
* an array of similar objects 
```js
[
    {
      totoId: 25,
      totoLabel: "toto25",
      titi: 3,
      tutu: "tutuA",
      qty: 100,
      amt: 12456
    },
    {
      totoId: 154,
      totoLabel: "toto154",
      titi: 12,
      tutu: "tutuS",
      qty: 22,
      amt: 2539
    },
    ...
  ]
```
* a promise (from the server) that will be resolved as an array of objects.
* an observable (from the server) that will push by page arrays of objects (the full dataset will be loaded in background).
* a pagination manager

## Available functions and callbacks
### Visibility
### Function types
### Identifiers
### Meta description and functions
A lot of keys in the meta description prop can refer to a value, a function or an accessor to a function


## Meta description
The meta property is an object describing how to manipulate the dataset, the way to display it, the controls and validation to apply when data are changed, the actions allowed...

It contains 3 sections: table, row and properties.
### table
table
### row

### properties

### Accessors
Accessors are used to get the appropriate values from the data set.
They can be :
####
* the name of a dataset property.
* A function called with the data row as parameter.
* A name of an accessor specified in the configurationFunctions property. 
####
Accessors can be defined for:
####
* dimension ids.
* dimension labels.
* dimension sorting keys.
* measures values.
### Formats
Formats are functions used to format the displayed values
They can be:
####
* undefined.
* A function called with the value to format.
* A name of a format specified in the configurationFunctions property. 
####
Formats can be defined for
####
* dimension labels.
* measures values. 
####
### Aggregations
Aggregation are functions used the calculate the measures called for each cell with an array of values returned by its accessor for each data rows to be computed (at the intersection of the dimension values in rows and columns).
They can be:
####
* A name of an available precoded aggregation as sum, min, max...
* An aggregation function.
* A name of an aggregation function specified specified in the configurationFunctions property.
####
N.B. Aggregations (as weighted average) may require several data. In this case its accessor must return each needed data.
### Sorts
Sorts are objects thay may contains
####
* A sort key accessor
* A sorting function.
* A direction (ascending or descending).
### Dimensions
Dimensions are the dimensions of the multidimentional matrix managed by the component.
Dimensions have:
####
* An id and a label (caption).
* A keys accessor and a label accessor (by default the key accessor) for each dimension instances.
* A facultative sorting.
* A facultative format.
```js
  dimensions: [
    {
      id: "toto",
      caption: "Toto",
      keyAccessor: "totoId",
      labelAccessor: "totoLabel",
      sort: {
        keyAccessor: "totoId"
      },
      format:x=>x.toUpperCase()
    },
    {
      id: "titi",
      caption: "Titi",
      keyAccessor: "titi",
    },
    ...]
```
### Measures
Measures are the calculations, using aggregation function, of the projections of the matrix on the required dimensions.
Measures have:
####
* An id and a label (caption).
* A value accessor.
* An aggregation function.
* A facultative format.
```js
  measures: [
    {
      valueAccessor: "qty",
      id: "qty",
      caption: "Quantity",
      format: value =>(
          <div style={{ color: "blue", textAlign: "right" }}>
            {Number(value).toFixed(0)}
          </div>
        ),
      aggregation: "sum"
    },
    {
      valueAccessor: "amt",
      id: "amt",
      caption: "Amount",
      aggregation: "sum",
      format: "amount"
    },...]
```
### Axis
Displayed dimensions and measures are assigned (ordered) either in row or in column. All measures must be on the same axis.
```js
{
  columns: ["titi"],
  rows: ["toto"],
  activeMeasures: ["qty", "amt"],
  measureHeadersAxis: "columns"
}
```
### Features
Features provided by the component are available by default on the grid. They can be disabled by changing the values from "enabled" to anything else. 
```js
features = {
  dimensions: "enabled",
  measures: "enabled",
  resize: "enabled",
  expandCollapse: "enabled",
  totals: "enabled",
  filters: "enabled",
  sorting: "enabled",
  configuration: "enabled"
}
```
### Others
Collapses, sizes and filters can be defined in the configuration property 
## Configuration functions
The configurationFunctions property can bu used to define named custom formats, accessors, sorts and aggregations
```js
{
  formats: {amount:...},
  accessors: {...},
  sorts: {...},
  aggregations: {...}
}
```
## Menu functions
Custom functions that can be dynamically added to contectual menus on the data cells area:
### Cell functions
Cell functions are called with a cell description object as parameter:
####
* rows and columns dimensions decription (ids, captions...) corresponding to the cell.
* cell value.
* rows from the dataset to calculate the value of the cell. 
### Range functions
Range functions are called with a range description object as parameter:
####
* Each rows and columns dimensions (ids, captions...) corresponding to the cell* Array of arrays of cell values.
####
Range functions are called with a range description object as parameter:
### Grid functions
Grid functions are called with a configuration object as parameter:
####
* Available dimensions and axis (rows or columns) where they are eventually used.
* Available measures and axis where they are eventually used.
```js
 {
  dataCellFunctions: {
    drilldown: cell => {...},
    otherDrilldown: cell => {...}
  },
  rangeFunctions: { range: range => {...} },
  gridFunctions: {...}
}
```


