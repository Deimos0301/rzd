var JSG = require('jsgjs');
const { map } = require('mssql');

class Store {
    pool;
    request;
    totalCount = 0;
    sprs = [];
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

    getSpr = async () => {
        if (!this.request)
            this.request = this.pool.request();

        const rs = await this.request.query('exec RZD.GetMetaData');
        const arr = rs.recordset;
        //console.log(gridStruct);

        let promises = [];

        arr.forEach(el => {
            //const sql = `select ${el.PK_FLD} as value, ${el.PK_DISPLAY_FLD} as "text" from ${el.TAB_NAME} order by ${el.PK_DISPLAY_FLD}`;
            const sql = `select ${el.PK_DISPLAY_FLD} as value, ${el.PK_DISPLAY_FLD} as "text" from ${el.TAB_NAME} order by ${el.PK_DISPLAY_FLD}`;
            promises.push(this.request.query(sql));
        });

        let values = await Promise.all(promises);

        values.map((res, idx) => {
            this.sprs.push({
                tab_name: arr[idx].TAB_NAME,
                pk_fld: arr[idx].PK_FLD,
                fk_fld: arr[idx].FK_FLD,
                pk_display_fld: arr[idx].PK_DISPLAY_FLD,
                fk_display_fld: arr[idx].FK_DISPLAY_FLD,
                fld_caption: arr[idx].FLD_CAPTION,
                data: res.recordset
            });
        });

        //console.log(this.sprs)
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

        this.sprs.map(spr => {
            let newSpr = spr.data.map(el => {return {[spr['fk_fld']]: el.value, [spr['fk_display_fld']]: el.text}});
            console.log(spr['fk_fld'])
            data = new JSG(data).innerJoin(newSpr, spr['fk_fld']).result();
        });

        // console.log(data)
    }
}

module.exports = {
    Store
}