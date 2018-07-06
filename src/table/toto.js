import {
	getProducts,
	getCountries,
	getCurrencies,
	getColors,
	amt_,
	amt_cur,
	price,
	since30d,
	onChangeCountry,
	qty,
	amt_ as amt__1,
	amt_cur as amt_cur_1,
	mth,
	flag,
	audit as getAudits,
	computeData,
	toggleFilter,
	get_array,
	get_promise,
	get_observable,
	get_pagination_manager,
	get_subscription,
	onSave,
	onSaveAfter,
	onSaveBefore,
	thirdparties as MyThirdparties
} from "./demo/dataset.functions";
import {
	exportMeta,
	is_selected,
	is_new,
	onNext,
	onCompleted,
	onError,
	overwrite,
	propertyType,
	isArrayOrFunction,
	row,
	isDataset,
	isNotDataset,
	isAnalytic,
	functionDescriptor,
	isLocal,
	stringToFunction,
	exportFunctions,
	sortAcc,
	sortFct,
	sortAcc as sortAcc_1,
	sortFct as sortFct_1
} from "../MetaDescriptions";
import {
	decimals,
	percentage,
	date,
	mmYyyy,
	yyyy,
	time,
	dateTime,
	image,
	count,
	sum,
	min,
	max,
	avg,
	weighted_avg,
	delta,
	prod
} from "zebulon-controls";
userMeta = {
	meta: {
		table: {
			object: "dataset",
			editable: true,
			select: "get_promise",
			rowId: "rowId_",
			onSave: "onSave",
			onSaveAfter: "onSaveAfter",
			onSaveBefore: "onSaveBefore",
			onTableChange: "onTableChange",
			noFilter: false,
			noStatus: false,
			noOrder: false,
			actions: [
				{
					type: "insert",
					caption: "New",
					enable: true,
					key: "f2",
					statusEnable: true
				},
				{
					type: "delete",
					caption: "Delete",
					enable: "is_selected",
					key: "f3",
					statusEnable: true
				},
				{
					type: "duplicate",
					caption: "Duplicate",
					enable: "is_selected",
					key: "f4",
					statusEnable: true
				},
				{
					type: "save",
					caption: "Save",
					enable: true,
					key: "f12",
					statusEnable: true
				},
				{
					type: "refresh",
					caption: "Refresh",
					enable: true,
					key: "10",
					statusEnable: true
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
					action: "exportMeta",
					statusEnable: true
				}
			]
		},
		row: { audit: "audit" },
		properties: [
			{
				id: "product_id",
				caption: "product_id",
				width: 100,
				dataType: "number",
				alignement: "right",
				hidden: false,
				editable: false,
				filterType: "between"
			},
			{
				id: "id",
				caption: "id",
				width: 100,
				dataType: "number",
				alignement: "right",
				hidden: false,
				editable: false,
				filterType: "between"
			},
			{
				id: "country_id",
				caption: "country_id",
				width: 100,
				dataType: "number",
				alignement: "right",
				hidden: false,
				editable: false,
				filterType: "between"
			},
			{
				id: "currency_id",
				caption: "currency_id",
				width: 100,
				dataType: "number",
				alignement: "right",
				hidden: false,
				editable: false,
				filterType: "between"
			},
			{
				id: "thirdparty",
				caption: "thirdparty",
				width: 100,
				dataType: "object",
				alignement: "unset",
				hidden: true,
				editable: false,
				filterType: ""
			},
			{
				id: "color",
				caption: "color",
				width: 100,
				dataType: "string",
				alignement: "left",
				hidden: false,
				editable: false,
				filterType: ""
			},
			{
				id: "qty",
				caption: "qty",
				width: 100,
				dataType: "number",
				alignement: "right",
				hidden: false,
				editable: false,
				filterType: "between"
			},
			{
				id: "d",
				caption: "d",
				width: 100,
				dataType: "date",
				alignement: "center",
				hidden: false,
				editable: false,
				filterType: "between"
			},
			{
				id: "timestamp_",
				caption: "timestamp_",
				width: 100,
				dataType: "number",
				alignement: "right",
				hidden: true,
				editable: false,
				filterType: "between"
			},
			{
				id: "rowId_",
				caption: "rowId_",
				width: 100,
				dataType: "number",
				alignement: "right",
				hidden: true,
				editable: false,
				filterType: "between"
			}
		]
	},
	functions: {
		dataset: {
			selects: {
				getProducts: getProducts,
				getCountries: getCountries,
				getCurrencies: getCurrencies,
				getColors: getColors
			},
			formats: { "amt_€": amt_, amt_cur: amt_cur, price: price },
			windows: { since30d: since30d },
			validators: { onChangeCountry: onChangeCountry },
			accessors: {
				qty: qty,
				"amt_€": amt__1,
				amt_cur: amt_cur_1,
				mth: mth,
				flag: flag,
				audit: getAudits
			},
			actions: {
				computeData: computeData,
				toggleFilter: toggleFilter,
				exportMeta: exportMeta
			},
			dmls: {
				get_array: get_array,
				get_promise: get_promise,
				get_observable: get_observable,
				get_pagination_manager: get_pagination_manager,
				get_subscription: get_subscription,
				onSave: onSave,
				onSaveAfter: onSaveAfter,
				onSaveBefore: onSaveBefore
			},
			foreignObjects: { thirdparties: MyThirdparties },
			analytics: {}
		},
		globals_: {
			formats: {
				decimals: decimals,
				percentage: percentage,
				date: date,
				"mm/yyyy": mmYyyy,
				yyyy: yyyy,
				time: time,
				dateTime: dateTime,
				image: image
			},
			aggregations: {
				count: count,
				sum: sum,
				min: min,
				max: max,
				avg: avg,
				weighted_avg: weighted_avg,
				delta: delta,
				prod: prod
			},
			editables: { is_selected: is_selected, is_new: is_new },
			observers: {
				onNext: onNext,
				onCompleted: onCompleted,
				onError: onError
			},
			validators: { overwrite: overwrite }
		},
		properties: {
			accessors: { propertyType: propertyType },
			formats: { isArrayOrFunction: isArrayOrFunction },
			validators: { row: row },
			editables: {
				isDataset: isDataset,
				isNotDataset: isNotDataset,
				isAnalytic: isAnalytic
			}
		},
		functions: {
			accessors: {
				functionDescriptor: functionDescriptor,
				isLocal: isLocal
			},
			validators: { stringToFunction: stringToFunction },
			actions: { exportFunctions: exportFunctions },
			editables: { isLocal: isLocal }
		},
		dimensions: {
			accessors: { sortAcc: sortAcc, sortFct: sortFct, isLocal: isLocal },
			validators: { sortAcc: sortAcc_1, sortFct: sortFct_1 },
			editables: { isLocal: isLocal }
		},
		measures: {
			accessors: { isLocal: isLocal },
			editables: { isLocal: isLocal }
		}
	}
};
