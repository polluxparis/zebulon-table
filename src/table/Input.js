import React, { Component } from "react";
import { utils } from "zebulon-controls";
const { dateToString, stringToDate, numberToString, isNullOrUndefined } = utils;

const formatValue = (props, value, focused) => {
  // console.log(1);
  const { row, column, status, params, data, inputType, editable } = props;
  const { dataType, formatFunction } = column || { dataType: props.dataType };
  let v = isNullOrUndefined(value) ? "" : value;
  if (
    formatFunction &&
    inputType !== "filter" &&
    (!(focused && editable) && dataType !== "boolean")
  ) {
    v = formatFunction({ value: v, row, column, params, status, data });
  } else if (dataType === "boolean" && value === "") {
    v = null;
  } else if (dataType === "date" && value !== null) {
    v = dateToString(v, undefined || "dd/mm/yyyy");
  } else if (dataType === "number" && value !== null) {
    v = focused && editable ? v.toString() : numberToString(v);
  }
  return v;
};
export class Input extends Component {
  constructor(props) {
    super(props);
    let value = props.value;
    this.state = {
      value,
      formatedValue: formatValue(props, value, props.focused),
      loaded: true
    };
    this.focused = props.focused;
    if (props.select && props.editable && props.focused) {
      let options = props.select;
      if (typeof options === "function") {
        options = options(props.row);
      }
      if (utils.isPromise(options)) {
        this.state.options = [];
        options.then(options => {
          this.setState({ options });
        });
      } else {
        this.state.options = options;
      }
    }
  }
  componentWillReceiveProps(nextProps) {
    this.focused = nextProps.focused;
    const formatedValue = formatValue(nextProps, nextProps.value, this.focused);
    if (
      nextProps.value !== this.state.value ||
      formatedValue !== this.state.formatedValue
    ) {
      this.setState({
        value: nextProps.value,
        formatedValue
      });
    }
    const options = nextProps.select;
    if (options) {
      if (utils.isPromise(options)) {
        this.state.options = [];
        options.then(options => {
          this.setState({ options });
        });
      } else {
        this.setState({ options });
      }
    }
  }
  validateInput = value => {
    let v = value;
    const dataType = (this.props.column || { dataType: this.props.dataType })
      .dataType;
    if (this.props.validateInput) {
      return this.props.validateInput(value);
    } else if (dataType === "number") {
      v =
        value.slice(value.length - 1, value.length) === "."
          ? value.slice(0, value.length - 1)
          : value;
      return !isNaN(Number(v));
    } else if (dataType === "date") {
      v = value.match(/[0123456789.:/ ]+/g);
      return value === "" || (v.length === 1 && v[0] === value);
    }
    return true;
  };

  handleChange = e => {
    const { column, row, editable, inputType, onChange, filterTo } = this.props;
    const { dataType, format } = column || { dataType: this.props.dataType };
    if (editable) {
      let value = e.target.value,
        validatedValue;
      if (!this.validateInput(value)) return;
      // selection of an object
      if (column.reference && column.select) {
        validatedValue = column.selectItems[e.target.value];
      } else if (dataType === "boolean") {
        if (inputType === "filter" && this.state.value === false)
          validatedValue = null;
        else {
          validatedValue = !this.state.value;
          value = validatedValue;
        }
      } else if (dataType === "date") {
        validatedValue = stringToDate(value, format);
      } else if (dataType === "number") {
        validatedValue = value === "" ? null : Number(value);
        // value = formatValue(this.props, validatedValue);
      } else {
        validatedValue = value;
      }
      if (onChange)
        if (onChange(validatedValue, row, column, filterTo) === false) return;
      if (row) {
        const columnId =
          column.reference && column.select ? column.reference : column.id;
        row[columnId] = validatedValue;
        if (
          column.setForeignKeyAccessorFunction &&
          column.reference &&
          column.select
        ) {
          // const v = column.primaryKeyAccessorFunction({
          //   row: { [column.reference]: validatedValue }
          // });
          // const fk = column.foreignKeyAccessor.slice(4);
          // row[fk] = Number(v);
          column.setForeignKeyAccessorFunction({
            value: validatedValue.pk_,
            row
          });
        }
      }
      this.setState({ formatedValue: value, value: validatedValue });
    }
  };
  handleBlur = () => {
    this.setState({
      formatedValue: formatValue(this.props, this.state.value, false)
    });
  };
  handleFocus = e => {
    const { column, inputType, onFocus, row } = this.props;
    if (inputType === "filter") {
      onFocus(e, row, column);
      if (column.filterType !== "values") {
        this.focused = true;
        // console.log("focus", this.state.value);
        const formatedValue = formatValue(
          this.props,
          this.state.value,
          this.focused
        );
        this.setState({
          formatedValue
        });
      }
    }
  };
  render() {
    const {
      row,
      editable,
      inputType,
      // onChange,
      hasFocus,
      select,
      label,
      className,
      style,
      onClick,
      onDoubleClick,
      onMouseOver,
      // onFocus,
      filterTo,
      tabIndex
    } = this.props;
    let input;
    let value = this.state.formatedValue;

    const column = this.props.column || {
      dataType: this.props.dataType,
      id: this.props.id,
      index_: this.props.id,
      caption: this.props.label
    };

    const { dataType } = column;
    if (
      inputType !== "filter" &&
      (!((this.focused || this.props.column === undefined) && editable) &&
        dataType !== "boolean")
    ) {
      input = (
        <div
          key={column.id}
          className={className || "zebulon-input zebulon-input-select"}
          style={style}
          onClick={onClick}
          onMouseOver={onMouseOver}
          onDoubleClick={onDoubleClick}
        >
          {value}
        </div>
      );
    } else {
      const innerStyle = {
        textAlign: style.textAlign
      };
      if (inputType === "filter") {
        innerStyle.padding = ".4em";
        innerStyle.height = "inherit";
      }
      // label;
      let disabled = !editable || undefined;
      if (select) {
        let options = this.state.options;

        // if (typeof options === "function") {
        //   options = options(row);
        // }
        if (typeof options === "object") {
          // const indexDot = column.accessor.indexOf(".");
          if (column.reference) {
            value = column.primaryKeyAccessorFunction({ row });
            options = Object.keys(options).map(key => ({
              id: key,
              caption: column.accessorFunction({
                row: { [column.reference]: options[key] }
              })
            }));
          } else {
            options = Object.values(options);
          }
          // if (!column.mandatory) {
          options = [{ id: undefined, label: "" }].concat(options);
          // }
        }
        input = (
          <select
            className={className || "zebulon-input zebulon-input-select"}
            onChange={this.handleChange}
            value={value}
            style={innerStyle}
            autoFocus={true}
          >
            {options.map((item, index) => {
              return (
                <option
                  key={index}
                  value={typeof item === "object" ? item.id : item}
                  style={typeof item === "object" ? item.style || {} : {}}
                >
                  {typeof item === "object" ? item.caption : item}
                </option>
              );
            })}
          </select>
        );
      } else if (dataType === "boolean") {
        innerStyle.width = "unset";
        innerStyle.margin = 0;
        input = (
          <input
            type="checkbox"
            key={column.id}
            id={column.index_}
            className={className || "zebulon-input"}
            style={innerStyle}
            checked={this.state.value || false}
            disabled={false}
            onChange={this.handleChange}
            onFocus={onClick}
            tabIndex={tabIndex}
          />
        );
      } else {
        // let value = this.state.formatedValue;
        if (isNullOrUndefined(value) || value === "") {
          value = "";
        }
        input = (
          <input
            type="text"
            key={column.id}
            id={column.index_ + 1000 * (filterTo || 0)}
            className={"zebulon-table-input"}
            autoFocus={hasFocus && inputType !== "filter"}
            style={innerStyle}
            // draggable={false}
            value={value}
            disabled={disabled}
            onChange={this.handleChange}
            // onBlur={this.handleBlur}
            // tabIndex={0}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            tabIndex={tabIndex}
          />
        );
      }
      input = (
        <div
          id={column.index_}
          key={column.id}
          className={className || "zebulon-input"}
          style={style}
          onDrop={e => e.preventDefault()}
          onDoubleClick={onDoubleClick}
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
