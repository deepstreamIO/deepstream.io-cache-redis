# deepstream.io-cache-redis [![npm version](https://badge.fury.io/js/deepstream.io-cache-redis.svg)](http://badge.fury.io/js/deepstream.io-cache-redis)

[deepstream](http://deepstream.io) cache connector for [redis](http://redis.io/)

This connector uses [the npm redis package](https://www.npmjs.com/package/redis). Please have a look there for detailed options.

##Basic Setup
```yaml
plugins:
  cache:
    name: redis
    options:
      host: ${REDIS_HOST}
      port: ${REDIS_PORT}
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
