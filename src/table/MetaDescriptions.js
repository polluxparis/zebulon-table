// import React from "react";
import { utils } from "zebulon-controls";
import {
	getRowStatus,
	buildObject,
	exportFunctions
	// aggregations
} from "./utils/utils";
import { Property } from "./Property";

// const set = () => {};
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
	} catch (e) {
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
export const onNext = (data, message) => {
	console.log("onNext", data);
	data.forEach(row => {
		if (message.indexPk) {
			const index = message.indexPk[row[message.meta.table.primaryKey]];
			if (index !== undefined) {
				row.index_ = index;
				const status = message.updatedRows[index];
				if (status) {
					status.row = { ...row };
					if (status.updated_ || status.deleted_) {
						status.conflict_ = true;
						message.updatedRows.nConflicts =
							(message.updatedRows.nConflicts || 0) + 1;
					} else {
						message.data[index] = row;
						status.rowUpdated = row;
					}
				} else {
					message.data[index] = row;
				}
			} else {
				message.indexPk[row[message.meta.table.primaryKey]] =
					message.data.length;
				message.data.push(row);
			}
		} else {
			message.data.push(row);
		}
	});
};
export const onCompleted = message => {};
export const onError = (e, message) => {};

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
			isInitial: ({ row }) => row.tp === "Initial",
			isNotInitial: ({ row }) => row.tp !== "Initial",
			isAnalytic: ({ row }) => row.tp === "Analytic"
		},
		row: () => {},
		table: () => {},
		actions: {
			exportMeta: ({ meta }) =>
				"meta = " + JSON.stringify(buildObject(meta))
		}
	},
	functions: {
		accessors: {
			functionToString,
			functionDescriptor: row => {
				let label;
				if (row.tp === "accessor") {
					label = "Parameters: (row,params,status,data)";
				} else if (row.tp === "editable") {
					label = "Parameters: ({row,status,data,params})";
				} else if (row.tp === "select") {
					label = "Parameters: ({row,status,data,params})";
				} else if (row.tp === "validator") {
					label = "Parameters: ({row,status,data,params})";
				} else if (row.tp === "format") {
					label = "Parameters: (value,params,row,status,data)";
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
	dimensions: {
		accessors: {
			sortAcc: row => (row.sort || {}).keyAccessor,
			sortFct: row => (row.sort || {}).custom
		},
		validators: {
			sortAcc: ({ row }) =>
				(row.sort = {
					...(row.sort || {}),
					keyAccessor: row.sortAccessor
				}),
			sortFct: ({ row }) =>
				(row.sort = {
					...(row.sort || {}),
					custom: row.sortFunction
				})
		}
	},
	globals_: {
		editables: {
			is_selected: ({ row }) => row.index_ !== undefined,
			is_new: ({ status }) => status.new_
		},
		formats: {
			decimals: ({ value, column }) =>
				utils.formatValue(value, null, column.decimals || 2),
			"mm/yyyy": ({ value }) =>
				utils.isNullOrUndefined(value)
					? ""
					: utils.formatValue(value, "mm/yyyy"),
			time: ({ value }) =>
				utils.isNullOrUndefined(value)
					? ""
					: utils.formatValue(value, "hh:mi:ss"),
			dateTime: ({ value }) =>
				utils.isNullOrUndefined(value)
					? ""
					: utils.formatValue(value, "dd/mm/yyyy hh:mi:ss")
		},
		accessors: {
			mth: ({ row }) => {
				if (utils.isNullOrUndefined(row.d)) {
					return null;
				}
				const d = new Date(row.d);
				d.setDate(1);
				return d;
			}
		},
		observers: {
			onNext,
			onCompleted,
			onError
		}
	}
};

export const metaDescriptions = (
	object,
	callbacks = {},
	functions,
	properties
) => {
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
	const getAggregations = obj => () => getFunctions("aggregation", obj);
	const getFormats = obj => () => getFunctions("format", obj);
	const getSorts = obj => () => getFunctions("sort", obj);
	const getWindowFunctions = obj => () => getFunctions("window", obj);
	const getSelects = obj => () => getFunctions("select", obj);
	const getValidators = obj => () => getFunctions("validator", obj);
	const getEditables = obj => () => getFunctions("editable", obj);
	const getDefaults = obj => () => getFunctions("default", obj);
	if (object === "properties") {
		return {
			table: {
				object,
				editable: true,
				primaryKey: "id",
				code: "caption",
				actions: [
					{ type: "insert", caption: "New", enable: true },
					{
						type: "delete",
						caption: "Delete",
						enable: "isNotInitial"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						enable: "is_selected"
					},
					{
						type: "detail",
						caption: "Analytic",
						enable: "isAnalytic",
						content: Property
					},
					{
						type: "action",
						caption: "Apply",
						action: callbacks.applyMeta,
						enable: true
					}
					// ,
					// {
					// 	type: "action",
					// 	caption: "Export configuration",
					// 	action: "exportMeta",
					// 	enable: true
					// }
				]
			},
			row: {
				// validator: "propertyValidator",
				// detail: "propertyDetail"
			},
			properties: [
				{
					id: "id",
					caption: "Column",
					width: 100,
					dataType: "string",
					editable: "isNotInitial",
					mandatory: true
				},
				{
					id: "tp",
					caption: "Type",
					width: 100,
					dataType: "string",
					editable: "isNotInitial",
					select: ["", "Computed", "Analytic"],
					default: "Computed",
					mandatory: true
				},
				{
					id: "dataType",
					caption: "Data type",
					width: 100,
					dataType: "isNotInitial",
					editable: true,
					filterType: "values",
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
					width: 80,
					dataType: "boolean",
					editable: "isInitial",
					default: false
				},
				{
					id: "mandatory",
					caption: "Mandatory",
					width: 90,
					dataType: "boolean",
					editable: true,
					default: true
				},
				{
					id: "hidden",
					caption: "Hidden",
					width: 80,
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
					filterType: "values",
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
					editable: "isNotInitial",
					hidden: false,
					filterType: "values",
					select: getAccessors("dataset")
				},
				{
					id: "select",
					caption: "Select",
					width: 100,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getSelects("dataset")
				},
				{
					id: "default",
					caption: "Default",
					width: 100,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getDefaults("dataset")
				},
				{
					id: "onChange",
					caption: "On change",
					width: 100,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getValidators("dataset")
				},
				{
					id: "groupByAccessor",
					caption: "Group by accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getAccessorsAndProperties("dataset")
				},
				{
					id: "sortAccessor",
					caption: "Sort accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getAccessorsAndProperties("dataset")
				},
				{
					id: "aggregation",
					caption: "Aggregation",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getAggregations("dataset")
				},
				{
					id: "comparisonAccessor",
					caption: "Comparison accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getAccessorsAndProperties("dataset")
				},
				{
					id: "startFunction",
					caption: "Start function",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getWindowFunctions("dataset")
				},
				{
					id: "endFunction",
					caption: "End function",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
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
						enable: "is_selected"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						enable: "is_selected"
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
					filterType: "values",
					mandatory: true,
					default: "global"
				},
				{
					id: "tp",
					caption: "Type",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "values",
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
						"default",
						"descriptor",
						"dml"
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
	} else if (object === "measures") {
		return {
			table: {
				object: "measures",
				editable: true,
				primaryKey: "id",
				code: "caption",
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
					{
						type: "action",
						caption: "Apply",
						action: callbacks.applyMeasures,
						enable: true
					}
				]
			},
			row: {},
			properties: [
				{
					id: "id",
					caption: "id",
					width: 100,
					dataType: "string",
					editable: true,
					mandatory: true
				},
				{
					id: "caption",
					caption: "caption",
					width: 150,
					dataType: "string",
					editable: true
				},
				{
					id: "valueAccessor",
					caption: "Value accessor",
					width: 150,
					dataType: "string",
					editable: true,
					mandatory: true,
					filterType: "values",
					select: getAccessorsAndProperties("dataset")
				},
				{
					id: "format",
					caption: "format",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getFormats("dataset")
				},
				{
					id: "aggregation",
					caption: "aggregation",
					width: 150,
					dataType: "string",
					editable: true,
					mandatory: true,
					default: "sum",
					filterType: "values",
					select: getAggregations("dataset")
				}
			]
		};
	} else if (object === "dimensions") {
		return {
			table: {
				object,
				editable: true,
				primaryKey: "id",
				code: "caption",
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
					{
						type: "action",
						caption: "Apply",
						action: callbacks.applyDimensions,
						enable: true
					}
				]
			},
			row: {},
			properties: [
				{
					id: "id",
					caption: "Dimension",
					width: 100,
					dataType: "string",
					editable: true
				},
				{
					id: "caption",
					caption: "Caption",
					width: 150,
					dataType: "string",
					editable: true
				},
				{
					id: "keyAccessor",
					caption: "Key accessor",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getAccessorsAndProperties("dataset")
				},
				{
					id: "labelAccessor",
					caption: "Label accessor",
					width: 150,
					dataType: "string",
					editable: true,
					select: getAccessorsAndProperties("dataset")
				},
				{
					id: "sort",
					caption: "sort",
					width: 100,
					dataType: "object",
					hidden: true,
					editable: true
				},
				{
					id: "sortAccessor",
					accessor: "sortAcc",
					onQuit: "sortAcc",
					caption: "Sort accessor",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getAccessorsAndProperties("dataset")
				},
				{
					id: "sortFunction",
					accessor: "sortFct",
					onQuit: "sortFct",
					caption: "Sort function",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getSorts("dataset")
				},
				{
					id: "format",
					caption: "format",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getFormats("dataset")
				}
			]
		};
	}
};
