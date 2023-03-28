const config = require("./config/default.json");
const express = require('express');
var bodyParser = require('body-parser');
const path = require('path');
var beautify = require("json-beautify");
const Readable = require('stream').Readable;
const sql = require("mssql");
const { query } = require("express");
const { Store } = require('./serverStore');

const pool = new sql.ConnectionPool(config.mssql);
const store = new Store(pool);

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({
    limit: '5mb',
    extended: true,
    parameterLimit: 50000
}));
app.use(express.static(path.join(__dirname, './build')));


//connect the pool and start the web server when done
pool.connect().then(async (p) => {
    app.locals.db = p;

    await store.getSpr();
    //store.sprs.forEach(spr => console.log({tab_name: spr.tab_name, fk_fld: spr.fk_fld, fk_display_fld: spr.fk_display_fld}))

    const server = app.listen(config.port, () => {
        const port = server.address().port;
        console.log('App is listening at port %s', port);
    });

}).catch(function (err) {
    console.error('Error creating connection pool', err)
});

//const server = app.listen(config.port, () => { console.log(`App is listening on port ${server.address().port}`) });

app.get('/api/query', async (req, res) => {
    const request = pool.request();
    const arr = await request.query(req.query.sql);

    res.json(arr.recordset);
});

app.get('/api/getSpr', (req, res) => {
    res.json(store.sprs);
});

app.get('/api/getGridStruct', async (req, res) => {
    const data = await store.getGridStruct();
    res.json(data);
});

let groupCount = 0;

const TAB = 'RZD.RZD_Data#02';
const DefaultOrder = 'DATE_IN';

const filterToSQL = (item, res) => {
    const isExpr = expr => Array.isArray(expr) && typeof expr[0] === 'string' && typeof expr[1] === 'string' && expr.length === 3;

    if (!res)
        res = '(';

    //console.log(item)

    if (Array.isArray(item)) {
        if (isExpr(item)) {
            // let spr = store.sprs.find(spr => spr.fk_display_fld === item[0]);
            // if (spr)
            //     item[0] = spr.fk_fld;

            let op = '';
            let val = '';
            if (item[1] === 'contains') {
                op = 'like';
                val = typeof item[2] === 'number' ? item[2] : `'%${item[2]}%'`;
            }
            else if (item[1] === 'startswith') {
                op = 'like';
                val = typeof item[2] === 'number' ? item[2] : `'${item[2]}%'`;
            }
            else if (item[1] === 'endswith') {
                op = 'like';
                val = typeof item[2] === 'number' ? item[2] : `'%${item[2]}'`;
            }
            else {
                op = item[1];
                if (op === '=' && item[2] === null) {
                    op = 'is NULL';
                    val = '';
                }
                else
                    val = typeof item[2] === 'number' ? item[2] : `'${item[2]}'`;
            }

            //let val = typeof item[2] === 'number' ? item[2] : `'${item[1] === 'like' ? '%' + item[2] + '%' : item[2]}'`;

            res += item[0] + ' ' + op + ' ' + val;
        }
        else
            item.map(it => {
                res = filterToSQL(it, res + '(');
            });
    }
    else
        res += item;

    res = res.replace('(or)', ' or ').replace('(and)', ' and ');

    return res + ')';
}

const getFilter = (filter) => {
    const flt = JSON.parse(filter);

    let res = filterToSQL(flt);
    return res;
}

const getOrderBy = (sort) => {
    if (!sort)
        sort = [{ selector: DefaultOrder, desc: false }];
    else
        sort = JSON.parse(sort);

    let orderBy = '';

    sort.forEach(item => {
        orderBy += item.selector;
        orderBy += item.desc ? ' desc' : '';
        orderBy += ',';
    });

    orderBy = orderBy.substring(0, orderBy.length - 1);

    return orderBy;
}


let groupCash = []; // {filter, group, groupCount, data}
let totalCash = []; // filter, totalCount

app.get('/api/getData', async (req, res) => {

    res.set('Content-Type', 'application/json');

    const { skip, take, group, groupSummary, totalSummary, requireTotalCount } = req.query;

    console.log(req.query);

    //const request = pool.request();

    let orderBy = getOrderBy(req.query.sort);

    let filter = req.query.filter ? getFilter(req.query.filter) : '(1=1)';

    if (requireTotalCount) {
        let cash = totalCash.find(item => item.filter === filter);
        if (!cash) {
            let arr = await store.query(`select Count(*) as totalCount from ${TAB} where ${filter}`);
            store.totalCount = arr[0].totalCount;
            totalCash.push({filter: filter, totalCount: arr[0].totalCount});
        }
        else
            store.totalCount = cash.totalCount;
    }


    if (group) {
        JSON.parse(group).forEach(async (item) => {
            const groupName = item.selector;

            let cash = groupCash.find((item, idx) => item.filter === filter && item.group === groupName);

            if (cash) {
                groupCount = cash.groupCount;
            }
            else {
                let arr = await store.query(`select Count(distinct ${groupName}) as cnt from ${TAB} where ${filter}`);
                groupCount = arr[0].cnt;
            }

            cash = groupCash.find((item, idx) => item.filter === filter && item.group === groupName);

            let data = [];

            if (cash) {
                //arr = [{ items: null, count: cash.count, summa: cash.summa, data: cash.data }];
                data = [...cash.data];
                console.log('cash', { filter: cash.filter, group: cash.group, groupCount: cash.groupCount });
            }
            else {
                const sql = `
                select ${groupName} as "key", 
                    NULL as items, 
                    Count(*) as "count", 
                    Sum(CARGO_TONNAGE) as "summa"
                from ${TAB}
                where ${filter}
                group by ${groupName}
                order by ${groupName} ${item.desc ? 'desc' : ''}`;

                arr = await store.query(sql);

                data = [...arr];
                groupCash.push({ filter: filter, group: groupName, groupCount: groupCount, data: arr });
            }

            //console.log(arr);
            if (groupSummary) {
                data = data.map(item => {
                    item = { ...item, summary: [item.count, item.summa] }
                    return item;
                });
            }

            let result = { data: data, groupCount: groupCount };

            if (totalSummary)
                result = { ...result, summary: [store.totalCount] };

            if (requireTotalCount)
                result = { ...result, totalCount: store.totalCount };

            res.json(result);
        });
        return;
    }

    const SQL = `
    select * from RZD.RZD_Data#02
    where ${filter}
    order by ${orderBy}
    offset ${skip || 0} rows
    fetch next ${take || 1000} rows only`;

    // const SQL = `
    //     with QRY as 
    //     (
    //         select ROW_NUMBER() over (order by ${DefaultSort}) as RN, a.* 
    //         from ${TAB} a
    //     )
    //     select top ${take || 200} * from QRY
    //     where RN > ${skip || 0} and ${filter}
    //     order by ${orderBy}`;

    const data = await store.query(SQL);

    let result = { data: data };

    if (store.totalCount)
        result = { ...result, totalCount: store.totalCount };

    if (groupCount)
        result = { ...result, groupCount: groupCount };

    res.json(result);

});

