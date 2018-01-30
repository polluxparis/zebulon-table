import React, { Component } from "react";
import { ZebulonTableAndConfiguration } from "../table/ZebulonTableAndConfiguration";
import { ZebulonTable } from "../table/ZebulonTable";
// import ZebulonTable from "../table/ZebulonTable";
import "zebulon-controls/lib/index.css";
import "../table/index.css";
import { Input, constants, utils } from "zebulon-controls";
import { metaDescriptions, functions } from "../table/MetaDescriptions";
import { functionsTable, getFilters } from "../table/utils";
// import { Layout, components, layout } from "./Layout";
import { MyLayout } from "./Layout.example";
import { ResizableBox } from "react-resizable";

import {
  countries,
  metaCountries,
  currencies,
  metaCurrencies,
  thirdparties,
  metaThirdparties
} from "./meta.thirdparties";
import { metaDataset, datasetFunctions, buildMeta } from "./meta.dataset";
class ZebulonTableDemo extends Component {
  constructor(props) {
    super(props);
    this.options = [200, 40, 3];
    const functionsObject = { ...functions, dataset: datasetFunctions };
    this.state = {
      data: null, //getMockDatasource(1, ...this.options),
      sizes: {
        height: 600,
        width: 1000,
        rowHeight: 25
      },
      keyEvent: null,
      functions: functionsTable(functionsObject),
      updatedRows: {},
      params: {},
      status: {},
      filters: { qty: { id: "qty", filterType: "between", v: 123, vTo: 256 } },
      sorts: {
        d: { id: "d", direction: "asc", sortOrder: 0 },
        toto: { id: "toto", direction: "desc", sortOrder: 1 }
      }
    };
    this.state.meta = metaDataset;
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
            isActive={false}
            errorHandler={this.errorHandler}
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

        <MyLayout
          // layout={layout}
          // components={components}
          keyEvent={keyEvent}
          // data={data}
          // meta={buildMeta()}
          functions={functions}
        />
      </div>
    );
  }
}
export default ZebulonTableDemo;
