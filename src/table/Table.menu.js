import { Component } from "react";
import { utils } from "zebulon-controls";
import { computeMetaPositions } from "./utils/compute.meta";
import { rollback } from "./utils/utils";

export class TableMenu extends Component {
    handleClickMenu = (data, item) => {
        if (data.menuId === "column-header-menu") {
            if (item.id <= 1) {
                const meta = this.state.meta;
                if (!utils.isNullOrUndefined(meta.lockedIndex)) {
                    meta.properties[meta.lockedIndex].locked = false;
                }
                if (item.id) {
                    meta.properties[data.column.index_].locked = true;
                }
                computeMetaPositions(meta);
                this.setState({
                    scroll: {
                        ...this.state.scroll,
                        columns: {
                            direction: 1,
                            index: 0,
                            position: 0,
                            shift: 0,
                            startIndex: 0
                        }
                    }
                });
            }
        } else if (data.menuId === "row-header-menu") {
            if (item.id === 0) {
                rollback(data.status);
                this.setState({ scroll: this.state.scroll });
            } else if (item.id === 1) {
                const audits = this.state.meta.row.auditFunction({
                    row: data.row
                });
                if (utils.isPromise(audits)) {
                    audits.then(audits =>
                        this.setState({
                            auditedRow: data.row,
                            audits
                        })
                    );
                } else {
                    this.setState({
                        auditedRow: data.row,
                        audits
                    });
                }
            }
        } else if (data.menuId === "top-left-corner-menu") {
            const { filters, data, updatedRows } = this.state;
            let filter = filters.status_;
            if (!filter) {
                filter = { id: "status_", v: 0 };
            }
            const v = item.id % 100;
            if (filter.v & v) {
                filter.v -= v;
            } else {
                filter.v += v;
            }
            if (item.id === 0 || filter.v === 0) {
                delete filters.status_;
            } else if (item.id === 1) {
                filters.status_ = filter;
            } else if (item.id === 2) {
                this.setState({ auditedRow: undefined, audits: undefined });
            }
            this.setState({
                filteredData: this.filters(data, filters, false, updatedRows)
            });
        }
    };
    getMenu = (menuId, data) => {
        const menus = [];
        if (menuId === "row-header-menu") {
            if (this.state.meta.table.editable) {
                menus.push({
                    id: menus.length,
                    type: "menu-item",
                    disable: !(data.status || {}).updated_,
                    separation: false,
                    caption: `Rollback row updates`,
                    onClick: this.handleClickMenu
                });
            }
            if (this.state.meta.row.audit) {
                menus.push({
                    id: menus.length,
                    type: "menu-item",
                    disable: this.state.auditedRow !== undefined,
                    // separation: false,
                    caption: `Audit`,
                    onClick: this.handleClickMenu
                });
            }
            if (
                this.props.contextualMenu &&
                this.props.contextualMenu[menuId]
            ) {
                this.props.contextualMenu[menuId].forEach((menu, index) =>
                    menus.push({
                        id: menus.length,
                        separation: index === 0 && menus.length > 0,
                        type: menu.type,
                        caption: menu.caption,
                        onClick: menu.function
                    })
                );
            }
        } else if (menuId === "column-header-menu") {
            menus.push({
                id: menus.length,
                type: "menu-item",
                disable: utils.isNullOrUndefined(this.state.meta.lockedIndex),
                separation: false,
                caption: `Unlock columns`,
                onClick: this.handleClickMenu
            });
            menus.push({
                id: menus.length,
                type: "menu-item",
                separation: false,
                caption: `Lock columns until ${data.column.caption}`,
                onClick: this.handleClickMenu
            });
            if (
                this.props.contextualMenu &&
                this.props.contextualMenu[menuId]
            ) {
                this.props.contextualMenu[menuId].forEach((menu, index) =>
                    menus.push({
                        id: menus.length,
                        separation: index === 0 && menus.length > 0,
                        type: menu.type,
                        caption: menu.caption,
                        onClick: menu.function
                    })
                );
            }
        } else if (menuId === "top-left-corner-menu") {
            if (this.state.meta.table.editable) {
                menus.push({
                    id: menus.length,
                    type: "menu-item",
                    checked: this.state.filters.status_ === undefined,
                    caption: `No status filter`,
                    onClick: this.handleClickMenu
                });
                menus.push({
                    id: menus.length,
                    type: "sub-menu",
                    separation: menus.length > 0,
                    caption: `Status filters`,
                    children: [
                        {
                            id: 101,
                            type: "menu-item",
                            checked:
                                (1 |
                                    (this.state.filters.status_ || { v: 0 })
                                        .v) ===
                                (this.state.filters.status_ || { v: 0 }).v,
                            // disable: utils.isNullOrUndefined(this.state.meta.lockedIndex),
                            separation: false,
                            caption: `Updated rows`,
                            onClick: this.handleClickMenu
                        },
                        {
                            id: 102,
                            type: "menu-item",
                            checked:
                                (2 |
                                    (this.state.filters.status_ || { v: 0 })
                                        .v) ===
                                (this.state.filters.status_ || { v: 0 }).v,
                            separation: false,
                            caption: `New rows`,
                            onClick: this.handleClickMenu
                        },
                        {
                            id: 104,
                            type: "menu-item",
                            checked:
                                (4 |
                                    (this.state.filters.status_ || { v: 0 })
                                        .v) ===
                                (this.state.filters.status_ || { v: 0 }).v,
                            separation: false,
                            caption: `Deleted rows`,
                            onClick: this.handleClickMenu
                        },
                        {
                            id: 108,
                            type: "menu-item",
                            // disable: utils.isNullOrUndefined(this.state.meta.lockedIndex),
                            checked:
                                (8 |
                                    (this.state.filters.status_ || { v: 0 })
                                        .v) ===
                                (this.state.filters.status_ || { v: 0 }).v,
                            separation: false,
                            caption: `Rows with errors`,
                            onClick: this.handleClickMenu
                        }
                    ]
                });
            }
            if (this.state.meta.row.audit) {
                menus.push({
                    id: menus.length,
                    type: "menu-item",
                    disable: this.state.auditedRow === undefined,
                    separation: this.state.meta.table.editable,
                    caption: `Close audit`,
                    onClick: this.handleClickMenu
                });
            }
            if (
                this.props.contextualMenu &&
                this.props.contextualMenu[menuId]
            ) {
                this.props.contextualMenu[menuId].forEach((menu, index) =>
                    menus.push({
                        id: menus.length,
                        separation: index === 0 && menus.length > 0,
                        type: menu.type,
                        caption: menu.caption,
                        onClick: menu.function
                    })
                );
            }
        }
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
}
