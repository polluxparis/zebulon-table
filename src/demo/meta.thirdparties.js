import React from "react";
import { utils } from "zebulon-controls";
export const getPrivileges = (user, object) => {
	return { default_: true };
};
// {table:true,
// actions:{insert:true,delete:false}
// properties:{id:false}}
export const applyPrivileges = (objectMeta, privileges) => {
	if (!privileges) {
		return null;
	}
	if (privileges.table) {
		if (!utils.nullValue(privileges.table, privileges.default_)) {
			objectMeta.table.editable = false;
		}
		// if (objectMeta.actions) {
		const privilegesActions = privileges.actions || {};
		objectMeta.table.actions.forEach(action => {
			if (
				!utils.nullValue(
					privilegesActions[action.id || action.type],
					privileges.default_
				)
			) {
				action.enable = false;
			}
		});

		const privilegesProperties = privileges.properties || {};
		objectMeta.properties.forEach(property => {
			if (
				!utils.nullValue(
					privilegesProperties[property.id],
					privileges.default_
				)
			) {
				property.enable = false;
			}
		});
	}
	return objectMeta;
};
export const applyVisibles = (objectMeta, visibles) => {
	if (!visibles) {
		return objectMeta;
	}
	objectMeta.properties.forEach(property => {
		property.hidden = !utils.nullValue(
			visibles[property.id],
			visibles.default_
		);
	});
};
// for testing
const getIds = (updatedRows, meta, data) => {
	Object.keys(updatedRows).forEach(index => {
		if (updatedRows[index].new_) {
			const row = data[index];
			if (utils.isNullOrUndefined(row[meta.table.primaryKey])) {
				row[meta.table.primaryKey] = row.index_;
			}
		}
	});
	return data.filter(row => !(updatedRows[row.index_] || {}).deleted_);
};
// globals
const isSelected = ({ row }) => !utils.isNullOrUndefined(row.index_);
// currencies
const selectCurrencies = () =>
	currencies.reduce((acc, currency) => {
		acc[currency.id] = { id: currency.id, caption: currency.code };
		return acc;
	}, {});
const serverSelectCurrencies = () =>
	new Promise(resolve => setTimeout(resolve, 20)).then(() => currencies);
const serverSaveCurrencies = ({ meta, data, updatedRows }) => {
	currencies = getIds(updatedRows, meta, data);
	return currencies;
};

export let currencies = [
	{ id: 0, code: "EUR", label: "Euro" },
	{ id: 1, code: "GBP", label: "British pound" },
	{ id: 2, code: "USD", label: "US dollar" },
	{ id: 3, code: "CAD", label: "Canadian dollar" },
	{ id: 4, code: "CNY", label: "Yuan" },
	{ id: 5, code: "JPY", label: "Yen" },
	{ id: 6, code: "DKK", label: "Danish krone" }
];
export const metaCurrencies = {
	table: {
		object: "currencies",
		editable: true,
		primaryKey: "id",
		select: serverSelectCurrencies,
		onSave: serverSaveCurrencies,
		onSaveBefore: null,
		onSaveAfter: null,
		// },
		actions: [
			{
				type: "insert",
				caption: "New",
				enable: true
			},
			{
				type: "delete",
				caption: "Delete",
				enable: isSelected
			},
			{
				type: "duplicate",
				caption: "Duplicate",
				enable: isSelected
			},
			{
				type: "save",
				caption: "Save",
				enable: true
			}
		]
	},
	row: {
		onQuit: null
	},
	properties: [
		{
			id: "id",
			width: 50,
			dataType: "number",
			editable: false,
			hidden: true
		},
		{
			id: "code",
			caption: "Code",
			width: 50,
			dataType: "string",
			editable: true,
			mandatory: true
		},
		{
			id: "label",
			caption: "Name",
			width: 200,
			dataType: "string",
			editable: true
		}
	]
};
// countries
const getCountryFlag = row => {
	if (row.code === "" || utils.isNullOrUndefined(row.code)) {
		return null;
	}
	return (
		<img
			height="100%"
			width="100%"
			padding="unset"
			src={`//www.drapeauxdespays.fr/data/flags/small/${row.code.toLowerCase()}.png`}
		/>
	);
};
const serverSelectCountries = () =>
	new Promise(resolve => setTimeout(resolve, 20)).then(() => countries);
const serverSaveCountries = ({ meta, data, updatedRows }) => {
	countries = getIds(updatedRows, meta, data);
	return countries;
};
export let countries = [
	{ id: 0, code: "FR", label: "France", currencyId: 0 },
	{ id: 1, code: "GB", label: "United kingdom", currencyId: 1 },
	{ id: 2, code: "US", label: "United states of America", currencyId: 2 },
	{ id: 3, code: "CA", label: "Canada", currencyId: 3 },
	{ id: 4, code: "CN", label: "China", currencyId: 4 },
	{ id: 5, code: "IT", label: "Italy", currencyId: 0 },
	{ id: 6, code: "DE", label: "Germany", currencyId: 0 },
	{ id: 7, code: "BE", label: "Belgium", currencyId: 0 },
	{ id: 8, code: "IE", label: "Ireland", currencyId: 0 },
	{ id: 9, code: "ES", label: "Spain", currencyId: 0 },
	{ id: 10, code: "NL", label: "Netherland", currencyId: 0 },
	{ id: 11, code: "JP", label: "Japan", currencyId: 5 }
];
export const metaCountries = {
	table: {
		object: "countries",
		editable: true,
		primaryKey: "id",
		select: serverSelectCountries,
		fillOptions: "background",
		onSave: serverSaveCountries,
		onSaveBefore: null,
		onSaveAfter: null,
		actions: [
			{
				type: "insert",
				caption: "New",
				enable: true
			},
			{
				type: "delete",
				caption: "Delete",
				enable: isSelected
			},
			{
				type: "duplicate",
				caption: "Duplicate",
				enable: isSelected
			},
			{
				type: "save",
				caption: "Save",
				enable: true
			}
		]
	},
	row: { onQuit: null },
	properties: [
		{
			id: "id",
			width: 100,
			dataType: "number",
			editable: false,
			hidden: true
		},
		{
			id: "code",
			caption: "Code",
			width: 50,
			dataType: "string",
			editable: true,
			mandatory: true
		},
		{
			id: "label",
			caption: "Name",
			width: 200,
			dataType: "string",
			editable: true,
			mandatory: true
		},
		{
			id: "flag",
			caption: "Flag",
			width: 40,
			accessor: getCountryFlag
		},
		{
			id: "currencyId",
			caption: "Currency",
			width: 100,
			dataType: "string",
			editable: true,
			mandatory: true,
			select: selectCurrencies,
			filterType: "values"
		}
	]
};

// const isAllowed = e => true;
const serverSelectThirdparties = () =>
	new Promise(resolve => setTimeout(resolve, 20)).then(() => thirdparties);
const serverSaveThirdparties = ({ meta, data, updatedRows }) => {
	thirdparties: getIds(updatedRows, meta, data);
};
export let thirdparties = [
	{
		id: 0,
		code: "AAA",
		label: "Aaaaaaa",
		countryId: 0,
		countryCd: "FR",
		currencyId: 0,
		rate: "AAA",
		status: "Authorised"
	}
];
export const metaThirdparties = {
	table: {
		object: "thirdparties",
		editable: true,
		select: serverSelectThirdparties,
		onSave: serverSaveThirdparties,
		onSaveBefore: null,
		onSaveAfter: null,
		actions: [
			{
				type: "insert",
				caption: "New",
				enable: true
			},
			{
				type: "delete",
				caption: "Delete",
				enable: isSelected
			},
			{
				type: "duplicate",
				caption: "Duplicate",
				enable: isSelected
			},
			{
				type: "save",
				caption: "Save",
				enable: true
			}
		]
	},
	row: {},
	properties: [
		{
			id: "id",
			width: 100,
			dataType: "number",
			editable: false,
			hidden: true
		},
		{
			id: "code",
			caption: "Code",
			width: 50,
			dataType: "string",
			editable: true,
			mandatory: true
		},
		{
			id: "label",
			caption: "Name",
			width: 200,
			dataType: "string",
			editable: true
		},
		{
			id: "countryId",
			width: 100,
			dataType: "number",
			hidden: true
		},
		{
			id: "countryCd",
			caption: "Country",
			width: 100,
			dataType: "string",
			editable: true,
			foreignKey: {
				object: "countries",
				fk: "countryId",
				editable: false,
				visibles: { code: true, name: true }
			},
			filterType: "values"
		},
		{
			id: "currencyId",
			caption: "Currency",
			width: 100,
			dataType: "string",
			select: selectCurrencies,
			filterType: "values"
		},
		{
			id: "rate",
			caption: "Rate",
			width: 100,
			dataType: "string",
			editable: true,
			select: [
				"",
				"AAA",
				"AA+",
				"AA",
				"AA-",
				"A+",
				"A",
				"A-",
				"BBB",
				"BB+",
				"BB",
				"BB-",
				"B+",
				"B",
				"B-",
				"C",
				"D"
			],
			filterType: "values"
		},
		{
			id: "status",
			caption: "Status",
			width: 100,
			dataType: "string",
			editable: true,
			select: [
				"",
				"Authorised",
				"Subject to authorisation",
				"Forbidden",
				"Under inquiry"
			],
			filterType: "values"
		}
	]
};

