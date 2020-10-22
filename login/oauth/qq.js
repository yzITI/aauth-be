// QQ Login

const request = require('./request')
const config = require('./config')
const c = config.qq

module.exports = async function (code) {
  try {
    const accessToken = await request('GET', 
      `https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${c.id}&client_secret=${c.secret}&code=${code}&redirect_uri=https%3A%2F%2Faauth.link%2Freenter.html`)
      .then(res => res.split('&')[0])
      .then(res => res.indexOf('access_token') === 0 ? res.substring(13) : false)
    if (!accessToken) return false
    const openid = await request('GET', 'https://graph.qq.com/oauth2.0/me?fmt=json&access_token=' + accessToken)
      .then(data => JSON.parse(data))
      .then(data => data.openid)
    if (!openid) return false
    const info = await request('GET', `https://graph.qq.com/user/get_user_info?access_token=${accessToken}&oauth_consumer_key=${c.id}&openid=${openid}`)
      .then(data => JSON.parse(data))
    return {
      linkid: openid + 'QQ',
      info: {
        name: info.nickname,
        gender: info.gender,
        province: info.province,
        city: info.city,
        avatar: info.figureurl_2,
        constellation: info.constellation
      }
    }
  } catch { return false }
}
