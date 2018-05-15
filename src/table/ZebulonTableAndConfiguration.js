import React, { Component } from "react";
import cx from "classnames";
import { utils, accessors } from "zebulon-controls";
import { ZebulonTable } from "./ZebulonTable";
import {
	metaDescriptions,
	functions,
	setPropertyAccessors
} from "./MetaDescriptions";
import { computeMeta, computeMetaFromData } from "./utils/compute.meta";
export class ZebulonTableAndConfiguration extends Component {
	constructor(props) {
		super(props);
		let f = props.functions; // || functions;
		// functions
		if (!Array.isArray(f)) {
			f = utils.mergeFunctions(
				[accessors, functions, f || {}],
				props.meta.table.object || "dataset"
			);
		}
		let meta = props.meta;
		this.initMeta(
			props.meta,
			props.callbacks,
			props.data,
			f,
			props.sizes.zoom
		);
		computeMetaFromData(props.data, meta, props.sizes.zoom, f, props.utils);
		const state = {
			selectedTab: 0,
			data: props.data,
			meta,
			updatedRows: props.updatedRows || {},
			propertiesUpdatedRows: {},
			functionsUpdatedRows: {},
			functions: f,
			sizes: props.sizes,
			filters: props.filters,
			status: {}
		};
		this.zoomValue = props.sizes.zoom || 1;
		f = utils.mergeFunctions([accessors, functions], "properties");
		state.propertiesMeta = metaDescriptions(
			"properties",
			props.callbacks,
			state.functions
		);
		computeMeta(
			state.propertiesMeta,
			props.sizes.zoom,
			state.functions,
			props.utils
		);
		state.functionsProperties = f;
		f = utils.mergeFunctions([accessors, functions], "functions");
		state.functionsMeta = metaDescriptions(
			"functions",
			props.callbacks,
			state.functions
		);
		computeMeta(
			state.functionsMeta,
			props.sizes.zoom,
			state.functions,
			props.utils
		);
		state.functionsFunctions = f;
		if (this.props.tabs) {
			this.props.tabs.forEach(tab => {
				f = utils.mergeFunctions([accessors, functions], tab.id);
				// f = utils.functionsTable({ [tab.id]: functions[tab.id] });
				state[tab.id] = tab.data;
				state[`${tab.id}Meta`] =
					tab.meta ||
					metaDescriptions(tab.id, props.callbacks, state.functions);
				computeMetaFromData(
					state[tab.id],
					state[`${tab.id}Meta`],
					props.sizes.zoom,
					state.functions,
					props.utils
				);
				state[`${tab.id}Functions`] = f;
			});
		}
		this.state = state;
		this.errorHandler = this.props.errorHandler || {};
	}
	initMeta = (meta_, callbacks, data, functions, zoom) => {
		if (!meta_.table) {
			const meta = metaDescriptions("dataset", callbacks, functions);
			meta_.table = meta.table;
			meta_.row = meta.row;
			meta_.properties = meta.properties;
			// meta = meta_;
		}
		if (data && Array.isArray(data) && data.length && meta_.properties) {
			if (meta_.properties.length === 0) {
				computeMetaFromData(
					data,
					meta_,
					zoom,
					functions,
					this.props.utils
				);
			}
			setPropertyAccessors(meta_.properties, data);
		}
	};
	componentWillReceiveProps(nextProps) {
		if (nextProps.keyEvent !== this.props.keyEvent) {
			this.handleKeyEvent(nextProps.keyEvent);
		} else {
			if (
				nextProps.data !== this.props.data ||
				nextProps.meta !== this.props.meta ||
				nextProps.filters !== this.props.filters ||
				nextProps.functions !== this.props.functions
			) {
				let f = nextProps.functions; // || functions;
				if (!Array.isArray(f)) {
					f = utils.functionsTable(f);
				}
				this.initMeta(
					nextProps.meta,
					nextProps.callbacks,
					nextProps.data,
					f,
					nextProps.sizes.zoom
				);

				this.setState({
					data: nextProps.data,
					meta: nextProps.meta,
					functions: f,
					filters: nextProps.filters
				});
			}
			if (
				nextProps.updatedRows &&
				nextProps.updatedRows !== this.props.updatedRows
			) {
				this.setState({ updatedRows: nextProps.updatedRows });
			}
			if (nextProps.sizes !== this.props.sizes) {
				this.setState({ sizes: nextProps.sizes });
			}
			if (nextProps.tabs) {
				nextProps.tabs.forEach((tab, index) => {
					if (
						!this.props.tabs ||
						!this.props.tabs[index] ||
						this.props.tabs[index].id !== tab.id ||
						tab.data !== this.props.tabs[index].data
					) {
						const meta =
							metaDescriptions(
								tab.id,
								this.props.callbacks,
								this.state.functions
							) || tab.meta;
						this.setState({
							[tab.id]: tab.data,
							[`${tab.id}Meta`]: meta
						});
						computeMetaFromData(
							this.state[tab.id],
							this.state[`${tab.id}Meta`],
							this.zoomValue,
							this.state.functions,
							this.props.utils
						);
					}
				});
			}
		}
	}
	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.keyEvent === this.props.keyEvent;
	}
	handleKeyEvent = e => {
		// if (utils.isNavigationKey(e) || utils.isZoom(e)) {
		const tab = this.tabs[this.state.selectedTab].id;
		if (this[tab] && this[tab].handleKeyEvent) {
			return this[tab].handleKeyEvent(e);
		}
		// }
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
	onGetData = ({ data, meta, status }) => {
		if (data && meta.table.object === "dataset" && this.changedProperties) {
			const { functions, sizes } = this.state;
			this.changedProperties = false;
			this.initMeta(
				meta,
				this.props.callbacks,
				data,
				functions,
				sizes.zoom
			);
		}
		return true;
	};
	initTabs = props => {
		const tabs = [
			{
				id: "dataset",
				caption: "Dataset",
				content: (
					<ZebulonTable
						key={0}
						id={`${props.id}-dataset`}
						visible={this.state.selectedTab === 0}
						isActive={this.state.selectedTab === 0}
						data={this.state.data}
						meta={this.state.meta}
						filters={this.state.filters}
						updatedRows={this.state.updatedRows}
						sizes={this.state.sizes}
						functions={this.state.functions}
						params={props.params}
						keyEvent={null}
						onTableEnter={this.onTableEnter}
						ref={ref => (this.dataset = ref)}
						errorHandler={this.errorHandler}
						navigationKeyHandler={this.props.navigationKeyHandler}
						onGetData={this.onGetData}
						utils={this.props.utils}
					/>
				)
			},
			{
				id: "properties",
				caption: "Properties",
				content: (
					<ZebulonTable
						key={1}
						id={`${props.id}-properties`}
						visible={this.state.selectedTab === 1}
						isActive={this.state.selectedTab === 1}
						data={this.state.meta.properties}
						meta={this.state.propertiesMeta}
						updatedRows={this.state.propertiesUpdatedRows}
						sizes={this.state.sizes}
						onChange={this.onChangeProperties}
						onRowNew={this.onRowNew}
						onTableEnter={this.onTableEnter}
						functions={this.state.functionsProperties}
						status={this.state.status}
						params={props.params}
						keyEvent={null}
						ref={ref => (this.properties = ref)}
						errorHandler={{}}
						utils={this.props.utils}
						// navigationKeyHandler={this.props.navigationKeyHandler}
					/>
				)
			},
			{
				id: "functions",
				caption: "Functions",
				content: (
					<ZebulonTable
						key={2}
						id={`${props.id}-functions`}
						visible={this.state.selectedTab === 2}
						isActive={this.state.selectedTab === 2}
						data={this.state.functions}
						meta={this.state.functionsMeta}
						updatedRows={this.state.functionUpdatedRows}
						sizes={this.state.sizes}
						functions={this.state.functionsFunctions}
						params={props.params}
						onTableEnter={this.onTableEnter}
						keyEvent={null}
						ref={ref => (this.functions = ref)}
						errorHandler={{}}
						utils={this.props.utils}
					/>
				)
			}
		];
		if (this.props.tabs) {
			this.props.tabs.forEach((tab, index) => {
				const Content = tab.content ? tab.content : ZebulonTable;
				tabs.push({
					id: tab.id,
					caption: tab.caption,
					content: (
						<Content
							key={3 + index}
							id={`${props.id}-${tab.id}`}
							visible={this.state.selectedTab === tabs.length}
							data={this.state[tab.id]}
							meta={this.state[`${tab.id}Meta`]}
							updatedRows={this.state[`${tab.id}UpdatedRows`]}
							sizes={this.state.sizes}
							functions={this.state[`${tab.id}Functions`]}
							params={props.params}
							onTableEnter={this.onTableEnter}
							keyEvent={null}
							ref={ref => (this[tab.id] = ref)}
							errorHandler={{}}
							utils={this.props.utils}
						/>
					)
				});
			});
		}

		return tabs;
	};

	// onTableEnter = ({ meta }) => {
	// 	computeMeta(meta, this.zoomValue, this.state.functions);
	// };
	onSelectTab = index => {
		const { selectedTab } = this.state;
		const canQuit = this[this.tabs[selectedTab].id].table
			? this[this.tabs[selectedTab].id].table.canQuit
			: null;
		if (canQuit) {
			canQuit("quit", ok => {
				if (ok) {
					computeMeta(
						this.state.meta,
						this.zoomValue,
						this.state.functions,
						this.props.utils
					);
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
				// return (
				// 	<div style={{ width: "max-content" }}>
				// 		No rows retrieved
				// 	</div>
				// );
			} else {
				return (
					<div style={{ color: "red", width: "max-content" }}>
						<p>{this.props.status.error.type}</p>
						<p>{this.props.status.error.message}</p>
					</div>
				);
			}
		}
		this.tabs = this.initTabs(this.props);
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
					{this.tabs.map(tab => tab.content)}
				</div>
			</div>
		);
	}
}
