const serverless = require('./serverless')
const crypto = require('crypto')
const store = serverless.store

exports.initializer = serverless.initializer

const random = () => Math.random().toString(36).substr(2)
const cryptoRandom = (len) => crypto.randomBytes(len).toString('base64').replace(/\//g, '_').replace(/\+/g, '-')

async function auth (req) {
  if (!req.headers.user || !req.headers.token) return { status: 403, data: 'Auth failed' }
  const id = req.headers.user
  const res = await store.get('tmp', id)
  // verify token
  if (!res || res.token.value !== req.headers.token) return { status: 403, data: 'Auth failed' }
  // next
  req.user = id
  return false
}

async function getApp (req) {
  const res = await store.getRange('app', req.user, req.user + '~')
  for (const id in res) {
    let data = {}
    for (const k in res[id]) data[k] = res[id][k].value
    data.secret = '******'
    res[id] = data
  }
  return { data: res }
}

async function editApp (req) {
  if (!req.body.name || !req.body.redirect) return { status: 400, data: 'Params Error, require name, redirect' }
  let id = req.body.id
  if (!id) id = req.user + random()
  if (id.indexOf(req.user) !== 0) return { status: 403, data: 'Forbidden' }
  req.body.secret = cryptoRandom(40)
  delete req.body.id
  if (await store.put('app', id, req.body)) return { data: 'Success' }
  else return { status: 500, data: 'System Critical Error' }
}

async function freshApp (req) {
  const id = req.body.id
  if (!id) return { status: 400, data: 'Params Error, id is required.' }
  if (id.indexOf(req.user) !== 0) return { status: 403, data: 'Forbidden' }
  const secret = cryptoRandom(40)
  if (await store.update('app', id, { secret })) return { data: secret }
  else return { status: 500, data: 'System Critical Error' }
}

async function deleteApp (req) {
  const id = req.queries.id
  if (!id) return { status: 400, data: 'Params Error, id is required.' }
  if (id.indexOf(req.user) !== 0) return { status: 403, data: 'Forbidden' }
  if (await store.delete('app', id)) return { data: 'Success' }
  else return { status: 500, data: 'System Critical Error' }
}

exports.handler = serverless.handler({
  GET: [auth, getApp],
  POST: [auth, editApp],
  PUT: [auth, freshApp],
  DELETE: [auth, deleteApp]
})