// xyzsas Login

const request = require('./request')
const crypto = require('crypto')

module.exports = async function (code) {
  try {
    const url = `https://sa.aauth.link/auth?code=${code}`
    const data = await request('DELETE', url, { Accept: 'application/json' })
      .then( data => JSON.parse(data))
    
    return {
      linkid: data.id + 'XYZSAS',
      info: { data }
    }
  } catch { return false }
}
