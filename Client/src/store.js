//import React, {Component} from "react";
import { action, observable, makeObservable } from 'mobx';

class Store {
    filterOpened = false;
    fieldsOpened = false;
    tables = [];
    filterElements = [];
    gridStruct = [];
    linesCount = 1;
    //filterItems = [];

    constructor() {
        makeObservable(this, {
            tables: observable,
            filterElements: observable,
            linesCount: observable,
            gridStruct: observable,
            filterOpened: observable,
            fieldsOpened: observable,

            setTables: action,
            setGridStruct: action,
            setFilterOpened: action,
            setFieldsOpened: action,
            setFilterElements: action,
            setLinesCount: action
        });        
    }

    getTables = async () => {
        if (this.tables.length > 0) return;
        
        const arr = await fetch('/api/getSpr');
        const js = await arr.json();

        this.setTables(js);
    }

    getGridStruct = async () => {
        const arr = await fetch('/api/getGridStruct');
        const js = await arr.json();

        this.setGridStruct(js);
    }

    setTables = (data) => { this.tables = [...data]; }

    setFilterElements = (data) => { this.filterElements = [...data]; }

    setGridStruct = (data) => { this.gridStruct = [...data]; }

    setFilterOpened = (data) => { this.filterOpened = data; }

    setFieldsOpened = (data) => { this.fieldsOpened = data; }

    setLinesCount = (data) => { this.linesCount = data; }
}

const store = new Store();
export default store;
