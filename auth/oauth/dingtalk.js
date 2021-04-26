// Dingtalk Login

const request = require('./request')
const config = require('./config')
const crypto = require('crypto')
const c = config.dingtalk

module.exports = async function (code) {
  try {
    const timestamp = Date.now()
    const hash = crypto.createHmac('sha256', c.secret).update(timestamp.toString()).digest('base64')
    const url = `https://oapi.dingtalk.com/sns/getuserinfo_bycode?accessKey=${c.id}&timestamp=${timestamp}&signature=${encodeURIComponent(hash)}`
    const info = await request('POST', url, { Accept: 'application/json' }, { tmp_auth_code: code })
      .then( data => JSON.parse(data))
      .then( data => data.user_info)
    
    if (!info.openid) return false
    return {
      linkid: info.openid + 'DINGTALK',
      info: { name: info.nick }
    }
  } catch { return false }
}
