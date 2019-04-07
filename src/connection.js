const Redis = require( "ioredis" );
const { EventEmitter } = require( "events" );

/**
 * Generic connection to Redis. Can be extended or
 * instantiated.
 *
 * @param {Object} options A map of connection parameters
 * To connect to a single redis node you can use:
 *
 * {
 *    host: <String>
 *    port: <Number>
 *    [serverName]: <String> //optional
 *    [password]: <String> //optional
 *    [db]: <Integer> //optional
 *    ttl: <Integer> //optional
 * }
 *
 * To connect to a cluster you can use:
 *
 * {
 *    nodes: [
 *      // Use password "password-for-30001" for 30001
 *      { port: <Number>, password: <String> },
 *      // Don't use password when accessing 30002
 *      { port: <Number>, password: null }
 *      // Other nodes will use "fallback-password"
 *    ],
 *    redisOptions: {
 *      password: 'fallback-password'
 *    }
 * }
 *
 * For more details and options see https://github.com/luin/ioredis
 * @constructor
 */
module.exports = class Connection extends EventEmitter {

  constructor(options) {
    super();
    this.isReady = false;
    this.options = options;
    this._validateOptions(options);
    //See https://github.com/luin/ioredis/wiki/Improve-Performance

    if (options.nodes instanceof Array) {
      options.redisOptions.dropBufferSupport = true;
      var nodes = options.nodes;
      delete options.nodes;
      this.client = new Redis.Cluster(nodes, options);
    } else {
      options.dropBufferSupport = true;
      this.client = new Redis(options);
    }

    this.client.on("ready", this._onReady.bind(this));
    this.client.on("error", this._onError.bind(this));
    this.client.on("end", this._onDisconnect.bind(this));
  }

  /**
   * Callback for authentication responses
   *
   * @param   {String} error  Error message or null
   *
   * @void
   * @returns {void}
   */
  _onAuthResult(error) {
    if (error) {
      this._onError("Failed to authenticate connection: " + error.toString());
    }
  }

  /**
   * Callback for established connections
   *
   * @ready
   * @returns {void}
   */
  _onReady() {
    this.isReady = true;
    this.emit("ready");
  }

  /**
   * Generic error callback
   *
   * @param   {String} error
   *
   * @ready
   * @returns {void}
   */
  _onError(error) {
    this.emit("error", "REDIS error:" + error);
  }

  /**
   * Callback for disconnection events
   *
   * @param   {String} error reason for disconnect
   *
   * @ready
   * @returns {void}
   */
  _onDisconnect(error) {
    this._onError("disconnected");
  }

  /**
   * Checks if all required parameters are present
   *
   * @param   {Object} options
   *
   * @ready
   * @returns {void}
   */
  _validateOptions(options) {
    if (!options) {
      throw new Error("Missing option 'host' for redis-connector");
    }
    if (options.nodes && !(options.nodes instanceof Array)) {
      throw new Error("Option nodes must be an array of connection parameters for cluster");
    }
  }
};
