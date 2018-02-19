import React from "react";
import { utils } from "zebulon-controls";
import { computeData, aggregations } from "../table/utils/compute.data";
import { getThirdparty } from "./thirdparties";

import {
	get_array,
	get_promise,
	get_observable,
	get_pagination_manager,
	getCountry,
	getCurrency,
	getProduct
	// getAudits
} from "./datasources";

const onSave = message => {
	return new Promise(resolve => setTimeout(resolve, 20)).then(() => {
		alert("Save updates");
		if (message.callback) {
			message.callback(message);
		}
	});
};
const audits = {};
const onSaveAfter = message => {
	const { updatedRows, meta } = message;
	Object.keys(updatedRows).forEach(key => {
		if (!audits[key]) {
			audits[key] = [];
		}
		const updatedRow = updatedRows[key];
		if (updatedRow.new_ && !updatedRow.deleted_) {
			audits[key] = [updatedRow.rowUpdated].concat(audits[key]);
		} else if (updatedRow.updated_) {
			const audit = {};
			meta.properties
				.filter(column => !column.accessorFunction)
				.forEach(column => {
					if (
						updatedRow.rowUpdated[column.id] !==
						updatedRow.row[column.id]
					) {
						audit[column.id] = updatedRow.row[column.id];
					}
				});
			audits[key].push(audit);
		}
		delete updatedRows[key];
	});
};
const getAudits = ({ row }) => {
	return new Promise(resolve => setTimeout(resolve, 20)).then(
		() => audits[row.index_]
	);
};
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
		"mm/yyyy": ({ value }) =>
			utils.isNullOrUndefined(value)
				? ""
				: utils.formatValue(value, "mm/yyyy"),
		"amt_€": ({ value, row }) => {
			return (
				<div
					style={{ display: "flex", justifyContent: "space-between" }}
				>
					<div>€</div>
					<div style={{ textAlign: "right" }}>
						{utils.formatValue(value, null, 2)}
					</div>
				</div>
			);
		},
		amt_cur: ({ value, row }) => {
			return (
				<div
					style={{ display: "flex", justifyContent: "space-between" }}
				>
					<div>{(row.currency || {}).symbol}</div>
					<div style={{ textAlign: "right" }}>
						{utils.formatValue(value, null, 2)}
					</div>
				</div>
			);
		},
		price: ({ value }) => {
			return (
				<div
					style={{ display: "flex", justifyContent: "space-between" }}
				>
					<div>€</div>
					<div style={{ textAlign: "right" }}>
						{utils.formatValue(value, null, 2)}
					</div>
				</div>
			);
		},
		formatAmt: ({ value, row, params, status, data }) => {
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
	},
	accessors: {
		qty3: ({ row }) => row.qty / 3,

		"amt_€": ({ row }) => row.qty * (row.product || {}).price,
		amt_cur: ({ row }) =>
			row.qty * (row.product || {}).price * (row.currency || {}).rate,
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
		thirdparty: ({ row }) => getThirdparty(row.thirdparty_id),
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
					alt=""
					src={`//www.drapeauxdespays.fr/data/flags/small/${row.country.code.toLowerCase()}.png`}
				/>
			);
		},
		audit: getAudits
	},
	actions: {
		computeData
	},
	dmls: {
		get_array,
		get_promise,
		get_observable,
		get_pagination_manager,
		onSave,
		onSaveAfter
	}
};
export const customMenuFunctions = {
	"row-header-menu": [
		{
			code: "toto1",
			caption: "Toto1",
			type: "MenuItem",
			function: e => console.log("toto1")
		},
		{
			code: "toto2",
			caption: "Toto2",
			type: "MenuItem",
			function: e => console.log("toto2")
		}
	],
	"column-header-menu": [
		{
			code: "totoa",
			caption: "TotoA",
			type: "MenuItem",
			function: e => console.log("toto1")
		},
		{
			code: "totob",
			caption: "TotoB",
			type: "MenuItem",
			function: e => console.log("toto2")
		}
	],
	"top-left-corner-menu": [
		{
			code: "toto1",
			caption: "Toto_1",
			type: "MenuItem",
			function: e => console.log("toto1")
		},
		{
			code: "toto2",
			caption: "Toto2_",
			type: "MenuItem",
			function: e => console.log("toto2")
		}
	]
};
// 		tableCorner: {
// 			...prevMenuFunctions.tableCorner,
// 			range: {
// 				code: "range",
// 				caption: "Custom range function",
// 				type: "MenuItem",
// 				function: range => callback("range", rangeDisplay(range))
// 			}
// 		T,
// 		rowHeader: {
// 			...prevMenuFunctions.rowHeader,
// 			grid: {
// 				code: "grid",
// 				type: "MenuItem",
// 				caption: "Custom export as csv",
// 				// function: () => <div>toto</div>
// 				function: ({ grid, toText }) =>
// 					exportFile(toText(grid, "csv"), "zebulon.csv")
// 			}
// 			// ,
// 			// test: {
// 			//   code: "test",
// 			//   type: "SubMenu",
// 			//   caption: "test",
// 			//   // function: () => <div>toto</div>
// 			//   function: () => <div>Test</div>
// 			// }
// 		}
// 	};
// 	const actionContent = (
// 		<div>
// 			<div>
// 				Add custom menu functions for cell (cells under the right
// 				ckick), selected range or grid, accesible by the contextual menu
// 				on the data cells area.
// 			</div>
// 			<div>The first cell function is called on doubleclick too.</div>
// 		</div>
// 	);
// 	return { menuFunctions, actionContent };
// };

//   return { menuFunctions, actionContent };
// };