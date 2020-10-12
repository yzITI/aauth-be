// Github Login

const request = require('./request')
const config = require('./config')
const c = config.github

module.exports = async function (code) {
  try {
    const accessToken = await request('POST', 'https://github.com/login/oauth/access_token', { Accept: 'application/json' }, {
      client_id: c.id,
      client_secret: c.secret,
      code: code
    })
      .then(data => JSON.parse(data))
      .then(data => data.access_token)
    if (!accessToken) return false
    // generate authorization header
    const token = Buffer.from('token:' + accessToken, 'utf8').toString('base64')
    const info = await request('GET', 'https://api.github.com/user', { Authorization: 'Basic ' + token, 'User-Agent': 'Aauth' })
      .then(data => JSON.parse(data))
    if (!info.id) return false
    return {
      linkid: info.id + 'GITHUB',
      info: {
        name: info.name,
        username: info.login,
        email: info.email,
        avatar: info.avatar_url,
        company: info.company,
        location: info.location
      }
    }
  } catch { return false }
}
