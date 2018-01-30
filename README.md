# Zebulon table
IN PROGRESS
Zebulon table is a hight performance fully virtualized React editable table component.
## Available demo at: http://polluxparis.github.io/zebulon-table/
## Main features
* Sorting, filtering
* Copy, paste
* Formats
* Validations
* Self description
* Computed columns
* Server communication
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
			select: buildData,
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
				}
			]
		},
		row: {},
		properties: []
	};
};
class MyEditableTable extends Component {
  meta = buildMeta();
  render() {
    return (
      <ZebulonTable
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
## Zebulon table props
| Property | Type/required | Description |
|:---|:---|:---|
| sizes | object required | sizes of the grid (height, width), zoom, default cell sizes |
| [meta](#meta-description)| object | Meta description of the dataset and the way the dataset is managed by the table |
| [functions](#available-functions-and-callbacks)| object or array | JS functions that can be referenced in the meta description|
| params | object | Global parameters used for the dataset manipulation (user data by example) |
| data| array |Datasource as an array, a promise, an observable or a "pagination manager"|
| updatedRows | object | Updated rows with status (new, updated, deleted), row image before (row value when loaded), row image after (row updated value) |
| filters | object | Initial or external filters  |
| sorts | object |  Initial or external sorts|
| status | object | Dataset loading status |
| keyEvent | event | Dataset loading status |
| navigationKeyHandler | function(event, {nextCell, nextPageCell, endCell, selectCell}) | Custom function to overwrite key navigation in the grid|
| isActive | boolean | Indicator that the component is active| 
| errorHandler | object | Custom error management|
###
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
* a pagination manager as a function to retrieve the appropriate pages from the server. In this case, the full dataset is not loaded locally, but only the diplayed page.

## Available functions and callbacks
In the manipulation of the dataset, you may need to call functions for data calculation, formating, validation...
Those functions are passed (functions property) to the component as 
* an object
```js
{
  "myDatasetObjectId": {
    "myFunctionType",: {
      "myFunctionId":()=>{},
      ...
      },
      ...
    },
    ...
  }
``` 
* an array
```js
[
  {
    id: "myFunctionId",
    visibility: "myDatasetObjectId",
    tp: "myFunctionType",
    caption: "myFunctionCaption",
    functionJS: ()=>{})
  },
  ...
]
```
##### Visibility
As you may need to call several instances of the component for different dataset objects, the visibility identified the object concerned by the function. Visibility can be defined as "global_".
##### Function types
Function types determine the role of the function and then, the parameters used to call it.
(data->not filtered dataset, 
status-> updatedRows[currentRow.index_],
column-> meta.properties[currentColumn.index_]).
Available types are:
###
| Type | Parameters | Description |
|:---|:---|:---|
| accessor| (row, column, params, status, data) |returns a calculated value (computed column) for a given row. Accessors can be used to find a value, a sort key, aggregation components...|
| format | (value, row, column, params, status, data)| returns the formated value (potentialy as JSX) |
| editable|({column, row, params, status, data})| returns if the column is editable as a boolean |
| default|({column, row, params})| returns the default value|
| validator| ({value, previousValue or previousRow, column or meta, row, params, status or updatedRows, data})| returns as a boolean if the action ( changed value, cell quit, row quit, table quit, save...) can be continued. status or updatedRows errors entry can be updated|
|dml|({dataObject, params, filters, sorts}) or ({dataObject, params, updatedRows, data})|select function (returns dataset) or insert, update, delete functions (returns new updatedRows)|

#### Meta description, functions and callbacks
A lot of keys in the meta description prop can refer to a value, a function or an accessor (function name) to a function.
By example, an editable entry for a column X could take the values:
###
* true or false
* ({column,row})=>row[column.id].isEditable
* "isColumnEditable" name of a function (in the functions property with the global_ or object visibility and the type "editable") ({column,row})=>row[column.id].isEditable
###
The component is designed to be fully defined with the properties sizes, meta and, if necessary, functions and params. Nevertheless callbacks are 
available (and will overwrite functions defined in the meta description) for validation and data manipulation functions:
###
* onChange
* onCellEnter
* onCellQuit
* onRowNew
* onRowEnter
* onRowQuit
* onTableEnter
* onTableQuit
* onTableClose
* onFilter
* onSort
* onGetData
* onSaveBefore
* onSaveAfter
## Meta description
The meta property is an object describing how to manipulate the dataset, the way to display it, the controls and validation to apply when data are changed, the actions allowed...

It contains 3 sections: table, row and properties.
```js
{
  serverPagination:false // default:false
  table:{...}
  row:{...}
  properties:{...}
}
```
### table
```js
{
    object: "dataset",
    editable: true, // default : false
    select: "onSelect",
    primaryKey: "id", // unused yet
    onSave: "onSave",
    onSaveBefore: null,
    onSaveAfter: null,
    noFilter: false, // Indicator if the filter bar is diplayed. default : false
    noStatus: false, //  Indicator if the status bar is diplayed. default : false
    actions: []
}
```
##### DML functions  
* select
* onSave
* onSaveBefore
* onSaveAfter
##### Actions  
### row
It contains 3 sections: table, row and properties.
```js
{
  onEnter:null,
  onQuit:null
}
```
##### Validators
* onEnter : Function triggered when a row is entered. Parameters : ({ row, status, data, params}).
* onQuit : Function triggered before change of focused row.  Parameters : ({ row, previousRow, status, data, params}).
### properties
```js
{
    id: "id", // mandatory
    caption: "Code", // default : id
    width: 100, // default : props.sizes.cellWidth
    hidden:false, // default : false
    dataType: "string", // boolean, number, date, string, object. default : first datarow correponding property datatype
    editable: true, //value (true, false) or function or function accessor. default table.editable
    mandatory: true, // default false
    default:"toto",
    filterType:"between", // default 
    select:["toto","tutu","titi"], // default null
    accessor:null,
    format:null,
    onChange:null,
    onEnter:null,
    onQuit:null
}
```
##### Accessors
* value accessor : Function (or function accessor) that returns a computed value. By default (row,column)=> row[column.id].
* sort accessor : Function (or function accessor) that returns the elements needed by the sort function. By default value accessor.
##### Format
Formatting function that returns a formatted string or a JSX element. Parameters :(value, row, column, params, status, data).
##### Sort function 
Custom sort function. Parameters :(sortAccesor(rowA),sortAccesor(rowB)). 
##### Filter type
Filtering method used for the column.
* starts : value.startsWith(filterValue) 
* =
* \>=
* <=
* between : value >= filterValueFrom && value <= filterValueTo 
* values : value in existing dataset values. A checkable list is used to define filter.
##### Select
List of possible values. It can be an array of values, an object {id:caption,...}, or an object {id:{id:,caption:},...}

##### Validators
* onChange : Function triggered on cell changes. Parameters :({value,previousValue, row, status,column,data,params}).
* onEnter : Function triggered when a cell is entered. Parameters :({value,previousValue, row, status,column,data,params}).
* onQuit : Function triggered before change of focused cell.Parameters :({value,previousValue, row, status,column,data,params}).
## Updated rows
## Filtering and sorting
## Pagination manager
## Error handler
## Key events and navigation key handler
## Managing privileges
## Self description

