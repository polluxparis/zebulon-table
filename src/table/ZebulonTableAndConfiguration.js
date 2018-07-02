import React, { Component } from "react";
import cx from "classnames";
import { utils, accessors } from "zebulon-controls";
import { ZebulonTable } from "./ZebulonTable";
import {
	metaDescriptions,
	metaFunctions,
	setPropertyAccessors
} from "./MetaDescriptions";
import {
	computeMeta,
	computeMetaFromData,
	getUpdatedRows,
	computeData,
	getRowStatus,
	computeAnalytic
} from "./utils";
export class ZebulonTableAndConfiguration extends Component {
	constructor(props) {
		super(props);
		let f = props.functions;
		f.mergeFunctionsObjects([accessors, metaFunctions]);
		const meta = props.meta;
		this.initMeta(
			props.meta,
			props.callbacks,
			props.data,
			f,
			props.sizes.zoom
		);
		computeMetaFromData(props.data, meta, props.sizes.zoom, f);
		const state = {
			selectedTab: props.selectedTab || 0,
			data: props.data,
			meta,
			updatedRows: props.updatedRows || {},
			propertiesUpdatedRows: {},
			functionsUpdatedRows: {},
			functions: f,
			functionsData: f.getFunctionsArray(
				(meta.table || {}).object || "dataset",
				undefined,
				(meta.table || {}).source
			),
			sizes: props.sizes,
			filters: props.filters,
			status: {},
			callbacks: {
				applyFunctions: this.applyFunctions,
				applyProperties: this.applyProperties,
				...(props.callbacks || {})
			}
		};
		this.zoomValue = props.sizes.zoom || 1;
		// f = utils.mergeFunctions([accessors, metaFunctions], "properties");
		this.metaDescriptions = metaDescriptions(
			(meta.table || {}).object || "dataset",
			(meta.table || {}).source,
			state.functions,
			state.callbacks
		);
		meta.table.actions = this.metaDescriptions.dataset.table.actions;
		state.propertiesMeta = this.metaDescriptions.properties;
		computeMeta(state.propertiesMeta, props.sizes.zoom, state.functions);
		state.functionsProperties = f;
		// f = utils.mergeFunctions([accessors, metaFunctions], "functions");
		state.functionsMeta = this.metaDescriptions.functions;
		computeMeta(state.functionsMeta, props.sizes.zoom, state.functions);
		state.functionsFunctions = f;
		this.initTabsState(state, props, true);
		this.initTabs(state, props);
		this.state = state;
		// this.errorHandler = this.props.errorHandler || {};
	}
	initTabsState = (state, props, constructor) => {
		if (props.tabs) {
			props.tabs.forEach((tab, index) => {
				if (tab.props === undefined) {
					tab.props = {};
				}
				if (tab.selected && state.selectedTab !== index + 3) {
					state.selectedTab = index + 3;
				}
				if (
					constructor ||
					!this.props.tabs ||
					!this.props.tabs[index] ||
					this.props.tabs[index].id !== tab.id ||
					tab.data !== this.props.tabs[index].data
				) {
					if (tab.props.functions) {
						state.functions.mergeFunctionsObjects(
							tab.props.functions
						);
					}
					state[tab.id] = tab.data;
					state[`${tab.id}Meta`] =
						tab.meta || this.metaDescriptions[tab.id];
					if (state[`${tab.id}Meta`]) {
						computeMetaFromData(
							state[tab.id],
							state[`${tab.id}Meta`],
							props.sizes.zoom,
							state.functions
						);
						state[`${tab.id}UpdatedRows`] = tab.updatedRows;
					}
				}
			});
		}
		return state;
	};
	initMeta = (meta_, callbacks, data, functions, zoom) => {
		if (!meta_.table) {
			const meta = metaDescriptions(
				"dataset",
				undefined,
				functions,
				callbacks
			).dataset;
			meta_.table = meta.table;
			meta_.row = meta.row;
			meta_.properties = meta.properties;
			// meta = meta_;
		}
		if (data && Array.isArray(data) && data.length && meta_.properties) {
			if (meta_.properties.length === 0) {
				computeMetaFromData(data, meta_, zoom, functions);
			}
			setPropertyAccessors(meta_.properties, data);
		}
	};
	componentWillReceiveProps(nextProps) {
		let state = {};
		if (nextProps.keyEvent !== this.props.keyEvent) {
			this.handleKeyEvent(nextProps.keyEvent);
		} else {
			if (
				nextProps.data !== this.props.data ||
				nextProps.meta !== this.props.meta ||
				nextProps.filters !== this.props.filters
			) {
				this.initMeta(
					nextProps.meta,
					this.state.callbacks,
					nextProps.data,
					this.state.functions,
					nextProps.sizes.zoom
				);
				state = {
					data: nextProps.data,
					meta: nextProps.meta,
					functions: this.state.functions,
					filters: nextProps.filters
				};
			}
			if (
				nextProps.updatedRows &&
				nextProps.updatedRows !== this.props.updatedRows
			) {
				state.updatedRows = nextProps.updatedRows;
			}
			if (nextProps.sizes !== this.props.sizes) {
				state.sizes = nextProps.sizes;
			}
			if (nextProps.tabs) {
				state = this.initTabsState(state, nextProps);
			}
			this.setState(state);
			this.initTabProps({ ...this.state, ...state }, nextProps);
		}
	}
	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.keyEvent === this.props.keyEvent;
	}
	handleKeyEvent = e => {
		const tab = this.tabs[this.state.selectedTab].id;
		if (this[tab] && this[tab].handleKeyEvent) {
			return this[tab].handleKeyEvent(e);
		}
	};
	onChangeProperties = ({ value, previousValue, column, row }) => {
		if (
			["select", "dataType"].includes(column.id) &&
			value !== previousValue &&
			[value, previousValue, row.dataType].includes("joined object")
		) {
			this.changedProperties = true;
		}
	};
	onRowDelete = ({ row, status }) => {
		console.log(row, status);
		row.deleted_ = status.deleted_;
		this.changedProperties = true;
	};
	onRowNew = message => {
		this.changedProperties = true;
	};
	onGetData = ({ data, meta, status }) => {
		if (data && meta.table.object === "dataset" && this.changedProperties) {
			const { functions, sizes } = this.state;
			this.changedProperties = false;
			this.initMeta(
				meta,
				this.state.callbacks,
				data,
				functions,
				sizes.zoom
			);
		}
		return true;
	};
	applyFunctions = ({ updatedRows }) => {
		const { functions } = this.state;
		getUpdatedRows(updatedRows)
			.filter(
				status =>
					(status.row || {}).isLocal ||
					(status.rowUpdated || {}).isLocal
			)
			.forEach(status => {
				const row = status.rowUpdated || status.row;
				if (status.row) {
					functions.removeFunction(
						status.row.visibility,
						status.row.tp,
						status.row.id
					);
				}
				if (status.rowUpdated) {
					functions.setInitialFunction(
						status.rowUpdated.visibility,
						status.rowUpdated.tp,
						status.rowUpdated.id,
						status.rowUpdated.caption,
						status.rowUpdated.functionText
					);
				}
			});
		computeMeta(this.state.meta, this.zoomValue, this.state.functions);
		return true;
	};
	applyProperties = ({ data }) => {
		const { meta } = this.state;
		computeMeta(
			{ ...meta, properties: data },
			this.zoomValue,
			this.state.functions
		);
		meta.properties = data.map(row => ({ ...row }));
		// compute new or modified joined objects
		if (
			-1 !==
			meta.properties.findIndex(row => {
				const status = getRowStatus(
					this.state.propertiesUpdatedRows,
					row
				);
				return (
					row.dataType === "joined object" &&
					row.accessor !== undefined &&
					row.select !== undefined &&
					(status.new_ ||
						(status.updated_ &&
							(status.row.accessor !==
								status.rowUpdated.accessor ||
								status.row.select !==
									status.rowUpdated.select ||
								status.row.dataType !== "joined object")))
				);
			})
		) {
			computeData(this.state.data, meta);
			setPropertyAccessors(meta.properties, this.state.data);
		}
		// compute new or modified analytics functions
		const properties = meta.properties.filter(row => {
			const status = getRowStatus(this.state.propertiesUpdatedRows, row);
			return (
				(row.aggregation || row.analytic) &&
				typeof row.accessorFunction === "function" &&
				!row.hidden &&
				(status.new_ ||
					(status.updated_ &&
						(status.row.accessor !== status.rowUpdated.accessor ||
							status.row.analytic !==
								status.rowUpdated.analytic)))
			);
		});
		properties.forEach(property => {
			computeAnalytic(this.state.data, property);
		});
		return true;
	};
	initTabs = (state, props) => {
		const {
			params,
			utils,
			configurationMenus,
			id,
			navigationKeyHandler,
			errorHandler
		} = props;
		const {
			selectedTab,
			data,
			meta,
			filters,
			updatedRows,
			functions,
			status,
			// functionsFunctions,
			functionUpdatedRows,
			functionsMeta,
			functionsData,
			propertiesMeta,
			propertiesUpdatedRows
		} = state;
		const menu = configurationMenus || {};
		this.tabs = [
			{
				id: "dataset",
				caption: "Dataset",
				index: 0,

				content: (
					<ZebulonTable
						key={0}
						id={`${id}-dataset`}
						data={data}
						meta={meta}
						filters={filters}
						updatedRows={updatedRows}
						functions={functions}
						params={params}
						keyEvent={null}
						onTableEnter={this.onTableEnter}
						ref={ref => (this.dataset = ref)}
						errorHandler={errorHandler}
						navigationKeyHandler={navigationKeyHandler}
						onGetData={this.onGetData}
						utils={utils}
						contextualMenu={
							menu.dataset ? menu.dataset(this) : undefined
						}
					/>
				)
			},
			{
				id: "properties",
				caption: "Properties",
				index: 1,
				content: (
					<ZebulonTable
						key={1}
						id={`${id}-properties`}
						data={[...meta.properties]}
						meta={propertiesMeta}
						updatedRows={propertiesUpdatedRows}
						onChange={this.onChangeProperties}
						onRowDelete={this.onRowDelete}
						onRowNew={this.onRowNew}
						functions={functions}
						status={status}
						params={params}
						keyEvent={null}
						ref={ref => (this.properties = ref)}
						errorHandler={{}}
						utils={utils}
						contextualMenu={
							menu.properties ? menu.properties(this) : undefined
						}
					/>
				)
			},
			{
				id: "functions",
				caption: "Functions",
				index: 2,

				content: (
					<ZebulonTable
						key={2}
						id={`${id}-functions`}
						data={functionsData}
						meta={functionsMeta}
						updatedRows={functionUpdatedRows}
						functions={functions}
						params={params}
						keyEvent={null}
						ref={ref => (this.functions = ref)}
						errorHandler={{}}
						utils={utils}
						contextualMenu={
							menu.functions ? menu.functions(this) : undefined
						}
					/>
				)
			}
		];
		this.initTabProps(state, props);
		return this.tabs;
	};
	initTabProps = (state, props) => {
		const { selectedTab, sizes } = state;
		const { params, utils, id, configurationMenus } = props;
		const menu = configurationMenus || {};
		if (props.tabs) {
			props.tabs.forEach((tab, index) => {
				if (tab !== this.tabs[3 + index]) {
					const Content = tab.content ? tab.content : ZebulonTable;
					this.tabs[3 + index] = {
						id: tab.id,
						caption: tab.caption,
						props: tab.props,
						index: 3 + index,
						content: (
							<Content
								key={3 + index}
								id={`${id}-${tab.id}`}
								data={state[tab.id]}
								meta={state[`${tab.id}Meta`]}
								updatedRows={state[`${tab.id}UpdatedRows`]}
								sizes={sizes}
								functions={state.functions}
								params={params}
								keyEvent={null}
								ref={ref => (this[tab.id] = ref)}
								errorHandler={{}}
								utils={utils}
								contextualMenu={
									menu[tab.id] ? (
										menu[tab.id](this)
									) : (
										undefined
									)
								}
							/>
						)
					};
				}
			});
		}
		if (this.tabs.length > 3 + (props.tabs || []).length) {
			this.tabs.splice(
				3 + (props.tabs || []).length,
				this.tabs.length - 3
			);
		}
	};
	onSelectTab = index => {
		const { selectedTab } = this.state;
		const canQuit = this[this.tabs[selectedTab].id].table
			? this[this.tabs[selectedTab].id].table.canQuit
			: null;
		if (canQuit) {
			canQuit("quit", ok => {
				if (ok) {
					this.setState({ selectedTab: index });
				}
			});
		} else {
			this.setState({ selectedTab: index });
		}
	};

	render() {
		if (this.props.status.loading || this.props.status.loadingConfig) {
			return <div>Loading data...</div>;
		} else if (this.props.status.error) {
			if (this.props.status.error.message === "No rows retrieved") {
			} else {
				return (
					<div style={{ color: "red", width: "max-content" }}>
						<p>{this.props.status.error.type}</p>
						<p>{this.props.status.error.message}</p>
					</div>
				);
			}
		}
		const zoomValue = this.zoomValue;
		return (
			<div>
				<div
					style={{
						display: "flex",
						height: 25 * zoomValue
					}}
					className="zebulon-tabs-list"
				>
					{this.tabs.map((tab, index) => (
						<div
							key={index}
							style={{
								width: `${(100 / this.tabs.length).toFixed(2)}%`
							}}
							className={cx({
								"zebulon-tabs-tab": true,
								"zebulon-tabs-tab-selected":
									index === this.state.selectedTab
							})}
							onClick={() => this.onSelectTab(index)}
						>
							{tab.caption}
						</div>
					))}
				</div>
				<div
					style={{
						height: this.props.sizes.height - 30 * zoomValue
					}}
				>
					{this.tabs.map(tab =>
						React.cloneElement(tab.content, {
							...tab.props,
							visible: tab.index === this.state.selectedTab,
							isActive: tab.index === this.state.selectedTab,
							sizes: this.state.sizes
						})
					)}
				</div>
			</div>
		);
	}
}
