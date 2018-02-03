import React from "react";
import { utils } from "zebulon-controls";
import {
	computeData,
	buildObject,
	exportFunctions,
	aggregations
} from "../table/utils";
import {
	get_array,
	get_promise,
	get_observable,
	get_pagination_manager,
	getCountry,
	getCurrency,
	getProduct
} from "./datasources";

const set = () => {};
export const datasetFunctions = {
	selects: {
		titi_lb: ({ row, params, status, data }) => [
			"",
			"titi_a",
			"titi_b",
			"titi_c",
			"titi_d"
		]
	},
	formats: {
		"mm/yyyy": value =>
			utils.isNullOrUndefined(value)
				? ""
				: utils.formatValue(value, "mm/yyyy"),
		formatAmt: (value, row, params, status, data) => {
			const v = utils.formatValue(value, null, 2);
			if (
				(value < 3000 && value > 1000) ||
				utils.isNullOrUndefined(value)
			) {
				return v;
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
						<div>{v}</div>
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
						<div>{v}</div>
					</div>
				);
			}
		}
	},
	aggregations,
	windows: {
		since30d: x => {
			const xx = new Date(x);
			xx.setDate(xx.getDate() - 30);
			return xx;
		}
		// ,
		// to5d: x => {
		// 	const xx = new Date(x);
		// 	xx.setDate(xx.getDate() + 5);
		// 	return xx;
		// }
	},
	accessors: {
		qty3: ({ row }) => row.qty / 3,
		mth: ({ row }) => {
			if (utils.isNullOrUndefined(row.d)) {
				return null;
			}
			const d = new Date(row.d);
			d.setDate(1);
			return d;
		},
		country: ({ row }) => getCountry(row.country_id),
		currency: ({ row }) => getCurrency(row.currency_id),
		product: ({ row }) => getProduct(row.product_id),
		flag: ({ row }) => {
			if (
				!row.country ||
				row.country.code === "" ||
				utils.isNullOrUndefined(row.country.code)
			) {
				return null;
			}
			return (
				<img
					height="100%"
					width="100%"
					padding="unset"
					src={`//www.drapeauxdespays.fr/data/flags/small/${row.country.code.toLowerCase()}.png`}
				/>
			);
		}
	},
	actions: {
		computeData
	},
	dmls: {
		get_array,
		get_promise,
		get_observable,
		get_pagination_manager,
		set
	}
};
export const metaDataset = {
	table: {
		object: "dataset",
		editable: true,
		select: "get_array",
		primaryKey: "id",
		onSave: "set",
		noFilter: false,
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
const metaDataset2 = {
	// serverPagination: true,
	table: {
		object: "dataset",
		editable: true,
		select: "get_array",
		primaryKey: "id",
		onSave: "set",
		actions: [],
		noFilter: true,
		noStatus: true
	},
	row: {},
	properties: []
};
export const buildMeta = () => {
	return metaDataset2;
};
