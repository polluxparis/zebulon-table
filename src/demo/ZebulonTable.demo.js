import React, { Component } from "react";
import { ZebulonTableAndConfiguration } from "../table/ZebulonTableAndConfiguration";
import { ZebulonTable } from "../table/ZebulonTable";
// import ZebulonTable from "../table/ZebulonTable";
import "zebulon-controls/lib/index.css";
import "../table/index.css";
import { Input, constants, utils } from "zebulon-controls";
import { metaDescriptions, functions } from "../table/MetaDescriptions";
import { functionsTable, getFilters } from "../table/utils";
import { ResizableBox } from "react-resizable";
import { getMockDatasource } from "./mock";
import {
  countries,
  metaCountries,
  currencies,
  metaCurrencies,
  thirdparties,
  metaThirdparties
} from "./metaThirdparties";
// const AxisType = utils.AxisType;
class ZebulonTableDemo extends Component {
  constructor(props) {
    super(props);
    this.options = [200, 40, 3];
    this.state = {
      data: null, //getMockDatasource(1, ...this.options),
      sizes: {
        height: 600,
        width: 1000,
        rowHeight: 25
      },
      keyEvent: null,
      functions: functionsTable(functions),
      updatedRows: {},
      params: {},
      status: {},
      filters: { qty: { id: "qty", filterType: "between", v: 123, vTo: 256 } },
      sorts: {
        d: { id: "d", direction: "asc", sortOrder: 0 },
        toto: { id: "toto", direction: "desc", sortOrder: 1 }
      }
    };
    this.state.meta = metaDescriptions("dataset", this.state.functions);
  }
  componentDidMount() {
    document.addEventListener("copy", this.handleKeyEvent);
    document.addEventListener("paste", this.handleKeyEvent);
    document.addEventListener("keydown", this.handleKeyEvent);
    window.addEventListener("beforeunload", this.handleKeyEvent);
  }
  componentDidUnMount() {
    document.removeEventListener("copy", this.handleKeyEvent);
    document.removeEventListener("paste", this.handleKeyEvent);
    document.removeEventListener("keydown", this.handleKeyEvent);
    window.removeEventListener("beforeunload", this.handleKeyEvent);
  }
  // ----------------------------------------------------------
  // custom navigation handler
  // -> uncomment and adapt following function
  // ----------------------------------------------------------
  // navigationKeyHandler = (e, cells) => {
  //   if (!((e.which > 32 && e.which < 41) || e.which === 9)) {
  //     return false;
  //   }
  //   let direction, cell, axis;
  //   if (e.key === "ArrowDown" || e.key === "ArrowUp") {
  //     if (
  //       document.activeElement.tagName === "SELECT" ||
  //       document.activeElement.tagName === "TEXTAREA"
  //     ) {
  //       return false;
  //     }
  //     direction = e.key === "ArrowDown" ? 1 : -1;
  //     axis = constants.AxisType.ROWS;
  //     cell = cells.nextCell(axis, direction, 1);
  //   } else if (
  //     e.key === "ArrowRight" ||
  //     e.key === "ArrowLeft" ||
  //     e.key === "Tab"
  //   ) {
  //     if (
  //       (document.activeElement.tagName === "INPUT" ||
  //         document.activeElement.tagName === "TEXTAREA") &&
  //       e.key !== "Tab"
  //     ) {
  //       return false;
  //     }
  //     direction =
  //       e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey) ? 1 : -1;
  //     axis = constants.AxisType.COLUMNS;
  //     cell = cells.nextCell(axis, direction, 1);
  //   } else if (e.key === "PageUp" || e.key === "PageDown") {
  //     direction = e.key === "PageDown" ? 1 : -1;
  //     axis = e.altKey ? constants.AxisType.COLUMNS : constants.AxisType.ROWS;
  //     cell = cells.nextPageCell(axis, direction);
  //   } else if (e.key === "Home" || e.key === "End") {
  //     direction = e.key === "End" ? 1 : -1;
  //     axis = e.altKey ? constants.AxisType.COLUMNS : constants.AxisType.ROWS;
  //     cell = cells.endCell(axis, direction);
  //   }
  //   // selection
  //   e.preventDefault();
  //   if (cells.selectCell(cell, e.shiftKey && e.key !== "Tab") === false) {
  //     return false;
  //   }
  //   return { cell, axis, direction };
  // };
  // ------------------------------------------
  // end navigation handler
  // ------------------------------------------
  onResize = (e, data) => {
    this.setState({
      sizes: {
        ...this.state.sizes,
        height: data.size.height,
        width: data.size.width
      }
    });
  };
  handleKeyEvent = e => {
    this.setState({ keyEvent: e });
    return true;
  };
  errorHandler = {
    onRowQuit: message => {
      return window.confirm(JSON.stringify(message.status));
    }
  };
  render() {
    let {
        data,
        meta,
        filters,
        sorts,
        updatedRows,
        sizes,
        keyEvent,
        functions,
        params,
        status
      } = this.state,
      component;
    const a = getFilters(this.state.meta.properties);
    console.log("filters", a);
    if (false) {
      component = (
        <ZebulonTable
          key="countries"
          id="countries"
          visible={true}
          data={countries}
          meta={metaCountries}
          filters={filters}
          sorts={sorts}
          updatedRows={updatedRows}
          status={status}
          sizes={sizes}
          functions={functions}
          params={params}
          keyEvent={keyEvent}
          errorHandler={this.errorHandler}
          // navigationKeyHandler={this.navigationKeyHandler}
        />
      );
    } else {
      if (this.state.configuration) {
        component = (
          <ZebulonTableAndConfiguration
            functions={functions}
            params={params}
            data={data}
            meta={meta}
            filters={filters}
            sorts={sorts}
            updatedRows={updatedRows}
            status={status}
            sizes={sizes}
            keyEvent={keyEvent}
            errorHandler={this.errorHandler}
            navigationKeyHandler={this.navigationKeyHandler}
          />
        );
      } else {
        component = (
          <ZebulonTable
            key="dataset"
            id="dataset"
            visible={true}
            data={data}
            meta={meta}
            filters={filters}
            sorts={sorts}
            updatedRows={updatedRows}
            status={status}
            sizes={sizes}
            functions={functions}
            params={params}
            keyEvent={keyEvent}
            errorHandler={this.errorHandler}
            navigationKeyHandler={this.navigationKeyHandler}
          />
        );
      }
    }
    return (
      <div style={{ fontFamily: "sans-serif" }} id="zebulon">
        <Input
          style={{ height: 50 }}
          dataType="boolean"
          value={this.state.configuration}
          label="configuration"
          editable={true}
          onChange={() =>
            this.setState({ configuration: !this.state.configuration })}
        />
        <ResizableBox
          height={this.state.sizes.height}
          width={this.state.sizes.width}
          onResize={this.onResize}
        >
          {component}
        </ResizableBox>
      </div>
    );
  }
}
export default ZebulonTableDemo;
