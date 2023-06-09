import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import store, {formatDate} from './store';
import { v4 as uuidv4 } from 'uuid';
import { Toolbar, Item } from 'devextreme-react/toolbar';
import FilterItem from './filterItem';
import './filter.css';

class Filter extends Component {
    constructor(props) {
        super(props);

        this.state = {
            filterElements: []
        }
    }

    itemsToElements = () => {
        const arr = store.filterItems.map(item =>
            <FilterItem
                uid={item.uid}
                key={item.uid}
                fk_fld={item.fk_fld}
                oper={item.oper}
                values={item.values}
                required={item.required}
                checked={item.checked}
                addFilterItem={this.addFilterItem}
                deleteFilterItem={this.deleteFilterItem}
                updateFilterHeight={this.updateFilterHeight}
            />
        );
        //console.log(arr);
        return arr;
    }

    loadFilter = () => {

        if (!store.getFilterItem('00000')) {
            store.filterItems.push({ uid: '00000', fk_fld: "PROD_KIND_ID", oper: "=", values: [1], checked: true, required: true });
        }
        if (!store.getFilterItem('11111')) {
            store.filterItems.push({ uid: '11111', fk_fld: "CARRY_DIRECT_ID", oper: "IN", values: [2], checked: true, required: false });
        }
        if (!store.getFilterItem('33333')) {
            let MinDate = new Date(store.maxDate);
            MinDate.setMonth(store.maxDate.getMonth() - 1);
            store.filterItems.push({ uid: '33333', fk_fld: "DATE_IN", oper: "BETWEEN", values: [formatDate(MinDate), formatDate(store.maxDate)], checked: true, required: false });
        }

        this.setState({ filterElements: this.itemsToElements() });
    }

    addFilterItem = (srcUid) => {

        let idx = -1;
        store.filterItems.forEach((item, index) => {
            if (item.uid === srcUid) {
                idx = index + 1;
                return;
            }
        });

        store.filterItems.splice(idx, 0, { uid: uuidv4(), fk_fld: "", oper: "=", values: [], checked: true, required: false });

        this.setState({ filterElements: this.itemsToElements() });
        this.updateFilterHeight();
    }

    deleteFilterItem = (uid) => {
        let arr = [...this.state.filterElements];
        const newArr = arr.filter(item => item.props.uid !== uid);
        store.filterItems = store.filterItems.filter(item => item.uid !== uid);
        console.log(store.filterItems);
        this.setState({ filterElements: newArr });

        this.props.updateFilterHeight();
    }

    updateFilterHeight = () => {
        this.props.updateFilterHeight();
    }

    saveClick = () => {
        console.log(store.unProxyGridStruct());
        console.log(toJS(store.filterItems));
    }

    render() {
        return (
            <>
                <div className='filter_content'>
                    <Toolbar>
                        <Item
                            location="before"
                            widget="dxButton"
                            options={{ text: "Применить", type: "success", icon: "check", onClick: () => { this.props.refreshData() } }} >
                        </Item>

                        <Item
                            location="before"
                            widget="dxButton"
                            options={{ text: "Сохранить", type: "success", icon: "save", onClick: this.saveClick }} >
                        </Item>
                    </Toolbar>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {
                            this.state.filterElements.map((el, idx) => <a key={idx}>{el}</a>)
                        }
                    </div>
                </div>
            </>
        )
    }
}

export default observer(Filter);
