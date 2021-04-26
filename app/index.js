const { A, C, E, S } = require('/opt')

module.exports = E

async function auth(req) {
  const v = C.verify(req.headers.token)
  if (!v) return ['认证失败', 400]
  const user = await S('user').get(v[1], ['app'])
  if (!user) {
    return ['没有权限', 403]
  }
  user.app = user.app.split(',')
  req.user = user
}

A.get('/app/:id', auth, (req) => {
  let res = []
  for (const i of req.user.app) {
    const app = await S('app').get(i)
    if (!app) return ['系统核心错误', 500]
    delete app.secret
    delete app._timestamp
    res.push(app)
  }
  return [res, 200]
})

A.post('/app/:id', auth, (req) => {
  const b = req.body
  let id = req.params.id
  if (!b || !b.name || !b.redirect) return ['参数错误', 400]
  if (id && req.user.app.indexOf(id) === -1)
    return ['应用不存在', 404]
  if (!id) {
    id = C.random()
    req.user.app.push(id)
    if (!await S('user').update(req.user.id, { app: req.user.app.join(',') }))
      return ['系统核心错误', 500]
  }
  delete b.id
  delete b.secret
  if (await S('app').update(id, b)) return ['成功']
  else return ['系统核心错误', 500]
})

A.put('/app/:id', auth, (req) => {
  let id = req.params.id
  if (id && req.user.app.indexOf(id) === -1)
    return ['应用不存在', 404]
  const secret = C.random()
  if (await S('app').update(id, { secret })) return [secret]
  else return ['系统核心错误', 500]
})

A.delete('/app/:id', auth, (req) => {
  let id = req.params.id
  if (id && req.user.app.indexOf(id) === -1)
    return ['应用不存在', 404]
  if (!await S('app').delete(id)) return ['系统核心错误', 500]
  req.user.app.splice(req.user.app.indexOf(id), 1)
  if (!await S('user').update(req.user.id, { app: req.user.app.join(',') }))
    return ['系统核心错误', 500]
  return ['成功']
})