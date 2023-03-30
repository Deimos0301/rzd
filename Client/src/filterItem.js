import React, { Component } from "react";
import { observer } from "mobx-react";
import store from "./store";
import SelectBox from 'devextreme-react/select-box';
import { CheckBox } from 'devextreme-react/check-box';
import { Button } from 'devextreme-react/button';
import './filterItem.css'

const operSource = [
    { oper_name: 'Равно', oper_code: '=' },
    { oper_name: 'Не равно', oper_code: '<>' },
    { oper_name: 'В списке', oper_code: 'IN' },
    { oper_name: 'Не в списке', oper_code: 'NOT IN' },
    { oper_name: 'В диапазоне', oper_code: 'BETWEEN' },
    { oper_name: 'Не в диапазоне', oper_code: 'NOT BETWEEN' },
    { oper_name: 'Больше чем', oper_code: '>' },
    { oper_name: 'Меньше чем', oper_code: '<' },
    { oper_name: 'Больше или равно', oper_code: '>=' },
    { oper_name: 'Меньше или равно', oper_code: '<=' },
];

class sprComp extends Component {
    render() {
        return (
            <div style={{ color: "WindowText", fontWeight: "600", fontSize: "13px" }}>{this.props.data.fld_caption}</div>
        );
    }
}

class operComp extends Component {
    render() {
        return (
            <div style={{ color: "maroon", fontWeight: "600", fontSize: "13px" }}>{this.props.data.oper_name}</div>
        );
    }
}

class FilterItem extends Component {
    constructor(props) {
        super(props);

        let atrib = undefined;

        if (this.props.fk_fld) {
            atrib = store.tables.find(item => item.fk_fld === this.props.fk_fld);
            //console.log(atrib)
        }

        this.state = {
            operSource: operSource,
            disabled: this.props.disabled || true,
            atrib: atrib,
            oper: this.props.oper,
            values: {}
        }
        //        console.log(this.state);
    }

    componentDidMount = () => {
        //console.log(store.tables);
    }

    atribChanged = (el) => {
        const atrib = store.tables.find(item => item.fk_fld === el.value);
        let arr = [...operSource];
        if (atrib.dataType === 'fk')
            arr = arr.filter(item => item.oper_code != 'BETWEEN' && item.oper_code != 'NOT BETWEEN' && item.oper_code != '>' && item.oper_code != '<' && item.oper_code != '<=' && item.oper_code != '>=');

        this.setState({ atrib: atrib, operSource: arr });
    }

    operChanged = (el) => {
        this.setState({ oper: el.value });
    }

    onCheckChanged = (el) => {
        this.setState({ disabled: !el.value });
    }

    addClick = (el) => {
        this.props.addFilterItem();
    }
    
    removeClick = (el) => {
        this.props.deleteFilterItem(this.props.id);
    }

    render() {
        return (
            <div style={{ display: "flex", flexDirection: "row", marginTop: "5px" }}>
                <div>
                    <CheckBox value={true} iconSize={27} disabled={this.props.disabled} onValueChanged={this.onCheckChanged} />
                </div>

                <div>
                    <SelectBox
                        dataSource={store.tables}
                        displayExpr="fld_caption"
                        valueExpr="fk_fld"
                        placeholder="Выберите столбец"
                        width={250}
                        value={this.props.fk_fld}
                        itemComponent={sprComp}
                        disabled={this.props.disabled}
                        onValueChanged={this.atribChanged}
                    />
                </div>

                {/* <div style={{ marginRight: "2px" }}></div> */}

                <div style={{ marginLeft: "2px" }}>
                    <SelectBox
                        dataSource={this.state.operSource}
                        displayExpr="oper_name"
                        valueExpr="oper_code"
                        defaultValue="IN"
                        value={this.props.oper || '='}
                        placeholder="Выберите условие"
                        inputAttr={{ id: 'operComp' }}
                        itemComponent={operComp}
                        disabled={this.props.disabled}
                        onValueChanged={this.operChanged}
                    />
                </div>

                <div style={{ flexGrow: "1", backgroundColor: "white" }}></div>

                <div>
                    <Button icon="minus" type="danger" stylingMode="outlined" disabled={this.props.disabled} onClick={this.removeClick} />
                    <Button icon="plus" type="normal" stylingMode="outlined" onClick={this.addClick} />
                </div>
            </div>
        );
    }
}

export default observer(FilterItem);