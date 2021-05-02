// XYZSAS Login

const { S, C } = require('/opt')

module.exports = async function (code) {
  try {
    const app = await S('app').get('xyzsas')
    if (!app) return false
    const enCode = C.RSA.encrypt(app.sk, (Date.now() + 600e3) + ',' + code)
    const url = `https://sas.aauth.link/auth/?code=${enCode}`
    const info = await C.request('DELETE', url)
      .then(data => JSON.parse(data))
    
    if (!info.id) return false
    info.platform = 'XYZSAS'
    return { linkid: info.id + 'XYZSAS', info }
  } catch { return false }
}
