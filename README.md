# Zebulon table
Zebulon table is a hight performance fully virtualized React editable table component.
## Available demo at: http://polluxparis.github.io/zebulon-table/
Please, look at the demo using Chrome as it's not yet fully compatible with other browsers.
#### Help and suggestions would be welcome.
## Main features
#### User experience
* [Key navigation.](#key-events-and-navigation-key-handler)
* [Copy, paste, search.](#key-events-and-navigation-key-handler)
* [Sorting, filtering.](#filtering-and-sorting)
* Formats.
* [Foreign key management.](#object-properties-and-foreign-keys)
* Column locks.
* [User interactions.](#validation-and-saving-process)
#### Server communication
* Rich server communication.
* [Validations.](#validation-and-saving-process)
* [Conflicts resolution.](#validation-and-saving-process)
* [Subscription to server events.](#subscription-to-server-events)
#### Miscellaneous
* [Custom contextual menus.](#custom-contextual-menu)
* [Self description.](#self-description)
* [Computed columns.](#computed-columns)
* [Audit.](#audit)
## Associated projects
zebulon-table has been developped originally to manage the description data of a business intelligence application based on a pivot grid component called zebulon-grid :
https//github.com/polluxparis/zebulon-grid
It shares some base functions and components, such as a virtualized scrollable area/grid, contextual menus...  available in zebulon-controls
https//github.com/polluxparis/zebulon-controls
## Table of contents
* [Getting started.](#getting-started)
* [Zebulon table props.](#zebulon-table-props)
* [Data set.](#data-set)
* [Foreign keys.](#object-properties-and-foreign-keys)
* [Available functions and callbacks.](#available-functions-and-callbacks)
* [Meta description.](#meta-description)
* [Validation and saving process](#validation-and-saving-process)
* [Working with a redux store.](#working-with-a-redux-store)
* [Compatibility.](#compatibility)

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
| [errorHandler](#error-handler) | object | Custom error and user interractions management|
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
| [onSaveBefore](#available-functions-and-callbacks) | table event callback | Checks before save|
| [onSave](#available-functions-and-callbacks) | table event callback | Save updated data|
| [onSaveAfter](#available-functions-and-callbacks) | table event callback | Post treatment after save|
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
N.B. By default, if you pass an array as the data prop (from a store by example), changes made in the component will be applied directly on the data array. If you want to avoid mutations, you can change this behavior by setting [meta.table.noDataMutation](#table) : true. In this case you may need an onSaveAfter function that will apply the changes,after saving, to the store.
* a promise (from the server) that will be resolved as an array of objects.
* an observable (from the server) that will push, by page, arrays of objects (the full dataset will be loaded in background).
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
### Using accessors
An accessor is a descriptor(string) used to retrieve a function that returns data or execute different actions.
#### data accessors (on properties)
* The default accessor function is ({row})=>row[property.id].
* You can refer to an other property value :"row.<referenced property id>", eg row.quantity. N.B. "row." is mandatory in this case to make the distinction with function accessors. Accessor function is ({row})=>row[referenced property.id] 
* You can refer to a key of an object stored in a property :row.<referenced object>.<key>, eg row.product.price. Accessor function is ({row})=>row[referenced property.id].[key]
* You can refer to a function accessor.
#### function accessors
Functions can be defined directly in the meta description or referenced by accessors: 
```js
f =typeof meta...x===function
  ? meta...x
  : functions[object][function type][meta...x]
```
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
    noDataMutation:false, // avoid the mutation of the dataset array prop. default false
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
It's possible to define action buttons, displayed after the grid in the action property.
```js
 actions:[{
          type: "select",
          id: "submit",
          caption: "Submit",
          enable: "is_selected",
          hidden: false,
          action: "myAction",
          onTableChange: "submit", // save requirement before action
          doubleClick: true,
          key:"f2"
        },
        ...]
```   
types:
* insert: insert a new row
* duplicate: create a new row as selected one
* delete: delete selected row
* save: save changes
* action: execute the action (defined in the action property)     
### row
```js
row:{
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
properties:[{
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
}]
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
* contains
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
### Object properties and foreign keys
A row entry can be an object (dataType="object"). 
properties of the object can be referenced in accessors as row.[object property id].[key] (e.g row.currency.symbol). 
It can be retrieved, on the client side when the dataset is loaded, from a joined object (dataType="joined object", select = [object accessor], accessor = [foreign key]).
The foreign key is used to retrieve the object instance in the "select" object.
If a property referencing the object is defined as editable, it will be displayed as a select input using the "select" object as the item list.  
Usually accessors are evaluated only when the component renders, except for "joined object": the referenced object is stored initialy in the dataset and then, it's properties can be referenced by the other columns.
N.B. The primary key in the "select" object must be used for object keys and referenced in the sub-object with key "pk_".
Demo:
products, currencies and countries are joined objects
```js
currencies={
  1:{pk_:1,cd:"EUR", label:"Euro"},
  2:{pk_:2,cd:"USD", label:"US dollar"},
  ...
};
...
    { // foreign key
      id: "currency_id",
      width: 0,
      dataType: "number",
      hidden: true
    },
    { // object
      id: "currency",
      caption: "Currency",
      width: 0,
      dataType: "joined object",
      mandatory: true,
      hidden: true,
      accessor: "row.currency_id",
      select: "currencies"
    },
    {
      id: "currency_cd",
      caption: "Currency",
      width: 100,
      dataType: "string",
      accessor: "row.currency.cd",
      filterType: "values",
      editable: true, // if editable, the column will be displayed as a select input
      select: currencies
    }
```
A zebulon table class can be used to manage foreign objects.
On cellQuit of the column referncing a foreign object, the component will be loaded. 
If no row match the filter (starts with the value entered in the column not case sensitive), the quit action will be canceled, if only 1 row match, the row will be set in the object referenced in the accessor of th column, and the action will be resumed, else the component will be displayed filtered as a modal dialog to select the appropriate row.
Demo:
MyThirdparties class is used to manage thirdparties
```js
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
      foreignObject: MyThirdparties
    },
```
N.B.
You may want to use a "joined object" for limited items lists (eg currencies), in this case, it may be loaded on the client as an object of objects 
{
  [primary key 1]:{pk_:[primary key 1],code:...},
  [primary key 2]:{pk_:[primary key 2],code:...}},
  ...
} and referenced in the select accessor. Only the primary is needed in the original dataset and must be referenced in the object accessor.
For more important foreign object (eg thirdparties), it is not loaded on the client but required from the server when needed. The referenced object should be loaded in the original dataset.

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
* manageRowError: (updatedRows, index, object, type, error): log or remove an error in the row status object.
* getRowErrors: (status, rowIndex): returns an array with logged errors of the specified row (absolute index).
* getErrors: returns an array with all the errors logged for the dataset.

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
### Actual restrictions with pagination manager
* Filters with existing values is not implemented yet, values must be given by the server.
* Computed columns with aggregation are not available.
## Validation and saving process
### Validations, error handling and saving
Each validation step will be executed in two phases:
* A validation function:
###
Called with a "message" as parameter to detect errors and conflicts. Errors and conflicts must be written, mutating the object, in the errors, conflicts entries of the message. Returning false will cancel the action and the second phase won't be executed. For validation functions that may be executed asynchronously (onSaveBefore, onSave, onSaveAfter), a callback is added as a second parameter that must be executed, if the process is asynchronous, with true (if succeed or handling errors is required) or false as parameter.
* An "errorHandler" function:
###
Manage the interactions with the user.
If no errors or conflicts are found in the message, the error handler will return true and the action will be resumed. Else the function defined in the errorHandler prop is then called with the message. 
This prop function must build the element to display (as a string, an array of string or a JSX element) and to characterize the errors as blocking or subject to validation.
For a blocking error, the error handler must return false and  a modal dialog will be displayed with an Ok button. The initial action is cancelled.
###
Demo:
In the demo, the error handler has been defined to consider any error on save as blocking errors.

For an alert, the error handler must return true. A modal dialog will be displayed with Yes and No buttons. The initial action is cancelled on No and resumed on Yes.
###
Demo:
In the demo, the error handler has been defined to consider errors on row quit as an alert.

For conflicts, typically when same data has changed on the server and in the component, a "conflicts resolution" modal will be opened, (with an other instance  of the component) to choose the versions that must be kept.
###
Demo:
 In the demo, you can test the "conflicts resolution" modal by subscribing to server changes:
* update one or several rows (in the 10th first ordered by order#)
* click on the "subscription to server events" button. That will update the 10th first rows.
* click on the save button.
* check the row versions to keep.

#### Cell level
* onChange
###
The component checks the data type of the changed value, then call the function in the onChange prop (or defined in the meta description).
* onCellQuit
###
If the cell has been updated and corresponds to a link with a foreign key on an other component (meta.property[*].foreignObject), the value is searched in the "foreign object". If no row match the value, the action is cancelled, if only one row match, the value is updated and the action continues else the component is opened, filtered by the value, to select the relevant row. 
Then the onCellQuit prop function (or defined in the meta description) is called.
###
Demo:
The Thirdparty column is defined as a linked to a foreign object: MyThirdparties.
#### Row level
* onRowQuit
###
If the row has been updated, the mandatory columns and the unicity of the primary key are checked. Errors are stored in the "message".
Then the onRowQuit prop function (or defined in the meta description) is called.
###
N.B. The unicity of the primary key is checked only on data loaded on the client. It should be done on the server side during the saving process. 
#### Dataset level (saving process)
When the updated data must be saves, cell validations and row validations are executed first.
All these functions can be executed asynchronously.
* onSaveBefore: Execute the onSaveBefore prop function (or defined in the meta description).
* onSave: Execute the onSave prop function (or defined in the meta description).
* onSaveAfter: Execute the onSaveAfter prop function (or defined in the meta description).
#### Table level
Actions has refresh, filter ... may require to save data before.
* onTableChange
###
If data have been updated, a confirmation modal with Yes, No and Cancel buttons is displayed. On Yes the whole saving process is executed and the action is resumed (if no intermediate cancellation occurs), on No, all updates are rolledback and action is resumed, On Cancel, the process stops. 
* saveConfirmationRequired prop
###
You may need to save the update before an action called from outside of the component (exit, reload...). In this case, you can pass as a prop (saveConfirmationRequired) the function to callback after the saving.
It will fired the onTableChange event and return the callback in case of success. 
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
You can create any computed columns using an accessor, as the result of a function using the global parameters and the row data.
Those columns are dinamically refreshed on every changes impacting the value ( on cell quit).
You can also create computed columns calculated by a functions as an aggregation operation on a subset of the dataset: typically a rolling average.
For that you'll have to define 
* a "window" function accessor with an order: previous 100 order by date.
* an aggregation operation accessor : average
* a group by accessor: product
```js
{
  properties:{
    ...
    rollingAvg:{
      ...
      aggregation: "avg",
      groupByAccessor: "country.id",
      accessor: "amt_€",
      comparisonAccessor: "row.d",
      sortAccessor: "row.d",
      windowStart: "since30d",
      windowEnd: x => x
    }
  }
}
```
Those columns are computed on data refresh or on demand.
Demo: 
* rolling average of amounts in € order by date since 30 days
* sum of amounts in € by country
## Audit
If your backend is able to produce the successive versions of a data row, either as a set of similar data rows, either as a set of objects only with changed values,
```js
[
  {
    user_:"toto",
    time_:Fri Apr 06 2018 10:46:36,
    price: 123 // previous value (before saved) 
  }
]
```
you can add a function (or a function accessor) in the meta description;
```js
{
  table:{...}
  row:{
    audit:getAudit,
    ...}
  properties:{...}
}
```
It will add an audit entry in the status cell contextual menu (right click on the left cell of the row) that will display the succesive states of the row.
## Self description
It's easy to use the new instances of the component to describe the dataset you are working on.
###
In the demo, in the "Manage configuration" tab, you are able to :
* update the original dataset,
* add computed properties
* modify formats, filters, sizes...
* create new JS functions used as accessor for new properties...
###
Please follow the tutorial to reproduce the dataset as it's displayed in the first tab.
ZebulonTableAndConfiguration is a component you can use to manage configurations. It's a 3 tabs window:
* dataset,
* properties,
* functions,
###
It changes dinamically the restitution following your own description. 
You may add new tabs if needed: see zebulon Grid demo at http://polluxparis.github.io/zebulon-grid/ ("Configuration" checked) to define measures and dimensions on a pivot grid.
## Key events and navigation key handler
To manage correctly key events, specialy with several instances of the component, you can pass from an upper component the event as a prop. Only active component,considering the isActive prop will handle the event.
Key events are used to navigate in the the grid, select a range of cells, zoom, copy or paste.
The actual behaviour is 
* ctrl c, ctrl v for copy paste,
* ctrl -, ctrl +  for zoom in, zoom out,
* ctrl f for search in the table,

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
For an editable grid left and righ arrow must keep the default behavior in the editable cells. The alt key is used to force the navigation behavior.
###
You can overwrite the navigationKeyHandler functions setting your custom function in the navigationKeyHandler prop (see src/demo/navigation.handler.js).
## Custom contextual menu
It's possible to add custom contextual menu on
* row headers,
* columns headers,
* top left corner
* cells
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
      code: "toto1",
      caption: "Toto1",
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
  ],
  "cell-menu": [
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
The params prop object is used to propagate global data.
It can contains user data in specific keys to manage privileges:
* user_
* privileges_
* filter_
You can add restriction at the row level by adding a filter,  at the column level overwriting the visibility and editability (editable, visible, hidden or an accessor for an editable function)  or at the action level (enable, disable, hidden or or an accessor for an editable function).
```js
params={
        user_: "Zébulon",
        privileges_: {
          dataset: { 
            table: "editable",
            actions: { New: "hidden", Duplicate: "hidden", Delete: "hidden" },
            properties: {
              thirdparty_cd: "hidden",
              qty: "visible",
              color: "visible",
              currency: "visible",
              d: "visible",
              product_lb: "visible",
              country_cd: "visible",
              id: "editable"
            }
          }
        },
        filter_: [
          {
            filterType: "values",
            id: "country_id",
            v: { 2: 2 }
          }
        ]
      };
```
## Details and drilldown
Not yet documented
## To do
* Complete documentation.
* Computed columns with aggregation functions improvement. 
* Styles and design improvement.
* Replacement of input select and icons
* Loading from observable improvement.
* Pagination manager improvement.
* Details improvement.
* Parameterisation of "actions".
* Grouped columns.
*...

