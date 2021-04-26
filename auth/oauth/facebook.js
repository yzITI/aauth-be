// Facebook Login

const request = require('./request')
const config = require('./config')
const c = config.facebook

module.exports = async function (code) {
  try {
    const accessToken = await request('GET', `https://graph.facebook.com/v9.0/oauth/access_token?client_id=${c.id}&redirect_uri=https%3A%2F%2Faauth.link%2Freenter.html&client_secret=${c.secret}&code=${code}`)
      .then(data => JSON.parse(data))
      .then(data => data.access_token)
    if (!accessToken) return false
    // generate authorization header
    const info = await request('GET', 'https://graph.facebook.com/me?fields=gender,name&access_token=' + accessToken)
      .then(data => JSON.parse(data))
    if (!info.id) return false
    return {
      linkid: info.id + 'FACEBOOK',
      info: {
        name: info.name
      }
    }
  } catch { return false }
}
