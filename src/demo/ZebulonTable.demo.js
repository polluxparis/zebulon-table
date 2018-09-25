import React, { Component } from "react";
import "zebulon-controls/lib/index.css";
import "../table/index.css";
// import { functions } from "../table/MetaDescriptions";
import { functions } from "zebulon-controls";
import { MyDataset } from "./dataset.example";
import { datasetFunctions } from "./dataset.functions";
import { MyDatasetConfiguration } from "./dataset.configuration";
import { ResizableBox } from "react-resizable";
// import { navigationKeyHandler } from "./navigation.handler";
import cx from "classnames";
class ZebulonTableDemo extends Component {
  constructor(props) {
    super(props);
    this.options = [200, 40, 3];
    // const functions = { dataset: datasetFunctions };
    this.state = {
      data: null,
      sizes: {
        height: 600,
        width: 1300,
        rowHeight: 25,
        zoom: 1
      },
      keyEvent: null,
      functions: functions.functions(datasetFunctions),
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
    this.state.functions.setVisibility("dataset");
    // this.state.meta = metaDataset;
    this.text =
      "\nAn array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
  }
  componentDidMount() {
    document.addEventListener("copy", this.handleKeyEvent);
    document.addEventListener("paste", this.handleKeyEvent);
    document.addEventListener("keydown", this.handleKeyEvent);
    // window.addEventListener("beforeunload", this.handleKeyEvent);
  }
  componentWillUnmount() {
    document.removeEventListener("copy", this.handleKeyEvent);
    document.removeEventListener("paste", this.handleKeyEvent);
    document.removeEventListener("keydown", this.handleKeyEvent);
    // window.removeEventListener("beforeunload", this.handleKeyEvent);
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
    },
    {
      id: "selfConfig",
      caption: "Manage configuration",
      disabled: true
    }
  ];

  getTabContent = tabIndex => {
    const { keyEvent, functions } = this.state;
    const sizes = { ...this.state.sizes };
    if (tabIndex === 0) {
      return (
        <MyDataset
          id="dataset"
          functions={functions}
          keyEvent={keyEvent}
          sizes={sizes}
        />
      );
    } else if (tabIndex === 1) {
      sizes.height = sizes.height - 52;
      return (
        <MyDatasetConfiguration
          id="dataset"
          functions={functions}
          keyEvent={keyEvent}
          sizes={sizes}
        />
      );
    }
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
                style={{ width: "50%" }}
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
