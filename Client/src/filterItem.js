import React, { Component } from "react";
import { observer } from "mobx-react";
import store from "./store";
import { toJS, runInAction } from 'mobx';
import SelectBox from 'devextreme-react/select-box';
import DropDownBox from 'devextreme-react/drop-down-box';
import List from 'devextreme-react/list';
import { CheckBox } from 'devextreme-react/check-box';
import DateBox from 'devextreme-react/date-box';
import Box, { Item as BoxItem } from 'devextreme-react/box';
import { Button } from 'devextreme-react/button';
import './filterItem.css'

const operSource = [
    { text: 'Равно', code: '=' },
    { text: 'Не равно', code: '<>' },
    { text: 'В списке', code: 'IN' },
    { text: 'Не в списке', code: 'NOT IN' },
    { text: 'В диапазоне', code: 'BETWEEN' },
    { text: 'Не в диапазоне', code: 'NOT BETWEEN' },
    { text: 'Больше чем', code: '>' },
    { text: 'Меньше чем', code: '<' },
    { text: 'Больше или равно', code: '>=' },
    { text: 'Меньше или равно', code: '<=' },
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
            <div style={{ color: "WindowText", fontWeight: "600", fontSize: "13px" }}>{this.props.data.text}</div>
        );
    }
}

class FilterItem extends Component {
    selectionMode = 'single';
    valueSource = [];

    constructor(props) {
        super(props);

        this.state = {
            operSource: operSource,
            disabled: false,
            //            atrib: atrib,
            oper: this.props.oper,
            values: this.props.values,
            isListOpened: false,
        }
        //        console.log(this.state);
    }

    componentDidMount = () => {
        if (store.tables.length === 0) return;

        if (this.props.fk_fld) {
            const atrib = store.tables.find(item => item.fk_fld === this.props.fk_fld);
            console.log(atrib)
            if (atrib)
                this.onAtribChanged({ value: atrib.fk_fld });
            this.props.updateFilterHeight();
        }
    }

    listRender = () => {
        const keys = Array.isArray(this.state.values) ? this.state.values : [this.state.values];
        return (
            <List
                dataSource={this.valueSource}
                searchEnabled={true}
                keyExpr="value"
                displayExpr="text"
                searchExpr="text"
                pageLoadMode="scrollBottom"
                selectionMode={this.selectionMode}
                showSelectionControls={this.selectionMode === 'multiple'}
                itemRender={this.listItemRender}
                selectedItemKeys={keys}
                onItemClick={this.selectionMode === 'multiple' ? undefined : this.onListItemClick}
                onOptionChanged={this.listOptionChanged}
            >
            </List>
        );
    }

    makeValues = () => {
        let item = store.filterItems.find(el => el.uid === this.props.uid);

        if (!item.fk_fld || !item.oper) return;
        //console.log(toJS(item));

        const tab = store.tables.find(tab => tab.fk_fld === item.fk_fld);

        if (!tab) return;

        switch (tab.dataType) {
            case "number":
                break;
            case 'date':
                if (['BETWEEN', 'NOT BETWEEN'].includes(item.oper)) {
                    return (
                        <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
                            <div style={{ lineHeight: "27px", maxWidth: "27px", minWidth: "27px", textAlign: "center", fontWeight: "bold", color: "navy" }}> С: </div>
                            <div style={{ flexGrow: "1" }}>
                                <DateBox defaultValue={this.now} onValueChanged={this.value1Changed} disabled={this.state.disabled} />
                            </div>
                            <div style={{ lineHeight: "27px", maxWidth: "27px", minWidth: "27px", textAlign: "center", fontWeight: "bold", color: "navy" }}> ПО: </div>
                            <div style={{ flexGrow: "1" }}>
                                <DateBox defaultValue={this.now} onValueChanged={this.value2Changed} disabled={this.state.disabled} />
                            </div>
                        </div>
                    );
                }
                else {
                    return (
                        <DateBox
                            defaultValue={this.now}
                            disabled={this.state.disabled}
                            value={this.state.values}
                            onValueChanged={this.dateChanged}
                        />
                    );
                }
            default:
                if (['=', '<>', 'IN', 'NOT IN'].includes(item.oper)) {
                    this.valueSource = tab.data;
                    this.selectionMode = ['=', '<>'].includes(item.oper) ? 'single' : 'multiple';

                    return (
                        <DropDownBox
                            dataSource={this.valueSource}
                            displayExpr="text"
                            valueExpr="value"
                            value={this.state.values}
                            opened={this.state.isListOpened}
                            deferRendering={false}
                            showClearButton={true}
                            disabled={this.state.disabled}
                            contentRender={this.listRender}
                            onOptionChanged={this.dropDownOptionChanged}
                            onValueChanged={this.dropDownValueChanged}
                        // itemComponent={valueComp}
                        />
                    );
                }
                break;
        }
    }

    dropDownOptionChanged = (el) => {
        if (el.name === 'value' && !el.value) {
            runInAction(() => {
                const item = store.filterItems.find(el => el.uid === this.props.uid);
                item.values = null;
            });
        }

        if (el.name === 'opened') {
            this.setState({ isListOpened: el.value });
        }
    }

    dropDownValueChanged = (e) => {
        //console.log('dropDownValueChanged', e.value)

        this.setState({ values: e.value });
        runInAction(() => {
            const item = store.filterItems.find(el => el.uid === this.props.uid);
            item.values = e.value;
            //console.log(toJS(item))
        });
    }

    onListItemClick = (e) => {
        runInAction(() => {
            let item = store.filterItems.find(el => el.uid === this.props.uid);
            item.values = e.itemData.value;
        });

        //console.log(toJS(store.filterItems));
        console.log('listItemClick', e.value)

        this.setState({
            values: e.itemData.value,
            isListOpened: false,
        });
    }

    listItemRender = (item) => {
        return (
            <div style={{ fontSize: "13px", fontWeight: "600" }}>{item.text}</div>
        );
    }

    dateChanged = (el) => {
        runInAction(() => {
            let item = store.filterItems.find(el => el.uid === this.props.uid);
            item.values = formatDate(el.value);
            console.log('dateChanged:', formatDate(el.value));
        });
    }

    value1Changed = (el) => {
        console.log('value1Changed', el.value)
        runInAction(() => {
            let item = store.filterItems.find(el => el.uid === this.props.uid);
            if (!Array.isArray(item.values)) item.values = [null, null];
            item.values[0] = formatDate(el.value);
            console.log('value1Changed:', formatDate(el.value));
        });
    }

    value2Changed = (el) => {
        runInAction(() => {
            let item = store.filterItems.find(el => el.uid === this.props.uid);
            if (!Array.isArray(item.values)) item.values = [null, null];
            item.values[1] = formatDate(el.value);
            console.log('value2Changed:', formatDate(el.value));
        });
    }

    listOptionChanged = (el) => {
        if (el.name === 'selectedItemKeys') {
            runInAction(() => {
                let item = store.filterItems.find(el => el.uid === this.props.uid);
                item.values = el.value;
            });

            //console.log('listOptionChanged', el.value)
            this.setState({ values: el.value });
        }
    }

    onAtribChanged = (el) => {
        if (!el) return;

        const atrib = store.tables.find(item => item.fk_fld === el.value);

        let arr = [...operSource];

        switch (atrib.dataType) {
            case 'fk':
                arr = arr.filter(item => item.code !== 'BETWEEN' && item.code !== 'NOT BETWEEN' && item.code !== '>' && item.code !== '<' && item.code !== '>=' && item.code !== '<=');
                console.log(arr)
                break;
            case 'date':
                arr = arr.filter(item => item.code !== 'IN' && item.code !== 'NOT IN');
                break;
            case 'number':
                arr = arr.filter(item => item.code !== 'IN' && item.code !== 'NOT IN');
                break;
        }
        this.setState({ operSource: arr });

        runInAction(() => {
            let item = store.filterItems.find(el => el.uid === this.props.uid);
            item.fk_fld = el.value;
        });

    }

    onOperChanged = (el) => {
        this.setState({ oper: el.value });

        runInAction(() => {
            let item = store.filterItems.find(el => el.uid === this.props.uid);
            item.oper = el.value;
        });

        this.makeValues();
    }

    onCheckChanged = (el) => {
        this.setState({ disabled: !el.value });
    }

    addClick = (el) => {
        this.props.addFilterItem(this.uid);
    }

    removeClick = (el) => {
        this.props.deleteFilterItem(this.props.uid);
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
                        itemComponent={atribComp}
                        disabled={this.props.disabled || this.state.disabled}
                        onValueChanged={this.onAtribChanged}
                    />
                </div>

                {/* <div style={{ marginRight: "2px" }}></div> */}

                <div style={{ marginLeft: "2px", marginRight: "2px" }}>
                    <SelectBox
                        dataSource={this.state.operSource}
                        displayExpr="text"
                        valueExpr="code"
                        defaultValue="IN"
                        value={this.props.oper || '='}
                        placeholder="Выберите условие"
                        inputAttr={{ id: 'operComp' }}
                        itemComponent={operComp}
                        disabled={this.props.disabled || this.state.disabled}
                        onValueChanged={this.onOperChanged}
                    />
                </div>

                <div style={{ flexGrow: "1", backgroundColor: "white" }}>{this.makeValues()}</div>

                <div>
                    <Button icon="minus" type="danger" stylingMode="outlined" disabled={this.props.disabled} onClick={this.removeClick} />
                    <Button icon="plus" type="normal" stylingMode="outlined" onClick={this.addClick} />
                </div>
            </div>
        );
    }
}

const formatDate = (date) => {
    var dd = date.getDate();
    if (dd < 10) dd = '0' + dd;

    var mm = date.getMonth() + 1;
    if (mm < 10) mm = '0' + mm;

    var yy = date.getFullYear();

    return `${yy}${mm}${dd}`;
}

export default observer(FilterItem);