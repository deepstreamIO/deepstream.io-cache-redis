import { Connection } from './connection'
import { DeepstreamPlugin, StorageWriteCallback, StorageReadCallback, Storage } from './types'

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
export class CacheConnector extends DeepstreamPlugin implements Storage {
  public apiVersion = 2
  public isReady = false
  public description = 'Redis Cache Connector'
  private buffer: Map<string, {
    action: 'delete' | 'set' | 'get',
    callback: StorageReadCallback,
    version?: number,
    data?: string
  }> = new Map()
  private timeoutSet: boolean = false
  private connection: Connection

  constructor (private pluginOptions: any, services: any, deepstreamConfig: any) {
    super()
    this.flush = this.flush.bind(this)
    this.connection = new Connection(pluginOptions)
  }

  public async whenReady () {
    await this.connection.whenReady()
  }

  /**
   * Gracefully close the connection to redis
   */
  public async close () {
    await this.connection.close()
  }

  public deleteBulk (recordNames: string[], callback: StorageWriteCallback): void {
    const pipeline = this.connection.client.pipeline()
    recordNames.forEach((recordName) => pipeline.del(recordName))
    pipeline.exec(callback as any)
  }

  /**
   * Deletes an entry from the cache.
   */
  public delete (recordName: string, callback: StorageWriteCallback) {
    if (this.buffer.has(recordName)) {
      console.trace(`deepstream-redis-delete: A action is already registered for ${recordName}`)
    }
    this.buffer.set(recordName, { action: 'delete', callback })
    this.scheduleFlush()
  }

  /**
   * Writes a value to the cache.
   */
  public set (recordName: string, version: number, data: any, callback: StorageWriteCallback) {
    if (this.buffer.has(recordName)) {
      console.trace(`deepstream-redis-delete: A action is already registered for ${recordName}`)
    }

    this.buffer.set(recordName, { action: 'set', callback, version, data })
    this.scheduleFlush()
  }

  /**
   * Retrieves a value from the cache
   */
   public get (key: string, callback: StorageReadCallback) {
    if (this.buffer.has(key)) {
      console.trace(`deepstream-redis-get: A action is already registered for ${key}`)
    }

    this.buffer.set(key, { action: 'get', callback })
    this.scheduleFlush()
   }

   public scheduleFlush () {
     if (!this.timeoutSet) {
       this.timeoutSet = true
       process.nextTick(this.flush)
     }
   }

  public flush () {
    this.timeoutSet = false
    const pipeline = this.connection.client.pipeline()

    const actions = this.buffer.entries()
    for (const [recordName, { callback, action, version, data }] of actions) {
      switch (action) {
        case 'set':
          const value = JSON.stringify({ _v: version, _d: data })
          if (this.pluginOptions.ttl) {
            pipeline.setex(recordName, this.pluginOptions.ttl, value, callback as any)
          } else {
            pipeline.set(recordName, value, callback as any)
          }
          break
        case 'delete':
          pipeline.del(recordName, callback as any)
          break
        case 'get':
          pipeline.get(recordName, (error, result) => {
            let parsedResult

            if (result === null || error) {
                callback(error ? error.toString() : null, -1, null)
                return
              }

            try {
              parsedResult = JSON.parse(result)
            } catch (e) {
              callback(e.message)
              return
            }

            callback(null, parsedResult._v, parsedResult._d)
          })
          break
      }
    }
    this.buffer.clear()
    pipeline.exec()
  }
}
