minarai client SDK (for JavaScript/Socket.io)
====

## Description
A SDK that enables you to connect minarai easily on Node.js, browser both.


## Requirement
* [socket.io-client](https://github.com/socketio/socket.io-client)
* [rollup](https://github.com/rollup/rollup)
* [EventEmitter2](https://github.com/asyncly/EventEmitter2)

## Install
Using npm:
```sh
npm install -S minarai-client-sdk-js-socket.io
```

Using yarn:
```sh
yarn add minarai-client-sdk-js-socket.io
```

## Usage
```js
import io from 'socket.io-client';
import MinaraiClient from 'minarai-client-sdk-js-socket-io';

const minaraiClient = new MinaraiClient({
  io: io, /* Socket.io object */
  applicationId: this.state.connectionInfo.applicationId, /* application's id you want to connect */
  clientId: this.state.connectionInfo.clientId,
  userId: this.state.connectionInfo.userId,
  deviceId: this.state.connectionInfo.deviceId,
});

minaraiClient.init();

// binding events
minaraiClient.on('connect', function(){
  console.log("## socket.io connected. trying to join as minarai client");
});
minaraiClient.on('joined', function(){
  console.log("## minarai CONNECTED");
});
minaraiClient.on( "message", function( data ){
  console.log("recieve message");
  console.log(data)
});
minaraiClient.on( "error", function( err ){
  console.log("minarai client error");
  console.log(err);
});

// send message "hello" to dialogue-hub every 3 seconds
setInterval( function(){
  minaraiClient.send("hello");
}, 3000 );
```

## references
### constructor options
 * io: socket.io object
 * lang: language option ( default: "ja-JP" )
 * socketIORootURL: root url of minarai Socket.IO Connector ( default: "https://socketio-connector.minarai.cloud" )
 * socketIOOptions: options for io.connect method (ex) {}
 * apiVersion: api version of minarai Socket.IO Connector ( default: "v1" )
 * applicationId: application id to connect
 * clientId: clientId
 * userId: userId
 * deviceId: deviceId
 * debug : set true to show debug logs
 * slient : set true value to hide all the logs

### methods
 * **send**: send message to minarai
   * arguments
     * uttr: string: message to send
     * options :
       * lang: string: language option. ex: 'ja-JP'
       * extra: any: you can pass extra info to minarai.
 * sendSystemCommand: send system command to minarai
   * arguments
     * command: string
     * payload: any

```js
cli.send('hello', { lang: 'ja-JP', extra: {} });
cli.sendSystemCommand('happyEmotionDetected', { value: true });
```

### events
 * **connect**: when connected to minarai successfully
 * **joined**: when signed in to minarai as client successfully
 * **disconnected**: when disconnected to minarai successfully
 * **sync**: when you or your group send message to minarai(for sync message between multiple devices)
 * **sync-system-command**: when you or your group send system command to minarai(for sync system command between multiple devices)
 * **message**: when minarai send any event
