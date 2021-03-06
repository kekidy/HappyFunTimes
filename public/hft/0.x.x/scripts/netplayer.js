/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

define(function() {
  /**
   * Manages a player across the net.
   *
   * **NOTE: YOU DO NOT CREATE THESE DIRECTLY**. They are created
   * by the `GameServer` whenever a new player joins your game.
   * They are passed to you in the 'playerconnect' event from
   * `GameServer`
   *
   * @constructor
   * @private
   * @alias NetPlayer
   * @param {GameServer} server
   * @param {number} id
   * @param {string} name
   */
  var NetPlayer = function(server, id, data) {
    var _server = server;
    var _id = id;
    var _eventListeners = { };
    var _connected = true;
    var _sessionId = data ? data.__hft_session_id__ : undefined;
    var _self = this;
    var _emptyMsg = {};

    /**
     * Sends a message to this player.
     *
     * @param {string} cmd
     * @param {object} [msg] a jsonifyable object.
     */
    this.sendCmd = function(cmd, msg) {
      if (!_connected) {
        return;
      }
      if (msg === undefined) {
        msg = _emptyMsg;
      }
      _server.sendCmd("client", _id, {cmd: cmd, data: msg});
    };

    /**
     * Adds an event listener
     *
     * You make up these events. Calling
     *
     *     GameClient.sendCmd('someEvent', { foo: 123 });
     *
     * In the controller (the phone) will emit an event `someEvent`
     * which will end up calling the listener. That listener will be
     * passed the data. In the example above that data is
     * `{foo:123}`
     *
     *     function handleSomeEvent(data) {
     *       console.log("foo = " + data.foo);
     *     }
     *
     *     someNetPlayer.addEventListener('someEvent', handleSomeEvent);
     *
     *
     * @param {string} eventType name of event.
     * @param {function(object)} listener function to call when event
     *        arrives
     */
    this.addEventListener = function(eventType, listener) {
      switch (eventType) {
        case 'disconnect':
          listener = function(listener) {
            return function() {
               _self.removeAllListeners();
               _connected = false;
               return listener.apply(_self, arguments);
            };
          }(listener);
          break;
      }
      _eventListeners[eventType] = listener;
    };

    /**
     * Removes an event listener
     * @param {string} eventType name of event to remove
     */
    this.removeEventListener = function(eventType) {
      _eventListeners[eventType] = undefined;
    };

    /**
     * Removes all listeners
     */
    this.removeAllListeners = function() {
      _eventListeners = { };
    };

    this.sendEvent_ = function(eventType, args) {
      var fn = _eventListeners[eventType];
      if (fn) {
        fn.apply(this, args);
      } else {
        console.error("NetPlayer: Unknown Event: " + eventType);
      }
    };

    /**
     * Moves this player to another game.
     *
     * You can use this function to make multi-computer / multi-screen
     * games. See [hft-tonde-iko](http://github.com/greggman/hft-tonde-iko)
     * as an example.
     *
     * @param {string} gameId id of game to send player to
     * @param {*} data data to give to game receiving the player.
     */
    this.switchGame = function(gameId, data) {
      if (_connected) {
        _server.sendCmd("switchGame", _id, {gameId: gameId, data: data});
        _connected = false;
      }
    };

    /**
     * Whether or not this netplayer is connected.
     * you shouldn't need to look at this.
     * @name NetPlayer#connected
     * @type bool
     * @readonly
     */
    Object.defineProperty(this, 'connected', {
      get: function() {
        return _connected;
      },
    });

    /**
     * A sessionId for this player
     *
     * This id should be the same if they disconnect and later reconnects
     * so you can use it to restore their state if you want.
     * @name NetPlayer#sessionId
     * @type string
     * @readonly
     */
    Object.defineProperty(this, 'sessionId', {
      get: function() {
        return _sessionId;
      },
    });

    /**
     * A unique id for this NetPlayer object.
     *
     * this id will not repeat even if the user disconnects and reconnects.
     * @name NetPlayer#id
     * @type string
     * @readonly
     */
    Object.defineProperty(this, 'id', {
      get: function() {
        return _id;
      },
    });
  };

  /**
   * Event that the player has left.
   *
   * @event NetPlayer#disconnected
   */

  return NetPlayer;
});

