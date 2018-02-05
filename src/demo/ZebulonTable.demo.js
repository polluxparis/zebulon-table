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
// import { MyLayout } from "./layout.example";
import { MyDataset } from "./dataset.example";
import { ResizableBox } from "react-resizable";
import { navigationKeyHandler } from "./navigation.handler";
import cx from "classnames";
// import {
//   countries,
//   metaCountries,
//   currencies,
//   metaCurrencies,
//   thirdparties,
//   metaThirdparties
// } from "./meta.thirdparties";
import { datasetFunctions } from "./dataset.functions";
class ZebulonTableDemo extends Component {
  constructor(props) {
    super(props);
    this.options = [200, 40, 3];
    const functionsObject = { ...functions, dataset: datasetFunctions };
    this.state = {
      data: null,
      sizes: {
        height: 700,
        width: 1200,
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
      },
      selectedTab: 0,
      radioDataset: "get_array",
      dataLength: 0,
      filteredDataLength: 0,
      loadedDataLength: 0
    };
    // this.state.meta = metaDataset;
    this.text =
      "\nAn array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
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
  onSelectTab = index => {
    this.setState({ selectedTab: index });
  };
  tabs = [
    {
      id: "dataset",
      caption: "Dataset and server"
    }
    // ,
    // {
    //   id: "selfConfig",
    //   caption: "Self configuration",
    //   disabled: true
    // },
    // {
    //   id: "layout",
    //   caption: "Multi instance and styles",
    //   disabled: true
    // }
  ];

  getTabContent = tabIndex => {
    const {
      data,
      meta,
      filters,
      sorts,
      updatedRows,
      keyEvent,
      functions,
      params,
      status,
      selectedTab
    } = this.state;
    let header = null,
      footer = null;
    const sizes = { ...this.state.sizes };

    if (tabIndex === 0) {
      return (
        <MyDataset
          key="dataset"
          id="dataset"
          functions={functions}
          keyEvent={keyEvent}
          sizes={sizes}
        />
      );
    }
    // else if (tabIndex === 1) {
    //   return (
    //     <div style={{ fontFamily: "sans-serif" }} id="zebulon">
    //       {header}
    //       <ZebulonTableAndConfiguration
    //         functions={functions}
    //         params={params}
    //         visible={this.state.selectedTab === 1}
    //         isActive={this.state.selectedTab === 1}
    //         data={data}
    //         meta={meta}
    //         filters={filters}
    //         sorts={sorts}
    //         updatedRows={updatedRows}
    //         status={status}
    //         sizes={sizes}
    //         keyEvent={keyEvent}
    //         errorHandler={this.errorHandler}
    //       />
    //       {footer}
    //     </div>
    //   );
    // } else if (tabIndex === 2) {
    //   return (
    //     <MyLayout
    //       // layout={layout}
    //       // components={components}
    //       visible={selectedTab === 2}
    //       isActive={selectedTab === 2}
    //       keyEvent={keyEvent}
    //       // data={data}
    //       // meta={buildMeta()}
    //       functions={functions}
    //     />
    //   );
    // }
  };

  render() {
    const zoomValue = 1;
    return (
      <div
        style={{ fontSize: `${zoomValue * 100}%`, fontFamily: "sans-serif" }}
      >
        <ResizableBox
          height={this.state.sizes.height}
          width={this.state.sizes.width}
          onResize={this.onResize}
        >
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
                  "zebulon-tabs-tab-selected": index === this.state.selectedTab
                })}
                onClick={() => this.onSelectTab(index)}
              >
                {tab.caption}
              </div>
            ))}
          </div>
          <div
            style={{
              height: this.state.sizes.height - 30 * zoomValue
            }}
          >
            {this.getTabContent(this.state.selectedTab)}
          </div>
        </ResizableBox>
      </div>
    );
  }
}
export default ZebulonTableDemo;
