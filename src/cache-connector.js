var Connection = require( './connection' ),
	util = require( 'util' );

/**
 * A [deepstream](http://deepstream.io) cache connector
 * for [Redis](http://redis.io)
 *
 * Since Redis, on top of caching key/value combinations in
 * memory, writes them to disk it can make a storage connector
 * obsolete
 *
 * @author Wolfram Hempel
 * @copyright 2015 Hoxton One Ltd.
 *
 * @param {Object} options redis connection options. Please see ./connection.js
 *                         for details
 *
 * @constructor
 */
var CacheConnector = function( options ) {
	Connection.call( this, options );

	this.name = 'deepstream-cache-redis';
	this.version = '0.2.3';
};

util.inherits( CacheConnector, Connection );

/**
 * Deletes an entry from the cache.
 *
 * @param   {String}   key
 * @param   {Function} callback Will be called with null for successful deletions or with an error message
 *
 * @private
 * @returns {void}
 */
CacheConnector.prototype.delete = function( key, callback ) {
	this.client.del( key, callback );
};

/**
 * Writes a value to the cache.
 *
 * @param {String}   key
 * @param {Object}   value
 * @param {Function} callback Will be called with null for successful set operations or with an error message string
 *
 * @private
 * @returns {void}
 */
CacheConnector.prototype.set = function( key, value, callback ) {
	this.client.set( key, JSON.stringify( value ), callback );
};

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
CacheConnector.prototype.get = function( key, callback ) {
	this.client.get( key, function( error, result ){
		var parsedResult;

		if( result === null ) {
			callback( error, null );
			return;
		}

		try {
			parsedResult = JSON.parse( result );
		} catch ( e ) {
			callback( e );
			return;
		}

		callback( null, parsedResult );
	});
};

module.exports = CacheConnector;