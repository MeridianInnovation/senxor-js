# @senxor/tcpip-serial-node

`@senxor/tcpip-serial-node` is the Node.js TCP/IP serial transport for Senxor.js. It connects to Senxor devices exposed as a TCP socket (serial protocol forwarded over the network) and returns a `Senxor` instance from `@senxor/core`.

Use this package together with `@senxor/core` in **Node.js** environments.

## Installation

```bash
pnpm add @senxor/core @senxor/tcpip-serial-node
```

## Quick start

```ts
import { createTcpIpSerialSenxor } from "@senxor/tcpip-serial-node";
import { nomalizeSenxorData, applyColorMap } from "@senxor/core";

async function connectAndStart() {
  const senxor = createTcpIpSerialSenxor("192.168.1.100", 3333);

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

### `createTcpIpSerialSenxor(host, port)`

Creates a `Senxor` instance bound to the given TCP endpoint. Does not open the connection until you call `senxor.open()`.

## Environment requirements

- Node.js with the built-in `node:net` module
- Reachable TCP endpoint that speaks the Senxor serial protocol

## Development (this repository)

From the monorepo root:

```bash
pnpm install
pnpm test --filter @senxor/tcpip-serial-node
pnpm build --filter @senxor/tcpip-serial-node
```
