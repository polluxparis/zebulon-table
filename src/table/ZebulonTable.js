import React, { Component } from "react";
import { Table } from "./Table";
import "./index.css";
import { utils } from "zebulon-controls";
import { computeMetaFromData, functionsTable } from "./utils";

// import { utils.isPromise, isDate } from "./utils/generic";

class ZebulonTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      meta: props.meta,
      sizes: props.sizes,
      keyEvent: props.keyEvent
    };
    if (Array.isArray(props.functions)) {
      this.state.functions = props.functions;
    } else {
      this.state.functions = functionsTable(props.functions);
    }
  }
  componentDidMount() {
    if (!this.props.keyEvent === undefined) {
      document.addEventListener("copy", this.handleCopy);
      document.addEventListener("paste", this.handlePaste);
      document.addEventListener("keydown", this.handleKeyDown);
    }
  }
  componentDidUnMount() {
    if (this.props.keyEvent === undefined) {
      document.removeEventListener("copy", this.handleCopy);
      document.removeEventListener("paste", this.handlePaste);
      document.removeEventListener("keydown", this.handleKeyDown);
    }
  }
  handleKeyEvent = e => {
    if (!this.table) return;
    else if (e.type === "copy") this.handleCopy(e);
    else if (e.type === "paste") this.handlepaste(e);
    else if (e.type === "keydown") this.handleKeyDown(e);
  };
  handleKeyDown = e => {
    if (
      !e.defaultPrevented &&
      this.table.handleKeyDown &&
      (this.props.isActive === undefined || this.props.isActive)
    ) {
      this.table.handleKeyDown(e);
    }
  };
  handleCopy = e => {
    if (
      !e.defaultPrevented &&
      this.table.handleCopy &&
      (this.props.isActive === undefined || this.props.isActive)
    ) {
      this.table.handleCopy(e);
    }
  };
  handlePaste = e => {
    if (
      !e.defaultPrevented &&
      this.table.handlePaste &&
      (this.props.isActive === undefined || this.props.isActive)
    ) {
      this.table.handlePaste(e);
    }
  };
  init = (data, meta) => {
    data.forEach((row, index) => (row.index_ = index));
    computeMetaFromData(data, meta, this.props.functions);
    // this.setState({
    //   data,
    //   meta: computeMetaFromData(data, meta, this.props.functions)
    // });
  };
  componentWillMount() {
    if (utils.isPromise(this.props.data)) {
      this.props.data.then(data => {
        this.init(data, this.props.meta.properties);
      });
    } else {
      this.init(this.props.data, this.props.meta);
    }
  }
  componentWillReceiveProps(nextProps) {
    const { data, meta, sizes, keyEvent } = nextProps;
    if (this.state.sizes !== nextProps.sizes) this.setState({ sizes });
    if (this.props.data !== data || this.props.meta !== meta)
      this.init(nextProps.data, nextProps.meta);
    if (this.props.keyEvent !== keyEvent) this.handleKeyEvent(keyEvent);
    // this.init(this.props.data, this.props.meta);
  }
  // shouldComponentUpdate(nextProps) {
  //   return (
  //     this.state.data !== nextProps.data || this.state.meta !== nextProps.meta
  //   );
  // }

  render() {
    // this.id = `table-${this.props.id || 0}`;
    if (!Array.isArray(this.state.data)) {
      return null;
    }
    let div = (
      <div>
        <Table
          id={this.props.id}
          data={this.state.data}
          meta={this.state.meta}
          key={this.props.id}
          visible={this.props.visible === undefined ? true : this.props.visible}
          width={this.state.sizes.width}
          height={this.state.sizes.height}
          rowHeight={this.state.sizes.rowHeight}
          isActive={this.props.isActive}
          ref={ref => (this.table = ref)}
          getActions={this.props.getActions}
          onChange={this.props.onChange}
          onRowNew={this.props.onRowNew}
          callbacks={this.props.callbacks}
        />
      </div>
    );

    return div;
  }
}

// expose all actions
// Object.keys(actions).forEach(action => {
//   /* eslint-disable func-names */
//   ZebulonGrid.prototype[action] = function(...args) {
//     this.store.dispatch(actions[action](...args));
//   };
//   /* eslint-enable */
// });
// ZebulonGrid.prototype["setData"] = function(data) {
//   setData(this.store, data);
// };
// ZebulonGrid.prototype["getStore"] = function() {
//   return this.store.getState();
// };
// ZebulonGrid.prototype["setConfiguration"] = function(configuration, data) {
//   applyConfigurationToStore(
//     this.store,
//     configuration,
//     this.props.configurationFunctions,
//     data
//   );
// };
// ZebulonGrid.prototype["setSizes"] = function(sizes) {
//   applySizesToStore(this.store, { ...defaultSizes, ...sizes });
// };
ZebulonTable.prototype["getState"] = function() {
  return this.state;
};
export default ZebulonTable;
