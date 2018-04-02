import React from "react";
import { utils } from "zebulon-controls";
import {
	buildObject,
	exportFunctions
	// aggregations
} from "./utils/utils";
// import { Property } from "./Property";
// ({row})=>accessor('qty')({row})*3
const functionToString = ({ row }) => {
	if (typeof row.functionJS === "function") {
		return String(row.functionJS);
	}
	return row.functionJS;
};
const stringToFunction = ({ row, status, meta }) => {
	let f;
	try {
		eval("f = " + row.functionJS);
	} catch (e) {
		const error = status.errors.functionJS || {};
		error.JS = e.message;
		status.errors.functionJS = error;
	}
	if (typeof f === "function") {
		row.functionJS = f;
		if (status.errors.functionJS) {
			delete status.errors.functionJS.JS;
		}
	} else {
		const error = status.errors.functionJS || {};
		error.JS = "function not evaluated";
		status.errors.functionJS = error;
	}
	return true;
};
export const onNext = (data, message) => {
	// console.log("onNext", data);
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
export const accessor = accessor => {
	return () => 4;
};
export const functions = {
	properties: {
		accessors: {
			propertyType: ({ row }) => {
				if (row.tp) {
					return row.tp;
				} else if (row.foreignObject) {
					return typeof row.foreignObject === "string"
						? row.foreignObject
						: row.foreignObject.name;
				} else if (
					row.primaryKeyAccessor &&
					row.setForeignKeyAccessor
				) {
					if (!row.reference) {
						return "Joined object";
					} else {
						return `${row.reference} key`;
					}
				} else if (row.aggregation) {
					return "Analytic";
				} else if (row.accessor) {
					return "Computed";
				} else {
					return "Dataset";
				}
			}
		},
		sorts: {},
		formats: {
			isArrayOrFunction: ({ value }) => {
				if (typeof value === "function" || Array.isArray(value)) {
					return (
						<div
							style={{
								backgroundColor: "#f5f7da",
								fontStyle: "italic"
							}}
						>
							{Array.isArray(value) ? "array[]" : "fct()"}
						</div>
					);
				}
				return value;
			}
		},
		aggregations: {},
		selects: {},
		validators: {
			row: ({ row, status, data, params }) => {}
		},
		editables: {
			isDataset: ({ row }) => row.tp === "Dataset",
			isNotDataset: ({ row }) => row.tp !== "Dataset",
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
			stringToFunction
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
			percentage: ({ value, column }) =>
				`${utils.formatValue(
					value * 100,
					null,
					column.decimals || 2
				)}%`,
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

export const setPropertyAccessors = (properties, data) => {
	const accessors = {};
	properties.forEach(property => {
		accessors[property.id] = {
			id: `row.${property.id}`,
			caption: `row.${property.id}`,
			type: "property"
		};
		if (
			data &&
			(property.dataType === "object" ||
				property.dataType === "joined object")
		) {
			data.forEach(row => {
				if (!utils.isNullValue(row[property.id])) {
					Object.keys(row[property.id]).forEach(key => {
						accessors[property.id + "." + key] = {
							id: `row.${property.id}.${key}`,
							caption: `row.${property.id}.${key}`,
							type: "object property"
						};
					});
				}
			});
		}
	});
	propertyAccessors = accessors;
};
let propertyAccessors = {};

export const metaDescriptions = (
	object,
	callbacks = {},
	functions
	// ,
	// properties,
	// data_
) => {
	const f = functions;
	const getFunctions = (type, obj = object) => {
		return f
			.filter(
				f =>
					f.tp === type &&
					(f.visibility === "global" || f.visibility === obj)
			)
			.reduce((acc, f) => {
				acc[f.id] = {
					id: f.id,
					caption: f.caption || f.id,
					type: "function",
					style: { color: "blue" }
				};
				return acc;
			}, {});
	};
	const getAccessorsAndProperties = obj => () => {
		const dataAccessors = propertyAccessors;
		const accessors = getFunctions("accessor", obj);
		console.log("getAccessorsAndProperties", accessors, dataAccessors);
		return {
			...dataAccessors,
			...accessors
		};
	};
	const getAggregations = obj => () => getFunctions("aggregation", obj);
	const getFormats = obj => () => getFunctions("format", obj);
	const getSorts = obj => () => getFunctions("sort", obj);
	const getWindowFunctions = obj => () => getFunctions("window", obj);
	const getSelects = obj => () => getFunctions("select", obj);
	const getValidators = obj => () => getFunctions("validator", obj);
	const getEditables = obj => () => getFunctions("editable", obj);
	const getDefaults = obj => () => getFunctions("default", obj);
	const getForeignObjects = obj => () => getFunctions("foreignObject", obj);
	if (object === "dataset") {
		return {
			table: {
				object: "dataset",
				editable: true,
				noFilter: false,
				// caption: "Dataset",
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
						type: "save",
						caption: "Save",
						enable: true
					},
					{
						type: "refresh",
						caption: "Refresh",
						enable: true
					}
				]
			},
			row: {},
			properties: []
		};
	} else if (object === "properties") {
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
						enable: "isNotDataset"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						enable: "is_selected"
					}
					// ,
					// {
					// 	type: "detail",
					// 	caption: "Analytic",
					// 	enable: "isAnalytic",
					// 	content: Property
					// }
					// {
					// 	type: "action",
					// 	caption: "Apply",
					// 	action: callbacks.applyMeta,
					// 	enable: true
					// }
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
					editable: "isNotDataset",
					mandatory: true,
					locked: true
				},
				{
					id: "tp",
					caption: "Type",
					width: 150,
					dataType: "string",
					editable: false,
					default: "Computed",
					// mandatory: true,
					accessor: "propertyType",
					filterType: "values"
				},
				{
					id: "dataType",
					caption: "Data type",
					width: 100,
					dataType: "isNotDataset",
					editable: true,
					filterType: "values",
					select: [
						"number",
						"string",
						"text",
						"date",
						"boolean",
						"object",
						"joined object"
					]
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
					editable: true,
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
					default: false
				},
				{
					id: "width",
					caption: "Width",
					width: 60,
					dataType: "number",
					editable: true,
					default: 100
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
					select: [
						"starts",
						"starts (case sensitive)",
						"=",
						">=",
						"<=",
						"between",
						"values"
					]
				},

				// only for new properties
				{
					id: "accessor",
					caption: "Accessor",
					width: 150,
					dataType: "string",
					editable: "isNotDataset",
					hidden: false,
					filterType: "values",
					select: getAccessorsAndProperties("dataset"),
					format: "isArrayOrFunction"
				},
				{
					id: "select",
					caption: "Select",
					width: 100,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getSelects("dataset"),
					format: "isArrayOrFunction"
				},
				{
					id: "default",
					caption: "Default",
					width: 100,
					dataType: "string",
					editable: true,
					// hidden: true,
					filterType: "values",
					select: getDefaults("dataset")
				},
				{
					id: "foreignObject",
					caption: "Foreign object",
					width: 150,
					dataType: "string",
					editable: true,
					// hidden: true,
					// filterType: "values",
					select: getForeignObjects("dataset"),
					format: "isArrayOrFunction"
				},
				{
					id: "onChange",
					caption: "On change",
					width: 100,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getValidators("dataset"),
					format: "isArrayOrFunction"
				},
				{
					id: "onCellQuit",
					caption: "On cell quit",
					width: 100,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getValidators("dataset"),
					format: "isArrayOrFunction"
				},
				{
					id: "groupByAccessor",
					caption: "Group by accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getAccessorsAndProperties("dataset"),
					format: "isArrayOrFunction"
				},
				{
					id: "sortAccessor",
					caption: "Sort accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getAccessorsAndProperties("dataset"),
					format: "isArrayOrFunction"
				},
				{
					id: "aggregation",
					caption: "Aggregation",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getAggregations("dataset"),
					format: "isArrayOrFunction"
				},
				{
					id: "comparisonAccessor",
					caption: "Comparison accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getAccessorsAndProperties("dataset"),
					format: "isArrayOrFunction"
				},
				{
					id: "startFunction",
					caption: "Start function",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getWindowFunctions("dataset"),
					format: "isArrayOrFunction"
				},
				{
					id: "endFunction",
					caption: "End function",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					filterType: "values",
					select: getWindowFunctions("dataset"),
					format: "isArrayOrFunction"
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
						caption: "Export functions",
						action: "exportFunctions",
						hidden: true
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
					mandatory: true,
					locked: true
				},
				{
					id: "caption",
					caption: "Caption",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "between"
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
						"action",
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
