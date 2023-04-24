import React, { Component } from "react";
import { observer } from "mobx-react";
import DataGrid, { Column, Paging, RowDragging, Editing, Sorting, Lookup } from 'devextreme-react/data-grid';
import { Toolbar, Item } from 'devextreme-react/toolbar';
import store from "./store";

const sortData = [
    {value: 'NONE', text: 'Нет'},
    {value: 'ASC', text: 'По возр'},
    {value: 'DESC', text: 'По убыв'}
];

class Columns extends Component {
    render() {
        return (
            <>
                <div style={{padding: "1px 5px 5px 5px"}}>
                    <Toolbar>
                        <Item
                            location="before"
                            widget="dxButton"
                            options={{ text: "Применить", type: "success", icon: "check", onClick: () => { this.props.applyGridStruct() } }} >
                        </Item>

                        <Item
                            location="after"
                            widget="dxButton"
                            options={{ text: "Сохранить", type: "success", icon: "save", onClick: this.saveClick }} >
                        </Item>
                    </Toolbar>
                </div>

                <DataGrid id="columns"
                    dataSource={store.gridStruct}
                    keyExpr="DS_ATRIB_ID"
                    showBorders={true}
                    showRowLines={true}
                    rowAlternationEnabled={true}
                    onRowUpdated={this.rowUpdated}
                    height="96%"
                >
                    <Sorting mode="none" />
                    <Editing mode="cell" allowAdding={false} allowDeleting={false} allowUpdating={true} />

                    <Column dataField="IS_VISIBLE" width={35} caption="Вкл" alignment="center" />
                    <Column dataField="ATRIB_GRID_NAME" caption="Название столбца" allowEditing={true} />
                    <Column dataField="ATRIB_ALIAS" caption="Имя поля" allowEditing={false} visible={false} />
                    <Column dataField="SORT" caption="Сортировка" width={80} allowEditing={true}>
                        <Lookup dataSource={sortData} valueExpr="value" displayExpr="text" />
                    </Column>
                    <Column dataField="IS_GROUP" width={75} alignment="center" caption="Группировка" />

                    <RowDragging allowReordering={true} showDragIcons={true} onReorder={this.onReorder} />
                    <Paging defaultPageSize={100} />
                </DataGrid>
            </>
        );
    }

    onReorder = (e) => {
        const visibleRows = e.component.getVisibleRows();
        const newStruct = [...store.gridStruct];

        const toIndex = newStruct.findIndex(item => item.DS_ATRIB_ID === visibleRows[e.toIndex].data.DS_ATRIB_ID);
        const fromIndex = newStruct.findIndex(item => item.DS_ATRIB_ID === e.itemData.DS_ATRIB_ID);

        newStruct[fromIndex].ATRIB_ORDER = toIndex + 1;
        newStruct[toIndex].ATRIB_ORDER = fromIndex + 1;

        newStruct.splice(fromIndex, 1);
        newStruct.splice(toIndex, 0, e.itemData);


        store.setGridStruct(newStruct);
        
        //console.log(store.unProxyGridStruct());

        this.props.refreshData();
    }

    rowUpdated = (e) => {
        // console.log(e);
    }

    saveClick = async () => {
        await fetch('/api/setGridStruct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ json: store.unProxyGridStruct(), Profile_ID: 1 })
        });
    }
}

export default observer(Columns);
