import React, { Component } from "react";
import cx from "classnames";
import { ZebulonTable } from "./ZebulonTable";
import { metaDescriptions } from "./MetaDescriptions";
import { computeMeta, computeMetaFromData, functionsTable } from "./utils";

import { utils } from "zebulon-controls";

export class ZebulonTableAndConfiguration extends Component {
	constructor(props) {
		super(props);
		let functions = props.functions;
		if (!Array.isArray(props.functions)) {
			functions = functionsTable(props.functions);
		}
		computeMetaFromData(props.data, props.meta, functions);
		this.state = {
			selectedTab: 0,
			data: props.data,
			meta: props.meta,
			functions
		};

		this.state.propertiesMeta = metaDescriptions(
			"properties",
			this.state.functions,
			this.state.meta.properties
		);
		computeMeta(this.state.propertiesMeta, this.state.functions);
		this.state.functionsMeta = metaDescriptions(
			"functions",
			this.state.functions
		);
		computeMeta(this.state.functionsMeta, this.state.functions);
		if (this.props.tabs) {
			this.props.tabs.forEach(tab => {
				this.state[tab.id] = tab.data;
				this.state[`${tab.id}Meta`] = metaDescriptions(
					tab.id,
					this.state.functions
				);
				computeMetaFromData(
					this.state[tab.id],
					this.state[`${tab.id}Meta`],
					this.state.functions
				);
			});
		}
	}
	componentWillReceiveProps(nextProps) {
		if (
			nextProps.data !== this.props.data ||
			nextProps.meta !== this.props.meta
		) {
			this.setState({
				data: nextProps.data,
				meta: nextProps.meta
			});
		}
		if (nextProps.keyEvent !== this.props.keyEvent) {
			this.handleKeyDown(nextProps.keyEvent);
		}
	}
	handleKeyDown = e => {
		if (utils.isNavigationKey(e)) {
			const tab = this.tabs[this.state.selectedTab].id;
			if (this[tab] && this[tab].handleKeyDown) {
				return this[tab].handleKeyDown(e);
			}
		}
	};
	initTabs = props => {
		const sizes = { ...props.sizes, height: props.sizes.height - 30 };
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
						sizes={sizes}
						functions={this.state.functions}
						params={props.params}
						onTableEnter={this.onTableEnter}
						ref={ref => (this.dataset = ref)}
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
						sizes={sizes}
						onChange={this.onChangeProperties}
						onRowNew={this.onRowNew}
						onTableEnter={this.onTableEnter}
						functions={this.state.functions}
						params={props.params}
						ref={ref => (this.properties = ref)}
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
						sizes={sizes}
						functions={this.state.functions}
						params={props.params}
						onTableEnter={this.onTableEnter}
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
							sizes={sizes}
							functions={this.state.functions}
							params={props.params}
							onTableEnter={this.onTableEnter}
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
		computeMeta(meta, this.state.functions);
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
		return (
			<div>
				<div
					style={{ display: "flex", height: 25 }}
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
							onClick={() =>
								this.setState({ selectedTab: index })}
						>
							{tab.caption}
						</div>
					))}
				</div>
				<div style={{ height: this.props.sizes.height - 30 }}>
					{this.tabs.map(tab => tab.content)}
				</div>
			</div>
		);
	}
}
