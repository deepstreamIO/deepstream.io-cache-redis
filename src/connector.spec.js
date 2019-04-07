'use strict'

/* global describe, expect, it, jasmine */
const expect = require('chai').expect
const CacheConnector = require('./connector')
const EventEmitter = require('events').EventEmitter

const settings = {
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || 'localhost',
  ttl: 2
}

describe('the message connector has the correct structure', () => {
  let cacheConnector

  it('creates the cacheConnector', (done) => {
    cacheConnector = new CacheConnector(settings)
    expect(cacheConnector.isReady).to.equal(false)
    cacheConnector.on('ready', done)
    cacheConnector.on('error', (e) => { throw e })
  })

  it('implements the cache/storage connector interface', () => {
    expect(typeof cacheConnector.name).to.equal('string')
    expect(typeof cacheConnector.version).to.equal('string')
    expect(typeof cacheConnector.get).to.equal('function')
    expect(typeof cacheConnector.set).to.equal('function')
    expect(typeof cacheConnector.delete).to.equal('function')
    expect(cacheConnector instanceof EventEmitter).to.equal(true)
  })

  it('retrieves a non existing value', (done) => {
    cacheConnector.get('someValue', (error, value) => {
      expect(error).to.equal(null)
      expect(value).to.equal(null)
      done()
    })
  })

  it('sets a value', (done) => {
    cacheConnector.set('someValue', { firstname: 'Wolfram' }, (error) => {
      expect(error).to.equal(null)
      done()
    })
  })

  it('retrieves an existing value', (done) => {
    cacheConnector.get('someValue', (error, value) => {
      expect(error).to.equal(null)
      expect(value).to.deep.equal({ firstname: 'Wolfram' })
      done()
    })
  })

  it('deletes a value', (done) => {
    cacheConnector.delete('someValue', (error) => {
      expect(error).to.equal(null)
      done()
    })
  })

  it('Can\'t retrieve a deleted value', (done) => {
    cacheConnector.get('someValue', (error, value) => {
      expect(error).to.equal(null)
      expect(value).to.equal(null)
      done()
    })
  })

  it('properly expires keys', (done) => {
    cacheConnector.set('willExpire', { some: 'data' }, (error) => {
      expect(error).to.equal(null)
      setTimeout(() => {
        cacheConnector.get('willExpire', (err, value) => {
          expect(err).to.equal(null)
          expect(value).to.equal(null)
          done()
        })
      }, 2500)
    })
  }).timeout(5000)

  it('sets and gets ALOT of values (as object)', (done) => {
    const iterations = 30000;
    let resultCount = 0;
    for (let i = 0; i < iterations; i++) {
      cacheConnector.set('someValue' + i, { value: i }, (error) => {
        expect(error).to.equal(null)
        resultCount++;
        if (resultCount === iterations) {
          let resultCount = 0;
          for (let i = 0; i < iterations; i++) {
            cacheConnector.get('someValue' + i, (error, result) => {
              expect(error).to.equal(null)
              expect(result).to.deep.equal({ value: i });
              resultCount++;
              if (resultCount === iterations) done();
            })
          }
        };
      })
    }
  }).timeout(10000)
})
