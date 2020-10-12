// serverless.js
const util = require('util')
const TableStore = require('tablestore')
const getJsonBody = util.promisify(require('body/json'))

let client
exports.initializer = (context, callback) => {
  client = new TableStore.Client({
    accessKeyId: context.credentials.accessKeyId,
    accessKeySecret: context.credentials.accessKeySecret,
    securityToken: context.credentials.securityToken,
    endpoint: 'http://aauth-aauth.ap-southeast-1.vpc.ots.aliyuncs.com',
    instancename: 'aauth'
  })
  callback(null, '')
}

// handlers = { GET: [func1, func2], POST: [func] }
// handler function:
// - @return false - next
// - @return { status, data } - abort
exports.handler = (handlers) => {
  return async (req, resp) => {
    const m = req.method
    resp.setHeader('content-type', 'text/plain;charset=utf-8')
    if (!handlers[m]) {
      resp.setStatusCode(404)
      resp.send('Method not allowed')
      return
    }
    try {
      if (m === 'POST' || m === 'PUT') req.body = await getJsonBody(req)
    } catch {
      resp.setStatusCode(400)
      resp.send('需要JSON格式的请求体')
      return
    }
    try {
      let res = false
      for (const f of handlers[m]) {
        res = await f(req)
        if (res) break
      }
      if (res.status) resp.setStatusCode(res.status)
      if (typeof res.data === 'object') {
        resp.setHeader('content-type', 'application/json;charset=utf-8')
        resp.send(JSON.stringify(res.data))
      } else resp.send(String(res.data))
    } catch (err) {
      resp.setStatusCode(500)
      resp.send('系统错误：' + err.toString())
    }
  }
}

// all pk is id
exports.store = {
  client: () => client,
  get: async (table, id, columns = []) => {
    try {
      const { row } = await client.getRow({
        tableName: table,
        columnsToGet: columns,
        primaryKey: [{ 'id': id }]
      })
      let res = {}
      for (const a of row.attributes) res[a.columnName] = {
        value: a.columnValue,
        timestamp: a.timestamp
      }
      return res
    } catch { return false }
  },
  getRange: async (table, start, end, columns = []) => {
    try {
      let next = start, res = {}
      while (next) {
        const data = await client.getRange({
          tableName: table,
          direction: TableStore.Direction.FORWARD,
          columnsToGet: columns,
          inclusiveStartPrimaryKey: [{ "id": next }],
          exclusiveEndPrimaryKey: [{ "id": end }]
        })
        for (const r of data.rows) {
          res[r.primaryKey[0].value] = {};
          for (const a of r.attributes) res[r.primaryKey[0].value][a.columnName] = {
            value: a.columnValue,
            timestamp: a.timestamp
          }
        }
        next = data.nextStartPrimaryKey ? data.nextStartPrimaryKey[0].value : false
      }
      return res
    } catch { return false }
  },
  put: async (table, id, attributes, atomic = {}, condition = 'IGNORE') => {
    try {
      let columns = [];
      for (const a in attributes) columns.push({ [a]: String(attributes[a]) })
      for (const a in atomic) columns.push({ [a]: TableStore.Long.fromNumber(atomic[a]) })
      await client.putRow({
        tableName: table,
        condition: condition,
        primaryKey: [{ 'id': id }],
        attributeColumns: columns,
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation[condition], null)
      })
      return true
    } catch { return false }
  },
  update: async (table, id, puts, deletes = {}, condition = 'IGNORE') => {
    try {
      let putsArray = [], deletesArray = []
      for (const p in puts) putsArray.push({ [p]: puts[p] })
      for (const d in deletes) deletesArray.push({ [d]: deletes[d] })
      await client.updateRow({
        tableName: table,
        primaryKey: [{ 'id': id }],
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation[condition], null),
        updateOfAttributeColumns: [{ 'PUT': putsArray }, {'DELETE_ALL': deletesArray }]
      })
      return true
    } catch { return false }
  },
  delete: async (table, id, condition = 'IGNORE') => {
    try {
      await client.deleteRow({
        tableName: table,
        primaryKey: [{ 'id': id }],
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation[condition], null)
      })
      return true
    } catch { return false }
  }
}