# @senxor/serial-core

Shared byte transport layer for Senxor.js. Serial and network packages build on this module so the same framing, parsing, and register commands work across runtimes.

Most applications should depend on a concrete transport. Use `@senxor/serial-core` to adapt a byte-oriented connection or serial API to Senxor.

## What you get

- **`IBytePort<TDeviceInfo extends object = object>`** – A byte connection with device information, open/close, `write`, and event-style `on` for `data`, `error`, `open`, `close`, and `disconnect`. Each `on` call returns an unsubscribe function.
- **`ByteTransport(port)`** – Wraps an `IBytePort` and exposes the `@senxor/core` transport contract. Its `open()` calls the port's `open()` without serial options.
- **`ISerialPort`**, **`SerialDeviceInfo`**, **`SerialOptions`** – The serial port interface, USB vendor/product information, and serial settings. `ISerialPort` extends `IBytePort` with an optional serial options argument to `open`.
- **`SerialTransportBase`** – Wraps an `ISerialPort` and opens it with `senxorPortOptions`.
- **`PortEmitter`** – Shared event emitter for port adapters.
- **`senxorPortOptions`** – Default serial settings (115200 8N1) used when opening a port for Senxor.
- **`isSenxorDevice`** – Returns whether USB vendor/product IDs match a known Senxor product (same check the official transports use when listing devices).
- **`CommandSender`** – Lower-level helper for sending framed commands and matching ACKs; mainly useful if you extend or debug serial behavior rather than typical app code.
- **`utils`** – Small helpers such as **`toHexString`**, **`decodeUint8Array`**, shared with protocol tooling.

## Installation

```bash
pnpm add @senxor/core @senxor/serial-core
```

You still need a backend for your connection. For example, the Node TCP package provides a port that can be wrapped directly:

```ts
import { Senxor } from "@senxor/core";
import { ByteTransport } from "@senxor/serial-core";
import { TcpSocketPort } from "@senxor/tcpip-serial-node";

const port = new TcpSocketPort("192.168.1.100", 3333);
const senxor = new Senxor(new ByteTransport(port));
await senxor.open();
```

Install `@senxor/tcpip-serial-node` to use this example. For USB serial adapters, implement `ISerialPort` and use `SerialTransportBase` to retain the default 115200 8N1 settings.

The TCP and WebSocket factory names and parameters are unchanged. Their return types now use `ByteTransport` instead of `SerialTransportBase`; update explicit return type annotations accordingly.

## Development (this repository)

From the monorepo root:

```bash
pnpm install
pnpm test --filter @senxor/serial-core
pnpm build --filter @senxor/serial-core
```

For how `Senxor` consumes a transport after you wire one up, see `packages/core/README.md` and an official transport package for a full example.
