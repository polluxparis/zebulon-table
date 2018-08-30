import React from "react";
import { utils } from "zebulon-controls";
import { buildObject, buildFunctionsObject } from "./utils/utils";
// import { datasetFunctions } from "../demo/dataset.functions";

const stringToFunction = (row, functions) => {
	row.functionJS = functions.evalProtectedFunction(row.functionText);
	return true;
};
export const onNext = (data, message) => {
	const indexedColumn =
		message.meta.table.rowId || message.meta.table.primaryKey;
	data.forEach(row => {
		//  a voir deleted row on server side + conflict (zebulon table) => recreation of the row (new_=true) index_=...
		if (message.index) {
			const index = message.index[row[indexedColumn]];
			if (index !== undefined) {
				row.index_ = index;
				const status = message.updatedRows[index];
				if (status) {
					status.row = row;
				} else {
					message.data[index] = row;
				}
			} else {
				message.index[row[message.meta.table.primaryKey]] =
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
const isLocal = ({ row, status }) => (status || {}).new_ || row.isLocal;
const inherited = (value, inheritedValue, canInherit) => {
	if (
		canInherit &&
		utils.isNullValue(value) &&
		!utils.isNullValue(inheritedValue)
	) {
		return <div style={{ color: "blue" }}>{inheritedValue}</div>;
	}
	return value;
};
export const metaFunctions = {
	dataset: {
		actions: {
			exportMeta: functionsObject => {
				return ({ meta, datasetFunctions }) => {
					// const excludes = {
					// 	serverPagination: true,
					// 	zoom: true,
					// 	indexRowId: true,
					// 	computedWidth: true,
					// 	rwd: true,
					// 	tp: true,
					// 	visibleIndexes: true,
					// 	statusDraggable: true,
					// 	visibleIndex_: true,
					// 	index_: true,
					// 	position: true
					// };
					const r = buildFunctionsObject(meta, functionsObject, [
						{
							path: "../demo/dataset.functions",
							object: datasetFunctions
						}
					]);
					// const r =
					// 	"userMeta = {meta : " +
					// 	JSON.stringify(buildObject(meta, excludes)) +
					// 	"," +
					// 	functions;
					// functions
					// 	.slice(1, functions.length - 1)
					// 	.replace(/\\"/g, '"') +
					// ";";
					console.log(meta, r);
					utils.exportFile(r, "meta.txt", "text");
					return r;
				};
			}
		}
	},
	properties: {
		accessors: {
			propertyType: ({ row, status, meta }) => {
				if (row.reference) {
					return row.reference;
				} else if (row.analytic) {
					return "analytic";
				} else if (row.accessor || (status || {}).new_) {
					return "computed";
				} else {
					return "dataset";
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
		defaults: {},
		row: () => {},
		table: () => {}
	},
	functions: {
		accessors: {
			functionDescriptor: ({ row }) => {
				let label;
				if (row.tp === "accessor") {
					label = "Parameters: ({row,status,data,params,utils})";
				} else if (row.tp === "editable") {
					label = "Parameters: ({row,status,data,params})";
				} else if (row.tp === "select") {
					label = "Parameters: ({row,status,data,params})";
				} else if (row.tp === "validator") {
					label = "Parameters: ({row,status,data,params})";
				} else if (row.tp === "format") {
					label = "Parameters: (value,row,status,data,params)";
				} else if (row.tp === "aggregation") {
					label = "Parameters: ([values])";
				} else if (row.tp === "sort") {
					label = "Parameters: (rowA, rowB)";
				} else if (row.tp === "window") {
					label = "Parameters: (value)";
				}
				return `${row.caption || row.id} : ${label}`;
			},
			isLocal
		},
		validators: {
			stringToFunction
		},
		actions: {
			exportFunctions: ({ data }) =>
				"functions = " + buildFunctionsObject(data)
		},
		editables: { isLocal }
	},
	dimensions: {
		accessors: {
			sortAcc: ({ row }) => (row.sort || {}).keyAccessor,
			sortFct: ({ row }) => (row.sort || {}).custom,
			isLocal
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
		},
		editables: {
			isLocal
		}
	},
	measures: {
		accessors: {
			isLocal
		},
		editables: {
			isLocal
		}
	},
	globals_: {
		editables: {
			is_selected: ({ row }) => row.index_ !== undefined,
			is_new: ({ status }) => status.new_
		},
		observers: {
			onNext,
			onCompleted,
			onError
		},
		validators: {
			overwrite: x => true
		}
	}
};

export const setPropertyAccessors = (properties, data) => {
	const accessors = {};
	properties.forEach(property => {
		accessors[property.id] = {
			id: `row.${property.id}`,
			caption: `${property.id}`,
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
							caption: `${property.id}.${key}`,
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

export const metaDescriptions = (object, source, functions, callbacks = {}) => {
	const getFunctions = type => {
		return functions
			.getFunctionsArray(object, type, source)
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
	const getAccessorsAndProperties = () => {
		const dataAccessors = propertyAccessors;
		const accessors = getFunctions("accessors");
		return {
			...dataAccessors,
			...accessors
		};
	};
	const getAggregations = () => getFunctions("aggregations");
	const getFormats = () => getFunctions("formats");
	const getSorts = () => getFunctions("sorts");
	const getWindowFunctions = () => getFunctions("windows");
	const getSelects = () => getFunctions("selects");
	const getValidators = () => getFunctions("validators");
	const getDefaults = () => getFunctions("defaults");
	const getAnalytics = () => getFunctions("analytics");
	const getForeignObjects = () => getFunctions("foreignObjects");
	return {
		dataset: {
			table: {
				object: "dataset",
				editable: true,
				noFilter: false,
				// caption: "Dataset",
				actions: [
					{
						type: "insert",
						caption: "New",
						enable: true,
						key: "f2"
					},
					{
						type: "delete",
						caption: "Delete",
						enable: "is_selected",
						key: "f3"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						enable: "is_selected",
						key: "f4"
					},
					{
						type: "save",
						caption: "Save",
						enable: true,
						key: "f12"
					},
					{
						type: "refresh",
						caption: "Refresh",
						enable: true,
						key: "10"
					},
					{
						type: "action",
						enable: true,
						hidden: true,
						action: "toggleFilter",
						key: "f11"
					},
					{
						type: "action",
						caption: "Export Meta",
						enable: true,
						action: "exportMeta"
					}
				]
			},
			row: {},
			properties: []
		},
		properties: {
			table: {
				object: "properties",
				editable: true,
				primaryKey: "id",
				code: "caption",
				noDataMutation: true,
				onSave: callbacks.applyProperties,
				actions: [
					{
						type: "insert",
						caption: "New",
						enable: true,
						key: "f2"
					},
					{
						type: "delete",
						caption: "Delete",
						enable: "isNotDataset",
						key: "f3"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						enable: "is_selected",
						key: "f4"
					},
					{
						type: "action",
						enable: true,
						hidden: true,
						action: "toggleFilter",
						key: "f11"
					},
					{
						type: "save",
						caption: "Apply",
						enable: true,
						key: "f12"
					}
				]
			},
			row: {},
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
					accessor: "propertyType",
					filterType: "values"
				},
				{
					id: "dataType",
					caption: "Data type",
					width: 100,
					dataType: "string",
					editable: "isNotDataset",
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
					select: getFormats
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
						"contains",
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
					select: getAccessorsAndProperties,
					format: "isArrayOrFunction"
				},
				{
					id: "select",
					caption: "Select",
					width: 100,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getSelects,
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
					select: getDefaults
				},
				{
					id: "foreignObject",
					caption: "Foreign object",
					width: 150,
					dataType: "string",
					editable: true,
					select: getForeignObjects,
					format: "isArrayOrFunction"
				},
				{
					id: "analytic",
					caption: "Analytic function",
					width: 150,
					dataType: "string",
					editable: true,
					select: getAnalytics,
					format: "isArrayOrFunction"
				},
				{
					id: "onChange",
					caption: "On change",
					width: 100,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getValidators,
					format: "isArrayOrFunction"
				},
				{
					id: "onQuit",
					caption: "On cell quit",
					width: 100,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getValidators,
					format: "isArrayOrFunction"
				}
			]
		},
		functions: {
			table: {
				object: "functions",
				editable: true,
				primaryKey: "id",
				code: "caption",
				onSave: callbacks.applyFunctions,
				actions: [
					{
						type: "insert",
						caption: "New",
						enable: true,
						key: "f2"
					},
					{
						type: "delete",
						caption: "Delete",
						enable: "isLocal",
						key: "f3"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						enable: "is_selected",
						key: "f4"
					},
					{
						type: "save",
						caption: "Apply",
						enable: true,
						hidden: !callbacks.applyFunctions,
						key: "f12"
					},
					{
						type: "action",
						caption: "Export functions",
						action: "exportFunctions",
						hidden: true
					},
					{
						type: "action",
						enable: true,
						hidden: true,
						action: "toggleFilter",
						key: "f11"
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
					editable: "isLocal",
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
					editable: "isLocal",
					select: source
						? [object, source, "globals_"]
						: [object, "globals_"],
					filterType: "values",
					mandatory: true,
					default: "global"
				},
				{
					id: "tp",
					caption: "Type",
					width: 150,
					dataType: "string",
					editable: "isLocal",
					filterType: "values",
					select: [
						"actions",
						"accessors",
						"aggregations",
						"formats",
						"sorts",
						"windows",
						"selects",
						"validators",
						"editables",
						"defaults",
						"descriptors",
						"dmls"
					]
				},
				{
					id: "isLocal",
					caption: "Local",
					accessor: "isLocal",
					width: 80,
					dataType: "boolean",
					default: true
				},
				{
					id: "functionText",
					caption: "Function",
					// accessor: "functionToString",
					onQuit: ({ row }) => stringToFunction(row, functions),
					width: 500,
					dataType: "text",
					editable: "isLocal"
				},
				{
					id: "functionJS",
					caption: "Function",
					// accessor: "functionToString",
					// onQuit: "stringToFunction",
					hidden: true
				}
			]
		},
		measures: {
			table: {
				object: "measures",
				editable: true,
				primaryKey: "id",
				code: "caption",
				onSave: callbacks.applyMeasures,
				actions: [
					{
						type: "insert",
						caption: "New",
						enable: true,
						key: "f2"
					},
					{
						type: "delete",
						caption: "Delete",
						enable: "is_selected",
						key: "f3"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						enable: "is_selected",
						key: "f4"
					},
					{
						type: "save",
						caption: "Apply",
						enable: true,
						key: "f12"
					},
					{
						type: "action",
						enable: true,
						hidden: true,
						action: "toggleFilter",
						key: "f11"
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
					editable: "isLocal",
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
					editable: "isLocal",
					mandatory: true,
					filterType: "values",
					select: getAccessorsAndProperties
				},
				{
					id: "localFormat",
					caption: "format",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getFormats,
					accessor: ({ row }) =>
						utils.nullValue(row.localFormat, row.format),
					onQuit: "overwrite",
					format: ({ value, row }) =>
						inherited(row.localFormat, row.format)
				},
				{
					id: "aggregation",
					caption: "aggregation",
					width: 150,
					dataType: "string",
					editable: "isLocal",
					mandatory: true,
					default: "sum",
					filterType: "values",
					select: getAggregations
				},
				{
					id: "isLocal",
					caption: "Local",
					accessor: "isLocal",
					width: 80,
					dataType: "boolean",
					default: true
				}
			]
		},
		dimensions: {
			table: {
				object: "dimensions",
				editable: true,
				primaryKey: "id",
				code: "caption",
				onSave: callbacks.applyDimensions,
				actions: [
					{
						type: "insert",
						caption: "New",
						enable: true,
						key: "f2"
					},
					{
						type: "delete",
						caption: "Delete",
						enable: "is_selected",
						key: "f3"
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						enable: "is_selected",
						key: "f4"
					},
					{
						type: "save",
						caption: "Apply",
						// action: callbacks.applyDimensions,
						enable: true,
						key: "f12"
					},
					{
						type: "action",
						enable: true,
						hidden: true,
						action: "toggleFilter",
						key: "f11"
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
					editable: "isLocal"
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
					editable: "isLocal",
					filterType: "values",
					select: getAccessorsAndProperties
				},
				{
					id: "localLabelAccessor",
					caption: "Label accessor",
					width: 150,
					dataType: "string",
					editable: "isLocal",
					select: getAccessorsAndProperties,
					accessor: ({ row }) =>
						utils.nullValue(
							row.localLabelAccessor,
							row.labelAccessor
						),
					onQuit: "overwrite",
					format: ({ value, row }) =>
						inherited(
							row.localLabelAccessor,
							row.labelAccessor,
							!row.isLocal
						)
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
					id: "localSortAccessor",
					caption: "Sort accessor",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getAccessorsAndProperties,
					accessor: ({ row }) =>
						utils.nullValue(
							row.sort.localKeyAccessor,
							row.sort.keyAccessor
						),
					onQuit: ({ row }) => {
						if (!row.sort) {
							row.sort = {};
						}
						row.sort.localKeyAccessor = row.localSortAccessor;
						return true;
					},
					format: ({ row }) =>
						inherited(
							row.sort.localKeyAccessor,
							row.sort.keyAccessor,
							!row.isLocal
						)
				},
				{
					id: "localSortFunctionAccessor",
					caption: "Sort function",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getSorts,
					accessor: ({ row }) =>
						utils.nullValue(
							row.sort.localOrderFunctionAccessor,
							row.sort.orderFunctionAccessor
						),
					onQuit: ({ row }) => {
						if (!row.sort) {
							row.sort = {};
						}
						row.sort.localOrderFunctionAccessor =
							row.localSortFunctionAccessor;
						return true;
					},
					format: ({ value, row }) =>
						inherited(
							row.sort.localOrderFunctionAccessor,
							row.sort.orderFunctionAccessor,
							!row.isLocal
						)
				},
				{
					id: "localFormat",
					caption: "format",
					width: 150,
					dataType: "string",
					editable: true,
					filterType: "values",
					select: getFormats,
					accessor: ({ row }) =>
						utils.nullValue(row.localFormat, row.format),
					onQuit: "overwrite",
					format: ({ value, row }) =>
						inherited(row.localFormat, row.format, !row.isLocal)
				},
				{
					id: "isLocal",
					caption: "Local",
					accessor: "isLocal",
					width: 80,
					dataType: "boolean",
					default: true
				}
			]
		}
	};
};
