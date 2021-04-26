const { A, C, E, S } = require('/opt')
const oauth = require('./oauth')

module.exports = E

A.get('/auth/:id', async (req) => {
  const app = await S('app').get(req.params.id)
  if (!app) return ['应用不存在', 404]
  delete app._timestamp
  delete app.secret
  return [app]
})

a.post('/auth/', async (req) => {
  const b = req.body
  if (!b || !b.code || !b.platform || !b.app)
    return ['参数错误', 400]
  const app = await S('app').get(b.app)
  if (!app) return ['应用不存在', 404]
  if (!oauth[b.platform] || (app.platform && app.platform.indexOf(b.platform) === -1)) return ['不支持的平台', 403]
  const res = await oauth[b.platform](req.body.code)
  if (!res) return ['登陆失败', 403]
  const uid = C.md5(res.linkid)
  if (!await S('user').put(uid, res.info))
    return ['系统核心错误', 500]
  return [C.sign([Date.now(), uid]), 200]
})

A.put('/auth/', async (req) => {
  const b = req.body
  if (!b || !b.token || !b.app)
    return ['参数错误', 400]
  const v = C.verify(b.token)
  if (!v) return ['登陆失败', 400]
  const uid = v[1]
  const user = await S('user').get(uid)
  if (!user) return['登陆失败', 400]
  delete user._timestamp
  const code = C.random()
  if (!await S('code').put(code, {
    user: uid,
    app: b.app,
    info: user
  }))
    return ['系统核心错误', 500]
  return [code, 500]
})

A.delete('/auth/', async (req) => {
  const b = req.queries
  if (!b.app || !b.secret || !b.code) return ['参数错误', 400]
  const app = await S('app').get(b.app)
  if (!app || app.secret !== b.secret) return ['app不正确', 403]
  const code = await S('code').get(b.code)
  if (!code || code.app !== b.app) return ['code不正确', 403]
  if (!await S('code').delete(b.code)) return ['系统核心错误', 500]
  return [{
    id: code.user,
    info: code.info
  }, 200]
})