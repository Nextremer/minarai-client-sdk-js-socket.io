'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var red = 'color: red;';
var green = 'color: green;';
var yellow = 'color: yellow;';
var cyan = 'color: cyan;';
var reset = '';
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
        console.log("%c[DEBUG]%c " + t, cyan, reset);
    };
    Logger.prototype.info = function (t) {
        if (!this.isSetup) {
            this.loggerWarning();
        }
        if (this.silentMode) {
            return;
        }
        console.log("%c[INFO]%c " + t, green, reset);
    };
    Logger.prototype.error = function (t) {
        if (!this.isSetup) {
            this.loggerWarning();
        }
        console.error("%c[ERROR]%c " + t, red, reset);
    };
    Logger.prototype.warn = function (t) {
        if (!this.isSetup) {
            this.loggerWarning();
        }
        console.error("%c[WARN]%c " + t, yellow, reset);
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
        console.groupCollapsed("%c[DEBUG]%c " + t, cyan, reset);
        console.log(obj);
        console.groupEnd();
    };
    Logger.prototype.loggerWarning = function () {
        console.warn("%c[WARN]%c logger has not been set up. call \"set()\" method", yellow, reset);
    };
    return Logger;
}());
var logger = new Logger();

var EventEmitter2 = require('eventemitter2');
var MinaraiClient = (function (_super) {
    __extends(MinaraiClient, _super);
    function MinaraiClient(opts) {
        _super.call(this);
        if (!opts.io || !opts.socketIORootURL || !opts.applicationId) {
            throw new InvalidArgumentError("opts must contain io, socketIORootURL, and applicationId");
        }
        this.socket = opts.io.connect(opts.socketIORootURL, opts.socketIOOptions);
        this.applicationId = opts.applicationId;
        this.clientId = opts.clientId;
        this.userId = opts.userId;
        this.deviseId = opts.deviseId || "devise_id_" + this.applicationId + "_" + new Date().getTime();
        this.lang = opts.lang || 'ja';
        logger.set({ debug: opts.debug, silent: opts.silent });
    }
    MinaraiClient.prototype.init = function () {
        var _this = this;
        this.socket.on('connect', function () {
            logger.debug('connect');
            _this.emit('connect');
            _this.socket.emit('join-as-client', {
                applicationId: _this.applicationId,
                clientId: _this.clientId,
                userId: _this.userId,
                deviseId: _this.deviseId,
            });
        });
        this.socket.on('disconnect', function () {
            logger.debug('disconnect');
            _this.emit('disconnected');
        });
        this.socket.on('joined', function (data) {
            _this.applicationId = data.applicationId;
            _this.clientId = data.clientId;
            _this.userId = data.userId;
            _this.deviseId = data.deviseId;
            logger.obj('joined', data);
            _this.emit('joined', data);
        });
        this.socket.on('sync', function (data) {
            logger.obj('sync', data);
            _this.emit('sync', data);
        });
        this.socket.on('sync-system-command', function (data) {
            logger.obj('sync-system-command', data);
            _this.emit('sync-system-command', data);
        });
        this.socket.on('message', function (data) {
            logger.obj('message', data);
            _this.emit('message', data);
        });
        this.socket.on('operator-command', function (data) {
            logger.obj('operator-command', data);
            _this.emit('operator-command', data);
        });
        this.socket.on('system-message', function (data) {
            logger.obj('system-message', data);
            _this.emit('system-message', data);
        });
    };
    MinaraiClient.prototype.send = function (uttr, options) {
        options = Object.assign({}, { lang: 'ja-JP' }, options || {});
        var timestamp = new Date().getTime();
        var payload = {
            id: "" + this.applicationId + this.clientId + this.userId + this.deviseId + "-" + timestamp,
            head: {
                applicationId: this.applicationId,
                clientId: this.clientId,
                userId: this.userId,
                deviseId: this.deviseId,
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
        var message = { command: command, payload: payload };
        var timestamp = new Date().getTime();
        var payload = {
            id: "" + this.applicationId + this.clientId + this.userId + this.deviseId + "-" + timestamp + "-system",
            head: {
                applicationId: this.applicationId,
                clientId: this.clientId,
                userId: this.userId,
                deviseId: this.deviseId,
            },
            body: { message: message },
        };
        logger.obj('send-system-command', payload);
        this.socket.emit('system-command', payload);
    };
    MinaraiClient.prototype.forceDisconnect = function () {
        logger.obj('force-disconnect');
        this.socket.emit('force-disconnect');
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
