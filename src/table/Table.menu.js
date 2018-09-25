import { Component } from "react";
import { utils } from "zebulon-controls";
import { computeMetaPositions } from "./utils/compute.meta";
import { rollback } from "./utils/utils";

export class TableMenu extends Component {
    handleClickMenu = (props, item) => {
        if (props.menu === "column-header-menu") {
            const column = props.column;
            const { data, meta, params, scroll } = this.state;
            if (item.id <= 1) {
                if (!utils.isNullOrUndefined(meta.lockedIndex)) {
                    meta.properties[meta.lockedIndex].locked = false;
                }
                if (item.id) {
                    meta.properties[column.index_].locked = true;
                }
                computeMetaPositions(meta);
                this.setState({
                    scroll: {
                        ...scroll,
                        columns: {
                            direction: 1,
                            index: 0,
                            position: 0,
                            shift: 0,
                            startIndex: 0
                        }
                    }
                });
            } else {
                item.function({ data, meta, params, column, table: this });
            }
        } else if (props.menu === "row-header-menu") {
            const { row, status } = props;
            const { data, meta, params, updatedRows } = this.state;
            if (item.id === 0) {
                rollback(updatedRows, row.index_);
                this.setState({ scroll: this.state.scroll });
            } else if (item.id === 1) {
                const prevScroll = this.state.scroll;
                const prevRange = this.state.selectedRange;
                //  this.setState({
                //     prevScroll,
                //     prevRange
                // });
                // const columns =
                //     props.meta && props.meta.visibleIndexes
                //         ? props.meta.visibleIndexes[0]
                //         : 0;
                // const selectedRange = {
                //     start: { rows: 0, columns },
                //     end: { rows: 0, columns }
                // };
                const selectedRange = {
                    start: { rows: 0, columns: 0 },
                    end: { rows: 0, columns: 0 }
                };
                const scroll = {
                    rows: {
                        index: 0,
                        direction: 1,
                        startIndex: 0,
                        shift: 0,
                        position: 0
                    },
                    columns: {
                        index: 0,
                        direction: 1,
                        startIndex: 0,
                        shift: 0,
                        position: 0
                    }
                };
                this.setState({
                    scroll,
                    prevScroll,
                    selectedRange,
                    prevRange
                });
            } else {
                return item.function({
                    data,
                    meta,
                    params,
                    row,
                    status,
                    table: this
                });
            }
        } else if (props.menu === "top-left-corner-menu") {
            const { filters, data, meta, params, updatedRows } = this.state;
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
            if (item.id === 2) {
                const scroll = this.state.prevScroll;
                const selectedRange = this.state.prevRange;
                // computeMetaPositions(meta);
                this.setState({
                    scroll,
                    prevScroll: undefined,
                    selectedRange,
                    prevRange: undefined
                });
            } else if (item.id === 0 || (item.id >= 100 && item.id < 104)) {
                if (item.id === 0 || filter.v === 0) {
                    delete filters.status_;
                } else if (item.id >= 100) {
                    filters.status_ = filter;
                }
                this.setState({
                    filteredData: this.filters(
                        data,
                        filters,
                        false,
                        updatedRows
                    )
                });
            } else {
                item.function({ data, meta, params, table: this });
            }
        } else if (props.menu === "cell-menu") {
            const { row, column } = props;
            const { data, meta, params } = this.state;
            item.function({ data, meta, params, row, column, table: this });
        }
    };
}
//     getCustomMenu = (menu, menus) => {
//         if (this.customContextualMenu && this.customContextualMenu[menu]) {
//             this.customContextualMenu[menu].forEach((menu, index) => {
//                 const item = {
//                     id: 1000000 + menus.length,
//                     separation: index === 0 && menus.length > 0,
//                     type: menu.type,
//                     caption: menu.caption,
//                     onClick: this.handleClickMenu,
//                     function: menu.function,
//                     children: menu.type === "sub-menu" ? [] : undefined
//                 };
//                 menus.push(item);
//             });
//         }
//     };
//     getMenu = (menu, data) => {
//         console.log(this.state, this.table.state);
//         const menus = [];
//         if (menu === "row-header-menu") {
//             if (this.state.meta.table.editable) {
//                 menus.push({
//                     id: menus.length,
//                     type: "menu-item",
//                     disable: !(data.status || {}).updated_,
//                     separation: false,
//                     caption: `Rollback row updates`,
//                     onClick: this.table.handleClickMenu
//                 });
//             }
//             if (this.state.meta.row.audit) {
//                 menus.push({
//                     id: menus.length,
//                     type: "menu-item",
//                     disable: this.state.auditedRow !== undefined,
//                     // separation: false,
//                     caption: `Audit`,
//                     onClick: this.handleAudit
//                 });
//             }
//         } else if (menu === "column-header-menu") {
//             menus.push({
//                 id: menus.length,
//                 type: "menu-item",
//                 disable: utils.isNullOrUndefined(
//                     this.table.state.meta.lockedIndex
//                 ),
//                 separation: false,
//                 caption: `Unlock columns`,
//                 onClick: this.table.handleClickMenu
//             });
//             menus.push({
//                 id: menus.length,
//                 type: "menu-item",
//                 separation: false,
//                 caption: `Lock columns until ${data.column.caption}`,
//                 onClick: this.table.handleClickMenu
//             });
//         } else if (menu === "top-left-corner-menu") {
//             if (this.state.meta.table.editable) {
//                 menus.push({
//                     id: menus.length,
//                     type: "menu-item",
//                     checked: this.table.state.filters.status_ === undefined,
//                     caption: `No status filter`,
//                     onClick: this.table.handleClickMenu
//                 });
//                 const checked = i =>
//                     (i |
//                         (this.table.state.filters.status_ || {
//                             v: 0
//                         }).v) ===
//                     (this.table.state.filters.status_ || { v: 0 }).v;
//                 menus.push({
//                     id: menus.length,
//                     type: "sub-menu",
//                     separation: menus.length > 0,
//                     caption: `Status filters`,
//                     children: [
//                         {
//                             id: 101,
//                             type: "menu-item",
//                             checked: checked(1),
//                             separation: false,
//                             caption: `Updated rows`,
//                             onClick: this.table.handleClickMenu
//                         },
//                         {
//                             id: 102,
//                             type: "menu-item",
//                             checked: checked(2),
//                             separation: false,
//                             caption: `New rows`,
//                             onClick: this.table.handleClickMenu
//                         },
//                         {
//                             id: 104,
//                             type: "menu-item",
//                             checked: checked(4),
//                             separation: false,
//                             caption: `Deleted rows`,
//                             onClick: this.table.handleClickMenu
//                         },
//                         {
//                             id: 108,
//                             type: "menu-item",
//                             // disable: utils.isNullOrUndefined(this.state.meta.lockedIndex),
//                             checked: checked(8),
//                             separation: false,
//                             caption: `Rows with errors`,
//                             onClick: this.table.handleClickMenu
//                         }
//                     ]
//                 });
//             }
//             if (this.state.meta.row.audit) {
//                 menus.push({
//                     id: menus.length,
//                     type: "menu-item",
//                     disable: this.state.auditedRow === undefined,
//                     separation: this.state.meta.table.editable,
//                     caption: `Close audit`,
//                     onClick: this.handleCloseAudit
//                 });
//             }
//         }
//         this.getCustomMenu(menu, menus);
//         if (menus.length) {
//             return {
//                 type: "menu",
//                 position: "bottom",
//                 children: menus
//             };
//         } else {
//             return null;
//         }
//     };
// }
