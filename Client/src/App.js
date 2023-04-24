import React from 'react';
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.carmine.compact.css';
import CustomStore from 'devextreme/data/custom_store';
//import { LoadPanel } from 'devextreme-react/load-panel';
// import { Toolbar, Item } from 'devextreme-react/toolbar';
import { Button } from 'devextreme-react/button';
import DataGrid, {
    RemoteOperations, Scrolling, GroupPanel, Paging, Pager, Grouping,
    Sorting, SearchPanel, HeaderFilter, GroupItem, Summary, TotalItem,
    FilterPanel, FilterBuilderPopup, FilterRow
} from 'devextreme-react/data-grid';
import './App.css';
import { observer } from 'mobx-react';
import Container from './containter';
import Box, { Item as BoxItem } from 'devextreme-react/box';

import ruMessages from "devextreme/localization/messages/ru.json";
import { locale, loadMessages } from "devextreme/localization";

import { ReactComponent as LogoSVG } from './img/rzd.svg';

import store, { formatDate } from "./store";
import Filter from './filter.js';
import Columns from './columns';

const isNotEmpty = (value) => value !== undefined && value !== null && value !== '';

let formatter = new Intl.NumberFormat("ru", {
    style: "decimal",
    minimumFractionDigits: 0
});

const GroupCell = (el, data) => {
    let val = data.value;
    if (val instanceof Date)
        val = formatDate(val, true);
    el.append(val + ` (Строк: ${data.data.count}, Вес: ${formatter.format(data.data.summa)} т)`);
};

const getData = async (params) => {
    const data = await fetch(`/api/getData`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ params: params })
    });

    return await data.json();
}

const gridSource = new CustomStore({
    load: async (loadOptions) => {

        let params = {};

        const opts = [
            'filter',
            'group',
            'groupSummary',
            'parentIds',
            'requireGroupCount',
            'requireTotalCount',
            'searchExpr',
            'searchOperation',
            'searchValue',
            'select',
            'sort',
            'skip',
            'take',
            'totalSummary',
            'userData'
        ];

        opts.forEach(opt => {
            if (opt in loadOptions && isNotEmpty(loadOptions[opt])) {
                params = { ...params, [opt]: JSON.stringify(loadOptions[opt]) }
            }

            let where = [];

            store.filterItems.forEach(item => {
                if (item.checked && item.fk_fld && item.oper && item.values && Array.isArray(item.values) && item.values[0]) {
                    where.push({
                        fk_fld: item.fk_fld,
                        oper: item.oper,
                        values: item.values,
                        dataType: item.dataType
                    });
                }
            });
            params = { ...params, where: JSON.stringify(where) };
        });

        const data = await getData(params);
        return data;
    }
});


class App extends React.Component {

    constructor(props) {
        super(props);

        this.grid = React.createRef();
        this.filter = React.createRef();

        this.state = {
            filterHeight: "118px",
            filterValue: [],
            columns: [],
            dataSource: [],
            // loadPanelVisible: false
        }

        //this.filter = React.createRef();

        loadMessages(ruMessages);
        locale(navigator.language);
    }

    componentDidMount = async () => {
        await store.getMetaData();

        this.filter.current.loadFilter();

        let MinDate = new Date(store.maxDate);
        MinDate.setMonth(store.maxDate.getMonth() - 2);

        this.gridStructToColumns();
    }

    gridStructToColumns = () => {
        const grid = this.grid.current.instance;

        grid.beginUpdate();

        let cols = [];

        store.gridStruct.forEach(row => {
            let maxGroupIndex = -1;

            if (row.IS_GROUP)
                maxGroupIndex++;

            let src = store.tables.find(item => item.fk_display_fld === row.ATRIB_ALIAS);

            cols.push({
                dataField: row.ATRIB_ALIAS,
                caption: row.ATRIB_GRID_NAME,
                dataType: row.DATA_TYPE,
                width: row.DISPLAY_WIDTH,
                groupCellTemplate: GroupCell,
                tab_name: src ? src.tab_name : undefined,
                allowGrouping: row.DATA_TYPE != 'number',
                visible: row.IS_VISIBLE,
                sortOrder: row.SORT.toLowerCase(),
                groupIndex: row.IS_GROUP ? maxGroupIndex : -1
            });
        });

        this.setState({ columns: cols }, () => {
            // cols.forEach(col => {
            //     if (col.tab_name) {
            //         const src = store.tables.find(item => item.fk_display_fld === col.dataField);
            //         grid.columnOption(col.dataField, 'headerFilter.dataSource', src.data);
            //     }
            // });
            grid.endUpdate();
        });
    }

    customizeDate = (cellInfo) => {
        return new Date(cellInfo.value).toLocaleDateString();
    }

    rowExpanding = (e) => {
        this.grid.current.instance.collapseAll(e.key.length - 1);
    }

    openedChange = () => {
        store.setFilterOpened(!store.filterOpened);
    }

    closeFields = (e) => {
        store.setFieldsOpened(false);
    }

    closeFilter = (e) => {
        store.setFilterOpened(false);
    }

    updateFilterHeight = () => {
        const h = (80 + store.filterItems.length * 31).toString() + 'px';

        this.setState({ filterHeight: h });
    }

    gridOptionChanged = (e) => {
        if (e.name === 'columns') {
            const action = e.fullName.split('.')[1];
            const oldIdx = Number(e.fullName.split('.')[0].split('columns')[1].replace('[', '').replace(']', ''));

            let arr = [...store.gridStruct];

            if (action === 'groupIndex') {
                arr[oldIdx].IS_GROUP = e.value;
                arr[oldIdx].SORT = e.value === 1 ? 'ASC' : 'NONE';
                store.setGridStruct(arr);
            }

            if (action === 'sortOrder') {
                arr[oldIdx].SORT = !e.value ? 'NONE' : e.value.toUpperCase();
                store.setGridStruct(arr);
            }

            if (action === 'visibleIndex') {
                const newIdx = Number(e.value);

                arr[newIdx].ATRIB_ORDER = oldIdx;
                arr[oldIdx].ATRIB_ORDER = newIdx;

                arr = arr.sort((a, b) => Number(a.ATRIB_ORDER) - Number(b.ATRIB_ORDER));
                arr.forEach((el, idx) => {el.ATRIB_ORDER = idx + 1});
                store.setGridStruct(arr);
                console.log(store.unProxyGridStruct());
            }
        }
    }

    applyGridStruct = () => {
        this.gridStructToColumns();
    }

    refreshData = () => {
        this.grid.current.instance.refresh();
    }

    render() {
        return (
            <>
                {/* <LoadPanel visible={this.state.loadPanelVisible} /> */}

                <div className="logo" style={{ height: "32px", width: "100%", display: "flex", alignItems: "center", marginTop: "4px" }}>
                    <div style={{ marginLeft: "8px" }}> <LogoSVG /> </div>
                    <div style={{ marginLeft: "20px" }}><Button icon='fields' type={store.fieldsOpened ? 'danger' : 'normal'} text='Столбцы' onClick={() => { store.setFieldsOpened(!store.fieldsOpened) }} /> </div>
                    <div style={{ marginLeft: "5px" }}><Button icon='filter' type={store.filterOpened ? 'danger' : 'normal'} text='Условия' onClick={() => { store.setFilterOpened(!store.filterOpened) }} /> </div>
                    <div style={{ marginLeft: "550px", fontSize: "20px", fontWeight: "bold", fontFamily: "Tahoma, sans-serif" }}> Поставки по ж/д </div>
                </div>

                <div style={{ marginBottom: "4px" }} />

                <Box direction='row' width="100%" height="calc(100vh - 40px)">
                    <BoxItem ratio={0} baseSize="450px" visible={store.fieldsOpened}>
                        <Container title="Столбцы" closeButton={true} onCloseClick={this.closeFields}>
                            <Columns refreshData={this.refreshData} applyGridStruct={this.applyGridStruct} />
                        </Container>
                    </BoxItem>

                    <BoxItem ratio={2}>
                        <Box direction='col' width="100%" height="100%">
                            <BoxItem ratio={0} baseSize="auto" visible={store.filterOpened}>
                                <Container title="Условия фильтра" height={this.state.filterHeight} closeButton={true} onCloseClick={this.closeFilter}>
                                    <Filter
                                        ref={this.filter}
                                        refreshData={this.refreshData}
                                        updateFilterHeight={this.updateFilterHeight}
                                    />
                                </Container>
                            </BoxItem>
                            <BoxItem ratio={2}>
                                <Container title="Результаты запроса">
                                    <DataGrid
                                        ref={this.grid}
                                        dataSource={store.filterItems.length ? gridSource : undefined}
                                        columns={this.state.columns}
                                        height="96%"
                                        //width="100%"
                                        showBorders={true}
                                        wordWrapEnabled={true}
                                        showRowLines={true}
                                        hoverStateEnabled={true}
                                        focusedRowEnabled={false}
                                        allowColumnResizing={true}
                                        allowColumnReordering={true}
                                        rowAlternationEnabled={true}
                                        columnResizingMode="widget"
                                        columnWidth={300}
                                        filterValue={this.state.filterValue}
                                        onRowExpanding={this.rowExpanding}
                                        onOptionChanged={this.gridOptionChanged}
                                    >
                                        <RemoteOperations groupPaging={true} />
                                        <Sorting mode="multiple" />
                                        <Scrolling mode="virtual" />
                                        <Grouping autoExpandAll={false} />
                                        <GroupPanel visible={true} />
                                        <SearchPanel visible={false} />
                                        <HeaderFilter visible={false} height="700" width="600" allowSearch={true} />
                                        <FilterPanel visible={false} />
                                        <FilterRow visible={false} />
                                        <FilterBuilderPopup />

                                        <Summary>
                                            <GroupItem
                                                column="RN"
                                                summaryType="count"
                                            />
                                            <GroupItem
                                                column="CARGO_TONNAGE"
                                                summaryType="sum"
                                            />
                                            <TotalItem
                                                column="DATE_OUT"
                                                summaryType="count"
                                            />
                                        </Summary>

                                        <Paging
                                            //defaultPageSize={500}
                                            pageSize={500}
                                        />
                                        <Pager
                                            visible={true}
                                            allowedPageSizes={true}
                                            showPageSizeSelector={true}
                                            displayMode="full"
                                            showInfo={true}
                                            showNavigationButtons={true}
                                        />
                                    </DataGrid>
                                </Container>
                            </BoxItem>
                        </Box>
                    </BoxItem>
                </Box>
            </>
        );
    }
}

export default observer(App);
