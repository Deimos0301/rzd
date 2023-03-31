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
            filterElements: [
                <FilterItem 
                    uid='00000'
                    fk_fld="PROD_KIND_ID"
                    oper="=" values={1}
                    disabled={true}
                    addFilterItem={this.addFilterItem}
                    updateFilterHeight={this.updateFilterHeight} 
                />,
                <FilterItem 
                    uid="11111"
                    fk_fld="REGION_ID_IN"
                    oper="IN" values={[58, 26]}
                    disabled={false} 
                    addFilterItem={this.addFilterItem}
                    updateFilterHeight={this.updateFilterHeight} 
                />]
        }

        const items = [...store.filterItems];
        
        if (!items.find(el => el.uid === '00000')) {
            items.push({ uid: '00000', fk_fld: "PROD_KIND_ID", oper: "=", values: 1, disabled: true });
            store.setFilterItems(items);
        }
        if (!items.find(el => el.uid === '11111')) {
            items.push({ uid: '11111', fk_fld: "REGION_ID_IN", oper: "IN", values: [58, 26], disabled: true });
            store.setFilterItems(items);
        }
    }

    componentDidMount = () => {
    }

    deleteFilterItem = (uid) => {
        let arr = [...store.filterItems];
        //arr.forEach(item => console.log('ДО', toJS(item)))
        arr = arr.filter(item => item.uid !== uid);


        let newArr = [];

        arr.forEach(item => {
            newArr.push(
                <FilterItem 
                    uid={item.uid} 
                    fk_fld={item.fk_fld} 
                    oper={item.oper} 
                    values={item.values} 
                    disabled={item.disabled} 
                    addFilterItem={this.addFilterItem} 
                    deleteFilterItem={this.deleteFilterItem} 
                    updateFilterHeight={this.updateFilterHeight}
                />);
        });

        //arr.forEach(item => console.log('ПОСЛЕ', toJS(item)))

        this.setState({ filterElements: newArr });

        console.log(newArr.length);
        this.props.updateFilterHeight(newArr.length);
        store.setFilterItems(arr);
    }

    updateFilterHeight = () => {
        const cnt = this.state.filterElements.length;
        this.props.updateFilterHeight(cnt);
    }

    addFilterItem = (srcUid) => {
        let arr = [...this.state.filterElements];
        console.log(srcUid)
        const uid = uuidv4();

        arr.push(
            <FilterItem 
                uid={uid}
                fk_fld="" 
                oper="=" 
                disabled={false}
                addFilterItem={this.addFilterItem}
                deleteFilterItem={this.deleteFilterItem}
                updateFilterHeight={this.updateFilterHeight}
            />);

        this.setState({ filterElements: arr }, () => {
            this.updateFilterHeight();
        });

        arr = [...store.filterItems];
        arr.push({ uid: uid, fk_fld: "", oper: "=", values: [], disabled: false });
        store.setFilterItems(arr);
        //console.log(toJS(store.filterItems));
    }

    saveClick = () => {
        console.log(toJS(this.state.filterElements));
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