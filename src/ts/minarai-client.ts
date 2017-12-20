const EventEmitter2 = require('eventemitter2');
const axios = require('axios');
const querystring = require('querystring');
import logger from './logger';

const CONNECTOR_URL = "https://socketio-connector.minarai.cloud";
const DEFAULT_API_VERSION = "v1";

const yellow = '\u001b[33m';
const reset = '\u001b[0m';

export interface MinaraiClientConstructorOptions {
  io: any;
  lang: string;
  socketIORootURL: string;
  apiVersion: string;
  socketIOOptions: any;
  applicationId: string;
  applicationSecret:string;
  clientId?: string;
  userId?: string;
  deviceId?: string;
  debug?: boolean;
  silent?: boolean;
  getImageByHeader: boolean;
}

export interface SendOptions {
  lang?: string;
  position?: string;
  extra?: string;
}

export interface IGetLogsOptions {
  ltDate?: string;
  limit?: number;
}

export default class MinaraiClient extends EventEmitter2.EventEmitter2 {
  private socket: any;
  private applicationId: string;
  private applicationSecret:string;
  private clientId: string|number;
  private userId: string|number;
  private deviceId: string|number;
  private lang: string|number;

  constructor(opts: MinaraiClientConstructorOptions) {
    super();

    if (!opts.io || !opts.applicationId) {
      throw new InvalidArgumentError("opts must contain io and applicationId");
    }

    if (!opts.applicationSecret) {
        // throw new InvalidArgumentError("opts must contain io and applicationSecret");
        console.warn(yellow + '[warn]You had better use applicationSecret' + reset);
    }

    const socketIORootURL = opts.socketIORootURL || CONNECTOR_URL;
    const apiVersion = opts.apiVersion || DEFAULT_API_VERSION;
    const socketIOOptions = {
      path: `/socket.io/${apiVersion}`,
      transports: [ "websocket" ]
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
    this.deviceId = opts.deviceId || `device_id_${this.applicationId}_${new Date().getTime()}`;
    this.lang = opts.lang || 'ja-JP';
    this.imageUrl = `${socketIORootURL.replace(/\/$/, '')}/${apiVersion}/upload-image`;
    this.getImageByHeader = opts.getImageByHeader;

    logger.set({debug: opts.debug, silent: opts.silent});
  }

  init() {
    this.socket.on('connect', () => {
      logger.debug('connect');
      this.emit('connect');

      this.socket.emit('join-as-client', {
        applicationId: this.applicationId,
        applicationSecret: this.applicationSecret,
        clientId: this.clientId,
        userId: this.userId,
        deviceId: this.deviceId,
      });
    });

    this.socket.on('disconnect', () => {
      logger.debug('disconnect');
      this.emit('disconnected');
    });

    this.socket.on('joined', (data: any) => {
      this.applicationId = data.applicationId;
      this.applicationSecret = data.applicationSecret;
      this.clientId = data.clientId;
      this.userId = data.userId;
      this.deviceId = data.deviceId;

      logger.obj('joined', data);
      this.emit('joined', data);
    });

    this.socket.on('sync', (data:any) => {
      if (data && data.body && data.body.type === "image"
          && data.body.message && data.body.message
          && data.body.message.imageUrl) {
        this.getImageUrl(data.body.message.imageUrl, data.body.message.imageType)
        .then((url) => {
          data.body.message.url = url;
          logger.obj('sync', data);
          this.emit('sync', data);
        });
      } else {
        logger.obj('sync', data);
        this.emit('sync', data);
      }
    });

    this.socket.on('sync-system-command', (data:any) => {
      logger.obj('sync-system-command', data);
      this.emit('sync-system-command', data);
    });

    this.socket.on('sync-command', (data:any) => {
      logger.obj('sync-command', data);
      this.emit('sync-command', data);
    });

    this.socket.on('message', (data:any) => {
      if (data && data.body && data.body.type === "image"
          && data.body.messages && data.body.messages[0]
          && data.body.messages[0].imageUrl) {
        this.getImageUrl(data.body.messages[0].imageUrl, data.body.messages[0].imageType)
        .then((url) => {
          data.body.messages[0].url = url;
          logger.obj('message', data);
          this.emit('message', data);
        });
      } else {
        logger.obj('message', data);
        this.emit('message', data);
      }
    });

    this.socket.on('operator-command', (data:any) => {
      logger.obj('operator-command', data);
      this.emit('operator-command', data);
    });

    this.socket.on('system-message', (data:any) => {
      logger.obj('system-message', data);
      this.emit('system-message', data);
    });

    this.socket.on('logs', (data: any) => {
      logger.obj('logs', data);
      this.emit('logs', data);
    });

    this.socket.on('minarai-error', (data: any) => {
      logger.error(data);
      this.emit('error', data);
    });
  }

  public send(uttr, options?: SendOptions) {
    options = Object.assign({}, { lang: 'ja-JP' }, options || {});
    const timestamp = new Date().getTime();
    const payload = {
      id: `${this.applicationId}${this.clientId}${this.userId}${this.deviceId}-${timestamp}`,
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
  }

  public sendSystemCommand(command, payload) {
    logger.warn('This method (sendSystemCommand) is deprecated. Please use "sendCommand" instead.');
    const message = { command: command, payload: payload };
    const timestamp = new Date().getTime();
    const payload = {
      id: `${this.applicationId}${this.clientId}${this.userId}${this.deviceId}-${timestamp}-system`,
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
  }

  public sendCommand(name, extra) {
    const timestamp = new Date().getTime();
    const payload = {
      id: `${this.applicationId}${this.clientId}${this.userId}${this.deviceId}-${timestamp}-command`,
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
  }

  public getLogs(options: IGetLogsOptions = {}) {
    const timestamp = new Date().getTime();
    const payload = {
      id: `${this.applicationId}${this.clientId}${this.userId}${this.deviceId}-${timestamp}-logs`,
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
  }

  public forceDisconnect() {
    logger.obj('force-disconnect');
    this.socket.emit('force-disconnect');
  }

  public uploadImage(file: File, opts?: SendOptions) {
    if (!this.imageUrl) {
      throw new TypeError("`imageUrl` is needed to upload image.");
    }

    const form = new FormData();
    form.append("applicationId", this.applicationId);
    form.append("applicationSecret", this.applicationSecret);
    form.append("clientId", this.clientId);
    form.append("userId", this.userId);
    form.append("deviceId", this.deviceId);
    form.append( 'file', file, file.name );

    if (opts && opts.extra) {
      form.append("params", JSON.stringify(opts.extra));
    }

    return axios.post(this.imageUrl, form)
      .then((res) => {
        let {url} = res.data;

        if (!url) {
          return { "error": "url dose not exist" };
        }

        return { ok: true, [res.data.message === "ok" ? "result" : "error"]: { url } };
      })
      .catch((err) => {
        return { err };
      })
  }

  public getImageUrl(url: string, type: string) {
    if (this.getImageByHeader) {
      return axios.get(url, {
        headers: {
          'X-Minarai-Application-Id': this.applicationId,
          'X-Minarai-Application-Secret': this.applicationSecret,
          'X-Minarai-User-Id': this.userId
        },
        responseType: 'arraybuffer'
      })
      .then((response) => {
        return `data:${type};base64,${new Buffer(response.data, 'binary').toString('base64')}`;
      });
    } else {
      const query = querystring.stringify({
        applicationId: this.applicationId,
        userId: this.userId
      });
      return Promise.resolve(url + `?${query}`);
    }
  }
}

export class InvalidArgumentError extends Error {
}
