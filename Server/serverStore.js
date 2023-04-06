var JSG = require('jsgjs');
const { map } = require('mssql');

class Store {
    pool;
    request;
    totalCount = 0;
    tables = [];
    gridStruct = [];

    constructor(pool) {
        this.pool = pool;
    }

    query = async (sql) => {
        if (!this.request)
            this.request = this.pool.request();

        console.log(sql + '\n');

        const arr = await this.request.query(sql);
        return arr.recordset;
    }

    getGridStruct = async () => {
        const rs = await this.request.query('exec RZD.GetGridStruct');
        return rs.recordset;
    };

    getTables = async () => {
        if (!this.request)
            this.request = this.pool.request();

        const rs = await this.request.query('exec RZD.GetMetaData');
        const arr = rs.recordset;
        //console.log(gridStruct);

        let promises = [];
        let sqls = [];

        arr.forEach(el => {
            //const sql = `select ${el.PK_FLD} as value, ${el.PK_DISPLAY_FLD} as "text" from ${el.TAB_NAME} order by ${el.PK_DISPLAY_FLD}`;
            if (el.PK_FLD && el.TAB_NAME != 'RZD.Data') {
                let where = '(1=1)'
                if (el.FK_FLD === 'PROD_KIND_ID')
                    where = 'PROD_KIND_ID <> 0';
                const sql = `select ${el.PK_FLD} as value, ${el.PK_DISPLAY_FLD} as "text" from ${el.TAB_NAME} where ${where} order by ${el.PK_DISPLAY_FLD}`;
          
                if (!sqls.find(item => item.sql === sql))
                    sqls.push({ SQL: sql, data: [] });
                el.SQL = sql;
                //promises.push(this.request.query(sql));
            }
        });

        sqls.forEach(item => {
            promises.push(this.request.query(item.SQL));
        });

        let values = await Promise.all(promises);

        values.forEach((el, idx) => {
            sqls[idx].data = el.recordset;
        });

        arr.forEach(el => {
            if (el.SQL) {
                const sql = sqls.find(item => item.SQL === el.SQL);
                el.data = sql.data;
            }

            const tab = {
                tab_name: el.TAB_NAME,
                pk_fld: el.PK_FLD,
                fk_fld: el.FK_FLD,
                pk_display_fld: el.PK_DISPLAY_FLD,
                fk_display_fld: el.FK_DISPLAY_FLD,
                fld_caption: el.FLD_CAPTION,
                dataType: el.DataType,
                //sql: el.sql,
                data: el.data
            };

            this.tables.push(tab);
        });
    }

    doJoin = async () => {
        if (!this.request)
            this.request = this.pool.request();

        const sql =
            `with QRY as
        (
            select ROW_NUMBER() over (order by DATE_IN) as RN, a.*
            from RZD.Data a
        )
        select top 200 * from QRY
        where RN > 1000 and ((STATION_ID_IN = 1526) and (REGION_ID_IN = 41))`;

        let data = await this.query(sql);

        this.tables.map(spr => {
            let newSpr = spr.data.map(el => { return { [spr['fk_fld']]: el.value, [spr['fk_display_fld']]: el.text } });
            console.log(spr['fk_fld'])
            data = new JSG(data).innerJoin(newSpr, spr['fk_fld']).result();
        });

        // console.log(data)
    }
}

module.exports = {
    Store
}
