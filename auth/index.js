const { A, C, E, S } = require('/opt')
const oauth = require('./oauth')

module.exports = E(async () => {
  const a = await S('app').get('aauth')
  C.RSA.setKey({ pk: a.pk, sk: a.sk })
})

A.get('/auth/:app', async (req) => {
  const v = C.verify(req.headers.token)
  if (!v) return ['身份验证失败', 403]
  const uid = v[1]
  const user = await S('user').get(uid)
  if (!user) return['身份验证失败', 403]
  const app = await S('app').get(req.params.app)
  if (!app || !app.redirect) return ['应用不存在或不支持登录', 404]
  delete user.apps
  if (app.token) {
    app.token = app.token.replace('[timestamp]', Date.now())
    for (const k in user) app.token = app.token.replace(`[${k}]`, user[k])
    return [{ redirect: app.redirect, token: C.RSA.encrypt(app.sk, app.token) }]
  } else {
    const code = C.random()
    if (await S('code').put(code, { user: JSON.stringify(user), app: app.id })) return [ { redirect: app.redirect, code } ]
    else return ['系统核心错误', 500]
  }
})

A.post('/auth/', async (req) => {
  const b = req.body
  if (!b.app || !b.secret || !b.code) return ['参数错误', 400]
  const app = await S('app').get(b.app)
  if (!app || app.secret !== b.secret) return ['应用不存在或secret不正确', 404]
  const code = await S('code').get(b.code)
  if (!code || code.app !== b.app) return ['code不存在', 404]
  if (!await S('code').delete(b.code)) return ['系统核心错误', 500]
  return [JSON.parse(code.user), 200]
})

A.put('/auth/', async (req) => {
  const b = req.body
  if (!b || !b.code || !b.platform || !b.app) return ['参数错误', 400]
  const app = await S('app').get(b.app)
  if (!app) return ['应用不存在', 404]
  if (!oauth[b.platform] || (app.platforms && app.platforms.indexOf(b.platform) === -1)) return ['平台不支持', 403]
  const res = await oauth[b.platform](req.body.code)
  if (!res) return ['登录失败', 403]
  const uid = C.md5(res.linkid)
  for (const k in res.info) {
    if (!res.info[k]) delete res.info[k]
  }
  if (!await S('user').update(uid, res.info)) return ['系统核心错误', 500]
  return [{
    info: res.info,
    app: app.name,
    token: C.sign([Date.now() + 30*86400e3, uid])
  }, 200]
})
