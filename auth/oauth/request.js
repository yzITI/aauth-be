/* https request */

const https = require('https')

module.exports = (method, url, headers = {}, body = {}) => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: method,
      headers: { ...headers, 'Content-Type': 'application/json' }
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => { resolve(data) })
    })
    if (method === 'POST' || method === 'PUT') req.write(JSON.stringify(body))
    req.on('error', reject)
    req.end()
  })
  .then(res => res.toString())
}
