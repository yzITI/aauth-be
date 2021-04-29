# Aauth Backend

## Model

```js
App {
  id: String, // app id
  name: String, // app name
  icon: String, // icon url
  secret: String, // CREDENTIAL app secret
  redirect: String, // redirect url
  platforms: String, // OPTIONAL platforms
  sk: String, // OPTIONAL CREDENTIAL private key
  pk: String, // OPTIONAL public key
  token: String, // OPTIONAL token template
}
```

## API

```
GET /auth/:app (explode)
POST /auth/ (verify code)
PUT /auth/ (login)

GET /app/ (get app list)
GET /app/:id (get app info)
POST /app/:id (upsert app)
DELETE /app/:id (delete app)
```
