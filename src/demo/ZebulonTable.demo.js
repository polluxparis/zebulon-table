import React, { Component } from "react";
import "zebulon-controls/lib/index.css";
import "../table/index.css";
// import { functions } from "../table/MetaDescriptions";
import { functions, utils } from "zebulon-controls";
import { Input } from "zebulon-controls";

import { MyDataset } from "./dataset.example";
import { datasetFunctions } from "./dataset.functions";
import { MyDatasetConfiguration } from "./dataset.configuration";
// import { navigationKeyHandler } from "./navigation.handler";
import cx from "classnames";
// console.log("datasetFunctions", toto, functions, datasetFunctions);
class ZebulonTableDemo extends Component {
  constructor(props) {
    super(props);
    this.options = [200, 40, 3];
    // const functions = { dataset: datasetFunctions };
    this.state = {
      data: null,
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
    this.text =
      "\nAn array is build locally and used as dataset.\nfunction: get_array @ demo/datasources.";
  }
  componentDidMount() {
    document.addEventListener("copy", this.handleKeyEvent);
    document.addEventListener("paste", this.handleKeyEvent);
    document.addEventListener("keydown", this.handleKeyEvent);
  }
  componentWillUnmount() {
    document.removeEventListener("copy", this.handleKeyEvent);
    document.removeEventListener("paste", this.handleKeyEvent);
    document.removeEventListener("keydown", this.handleKeyEvent);
  }

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
    if (index === 1 && this.component && this.component.onClose) {
      this.component.onClose(ok => {
        if (ok) {
          this.setState({ selectedTab: index });
        }
      });
    } else {
      this.setState({ selectedTab: index });
    }
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
    // const sizes = { ...this.state.sizes };
    if (tabIndex === 0) {
      return (
        <MyDataset
          id="dataset"
          functions={functions}
          keyEvent={keyEvent}
          getComponent={ref => (this.component = ref)}
        />
      );
    } else if (tabIndex === 1) {
      // sizes.height = sizes.height - 52;
      return (
        <MyDatasetConfiguration
          id="dataset"
          functions={functions}
          keyEvent={keyEvent}
        />
      );
    }
  };
  render() {
    const zoomValue = 1;
    return (
      <div
        style={{
          fontSize: `${zoomValue * 100}%`,
          fontFamily: "sans-serif",
          width: 1300
        }}
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
        <div>{this.getTabContent(this.state.selectedTab)}</div>
        <div
          style={{
            height: 55,
            width: 200,
            border: "solid",
            position: "relative",
            overflow: "hidden"
          }}
          onScroll={e => console.log("scroll", e)}
        >
          <input type="text" />
          <input type="text" />
          <Input
            id={-12345}
            style={{
              width: 100,
              height: 25,
              boxSizing: "border-box",
              // height: "inherit",
              textAlign: "center"
            }}
            dataType="date"
            value={new Date()}
            editable={true}
            onScroll={e => console.log(e)}
            // onChange={this.props.onChange}
            hasFocus="true"
          />
        </div>
      </div>
    );
  }
}
export default ZebulonTableDemo;
