# Senxor.js

Senxor.js is a TypeScript/JavaScript SDK for communicating with Meridian Innovation's Senxor thermal imaging devices.  
It provides a small set of packages that separate core protocol and processing logic from transport implementations so you can use the same high-level API across different environments.

- `@senxor/core`: core protocol, Senxor class, processors, and error types.
- `@senxor/web-serial`: browser transport using the Web Serial API.
- `@senxor/capacitor-serial`: transport for Capacitor apps (for example, Android).
- `@senxor/serial-core`: internal/shared serial transport core for building new transports.

GitHub: https://github.com/MeridianInnovation/senxor-js

## Packages Overview

### `@senxor/core`

Core SDK that defines:

- The `Senxor` class for controlling a device session (start/stop, reading data, lifecycle management).
- Processing helpers (processors) for working with Senxor data.
- Error types and utilities.

You normally use this together with one of the transport packages (Web Serial or Capacitor). See the `@senxor/core` [README](packages/core/README.md) for details on the `Senxor` API, processors, and error handling.

### `@senxor/web-serial`

Browser-only transport that uses the Web Serial API to talk to Senxor devices from a web page.

- Runs in modern browsers that support `navigator.serial` (for example, Chromium-based browsers).
- Lets you list available serial devices, request access from the user, and work with a `Senxor` instance for each connected device.

Typical usage:

1. Install `@senxor/core` and `@senxor/web-serial`.
2. Use `@senxor/web-serial` to request and select a Senxor device and then use the `Senxor` instance it gives you.

See the `@senxor/web-serial` [README](packages/web-serial/README.md) for concrete usage examples and environment requirements.

### `@senxor/capacitor-serial`

Transport for Capacitor apps, for example an Android app using a WebView.

- Relies on a Capacitor serial plugin to access serial ports from the native side.
- Exposes helpers to list and connect to Senxor devices from your Capacitor app and gives you a `Senxor` instance for each connection.

See the `@senxor/capacitor-serial` [README](packages/capacitor-serial/README.md) for setup steps in a Capacitor project and usage examples.

### `@senxor/serial-core` (internal / advanced)

Shared, environment-agnostic serial transport core used by both Web Serial and Capacitor transports.

- Provides abstractions like `SerialTransportBase`, `ISerialPort`, and shared types/utilities for Senxor serial communication.
- Intended for advanced users who want to implement custom transports, for example for Node.js or custom gateways.

Most end users do not need to depend on this package directly. See the `@senxor/serial-core` [README](packages/serial-core/README.md) if you are building a new transport.

## Installation

Senxor.js is published as multiple packages on npm. You install only what you need for your environment.

### Browser (Web Serial)

```bash
pnpm add @senxor/core @senxor/web-serial
```

### Capacitor (for example Android)

```bash
pnpm add @senxor/core @senxor/capacitor-serial
# plus the required Capacitor serial plugin (see that plugin's documentation)
```

## Repository Structure

This repository is a pnpm workspace:

- `packages/core` – `@senxor/core`
- `packages/web-serial` – `@senxor/web-serial`
- `packages/capacitor-serial` – `@senxor/capacitor-serial`
- `packages/serial-core` – `@senxor/serial-core`
- `examples/web-serial` – Vite example app using `@senxor/web-serial`
- `examples/capacitor-serial` – Vite plus Capacitor example app using `@senxor/capacitor-serial`

## Development (monorepo)

If you are developing inside this repository:

- Install dependencies:

  ```bash
  pnpm install
  ```

- Build all packages and examples:

  ```bash
  pnpm build
  ```

- Run tests:

  ```bash
  pnpm test
  ```

- Type-check:

  ```bash
  pnpm typecheck
  ```

- Lint:

  ```bash
  pnpm lint
  ```

For package-specific commands, for example only `@senxor/core`, you can use pnpm filters, for example:

```bash
pnpm test --filter @senxor/core
```

## Next Steps

- For device control, processors, and error handling: see `packages/core/README.md`.
- For browser-based usage: see `packages/web-serial/README.md`.
- For Capacitor-based usage: see `packages/capacitor-serial/README.md`.
- For implementing custom transports: see `packages/serial-core/README.md`.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
