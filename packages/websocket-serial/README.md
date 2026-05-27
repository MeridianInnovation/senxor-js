# @senxor/websocket-serial

`@senxor/websocket-serial` is the browser WebSocket serial transport for Senxor.js. It connects to Senxor devices exposed over WebSocket (serial protocol forwarded over the network) and returns a `Senxor` instance from `@senxor/core`.

Use this package together with `@senxor/core` in **browser** environments.

## Installation

```bash
pnpm add @senxor/core @senxor/websocket-serial
```

## Quick start

```ts
import { createWebsocketSerialSenxor } from "@senxor/websocket-serial";
import { nomalizeSenxorData, applyColorMap } from "@senxor/core";

async function connectAndStart() {
  const senxor = createWebsocketSerialSenxor("192.168.1.100");

  await senxor.open();

  senxor.onError((error) => {
    console.error("Senxor error:", error);
  });

  senxor.onData((data) => {
    const normalized = nomalizeSenxorData(data);
    const image = applyColorMap(normalized, "rainbow2");
    console.log(image.length);
  });

  await senxor.startStreaming();
}
```

## API

### `createWebsocketSerialSenxor(host, port?, path?, secure?)`

Creates a `Senxor` instance bound to the given WebSocket endpoint. Does not open the connection until you call `senxor.open()`.

**Parameters:**
- `host` (string): The host address
- `port` (number, optional): The WebSocket port (default: 80 for ws, 443 for wss)
- `path` (string, optional): The WebSocket path (default: "/ws")
- `secure` (boolean, optional): Use secure WebSocket (wss://) (default: false)

## Environment requirements

- A browser with WebSocket support
- Reachable WebSocket endpoint that speaks the Senxor serial protocol

## License

Apache-2.0
