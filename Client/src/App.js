import React from 'react';
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.carmine.compact.css';
import CustomStore from 'devextreme/data/custom_store';
import { LoadPanel } from 'devextreme-react/load-panel';
import { Toolbar, Item } from 'devextreme-react/toolbar';
import DataGrid, {
    RemoteOperations, Scrolling, GroupPanel, Paging, Pager, Grouping,
    Column, SearchPanel, HeaderFilter, GroupItem, Summary, TotalItem,
    FilterPanel, FilterBuilderPopup, FilterRow
} from 'devextreme-react/data-grid';
import './App.css';
import { observer } from 'mobx-react';
import Container from './containter';
import Box, { Item as BoxItem } from 'devextreme-react/box';

import ruMessages from "devextreme/localization/messages/ru.json";
import { locale, loadMessages } from "devextreme/localization";

import store from './store';
import Filter from './filter.js';

const isNotEmpty = (value) => value !== undefined && value !== null && value !== '';

let formatter = new Intl.NumberFormat("ru", {
    style: "decimal",
    minimumFractionDigits: 0
});

const GroupCell = (el, data) => {
    el.append(data.value + ` (Строк: ${data.data.count}, Вес: ${formatter.format(data.data.summa)} т)`);
};

class App extends React.Component {
    gridSource = new CustomStore({
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
    
            const data = await getData(params);
            this.setState({loadPanelVisible: false});
            this.grid.current.instance.endUpdate();
            return data;
        }
    });
    
    constructor(props) {
        super(props);

        this.state = {
            filterHeight: "118px",
            filterValue: [],
            columns: [],
            dataSource: [],
            loadPanelVisible: false
        }

        this.grid = React.createRef();
        //this.filter = React.createRef();

        loadMessages(ruMessages);
        locale(navigator.language);
    }

    componentDidMount = async () => {
        this.setState({loadPanelVisible: true});
        await store.getTables();
        await store.getGridStruct();

        const arr = await fetch('/api/query?sql=select Max(DATE_IN) as MaxDate from RZD.Data');
        const MaxDate = new Date((await arr.json())[0].MaxDate);
        let MinDate = new Date(MaxDate);
        MinDate.setMonth(MaxDate.getMonth() - 2);

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

        this.setState({ dataSource: this.gridSource, columns: cols }, () => {
  //          grid.endUpdate();
            cols.forEach(col => {
                if (col.tab_name) {
                    const src = store.tables.find(item => item.fk_display_fld === col.dataField);
                    grid.columnOption(col.dataField, 'headerFilter.dataSource', src.data);
                }
                //});
            });
        });
    }

    contentReady = () => {
        this.setState({loadPanelVisible: false});
    }

    customizeDate = (cellInfo) => {
        return new Date(cellInfo.value).toLocaleDateString();
    }

    rowExpanding = (e) => {
        const grid = this.grid.current.instance;

        grid.collapseAll(e.key.length - 1);
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

    updateFilterHeight = (count) => {
        const h = (86 + count * 32).toString() + 'px';
        //console.log(count);
        this.setState({filterHeight: h});
    }

    render() {
        return (
            <>
                <LoadPanel visible={this.state.loadPanelVisible} />

                <Toolbar>
                    <Item
                        location="before"
                        widget="dxButton"
                        options={{ icon: "filter", type: store.filterOpened ? 'danger' : 'normal', text: "Условия", onClick: () => { store.setFilterOpened(!store.filterOpened) } }} >
                    </Item>

                    <Item
                        location="before"
                        widget="dxButton"
                        options={{ icon: "fields", type: store.fieldsOpened ? 'danger' : 'normal', text: "Столбцы", onClick: () => { store.setFieldsOpened(!store.fieldsOpened) } }} >
                    </Item>
                </Toolbar>

                <div style={{ marginBottom: "4px" }} />

                <Box direction='row' width="100%" height="calc(100vh - 35px)">
                    <BoxItem ratio={0} baseSize="350px" visible={store.fieldsOpened}>
                        <Container title="Столбцы" closeButton={true} onCloseClick={this.closeFields} />
                    </BoxItem>

                    <BoxItem ratio={2}>
                        <Box direction='col' width="100%" height="100%">
                            <BoxItem ratio={0} baseSize="auto" visible={store.filterOpened}>
                                <Container title="Условия фильтра" height={this.state.filterHeight} closeButton={true} onCloseClick={this.closeFilter}>
                                    <Filter updateFilterHeight={this.updateFilterHeight} />
                                </Container>
                            </BoxItem>
                            <BoxItem ratio={2}>
                                <Container title="Результат запроса">
                                    <DataGrid
                                        ref={this.grid}
                                        dataSource={this.state.dataSource}
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
                                        columns={this.state.columns}
                                        // onContentReady={this.contentReady}
                                    >
                                        <RemoteOperations groupPaging={true} />
                                        <Scrolling mode="virtual" />
                                        <Grouping autoExpandAll={false} />
                                        <GroupPanel visible={true} />
                                        <SearchPanel visible={false} />
                                        <HeaderFilter visible={true} height="700" width="600" allowSearch={true} />
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

export default observer(App);
