import React, { Component } from "react";
// import * as aggregations from "../../utils/aggregation";
import { Input } from "zebulon-controls";
import { computeData, cellData } from "./utils/compute.data";
export class Property extends Component {
	constructor(props) {
		super(props);
		const object = props.row;
		const indexes = [13, 14, 15, 16, 17, 18];
		// const items = [],
		this.title = "Functions for analytic property";
		this.inputs = [];
		const style = {
			// border: "solid lightgrey thin",
			// boxSizing: "border-box",
			// padding: 0,
			// backgroundColor: "inherit",
			// width: 200,
			textAlign: "left"
		};
		const { row, status, data, params } = props;
		indexes.forEach(index => {
			const column = props.meta[index];
			const { editable, value, select } = cellData(
				row,
				column,
				status,
				data,
				params,
				true
			);
			this.inputs.push(
				<Input
					style={style}
					label={column.caption}
					select={select}
					className="zebulon-table-input"
					row={row}
					column={column}
					id={column.id}
					key={column.id}
					inputType="field"
					focused={true}
					editable={editable}
					value={value}
					onChange={e =>
						(props.onChange || (() => {}))(e, row, column)}
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
				<div>{this.inputs}</div>{" "}
			</div>
		);
	}
}
