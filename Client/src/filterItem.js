import React, { Component } from "react";
import { observer } from "mobx-react";
import store, { formatDate } from "./store";
import { toJS, runInAction } from 'mobx';
import SelectBox from 'devextreme-react/select-box';
import DropDownBox from 'devextreme-react/drop-down-box';
import List from 'devextreme-react/list';
import { CheckBox } from 'devextreme-react/check-box';
import DateBox from 'devextreme-react/date-box';
import { NumberBox } from 'devextreme-react/number-box';
import TagBox from 'devextreme-react/tag-box';
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
            <div style={{ color: "navy", fontWeight: "bold", fontSize: "13px" }}>{this.props.data.text}</div>
        );
    }
}

class FilterItem extends Component {
    selectionMode = 'single';
    valueSource = [];

    constructor(props) {
        super(props);

        this.cbOper = React.createRef();

        this.state = {
            operSource: operSource,
            checked: this.props.checked,
            fk_fld: this.props.fk_fld,
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
            // console.log(toJS(atrib))
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

        let val1 = null;
        let val2 = null;

        if (Array.isArray(this.state.values)) {
            if (this.state.values.length > 0)
                val1 = this.state.values[0];
            if (this.state.values.length > 1)
                val2 = this.state.values[1];
        }

        switch (tab.dataType) {
            case 'date':
            case "number":
                if (['BETWEEN', 'NOT BETWEEN'].includes(item.oper)) {
                    return (
                        <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
                            <div style={{ lineHeight: "27px", maxWidth: "27px", minWidth: "27px", textAlign: "center", fontWeight: "bold" }}> С: </div>

                            <div style={{ flexGrow: "1" }}>
                                {
                                    tab.dataType === 'number'
                                        ?
                                        <NumberBox value={val1 || 0} showSpinButtons={true} disabled={!this.state.checked} onValueChanged={this.number1Changed} inputAttr={{ class: 'valueComp' }} />
                                        :
                                        <DateBox value={val1} onValueChanged={this.value1Changed} disabled={!this.state.checked} inputAttr={{ class: 'valueComp' }} />
                                }
                            </div>

                            <div style={{ lineHeight: "27px", maxWidth: "27px", minWidth: "27px", textAlign: "center", fontWeight: "bold" }}> ПО: </div>

                            <div style={{ flexGrow: "1" }}>
                                {
                                    tab.dataType === 'number'
                                        ?
                                        <NumberBox value={val2 || 0} showSpinButtons={true} disabled={!this.state.checked} onValueChanged={this.number2Changed} inputAttr={{ class: 'valueComp' }} />
                                        :
                                        <DateBox value={val2} onValueChanged={this.value2Changed} disabled={!this.state.checked} inputAttr={{ class: 'valueComp' }} />
                                }
                            </div>
                        </div>
                    );
                }
                else {
                    return (
                        tab.dataType === 'number'
                            ?
                            <NumberBox value={val1 || 0} showSpinButtons={true} disabled={!this.state.checked} inputAttr={{ class: 'valueComp' }} onValueChanged={this.numberChanged} />
                            :
                            <DateBox
                                disabled={!this.state.checked}
                                value={val1 instanceof Date && !isNaN(date) ? val1 : null}
                                inputAttr={{ class: 'valueComp' }}
                                onValueChanged={this.dateChanged}
                            />
                    );
                }
            default:
                if (['=', '<>', 'IN', 'NOT IN'].includes(item.oper)) {
                    this.valueSource = tab.data;
                    this.selectionMode = ['=', '<>'].includes(item.oper) ? 'single' : 'multiple';

                    // if (this.selectionMode === 'multiple') {
                    //     return (
                    //         <TagBox
                    //             dataSource={this.valueSource}
                    //             displayExpr="text"
                    //             valueExpr="value"
                    //             showSelectionControls={true}
                    //             showClearButton={true}
                    //             showDropDownButton={true}
                    //             searchEnabled={true}
                    //             disabled={this.state.disabled}
                    //             itemComponent={valueComp}
                    //             inputAttr={{ class: 'valueComp' }}
                    //             applyValueMode="useButtons"
                    //             // hideSelectedItems={true}
                    //             // multiline={true}
                    //             maxDisplayedTags={4}
                    //             value={this.state.values}
                    //             onValueChanged={this.tagBoxValueChanged}
                    //         >
                    //         </TagBox>
                    //     );
                    // }
                    // else 
                    return (
                        <DropDownBox
                            dataSource={this.valueSource}
                            displayExpr="text"
                            valueExpr="value"
                            value={this.state.values}
                            opened={this.state.isListOpened}
                            deferRendering={false}
                            showClearButton={true}
                            disabled={!this.state.checked}
                            contentRender={this.listRender}
                            itemComponent={valueComp}
                            inputAttr={{ class: 'valueComp' }}
                            onOptionChanged={this.dropDownOptionChanged}
                            onValueChanged={this.dropDownValueChanged}
                        />
                    );
                }
                break;
        }
    }

    tagBoxValueChanged = (el) => {
        this.setState({ values: el.value });
        const item = store.getFilterItem(this.props.uid);
        item.values = el.value;
    }

    dropDownOptionChanged = (el) => {
        if (el.name === 'value' && !el.value) {
            // console.log('dropDownOptionChanged', el.value)
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

        this.setState({
            values: e.itemData.value,
            isListOpened: false,
        });
    }

    listItemRender = (item) => {
        return (
            <div style={{ fontSize: "13px", fontWeight: "600", color: "navy", fontFamily: "helvetica" }}>{item.text}</div>
        );
    }

    dateChanged = (el) => {
        const item = store.getFilterItem(this.props.uid);
        item.values = [formatDate(el.value)];
        this.setState({ values: item.values });
    }

    numberChanged = (el) => {
        const item = store.getFilterItem(this.props.uid);
        item.values = [el.value];
        this.setState({ values: item.values });
    }

    value1Changed = (el) => {
        const item = store.getFilterItem(this.props.uid);
        if (!Array.isArray(item.values)) item.values = [null, null];
        item.values[0] = formatDate(el.value);
        this.setState({ values: item.values });
    }

    value2Changed = (el) => {
        const item = store.getFilterItem(this.props.uid);
        if (!Array.isArray(item.values)) item.values = [null, null];
        item.values[1] = formatDate(el.value);
        this.setState({ values: item.values });
    }

    number1Changed = (el) => {
        const item = store.getFilterItem(this.props.uid);
        if (!Array.isArray(item.values)) item.values = [null, null];
        item.values[0] = el.value;
        this.setState({ values: item.values });
    }

    number2Changed = (el) => {
        const item = store.getFilterItem(this.props.uid);
        if (!Array.isArray(item.values)) item.values = [null, null];
        item.values[1] = el.value;
        this.setState({ values: item.values });
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

        if (!atrib) return;

        let item = store.getFilterItem(this.props.uid);
        item.dataType = atrib.dataType;
        item.fk_fld = el.value;

        switch (atrib.dataType) {
            case 'fk':
                arr = arr.filter(item => item.code !== 'BETWEEN' && item.code !== 'NOT BETWEEN' && item.code !== '>' && item.code !== '<' && item.code !== '>=' && item.code !== '<=');
                //console.log(arr)
                break;
            case 'date':
                arr = arr.filter(item => item.code !== 'IN' && item.code !== 'NOT IN');
                break;
            case 'number':
                arr = arr.filter(item => item.code !== 'IN' && item.code !== 'NOT IN');
                break;
        }

        this.setState({ operSource: arr, fk_fld: el.value }, () => {
            if (!arr.find(el => el.code === this.state.oper)) {
                this.setState({ oper: '=' });
            }

            if (el.element) {
                this.setState({ values: null });
                item.values = null;
            }
        });
    }

    onOperChanged = (el) => {
        this.setState({ oper: el.value });

        runInAction(() => {
            let item = store.getFilterItem(this.props.uid);
            item.oper = el.value;
        });

        this.makeValues();

        if (el.element) {
            this.setState({ values: null });
            runInAction(() => {
                let item = store.getFilterItem(this.props.uid);
                item.values = null;
            });
        }
    }

    onCheckChanged = (el) => {
        this.setState({ checked: el.value });
        let item = store.getFilterItem(this.props.uid);
        item.checked = el.value;
    }

    addClick = (el) => {
        // console.log(this.state.values)
        this.props.addFilterItem(this.props.uid);
    }

    removeClick = (el) => {
        this.props.deleteFilterItem(this.props.uid);
    }

    render() {
        return (
            <div style={{ display: "flex", flexDirection: "row", marginTop: "5px" }}>
                <div>
                    <CheckBox value={this.state.checked} iconSize={27} disabled={this.props.required} onValueChanged={this.onCheckChanged} />
                </div>

                <div style={{ marginLeft: "2px" }}>
                    <SelectBox
                        dataSource={store.tables}
                        displayExpr="fld_caption"
                        valueExpr="fk_fld"
                        placeholder="Выберите столбец"
                        width={250}
                        value={this.state.fk_fld}
                        itemComponent={atribComp}
                        searchEnabled={true}
                        disabled={this.props.required || !this.state.checked}
                        onValueChanged={this.onAtribChanged}
                    />
                </div>

                {/* <div style={{ marginRight: "2px" }}></div> */}

                <div style={{ marginLeft: "2px", marginRight: "2px", minWidth: "120px" }}>
                    <SelectBox
                        dataSource={this.state.operSource}
                        ref={this.cbOper}
                        displayExpr="text"
                        valueExpr="code"
                        defaultValue="IN"
                        value={this.state.oper || '='}
                        placeholder="Выберите условие"
                        inputAttr={{ id: 'operComp' }}
                        itemComponent={operComp}
                        disabled={this.props.required || !this.state.checked}
                        onValueChanged={this.onOperChanged}
                    />
                </div>

                <div style={{ flexGrow: "1", backgroundColor: "white" }}>{this.makeValues()}</div>

                <div style={{ marginLeft: "1px" }}>
                    <Button icon="minus" type="danger" stylingMode="outlined" disabled={this.props.required} onClick={this.removeClick} />
                </div>

                <div style={{ marginLeft: "1px" }}>
                    <Button icon="plus" type="normal" stylingMode="outlined" onClick={this.addClick} />
                </div>
            </div>
        );
    }
}

export default observer(FilterItem);