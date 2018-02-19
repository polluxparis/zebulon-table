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
* Column locks.
* Custom contextual menus.
* Self description.
* Computed columns.
* Server communication.
## Help and suggestions would be welcome.
## Table of contents
* [Getting started.](#zegetting-started)
* [Zebulon table props.](#zebulon-table-props)
* [Data set.](#data-set)
* [Foreign keys.](#object-properties-and-foreign-keys)
* [Available functions and callbacks.](#Available-functions-and-callbacks)
* [Meta description.](#meta-description)
* [Saving updated data.](#saving-updated-data)
* [Error management.](#error-management)
* [Working with a redux store.](#working-with-a-redux-store)

## Getting started
Install `zebulon-table` using npm.
```shell
npm install zebulon-table --save
```
And in your code:
```js
import ZebulonTable from 'zebulon-table'
```
## Simple Example
```js
import React, { Component } from "react";
import ReactDOM from "react-dom";
import { ZebulonTable } from "zebulon-table";
import "zebulon-controls/lib/index.css";
import "zebulon-table/lib/index.css";

const buildData = () => {
  const n0 = 100,
    n1 = 100,
    n2 = 10;
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
          enable: "is_selected"
        },
        {
          type: "duplicate",
          caption: "Duplicate",
          enable: "is_selected"
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
      <div style={{ fontFamily: "sans-serif" }}>
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
      </div>
    );
  }
}
ReactDOM.render(<MyEditableTable />, document.getElementById("root"));
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
| [keyEvent](#key-events-and-navigation-key-handler) | event | Keyboard event |
| [navigationKeyHandler](#key-events-and-navigation-key-handler) | function(event, {nextCell, nextPageCell, endCell, selectCell}) | Custom function to overwrite key navigation in the grid|
| isActive | boolean | Indicator that the component is active| 
| [errorHandler](#error-handler) | object | Custom error management|
| [contextualMenu](#custom-contextual-menu) | object | Custom contextual menu|
| [saveConfirmationRequired](#requiring-save-with-bconfirmation) | callback | callback to execute after save requirement|
| [onChange](#available-functions-and-callbacks) | table event callback | Change of cell value |
| [onCellEnter](#available-functions-and-callbacks) | table event callback | Enter a cell|
| [onCellQuit](#available-functions-and-callbacks) | table event callback | Quit a cell|
| [onRowNew](#available-functions-and-callbacks) | table event callback | Add a new row|
| [onRowEnter](#available-functions-and-callbacks) | table event callback | Enter a row|
| [onRowQuit](#available-functions-and-callbacks) | table event callback | Quit a row|
| [onTableEnter](#available-functions-and-callbacks) | table event callback | Enter the table (active)|
| [onTableQuit](#available-functions-and-callbacks) | table event callback | Quit the table|
| [onTableClose](#available-functions-and-callbacks) | table event callback | Close the table |
| [onFilter](#available-functions-and-callbacks) | table event callback | Change filters|
| [onSort](#available-functions-and-callbacks) | table event callback | Change sorts|
| [onGetData](#available-functions-and-callbacks) | table event callback | Get data|
| [onGetPage](#available-functions-and-callbacks) | table event callback | Get a new page |
| [onSave](#available-functions-and-callbacks) | table event callback | Save updated data|
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
Accessors are executed only when the component renders, except for "object properties": the referenced object is stored initialy in the dataset and then, it's properties can be referenced by the other columns.
The foreign object can be manage as
* a select input (meta.properties[x].select) as an array of objects or an object of objects,
N.B.
```js
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
      dataType: "object",
      mandatory: true,
      hidden: true,
      accessor: "currency",
      primaryKeyAccessor: "currency.id",
      setForeignKeyAccessor: ({ value, row }) => (row.currency_id = value)
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
    }
```
* a zebulon table class (meta.properties[x].foreignObject)
On cellQuit of the column with a foreign object, if no row match the filter (starts with the value entered in the column not case sensitive), the quit action will be canceled, if only 1 row match, the row will be set as the object else the referenced class will be displayed filtered as a modal dialog to select the appropriate row.
```js
    {
      id: "thirdparty",
      caption: "Thirdparty",
      width: 0,
      dataType: "object",
      mandatory: true,
      hidden: true,
      primaryKeyAccessor: "thirdparty.id"
    },
    {
      id: "thirdparty_cd",
      caption: "Thirdparty",
      width: 80,
      dataType: "string",
      accessor: "thirdparty.cd",
      filterType: "values",
      editable: true,
      foreignObject: MyThirdparties
    },
```
N.B.
You may want to use a select input for limited items lists (eg currencies), in this case, it may be loaded on the client as an object of object 
{
  [primary key 1]:{id:[primary key 1],code:...},
  [primary key 2]:{id:[primary key 2],code:...}},
  ...
} and referenced in the object accessor. Only the primary is needed in the original dataset.
For more important foreign object (eg thirdparties), it is not loaded on the client but required from the server when needed. The referenced object should be loaded in the original dataset.

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
#### data accessors (on properties)
* The default accessor function is ({row})=>row[property.id].
* You can refer to an other property value :"row.<referenced property id>", eg row.quantity. N.B. "row." is mandatory in this case to make the distinction with function accessors. Accessor function is ({row})=>row[referenced property.id] 
* You can refer to a key of an object stored in a property :<referenced property id>.<key>, eg product.price. Accessor function is ({row})=>row[referenced property.id].[key]
* You can refer to a function accessor.
#### function accessors
Functions can be defined directly in the meta description or referenced by accessors: f =typeof meta...x===function?meta...x:functions[object][function type][meta...x]
### meta object
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
N.B. if the table section is the only one defined, properties section will be initilalized using the first row of the dataset.
```js
{
    object: "dataset",
    editable: true, // default : false
    select: "onSelect",
    primaryKey: "id", // unused yet
    onSave: "onSave",
    onSaveBefore: undefined,
    onSaveAfter: undefined,
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
  onEnter:undefined,
  onQuit:undefined
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
    dataType: "string", // boolean, number, date, string, object. default : first data row correponding property datatype
    editable: true, //value (true, false) or function or function accessor. default table.editable
    mandatory: true, // mandatory indicator, default false
    default:"toto", // default value, default undefined
    filterType:"between", // default: "starts", ">=" or "between" depending of the datatype
    select:["toto","tutu","titi"], // default undefined
    accessor:undefined,
    sortAccessor:undefined,
    format:undefined,
    onChange:undefined,
    onEnter:undefined,
    onQuit:undefined
    // specific data for window calculation (computed columns with aggregation)
    aggregation:undefined,
    comparisonAccesssor:undefined,
    groupByAccessord:undefined,
    windowStart:undefined,
    windowEnd:undefined
}
```
##### Accessors
* value accessor : Function (or function accessor) that returns a computed value. By default (row,column)=> row[column.id].
* sort accessor : Function (or function accessor) that returns the elements needed by the sort function. By default value accessor.
* primaryKeyAccessor : (for object properties only) Function (or function accessor) that returns the value of the object primary key.
* setForeignKeyAccessor : (for object properties only) Function (or function accessor) that set the value of the object primary key to the foreign key. When an object property loaded from a foreign key is updatable, you must change this foreign key in case of update.
##### Format
Formatting function that returns a formatted string or a JSX element. Parameters :(value, row, column, params, status, data).
##### Sort function 
Custom sort function. Parameters :(sortAccesor(rowA),sortAccesor(rowB)). 
##### Filter type
Filtering method used for the column.
* starts : value.startsWith(filterValue) 
* startsNoCase : value.toUpperCase().startsWith(filterValue.toUpperCase()) 
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
If you pass an updatedRows prop as an empty object, it will mutate at each update in the table. Validation functions should update the error property (updatedRows.errors) if needed. In consequence, the component calling the table component can know at any time all the changes since the loading (or refresh) of data.
exported functions to manage errors log.
* manageRowError (updatedRows, index, object, type, error): log or remove an error in the row status object.
* getRowErrors (status, rowIndex): return an array with logged errors of the specified row (absolute index).
* getErrors :return an array with all the errors logged for the dataset.

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
If you don't want to load the full dataset on the client, you can use a pagination manager (defined in the meta.table.select key) and let the server manage it. The pagination manager is a function called by the client on load and scroll actions with the first and last index of the diplayed rows.
It must returns (as a promise) a page of rows including those two rows, the first index in the page, the number or rows in the dataset and the number of filtered rows.
As only current page is known by the client, global functions as sorting and filtering must be managed by the server. With an editable grid, updates may have impacts on sorting and filtering. You may want to take into account those changes before commit.
Filters and sorting informations plus updated rows are passed as arguments of the function({  startIndex, stopIndex, filters, sorts, params,updatedRows}).
You can find an example in src/demo/datasource.
### Actual restrictions
* Filters with existing values is not implemented yet, values must be given by the server.
* Computed columns with aggregation are not available.
## Saving updated data
### Steps
* Complete validations (onCellQuit, onRowQuit)
* props.onSaveBefore function execution,
* errorHandler.onSave function execution,
* props.onSave function execution,
* this.onSaveAfter function execution,
N.B. props.onSave is called with this.onSaveAfter as a callback. If the onSave is executed asynchronously (server update), the props.onSave should return undefined and the callback called with the updated message when the execution is completed, else mutate the message and return true or false.
The message can be completed with an error message (message.error).
### Requiring save with confirmation
You may need to save the update before an action called from outside of the component (exit, reload...). In this case, you can pass as a property (saveConfirmationRequired) the function to callback after the saving. If any update has occured, a confirmation modal (Yes, No, Cancel) will be popped up.
* On Yes, updated data will be saved and, if no errors occurs during the process, the callback will be executed with parameter = true.
* On no (or if no update), updates are rolledback and the callback will be executed with parameter = true.
* On Cancel the callback will be executed with parameter = false.
## Error management
By default, errors are not blocking but logged in the "updatedRows" property. 
Validator functions should be used to log those errors.
### Error handler
You can manage errors in your own way with the "errorHandler" property.
It is an object containing for each level of error management a function to execute when an error occurs.
Returning a string from the errorHandler function will be interpreted as an error message an popped up in an alert.
Returning false (or a string) from the errorHandler function will stop the action.
### Error management levels
* onChange (cell)
* onCellQuit (cell)
* onRowQuit (row)
* onTableQuit (table)
N.B. If an error occurs during the "save" process, you can add an "error" entry in the callback message with the error message that will be popped up as well.
## Working with a Redux store
When using a store, you can create a container mapping the actions to the meta description in the mergeProps function as in the following example:
```js
import { connect } from "react-redux";
import { select, save } from "../actions";
import { ZebulonTable } from "zebulon-table";

const mapStateToProps = (state, ownProps) => {
  const getMeta = (select, save) => ({
    table: {
      object: "dataset",
      select: select,
      onSave: save,
      // ...
      actions: [
        {
          type: "save",
          caption: "Save",
          enable: true
        }
        // ...
      ]
    },
    row: {},
    properties: [
      // ...
    ]
  });
  return {
    getMeta,
    sizes: { height: 300, width: 800 },
    ...ownProps
  };
};
const mapDispatchToProps = (dispatch, ownProps) => ({
  save: message => {
    dispatch(save(message));
  },
  select: message => {
    dispatch(select(message));
  }
});
const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { getMeta, ...restStateProps } = stateProps;
  const { select, save, ...restDispatchProps } = dispatchProps;
  return {
    meta: getMeta(select, save),
    ...restStateProps,
    ...restDispatchProps,
    ...ownProps
  };
};
export const MyDatasetContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(ZebulonTable);
```
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
You can overwrite the navigationKeyHandler functions setting your custom function in the navigationKeyHandler prop (see src/demo/navigation.handler.js).
## Custom contextual menu
It's possible to add custom contextual menu on
* row headers,
* columns headers,
* top left corner
```js
{
  "row-header-menu": [
    {
      code: "toto1",
      caption: "Toto1",
      type: "MenuItem",
      function: e => console.log("toto1")
    },
    ...
  ],
  "column-header-menu": [
    {
      code: "totoa",
      caption: "TotoA",
      type: "MenuItem",
      function: e => console.log("toto1")
    },
    ...
  ],
  "top-left-corner-menu": [
    {
      code: "toto1",
      caption: "Toto_1",
      type: "MenuItem",
      function: e => console.log("toto1")
    },
  ...
  ]
};
```
On menu click, function is called with {meta, data, params, row || column}  as argument.
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

