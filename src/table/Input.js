import React, { Component } from "react";
import { utils } from "zebulon-controls";
const { dateToString, stringToDate, isNullOrUndefined } = utils;

const formatValue = (props, value) => {
  const {
    row,
    column,
    status,
    params,
    data,
    inputType,
    focused,
    editable
  } = props;
  const { dataType, formatFunction } = column;
  let v = isNullOrUndefined(value) ? "" : value;
  if (
    formatFunction &&
    inputType !== "filter" &&
    (!(focused && editable) && dataType !== "boolean")
  ) {
    v = formatFunction(v, row, params, status, data);
  } else if (dataType === "boolean" && value === "") {
    v = null;
  } else if (dataType === "date" && value !== null) {
    v = dateToString(v, undefined || "dd/mm/yyyy");
  }
  return v;
};
export class Input extends Component {
  constructor(props) {
    super(props);
    let value = props.value;
    this.state = {
      value,
      formatedValue: formatValue(props, value)
    };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.value) {
      this.setState({
        value: nextProps.value,
        formatedValue: formatValue(nextProps, nextProps.value)
      });
    }
  }
  validateInput = value => {
    let v = value;
    const dataType = this.props.column.dataType;
    if (this.props.validateInput) {
      v = this.props.validateInput(value);
    } else if (dataType === "number") {
      v =
        value === "" ? null : isNaN(Number(value)) ? undefined : Number(value);
    } else if (dataType === "date") {
      v =
        value === "" || value === value.match(/[0123456789.:/ ]+/g)[0]
          ? value
          : undefined;
    }
    return v;
  };

  handleChange = e => {
    const { column, row, editable, inputType, onChange, filterTo } = this.props;
    const { dataType, format } = column;
    if (editable) {
      let value = e.target.value;
      let validatedValue = this.validateInput(value);
      if (dataType === "boolean") {
        if (inputType === "filter" && this.state.value === false)
          validatedValue = null;
        else {
          validatedValue = !this.state.value;
          value = validatedValue;
        }
      }
      if (validatedValue !== undefined && dataType === "date") {
        validatedValue = stringToDate(validatedValue, format);
        if (validatedValue !== undefined) {
          value = formatValue(this.props, validatedValue);
        }
      }
      if (onChange)
        if (onChange(validatedValue, row, column, filterTo) === false) return;
      if (row) row[column.id] = validatedValue;
      this.setState({ formatedValue: value, value: validatedValue });
    }
  };

  render() {
    const {
      column,
      row,
      editable,
      inputType,
      onChange,
      focused,
      hasFocus,
      select,
      label,
      className,
      style,
      onClick,
      onMouseOver,
      onFocus
    } = this.props;
    let input;
    const { dataType, format } = column;
    if (
      inputType !== "filter" &&
      (!(focused && editable) && dataType !== "boolean")
    ) {
      input = (
        <div
          key={column.id}
          className={className || "zebulon-input zebulon-input-select"}
          style={style}
          onClick={onClick}
          onMouseOver={onMouseOver}
        >
          {this.state.formatedValue}
        </div>
      );
    } else {
      const innerStyle = {
        textAlign: style.textAlign
      };
      if (inputType === "filter") {
        innerStyle.padding = ".4em";
      }

      let type = "text";
      // label;
      let disabled = !editable || undefined;
      if (select) {
        let options = select;
        if (typeof options === "function") {
          options = options(row);
        }
        input = (
          <select
            className={className || "zebulon-input zebulon-input-select"}
            onChange={this.handleChange}
            value={this.state.formatedValue}
            style={innerStyle}
            autoFocus={true}
          >
            {options.map((item, index) => (
              <option
                key={index}
                value={typeof item === "object" ? item.id : item}
              >
                {typeof item === "object" ? item.caption : item}
              </option>
            ))}
          </select>
        );
      } else if (dataType === "boolean") {
        type = "checkbox";
        innerStyle.width = "unset";
        innerStyle.margin = 0;
        input = (
          <input
            type="checkbox"
            key={column.id}
            className={className || "zebulon-input"}
            style={innerStyle}
            checked={this.state.value || false}
            disabled={false}
            onChange={this.handleChange}
            onFocus={onClick}
          />
        );
      } else {
        input = (
          <input
            type="text"
            key={column.id}
            className={className || "zebulon-input"}
            autoFocus={hasFocus && inputType !== "filter"}
            style={innerStyle}
            value={
              isNullOrUndefined(this.state.formatedValue) ? (
                ""
              ) : (
                this.state.formatedValue
              )
            }
            disabled={disabled}
            onChange={this.handleChange}
            tabIndex={0}
            onFocus={e => (onFocus || (() => {}))(e, row, column)}
          />
        );
      }
      input = (
        <div
          id="div-input"
          key={column.id}
          className={className || "zebulon-input"}
          style={style}
        >
          {input}
        </div>
      );
    }
    if (inputType === "field") {
      input = (
        <label
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0.2em"
          }}
          // className={this.props.className}
        >
          {column.caption}
          {input}
        </label>
      );
    }
    return input;
  }
}
