import React, { Component } from "react";
import cx from "classnames";
import { ZebulonTable } from "./ZebulonTable";
import {
	metaDescriptions,
	functions,
	setPropertyAccessors
} from "./MetaDescriptions";
import {
	computeMeta,
	computeMetaFromData,
	functionsTable
} from "./utils/compute.meta";

import { utils } from "zebulon-controls";

export class ZebulonTableAndConfiguration extends Component {
	constructor(props) {
		super(props);
		let f = props.functions || functions;
		if (!Array.isArray(f)) {
			f = functionsTable(f);
		}
		let meta = props.meta;
		this.initMeta(
			props.meta,
			props.callbacks,
			props.data,
			f,
			props.sizes.zoom
		);
		computeMetaFromData(props.data, meta, props.sizes.zoom, f);
		this.state = {
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
		this.state.propertiesMeta = metaDescriptions(
			"properties",
			props.callbacks,
			this.state.functions
		);
		computeMeta(
			this.state.propertiesMeta,
			props.sizes.zoom,
			this.state.functions
		);
		this.state.functionsMeta = metaDescriptions(
			"functions",
			props.callbacks,
			this.state.functions
		);
		computeMeta(
			this.state.functionsMeta,
			props.sizes.zoom,
			this.state.functions
		);
		if (this.props.tabs) {
			this.props.tabs.forEach(tab => {
				this.state[tab.id] = tab.data;
				this.state[`${tab.id}Meta`] =
					tab.meta ||
					metaDescriptions(
						tab.id,
						props.callbacks,
						this.state.functions
					);
				computeMetaFromData(
					this.state[tab.id],
					this.state[`${tab.id}Meta`],
					props.sizes.zoom,
					this.state.functions
				);
			});
		}
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
				computeMetaFromData(data, meta_, zoom, functions);
			}
			setPropertyAccessors(meta_.properties, data);
		}
	};
	componentWillReceiveProps(nextProps) {
		if (nextProps.keyEvent !== this.props.keyEvent) {
			this.handleKeyDown(nextProps.keyEvent);
		} else {
			if (
				nextProps.data !== this.props.data ||
				nextProps.meta !== this.props.meta ||
				nextProps.filters !== this.props.filters ||
				nextProps.functions !== this.props.functions
			) {
				let f = nextProps.functions || functions;
				if (!Array.isArray(f)) {
					f = functionsTable(f);
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
			// if (nextProps.sizes.zoom !== this.props.sizes.zoom) {
			// 	this.zoomValue = nextProps.sizes.zoom || 1;
			// }
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
						this.setState({
							[tab.id]: tab.data,
							[`${tab.id}Meta`]: metaDescriptions(
								tab.id,
								this.props.callbacks,
								this.state.functions
							)
						});
						computeMetaFromData(
							this.state[tab.id],
							this.state[`${tab.id}Meta`],
							this.zoomValue,
							this.state.functions
						);
					}
				});
			}
		}
	}
	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.keyEvent === this.props.keyEvent;
	}
	handleKeyDown = e => {
		if (utils.isNavigationKey(e) || utils.isZoom(e)) {
			const tab = this.tabs[this.state.selectedTab].id;
			if (this[tab] && this[tab].handleKeyEvent) {
				return this[tab].handleKeyEvent(e);
			}
		}
	};
	// onGetData = ({ data, meta, status }) => {
	// 	if (data && meta.table.object === "dataset") {
	// 		let { propertiesMeta } = this.state;
	// 		propertiesMeta.properties = metaDescriptions(
	// 			"properties",
	// 			this.props.callbacks,
	// 			this.state.functions
	// 		).properties;
	// 		this.setState({ status });
	// 	}
	// 	return true;
	// };
	initTabs = props => {
		const tabs = [
			{
				id: "dataset",
				caption: "Dataset",
				content: (
					<ZebulonTable
						key="dataset"
						id="dataset"
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
						// onGetData={this.onGetData}
					/>
				)
			},
			{
				id: "properties",
				caption: "Properties",
				content: (
					<ZebulonTable
						key="properties"
						id="properties"
						visible={this.state.selectedTab === 1}
						isActive={this.state.selectedTab === 1}
						data={this.state.meta.properties}
						meta={this.state.propertiesMeta}
						updatedRows={this.state.propertiesUpdatedRows}
						sizes={this.state.sizes}
						onChange={this.onChangeProperties}
						onRowNew={this.onRowNew}
						onTableEnter={this.onTableEnter}
						functions={this.state.functions}
						status={this.state.status}
						params={props.params}
						keyEvent={null}
						ref={ref => (this.properties = ref)}
						errorHandler={{}}
						// navigationKeyHandler={this.props.navigationKeyHandler}
					/>
				)
			},
			{
				id: "functions",
				caption: "Functions",
				content: (
					<ZebulonTable
						key="functions"
						id="functions"
						visible={this.state.selectedTab === 2}
						isActive={this.state.selectedTab === 2}
						data={this.state.functions}
						meta={this.state.functionsMeta}
						updatedRows={this.state.functionUpdatedRows}
						sizes={this.state.sizes}
						functions={this.state.functions}
						params={props.params}
						onTableEnter={this.onTableEnter}
						keyEvent={null}
						ref={ref => (this.functions = ref)}
						errorHandler={{}}
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
							key={tab.id}
							id={tab.id}
							visible={this.state.selectedTab === tabs.length}
							data={this.state[tab.id]}
							meta={this.state[`${tab.id}Meta`]}
							updatedRows={this.state[`${tab.id}UpdatedRows`]}
							sizes={this.state.sizes}
							functions={this.state.functions}
							params={props.params}
							onTableEnter={this.onTableEnter}
							keyEvent={null}
							ref={ref => (this[tab.id] = ref)}
							errorHandler={{}}
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
					// console.log("selectedTab", index);
					computeMeta(
						this.state.meta,
						this.zoomValue,
						this.state.functions
					);
					this.setState({ selectedTab: index });
				}
			});
		} else {
			this.setState({ selectedTab: index });
		}
	};
	// onRowNew = ({ row }) => {
	// 	computeMeta(this.state.meta, this.state.functions);
	// };
	render() {
		if (this.props.status.loading || this.props.status.loadingConfig) {
			return <div>Loading data...</div>;
		} else if (this.props.status.error) {
			if (this.props.status.error.message === "No rows retrieved") {
				return (
					<div style={{ width: "max-content" }}>
						No rows retrieved
					</div>
				);
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
			<div style={{ fontSize: `${zoomValue * 100}%` }}>
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
