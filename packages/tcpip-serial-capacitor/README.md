# @senxor/tcpip-serial-capacitor

`@senxor/tcpip-serial-capacitor` is the Capacitor TCP/IP serial transport for Senxor.js. It connects to Senxor devices exposed as a TCP socket (serial protocol forwarded over the network) and returns a `Senxor` instance from `@senxor/core`.

Use this package together with `@senxor/core` in **Capacitor** mobile apps (Android and iOS). It is not supported on the web platform.

## Installation

In your Capacitor app project:

```bash
pnpm add @senxor/core @senxor/tcpip-serial-capacitor capacitor-tcp-socket
npx cap sync
```

## Quick start

```ts
import { createTcpIpSerialSenxor } from "@senxor/tcpip-serial-capacitor";
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

- Capacitor app with [capacitor-tcp-socket](https://github.com/gee1k/capacitor-tcp-socket) installed and synced
- Reachable TCP endpoint that speaks the Senxor serial protocol
- Network access on the device (for example `INTERNET` on Android)

## Development (this repository)

From the monorepo root:

```bash
pnpm install
pnpm test --filter @senxor/tcpip-serial-capacitor
pnpm build --filter @senxor/tcpip-serial-capacitor
```
