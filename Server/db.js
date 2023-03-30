const sql = require("mssql");
var Readable = require('stream').Readable;
const config = require("./config/default.json");

const tabs = [
    'SPR_CarryDirect',
    'SPR_Company',
    'SPR_Country',
    'SPR_FederalArea'
];

class SqlDB {
    constructor() {
        this.pool = null;
    }

    connect = async () => {
        this.pool = await sql.connect(config.mssql);
    }

    loadTables = async () => {
        let promises = [];

        tabs.map( (tab) => {
            promises.push( this.pool.query(`select * from RZD.${tab}`) );
        })
        
        let results = [];

        await Promise.all(promises).then((values) => {
            values.map( (res, idx) => {
                results.push( {Table: tabs[idx], Data: res.recordset} );
            });
        });

        return results;
    }

    loadData = () => {
        var rs = Readable();
        var c = 97 - 1;

        rs._read = () => {
            if (c >= 'z'.charCodeAt(0)) return rs.push(null);
            setTimeout( () => {
                rs.push(String.fromCharCode(++c));
            }, 100);
        };
        rs.pipe(process.stdout);        
    }
}


module.exports = {
    SqlDB
}