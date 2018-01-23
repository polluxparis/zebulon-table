import React from "react";
import { Observable } from "rx-lite";
import { getMockDatasource } from "./mock";
import { filtersFunction, sortsFunction } from "../table/utils";

// -------------------------------------------
// simulation of the different ways to provide
// a dataset to the table and server communication
// -------------------------------------------
// array
// -------------------------------------------
export const get_array = ({ params, filters }) =>
	getMockDatasource(1, 200, 40, 3);
// -------------------------------------------
// promise
// -------------------------------------------
export const get_promise = ({ params, filters }) => {
	let data = getMockDatasource(1, 200, 40, 3);
	if (filters) {
		data = data.filter(filtersFunction(filters, params, data));
	}
	return new Promise(resolve => setTimeout(resolve, 20)).then(() => data);
};
// -------------------------------------------
// observable
// -------------------------------------------
export const get_observable = ({ params, filters, sorts }) => {
	const data = getMockDatasource(1, 200, 40, 3);
	if (sorts) {
		data.sort(sortsFunction(sorts));
	}
	const data2 = [];
	let i = 0;
	while (i < data.length) {
		data2.push(data.slice(i, (i += 1000)));
	}
	return Observable.interval(100)
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
	const data = getMockDatasource(1, 200, 40, 3);
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
		filteredData = data.filter(filtersFunction(filters, params, data));
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
					data[dataIndex[key]] = row;
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
			filteredData = data.filter(filtersFunction(filters, params, data));
		}
	};
	// filters
	const filter = filters => {
		if (Object.keys(filters).length) {
			filteredData = data.filter(filtersFunction(filters, params, data));
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
