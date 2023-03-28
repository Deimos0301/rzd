import React from 'react';
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import CustomStore from 'devextreme/data/custom_store';
import Drawer from 'devextreme-react/drawer';
import { Toolbar, Item } from 'devextreme-react/toolbar';
import DataGrid, {
    RemoteOperations, Scrolling, GroupPanel, Paging, Pager, Grouping,
    Column, SearchPanel, HeaderFilter, GroupItem, Summary, TotalItem,
    FilterPanel, FilterBuilderPopup, FilterRow
} from 'devextreme-react/data-grid';
import JSG from 'jsgjs';
import { observer } from 'mobx-react';
import ruMessages from "devextreme/localization/messages/ru.json";
import { locale, loadMessages } from "devextreme/localization";

import store from './store';
import { Col } from 'devextreme-react/responsive-box';

const isNotEmpty = (value) => value !== undefined && value !== null && value !== '';

var dataSource = new CustomStore({
    load: async (loadOptions) => {
        let params = '?';

        [
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
        ].forEach(i => {
            if (i in loadOptions && isNotEmpty(loadOptions[i])) {
                params += `${i}=${JSON.stringify(loadOptions[i])}&`;
            }
        });

        params = params.slice(0, -1);

        return await getData(params);
    },
    //key: "COUNTRY_ID"
});

let formatter = new Intl.NumberFormat("ru", {
    style: "decimal",
    minimumFractionDigits: 0
});

const GroupCell = (el, data) => {
    el.append(data.value + ` (Строк: ${data.data.count}, Вес: ${formatter.format(data.data.summa)} т)`);
    // return;
    // let S = el.text + ` (Строк: ${el.data.summary[0]}, Вес: ${formatter.format(el.data.summary[1])} т)`;

    // if (el.data.isContinuation)
    //     S += '    <...продолжение...>';
    // return <div>{S}</div>
};

const cellRender = (options) => {
    const tab = store.tables.find(item => item.tab_name === options.column.tab_name);
    //console.log(options.column);
    const fld = options.column.dataField;
    const val = tab.data.find(item => item.value === options.data[fld]);

    return <div>{val.text}</div>
}

//var arrStations = [];

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            filterOpened: false,
            filterValue: [],
            columns: []
        }

        this.grid = React.createRef();
        //this.filter = React.createRef();

        loadMessages(ruMessages);
        locale(navigator.language);
    }

    componentDidMount = async () => {
        const grid = this.grid.current.instance;

        grid.beginUpdate();

        await store.getTables();
        await store.getGridStruct();

        const arr = await fetch('/api/query?sql=select Max(DATE_IN) as MaxDate from RZD.Data');
        const MaxDate = new Date((await arr.json())[0].MaxDate);
        let MinDate = new Date(MaxDate);
        MinDate.setMonth(MaxDate.getMonth() - 2);

        //console.log(this.filter)

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
                groupIndex: row.IS_GROUP ? maxGroupIndex : -1
            });
        });

        const flt = [
            ['CARRY_DIRECT_NAME', 'anyof', ['Внутр. перевозк']],
            // "and",
            // [ 'PROD_KIND_NAME', 'anyof', ['Нефть и нефтепродукты']],
            "and",
            ['DATE_IN', 'between', [MinDate, MaxDate]]
        ];

        this.setState({ columns: cols }, () => {
            this.setState({ filterValue: flt }, () => {
                grid.endUpdate();
                cols.forEach(col => {
                    if (col.tab_name) {
                        const src = store.tables.find(item => item.fk_display_fld === col.dataField);
                        grid.columnOption(col.dataField, 'headerFilter.dataSource', src.data);
                    }
                });
            });
        });
    }

    customizeDate = (cellInfo) => {
        return new Date(cellInfo.value).toLocaleDateString();
    }

    rowExpanding = (e) => {
        const grid = this.grid.current.instance;

        grid.collapseAll(e.key.length - 1);
    }

    render() {
        return (
            <>
                <Toolbar>
                    <Item location="before"
                        widget="dxButton"
                        options={{ icon: "filter", onClick: () => { this.setState({ filterOpened: !this.state.filterOpened }); console.log(this.state.filterOpened) } }}
                    ></Item>
                </Toolbar>

                <Drawer
                    opened={this.state.filterOpened}
                    component={Filter}
                    openedStateMode='shrink'
                    closeOnOutsideClick={true}
                    position='left'
                    revealMode='slide'
                    height="100%" >

                    <DataGrid
                        ref={this.grid}
                        dataSource={dataSource}
                        height="96vh"
                        //width="100%"
                        showBorders={true}
                        wordWrapEnabled={true}
                        // columnAutoWidth={true}
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
                        columns={this.state.columns}
                    >
                        <RemoteOperations groupPaging={true} />
                        <Scrolling mode="virtual" />
                        <Grouping autoExpandAll={false} />
                        <GroupPanel visible={true} />
                        <SearchPanel visible={false} />
                        <HeaderFilter visible={true} height="700" width="600" allowSearch={true} />
                        <FilterPanel visible={true} />
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

                        {/* {this.state.columns.map(col => {
                    //let src = store.tables.find(item => item.tab_name === 'RZD.SPR_Station');
                    return (
                        <Column
                            key={col.dataField}
                            dataField={col.dataField}
                            caption={col.caption}
                            dataType={col.dataType}
                            width={col.width}
                            groupIndex={col.groupIndex}
                            groupCellRender={GroupCell}
                            tab_name={col.tab_name}
                        />)
                }
                )} */}
                    </DataGrid>
                </Drawer>
            </>
        );
    }
}

const getData = async (params) => {
    await store.getTables();

    const data = await fetch(`/api/getData${params}`);
    const js = await data.json();

    // let tab = store.tables.find(item => item.table === 'RZD.SPR_Region');

    // if (js.data.length > 0) {
    //     if (js.data[0].REGION_ID_IN) {
    //         tab = tab.data.map(item => {
    //             return { REGION_ID_IN: item.value, REGION_NAME_IN: item.text };
    //         });

    //         let arr = new JSG(js.data).innerJoin(tab, 'REGION_ID_IN').result();
    //         console.log(arr)
    //     }
    // }
    return js;
}

class Filter extends React.Component {
    render() {
        return <div className='filter_content' style={{ width: "800px", height: "100%", background: "aliceblue" }}>FILTER</div>
    }
}

export default observer(App);
