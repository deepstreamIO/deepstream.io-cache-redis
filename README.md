# deepstream.io-cache-redis [![npm version](https://badge.fury.io/js/%40deepstream%2Fcache-redis.svg)](https://badge.fury.io/js/%40deepstream%2Fcache-redis)

[deepstream](http://deepstream.io) cache connector for [redis](http://redis.io/)

This connector uses [the npm redis package](https://www.npmjs.com/package/ioredis). Please have a look there for detailed options.

## Basic Setup
```yaml
plugins:
  cache:
    name: redis
    options:
      host: ${REDIS_HOST}
      port: ${REDIS_PORT}
      db: ${REDIS_DB_INDEX} // optional
      ttl: 86400 // optional time to live in seconds
```

```javascript
var Deepstream = require( 'deepstream.io' ),
    RedisCacheConnector = require( 'deepstream.io-cache-redis' ),
    server = new Deepstream();

server.set( 'cache', new RedisCacheConnector( {
  port: 6379,
  host: 'localhost'
}));

server.start();
```

## Basic Setup with TLS support
If you need to establish the redis connection via tls, set the `tls` option:
```yaml
plugins:
  cache:
    name: redis
    options:
      host: ${REDIS_HOST}
      port: ${REDIS_PORT}
      db: ${REDIS_DB_INDEX} // optional
      ttl: 86400 // optional time to live in seconds
      tls: {}
```

