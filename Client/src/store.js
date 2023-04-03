//import React, {Component} from "react";
import { action, observable, makeObservable, computed } from 'mobx';

class Store {
    // constructor() {
    //     makeObservable(this);        
    // }

    tables = observable([]);
    gridStruct = [];

    getTables = async () => {
        if (this.tables.length > 0) return;
        
        const arr = await fetch('/api/getSpr');
        const js = await arr.json();

        this.setTables(js);
    }
    
    getGridStruct = async () => {
        const arr = await fetch('/api/getGridStruct');
        const js = await arr.json();
//console.log(js)
        this.setGridStruct(js);
    }

    setTables = async (data) => {
        this.tables = [...data];
    }

    setGridStruct = async (data) => {
        this.gridStruct = [...data];
    }
}

const store = new Store();
export default store;
