'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var red = 'color: red;';
var green = 'color: green;';
var yellow$1 = 'color: yellow;';
var cyan = 'color: cyan;';
var reset$1 = '';
var Logger = (function () {
    function Logger() {
        this.isSetup = false;
    }
    Logger.prototype.set = function (options) {
        this.debugMode = options.debug;
        this.silentMode = (options.silent == undefined) ? true : options.silent;
        this.isSetup = true;
    };
    Logger.prototype.debug = function (t) {
        if (!this.isSetup) {
            this.loggerWarning();
        }
        if (!this.debugMode) {
            return;
        }
        if (this.silentMode) {
            return;
        }
        console.log("%c[DEBUG]%c " + t, cyan, reset$1);
    };
    Logger.prototype.info = function (t) {
        if (!this.isSetup) {
            this.loggerWarning();
        }
        if (this.silentMode) {
            return;
        }
        console.log("%c[INFO]%c " + t, green, reset$1);
    };
    Logger.prototype.error = function (t) {
        if (!this.isSetup) {
            this.loggerWarning();
        }
        console.error("%c[ERROR]%c " + t, red, reset$1);
    };
    Logger.prototype.warn = function (t) {
        if (!this.isSetup) {
            this.loggerWarning();
        }
        console.error("%c[WARN]%c " + t, yellow$1, reset$1);
    };
    Logger.prototype.obj = function (t, obj) {
        if (!this.isSetup) {
            this.loggerWarning();
        }
        if (!this.debugMode) {
            return;
        }
        if (this.silentMode) {
            return;
        }
        console.groupCollapsed("%c[DEBUG]%c " + t, cyan, reset$1);
        console.log(obj);
        console.groupEnd();
    };
    Logger.prototype.loggerWarning = function () {
        console.warn("%c[WARN]%c logger has not been set up. call \"set()\" method", yellow$1, reset$1);
    };
    return Logger;
}());
var logger = new Logger();

var EventEmitter2 = require('eventemitter2');
var axios = require('axios');
var querystring = require('querystring');
var CONNECTOR_URL = "https://socketio-connector.minarai.cloud";
var DEFAULT_API_VERSION = "v1";
var yellow = '\u001b[33m';
var reset = '\u001b[0m';
var MinaraiClient = (function (_super) {
    __extends(MinaraiClient, _super);
    function MinaraiClient(opts) {
        _super.call(this);
        if (!opts.io || !opts.applicationId) {
            throw new InvalidArgumentError("opts must contain io and applicationId");
        }
        if (!opts.applicationSecret) {
            // throw new InvalidArgumentError("opts must contain io and applicationSecret");
            console.warn(yellow + '[warn]You had better use applicationSecret' + reset);
        }
        var socketIORootURL = opts.socketIORootURL || CONNECTOR_URL;
        var apiVersion = opts.apiVersion || DEFAULT_API_VERSION;
        var socketIOOptions = {
            path: "/socket.io/" + apiVersion,
            transports: ["websocket"]
        };
        if (opts.socketIOOptions
            && Object.prototype.toString.call(opts.socketIOOptions) === "[object Object]") {
            Object.assign(socketIOOptions, opts.socketIOOptions);
        }
        this.socket = opts.io.connect(socketIORootURL, socketIOOptions);
        this.applicationId = opts.applicationId;
        this.applicationSecret = opts.applicationSecret;
        this.clientId = opts.clientId;
        this.userId = opts.userId;
        this.deviceId = opts.deviceId || "device_id_" + this.applicationId + "_" + new Date().getTime();
        this.lang = opts.lang || 'ja-JP';
        this.imageUrl = socketIORootURL.replace(/\/$/, '') + "/" + apiVersion + "/upload-image";
        this.getImageByHeader = opts.getImageByHeader;
        logger.set({ debug: opts.debug, silent: opts.silent });
    }
    MinaraiClient.prototype.init = function () {
        var _this = this;
        this.socket.on('connect', function () {
            logger.debug('connect');
            _this.emit('connect');
            _this.socket.emit('join-as-client', {
                applicationId: _this.applicationId,
                applicationSecret: _this.applicationSecret,
                clientId: _this.clientId,
                userId: _this.userId,
                deviceId: _this.deviceId,
            });
        });
        this.socket.on('disconnect', function () {
            logger.debug('disconnect');
            _this.emit('disconnected');
        });
        this.socket.on('joined', function (data) {
            _this.applicationId = data.applicationId;
            _this.applicationSecret = data.applicationSecret;
            _this.clientId = data.clientId;
            _this.userId = data.userId;
            _this.deviceId = data.deviceId;
            logger.obj('joined', data);
            _this.emit('joined', data);
        });
        this.socket.on('sync', function (data) {
            if (data && data.body && data.body.type === "image"
                && data.body.message && data.body.message[0]
                && data.body.message[0].imageUrl) {
                _this.getImageUrl(data.body.message[0].imageUrl, data.body.message[0].imageType)
                    .then(function (url) {
                    data.body.message[0].url = url;
                    logger.obj('sync', data);
                    _this.emit('sync', data);
                });
            }
            else {
                logger.obj('sync', data);
                _this.emit('sync', data);
            }
        });
        this.socket.on('sync-system-command', function (data) {
            logger.obj('sync-system-command', data);
            _this.emit('sync-system-command', data);
        });
        this.socket.on('sync-command', function (data) {
            logger.obj('sync-command', data);
            _this.emit('sync-command', data);
        });
        this.socket.on('message', function (data) {
            if (data && data.body && data.body.type === "image"
                && data.body.messages && data.body.messages[0]
                && data.body.messages[0].imageUrl) {
                _this.getImageUrl(data.body.messages[0].imageUrl, data.body.messages[0].imageType)
                    .then(function (url) {
                    data.body.messages[0].url = url;
                    logger.obj('message', data);
                    _this.emit('message', data);
                });
            }
            else {
                logger.obj('message', data);
                _this.emit('message', data);
            }
        });
        this.socket.on('operator-command', function (data) {
            logger.obj('operator-command', data);
            _this.emit('operator-command', data);
        });
        this.socket.on('system-message', function (data) {
            logger.obj('system-message', data);
            _this.emit('system-message', data);
        });
        this.socket.on('logs', function (data) {
            logger.obj('logs', data);
            _this.emit('logs', data);
        });
    };
    MinaraiClient.prototype.send = function (uttr, options) {
        options = Object.assign({}, { lang: 'ja-JP' }, options || {});
        var timestamp = new Date().getTime();
        var payload = {
            id: "" + this.applicationId + this.clientId + this.userId + this.deviceId + "-" + timestamp,
            head: {
                applicationId: this.applicationId,
                applicationSecret: this.applicationSecret,
                clientId: this.clientId,
                userId: this.userId,
                deviceId: this.deviceId,
                lang: options.lang || 'ja-JP',
                timestampUnixTime: timestamp,
            },
            body: {
                message: uttr,
                position: options.position || {},
                extra: options.extra || {},
            },
        };
        logger.obj('send', payload);
        this.socket.emit('message', payload);
    };
    MinaraiClient.prototype.sendSystemCommand = function (command, payload) {
        logger.warn('This method (sendSystemCommand) is deprecated. Please use "sendCommand" instead.');
        var message = { command: command, payload: payload };
        var timestamp = new Date().getTime();
        var payload = {
            id: "" + this.applicationId + this.clientId + this.userId + this.deviceId + "-" + timestamp + "-system",
            head: {
                applicationId: this.applicationId,
                applicationSecret: this.applicationSecret,
                clientId: this.clientId,
                userId: this.userId,
                deviceId: this.deviceId,
            },
            body: { message: message },
        };
        logger.obj('send-system-command', payload);
        this.socket.emit('system-command', payload);
    };
    MinaraiClient.prototype.sendCommand = function (name, extra) {
        var timestamp = new Date().getTime();
        var payload = {
            id: "" + this.applicationId + this.clientId + this.userId + this.deviceId + "-" + timestamp + "-command",
            head: {
                applicationId: this.applicationId,
                applicationSecret: this.applicationSecret,
                clientId: this.clientId,
                userId: this.userId,
                deviceId: this.deviceId,
            },
            body: { name, extra },
        };
        logger.obj('send-command', payload);
        this.socket.emit('command', payload);
    };
    MinaraiClient.prototype.getLogs = function (options) {
        if (options === void 0) { options = {}; }
        var timestamp = new Date().getTime();
        var payload = {
            id: "" + this.applicationId + this.clientId + this.userId + this.deviceId + "-" + timestamp + "-logs",
            head: {
                applicationId: this.applicationId,
                applicationSecret: this.applicationSecret,
                clientId: this.clientId,
                userId: this.userId,
                deviceId: this.deviceId,
                timestampUnixTime: timestamp,
            },
            body: options,
        };
        logger.obj('logs', payload);
        this.socket.emit('logs', payload);
    };
    MinaraiClient.prototype.forceDisconnect = function () {
        logger.obj('force-disconnect');
        this.socket.emit('force-disconnect');
    };
    MinaraiClient.prototype.uploadImage = function (file, opts) {
        if (!this.imageUrl) {
            throw new TypeError("`imageUrl` is needed to upload image.");
        }
        var form = new FormData();
        form.append("applicationId", this.applicationId);
        form.append("clientId", this.clientId);
        form.append("userId", this.userId);
        form.append("deviceId", this.deviceId);
        form.append('file', file, file.name);
        if (opts && opts.extra) {
            form.append("params", JSON.stringify(opts.extra));
        }
        return axios.post(this.imageUrl, form)
            .then(function (res) {
            var url = res.data.url;
            if (!url) {
                return { "error": "url dose not exist" };
            }
            return (_a = { ok: true }, _a[res.data.message === "ok" ? "result" : "error"] = { url }, _a);
            var _a;
        })
            .catch(function (err) {
            return { err };
        });
    };
    MinaraiClient.prototype.getImageUrl = function (url, type) {
        if (this.getImageByHeader) {
            return axios.get(url, {
                headers: {
                    'X-Minarai-Application-Id': this.applicationId,
                    'X-Minarai-Application-Secret': this.applicationSecret,
                    'X-Minarai-User-Id': this.userId
                },
                responseType: 'arraybuffer'
            })
                .then(function (response) {
                return "data:" + type + ";base64," + new Buffer(response.data, 'binary').toString('base64');
            });
        }
        else {
            var query = querystring.stringify({
                applicationId: this.applicationId,
                userId: this.userId
            });
            return Promise.resolve(url + ("?" + query));
        }
    };
    return MinaraiClient;
}(EventEmitter2.EventEmitter2));
var InvalidArgumentError = (function (_super) {
    __extends(InvalidArgumentError, _super);
    function InvalidArgumentError() {
        _super.apply(this, arguments);
    }
    return InvalidArgumentError;
}(Error));

exports['default'] = MinaraiClient;
exports.InvalidArgumentError = InvalidArgumentError;
