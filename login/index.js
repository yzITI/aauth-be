const serverless = require('./serverless')
const oauth = require('./oauth')
const store = serverless.store

exports.initializer = serverless.initializer

const random = () => Math.random().toString(36).substr(2)

async function getApp (req) {
  if (!req.queries.app) return { status: 400, data: 'Params error, require app' }
  const res = await store.get('app', req.queries.app)
  if (!res) return { status: 404, data: 'App does not exist.' }
  let data = {}
  for (const k in res) {
    if (k === 'secret') continue
    data[k] = res[k].value
  }
  return { data }
}

async function login (req) {
  if (!req.body.code || !req.body.platform || !req.body.app) {
    return { status: 400, data: 'Params error, require code, platform, app' }
  }
  const pf = req.body.platform
  const app = await store.get('app', req.body.app)
  if (!app) return { status: 404, data: 'App does not exist' }
  if (!oauth[pf] || (app.platform && app.platform.value.indexOf(pf) === -1)) return { status: 403, data: 'Platform unavailable' }
  // 3rd party login
  const res = await oauth[pf](req.body.code)
  if (!res) return { status: 403, data: 'Login Fails' }
  // user link
  let id = random()
  let newUser = true
  let info = res.info
  try {
    const link = await store.get('link', res.linkid)
    if (!link) throw {}
    id = link.user.value
    const u = await store.get('user', id)
    if (!u) throw {}
    info = JSON.parse(u.info.value)
    newUser = false
  } catch { // create user
    if (!await store.put('user', id, { info: JSON.stringify(res.info) }) || !await store.put('link', res.linkid, { user: id })) return { status: 500, data: 'System Critical Error' }
  }
  // create token
  const token = random() + random() + random()
  if (await store.put('tmp', id, { token })) return { data: { id, info, token, newUser } }
  else return { status: 500, data: 'System Critical Error' }
}

async function getCode (req) {
  if (!req.body.user || !req.body.token || !req.body.app) return { status: 400, data: 'Params error, require user, token, app' }
  const id = req.body.user
  const res = await store.get('tmp', id)
  // verify token
  if (!res || res.token.value !== req.body.token) return { status: 403, data: 'Auth failed' }
  // invalidate token 
  const code = random() + random() + random()
  if (!await store.delete('tmp', id) || !await store.put('tmp', code + 'CODE', { user: id, app: req.body.app })) return { status: 500, data: 'System Critical Error' }
  return { data: code }
}

async function verifyCode (req) {
  if (!req.queries.app || !req.queries.secret || !req.queries.code) return { status: 400, data: 'Params error, require app, secret, code' }
  const app = await store.get('app', req.queries.app)
  if (!app || app.secret.value !== req.queries.secret) return { status: 403, data: 'Invalid app' }
  const code = await store.get('tmp', req.queries.code + 'CODE')
  if (!code || code.app.value !== req.queries.app) return { status: 403, data: 'Invalid code' }
  if (!await store.delete('tmp', req.queries.code + 'CODE')) return { status: 500, data: 'System Critical Error' }
  const user = await store.get('user', code.user.value)
  if (!user) return { status: 404, data: 'Invalid code' }
  return {
    data: {
      id: code.user.value,
      ...JSON.parse(user.info.value)
    }
  }
}

exports.handler = serverless.handler({
  GET: [getApp],
  POST: [login],
  PUT: [getCode],
  DELETE: [verifyCode]
})