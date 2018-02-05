import React, { Component, cloneElement } from "react";
import classnames from "classnames";
import {
  ScrollableGrid,
  Layout,
  // ContextualMenu,
  // ContextualMenuClient,
  utils
} from "zebulon-controls";
import { Input } from "../table/Input";
import { ZebulonTable } from "../table/ZebulonTable";
import { buildMeta } from "./meta.dataset";
import { getMockDatasource } from "./mock";

// import { Layout } from "./Layout";
const titleHeight = 20;

// ------------------------------------
// tests data
// ------------------------------------

export class MyLayout extends Component {
  constructor(props) {
    super(props);
    this.layout = {
      height: 500,
      width: 1000,
      display: "flex",
      resizable: true,
      layouts: [
        {
          width: 200,
          display: "block",
          resizable: true,
          layouts: [
            {
              height: 200,
              content: "toto_lb"
            },
            {
              height: 300,
              content: "titi_lb"
            }
          ]
        },
        {
          width: 800,
          content: "table"
        }
      ],
      title: "Query definition"
    };
    this.data = getMockDatasource(1, 200, 40, 3);
    this.meta = buildMeta();
    this.toto_lb = {};
    this.titi_lb = {};
    this.data.forEach(row => {
      this.toto_lb[row.toto_lb] = true;
      this.titi_lb[row.titi_lb] = true;
    });
    this.toto_lb = Object.keys(this.toto_lb);
    this.titi_lb = Object.keys(this.titi_lb);
    const filters = {};
    this.state = { filters };
  }

  getItems = (id, caption, zoom) => {
    const items = [];
    let i = 0;
    this[id].forEach(id => {
      items.push(
        <div
          key={id}
          id={id}
          // draggable={true}
          style={{
            height: titleHeight * zoom,
            width: "inherit"
          }}
        >
          {id}
        </div>
      );
    });
    return items;
  };
  getComponent = component => (height, width, zoom, props) => {
    let element;
    if (component.id === "table") {
      element = (
        <ZebulonTable
          key="dataset"
          id="dataset"
          visible={true}
          // editable={true}
          data={this.data}
          meta={this.meta}
          sizes={{ height: height - 3, width: width - 4, zoom }}
          functions={props.functions}
          filters={this.state.filters}
        />
      );
      // element = <div>toto</div>;
    } else {
      element = (
        <ScrollableGrid
          data={this.getItems(component.id, component.caption, zoom)}
          height={height - 3}
          rowHeight={titleHeight * zoom}
          width={width - 2}
          rowWidth={width - 12 - 2}
          zoom={zoom}
          style={{ height: height - 3, width: width - 4 }}
        />
      );
    }
    const componentProps = {
      ...(component.callbacks || {}),
      ...(props || {})
    };
    if (component.callbacks || props) {
      element = cloneElement(element, componentProps);
    }
    return element;
  };
  getTitle = component => {
    if (component.id === "table") {
      return (height, width, zoom, props) => ({
        height: 20,
        title: <div style={{ color: "blue" }}>Zebulon table</div>
      });
    }
    return component.caption;
  };
  components = [
    {
      id: "toto_lb",
      caption: "Toto filter",
      callbacks: {
        selectRange: range => {
          this.selectRow("toto_lb", range.end.rows);
          return true;
        }
      }
    },
    {
      id: "titi_lb",
      caption: "Titi filter",
      callbacks: {
        selectRange: range => {
          this.selectRow("titi_lb", range.end.rows);
          return true;
        }
      }
    },
    { id: "table", caption: "zebulon table", title: "table" }
  ].map(component => {
    component.component = this.getComponent(component);
    component.title = this.getTitle(component);
    return component;
  });
  selectRow = (object, row) => {
    console.log(object, row, this[object][row]);
    const filters = { ...this.state.filters };
    filters[object] = { id: object, filterType: "equal", v: this[object][row] };
    this.setState({ filters });
  };
  //----------------------------------------
  // render
  //----------------------------------------
  render() {
    console.log("render");
    return (
      <Layout
        layout={this.layout}
        components={this.components}
        functions={this.props.functions}
        keyEvent={this.props.keyEvent}
      />
    );
  }
}
