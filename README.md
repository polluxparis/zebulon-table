# Zebulon table
Zebulon table is a hight performance fully virtualized React editable table component.
## Available demo at: http://polluxparis.github.io/zebulon-table/
## Main features
* Key navigation.
* Sorting, filtering.
* Formats.
* Validations.
* Foreign key management.
* Copy, paste.
* Self description.
* Computed columns.
* Server communication.
## Help and suggestions would be welcome.
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
| [data](#data-set)| array |Datasource as an array, a promise, an observable or a "pagination manager"|
| [updatedRows](#updated-rows) | object | Updated rows with status (new, updated, deleted), row image before (row value when loaded), row image after (row updated value) |
| [filters](#filtering-and-sorting) | object | Initial or external filters  |
| [sorts](#filtering-and-sorting) | object |  Initial or external sorts|
| status | object | Dataset loading status |
| [keyEvent](#key-events-and-navigation-key-handler) | event | Dataset loading status |
| [navigationKeyHandler](#key-events-and-navigation-key-handler) | function(event, {nextCell, nextPageCell, endCell, selectCell}) | Custom function to overwrite key navigation in the grid|
| isActive | boolean | Indicator that the component is active| 
| [errorHandler](#error-handler) | object | Custom error management|
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
      tutu: "tutu",
      qty: 22,
      amt: 2539
    },
    ...
  ]
```
* a promise (from the server) that will be resolved as an array of objects.
* an observable (from the server) that will push by page arrays of objects (the full dataset will be loaded in background).
* a pagination manager as a function to retrieve the appropriate pages from the server. In this case, the full dataset is not loaded locally, but only the diplayed page.
### Object properties and foreign keys
A row entry can be an object, a pointer to an object or a foreign key referencing an object. Foreign keys can be used to retrieve an object using the accessor of and "object property".
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
### Using accessors
An accessor is a descriptor(string) used to retrieve a function that returns data or execute different actions.
####data accessors (on properties)
* The default accessor function is ({row})=>row[property.id].
* You can refer to an other property value :"row.<referenced property id>", eg row.quantity. N.B. "row." is mandatory in this case to make the distinction with function accessors. Accessor function is ({row})=>row[referenced property.id] 
* 
* You can refer to a key of an object stored in a property :<referenced property id>.<key>, eg product.price. Accessor function is ({row})=>row[referenced property.id].[key]
* You can refer to a function accessor.
####function accessors
Functions can be defined directly in the meta description or referenced by accessors: f =typeof meta...x===function?meta...x:functions[object][function type][meta...x] 
It contains 3 sections: table, row and properties.
### meta object
```js
{
  serverPagination:false // default:false
  table:{...}
  row:{...}
  properties:{...}
}
```
### table 
N.B. if the table section is the only one defined, properties section will be initilalized using the first row of the dataset.
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
Not documented yet
### row
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
N.B. width and properties order can be defined on the table by drag and drop.
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
* foreignKeyAccessor : (for object properties only) Function (or function accessor) that returns the value of the object primary key.
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
The updatedRows prop is an object with an entry for each updated rows in the table. The value of the key is the absolute index (or the primary key) of the row (index can be found in row.index_).
```js
{
  [absolute index]:{
    updated_:true,
    new_:false,
    deleted_:false,
    row:[before update row],
    rowUpdated:[after update row],
    errors:{[column]:{[type]:error text}}
}
```
N.B. By default, errors are not blocking in the table. You'll have to manage the blocking yourself with the Error Handler.

If you pass an updatedRows prop as an empty object, it will mutate at each update in the table. Validation functions should update the error entry if needed. In consequence, the component calling the table component can know at any time all the changes since the loading of data.  

## Error handler
onQuit functions can be cancelled if the onQuit function returns false or if the function passed as the errorHandler prop returns false. Parameters are the same as for the onQuit function. To create interractions with the user, you'll have to block the UI thread as with window.alert or window.confirm.   

## Filtering and sorting
Filtering and sorting can be done directly in the table.
The way used to filter can be defined at the filterType entry of the meta.properties prop.
You can sort ascending or descending on one or several columns by clicking on it's header. Double click on a header will reset the previous orders.
Filters and sorts objects are parameters of any calls to the server.
filters and sorts objects can be used as props for initial definition.
```js
filters={
  {
  [columnId1]:{
    id: columnId1, 
    filterType: "between",
    dataType:"number",
    v:156,
    vTo:562},
  [columnId2]:{
    id: columnId2,
    filterType: "values", // in filter
    dataType:"number", 
    v:{[Id1]: "toto 3", [toto 4]id2]: "toto 4"}},
  ...
};
sorts={
  [columnId1]:{id: columnId1, direction: "asc", sortOrder: 0},
  [columnId2]:{id: columnId2, direction: "desc", sortOrder: 1},
  ...
};
```
## Pagination manager
Not yet documented
## Computed columns
Not yet documented
## Key events and navigation key handler
To manage correctly key events, specialy with several instances of the component, you can pass from an upper component the event as a prop. Only active component,considering the isActive prop will handle the event.
Key events are used to navigate in the the grid, select a range of cells, zoom, copy or paste.
The actual behaviour is 
* ctrl + C, ctrl + V for copy paste,
* ctrl -, ctrl +  for zoom in, zoom out,
* shift to extend the selection,
###
For a not editable table :
* left and righ arrows to select the previous or next cell in the row,
* up and down arrows to select the same cell in previous or next row,
* page up and page down to select the same cell at previous or next page,
* alt + page up or page down to select on the same row the on previous next, page,
* home and end to select the cell on the first or last row,
* alt + home or end to select the first or last cell on the row,
###
For an editable grid left and righ arrow must keep the default behavior in the edditable cells. The alt key is used to force the navigation behavior.
###
You can overwrite the navigationKeyHandler functions setting your custom function in the navigationKeyHandler prop (see /demo/navigation.handler.js).
## Managing privileges
Not yet documented
## Self description
Not yet documented
## Details and drilldown
Not yet documented
## To do
* Complete documentation.
* Demo.
* Loading from observable improvement.
* Pagination manager improvement.
* Computed columns with aggregation functions improvement. 
* "values" filter improvement.
* Styles and design improvement.
* Contextual menu and tooltips management.
* Audits.
* Rollback of row updates.
* Details improvement.
* Parameterisation of "actions".
* Grouped columns.
* Lock of columns.
*...

