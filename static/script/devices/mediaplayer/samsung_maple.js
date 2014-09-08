/**
 * @fileOverview Requirejs module containing device modifier to launch native external media players
 *
 * @preserve Copyright (c) 2014 British Broadcasting Corporation
 * (http://www.bbc.co.uk) and TAL Contributors (1)
 *
 * (1) TAL Contributors are listed in the AUTHORS file and at
 *     https://github.com/fmtvp/TAL/AUTHORS - please extend this file,
 *     not this notice.
 *
 * @license Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * All rights reserved
 * Please contact us for an alternative licence
 */

require.def(
    "antie/devices/mediaplayer/samsung_maple",
    [
        "antie/devices/device",
        "antie/devices/mediaplayer/mediaplayer"
    ],
    function(Device, MediaPlayer) {
        "use strict";

        var Player = MediaPlayer.extend({

            init: function() {
                this._super();
                this._state = MediaPlayer.STATE.EMPTY;
                this._wipe();
            },


            /**
            * @inheritDoc
            */
            setSource: function (mediaType, url, mimeType) {
                if (this.getState() === MediaPlayer.STATE.EMPTY) {
                    this._type = mediaType;
                    this._source = url;
                    this._mimeType = mimeType;
                    this._registerEventHandlers();
                    this._toStopped();
                } else {
                    this._toError();
                }
            },

            /**
            * @inheritDoc
            */
            resume : function () {
                this._postBufferingState = MediaPlayer.STATE.PLAYING;
                switch (this.getState()) {
                    case MediaPlayer.STATE.PLAYING:
                    case MediaPlayer.STATE.BUFFERING:
                        break;

                    case MediaPlayer.STATE.PAUSED:
                        this._toPlaying();
                        break;

                    default:
                        this._toError();
                        break;
                }
            },

            /**
            * @inheritDoc
            */
            playFrom: function (time) {
                this._targetSeekTime = time;
                this._postBufferingState = MediaPlayer.STATE.PLAYING;
                switch (this.getState()) {
                    case MediaPlayer.STATE.BUFFERING:
                        break;

                    case MediaPlayer.STATE.PLAYING:
                    case MediaPlayer.STATE.STOPPED:
                    case MediaPlayer.STATE.PAUSED:
                    case MediaPlayer.STATE.COMPLETE:
                        this._toBuffering();
                        break;

                    default:
                        this._toError();
                        break;
                }
            },

            /**
            * @inheritDoc
            */
            pause: function () {
                this._postBufferingState = MediaPlayer.STATE.PAUSED;
                switch (this.getState()) {
                    case MediaPlayer.STATE.BUFFERING:
                    case MediaPlayer.STATE.PAUSED:
                        break;

                    case MediaPlayer.STATE.PLAYING:
                        this._toPaused();
                        break;

                    default:
                        this._toError();
                        break;
                }
            },

            /**
            * @inheritDoc
            */
            stop: function () {
                switch (this.getState()) {
                    case MediaPlayer.STATE.BUFFERING:
                    case MediaPlayer.STATE.PLAYING:
                    case MediaPlayer.STATE.PAUSED:
                    case MediaPlayer.STATE.COMPLETE:
                        this._toStopped();
                        break;

                    default:
                        this._toError();
                        break;
                }
            },

            /**
            * @inheritDoc
            */
            reset: function () {
                switch (this.getState()) {
                    case MediaPlayer.STATE.STOPPED:
                    case MediaPlayer.STATE.ERROR:
                        this._toEmpty();
                        break;

                    default:
                        this._toError();
                        break;
                }
            },

            /**
            * @inheritDoc
            */
            getSource: function () {
                return this._source;
            },

            /**
            * @inheritDoc
            */
            getMimeType: function () {
                return this._mimeType;
            },

            /**
            * @inheritDoc
            */
            getCurrentTime: function () {
                return this._currentTime; // FIXME
            },

            /**
            * @inheritDoc
            */
            getRange: function () {
                return this._range; // FIXME
            },

            /**
            * @inheritDoc
            */
            getState: function () {
                return this._state;
            },

            _onFinishedBuffering: function() {
                if (this.getState() !== MediaPlayer.STATE.BUFFERING) {
                    return;
                } else if (this._postBufferingState === MediaPlayer.STATE.PAUSED) {
                    this._toPaused();
                } else {
                    this._toPlaying();
                }
            },

            _onDeviceError: function() {
                this._toError();
            },

            _onDeviceBuffering: function() {
                this._toBuffering();
            },

            _onEndOfMedia: function() {
                this._toComplete();
            },

            _onStatus: function() {
                if (this.getState() === MediaPlayer.STATE.PLAYING) {
                    this._emitEvent(MediaPlayer.EVENT.STATUS);
                }
            },

            _registerEventHandlers: function() {
                var self = this;
                window.SamsungMapleOnRenderError = function () {
                    self._onDeviceError();
                };
                window.SamsungMapleOnRenderingComplete = function () {
                    self._onEndOfMedia();
                };
            },

            _unregisterEventHandlers: function() {
                var eventHandlers = [ 'SamsungMapleOnRenderError', 'SamsungMapleOnRenderingComplete' ];
                for (var i = 0; i < eventHandlers.length; i++){
                    delete window[eventHandlers[i]];
                }
            },

            _wipe: function () {
                this._type = undefined;
                this._source = undefined;
                this._mimeType = undefined;
                this._currentTime = undefined; // FIXME
                this._range = undefined; // FIXME
                this._unregisterEventHandlers();
            },

            _toStopped: function () {
                this._currentTime = undefined; // FIXME
                this._range = undefined; // FIXME
                this._state = MediaPlayer.STATE.STOPPED;
                this._emitEvent(MediaPlayer.EVENT.STOPPED);
            },

            _toBuffering: function () {
                this._state = MediaPlayer.STATE.BUFFERING;
                this._emitEvent(MediaPlayer.EVENT.BUFFERING);
            },

            _toPlaying: function () {
                this._state = MediaPlayer.STATE.PLAYING;
                this._emitEvent(MediaPlayer.EVENT.PLAYING);
            },

            _toPaused: function () {
                this._state = MediaPlayer.STATE.PAUSED;
                this._emitEvent(MediaPlayer.EVENT.PAUSED);
            },

            _toComplete: function () {
                this._currentTime = undefined; // FIXME
                this._state = MediaPlayer.STATE.COMPLETE;
                this._emitEvent(MediaPlayer.EVENT.COMPLETE);
            },

            _toEmpty: function () {
                this._wipe();
                this._state = MediaPlayer.STATE.EMPTY;
            },

            _toError: function () {
                this._wipe();
                this._state = MediaPlayer.STATE.ERROR;
                this._emitEvent(MediaPlayer.EVENT.ERROR);
            }
        });

        var instance = new Player();

        // Mixin this MediaPlayer implementation, so that device.getMediaPlayer() returns the correct implementation for the device
        Device.prototype.getMediaPlayer = function() {
            return instance;
        };

        return Player;
    }

);