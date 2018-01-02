import React, { Component } from "react";
// import * as aggregations from "../../utils/aggregation";
import { Input, utils } from "zebulon-controls";
import { getFunction, computeData } from "./utils";
export class Property extends Component {
	constructor(props) {
		super(props);
		const object = this.props.row;
		const indexes = [8, 9, 10, 11, 12, 13];
		// const items = [],
		this.title = "Functions for analytic property";
		this.inputs = [];
		const style = {
			border: "solid lightgrey thin",
			boxSizing: "border-box",
			padding: 0,
			backgroundColor: "inherit",
			width: 200,
			textAlign: "left"
		};
		indexes.forEach(index => {
			const column = this.props.meta[index];
			// items.push(this.props.meta[index]);
			this.inputs.push(
				<Input
					style={style}
					label={column.caption}
					select={column.select}
					className="zebulon-input-label"
					row={props.row}
					id={column.id}
					key={column.id}
					value={this.props.row[column.id]}
					onChange={e => props.onChange(e, this.props.row, column)}
				/>
			);
		});
	}
	render() {
		// onst select = ["", "a", "b", "c"];
		// const style = {
		// 	border: "solid lightgrey thin",
		// 	boxSizing: "border-box",
		// 	padding: 0,
		// 	backgroundColor: "inherit",
		// 	width: 200,
		// 	textAlign: "left"

		// };
		return (
			<div
				style={{
					position: "absolute",
					border: "solid 0.1em rgba(0, 0, 0, 0.5)",
					backgroundColor: "white",
					top: this.props.top,
					left: 25,
					zIndex: 3,
					opacity: 1,
					width: 400,
					height: "fit-content",
					autoFocus: true
				}}
			>
				<div
					style={{
						textAlign: "Center",
						fontWeight: "bold",
						margin: 3,
						marginBottom: 7,
						display: "flex",
						justifyContent: "space-between"
					}}
				>
					{this.title}
					<button onClick={this.props.close}>X</button>
				</div>
				{this.inputs}
			</div>
		);
	}
}
