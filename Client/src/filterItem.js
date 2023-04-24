import React, { Component } from 'react';
import SelectBox from 'devextreme-react/select-box';
import CheckBox from 'devextreme-react/check-box';
import { Button } from 'devextreme-react/button';
import DateBox from 'devextreme-react/date-box';
import NumberBox from 'devextreme-react/number-box';
import DropDownBox from 'devextreme-react/drop-down-box';
import List from 'devextreme-react/list';
import store from './store';
import { toJS, values } from 'mobx';
import { observer } from 'mobx-react';
import './filterItem.css';
// import List from './list';

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

class valueComp extends Component {
    render() {
        return (
            <div style={{ color: "navy", fontWeight: "600", fontSize: "13px" }}>{this.props.data.text}</div>
        );
    }
}


class FilterItem extends Component {
    selectionMode = 'single';

    constructor(props) {
        super(props)

        this.arr = [];

        this.state = {
            operSource: operSource,
            disabled: false,
            fk_fld: this.props.fk_fld,
            oper: this.props.oper,
            values: this.props.values,
            isListOpened: false,
        };
        this.now = new Date();
    }

    onDropDownBoxOpened = (e) => {
        if (e.name === 'opened') {
            this.setState({
                isListOpened: e.value,
            });
        }
    }

    onListOptionChanged = (item) => {
        if (item.name === 'selectedItemKeys') {
            const elem = store.getFilterItem(this.props.uid);
            elem.values = item.value;
            this.setState({ values: item.value });
        } else {

        }
    }

    deleteFilterItem = () => {
        this.props.deleteFilterItem(this.props.uid);
    }

    onAtribChanged = (el, isAuto) => {
        const atrib = store.tables.find(item => item.fk_fld === el.value);
        let arr = [...operSource];

        if (!atrib) return;

        let item = store.getFilterItem(this.props.uid);
        // console.log(item);
        item.dataType = atrib.dataType;
        item.fk_fld = el.value;


        switch (atrib.dataType) {
            case 'fk':
                arr = arr.filter(item => item.code !== 'BETWEEN' && item.code !== 'NOT BETWEEN' && item.code !== '>' && item.code !== '<' && item.code !== '>=' && item.code !== '<=');
                break;
            case 'date':
                arr = arr.filter(item => item.code !== 'IN' && item.code !== 'NOT IN');
                break;
            case 'number':
                arr = arr.filter(item => item.code !== 'IN' && item.code !== 'NOT IN');
                break;
        }

        if (isAuto) {
            this.setState({ operSource: arr, fk_fld: el.value });
        } else {
            let oper = this.state.oper;
            if (['BETWEEN', 'NOT BETWEEN'].includes(oper)) {
                oper = '=';
            }
            this.setState({ operSource: arr, fk_fld: el.value, values: [], oper: oper });
            item.values = [];
        }


    }

    onOperChanged = (el) => {
        const item = store.getFilterItem(this.props.uid);
        item.oper = el.value;
        switch (el.value) {
            case 'IN':
            case 'NOT IN':
                this.selectionMode = 'multiple';
                break;
            default:
                this.selectionMode = 'single';
        };
        console.log(store.filterItems);
        this.setState({ oper: el.value }, () => { this.makeValues(); });
    }

    componentDidMount = () => {
        if (store.tables.length === 0) return;


        if (this.props.fk_fld) {
            const atrib = store.tables.find(item => item.fk_fld === this.props.fk_fld);

            if (atrib) {
                this.onAtribChanged({ value: atrib.fk_fld }, true);
                this.onOperChanged({ value: this.state.oper });
            }
            this.props.updateFilterHeight();
        }
    }

    onItemClick = (e) => {
        this.setState({ isListOpened: false, values: [e.itemData.value] });
    }

    listRender = () => {
        const { fk_fld, oper, values } = this.state;

        const atrib = store.tables.find(item => item.fk_fld === fk_fld);

        return (
            <List
                dataSource={atrib.data}
                searchEnabled={true}
                deferRendering={false}
                showSelectionControls={this.selectionMode === 'multiple'}
                onItemClick={this.selectionMode === 'multiple' ? undefined : this.onItemClick}
                selectionMode={this.selectionMode}
                selectedItemKeys={this.state.values}
                onOptionChanged={this.onListOptionChanged}
                itemRender={this.listItemRender}
                searchExpr='text'
                keyExpr="value"
                displayExpr="text">
            </List>
        );
    }

    onDateChanged = (el) => {
        let item = store.getFilterItem(this.props.uid);
        item.values = [el.value];
    }

    onDate1Changed = (el) => {
        let item = store.getFilterItem(this.props.uid);
        item.values[0] = el.value;
    }
    onDate2Changed = (el) => {
        let item = store.getFilterItem(this.props.uid);
        item.values[1] = el.value;
    }

    onNumber1Changed = (el) => {
        let item = store.getFilterItem(this.props.uid);
        item.values[0] = el.value;
    }
    onNumber2Changed = (el) => {
        let item = store.getFilterItem(this.props.uid);
        item.values[1] = el.value;
    }

    makeValues = () => {
        const { fk_fld, oper, values } = this.state;
        const atrib = store.tables.find(item => item.fk_fld === fk_fld);

        if (!atrib) return;

        switch (atrib.dataType) {
            case 'date':
            case 'number':
                if (['BETWEEN', 'NOT BETWEEN'].includes(oper)) {
                    return (
                        <div>
                            {
                                atrib.dataType === 'date'
                                    ?
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', width: '26px', height: '27px', border: '1px solid #dee1e3', backgroundColor: '#dee1e3', justifyContent: 'center', alignItems: 'center', color: 'brown', fontWeight: '600' }}>C</div>
                                        <div style={{ color: '#000080', flexGrow: 1 }}>
                                            <DateBox onValueChanged={this.onDate1Changed} className='date_box' value={this.state.values[0]} />
                                        </div>
                                        <div style={{ display: 'flex', width: '26px', height: '27px', border: '1px solid #dee1e3', backgroundColor: '#dee1e3', justifyContent: 'center', alignItems: 'center', color: 'brown', fontWeight: '600' }}>ПO</div>
                                        <div style={{ color: '#000080', flexGrow: 1 }}>
                                            <DateBox onValueChanged={this.onDate2Changed} className='date_box' value={this.state.values[1]} />
                                        </div>
                                    </div>
                                    :
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', width: '26px', height: '27px', border: '1px solid #dee1e3', backgroundColor: '#dee1e3', justifyContent: 'center', alignItems: 'center', color: 'brown', fontWeight: '600' }}>C</div>
                                        <div style={{ color: '#000080', flexGrow: 1 }}><NumberBox value={this.state.values[0]} defaultValue={0} min={0} onValueChanged={this.onNumber1Changed} showSpinButtons={true} />
                                        </div>
                                        <div style={{ display: 'flex', width: '26px', height: '27px', border: '1px solid #dee1e3', backgroundColor: '#dee1e3', justifyContent: 'center', alignItems: 'center', color: 'brown', fontWeight: '600' }}>ПO</div>
                                        <div style={{ color: '#000080', flexGrow: 1 }}><NumberBox value={this.state.values[1]} defaultValue={1} min={0} onValueChanged={this.onNumber2Changed} showSpinButtons={true} />
                                        </div>
                                    </div>
                            }
                        </div>
                    )
                } else {
                    return (
                        <div>
                            {
                                atrib.dataType === 'number'
                                    ?
                                    <NumberBox defaultValue={0} min={0} showSpinButtons={true} showClearButton={true} />
                                    :
                                    <DateBox onValueChanged={this.onDateChanged} type="date" />
                            }
                        </div>
                    )
                }

            case 'fk':
                const listData = atrib.data;

                // this.selectionMode = ['IN', 'NOT IN'].includes(oper) ? 'multiple' : 'single';


                return (
                    <DropDownBox
                        dataSource={listData}
                        contentRender={this.listRender}
                        deferRendering={false}
                        opened={this.state.isListOpened}
                        onOptionChanged={this.onDropDownBoxOpened}
                        itemComponent={valueComp}
                        showClearButton={true}
                        inputAttr={{ class: "valueComp" }}
                        value={this.state.values}
                        valueExpr='value'
                        displayExpr='text'>
                    </DropDownBox>
                );

                break;
        };
    }

    listItemRender = (item) => {
        return (
            <div style={{ fontSize: "13px", fontWeight: "600", color: "navy", fontFamily: "helvetica" }}> {item.text} </div>
        );
    }

    onCheckChanged = (el) => {
        this.setState({ disabled: !el.value })
        let item = store.getFilterItem(this.props.uid);
        item.disabled = !el.value;
    }
    // цвет синий темно 3ий  столбец, заменить Селект - на дропдаунбокс, вываливаться будет лист с возможностью поиска 

    render() {


        return (
            // <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', flexDirection: 'row-reverse' }}>
            <div style={{ display: 'flex', flexDirection: 'row', width: "100%", marginTop: "5px" }}>
                <div>
                    <CheckBox iconSize={26} defaultValue={true} disabled={this.props.required} onValueChanged={this.onCheckChanged}></CheckBox>
                </div>
                <div style={{ marginLeft: "2px" }}>
                    <SelectBox
                        valueExpr="fk_fld"
                        displayExpr="fld_caption"
                        width={250}
                        deferRendering={false}
                        disabled={this.state.disabled || this.props.disabled || this.props.required}
                        value={this.state.fk_fld}
                        placeholder="Атрибут"
                        showClearButton={false}
                        itemComponent={atribComp}
                        dataSource={store.tables}
                        onValueChanged={this.onAtribChanged}
                    />
                </div>

                <div style={{ marginLeft: "2px", marginRight: "2px" }}>

                    <SelectBox
                        dataSource={this.state.operSource}
                        onValueChanged={this.onOperChanged}
                        value={this.state.oper}
                        width={140}
                        valueExpr='code'
                        displayExpr='text'
                        itemComponent={operComp}
                        disabled={this.state.disabled || this.props.disabled || this.props.required}
                        inputAttr={{ id: 'operComp' }}
                        defaultValue={this.props.oper || '='}
                    />

                </div>
                <div style={{ flexGrow: '1' }}>
                    {this.makeValues()}

                </div>


                {/* <DropDownBox
                    valueExpr="data"
                    width={200}
                    deferRendering={true}
                    disabled={this.props.disabled}
                    displayExpr="text"
                    placeholder="Значение"
                    showClearButton={false}
                    itemComponent={valueComp}
                    dataSource={store.tables}
                    onValueChanged={this.makeValues}
                /> */}

                <div>
                    <Button icon="minus" type="danger" stylingMode="outlined" disabled={this.props.required} onClick={this.deleteFilterItem} />
                    <Button icon="plus" type="normal" stylingMode="outlined" onClick={this.props.addFilterItem} />
                </div>
            </div>

            // </div>
        )
    }
}

export default observer(FilterItem);