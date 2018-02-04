import React from "react";
import { Observable } from "rx-lite";
// import { getMockDatasource } from "./mock";
import { filtersFunction, sortsFunction } from "../table/utils";
import { utils } from "zebulon-controls";

// -------------------------------------------
// simulation of the different ways to provide
// a dataset to the table and server communication
// -------------------------------------------
// array
// -------------------------------------------
export const countries = [
	{ id: 0, code: "FR", label: "France", currency_id: 0 },
	{ id: 1, code: "GB", label: "United kingdom", currency_id: 1 },
	{ id: 2, code: "US", label: "United states of America", currency_id: 2 },
	{ id: 3, code: "CA", label: "Canada", currency_id: 3 },
	{ id: 4, code: "CN", label: "China", currency_id: 4 },
	{ id: 5, code: "IT", label: "Italy", currency_id: 0 },
	{ id: 6, code: "DE", label: "Germany", currency_id: 0 },
	{ id: 7, code: "BE", label: "Belgium", currency_id: 0 },
	{ id: 8, code: "IE", label: "Ireland", currency_id: 0 },
	{ id: 9, code: "ES", label: "Spain", currency_id: 0 },
	{ id: 10, code: "NL", label: "Netherland", currency_id: 0 },
	{ id: 11, code: "JP", label: "Japan", currency_id: 5 },
	{ id: 11, code: "CH", label: "Switzerland", currency_id: 6 }
].reduce((acc, country) => {
	acc[country.id] = country;
	return acc;
}, {});
export const getCountry = id => countries[id];
export const currencies = [
	{ id: 0, code: "EUR", label: "Euro", symbol: "€", rate: 1 },
	{ id: 1, code: "GBP", label: "British pound", symbol: "£", rate: 0.88 },
	{ id: 2, code: "USD", label: "US dollar", symbol: "$", rate: 1.24 },
	{ id: 3, code: "CAD", label: "Canadian dollar", symbol: "ca$", rate: 1.53 },
	{ id: 4, code: "CNY", label: "Yuan", symbol: "cn¥", rate: 7.81 },
	{ id: 5, code: "JPY", label: "Yen", symbol: "jp¥", rate: 136 },
	{ id: 6, code: "CHF", label: "Swiss franc", symbol: "Fr.", rate: 1.15 }
].reduce((acc, currency) => {
	acc[currency.id] = currency;
	return acc;
}, {});
export const getCurrency = id => currencies[id];

export const shapes = [
	"square",
	"cube",
	"rectangle",
	"hexagon",
	"octogon",
	"circle",
	"cube",
	"disc",
	"triangle",
	"pyramid"
];
export const sizes = ["extra small", "small", "normal", "large", "extra large"];
export const colors = [
	"blue",
	"yellow",
	"red",
	"green",
	"cyan",
	"magenta",
	"orange",
	"purple",
	"white",
	"pink",
	"grey",
	"black"
];
export const products = {};
for (let i = 0; i < 200; i++) {
	products[i] = {
		id: i,
		label: `Product ${i}`,
		shape: shapes[Math.ceil(Math.random() * (shapes.length - 1.001))],
		size: sizes[Math.ceil(Math.random() * (sizes.length - 1.001))],
		price: 100 * Math.random() + 50,
		currency_id: 0,
		currency_sym: "€"
	};
}
export const getProduct = id => products[id];

export const getMockDataset = nRow => {
	// const data = (nRow, nProduct) => {

	const d = [];
	for (let i = 0; i < nRow; i++) {
		const row = {};
		row.product_id = Math.floor(
			Math.random() * (Object.keys(products).length - 0.001)
		);
		row.id = i;
		row.country_id = Math.floor(
			Math.random() * (Object.keys(countries).length - 0.001)
		);
		row.currency_id = countries[row.country_id].currency_id;
		row.color = colors[Math.floor(Math.random() * (colors.length - 0.001))];
		row.qty = Math.round(1000 * Math.random()) + 125;
		row.d = new Date(
			2017 + Math.round(2 * Math.random()),
			Math.round(12 * Math.random()),
			Math.round(31 * Math.random())
		);
		const x = d.push(row);
	}
	return {
		data: d,
		currencies,
		countries,
		products,
		shapes,
		sizes,
		colors
	};
};
// export function getMockDatasource(
// 	dataRepetition = 1,
// 	nToto = 10,
// 	nTiti = 10,
// 	nTutu = 2
// ) {
// 	let obj = [];
// 	const res = [];
// 	let ii = 0;
// 	for (let k = 0; k < dataRepetition; k += 1) {
// 		for (let o = 0; o < nToto; o += 1) {
// 			for (let i = 0; i < nTiti; i += 1) {
// 				for (let u = 0; u < nTutu; u += 1) {
// 					obj = {};
// 					obj.toto = o;
// 					obj.toto_lb = `toto ${String(o)}`;
// 					obj.toto_0 = `att0 ${String(o)}`;
// 					obj.toto_1 = `att1 ${String(nToto - o)}`;
// 					obj.titi = i;
// 					obj.titi_lb = `titi ${String(i)}`;
// 					obj.tutu = String(Math.round((nTutu - 1) * Math.random()));
// 					obj.qty = Math.round(1000 * Math.random()) + 125; // +9999999999.1234567890123456
// 					obj.amt = Math.round(5000 * Math.random()) + 310; // +9999999999.1234567890123456
// 					obj.d = new Date(
// 						2017 + Math.round(2 * Math.random()),
// 						Math.round(12 * Math.random()),
// 						Math.round(31 * Math.random())
// 					);
// 					obj.id = ii;
// 					res.push(obj);
// 					ii++;
// 				}
// 			}
// 		}
// 	}
// 	return res;
// }
export const get_array = ({ params, filters }) => getMockDataset(25000).data;
// -------------------------------------------
// promise
// -------------------------------------------
export const get_promise = ({ params, filters }) => {
	let data = get_array({ params, filters });
	if (filters) {
		data = data.filter(filtersFunction(filters, params, data));
	}
	return new Promise(resolve => setTimeout(resolve, 20)).then(() => data);
};
// -------------------------------------------
// observable
// -------------------------------------------
export const get_observable = ({ params, filters, sorts }) => {
	const data = get_array({ params, filters });
	if (sorts) {
		data.sort(sortsFunction(sorts));
	}
	const data2 = [];
	let i = 0;
	while (i < data.length) {
		data2.push(data.slice(i, (i += 1000)));
	}
	return Observable.interval(20)
		.take(data2.length)
		.map(i => data2[i]);
};
// -------------------------------------------
// pagination manager
// -------------------------------------------
export const get_pagination_manager = e => {
	// --------------------------------
	// Simulation of a  server dataset:
	// --------------------------------
	const data = get_array({});
	// create a primary key and create an index on the primary key
	const dataIndex = {};
	data.forEach((row, index) => {
		row.index_ = `id${index}`;
		dataIndex[`id${index}`] = index;
	});
	const pageLength = 100;
	//  initial data, filters and sorts
	let filteredData;
	let { filters, sorts, params, startIndex, stopIndex } = e;
	let lastTimeStamp = new Date().getTime();
	if (filters) {
		filteredData = data.filter(filtersFunction(filters, params, data, {}));
	} else {
		filteredData = data.map(row => row);
	}
	// data must not be sorted to keep valid index
	if (sorts) {
		filteredData.sort(sortsFunction(sorts));
	}
	// apply updated data on data to keep consistent sorts and filters
	const update = updatedRows => {
		let timeStamp = lastTimeStamp,
			updated = false;
		Object.keys(updatedRows).forEach(key => {
			if (updatedRows[key].timeStamp > lastTimeStamp) {
				const row = updatedRows[key].rowUpdated;
				if (dataIndex[key] === undefined) {
					dataIndex[row.index_] = data.length;
					data.push(row);
				} else {
					const previousRow = data[dataIndex[key]];
					Object.keys(row).forEach(key => {
						if (
							utils.isDate(previousRow[key]) &&
							typeof row[key] === "string"
						) {
							previousRow[key] = new Date(row[key]);
						} else {
							previousRow[key] = row[key];
						}
					});
					// data[dataIndex[key]] = row;
				}
				timeStamp = Math.max(timeStamp, updatedRows[key].timeStamp);
			}
		});
		updated = lastTimeStamp !== timeStamp;
		lastTimeStamp = timeStamp;
		return updated;
	};
	// sorts
	const sort = sorts => {
		if (sorts.length) {
			filteredData.sort(sortsFunction(sorts));
		} else if (filters) {
			filteredData = data.filter(
				filtersFunction(filters, params, data, {})
			);
		}
	};
	// filters
	const filter = filters => {
		if (Object.keys(filters).length) {
			filteredData = data.filter(
				filtersFunction(filters, params, data, {})
			);
		} else {
			filteredData = data.map(row => row);
			if (sorts) {
				filteredData.sort(sortsFunction(sorts));
			}
		}
	};
	const paginationManager = page => {
		let updated = false;
		if (page.updatedRows) {
			updated = update(page.updatedRows);
		}
		if (page.filters) {
			filter(page.filters);
			filters = page.filters;
		} else if (updated && filters) {
			filter(filters);
		}
		if (page.sorts) {
			sort(page.sorts);
			sorts = page.sorts;
		} else if (updated && sorts) {
			sort(sorts);
		}
		const filteredDataLength = filteredData.length;
		let start =
				page.startIndex === undefined ? startIndex : page.startIndex,
			stop = page.stopIndex === undefined ? stopIndex : page.stopIndex,
			pageStartIndex;

		if (start >= filteredDataLength) {
			start = 0;
		}
		pageStartIndex = start - start % pageLength;
		if (stop >= pageStartIndex + pageLength) {
			pageStartIndex = Math.max(0, start - 10);
		}
		if (pageStartIndex + pageLength >= filteredDataLength) {
			pageStartIndex = Math.max(0, filteredDataLength - pageLength);
			// startIndex == index - pageStartIndex;
		}
		const pageData = JSON.parse(
			JSON.stringify(
				filteredData.slice(pageStartIndex, pageStartIndex + pageLength)
			)
		);
		startIndex = start;
		stopIndex = stop;
		return new Promise(resolve => setTimeout(resolve, 20)).then(() => {
			return {
				page: pageData,
				pageStartIndex,
				pageLength: Math.min(filteredDataLength, pageLength),
				filteredDataLength,
				dataLength: data.length
			};
		});
	};

	return new Promise(resolve => setTimeout(resolve, 20)).then(
		() => paginationManager
	);
};
