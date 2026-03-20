# @senxor/serial-core

Shared serial transport layer for Senxor.js. Official packages `@senxor/web-serial` and `@senxor/capacitor-serial` build on this module so the same framing, parsing, and register commands work everywhere.

Most applications should depend on a concrete transport (Web Serial or Capacitor) instead of this package. Use `@senxor/serial-core` when you need to plug Senxor into a new runtime by implementing a thin adapter around your serial API.

## What you get

- **`SerialTransportBase`** – Wraps any port that implements **`ISerialPort`** and exposes `@senxor/core`'s transport contract (`open` / `close`, register read/write, streaming callbacks). Pass the result into `new Senxor(transport)` from `@senxor/core`.
- **`ISerialPort`**, **`SerialDeviceInfo`**, **`SerialOptions`** – The minimal port surface your adapter must provide (open/close, `write`, event-style `on` for `data`, `error`, `open`, `close`, `disconnect`).
- **`senxorPortOptions`** – Default serial settings (115200 8N1) used when opening a port for Senxor.
- **`isSenxorDevice`** – Returns whether USB vendor/product IDs match a known Senxor product (same check the official transports use when listing devices).
- **`CommandSender`** – Lower-level helper for sending framed commands and matching ACKs; mainly useful if you extend or debug serial behavior rather than typical app code.
- **`utils`** – Small helpers such as **`toHexString`**, **`decodeUint8Array`**, shared with protocol tooling.

## Installation

```bash
pnpm add @senxor/core @senxor/serial-core
```

You still need a real serial backend (browser Web Serial, Capacitor plugin, Node serial library, etc.) that you wrap with `ISerialPort`.

## Development (this repository)

From the monorepo root:

```bash
pnpm install
pnpm test --filter @senxor/serial-core
pnpm build --filter @senxor/serial-core
```

For how `Senxor` consumes a transport after you wire one up, see `packages/core/README.md` and an official transport package for a full example.
