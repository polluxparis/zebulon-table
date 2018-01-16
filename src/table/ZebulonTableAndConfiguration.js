import React, { Component } from "react";
import cx from "classnames";
import { ZebulonTable } from "./ZebulonTable";
import { metaDescriptions, functions } from "./MetaDescriptions";
import { computeMeta, computeMetaFromData, functionsTable } from "./utils";

import { utils } from "zebulon-controls";

export class ZebulonTableAndConfiguration extends Component {
	constructor(props) {
		super(props);
		this.sizes = {
			...props.sizes,
			height: props.sizes.height - 30 * (props.sizes.zoom || 1),
			zoom: this.zoomValue
		};
		let f = props.functions || functions;
		if (!Array.isArray(f)) {
			f = functionsTable(f);
		}
		let meta = props.meta;
		if (!props.meta.table) {
			meta = metaDescriptions("dataset", props.callbacks, functions);
			props.meta.table = meta.table;
			props.meta.row = meta.row;
			props.meta.properties = meta.properties;
			meta = props.meta;
		}

		// meta = props.meta;
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
			filters: props.filters
		};
		this.zoomValue = props.sizes.zoom || 1;
		this.state.propertiesMeta = metaDescriptions(
			"properties",
			props.callbacks,
			this.state.functions,
			this.state.meta.properties
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
				this.state[`${tab.id}Meta`] = metaDescriptions(
					tab.id,
					props.callbacks,
					this.state.functions,
					this.state.meta.properties
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
	componentWillReceiveProps(nextProps) {
		if (
			nextProps.data !== this.props.data ||
			nextProps.meta !== this.props.meta ||
			nextProps.filters !== this.props.filters ||
			nextProps.functions !== this.props.functions
		) {
			this.setState({
				data: nextProps.data,
				meta: nextProps.meta,
				functions: nextProps.functions,
				filters: nextProps.filters
			});
		}
		if (
			nextProps.updatedRows &&
			nextProps.updatedRows !== this.props.updatedRows
		) {
			this.setState({
				updatedRows: nextProps.updatedRows
			});
		}
		if (nextProps.sizes.zoom !== this.props.sizes.zoom) {
			this.zoomValue = nextProps.sizes.zoom || 1;
		}
		if (nextProps.sizes !== this.props.sizes) {
			this.sizes = {
				...nextProps.sizes,
				height:
					nextProps.sizes.height - 30 * (nextProps.sizes.zoom || 1),
				zoom: this.zoomValue
			};
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
							this.state.functions,
							this.state.meta.properties
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
		if (nextProps.keyEvent !== this.props.keyEvent) {
			this.handleKeyDown(nextProps.keyEvent);
		}
	}
	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.keyEvent === this.props.keyEvent;
	}
	handleKeyDown = e => {
		const zoom = utils.isZoom(e);
		if (zoom) {
			e.preventDefault();
			this.zoomValue *= zoom === 1 ? 1.1 : 1 / 1.1;
			this.setState({ ...this.props.sizes, zoom: this.zoomValue });
			return;
		}
		if (utils.isNavigationKey(e)) {
			const tab = this.tabs[this.state.selectedTab].id;
			if (this[tab] && this[tab].handleKeyDown) {
				return this[tab].handleKeyDown(e);
			}
		}
	};
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
						data={this.state.data}
						meta={this.state.meta}
						filters={this.state.filters}
						updatedRows={this.state.updatedRows}
						sizes={this.sizes}
						functions={this.state.functions}
						params={props.params}
						keyEvent={null}
						onTableEnter={this.onTableEnter}
						ref={ref => (this.dataset = ref)}
						errorHandler={this.errorHandler}
						navigationKeyHandler={this.props.navigationKeyHandler}
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
						data={this.state.meta.properties}
						meta={this.state.propertiesMeta}
						updatedRows={this.state.propertiesUpdatedRows}
						sizes={this.sizes}
						onChange={this.onChangeProperties}
						onRowNew={this.onRowNew}
						onTableEnter={this.onTableEnter}
						functions={this.state.functions}
						params={props.params}
						keyEvent={null}
						ref={ref => (this.properties = ref)}
						navigationKeyHandler={this.props.navigationKeyHandler}
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
						data={this.state.functions}
						meta={this.state.functionsMeta}
						updatedRows={this.state.functionUpdatedRows}
						sizes={this.sizes}
						functions={this.state.functions}
						params={props.params}
						onTableEnter={this.onTableEnter}
						keyEvent={null}
						ref={ref => (this.functions = ref)}
					/>
				)
			}
		];
		if (this.props.tabs) {
			this.props.tabs.forEach((tab, index) =>
				tabs.push({
					id: tab.id,
					caption: tab.caption,
					content: (
						<ZebulonTable
							key={tab.id}
							id={tab.id}
							visible={this.state.selectedTab === tabs.length}
							data={this.state[tab.id]}
							meta={this.state[`${tab.id}Meta`]}
							updatedRows={this.state[`${tab.id}UpdatedRows`]}
							sizes={this.sizes}
							functions={this.state.functions}
							params={props.params}
							onTableEnter={this.onTableEnter}
							keyEvent={null}
							ref={ref => (this[tab.id] = ref)}
						/>
					)
				})
			);
		}

		return tabs;
	};

	// componentDidMount() {
	// 	this.props.getRef(this);
	// }
	// onChangeProperties = ({ column }) => {
	// 	if (
	// 		column.id === "width" ||
	// 		column.id === "format" ||
	// 		column.id === "select"
	// 	) {
	// 		computeMeta(this.state.meta, this.state.functions);
	// 	}
	// };
	onTableEnter = ({ meta }) => {
		computeMeta(meta, this.zoomValue, this.state.functions);
	};
	onSelectTab = index => {
		if (this[this.tabs[this.state.selectedTab].id].table.canQuit()) {
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
