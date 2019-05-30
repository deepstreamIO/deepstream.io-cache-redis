"use strict";

const Connection = require("./connection");
const pckg = require("../package.json");
const util = require("util");

/**
 * A [deepstream](http://deepstream.io) cache connector
 * for [Redis](http://redis.io)
 *
 * Since Redis, on top of caching key/value combinations in
 * memory, writes them to disk it can make a storage connector
 * obsolete
 *
 * @param {Object} options redis connection options. Please see ./connection.js
 *                         for details
 *
 * @constructor
 */
module.exports = class CacheConnector extends Connection {
  constructor(options) {
    super(options);

    this.name = pckg.name;
    this.version = pckg.version;

    this.flush = this.flush.bind(this);
    this.sets = new Map();
    this.gets = new Map();
    this.deletes = new Map();
  }

  /**
   * Gracefully close the connection to redis
   *
   * Called when deepstream.close() is invoked.
   * Emits 'close' event to notify deepstream of clean closure.
   *
   * @public
   * @returns {void}
   */
  close() {
    this.client.removeAllListeners("end");
    this.client.once("end", this.emit.bind(this, "close"));
    this.client.quit();
  }

  /**
   * Deletes an entry from the cache.
   *
   * @param   {String}   key
   * @param   {Function} callback Will be called with null for successful deletions or
   *                              with an error message
   *
   * @private
   * @returns {void}
   */
  delete(key, callback) {
    if (this.sets.has(key)) {
      console.trace(`deepstream-redis-delete: A delete action is already registered for ${key}`)
    }
    this.sets.delete(key);

    if (this.sets.has(key)) {
      console.trace(`deepstream-redis-delete: A set action is already registered for ${key}`)
    }
    this.deletes.set(key, callback);
    this.scheduleFlush();
  }

  /**
   * Writes a value to the cache.
   *
   * @param {String}   key
   * @param {Object}   value
   * @param {Function} callback Will be called with null for successful set operations or
   *                            with an error message string
   *
   * @private
   * @returns {void}
   */
  set(key, value, callback) {
    if (this.sets.has(key)) {
      console.trace(`deepstream-redis-set: A set action is already registered for ${key}`)
    }

    this.sets.set(key, { value, callback });
    this.scheduleFlush();
  }

  /**
   * Retrieves a value from the cache
   *
   * @param {String}   key
   * @param {Function} callback Will be called with null and the originally stored object
   *                            for successful operations or with an error message string
   *
   * @private
   * @returns {void}
   */
   get(key, callback) {
    if (this.gets.has(key)) {
      console.trace(`deepstream-redis-get: A get action is already registered for ${key}`)
    }

     this.gets.set(key, callback);
     this.scheduleFlush();
   }

   scheduleFlush() {
     if (!this.timeoutSet) {
       this.timeoutSet = true;
       process.nextTick(this.flush);
     }
   }

  flush() {
    this.timeoutSet = false;
    const pipeline = this.client.pipeline();

    const sets = this.sets.entries();
    for (let entry of sets) {
      const key = entry[0];
      const value = JSON.stringify(entry[1].value);
      const callback = entry[1].callback;
      if (this.options.ttl) {
        pipeline.setex(key, this.options.ttl, value, callback);
      } else {
        pipeline.set(key, value, callback);
      }
    }
    this.sets.clear();

    const deletes = this.deletes.entries();
    for (let entry of deletes) {
      pipeline.del(entry[0], entry[1]);
    }
    this.deletes.clear();

    const gets = this.gets.entries();
    for (let entry of gets) {
      const key = entry[0];
      const callback = entry[1];

      pipeline.get(key, (error, result) => {
        let parsedResult;

        if (result === null) {
          callback(error, null);
          return;
        }

        try {
          parsedResult = JSON.parse(result);
        } catch (e) {
          callback(e);
          return;
        }

        callback(null, parsedResult);
      });
    }
    this.gets.clear();

    pipeline.exec();
  }
};
