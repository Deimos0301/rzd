//import React, {Component} from "react";
import { action, observable, makeObservable, computed } from 'mobx';

class Store {
    tables = [];
    filterElements = []; // Массив элементов JSX
    filterItems = [];
    gridStruct = [];
    linesCount = 1;
    filterOpened = false;
    fieldsOpened = false;
    maxDate;

    constructor() {
        makeObservable(this, {
            tables: observable,
            filterElements: observable,
            //filterItems: observable,
            gridStruct: observable,
            linesCount: observable,
            filterOpened: observable,
            fieldsOpened: observable,

            setTables: action,
            setFilterElements: action,
            setFilterItems: action,
            setGridStruct: action,
            setLinesCount: action,
            setFilterOpened: action,
            setFieldsOpened: action
        });        
    }

    getTables = async () => {
        if (this.tables.length > 0) return;
        
        const arr = await fetch('/api/getSpr');
        const js = await arr.json();

        this.setTables(js);
    }

    getFilterItem = uid => {
        return this.filterItems.find(el => el.uid === uid);
    }

    getGridStruct = async () => {
        const arr = await fetch('/api/getGridStruct');
        const js = await arr.json();

        this.setGridStruct(js);
    }

    getMaxDate = async () => {
        const arr = await fetch('/api/query?sql=select Max(DATE_IN) as MaxDate from RZD.Data');
        const a = await arr.json();
        this.maxDate = new Date(a[0].MaxDate);
    }

    getMetaData = async () => {
        await Promise.all([
                store.getTables(),
                store.getGridStruct(),
                store.getMaxDate()
           ]
        );
    };

    setTables = (data) => { this.tables = [...data]; }

    setFilterElements = (data) => { this.filterElements = [...data]; }

    setFilterItems = (data) => { this.filterItems = [...data]; }

    setGridStruct = (data) => { this.gridStruct = [...data]; }

    setFilterOpened = (data) => { this.filterOpened = data; }

    setFieldsOpened = (data) => { this.fieldsOpened = data; }

    setLinesCount = (data) => { this.linesCount = data; }
}

const store = new Store();

export default store;
