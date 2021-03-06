import React from "react";
import { utils } from "zebulon-controls";
import { computeData } from "../table/utils/compute.data";
import { MyThirdparties } from "./thirdparties";
import { getRowErrors, getErrors, manageRowError } from "../table/utils/utils";
import { Observable } from "rx-lite";
import { isEqual, getUpdatedRows } from "../table/utils/utils";
import {
	get_array,
	get_promise,
	get_observable,
	get_pagination_manager,
	getCountries,
	getCurrencies,
	getProducts,
	getColors,
	serverData,
	audits,
	dataPk
} from "./datasources";
import { meta } from "./dataset.meta";
// asynchronous function (check on the server simulation)
// ! don't return, as the next step will be executed by the callback
// else it will be done twice
//
// conflicts management
// NB it might be preferable to use a database rowid instead of a primary key
//server side
const onSaveBefore_ = updatedRows => {
	const conflicts = [];
	// if the timestamp on the server side is > timestamp client side => conflict
	console.log("savebefore", serverData.length);
	getUpdatedRows(updatedRows).forEach(status => {
		// const d = data;
		const row = status.rowUpdated || status.row;
		const serverRow = serverData[row.rowId_];
		if (serverRow && serverRow.timestamp_ > row.timestamp_) {
			conflicts.push({ index_: row.index_, row: { ...serverRow } });
		}
	});
	if (conflicts.length) {
		return conflicts;
	} else {
		return true;
	}
};
//client side
const onSaveBefore = (message, callback) => {
	new Promise(resolve =>
		resolve(onSaveBefore_(JSON.parse(JSON.stringify(message.updatedRows))))
	).then(ok => {
		if (ok !== true) {
			message.conflicts = ok.reduce((acc, conflict) => {
				const status = message.updatedRows[conflict.index_];
				acc[conflict.index_] = {
					server: { ...conflict.row },
					client: {
						...status.rowUpdated,
						deleted_:
							status.deleted_ && !status.new_ ? true : undefined
					}
				};
				return acc;
			}, {});
		} else {
			message.conflicts = undefined;
		}
		if (callback) {
			callback(message);
		}
	});
};
// asynchronous function (save on the server simulation)
// !don't return, as the next step will be executed by the callback
// else it will be done twice
//

// simulation of saving on server + audit management + error management(unique id)
// server side
export const computeAudit = (
	user_,
	timestamp_,
	status_,
	columns,
	row,
	nextRow
) => {
	if (status_ === "updated" || status_ === "new" || status_ === "deleted") {
		const key = nextRow.rowId_ || row.rowId_;

		if (!audits[key]) {
			audits[key] = [];
		}
		let ok = true;
		const audits_ = audits[key];
		const audit = { user_, timestamp_, status_, row: {} };
		if (status_ === "updated") {
			ok = false;
			columns.forEach(column => {
				if (!isEqual(nextRow[column], row[column])) {
					ok = true;
					audit.row[column] = row[column];
				}
			});
		}
		if (ok) {
			audits_.push(audit);
		}
	}
};

const onSave_ = (updatedRows, user) => {
	//  check unicity of the primary key
	const pk = {},
		deleteds = [];
	getUpdatedRows(updatedRows).forEach(status => {
		const row = status.rowUpdated || status.row;
		if (!pk[row.id]) {
			pk[row.id] = {
				n: 0,
				// serverIndex_: status.row ? dataPk[status.row.id] : undefined,
				row
			};
		}
		if (status.row && !pk[status.row.id]) {
			pk[status.row.id] = {
				n: 0,
				// serverIndex_: dataPk[status.row.id],
				row
			};
		}
		if (status.deleted_ && !status.new_) {
			pk[status.row.id].n -= 1;
			deleteds.push({
				rowId_: status.row.rowId_,
				index_: status.row.index_
			});
		} else if (
			status.updated_ &&
			!status.new_ &&
			status.row.id !== status.rowUpdated.id
		) {
			pk[status.row.id].n -= 1;
			pk[row.id].n += 1;
			pk[row.id].row = row;
		} else if (status.new_ && !status.deleted_) {
			pk[row.id].n += 1;
			pk[row.id].serverIndex_ = undefined;
			pk[row.id].row = row;
		}
	});
	const keys = Object.keys(pk);
	const timestamp = new Date().getTime();
	const errors = [];
	keys.forEach(key => {
		const pKey = pk[key];
		pKey.n += dataPk[key] !== undefined;
		if (pKey.n > 1) {
			errors.push({
				index_: pKey.row.index_,
				type: "duplicate key",
				id: "id",
				caption: "Order#",
				error: `Order# - duplicate key: ${key}`
			});
		}
	});
	if (errors.length) {
		return { ok: false, errors };
	}
	// compute audit
	const columns = meta.properties
		.filter(column => !column.accessor)
		.map(column => column.id);
	// saves on server and returns rowid +timestamp to client
	const rows = [];
	keys.forEach(key => {
		const pKey = pk[key];
		if (pKey.n === 1) {
			const index_ = pKey.row.index_;
			delete pKey.row.index_;
			pKey.row.timestamp_ = timestamp;
			if (utils.isNullOrUndefined(pKey.row.rowId_)) {
				pKey.row.rowId_ = serverData.length;
				dataPk[key] = pKey.row.rowId_;
				computeAudit(user, timestamp, "new", columns, {}, pKey.row);
				serverData.push(pKey.row);
			} else {
				dataPk[key] = pKey.row.rowId_;
				computeAudit(
					user,
					timestamp,
					"updated",
					columns,
					serverData[pKey.row.rowId_],
					pKey.row
				);
				serverData[pKey.row.rowId_] = pKey.row;
			}
			rows.push({
				index_,
				rowId_: pKey.row.rowId_,
				timestamp_: timestamp
			});
		} else {
			delete dataPk[key];
		}
	});
	deleteds.forEach(deleted => {
		computeAudit(
			user,
			timestamp,
			"deleted",
			columns,
			serverData[deleted.rowId_],
			{}
		);
		serverData[deleted.rowId_].deleted_ = true;
		serverData[deleted.rowId_].timestamp_ = timestamp;
		rows.push({
			index_: deleted.index_,
			rowId_: deleted.rowId_,
			timestamp_: timestamp
		});
	});

	return { ok: true, rows };
};
// client side
const onSave = (message, callback) => {
	new Promise(resolve =>
		resolve(
			onSave_(
				JSON.parse(JSON.stringify(message.updatedRows)),
				message.params.user_
			)
		)
	).then(result => {
		if (!result.ok) {
			message.serverErrors = ["Server errors"].concat(
				result.errors.map(error => {
					manageRowError(
						message.updatedRows,
						error.index_,
						{ id: error.id, caption: error.caption },
						error.type,
						error.error,
						error.rowTitle,
						true
					);
					return error.error;
				})
			);
		} else {
			result.rows.forEach(serverRow => {
				const row = message.updatedRows[serverRow.index_].rowUpdated;
				row.rowId_ = serverRow.rowId_;
				row.timestamp_ = serverRow.timestamp_;
			});
			message.serverErrors = undefined;
		}

		if (callback) {
			callback(message);
		}
	});
};

// synchronous function (keep audits of changes)
// return true or false
const onSaveAfter = message => {
	return true;
};
const getAudits_ = rowId => audits[rowId];
const getAudits = ({ row }) => {
	return new Promise(resolve => resolve(getAudits_(row.rowId_)));
};
export const get_subscription = ({ params, meta, filters, sorts }) => {
	const columns = meta.properties
		.filter(column => !column.accessor)
		.map(column => column.id);
	const timestamp = new Date().getTime();
	const data2 = [[], [], []];
	for (let i = 0; i < 12; i++) {
		const row = serverData[i];
		const row0 = { ...serverData[i] };
		row.timestamp_ = timestamp;
		row.qty = Math.floor(2000 * Math.random());
		computeAudit("Zébulon", timestamp, "updated", columns, row0, row);
		data2[Math.floor(i / 4)].push({ ...row });
	}
	return Observable.interval(800)
		.take(3)
		.map(i => {
			return data2[i];
		});
};
// errors an user interractions management
export const errorHandler = {
	onRowQuit: message => {
		message.modalBody = ["Errors: "].concat(
			getRowErrors(message.status, message.row.index_)
				.map(error => `\n Order# ${message.row.id} : ${error.error}`)
				.concat(["Do you wan't to continue?"])
		);
		return true;
	},
	onTableChange: message => {
		if (message.type !== "sort") {
			message.modalBody = `Do you want to save before ${message.type}?`;
		}
		return true;
	},
	onSaveBefore: message => {
		message.modalBody = ["Can't save with errors: "].concat(
			getErrors(message.updatedRows).map(
				error =>
					`\nOrder# ${message.updatedRows[error.rowIndex].rowUpdated
						.id} : ${error.error}`
			)
		);
		if (message.modalBody.length > 1) {
			return false;
		}
		message.modalBody = null;
		return true;
	},
	onSave: message => {
		if (message.serverErrors) {
			message.modalBody = message.serverErrors;
			return false;
		}
		message.modalBody = null;
		return true;
	}
};
export const datasetFunctions = {
	dataset: {
		selects: {
			getProducts,
			getCountries,
			getCurrencies,
			getColors
		},
		formats: {
			// "mm/yyyy": ({ value }) =>
			// 	utils.isNullOrUndefined(value)
			// 		? ""
			// 		: utils.formatValue(value, "mm/yyyy"),
			"amt_€": ({ value, row }) => {
				return (
					<div
						style={{
							display: "flex",
							justifyContent: "space-between"
						}}
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
						style={{
							display: "flex",
							justifyContent: "space-between"
						}}
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
						style={{
							display: "flex",
							justifyContent: "space-between"
						}}
					>
						<div>€</div>
						<div style={{ textAlign: "right" }}>
							{utils.formatValue(value, null, 2)}
						</div>
					</div>
				);
			}
		},
		windows: {
			since30d: x => {
				const xx = new Date(x);
				xx.setDate(xx.getDate() - 30);
				return xx;
			}
		},
		validators: {
			onChangeCountry: ({ row, column, meta }) => {
				if (
					!utils.isNullOrUndefined(row.country_id) &&
					utils.isNullOrUndefined(row.currency_id)
				) {
					row.currency_id = row.country.currency_id;
					row.currency = meta.properties
						.find(column => column.id === "currency")
						.accessorFunction({ row });
				}
				return true;
			}
		},
		accessors: {
			qty: ({ row }) => row.qty / 3,

			"amt_€": ({ row }) => row.qty * (row.product || {}).price,
			amt_cur: ({ row }) => {
				return (
					row.qty *
					(row.product || {}).price *
					(row.currency || {}).rate
				);
			},
			mth: ({ row }) => {
				if (utils.isNullOrUndefined(row.d)) {
					return null;
				}
				const d = new Date(row.d);
				d.setDate(1);
				return d;
			},
			flag: ({ row }) => {
				if (
					!row.country ||
					row.country.code === "" ||
					utils.isNullOrUndefined(row.country.code)
				) {
					return null;
				}
				return `//www.drapeauxdespays.fr/data/flags/small/${row.country.code.toLowerCase()}.png`;
			},
			audit: getAudits
		},
		actions: {
			computeData,
			toggleFilter: ({ ref }) => ref.toggleFilter()
		},
		dmls: {
			get_array,
			get_promise,
			get_observable,
			get_pagination_manager,
			get_subscription,
			onSave,
			onSaveAfter,
			onSaveBefore
			// onTableChange
		},
		foreignObjects: {
			thirdparties: MyThirdparties
		},
		analytics: {
			rolling_avg: {
				aggregation: "avg",
				groupByAccessor: "row.country.id",
				comparisonAccessor: "row.d",
				sortAccessor: "row.d",
				windowStart: "since30d",
				windowEnd: x => x
			},
			total_amt: {
				aggregation: "sum",
				groupByAccessor: "row.country.id"
			}
		}
	}
};

export const customMenuFunctions = (state, props) => ({
	"row-header-menu": [
		{
			code: "toto1",
			caption: "Row menu 0",
			type: "MenuItem",
			function: e => console.log("Row menu 0", e)
		},
		{
			code: "toto2",
			caption: "Row menu 1",
			type: "MenuItem",
			function: e => console.log("Row menu 1", e)
		}
	],
	"column-header-menu": [
		{
			code: "totoa",
			caption: "Column menu 0",
			type: "MenuItem",
			function: e => console.log("Column menu 0", e)
		},
		{
			code: "totob",
			caption: "Column menu 1",
			type: "MenuItem",
			function: e => console.log("Column menu 1", e)
		}
	],
	"top-left-corner-menu": [
		{
			code: "toto1",
			caption: "Table menu 0",
			type: "MenuItem",
			function: e => console.log("Table menu 0", e)
		},
		{
			code: "toto2",
			caption: "Table menu 1",
			type: "MenuItem",
			function: e => console.log("Table menu 1", e)
		}
	],
	"cell-menu": [
		{
			code: "cell0",
			caption: "Cell menu 0",
			type: "MenuItem",
			function: e => console.log("Cell menu 0", e)
		},
		{
			code: "cell1",
			caption: "Cell menu 1",
			type: "MenuItem",
			function: e => console.log("Cell menu 1", e)
		}
	]
});
