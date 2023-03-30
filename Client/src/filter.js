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
            filterElements: [<FilterItem fk_fld="PROD_KIND_ID" oper="=" disabled={true} addFilterItem={this.addFilterItem} />]
        }

        const items = [...store.filterItems];
        if (!items.length) {
            items.push({ uid: uuidv4(), fk_fld: "PROD_KIND_ID", oper: "=" });
            store.setFilterItems(items);
        }
    }

    componentDidMount = () => {
        // const items = [...store.filterItems];
        // items.push( {uid: uuidv4(), fk_fld: "PROD_KIND_ID", oper: "="} );
        // store.setFilterItems(items);
    }

    deleteFilterItem = (id) => {
        let arr = [...this.state.filterElements];
        arr.forEach((el, idx) => {
            if (el.props.uid === uid) {
                arr.splice(idx, 1);
                return;
            }
        });

        this.setState({ filterElements: arr }, () => {
            const cnt = this.state.filterElements.length;
            this.props.updateFilterHeight(cnt);
        });
    }

    addFilterItem = () => {
        let items = [...this.state.filterElements];
        const uid = uuidv4();

        items.push(<FilterItem uid={uid} addFilterItem={this.addFilterItem} deleteFilterItem={this.deleteFilterItem} />);

        console.log(toJS(store.filterItems))

        this.setState({ filterElements: items }, () => {
            const cnt = this.state.filterElements.length;
            this.props.updateFilterHeight(cnt);
        });
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
                            location="after"
                            widget="dxButton"
                            options={{ text: "Сохранить", type: "success", icon: "save", onClick: () => { } }} >
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