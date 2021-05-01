const { A, C, E, S } = require('/opt')
const m = S('app')

module.exports = E(async () => {
  const a = await m.get('aauth')
  C.RSA.setKey({ pk: a.pk, sk: a.sk })
})

async function auth(req) {
  const v = C.verify(req.headers.token)
  if (!v) return ['认证失败', 400]
  const u = await S('user').get(v[1], ['apps'])
  if (!u) return ['拒绝访问', 403]
  u.apps = u.apps.split(',')
  req.user = u
}

A.get('/app/', auth, async (req) => {
  const nA = [], res = {}
  for (const a of req.user.apps) {
    const app = await m.get(a)
    if (!app) continue
    nA.push(a)
    delete app.secret
    delete app.sk
    res[a] = app
  }
  if (nA != req.user.apps) await S('user').update(req.user.id, { apps: String(nA) })
  return [res]
})

// public access
A.get('/app/:id', async (req) => {
  const app = await m.get(req.params.id)
  if (!app) return ['应用不存在', 404]
  if (app.secret != req.queries.secret) delete app.sk
  delete app.secret
  return [app]
})

A.post('/app/:id', auth, async (req) => {
  const id = req.params.id
  const old = await m.get(id)
  if (old && !req.user.apps.includes(id)) return ['权限不足', 403]
  const b = req.body
  if (!b || !b.name) return ['参数错误', 400]
  const key = C.RSA.generate()
  const app = {
    name: b.name,
    secret: old ? old.secret : C.random(64),
    pk: old ? old.pk : key.pk,
    sk: old ? old.sk : key.sk
  }
  if (b.icon) app.icon = b.icon
  if (b.token) app.token = b.token
  if (b.platforms) app.platforms = b.platforms
  if (b.redirect) app.redirect = b.redirect
  if (b.secret) app.secret = C.random(64)
  if (b.key) {
    app.pk = key.pk
    app.sk = key.sk
  }
  if (!old) {
    req.user.apps.push(id)
    await S('user').update(req.user.id, { apps: String(req.user.apps) })
  }
  if (!await S('app').put(id, app)) return ['系统核心错误', 500]
  if (!b.secret) delete app.secret
  if (!b.key) delete app.sk
  app.id = id
  return [app]
})

A.delete('/app/:id', auth, async (req) => {
  const id = req.params.id
  if (!req.user.apps.includes(id)) return ['拒绝访问', 403]
  if (!await S('app').delete(id)) return ['系统核心错误', 500]
  // delete on user will take place in GET
  return ['成功']
})
