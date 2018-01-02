import React, { Component } from "react";
import { ZebulonTableAndConfiguration } from "../table/ZebulonTableAndConfiguration";
// import ZebulonTable from "../table/ZebulonTable";
import { Input } from "zebulon-controls";
import { metaDescriptions, functions } from "../table/MetaDescriptions";
import { functionsTable } from "../table/utils";
import { ResizableBox } from "react-resizable";
import { getMockDatasource } from "./mock";

class ZebulonTableDemo extends Component {
  constructor(props) {
    super(props);
    this.options = [200, 40, 3];
    this.state = {
      data: getMockDatasource(1, ...this.options),
      sizes: {
        height: 600,
        width: 1000,
        rowHeight: 25
      },
      // if set to undefined, component will listen itself to key events.
      // If several instances of the component are used, you'll have to declare the instance active using the isActive prop
      keyEvent: null,
      functions: functionsTable(functions)
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
  render() {
    let { data, meta, propertiesMeta } = this.state;
    if (this.state.configuration) {
      data = meta;
      meta = propertiesMeta;
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
          <ZebulonTableAndConfiguration
            functions={this.state.functions}
            params={{}}
            data={data}
            meta={meta}
            status={{}}
            sizes={this.state.sizes}
            // ref={ref => (this.zebulon = ref)}
            keyEvent={this.state.keyEvent}
          />
        </ResizableBox>
      </div>
    );
  }
}
// <ZebulonTable
//   data={data}
//   meta={meta}
//   sizes={this.state.sizes}
//   ref={ref => (this.zebulon = ref)}
//   keyEvent={this.state.keyEvent}
// />

export default ZebulonTableDemo;
