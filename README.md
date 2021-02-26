# deepstream.io-cache-redis [![npm version](https://badge.fury.io/js/%40deepstream%2Fcache-redis.svg)](https://badge.fury.io/js/%40deepstream%2Fcache-redis)

[deepstream](http://deepstream.io) cache connector for [redis](http://redis.io/)

This connector uses [the npm redis package](https://www.npmjs.com/package/ioredis). Please have a look there for detailed options.

## Installation
**npm**
```
npm install @deepstream/cache-redis
```
**yarn**
```
yarn add @deepstream/cache-redis
```

## Basic Setup
`config.yml`
```yaml
cache:
  name: redis
  options:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    db: ${REDIS_DB_INDEX} // optional
    ttl: 86400 // optional time to live in seconds
```


## Basic Setup with TLS support
If you need to establish the redis connection via tls, set the `tls` option:
```yaml
cache:
  name: redis
  options:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    db: ${REDIS_DB_INDEX} // optional
    ttl: 86400 // optional time to live in seconds
    tls: {}
```

