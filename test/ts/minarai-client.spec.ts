const EventEmitter2 = require('eventemitter2');
import MinaraiClient from '../../src/ts/minarai-client';
import * as chai from 'chai';
import { spy } from 'sinon';
import * as sinonChai from 'sinon-chai';
chai.use(sinonChai);
const { expect } = chai;

class SocketIO extends EventEmitter2.EventEmitter2 {
  static connect(url, opts) {
    return new SocketIO(url, opts);
  }
}

const constructorOptions = {
  io: SocketIO,
  lang: 'ja-JP',
  socketIORootURL: 'ws://localhost/ws',
  socketIOOptions: [],
  applicationId: 'app_id_test',
  applicationSecret: 'app_secret_test',
  clientId: 'client_id_test',
  userId: 'user_id_test',
  deviceId: 'devise_id_test',
  debug: false,
  silent: false,
};

describe('MinaraiClient', () => {
  describe('#constructor', () => {
    describe('with full options', () => {
      let cli;
      beforeEach(() => {
        cli = new MinaraiClient(constructorOptions);
      });
      it('expect to create instance', () => {
        expect(cli).to.exist;
      });
      it('expect to set ids', () => {
        expect(cli.applicationId).to.equal(constructorOptions.applicationId);
        expect(cli.applicationSecret).to.equal(constructorOptions.applicationSecret);
        expect(cli.clientId).to.equal(constructorOptions.clientId);
        expect(cli.userId).to.equal(constructorOptions.userId);
        expect(cli.deviceId).to.equal(constructorOptions.deviceId);
      });
    });

    describe('without minimum options', () => {
      let cli;
      beforeEach(() => {
        cli = new MinaraiClient({
          ...constructorOptions,
          clientId: null,
          userId: null,
          deviceId: null,
          debug: null,
          silent: null,
        });
      });
      it('expect to create instance', () => {
        expect(cli).to.exist;
      });
      it('expect deviceId to be set automatically', () => {
        expect(cli.deviceId).to.match(new RegExp(`devise_id_${constructorOptions.applicationId}_\\d+`));
      });
    });

    describe('without required params', () => {
      it('expect to throw InvalidArgumentError', () => {
        expect(() => {
          new MinaraiClient({
            ...constructorOptions,
            io: null,
          })
        }).to.throw(MinaraiClient.InvalidArgumentError);
        expect(() => {
          new MinaraiClient({
            ...constructorOptions,
            socketIORootURL: null,
            applicationSecret: null,
          })
        }).to.throw(MinaraiClient.InvalidArgumentError);
        expect(() => {
          new MinaraiClient({
            ...constructorOptions,
            applicationId: null,
          })
        }).to.throw(MinaraiClient.InvalidArgumentError);
      });
    });
  });

  describe('#init', () => {
    let cli;
    let spySocketOn;
    beforeEach(() => {
      cli = new MinaraiClient(constructorOptions);
      spySocketOn = spy(cli.socket, 'on');
    });

    it('expect to bind events', () => {
      cli.init();
      expect(spySocketOn).to.have.calledWith('connect');
      expect(spySocketOn).to.have.calledWith('disconnect');
      expect(spySocketOn).to.have.calledWith('joined');
      expect(spySocketOn).to.have.calledWith('sync');
      expect(spySocketOn).to.have.calledWith('sync-system-command');
      expect(spySocketOn).to.have.calledWith('message');
    })
  });

  describe('#send', () => {
    let cli;
    let spySocketEmit;
    beforeEach(() => {
      cli = new MinaraiClient(constructorOptions);
      cli.init();
      spySocketEmit = spy(cli.socket, 'emit');
    });
    it('expect cli.ws.emit called with "message"', () => {
      cli.send('hoge');
      expect(spySocketEmit).to.have.been.calledOnce;
      expect(spySocketEmit).to.have.been.calledWith("message");
    });
  });

  describe('#sendSystemCommand', () => {
    let cli;
    let spySocketEmit;
    beforeEach(() => {
      cli = new MinaraiClient(constructorOptions);
      cli.init();
      spySocketEmit = spy(cli.socket, 'emit');
    });
    it('expect cli.ws.emit called with "system-command"', () => {
      cli.sendSystemCommand('hoge');
      expect(spySocketEmit).to.have.been.calledOnce;
      expect(spySocketEmit).to.have.been.calledWith("system-command");
    });
  });

  describe('WebSocket Events', () => {
    let cli;
    let spyEmit;
    let spySocketEmit;
    let data = { message: 'hoge' };
    beforeEach(() => {
      cli = new MinaraiClient(constructorOptions);
      cli.init();
      spyEmit = spy(cli, 'emit');
      spySocketEmit = spy(cli.socket, 'emit');
    });
    describe('on connect', () => {
      beforeEach(() => {
        cli.socket.emit('connect');
      });
      it('expect cli.emit called with "connect"', () => {
        expect(spyEmit).to.have.been.calledWith("connect");
      });
      it('expect cli.ws.emit called with "join-as-client"', () => {
        expect(spySocketEmit).to.have.been.calledWith("join-as-client");
      });
    });
    describe('on disconnect', () => {
      beforeEach(() => {
        cli.socket.emit('disconnect');
      });
      it('expect cli.emit called with "disconnected"', () => {
        expect(spyEmit).to.have.been.calledWith("disconnected");
      });
    });
    describe('on joined', () => {
      data = {
        applicationId: constructorOptions.applicationId,
        applicationSecret: constructorOptions.applicationSecret,
        clientId: constructorOptions.clientId,
        userId: constructorOptions.userId,
        deviceId: constructorOptions.deviceId,
      };
      beforeEach(() => {
        cli.socket.emit('joined', data);
      });
      it('expect cli.emit called with "joined"', () => {
        expect(spyEmit).to.have.been.calledWith("joined", data);
      });
    });
    describe('on sync', () => {
      beforeEach(() => {
        cli.socket.emit('sync', data);
      });
      it('expect cli.emit called with "sync"', () => {
        expect(spyEmit).to.have.been.calledWith("sync", data);
      });
    });
    describe('on sync-system-command', () => {
      beforeEach(() => {
        cli.socket.emit('sync-system-command', data);
      });
      it('expect cli.emit called with "sync-system-command"', () => {
        expect(spyEmit).to.have.been.calledWith("sync-system-command", data);
      });
    });
    describe('on message', () => {
      beforeEach(() => {
        cli.socket.emit('message', data);
      });
      it('expect cli.emit called with "message"', () => {
        expect(spyEmit).to.have.been.calledWith("message", data);
      });
    });
  });
});


