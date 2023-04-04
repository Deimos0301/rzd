import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import store from './store';
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
                disabled={item.disabled}
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
            store.filterItems.push({ uid: '00000', fk_fld: "PROD_KIND_ID", oper: "=", values: 1, disabled: true });
        }
        if (!store.getFilterItem('11111')) {
            store.filterItems.push({ uid: '11111', fk_fld: "REGION_ID_IN", oper: "IN", values: [58, 26], disabled: false });
        }
        if (!store.getFilterItem('22222')) {
            store.filterItems.push({ uid: '22222', fk_fld: "CARGO_TONNAGE", oper: "BETWEEN", values: [10, 20], disabled: false });
        }

        this.setState({filterElements: this.itemsToElements()});
    }

    deleteFilterItem = (uid) => {
        let idx = -1;

        store.filterItems.forEach((item, index) => {
            if (item.uid === uid) {
                idx = index;
                return;
            }
        });

        store.filterItems.splice(idx, 1);

        this.setState({ filterElements: this.itemsToElements() });

        this.props.updateFilterHeight();
    }

    updateFilterHeight = () => {
        this.props.updateFilterHeight();
    }

    addFilterItem = (srcUid) => {
        
        //let arr = [...store.filterItems];
        store.filterItems.push({ uid: uuidv4(), fk_fld: "", oper: "=", values: [], disabled: false });
        
        // let idx = -1;
        // store.filterItems.forEach((item, index) => {
        //     if (item.uid === srcUid) {
        //         idx = index + 1;
        //         return;
        //     }
        // });

        // store.filterItems.splice(idx, 0, { uid: uuidv4(), fk_fld: "", oper: "=", values: [], disabled: false });

        //store.setFilterItems(arr);

        this.setState({filterElements: this.itemsToElements()});
        this.updateFilterHeight();
        // console.log(toJS(store.filterItems))
    }

    saveClick = () => {
        // this.loadFilter();
        console.log(this.state.filterElements);
        console.log(toJS(store.filterItems));
    }

    atribChange = (el, uid) => {
        let aaa = this.state.filterElements.find(item => item.props.uid === uid);
        console.log(el)
    }

    render() {
        return (
            <>
                <div className='filter_content'>
                    <Toolbar>
                        <Item
                            location="before"
                            widget="dxButton"
                            options={{ text: "Применить", type: "success", icon: "check", onClick: () => { console.log(this.state.filterElements) } }} >
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