import React, { Component } from 'react';
import { observer } from 'mobx-react';
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

        // let items = [...this.state.filterElements];
        // items.push( {atrib: 'JOPA', id: 1} );
        // store.setFilterElements(items);
    }

    deleteFilterItem = (id) => {
        let arr = [...this.state.filterElements];
        arr.forEach((el, idx) => {
            if (el.props.id === id) {
                console.log(idx);
                arr.splice(idx, 1);
                return;
            }
        });
        this.setState({ filterElements: arr }, () => {
            const c = this.state.filterElements.length;
            this.props.updateFilterHeight(c);
        });
    }

    addFilterItem = () => {
        let items = [...this.state.filterElements];
        const id = uuidv4();

        console.log(id);
        items.push(<FilterItem id={id} addFilterItem={this.addFilterItem} deleteFilterItem={this.deleteFilterItem} />);

        this.setState({ filterElements: items }, () => {
            const c = this.state.filterElements.length;
            this.props.updateFilterHeight(c);
        });


        //        this.props.updateFilterHeight(items.length);

        // let arr = [...store.filterItems];
        // arr.push({atrib: 'JOPA2', id: id});

        // store.setFilterItems(arr);
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