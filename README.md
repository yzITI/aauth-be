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
