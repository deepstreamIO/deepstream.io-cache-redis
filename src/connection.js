var redis = require( 'redis' ),
	EventEmitter = require( 'events' ).EventEmitter,
	utils = require( 'util'),
	NUMBER = 'number';

/**
 * Generic connection to Redis. Can be extended or
 * instantiated.
 *
 * @param {Object} options A map of connection parameters, namely
 *
 * {
 * 		host: <Number>
 * 		port: <String>
 * 		[serverName]: <String> //optional
 * 		[password]: <String> //optional
 * }
 *
 * @constructor
 */
var Connection = function( options ) {
	this.isReady = false;

	this._validateOptions( options );
	this._options = options;
	
	this.client = redis.createClient( options.port, options.host );

	if ( options.database ) {
		this.client.select(options.database);
	}
	
	if( options.password ) {
		this.client.auth( options.password, this._onAuthResult.bind( this ) );
	}
	
	this.client.on( 'ready', this._onReady.bind( this ) );
	this.client.on( 'error', this._onError.bind( this ) );
	this.client.on( 'end', this._onDisconnect.bind( this ) );
};

utils.inherits( Connection, EventEmitter );

/**
 * Callback for authentication responses
 *
 * @param   {String} error  Error message or null
 *
 * @void
 * @returns {void}
 */
Connection.prototype._onAuthResult = function( error ) {
	if( error ) {
		this._onError( 'Failed to authenticate connection: ' + error.toString() );
	}
};

/**
 * Callback for established connections
 *
 * @ready
 * @returns {void}
 */
Connection.prototype._onReady = function() {
	this.isReady = true;
	this.emit( 'ready' );
};

/**
 * Generic error callback
 *
 * @param   {String} error
 *
 * @ready
 * @returns {void}
 */
Connection.prototype._onError = function( error ) {
	this.emit( 'error', 'REDIS error:' + error );
};

/**
 * Callback for disconnection events
 *
 * @param   {String} error reason for disconnect
 *
 * @ready
 * @returns {void}
 */
Connection.prototype._onDisconnect = function( error ) {
	this._onError( 'disconnected' );
};

/**
 * Checks if all required parameters are present
 *
 * @param   {Object} options
 *
 * @ready
 * @returns {void}
 */
Connection.prototype._validateOptions = function( options ) {
	if( !options.host ) {
		throw new Error( 'Missing option \'host\' for redis-connector' );
	}
	if( !options.port ) {
		throw new Error( 'Missing option \'port\' for redis-connector' );
	}
	if ( options.database ) {
		if( typeof options.database !== NUMBER ) {
			throw new Error( 'The chosen database must be a number' );
		}
	}
};

module.exports = Connection;
