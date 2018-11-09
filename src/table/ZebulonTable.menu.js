import { Component } from "react";
import { utils } from "zebulon-controls";
import { computeMetaPositions } from "./utils/compute.meta";
// import { rollback } from "./utils/utils";

export class ZebulonTableMenu extends Component {
    handleAudit = (props, item) => {
        const { row, status } = props;
        console.log("zebtable", this.state);
        const audits = this.state.meta.row.auditFunction({
            row: status.row || status.rowUpdated
        });
        if (utils.isPromise(audits)) {
            this.setState({
                status: { loaded: false, loading: true }
            });
            audits.then(audits => {
                this.setState({
                    auditedRow: row,
                    audits: audits || [],
                    status: { loaded: true, loading: false }
                });
                if (this.props.onRowEnter) {
                    this.props.onRowEnter({
                        audited: true,
                        row: (audits || [])[0]
                    });
                }
            });
        } else {
            this.setState({
                auditedRow: row,
                audits: audits || [],
                status: { loaded: true, loading: false }
            });
            if (this.props.onRowEnter) {
                this.props.onRowEnter({
                    audited: true,
                    row: (audits || [])[0]
                });
            }
        }
        this.table.handleClickMenu(props, item);
    };
    handleCloseAudit = (props, item) => {
        this.setState({
            auditedRow: undefined,
            audits: undefined
        });
        if (this.props.linkedObjects) {
            this.props.linkedObjects.forEach(object =>
                object.setState({
                    auditedRow: undefined,
                    audits: undefined
                })
            );
        }
        this.table.handleClickMenu(props, item);
    };
    // handleClickMenu = (props, item) => {
    //     const a = 1;
    //     console.log("zebtable", this.state);
    //     return true;
    // };
    handleRollback = (props, item) => {
        this.rollback(this.state.updatedRows, props.row.index_);
        this.table.handleClickMenu(props, item);
    };

    getCustomMenu = (menu, menus) => {
        if (this.props.contextualMenu && this.props.contextualMenu[menu]) {
            this.props.contextualMenu[menu].forEach((menu, index) => {
                const id = menu.id || 1000000 + menus.length;
                const children =
                    menu.children ||
                    (menu.type === "sub-menu" ? [] : undefined);
                const item = {
                    ...menu,
                    id: menu.id || 1000000 + menus.length,
                    children
                };
                item.onClick = e =>
                    (menu.onClick || this.handleClickMenu)(e, item);
                menus.push(item);
            });
        }
    };
    getMenu = (menu, data) => {
        // console.log(this.state, this.table.state);
        const menus = [];
        if (!this.props.isActive && this.props.onActivation) {
            this.props.onActivation({ ...data, menu });
        }
        if (menu === "row-header-menu") {
            if (this.state.meta.table.editable) {
                menus.push({
                    id: menus.length,
                    type: "menu-item",
                    disable: !(data.status || {}).updated_,
                    separation: false,
                    caption: `Rollback row updates`,
                    onClick: this.handleRollback
                });
            }
            if (this.state.meta.row.audit) {
                menus.push({
                    id: menus.length,
                    type: "menu-item",
                    disable: this.state.auditedRow !== undefined,
                    // separation: false,
                    caption: `Audit`,
                    onClick: this.handleAudit
                });
            }
        } else if (menu === "column-header-menu") {
            menus.push({
                id: menus.length,
                type: "menu-item",
                disable: utils.isNullOrUndefined(
                    this.table.state.meta.lockedIndex
                ),
                separation: false,
                caption: `Unlock columns`,
                onClick: this.table.handleClickMenu
            });
            menus.push({
                id: menus.length,
                type: "menu-item",
                separation: false,
                caption: `Lock columns until ${data.column.caption}`,
                onClick: this.table.handleClickMenu
            });
        } else if (menu === "top-left-corner-menu") {
            if (this.state.meta.table.editable) {
                menus.push({
                    id: menus.length,
                    type: "menu-item",
                    checked: this.table.state.filters.status_ === undefined,
                    caption: `No status filter`,
                    onClick: this.table.handleClickMenu
                });
                const checked = i =>
                    (i |
                        (this.table.state.filters.status_ || {
                            v: 0
                        }).v) ===
                    (this.table.state.filters.status_ || { v: 0 }).v;
                menus.push({
                    id: menus.length,
                    type: "sub-menu",
                    separation: menus.length > 0,
                    caption: `Status filters`,
                    children: [
                        {
                            id: 101,
                            type: "menu-item",
                            checked: checked(1),
                            separation: false,
                            caption: `Updated rows`,
                            onClick: this.table.handleClickMenu
                        },
                        {
                            id: 102,
                            type: "menu-item",
                            checked: checked(2),
                            separation: false,
                            caption: `New rows`,
                            onClick: this.table.handleClickMenu
                        },
                        {
                            id: 104,
                            type: "menu-item",
                            checked: checked(4),
                            separation: false,
                            caption: `Deleted rows`,
                            onClick: this.table.handleClickMenu
                        },
                        {
                            id: 108,
                            type: "menu-item",
                            // disable: utils.isNullOrUndefined(this.state.meta.lockedIndex),
                            checked: checked(8),
                            separation: false,
                            caption: `Rows with errors`,
                            onClick: this.table.handleClickMenu
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
                    onClick: this.handleCloseAudit
                });
            }
        }
        this.getCustomMenu(menu, menus);
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
