import React, { Component } from "react";
// import * as aggregations from "../../utils/aggregation";
import { Input, utils } from "zebulon-controls";
import { getFunction, computeData } from "./utils";
class Property extends Component {
	constructor(props) {
		super(props);
		const object = this.props.row;
		const indexes = [8, 9, 10, 11, 12, 13];
		// const items = [],
		this.title = "Functions for analytic property";
		this.inputs = [];
		const style = {
			border: "solid lightgrey thin",
			boxSizing: "border-box",
			padding: 0,
			backgroundColor: "inherit",
			width: 200,
			textAlign: "left"
		};
		indexes.forEach(index => {
			const column = this.props.meta[index];
			// items.push(this.props.meta[index]);
			this.inputs.push(
				<Input
					style={style}
					label={column.caption}
					select={column.select}
					className="zebulon-input-label"
					row={props.row}
					id={column.id}
					key={column.id}
					value={this.props.row[column.id]}
					onChange={e => props.onChange(e, this.props.row, column)}
				/>
			);
		});
	}
	render() {
		// onst select = ["", "a", "b", "c"];
		// const style = {
		// 	border: "solid lightgrey thin",
		// 	boxSizing: "border-box",
		// 	padding: 0,
		// 	backgroundColor: "inherit",
		// 	width: 200,
		// 	textAlign: "left"

		// };
		return (
			<div
				style={{
					position: "absolute",
					border: "solid 0.1em rgba(0, 0, 0, 0.5)",
					backgroundColor: "white",
					top: this.props.top,
					left: 25,
					zIndex: 3,
					opacity: 1,
					width: 400,
					height: "fit-content",
					autoFocus: true
				}}
			>
				<div
					style={{
						textAlign: "Center",
						fontWeight: "bold",
						margin: 3,
						marginBottom: 7,
						display: "flex",
						justifyContent: "space-between"
					}}
				>
					{this.title}
					<button onClick={this.props.close}>X</button>
				</div>
				{this.inputs}
			</div>
		);
	}
}
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
	// return (
	// 	<Property
	// 		row={row}
	// 		data={data}
	// 		meta={meta}
	// 		params={params}
	// 		status={status}
	// 		onChange={callbacks.onChange}
	// 		close={callbacks.close}
	// 		top={top}
	// 	/>
	// );
};
const functionToString = row => {
	if (typeof row.functionJS === "function") {
		return String(row.functionJS);
		// let fs = String(row.functionJS);
		// return fs.slice(fs.indexOf("{"));
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
		return false;
	}
	if (typeof f === "function") {
		row.functionJS = f;
		if (status.errors.functionJS) {
			delete status.errors.functionJS.JS;
		}
		return true;
	} else {
		const error = status.errors.functionJS || {};
		error.JS = "function not evaluated";
		status.errors.functionJS = error;
		return false;
	}
	// console.log("stringToFunction", f);
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
		table: () => {}
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
			saveDataAndConfig: a => {},
			computeData
		}
	},
	functions: {
		accessors: {
			functionToString: ({ row }) => functionToString(row)
		},
		validators: {
			stringToFunction: ({ row, status }) => stringToFunction(row, status)
		}
	},
	globals_: {
		editables: { isNotSelected: ({ row }) => row.index_ === undefined }
	}
};

export const metaDescriptions = (object, functions, properties) => {
	// const accessors = props.configurationFunctions.accessors;
	const f = functions; //functionsTable(functions);
	// const f={functions.global,...functions[object]};

	const getFunctions = (type, obj = object) => {
		return [""].concat(
			Object.values(
				f
					.filter(
						f =>
							f.tp === type &&
							(f.visibility === "global" || f.visibility === obj)
					)
					.reduce((acc, f) => {
						acc[f.id] = { id: f.id, caption: f.caption || f.id };
						return acc;
					}, {})
			)
		);
	};
	const getAccessors = obj => () => getFunctions("accessor", obj);
	const getAccessorsAndProperties = () =>
		getAccessors().concat(
			properties.map(property => property.caption || property.id)
		);
	const getAggregations = () => getFunctions("aggregation");
	const getFormats = obj => getFunctions("format", obj);
	const getSorts = () => getFunctions("sort");
	const getWindowFunctions = () => getFunctions("window");
	const getSelects = obj => () => getFunctions("select", obj);
	const getValidators = () => getFunctions("validator");
	const getEditables = () => getFunctions("editable");
	const getDefaults = obj => getFunctions("default", obj);
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
						disable: getFunction(
							f,
							object,
							"editable",
							"isNotSelected"
						)
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						disable: getFunction(
							f,
							object,
							"editable",
							"isNotSelected"
						)
					},
					{
						type: "action",
						caption: "Compute",
						action: getFunction(f, object, "action", "computeData")
					},
					{
						type: "save",
						caption: "Save",
						action: getFunction(
							f,
							object,
							"action",
							"saveDataAndConfig"
						)
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
				actions: [
					{ type: "insert", caption: "New" },
					{
						type: "delete",
						caption: "Delete",
						disable: getFunction(
							f,
							object,
							"editable",
							"isNotSelected"
						)
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						disable: getFunction(
							f,
							object,
							"editable",
							"isNotSelected"
						)
					}
				]
			},
			row: {
				validator: propertyValidator,
				detail: propertyDetail
			},
			properties: [
				{
					id: "id",
					caption: "Column",
					width: 100,
					dataType: "string",
					editable: getFunction(f, object, "editable", "notInitial"),
					mandatory: true
				},
				{
					id: "tp",
					caption: "Type",
					width: 100,
					dataType: "string",
					// accessor: (row, status) => (status.new_ ? row.tp : row.tp),
					editable: getFunction(f, object, "editable", "notInitial"),
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
					id: "valueAccessor",
					caption: "Accessor",
					width: 100,
					dataType: "string",
					editable: getFunction(f, object, "editable", "notInitial"),
					// select: getFunction(f, object, "editable", "notInitial"),
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
					select: getValidators
				},
				{
					id: "groupByAccessor",
					caption: "Group by accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getAccessorsAndProperties
				},
				{
					id: "comparisonAccessor",
					caption: "Comparison accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getAccessorsAndProperties
				},
				{
					id: "sortAccessor",
					caption: "Sort accessor",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getAccessorsAndProperties
				},
				{
					id: "aggregation",
					caption: "Aggregation",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getAggregations
				},
				{
					id: "startFunction",
					caption: "Start function",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getWindowFunctions
				},
				{
					id: "endFunction",
					caption: "End function",
					width: 200,
					dataType: "string",
					editable: true,
					hidden: true,
					select: getWindowFunctions
				}
			]
		};
	} else if (object === "functions") {
		// const fo = functions.functions;
		return {
			table: {
				object,
				editable: true,
				actions: [
					{ type: "insert", caption: "New" },
					{
						type: "delete",
						caption: "Delete",
						disable: getFunction(
							f,
							object,
							"editable",
							"isNotSelected"
						)
					},
					{
						type: "duplicate",
						caption: "Duplicate",
						disable: getFunction(
							f,
							object,
							"editable",
							"isNotSelected"
						)
					}
				]
			},
			row: {},
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
					accessor: getFunction(
						f,
						object,
						"accessor",
						"functionToString"
					),
					onQuit: getFunction(
						f,
						object,
						"validator",
						"stringToFunction"
					),
					// accessor: row => {
					// 	return functionToString(row.functionJS);
					// },
					width: 500,
					dataType: "text",
					editable: true
				}
			]
		};
	}
};
export const actionDescriptions = (object, callbacks) => {
	if (object === "dataset") {
		return [
			{ caption: "New", type: "new" },
			{
				caption: "Delete",
				type: "delete",
				disable: row => row.index_ === undefined || "Initial" === row.tp
			},
			{
				caption: "Compute",
				action: e => callbacks.computeData()
			},
			{ caption: "Save", type: "save" }
		];
	} else if (object === "properties") {
		return [
			{ caption: "New", type: "new" },
			{
				caption: "Delete",
				type: "delete",
				disable: row => row.index_ === undefined || "Initial" === row.tp
			},
			{
				caption: "Analytic",
				type: "detail",
				disable: row => "Analytic" !== row.tp,
				content: (row, data, meta, status, params, top, left) => {
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
				}
			}
		];
	} else {
		return [
			{ caption: "New", type: "new" },
			{
				caption: "Delete",
				type: "delete",
				disable: row => row.index_ === undefined || "Initial" === row.tp
			}
		];
	}
};
