const config = require("./config/default.json");
const express = require('express');
var bodyParser = require('body-parser');
const path = require('path');
var beautify = require("json-beautify");
const sql = require("mssql");
var bodyParser = require('body-parser');
const { Store } = require('./serverStore');

const pool = new sql.ConnectionPool(config.mssql);
const store = new Store(pool);

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({
    limit: '10mb',
    extended: true,
    parameterLimit: 50000
}));
app.use(express.static(path.join(__dirname, './build')));


//connect the pool and start the web server when done
pool.connect().then(async (p) => {
    app.locals.db = p;

    await store.getTables();

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
    res.json(store.tables);
});

app.get('/api/getGridStruct', async (req, res) => {
    const data = await store.getGridStruct();
    res.json(data);
});

let groupCount = 0;

const DefaultOrder = 'DATE_IN';

const filterToSQL = (item, res) => {
    const isExpr = expr => Array.isArray(expr) && typeof expr[0] === 'string' && typeof expr[1] === 'string' && expr.length === 3;

    if (!res)
        res = '(';

    //console.log(item)

    if (Array.isArray(item)) {
        if (isExpr(item)) {
            let spr = store.tables.find(spr => spr.fk_display_fld === item[0]);

            if (spr && spr.data) {
                item[0] = '[' + spr.fk_fld + ']';
                const row = spr.data.find(data => data.text === item[2]);
                if (row) 
                    item[2] = row.value;
            }

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

            res += 'a.' + item[0] + ' ' + op + ' ' + val;
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

const whereToSQL = (where) => {
    let res = [];

    const parseVal = (el) => {
        if (['BETWEEN', 'NOT BETWEEN'].includes(el.oper)) {
            return el.dataType === 'number' ? `${el.values[0]} and ${el.values[1]}` : `'${el.values[0]}' and '${el.values[1]}'`;
        }
        else if (['IN', 'NOT IN'].includes(el.oper))
            return '(' + el.values.join(', ') + ')';
        else
            return el.dataType === 'fk' ? el.values[0] : `'${el.values[0]}'`;
    };

    JSON.parse(where).forEach(el => {
        res.push(`a.[${el.fk_fld}] ${el.oper} ${parseVal(el)}`);
    });

    return res.join(' and ');
}

let groupCash = []; // {filter, group, groupCount, data}
let totalCash = []; // filter, totalCount

const urlencodedParser = express.urlencoded({ extended: true });

app.post('/api/getData', urlencodedParser, async (req, res) => {
    console.log(req.body.params);

    res.set('Content-Type', 'application/json');

    const { skip, take, group, groupSummary, totalSummary, requireTotalCount, requireGroupCount } = req.body.params;

    let orderBy = getOrderBy(req.body.params.sort);

    let filter = req.body.params.filter ? getFilter(req.body.params.filter) : '(1=1)';
    let where = req.body.params.where ? whereToSQL(req.body.params.where) : "(2=2)";

    if (requireTotalCount === 'true') {
        let cash = totalCash.find(item => item.filter === filter && item.where === where);
        if (!cash) {
            let arr = await store.query(`select Count(*) as totalCount from RZD.Data_A a where ${filter} and ${where}`);
            store.totalCount = arr[0].totalCount;
            totalCash.push({ filter: filter, totalCount: arr[0].totalCount });
        }
        else
            store.totalCount = cash.totalCount;
    }


    if (group) {
        JSON.parse(group).forEach(async (item) => {
            const spr = store.tables.find(spr => spr.fk_display_fld === item.selector);
            // console.log(item.selector)
            const fk_fld = spr.fk_fld;
            const groupName = item.selector;

            let cash = groupCash.find(el => el.filter === filter && el.group === groupName && el.desc === item.desc && el.where === where);

            if (requireGroupCount === 'true') {
                if (cash) {
                    groupCount = cash.groupCount;
                }
                else {
                    const arr = await store.query(`select Count(distinct a.${fk_fld}) as cnt from RZD.Data_A a where ${filter} and ${where}`);
                    groupCount = arr[0].cnt;
                }
            }

            let data = [];

            if (cash) {
                //arr = [{ items: null, count: cash.count, summa: cash.summa, data: cash.data }];
                data = [...cash.data];
                console.log('cash:', { filter: cash.filter, group: cash.group, groupCount: cash.groupCount, where: cash.where });
            }
            else {
                const sql = `
                select 
                    b.${spr.pk_display_fld} as "key", 
                    NULL as items,
                    Count(*) as "count",
                Sum(a.CARGO_TONNAGE) as "summa"
                from RZD.[Data_A] a
                join ${spr.tab_name} b on b.${spr.pk_fld} = a.${spr.fk_fld}
                where ${filter} and ${where}
                group by b.${spr.pk_display_fld}
                order by b.${spr.pk_display_fld} ${item.desc ? 'desc' : 'asc'}`;

                arr = await store.query(sql);

                data = [...arr];
                groupCash.push({ filter: filter, group: groupName, groupCount: groupCount, desc: item.desc, where: where, data: arr });
            }

            //console.log(arr);
            if (groupSummary) {
                data = data.map(item => {
                    item = { ...item, summary: [item.count, item.summa] }
                    return item;
                });
            }

            let result = { data: data };
            
            if (groupCount)
                result = { ...result, groupCount: groupCount };

            if (totalSummary)
                result = { ...result, summary: [store.totalCount] };

            if (requireTotalCount === 'true')
                result = { ...result, totalCount: store.totalCount };

            res.json(result);
        });
        return;
    }

    const SQL = `
    select * from RZD.RZD_Data#02 a
    where ${filter} and ${where}
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

app.post('/api/setGridStruct', urlencodedParser, async (req, res) => {
    const request = pool.request();
    await request.query(`exec RZD.UpdateGridStruct @Json = '${JSON.stringify(req.body.json)}', @Profile_ID = ${req.body.Profile_ID}`);
    res.end('OK');
});
