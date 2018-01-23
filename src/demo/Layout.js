import React, { Component, cloneElement } from "react";
import classnames from "classnames";
import {
  ScrollableGrid,
  ContextualMenu,
  ContextualMenuClient
} from "zebulon-controls";
import { Input } from "../table/Input";
// ------------------------------------
// tests data
// ------------------------------------
// class Queries extends ScrollableGrid {}
const resizeHandleSize = 4;
const titleHeight = 20;
export const layout = {
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
      display: "tabs",
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

const getItems = (type, caption) => {
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
          // backgroundColor: "rgba(0, 0, 0, 0.1)",
          // border: "solid rgba(0, 0, 0, 0.3) 0.02em",
          boxSizing: "border-box"
        }}
        onDragStart={this.handleDragStart}
        onDrop={this.handleDrop}
        onDragOver={this.handleDragOver}
      >{`${caption} ${i}`}</div>
    );
    i++;
  }
  return items;
};
const getComponent = component => (height, width) => {
  let element = (
    <ScrollableGrid
      data={getItems(component.id, component.caption)}
      height={height}
      rowHeight={titleHeight}
      width={width}
      rowWidth={width - 12}
    />
  );
  if (component.callbacks) {
    element = cloneElement(element, component.callbacks);
  }
  return element;
};

export const components = [
  { id: "queries", caption: "Queries" },
  { id: "transformations", caption: "Transformations" },
  { id: "definitions", caption: "Definitions" },
  {
    id: "aaa",
    caption: "aaa",
    callbacks: {
      selectRange: range => {
        console.log("range", range);
        return true;
      }
    }
  },
  { id: "bbb", caption: "bbb" },
  { id: "ccc", caption: "ccc" },
  { id: "ddd", caption: "ddd" },
  { id: "eee", caption: "eee" }
].map(component => {
  component.component = getComponent(component);
  return component;
});
// ------------------------------------
// tests data
// ------------------------------------
// -----------------------------------------
// component Layout
// ---------------------------------------
export class Layout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      layout: props.layout,
      components: props.components.reduce((acc, component) => {
        acc[component.id] = component;
        return acc;
      }, {}),
      tabs: {}
    };
  }

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
    if (element.id.startsWith(id)) {
      return element.id;
    } else if (element.parentElement) {
      return this.getParent(element.parentElement, id);
    } else {
      return null;
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
  // --------------------------------------
  // build layout
  // --------------------------------------
  isVisible = (layoutId, index) => (this.state.tabs[layoutId] || 0) === index;
  buildLayout = (
    layout, //{ height, width, display, resizable, layouts, content, title },
    parent,
    index,
    components
  ) => {
    const {
      height,
      width,
      display,
      resizable,
      layouts,
      content,
      title,
      visible
    } = layout;
    layout.id = parent ? `${parent.id} - ${index}` : String(index);
    layout.parent = parent || {};
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
        layouts.forEach((lay, index) => {
          if (display === "tabs") {
            lay.height = height;
            lay.width = width;
            lay.visible = this.isVisible(layout.id, index);
          } else if (display === "flex") {
            lay.height = height;
            lay.width *= ratio;
          } else {
            lay.width = width;
            lay.height *= ratio;
          }
        });
        return layouts.map((child, index) =>
          this.buildLayout(child, layout, index, components)
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
    const getHeader = (layouts, isTab) => {
      return layouts.map((layout, index) => (
        <ContextualMenuClient
          id={"layout-title: " + layout.id}
          key={index}
          menuId="layout-menu"
          componentId={"layout"}
        >
          <div
            id={"layout-title: " + layout.id}
            className={classnames({
              "zebulon-table-cell": !isTab,
              "zebulon-tabs-tab": isTab,
              "zebulon-tabs-tab-selected": isTab && layout.visible
            })}
            draggable={true}
            style={{
              textAlign: "center",
              width: widthBody / layouts.length,
              height: titleHeight,
              userSelect: "none"
            }}
            onClick={
              isTab ? (
                e =>
                  this.setState({
                    tabs: { ...this.state.tabs, [layout.parent.id]: index }
                  })
              ) : (
                () => {}
              )
            }
          >
            {layout.title}
          </div>
        </ContextualMenuClient>
      ));
    };
    let header;
    if (layout.parent.display === "tabs" && !visible) {
      return null;
    } else if (layout.parent.display === "tabs") {
      header = (
        <div style={{ display: "flex" }}>
          {getHeader(layout.parent.layouts, true)}
        </div>
      );
    } else {
      header = getHeader([layout], false);
    }
    const body =
      content && typeof components[content].component === "function"
        ? components[content].component(heightBody, widthBody)
        : getChildren(heightBody, widthBody);
    // if (layout.parent.display === "tabs") {
    //   header = <div style={{ display: "flex" }}>{header}</div>;
    // }
    //
    return (
      <div
        id={"layout: " + layout.id}
        key={index}
        style={{ ...style, display: "flex" }}
      >
        <div style={{ display: "block", width: widthBody }}>
          {header}
          <div
            id={"layout-body: " + layout.id}
            style={{
              display,
              width: widthBody,
              height: heightBody
            }}
          >
            {body}
          </div>
          {resizeH}
        </div>
        {resizeV}
      </div>
    );
  };
  //----------------------------------------
  // contextual menu
  //----------------------------------------
  remove = layout =>
    (layout.parent.layouts = layout.parent.layouts
      .slice(0, layout.index)
      .concat(layout.parent.layouts.slice(layout.index + 1)));
  splitHorizontaly = layout => {
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
        content: layout.content,
        title: "???"
      }
    ];
    layout.content = null;
    layout.layouts[1].layouts.forEach(lay => (lay.parent = layout.layouts[1]));
  };
  splitVerticaly = layout => {
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
        content: layout.content,
        parent: layout,
        title: "???"
      }
    ];
    layout.content = null;
    layout.layouts[1].layouts.forEach(lay => (lay.parent = layout.layouts[1]));
  };
  removeSplit = layout => {
    if (layout.layouts.length === 1) {
      layout.layouts[0].parent = layout.parent;
      layout.title = layout.layouts[0].title;
      layout.content = layout.layouts[0].content;
      layout.layouts = layout.layouts[0].layouts;
    } else {
      layout.parent.content = layout.content;
      layout.parent.layouts = layout.layouts;
      layout.parent.display = layout.display;
    }
  };
  insertLayout = (parent, layout, index) => {
    this.remove(layout);
    layout.parent = parent;
    parent.layouts = parent.layouts
      .slice(0, index)
      .concat([layout])
      .concat(parent.layouts.slice(index));
  };
  handleClickMenu = (data, item) => {
    const ids = this.getIds(data.id);
    const root = ids.length === 1;
    const layout = this.getLayout(ids);
    if (item.id === 0) {
      this.remove(layout);
    } else if (item.id === 1) {
      layout.content = null;
      layout.layouts = [];
    } else if (item.id === 2) {
      this.removeSplit(layout);
    } else if (item.id === 3) {
      this.splitVerticaly(layout);
      layout.display = "flex";
    } else if (item.id === 4) {
      this.splitHorizontaly(layout);
      layout.display = "block";
    } else if (item.id === 5) {
      layout.display = layout.display === "flex" ? "block" : "flex";
    } else if (item.id >= 100) {
      layout.content = item.componentId;
    }
    this.setState({ layout: this.state.layout });
    console.log("clickmenu", data, item, layout);
  };
  // ---------------------------------------------
  getMenu = (menuId, data) => {
    const ids = this.getIds(data.id);
    const root = ids.length === 1;
    const layout = this.getLayout(ids);
    const menus = [];
    const menuComponents = Object.keys(
      this.state.components
    ).map((key, index) => ({
      id: 100 + index,
      type: "menu-item",
      separation: false,
      caption: `${this.state.components[key].caption}`,
      componentId: this.state.components[key].id,
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
      disable: layout.content === null && layout.layouts.length === 0,
      caption: `Remove content`,
      onClick: this.handleClickMenu
    });
    menus.push({
      id: menus.length,
      type: "menu-item",
      separation: false,
      disable: layout.layouts.length > 1,
      caption: `Remove split`,
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
      type: "sub-menu",
      separation: menus.length > 0,
      caption: `Rename`,
      children: [
        {
          id: 100,
          type: "jsx",
          navigation: true,
          // caption: "Filter",
          content: (
            <Input
              key={100}
              id={"menuRename"}
              hasFocus={true}
              dataType="string"
              value={layout.title}
              editable={true}
              style={{ textAlign: "left" }}
              onChange={e => {
                layout.title = e;
                this.setState({ layout: this.state.layout });
              }}
            />
          )
        }
      ]
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
    this.contextualMenu.close();
    // this.dragMessage = { type, index: e.target.id, x: e.pageX };
    e.dataTransfer.setData("text", e.target.id);
    this.dragId = e.target.id;
    this.pageX = e.pageX;
    this.pageY = e.pageY;
    e.stopPropagation();
    console.log(
      "dragstart",
      e.pageX,
      e.pageY,
      e.dataTransfer.getData("text"),
      e.target
    );
  };
  handleDragOver = e => {
    // const dragId = e.dataTransfer.getData("text");
    console.log("dragover", this.dragId, e.target.id);
    if (this.dragId.startsWith("layout-resize-handle")) {
      e.preventDefault();
    } else if (
      this.dragId.startsWith("layout-title") &&
      !e.target.id.startsWith("layout-title")
    ) {
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
        const dropIndex = dropIds[dropIds.length - 1];
        const dragIds = this.getIds(id);
        const dropLayout = this.getLayout(dropIds);
        const dragLayout = this.getLayout(dragIds);
        let rect;
        if (dropLayout.content === null && dropLayout.layouts.length === 0) {
          dropLayout.title = dragLayout.title;
          dropLayout.content = dragLayout.content;
          dropLayout.layouts = dragLayout.layouts;
          this.remove(dragLayout);
        } else {
          const element = document.getElementById(body);
          rect = element.getBoundingClientRect();
          const top = e.clientY - rect.y < rect.height / 2;
          const left = e.clientX - rect.x < rect.width / 2;
          // if (dropLayout.content !== null) {
          //   if (dropLaclientyout.display === "block") {
          //     this.splitHorizontaly(dropLayout);
          //   } else if (dropLayout.display === "flex") {
          //     this.splitVerticaly(dropLayout);
          //   }
          //   dropLayout.layouts[1].title = dropLayout.title;
          //   dropLayout.title = "???";
          //   const newLayout = dropLayout.layouts[0];
          //   newLayout.title = dragLayout.title;
          //   newLayout.content = dragLayout.content;
          //   newLayout.layouts = dragLayout.layouts;
          //   if (
          //     (dropLayout.display === "block" && !top) ||
          //     (dropLayout.display === "flex" && !left)
          //   ) {
          //     dropLayout.layouts.reverse();
          //   }}
          if (dropLayout.content !== null) {
            if (dropLayout.parent.display === "block") {
              this.insertLayout(
                dropLayout.parent,
                dragLayout,
                dropIndex + !top
              );
            } else if (dropLayout.parent.display === "flex") {
              this.insertLayout(
                dropLayout.parent,
                dragLayout,
                dropIndex + !left
              );
            }
            // dropLayout.layouts[1].title = dropLayout.title;
            // dropLayout.title = "???";
            // const newLayout = dropLayout.layouts[0];
            // newLayout.title = dragLayout.title;
            // newLayout.content = dragLayout.content;
            // newLayout.layouts = dragLayout.layouts;
            // if (
            //   (dropLayout.display === "block" && !top) ||
            //   (dropLayout.display === "flex" && !left)
            // ) {
            //   dropLayout.layouts.reverse();
            // }
          }
        }
        //
        this.setState({ layout: this.state.layout });
        console.log(
          "dropbody",
          body,
          e.pageX,
          e.pageY,
          rect,
          dragIds,
          dropIds,
          e.target
        );
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
        onDragStart={this.handleDragStart}
        onDragOver={this.handleDragOver}
        onDrop={this.handleDrop}
        onClick={e => {
          if (!e.defaultPrevented && !e.target.id.startsWith("menuRename")) {
            this.contextualMenu.close();
          }
        }}
        onKeyDown={e => {
          console.log("keydown", e);
        }}
        id="layout"
      >
        {this.buildLayout(this.state.layout, null, 0, this.state.components)}
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
