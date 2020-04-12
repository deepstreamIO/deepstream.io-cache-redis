import { Connection } from './connection'
import * as pkg from '../package.json'
import { DeepstreamPlugin, DeepstreamCache, StorageReadCallback, StorageWriteCallback, StorageHeadBulkCallback, StorageHeadCallback, DeepstreamConfig, DeepstreamServices } from '@deepstream/types'

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
export class CacheConnector extends DeepstreamPlugin implements DeepstreamCache {
  public isReady = false
  public description = `Redis Cache Connector ${pkg.version}`
  private readBuffer: Map<string, StorageReadCallback[] | StorageReadCallback> = new Map()
  private writeBuffer: Map<string, {
    action: 'delete' | 'set',
    callback: StorageWriteCallback,
    version?: number,
    data?: string
  }> = new Map()
  private timeoutSet: boolean = false
  private connection: Connection
  private logger = this.services.logger.getNameSpace('REDIS_CACHE')

  constructor (private pluginOptions: any, private services: DeepstreamServices, deepstreamConfig: DeepstreamConfig) {
    super()
    this.flush = this.flush.bind(this)
    this.connection = new Connection(pluginOptions, this.logger)
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

  public headBulk (recordNames: string[], callback: StorageHeadBulkCallback): void {
    (this.connection.client as any).mget(recordNames.map((name) => `${name}_v`) as any, (error: any, result: any) => {
      const r = recordNames.reduce((v, name, index) => {
        if (result[index] !== null) {
          v.v[name] = Number(result[index])
        } else {
          v.m.push(name)
        }
        return v
      }, { v: {}, m: []} as any)
      callback(error, r.v, r.m)
    })
  }

  public head (recordName: string, callback: StorageHeadCallback): void {
    throw new Error('Head is not yet required by deepstream.')
  }

  public deleteBulk (recordNames: string[], callback: StorageWriteCallback): void {
    const pipeline = this.connection.client.pipeline()
    pipeline.del(recordNames.map((name) => `${name}_v`) as any)
    pipeline.del(recordNames.map((name) => `${name}_d`) as any)
    pipeline.exec(callback as any)
  }

  /**
   * Deletes an entry from the cache.
   */
  public delete (recordName: string, callback: StorageWriteCallback) {
    if (this.writeBuffer.has(recordName)) {
      console.trace(`deepstream-redis: A write action is already registered for ${recordName}`)
    }
    this.writeBuffer.set(recordName, { action: 'delete', callback })
    this.scheduleFlush()
  }

  /**
   * Writes a value to the cache.
   */
  public set (recordName: string, version: number, data: any, callback: StorageWriteCallback) {
    if (this.writeBuffer.has(recordName)) {
      console.trace(`deepstream-redis: A write action is already registered for ${recordName}`)
    }

    this.writeBuffer.set(recordName, { action: 'set', callback, version, data })
    this.scheduleFlush()
  }

  /**
   * Retrieves a value from the cache
   */
   public get (key: string, callback: StorageReadCallback) {
    if (this.writeBuffer.has(key)) {
      console.log(`deepstream-redis: A write action is registered for ${key}`)
    }

    const callbacks = this.readBuffer.get(key)
    if (!callbacks) {
      this.readBuffer.set(key, callback)
    } else if (typeof callbacks === 'function') {
      this.logger.warn('MULTIPLE_CACHE_GETS', `Multiple cache gets for record ${key}`, { recordName: key })
      this.readBuffer.set(key, [callbacks, callback])
    } else {
      callbacks.push(callback)
    }
    this.scheduleFlush()
   }

   public scheduleFlush () {
     if (this.readBuffer.size + this.writeBuffer.size > 5000) {
       this.flush()
       return
     }
     if (!this.timeoutSet) {
       this.timeoutSet = true
       process.nextTick(this.flush)
     }
   }

  public flush () {
    this.timeoutSet = false
    const pipeline = this.connection.client.pipeline()

    for (const [recordName, { callback, action, version, data }] of this.writeBuffer.entries()) {
      switch (action) {
        case 'set':
          if (this.pluginOptions.ttl) {
            pipeline.setex(`${recordName}_v`, this.pluginOptions.ttl, version!)
            pipeline.setex(`${recordName}_d`, this.pluginOptions.ttl, JSON.stringify(data), callback as any)
          } else {
            pipeline.mset({
              [`${recordName}_v`]: version!,
              [`${recordName}_d`]: JSON.stringify(data)
            }, callback as (error: Error | null) => {})
          }
          break
        case 'delete':
          (pipeline as any).del([`${recordName}_v`, `${recordName}_d`], callback as any)
          break
      }
    }
    this.writeBuffer.clear()

    for (const [recordName, callbacks] of this.readBuffer.entries()) {
    (pipeline as any).mget([`${recordName}_v`, `${recordName}_d`], (error: any, result: any) => {
      if (typeof callbacks === 'function') {
        this.readCallback(callbacks, error, result)
      } else {
        callbacks.forEach((callback) => this.readCallback(callback, error, result))
      }
    })
    }
    this.readBuffer.clear()

    pipeline.exec()
  }

  private readCallback (callback: StorageReadCallback, error: any, result: any) {
    if (error) {
      callback(error.toString())
      return
    }

    if (!result[0]) {
      callback(null, -1, null)
      return
    }

    callback(null, Number(result[0]), JSON.parse(result[1]))
  }
}

export default CacheConnector
