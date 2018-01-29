import React, { Component } from "react";
// import React, { Component } from "react";
import {
  ScrollableGrid,
  ContextualMenu,
  ContextualMenuClient
} from "zebulon-controls";
class Queries extends ScrollableGrid {}

export class Query extends Component {
  constructor(props) {
    super(props);
    const items = [];
    let i = 0;
    while (i < 200) {
      items.push(
        <div
          key={i}
          id={i}
          draggable={true}
          style={{
            height: 20,
            width: 188,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            border: "solid rgba(0, 0, 0, 0.3) 0.02em",
            boxSizing: "border-box"
          }}
          // onDragStart={this.handleDragStart}
          // onDrop={this.handleDrop}
          // onDragOver={this.handleDragOver}
        >{`Query ${i}`}</div>
      );
      i++;
    }
    this.state = { items };
  }
  handleDragStart = (e, type) => {
    this.dragMessage = { type, index: e.target.id, x: e.pageX };
    e.dataTransfer.setData("text", JSON.stringify(this.dragMessage));
    e.stopPropagation();
    console.log("dragstart", e.target, e.dataTransfer.getData("text"));
  };
  handleDragOver = e => {
    console.log("dragover", e.target, e.dataTransfer.getData("text"));
    if (
      true
      // this.dragMessage.type === "move" ||
      // (this.dragMessage.type === "resize" &&
      // this.props.meta[this.dragMessage.index].computedWidth +
      //   e.pageX -
      //   this.dragMessage.x >
      //   20)
    ) {
      e.preventDefault();
    }
  };

  handleDrop = e => {
    e.preventDefault();
    const msg = JSON.parse(e.dataTransfer.getData("text"));
    console.log("drop", e.target.id, msg);
    const { meta } = this.props;
    // if (msg.type) {
    //   if (
    //     msg.type === "move" &&
    //     !utils.isNullOrUndefined(msg.index) &&
    //     msg.index !== e.target.id
    //   ) {
    //     // console.log("drag end", msg.index, e.target.id);
    //     meta[msg.index].index_ = meta[e.target.id].index_ + 0.1;
    //     meta.sort((a, b) => (a.index_ > b.index_) - (a.index_ < b.index));
    //     computeMetaPositions(meta);
    //     this.props.onMetaChange();
    //     // console.log("drag end", e);
    //   } else if (
    //     msg.type === "resize" &&
    //     !utils.isNullOrUndefined(msg.x) &&
    //     !utils.isNullOrUndefined(e.pageX)
    //   ) {
    //     const column = meta[msg.index];
    //     const zoom = column.computedWidth / column.width;
    //     column.computedWidth += e.pageX - msg.x;
    //     column.width = column.computedWidth / zoom;
    //     computeMetaPositions(meta);
    //     this.props.onMetaChange();
    //   }
    // }
  };
  render() {
    return (
      <div
        style={{
          display: "flex",
          height: 500,
          width: 1000,
          border: "solid 0.05em"
        }}
      >
        <div style={{ display: "block", height: 500, width: 200 }}>
          <div
            style={{
              display: "block",
              height: 250,
              width: 200,
              border: "solid 0.02em"
            }}
          >
            <div style={{ textAlign: "center", width: "inherit" }}>Queries</div>
            <Queries
              data={this.state.items}
              height={220}
              rowHeight={20}
              width={200}
              rowWidth={188}
            />
          </div>
          <div
            style={{
              display: "block",
              height: 250,
              width: 200,
              border: "solid 0.02em"
            }}
          >
            <div style={{ textAlign: "center", width: "inherit" }}>Queries</div>
            <Queries
              data={this.state.items}
              height={220}
              rowHeight={20}
              width={200}
              rowWidth={188}
            />
          </div>
        </div>
        <div style={{ height: 500, width: 880 }}>3</div>
      </div>
    );
  }
}
// Query;
const layout = {
  height: 500,
  width: 1000,
  display: "flex",
  resizable: true,
  layouts: [
    {
      height: 500,
      width: 200,
      display: "block",
      resizable: true,
      layouts: [
        {
          height: 200,
          width: 200,
          display: "flex",
          resizable: true,
          layouts: [],
          content: "queries",
          title: "Queries"
        },
        {
          height: 300 - 40,
          width: 200,
          display: "flex",
          resizable: true,
          layouts: [],
          content: "transformations",
          title: "Transformations"
        }
      ],
      content: null,
      title: ""
    },
    {
      height: 500,
      width: 800,
      display: "flex",
      resizable: true,
      content: null,
      title: "Definitions",
      layouts: [
        {
          height: 200,
          width: 200,
          display: "block",
          resizable: true,
          layouts: [
            {
              height: 200,
              width: 200,
              display: "flex",
              resizable: true,
              layouts: [],
              content: "aaa",
              title: "AAA"
            },
            {
              height: 200,
              width: 200,
              display: "flex",
              resizable: true,
              layouts: [],
              content: "bbb",
              title: "BBB"
            },
            {
              height: 200,
              width: 200,
              display: "flex",
              resizable: true,
              layouts: [],
              content: "ccc",
              title: "CCC"
            }
          ],
          content: null,
          title: "ABC"
        },
        {
          height: 200,
          width: 200,
          display: "block",
          resizable: true,
          layouts: [],
          content: "definitions",
          title: "Defs"
        },
        {
          height: 200,
          width: 200,
          display: "block",
          resizable: true,
          layouts: [
            {
              height: 200,
              width: 200,
              display: "flex",
              resizable: true,
              layouts: [],
              content: "ddd",
              title: "DDD"
            },
            {
              height: 200,
              width: 200,
              display: "flex",
              resizable: true,
              layouts: [],
              content: "eee",
              title: "EEE"
            }
          ],
          content: null,
          title: "DE"
        }
      ]
    }
  ],
  content: null,
  title: "Query definition"
};
const buildLayout = (
  layout, //{ height, width, display, resizable, layouts, content, title },
  parent,
  index,
  components
) => {
  const resizeHandleSize = 4;
  const titleHeight = 20;
  const { height, width, display, resizable, layouts, content, title } = layout;
  layout.id = parent ? `${parent.id} - ${index}` : String(index);
  layout.parent = parent;
  layout.index = index;
  const resizeH =
    !parent ||
    (parent.display === "block" && index < parent.layouts.length - 1) ? (
      <div
        id={"layout-resize-handle-H: " + layout.id}
        style={{
          width: width,
          height: resizeHandleSize,
          cursor: "row-resize",
          backgroundColor: "red"
        }}
        draggable={true}
      />
    ) : null;
  const resizeV =
    !parent ||
    (parent.display === "flex" && index < parent.layouts.length - 1) ? (
      <div
        id={"layout-resize-handle-V: " + layout.id}
        style={{
          // height: height - (parent ? titleHeight : 0) - resizeHandleSize,
          height: height,
          width: resizeHandleSize,
          cursor: "col-resize",
          backgroundColor: "green"
        }}
        draggable={true}
      />
    ) : null;
  const getChildren = (height, width) => {
    if (layouts.length) {
      let childrenSize = 0;
      layouts.forEach(
        (layout, index) =>
          (childrenSize += display === "flex" ? layout.width : layout.height)
      );
      const ratio =
        display === "flex"
          ? width / childrenSize
          : // : (height - titleHeight * layouts.length) / childrenSize;
            height / childrenSize;
      layouts.forEach(layout => {
        if (display === "flex") {
          layout.height = height;
          layout.width *= ratio;
        } else {
          layout.width = width;
          layout.height *= ratio;
        }
      });
      return layouts.map((child, index) =>
        buildLayout(child, layout, index, components)
      );
    }
  };

  const heightBody =
      height - titleHeight - resizeHandleSize * (resizeH === null ? 0 : 1),
    widthBody = width - resizeHandleSize * (resizeV === null ? 0 : 1);
  const style = {
    display: "block",
    height: height,
    width: width,
    border: "solid rgba(0, 0, 0, 0.3) 0.03em",
    boxSizing: "border-box"
  };

  return (
    <div
      id={"layout: " + layout.id}
      key={index}
      style={{ ...style, display: "flex" }}
    >
      <div style={{ display: "block", width: widthBody }}>
        <ContextualMenuClient
          id={"layout-title: " + layout.id}
          menuId="layout-menu"
          componentId={"layout"}
        >
          <div
            draggable={true}
            style={{
              textAlign: "center",
              width: widthBody,
              height: titleHeight,
              userSelect: "none"
            }}
          >
            {title}
          </div>
        </ContextualMenuClient>
        <div
          id={"layout-body: " + layout.id}
          style={{
            display,
            width: widthBody,
            height: heightBody
          }}
        >
          {getChildren(heightBody, widthBody)}
          {typeof components[content] === "function" ? (
            components[content](heightBody, widthBody)
          ) : null}
        </div>
        {resizeH}
      </div>
      {resizeV}
    </div>
  );
};

const get = (type, caption) => {
  const items = [];
  let i = 0;
  while (i < 200) {
    items.push(
      <div
        key={i}
        id={i}
        draggable={true}
        style={{
          height: 20,
          width: "inherit",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          border: "solid rgba(0, 0, 0, 0.3) 0.02em",
          boxSizing: "border-box"
        }}
        // onDragStart={this.handleDragStart}
        // onDrop={this.handleDrop}
        // onDragOver={this.handleDragOver}
      >{`${caption} ${i}`}</div>
    );
    i++;
  }
  return items;
};

export class Query2 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      layout,
      queries: get("queries", "Query"),
      transformations: get("transformations", "Transformation"),
      definitions: get("definitions", "Definition"),
      aaa: get("aaa", "AAA"),
      bbb: get("bbb", "BBB"),
      ccc: get("ccc", "CCC"),
      ddd: get("ddd", "DDD"),
      eee: get("eee", "EEE")
    };
  }
  getJSX = (height, width, type) => (
    <Queries
      data={this.state[type]}
      height={height}
      rowHeight={20}
      width={width}
      rowWidth={width - 12}
    />
  );
  componentWillReceiveProps(nextProps) {
    if (
      this.props.keyEvent !== nextProps.keyEvent &&
      nextProps.keyEvent.which === 27
    ) {
      this.contextualMenu.close();
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return this.props.keyEvent === nextProps.keyEvent;
  }
  //----------------------------------------
  //utils
  //----------------------------------------
  getParent = (element, id) => {
    if (!element.parentElement) {
      return null;
    } else if (element.parentElement.id.startsWith(id)) {
      return element.parentElement.id;
    } else {
      return this.getParent(element.parentElement, id);
    }
  };
  getIds = id =>
    id
      .slice(id.indexOf(":") + 2)
      .split(" - ")
      .map(id => Number(id));
  getLayout = ids => {
    let layout = this.state.layout,
      index;
    if (ids.length > 1) {
      ids.reverse();
      ids.pop(); // root
      while ((index = ids.pop()) !== undefined) {
        layout = layout.layouts[index];
      }
    }
    return layout;
  };
  //----------------------------------------
  // contextual menu
  //----------------------------------------
  handleClickMenu = (data, item) => {
    const ids = this.getIds(data.id);
    const root = ids.length === 1;
    const layout = this.getLayout(ids);
    if (item.id === 0) {
      layout.parent.layouts = layout.parent.layouts
        .slice(0, layout.index)
        .concat(layout.parent.layouts.slice(layout.index + 1));
    } else if (item.id === 1) {
      layout.content = null;
    } else if (item.id === 2) {
      layout.layouts = [
        {
          height: 100,
          width: 100,
          display: layout.display,
          resizable: true,
          layouts: [],
          parent: layout,
          content: null,
          title: "???"
        },
        {
          height: 100,
          width: 100,
          display: layout.display,
          resizable: true,
          layouts: layout.layouts,
          parent: layout,
          content: null,
          title: "???"
        }
      ];
      layout.layouts[1].layouts.forEach(
        lay => (lay.parent = layout.layouts[1])
      );
      layout.display = "flex";
    } else if (item.id === 3) {
      layout.layouts = [
        {
          height: 100,
          width: 100,
          display: layout.display,
          resizable: true,
          layouts: [],
          parent: layout,
          content: null,
          title: "???"
        },
        {
          height: 100,
          width: 100,
          display: layout.display,
          resizable: true,
          layouts: layout.layouts,
          parent: layout,
          content: null,
          title: "???"
        }
      ];
      layout.layouts[1].layouts.forEach(
        lay => (lay.parent = layout.layouts[1])
      );
      layout.display = "block";
    } else if (item.id === 4) {
      layout.display = layout.display === "flex" ? "block" : "flex";
    } else if (item.id >= 100) {
      layout.content = Object.keys(this.components)[item.id % 100];
    }
    this.setState({ layout: this.state.layout });
    console.log("clickmenu", data, item, layout);
  };
  components = {
    queries: (height, width) => this.getJSX(height, width, "queries"),
    transformations: (height, width) =>
      this.getJSX(height, width, "transformations"),
    definitions: (height, width) => this.getJSX(height, width, "definitions"),
    aaa: (height, width) => this.getJSX(height, width, "aaa"),
    bbb: (height, width) => this.getJSX(height, width, "bbb"),
    ddd: (height, width) => this.getJSX(height, width, "ddd"),
    ccc: (height, width) => this.getJSX(height, width, "ccc"),
    eee: (height, width) => this.getJSX(height, width, "eee")
  };
  getMenu = (menuId, data) => {
    const ids = this.getIds(data.id);
    const root = ids.length === 1;
    const layout = this.getLayout(ids);
    const menus = [];
    const menuComponents = Object.keys(
      this.components
    ).map((component, index) => ({
      id: 100 + index,
      type: "menu-item",
      separation: false,
      caption: `${component}`,
      onClick: this.handleClickMenu
    }));
    console.log("getMenu", menuId, data);
    menus.push({
      id: menus.length,
      type: "menu-item",
      separation: false,
      caption: `Remove`,
      onClick: this.handleClickMenu
    });
    menus.push({
      id: menus.length,
      type: "menu-item",
      separation: false,
      disable: layout.content === null,
      caption: `Remove component`,
      onClick: this.handleClickMenu
    });
    menus.push({
      id: menus.length,
      type: "menu-item",
      separation: menus.length > 0,
      caption: `Split verticaly`,
      onClick: this.handleClickMenu
    });
    menus.push({
      id: menus.length,
      type: "menu-item",
      separation: false,
      caption: `Split horizontaly`,
      onClick: this.handleClickMenu
    });
    menus.push({
      id: menus.length,
      type: "menu-item",
      separation: false,
      caption: `Transpose`,
      onClick: this.handleClickMenu
    });
    menus.push({
      id: menus.length,
      type: "menu-item",
      separation: menus.length > 0,
      caption: `Rename`,
      onClick: this.handleClickMenu
    });
    menus.push({
      id: menus.length,
      type: "sub-menu",
      separation: menus.length > 0,
      disable: !(layout.content === null && layout.layouts.length === 0),
      caption: `Add component`,
      children: menuComponents
    });
    if (menus.length) {
      return {
        type: "menu",
        position: "bottom",
        children: menus
      };
    } else {
      return null;
    }
  };
  //----------------------------------------
  // drag and drop
  //----------------------------------------
  handleDragStart = (e, type) => {
    // this.dragMessage = { type, index: e.target.id, x: e.pageX };
    e.dataTransfer.setData("text", e.target.id);
    this.dragId = e.target.id;
    this.pageX = e.pageX;
    this.pageY = e.pageY;
    e.stopPropagation();
    console.log("dragstart", e.pageX, e.pageY, e.dataTransfer.getData("text"));
  };
  handleDragOver = e => {
    const dragId = e.dataTransfer.getData("text");
    // console.log("dragover", dragId);
    if (this.dragId.startsWith("layout-resize-handle")) {
      e.preventDefault();
    } else if (this.dragId.startsWith("layout-title")) {
      e.preventDefault();
    }
  };
  handleDrop = e => {
    e.preventDefault();
    // const msg = JSON.parse(e.dataTransfer.getData("text"));
    const id = e.dataTransfer.getData("text");
    if (id.startsWith("layout-resize-handle")) {
      const length = "layout-resize-handle".length;

      const ids = this.getIds(id); //id.slice(length + 4).split(" - ");
      const root = ids.length === 1;
      const lastIndex = Number(ids.pop());
      const direction =
        id.slice(length, length + 2) === "-V" ? "vertical" : "horizontal";
      let delta = 0;
      const layout = this.getLayout(ids);
      if (root) {
        if (direction === "horizontal") {
          delta = e.pageY - this.pageY;
          layout.height += delta;
        } else {
          delta = e.pageX - this.pageX;
          layout.width += delta;
        }
      } else {
        if (direction === "horizontal") {
          delta = e.pageY - this.pageY;
          layout.layouts[lastIndex].height += delta;
          layout.layouts[lastIndex + 1].height -= delta;
        } else {
          delta = e.pageX - this.pageX;
          layout.layouts[lastIndex].width += delta;
          layout.layouts[lastIndex + 1].width -= delta;
        }
      }
      this.setState({ layout: this.state.layout });
    } else if (id.startsWith("layout-title")) {
      const body = this.getParent(e.target, "layout-body");
      if (body !== null) {
        const dropIds = this.getIds(body);
        const dragIds = this.getIds(id);
        const dropLayout = this.getLayout(dropIds);
        console.log("dropbody", body, e.pageX, e.pageY, e.target);
      }
    }

    console.log("drop", id, e.pageX, e.pageY, e.target);
    this.dragId = null;
    // const { meta } = this.props;
  };
  //----------------------------------------
  // render
  //----------------------------------------
  render() {
    return (
      <div
        style={{ position: "relative" }}
        // onDragStart={this.handleDragStart}
        // onDragOver={this.handleDragOver}
        // onDrop={this.handleDrop}
        onClick={e => {
          if (!e.defaultPrevented) {
            this.contextualMenu.close();
          }
        }}
        onKeyDown={e => {
          console.log("keydown", e);
        }}
        id="layout"
      >
        {buildLayout(this.state.layout, null, 0, this.components)}
        <ContextualMenu
          key="layout-menu"
          getMenu={this.getMenu}
          componentId="layout"
          ref={ref => (this.contextualMenu = ref)}
        />
      </div>
    );
  }
}
