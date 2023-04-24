import { React, Component } from 'react';
import filter from './filter';
import './App.css';
import store from './store';
import { toJS } from 'mobx';

class List extends Component {
    constructor(props) {
        super(props)

        this.state = {
            disabled: false,
            fk_fld: this.props.fk_fld,
            oper: this.props.oper,
            values: this.props.values,
        };

    }

    bla = () => {
        // const atrib = store.tables.find(item => item.fk_fld === fk_fld);
        // console.log(toJS(atrib));
        // if (!atrib) return;
    }

    render() {
        return (
            <>{this.bla()}</>
        )
    }
};

export default List;