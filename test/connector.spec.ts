import { expect } from 'chai'
import { CacheConnector } from '../src/connector'
import { config } from './connection-params'

describe('the message connector has the correct structure', () => {
  let cacheConnector: CacheConnector

  before('creates the cacheConnector', async () => {
    cacheConnector = new CacheConnector(config, { logger: {
      // @ts-ignore
      getNameSpace: () => ({
        // @ts-ignore
        fatal: (e: any, m: any) => {
          // @ts-ignore
          console.error('Fatal exception', e, m)
        },
        warn: () => {}
      })
    }}, {})
    expect(cacheConnector.isReady).to.equal(false)
    await cacheConnector.whenReady()
  })

  it('implements the cache/storage connector interface', () => {
    expect(typeof cacheConnector.description).to.equal('string')
    expect(typeof cacheConnector.deleteBulk).to.equal('function')
    // expect(typeof cacheConnector.head).to.equal('function')
    expect(typeof cacheConnector.get).to.equal('function')
    expect(typeof cacheConnector.set).to.equal('function')
    expect(typeof cacheConnector.delete).to.equal('function')
  })

  it('retrieves a non existing value', (done) => {
    cacheConnector.get('someValue', (error, version, value) => {
      expect(error).to.equal(null)
      expect(version).to.equal(-1)
      expect(value).to.equal(null)
      done()
    })
  })

  it('sets a value', (done) => {
    cacheConnector.set('someValue', 2, { firstname: 'Wolfram' }, (error) => {
      expect(error).to.equal(null)
      done()
    })
  })

  it('retrieves an existing value multiple times', (done) => {
    const results: any[] = []
    const callback = (...args: any[]) => results.push(args)

    cacheConnector.get('someValue', callback)
    cacheConnector.get('someValue', callback)
    cacheConnector.get('someValue', callback)

    setTimeout(() => {
      expect(results.length).to.equal(3)
      done()
    }, 60)
  })

  it('retrieves an existing value', (done) => {
    cacheConnector.get('someValue', (error, version, value) => {
      expect(error).to.equal(null)
      expect(version).to.equal(2)
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

  it("Can't retrieve a deleted value", (done) => {
    cacheConnector.get('someValue', (error, version, value) => {
      expect(error).to.equal(null)
      expect(version).to.equal(-1)
      expect(value).to.equal(null)
      done()
    })
  })

  it('properly expires keys', (done) => {
    cacheConnector.set('willExpire', 1, { some: 'data' }, async (error: any) => {
      expect(error).to.equal(null)
      await new Promise((resolve) => setTimeout(resolve, 2500))
      cacheConnector.get('willExpire', (err, version, value) => {
        expect(err).to.equal(null)
        expect(version).to.equal(-1)
        expect(value).to.equal(null)
        done()
      })
    })
  }).timeout(5000)

  it('sets and gets ALOT of values (as object)', (done) => {
    const iterations = 30000
    let setCount = 0
    for (let i = 0; i < iterations; i++) {
      cacheConnector.set('someValue' + i, i, { value: i }, (error) => {
        expect(error).to.equal(null)
        setCount++
        if (setCount === iterations) {
          let resultCount = 0
          for (let j = 0; j < iterations; j++) {
            cacheConnector.get('someValue' + j, (getError, version, value) => {
              expect(getError).to.equal(null)
              expect(version).to.equal(j)
              expect(value).to.deep.equal({ value: j })
              resultCount++
              if (resultCount === iterations) { done() }
            })
          }
        }
      })
    }
  }).timeout(10000)

  it ('deletes in bulk', (done) => {
    const iterations = 30000
    const recordNames = []
    for (let i = 0; i < iterations; i++) {
      recordNames.push('someValue' + i)
    }
    cacheConnector.deleteBulk(recordNames, () => {
      let resultCount = 0
      for (let j = 0; j < iterations; j++) {
      cacheConnector.get('someValue' + j, (getError, version, value) => {
        expect(getError).to.equal(null)
        expect(version).to.equal(-1)
        expect(value).to.equal(null)
        resultCount++
        if (resultCount === iterations) { done() }
      })
    }
    })
  })
})
