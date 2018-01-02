import React from "react";
import { /*Input,*/ utils } from "zebulon-controls";
import {
	// getFunction,
	computeData,
	buildObject,
	exportFunctions
} from "./utils";
import { Property } from "./Property";

const propertyDetail = (
	row,
	data,
	meta,
	status,
	params,
	top,
	left,
	callbacks
) => {
	return (
		<Property
			row={row}
			data={data}
			meta={meta}
			params={params}
			status={status}
			onChange={callbacks.onChange}
			close={callbacks.close}
			top={top}
		/>
	);
};
const propertyValidator = (row, data, meta, status, params) => {
	console.log("propertyValidator", row, status);
};
const functionToString = row => {
	if (typeof row.functionJS === "function") {
		return String(row.functionJS);
	}
	return row.functionJS;
};
const stringToFunction = (row, status) => {
	let f;
	try {
		eval("f = " + row.functionJS);
		console.log("function", f);
	} catch (e) {
		console.log("function error", e);
		const error = status.errors.functionJS || {};
		error.JS = e.message;
		status.errors.functionJS = error;
		return;
	}
	if (typeof f === "function") {
		row.functionJS = f;
		if (status.errors.functionJS) {
			delete status.errors.functionJS.JS;
		}
		return;
	} else {
		const error = status.errors.functionJS || {};
		error.JS = "function not evaluated";
		status.errors.functionJS = error;
		return;
	}
};
export const functions = {
	properties: {
		accessors: {},
		sorts: {},
		formats: {},
		aggregations: {},
		selects: {},
		validators: {
			row: ({ row, status, data, params }) => {}
		},
		editables: {
			notInitial: ({ row }) => "Initial" !== row.tp
		},
		row: () => {},
		table: () => {},
		actions: {
			exportMeta: ({ meta }) =>
				"meta = " + JSON.stringify(buildObject(meta))
		}
	},
	dataset: {
		selects: {
			titi_lb: ({ row, status, data, params }) => [
				"",
				"titi_a",
				"titi_b",
				"titi_c",
				"titi_d"
			]
		},
		formats: {
			formatAmt: ({ value, row, status, data, params }) => {
				if (
					(value < 3000 && value > 1000) ||
					utils.isNullOrUndefined(value)
				) {
					return value;
				} else if (value >= 3000) {
					return (
						<div
							style={{
								color: "green",
								justifyContent: "space-between",
								display: "flex"
							}}
						>
							<div>↑</div>
							<div>{value}</div>
						</div>
					);
				} else if (value <= 1000) {
					return (
						<div
							style={{
								color: "red",
								justifyContent: "space-between",
								display: "flex"
							}}
						>
							<div>↓</div>
							<div>{value}</div>
						</div>
					);
				}
			}
		},
		actions: {
			computeData
		}
	},
	functions: {
		accessors: {
			functionToString: ({ row }) => functionToString(row),
			functionDescriptor: ({ row, meta }) => {
				let label;

				if (row.tp === "accessor") {
					label = "Parameters: ({row,status,data,params})";
				} else if (row.tp === "editable") {
					label = "Parameters: ({row,status,data,params})";
				} else if (row.tp === "select") {
					label = "Parameters: ({row,status,data,params})";
				} else if (row.tp === "validator") {
					label = "Parameters: ({row,status,data,params})";
				} else if (row.tp === "format") {
					label = "Parameters: ({value,row,status,data,params})";
				} else if (row.tp === "aggregation") {
					label = "Parameters: ([values])";
				} else if (row.tp === "sort") {
					label = "Parameters: (rowA, rowB)";
				} else if (row.tp === "window") {
					label = "Parameters: (value)";
				}
				return `${row.caption || row.id} : ${label}`;
			}
		},
		validators: {
			stringToFunction: ({ row, status }) => stringToFunction(row, status)
		},
		actions: {
			exportFunctions: ({ data }) =>
				"functions = " + exportFunctions(data)
		}
	},
	globals_: {
		editables: { isNotSelected: ({ row }) => row.index_ === undefined }
	}
};

export const metaDescriptions = (object, functions, properties) => {
	const f = functions;

	const getFunctions = (type, obj = object) => {
		return f
			.filter(
				f =>
					f.tp === type &&
					(f.visibility === "global" || f.visibility === obj)
			)
			.reduce(
				(acc, f) => {
					acc[f.id] = { id: f.id, caption: f.caption || f.id };
					return acc;
				},
				{ undefined: "" }
			);
	};
	const getAccessors = obj => () => getFunctions("accessor", obj);
	const getAccessorsAndProperties = obj => () => {
		const accessors = getFunctions("accessor", obj);
		properties.forEach(
			property =>
				(accessors[property.id] = {
					id: property.id,
					caption: property.caption
				})
		);
		return accessors;
	};
	const getAggregations = obj => () => getFunctions("aggregation");
	const getFormats = obj => () => getFunctions("format", obj);
	// const getSorts = obj => () => getFunctions("sort");
	const getWindowFunctions = obj => () => getFunctions("window");
	const getSelects = obj => () => getFunctions("select", obj);
	const getValidators = obj => () => getFunctions("validator");
	// const getEditables = obj => () => getFunctions("editable");
	const getDefaults = obj => () => getFunctions("default", obj);
	// // const availableAccessors = [""].concat(
	// // 	Object.keys(accessors).concat(props.meta.map(column => column.id))
	// // );
	// const fg = functions.globals;
	if (object === "dataset") {
		return {
			table: {
				object,
				editable: true,
				actions: [
					{ type: "insert", caption: "New" },
					{
						type: "delete",
						caption: "Delete",
						disable: "isNotSelected"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						disable: "isNotSelected"
					},
					{
						type: "action",
						caption: "Compute",
						action: "computeData"
					}
				]
			},
			row: {},
			properties: []
		};
	}
	if (object === "properties") {
		return {
			table: {
				object,
				editable: true,
				primaryKey: "id",
				code: "caption",
				actions: [
					{ type: "insert", caption: "New" },
					{
						type: "delete",
						caption: "Delete",
						disable: "isNotSelected"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						disable: "isNotSelected"
					},
					{
						type: "action",
						caption: "Export configuration",
						action: "exportMeta"
					}
				]
			},
			row: {
				validator: "propertyValidator",
				detail: "propertyDetail"
			},
			properties: [
				{
					id: "id",
					caption: "Column",
					width: 100,
					dataType: "string",
					editable: "notInitial",
					mandatory: true
				},
				{
					id: "tp",
					caption: "Type",
					width: 100,
					dataType: "string",
					editable: "notInitial",
					select: ["", "Computed", "Analytic"],
					default: "Computed",
					mandatory: true
				},
				{
					id: "dataType",
					caption: "Data type",
					width: 100,
					dataType: "string",
					editable: true,
					select: ["", "number", "string", "text", "date", "boolean"]
				},
				{
					id: "caption",
					caption: "Caption",
					width: 150,
					dataType: "string",
					editable: true
				},
				{
					id: "editable",
					caption: "Editable",
					width: 100,
					dataType: "boolean",
					editable: true,
					default: true
				},
				{
					id: "mandatory",
					caption: "Mandatory",
					width: 100,
					dataType: "boolean",
					editable: true,
					default: true
				},
				{
					id: "width",
					caption: "Width",
					width: 60,
					dataType: "number",
					editable: true
				},
				{
					id: "format",
					caption: "Format",
					width: 100,
					dataType: "string",
					editable: true,
					select: getFormats("dataset")
				},
				{
					id: "filterType",
					caption: "Filter",
					width: 100,
					dataType: "string",
					editable: true,
					select: ["", "starts", "=", ">=", "<=", "between", "values"]
				},

				// only for new properties
				{
					id: "accessor",
					caption: "Accessor",
					width: 100,
					dataType: "string",
					editable: "notInitial",
					hidden: false,
					select: getAccessors("dataset")
				},
				{
					id: "select",
					caption: "Select",
					width: 100,
					dataType: "string",
					editable: true,
					select: getSelects("dataset")
				},
				{
					id: "default",
					caption: "Default",
					width: 100,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getDefaults("dataset")
				},
				{
					id: "onChange",
					caption: "On change",
					width: 100,
					dataType: "string",
					editable: true,
					select: getValidators("dataset")
				},
				{
					id: "groupByAccessor",
					caption: "Group by accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getAccessorsAndProperties("dataset")
				},
				{
					id: "comparisonAccessor",
					caption: "Comparison accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getAccessorsAndProperties("dataset")
				},
				{
					id: "sortAccessor",
					caption: "Sort accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getAccessorsAndProperties("dataset")
				},
				{
					id: "aggregation",
					caption: "Aggregation",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getAggregations("dataset")
				},
				{
					id: "startFunction",
					caption: "Start function",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getWindowFunctions("dataset")
				},
				{
					id: "endFunction",
					caption: "End function",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getWindowFunctions("dataset")
				}
			]
		};
	} else if (object === "functions") {
		return {
			table: {
				object,
				editable: true,
				primaryKey: "id",
				code: "caption",
				actions: [
					{ type: "insert", caption: "New" },
					{
						type: "delete",
						caption: "Delete",
						disable: "isNotSelected"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						disable: "isNotSelected"
					},
					{
						type: "action",
						caption: "Export functions",
						action: "exportFunctions"
					}
				]
			},
			row: { descriptor: "functionDescriptor" },
			properties: [
				{
					id: "id",
					caption: "Code",
					width: 100,
					dataType: "string",
					editable: true,
					mandatory: true
				},
				{
					id: "caption",
					caption: "Caption",
					width: 150,
					dataType: "string",
					editable: true
				},
				{
					id: "visibility",
					caption: "Visibility",
					width: 150,
					dataType: "string",
					editable: true,
					select: [
						"",
						"dataset",
						"properties",
						"functions",
						"global"
					],
					mandatory: true,
					default: "global"
				},
				{
					id: "tp",
					caption: "Type",
					width: 150,
					dataType: "string",
					editable: true,
					select: [
						"",
						"accessor",
						"aggregation",
						"format",
						"sort",
						"window",
						"select",
						"validator",
						"editable",
						"default"
					]
				},
				{
					id: "functionJS",
					caption: "Function",
					accessor: "functionToString",
					onQuit: "stringToFunction",
					width: 500,
					dataType: "text",
					editable: true
				}
			]
		};
	} else if (object === "measures" || object === "dimensions") {
		return {
			table: {
				object,
				editable: true,
				primaryKey: "id",
				code: "caption",
				actions: [
					{ type: "insert", caption: "New" },
					{
						type: "delete",
						caption: "Delete",
						disable: "isNotSelected"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						disable: "isNotSelected"
					}
				]
			},
			row: {},
			properties: []
		};
	}
};
