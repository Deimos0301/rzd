import React, { Component } from 'react';
import SelectBox from 'devextreme-react/select-box';
import CheckBox from 'devextreme-react/check-box';
import { Button } from 'devextreme-react/button';
import DateBox from 'devextreme-react/date-box';
import store from './store';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import './filterItem.css';

const operSource = [
    {
        text: 'Равно',
        code: '='
    },
    {
        text: 'Не равно',
        code: '<>'
    },
    {
        text: 'В списке',
        code: 'IN'
    },
    {
        text: 'Не в списке',
        code: 'NOT IN'
    },
    {
        text: 'В диапазоне',
        code: 'BETWEEN'
    },
    {
        text: 'Не в диапазоне',
        code: 'NOT BETWEEN'
    },
    {
        text: 'Больше чем',
        code: '>'
    },
    {
        text: 'Меньше чем',
        code: '<'
    },
    {
        text: 'Больше или равно',
        code: '>='
    },
    {
        text: 'Меньше или равно',
        code: '<='
    }
];

class atribComp extends Component {
    render() {
        return (
            <div style={{ color: "WindowText", fontWeight: "600", fontSize: "13px" }}>{this.props.data.fld_caption}</div>
        );
    }
}

class operComp extends Component {
    render() {
        return (
            <div style={{ color: "maroon", fontWeight: "600", fontSize: "13px" }}>{this.props.data.text}</div>
        );
    }
}

class FilterItem extends Component {
    constructor(props) {
        super(props)

        this.arr = [];

        this.state = {
            operSource: operSource
        };
    }



    // addItem = () => {
    //     return <div className="dx-field-value" style={{ display: 'flex', flexDirection: 'row' }}>
    //         <SelectBox
    //             valueExpr="fk_fld"
    //             width={280}
    //             deferRendering={false}
    //             disabled={this.props.disabled}
    //             displayExpr="fld_caption"
    //             placeholder="Атрибут"
    //             showClearButton={true}
    //             dataSource={store.tables}
    //         />
    //         <SelectBox
    //             dataSource={conditions}
    //             width={200}
    //             valueExpr='code'
    //             displayExpr='text'
    //             defaultValue='='
    //         />
    //         <Button icon="minus" type="danger" stylingMode="outlined" />
    //         <Button icon="plus" type="normal" stylingMode="outlined" />
    //     </div>
    // }
    deleteFilterItem = () => {
        this.props.deleteFilterItem(this.props.uid);
    }

    onAtribChanged = (el) => {
        const atrib = store.tables.find(item => item.fk_fld === el.value);
        let arr = [...operSource];
        switch (atrib.dataType) {
            case 'fk':
                arr = arr.filter(item => item.code !== 'BETWEEN' && item.code !== 'NOT BETWEEN' && item.code !== '>' && item.code !== '<' && item.code !== '>=' && item.code !== '<=');
                this.setState({ operSource: arr });
                break;
            case 'date':
                arr = arr.filter(item => item.code !== 'IN' && item.code !== 'NOT IN');
                this.setState({ operSource: arr });
                break;
            case 'number':
                arr = arr.filter(item => item.code !== 'IN' && item.code !== 'NOT IN');
                this.setState({ operSource: arr });
                break;
            default:
        }
        console.log(toJS(atrib));
    }

    makeValues = () => {
        return <div style={{flexGrow: "1"}}>JOPA</div>
    }

    render() {
        return (
            // <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', flexDirection: 'row-reverse' }}>
            <div style={{ display: 'flex', flexDirection: 'row', width: "100%", marginTop: "5px" }}>
                <div>
                    <CheckBox iconSize={26} defaultValue={true} disabled={this.props.disabled}></CheckBox>
                </div>
                <div>
                    <SelectBox
                        valueExpr="fk_fld"
                        width={200}
                        deferRendering={false}
                        disabled={this.props.disabled}
                        displayExpr="fld_caption"
                        placeholder="Атрибут"
                        showClearButton={false}
                        itemComponent={atribComp}
                        dataSource={store.tables}
                        onValueChanged={this.onAtribChanged}
                    />
                </div>

                <div>
                    <SelectBox
                        dataSource={this.state.operSource}
                        width={140}
                        valueExpr='code'
                        displayExpr='text'
                        itemComponent={operComp}
                        disabled={this.props.disabled}
                        inputAttr={{ id: 'operComp' }}
                        defaultValue={this.props.oper || '='}

                    />
                </div>
                {this.makeValues()}
                    {/* <div className='date-param'>
                        c
                    </div>
                    <DateBox
                        id="selected-date"
                        width={100}
                    />
                    <div className='date-param'>
                        по
                    </div>
                    <DateBox
                        id="selected-date"
                        width={100}
                    /> */}
                

                <div>
                    <Button icon="minus" type="danger" stylingMode="outlined" onClick={this.deleteFilterItem} />
                    <Button icon="plus" type="normal" stylingMode="outlined" onClick={this.props.addFilterItem} />
                </div>
            </div>

            // </div>
        )
    }
}

export default observer(FilterItem);