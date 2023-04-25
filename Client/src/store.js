//import React, {Component} from "react";
import { action, observable, makeObservable, toJS } from 'mobx';

export const formatDate = (date, isRussian) => {
    if (!date) return null;
    
    if (typeof date === 'string' && date.length === 8 && date.startsWith('2')) {
        const yy = date.slice(0, 4);
        const mm = date.slice(4, 6);
        const dd = date.slice(6, 8);
        date = new Date(`${yy}-${mm}-${dd}`);
    }
    else
        date = new Date(date);

    try {
        var dd = date.getDate();
        if (dd < 10) dd = '0' + dd;

        var mm = date.getMonth() + 1;
        if (mm < 10) mm = '0' + mm;

        var yy = date.getFullYear();

        if (isRussian)
            return `${dd}.${mm}.${yy}`;
        else
            return `${yy}${mm}${dd}`;
    }
    catch (e) {
        return null;
    }
}

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
            // tables: observable,
            filterElements: observable,
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

    getGridStruct = async (Profile_ID) => {
        if (this.tables.length > 0) return;

        const arr = await fetch('/api/getGridStruct', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ Profile_ID: Profile_ID })
        });
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
            store.getGridStruct(1),
            store.getMaxDate()
        ]
        );
    };

    unProxyGridStruct = () => {
        return this.gridStruct.map(el => toJS(el));
    }

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
