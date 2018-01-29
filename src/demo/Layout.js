import React, { Component, cloneElement } from "react";
import classnames from "classnames";
import {
  // ScrollableGrid,
  ContextualMenu,
  ContextualMenuClient,
  utils
} from "zebulon-controls";
import { Input } from "../table/Input";
// import { ZebulonTable } from "../table/ZebulonTable";
// import { buildMeta } from "./meta.dataset";
// ------------------------------------
// tests data
// ------------------------------------
// class Queries extends ScrollableGrid {}
const resizeHandleSize = 5;
const titleHeight = 20;

// -----------------------------------------
// component Layout
// ---------------------------------------
export class Layout extends Component {
  constructor(props) {
    super(props);
    const components = props.components.reduce((acc, component) => {
      acc[component.id] = component;
      return acc;
    }, {});
    this.state = {
      layout: props.layout,
      components,
      selectedTabs: {},
      activeLayout: "0",
      resizeImage: {
        position: "fixed",
        top: 0,
        height: 0,
        with: 0,
        backgroundColor: "blue"
      },
      dragPreviewStyle: { display: "none" }
    };
    // this.state.layoutDiv = this.buildLayout(props.layout, null, 0, components);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.keyEvent !== nextProps.keyEvent) {
      if (nextProps.keyEvent.which === 27) {
        this.contextualMenu.close();
      }
      const zoom = utils.isZoom(nextProps.keyEvent);
      if (zoom) {
        const lay = this.getLayout(this.getIds(": " + this.state.activeLayout));
        lay.zoom = (lay.zoom || 1) * (zoom === 1 ? 1.1 : 1 / 1.1);
        this.setState({ layout: this.state.layout });
        nextProps.keyEvent.preventDefault();
        return;
      }
      if (
        utils.isNavigationKey(nextProps.keyEvent) ||
        nextProps.keyEvent.type === "copy" ||
        nextProps.keyEvent.type === "paste"
      ) {
        this.setState({ keyEvent: nextProps.keyEvent });
        return;
      }
      this.keyEvent = true;
    }
  }
  shouldComponentUpdate(nextProps) {
    if (this.keyEvent) {
      this.keyEvent = false;
      return false;
    }
    return true;
  }
  //----------------------------------------
  //utils
  //----------------------------------------
  getParent = (element, id) => {
    if (element.id.startsWith(id)) {
      return element;
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
  isVisible = (layoutId, index) =>
    (this.state.selectedTabs[layoutId] || 0) === index;
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
    layout.layouts = layout.layouts || [];
    layout.index = index;
    layout.calculatedZoom =
      (parent ? parent.calculatedZoom : 1) * (layout.zoom || 1);
    const resizeH =
      !parent ||
      (parent.display === "block" && index < parent.layouts.length - 1) ? (
        <div
          id={"layout-resize-handle-H: " + layout.id}
          style={{
            width: width - (parent ? 0 : resizeHandleSize),
            height: resizeHandleSize,
            cursor: "row-resize"
          }}
          className="zebulon-layout-resize-handle"
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
            cursor: "col-resize"
          }}
          className="zebulon-layout-resize-handle"
          draggable={true}
        />
      ) : null;
    const getChildren = (layouts, height, width) => {
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
          lay.calculatedZoom =
            (lay.parent ? lay.parent.calculatedZoom : 1) * (lay.zoom || 1);
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
    if (content && typeof components[content].title === "function") {
      const title = components[content].title(
        height,
        width,
        layout.calculatedZoom
      );
      layout.title = title.title;
      layout.titleHeight = title.height;
    } else if (content) {
      layout.title = components[content].title;
    }
    const heightBody =
        height -
        (layout.titleHeight || titleHeight) -
        resizeHandleSize * (resizeH === null ? 0 : 1),
      widthBody = width - resizeHandleSize * (resizeV === null ? 0 : 1);
    const style = {
      display: "block",
      height: height,
      width: width
    };
    const getHeader = (layouts, isTab, parentId) => {
      return layouts.map((layout, index) => {
        const id = isTab ? parentId + " - " + String(index) : layout.id;
        return (
          <ContextualMenuClient
            id={"layout-title: " + id}
            key={index}
            menuId="layout-menu"
            componentId={"layout"}
          >
            <div
              id={"layout-title: " + id}
              className={classnames({
                "zebulon-layout-header ": !isTab,
                "zebulon-layout-header-active ":
                  !isTab && this.state.activeLayout === id,
                "zebulon-layout-tab": isTab,
                "zebulon-layout-tab-selected": isTab && layout.visible,
                "zebulon-layout-tab-selected-active":
                  isTab && layout.visible && this.state.activeLayout === id
              })}
              draggable={true}
              style={{
                textAlign: "center",
                width: widthBody / layouts.length,
                height: layout.titleHeight || titleHeight,
                userSelect: "none"
              }}
              onClick={
                isTab ? (
                  e => {
                    e.stopPropagation();
                    // e.preventDefault();
                    if (
                      this.state.selectedTabs[layout.parent.id] !== index ||
                      this.state.activeLayout !== id
                    ) {
                      this.setState({
                        selectedTabs: {
                          ...this.state.selectedTabs,
                          [layout.parent.id]: index
                        },
                        activeLayout: id
                      });
                    }
                  }
                ) : (
                  e => {
                    e.stopPropagation();
                    // e.preventDefault();
                    if (this.state.activeLayout !== id) {
                      this.setState({
                        activeLayout: id
                      });
                    }
                  }
                )
              }
            >
              {layout.title}
            </div>
          </ContextualMenuClient>
        );
      });
    };
    let header;
    if (layout.parent.display === "tabs" && !visible) {
      return null;
    } else if (layout.parent.display === "tabs") {
      header = (
        <div
          id={"layout-titles: " + layout.parent.id}
          style={{ display: "-webkit-box" }}
        >
          {getHeader(layout.parent.layouts, true, layout.parent.id)}
        </div>
      );
    } else {
      header = getHeader([layout], false);
    }
    let body =
      content && typeof components[content].component === "function" ? (
        <div
          id={"layout-component: " + layout.id}
          style={{ position: "relative" }}
        >
          {components[
            content
          ].component(heightBody, widthBody, layout.calculatedZoom, {
            keyEvent: this.state.keyEvent,
            isActive: this.state.activeLayout === layout.id,
            // dataTable: this.props.data,
            // meta: this.props.meta,
            functions: this.props.functions
          })}
        </div>
      ) : (
        getChildren(layouts, heightBody, widthBody)
      );
    if (!content && layouts.length === 0) {
      body = (
        <ContextualMenuClient
          id={"layout-body: " + layout.id}
          key={index}
          menuId="layout-menu"
          componentId={"layout"}
        >
          <div style={{ width: widthBody, height: heightBody }} />
        </ContextualMenuClient>
      );
    }

    return (
      <div
        id={"layout: " + layout.id}
        key={index}
        className={classnames({
          "zebulon-layout": true,
          "zebulon-layout-component": layout.id === "0"
        })}
        style={{
          ...style,
          display: "-webkit-box"
        }}
      >
        <div
          style={{
            display: "block",
            width: widthBody,
            height: height - resizeHandleSize * (resizeH === null ? 0 : 1)
          }}
        >
          {header}
          <div
            id={"layout-body: " + layout.id}
            className={classnames({
              "zebulon-layout-body ": true,
              "zebulon-layout-body-active ":
                this.state.activeLayout === layout.id
            })}
            style={{
              fontSize: `${(content ? layout.calculatedZoom : 1) * 100}%`,
              display: display === "flex" ? "-webkit-box" : display,
              width: widthBody,
              height: heightBody
            }}
            onClick={e => {
              e.stopPropagation();
              if (this.state.activeLayout !== layout.id) {
                this.setState({ activeLayout: layout.id });
              }
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
      layout.display = layout.display === "flex" ? "block" : "-webkit-box";
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
      disable:
        layout.id === "0" ||
        (!layout.content &&
          layout.layouts.length === 0 &&
          !data.id.startsWith("layout-title")),
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
      disable:
        !layout.parent ||
        (layout.layouts.length > 1 && layout.parent.layouts > 1) ||
        layout.content ||
        (!layout.content && layout.layouts.length === 0),
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
      disable: !layout.content && layout.layouts.length === 0,
      caption: `Rename`,
      children: [
        {
          id: 100,
          type: "jsx",
          navigation: false,
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
    this.pageX = e.pageX;
    this.pageY = e.pageY;
    // this.pageXStart = e.pageX;
    // this.pageYStart = e.pageY;
    e.dataTransfer.setData("text", e.target.id);
    this.dragId = e.target.id;
    if (e.target.id.startsWith("layout-resize-handle")) {
      const ids = this.getIds(e.target.id);
      const layout = this.getLayout(ids);
      this.layout = layout;
      const length = "layout-resize-handle".length;
      this.dragDirection =
        e.target.id.slice(length, length + 2) === "-V"
          ? "vertical"
          : "horizontal";
      const rect = document
        .getElementById("layout: " + e.target.id.slice(length + 4))
        .getBoundingClientRect();
      const dragRect = this.dragLayer.getBoundingClientRect();
      const dragPreviewStyle = {
        position: "relative",
        backgroundColor: "red"
      };
      // let x, y;
      // if (this.dragDirection === "vertical") {
      //   dragPreviewStyle.height = rect.height;
      //   dragPreviewStyle.width = 4;
      //   dragPreviewStyle.top = rect.top - dragRect.top;
      //   dragPreviewStyle.left = rect.left - dragRect.left + rect.width - 4;
      // } else {
      //   dragPreviewStyle.height = 4;
      //   dragPreviewStyle.width = rect.width;
      //   dragPreviewStyle.top = rect.top - dragRect.top + rect.height - 4;
      //   dragPreviewStyle.left = rect.left - dragRect.left;
      // }
      // this.dragPreviewStyle = dragPreviewStyle;
      // e.dataTransfer.setDragImage(this.preview, 0, 0);
      // this.setState({ dragPreviewStyle });
    }
    // e.stopPropagation();
    console.log(
      "dragstart",
      e.pageX,
      e.pageY,
      e.dataTransfer.getData("text"),
      e.target,
      e.clientOffset
    );
  };
  handleDragOver = e => {
    // this.pageY2 = e.pageY;
    // this.pageX2 = e.pageX;
    if (this.dragId) {
      e.preventDefault();
      if (this.dragId.startsWith("layout-resize-handle")) {
        // e.stopPropagation();
        const dragPreviewStyle = { ...this.dragPreviewStyle };
        if (this.dragDirection === "vertical") {
          dragPreviewStyle.left += e.pageX - this.pageX;
        } else {
          dragPreviewStyle.top += e.pageY - this.pageY;
        }
        // this.pageX = e.pageX;
        // this.pageY = e.pageY;
        // this.setState({ dragPreviewStyle });
        // const elt = this.preview.cloneNode(false);
        // this.preview.remove();
        // this.preview.style.left = `${dragPreviewStyle.left}px`;
        // this.preview.style.top = `${dragPreviewStyle.top}px`;
        // this.preview.transform = `translate(${dragPreviewStyle.left}px,${dragPreviewStyle.top}px)`;

        // this.preview.transform = `translateY(${dragPreviewStyle.top}px)`;
        // this.preview.style.height = `${dragPreviewStyle.height}px`;
        // this.preview.style.width = `${dragPreviewStyle.width}px`;
        // this.preview.style["background-color"] = "blue";
        // this.preview.style.position = "relative";
        // this.preview.style.display = "block";
        // e.preventDefault();
        // this.dragLayer.appendChild(this.preview);
        console.log("dragover", this.dragId, dragPreviewStyle);
      } else if (
        this.dragId.startsWith("layout-title") &&
        (!e.target.id.startsWith("layout-title") ||
          this.getLayout(this.getIds(e.target.id)).parent.display === "tabs")
      ) {
        // you cant drop a header on a child
        const component = this.getParent(e.target, "layout-component");
        if (
          this.getParent(
            component || e.target,
            this.dragId.replace("-title", "")
          ) === null
        ) {
          e.preventDefault();
        }
      }
    }
  };
  handleDrop = e => {
    // console.log("drop", id, e.pageX, e.pageY, e.target);
    if (this.dragId) {
      e.preventDefault();
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
        const body = e.target.id.startsWith("layout-title")
          ? e.target
          : this.getParent(e.target, "layout-body");
        if (body !== null) {
          const dropIds = this.getIds(body.id);
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
            // const element = document.getElementById(body);
            rect = body.getBoundingClientRect();
            const top = e.clientY - rect.y < rect.height / 2;
            const left = e.clientX - rect.x < rect.width / 2;

            if (
              dropLayout.content !== null ||
              dropLayout.parent.display === "tabs"
            ) {
              if (
                dropLayout.parent.display === "block" ||
                dropLayout.parent.display === "tabs"
              ) {
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
            }
          }
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

      this.dragId = null;
    }
  };
  //----------------------------------------
  // render
  //----------------------------------------
  computeLayout = (layout, active) =>
    this.buildLayout(layout, null, 0, this.state.components);

  render() {
    // let resizePreview;
    // if (this.state.dragId) {
    //   const y = this.rect.y - this.dragRect.y,
    //     x =
    //       this.rect.x -
    //       this.dragRect.x +
    //       this.layout.width -
    //       4 +
    //       (this.pageX2 || this.pageX) -
    //       this.pageX;
    //   console.log(
    //     "render layout",
    //     x,
    //     y,
    //     this.rect.x,
    //     this.dragRect.x,
    //     this.layout.width,
    //     this.pageX2,
    //     this.pageX
    //   );
    //   const previewStyle = {
    //     position: "absolute",
    //     height: this.rect.height,
    //     width: 4,
    //     transform: `translate(${x}px,${y}px)`,
    //     backgroundColor: "blue"
    //   };
    //   resizePreview = (
    //     <div style={previewStyle} ref={ref => (this.div = ref)} />
    //   );
    // } else {
    //   resizePreview = (
    //     <div style={{ display: "none" }} ref={ref => (this.div = ref)} />
    //   );
    // }

    return (
      // <div ref={ref => (this.dragLayer = ref)}>
      <div
        style={{ position: "relative" }}
        onDragStart={this.handleDragStart}
        onDragOver={this.handleDragOver}
        onDragExit={e => console.log("exit", e)}
        onDragLeave={e => console.log("leave", e)}
        onDrop={this.handleDrop}
        onClick={e => {
          if (!e.defaultPrevented && !e.target.id.startsWith("menuRename")) {
            this.contextualMenu.close();
          }
        }}
        id="layout"
        ref={ref => (this.dragLayer = ref)}
      >
        {this.computeLayout(this.state.layout, this.state.activeLayout)}
        <ContextualMenu
          key="layout-menu"
          getMenu={this.getMenu}
          componentId="layout"
          ref={ref => (this.contextualMenu = ref)}
        />
      </div>
      // (  <div
      //     id="layout-preview"
      //     style={{ display: "none" }}
      //     ref={ref => (this.preview = ref)}
      //   />
      // </div>)
    );
    // {resizePreview}
  }
}
