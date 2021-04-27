// XYZSAS Login

const { C } = require('/opt')
const config = require('./config')
const c = config.xyzsas

module.exports = async function (code) {
  try {
    const url = `https://sas.aauth.link/auth?code=${code}&secret=${c.secret}`
    const info = await C.request('DELETE', url)
      .then(data => JSON.parse(data))
    
    if (!info.id) return false
    info.platform = 'XYZSAS'
    return { linkid: info.id + 'XYZSAS', info }
  } catch { return false }
}
