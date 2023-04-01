import React, { Component } from 'react';
import SelectBox from 'devextreme-react/select-box';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import store from './store';
import CheckBox from 'devextreme-react/check-box';
import './filter.css';
import FilterItem from './filterItem';


class Filter extends Component {

    constructor(props) {
        super(props);

        const uid = '00000';

        this.state = {
            filterElements: [
                <FilterItem uid={uid}
                    addFilterItem={this.addFilterItem}
                    deleteFilterItem={this.deleteFilterItem}
                    
                    disabled={true}
                />
            ]
        }

    }

    addFilterItem = () => {
        let arr = [...this.state.filterElements];
        const uid = uuidv4();
        arr.push(<FilterItem uid={uid} addFilterItem={this.addFilterItem} deleteFilterItem={this.deleteFilterItem} />);
        this.setState({ filterElements: arr });
    }

    deleteFilterItem = (uid) => {
        let arr = [...this.state.filterElements];
        const newArr = arr.filter(item => item.props.uid !== uid);
        this.setState({ filterElements: newArr });
    }

    onValueChanged = (el) => {
        store.tables.find()
    }

    bla() {
        console.log(toJS(store.tables));
    }

    render() {
        return (
            <>
                <div className='filter_content'>
                    {this.state.filterElements.map((el, idx) => <a key={idx}>{el}</a>)}
                </div>
                <div className="dx-fieldset">

                </div>
            </>
        )
    }
}

export default observer(Filter);
