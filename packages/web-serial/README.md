# @senxor/web-serial

`@senxor/web-serial` is the Web Serial transport for Senxor.js. It lets you discover and connect Senxor devices directly from a browser that supports the Web Serial API, and gives you ready-to-use `Senxor` instances from `@senxor/core`.

Use this package together with `@senxor/core` to control the device, manage registers and fields, and process frames into normalized data and images.

## Installation

```bash
pnpm add @senxor/core @senxor/web-serial
```

`@senxor/core` provides the `Senxor` device controller and processing helpers, while `@senxor/web-serial` handles Web Serial device discovery and connection.

## Environment requirements

To use Web Serial you need:

- A browser that supports the Web Serial API (for example, recent versions of Chromium-based browsers).
- A secure context (https:// or http://localhost).
- A user gesture (such as a button click) before requesting device access.

## Quick start

The simplest way to connect to a Senxor device is by using `requestWebSerialSenxor`, which shows the browser's device picker and returns a `Senxor` instance when the user selects a compatible device.

```ts
import { requestWebSerialSenxor } from "@senxor/web-serial";
import {
  nomalizeSenxorData,
  applyColorMap,
  type SenxorData,
} from "@senxor/core";

async function connectAndStart() {
  const senxor = await requestWebSerialSenxor();
  if (!senxor) {
    // User cancelled the device picker
    return;
  }

  await senxor.open();

  senxor.onError((error) => {
    console.error("Senxor error:", error);
  });

  senxor.onData((data: SenxorData) => {
    const normalized = nomalizeSenxorData(data);
    const image = applyColorMap(normalized, "rainbow2");
    // Draw `image` onto a canvas or process it further
  });

  await senxor.startStreaming();
}
```

Once you have a `Senxor` instance, refer to the `@senxor/core` README for details on what you can do with it, including register/field access and additional processing helpers.

## API

### `listWebSerialSenxors()`

```ts
import { listWebSerialSenxors } from "@senxor/web-serial";

const devices = await listWebSerialSenxors();
```

Returns an array of `Senxor` instances for Senxor serial ports this page already has permission to use (for example, devices the user picked in an earlier session). No device picker is shown. Typical use is to reconnect on startup without asking for access again; call `open()` on each instance when you are ready to talk to the device.

### `requestWebSerialSenxor()`

```ts
import { requestWebSerialSenxor } from "@senxor/web-serial";

const senxor = await requestWebSerialSenxor();
if (!senxor) {
  // User cancelled the device picker
}
```

Opens the browser's device picker limited to Senxor devices. Returns a `Senxor` bound to the chosen port, or `null` if the user cancels. This is the recommended entry point for most applications.

### `onWebSerialSenxorConnect(listener)`

```ts
import { onWebSerialSenxorConnect } from "@senxor/web-serial";

const unsubscribe = onWebSerialSenxorConnect((senxor) => {
  // A new Senxor device has been connected
});

// Later, to stop listening:
unsubscribe();
```

Registers a listener that is called whenever a new Senxor device is connected while your page is open. For each compatible device, the listener receives a `Senxor` instance that you can open and start streaming from.

The function returns an unsubscribe callback that removes the listener when called.

## Working with @senxor/core

`@senxor/web-serial` focuses on Web Serial device discovery and connection. After you obtain a `Senxor` instance from this package, you will typically:

- Use `open()`, `close()`, `startStreaming()`, and `stopStreaming()` to control the device session.
- Subscribe to `onData` and `onError` to receive frames and handle failures.
- Use processors from `@senxor/core` (such as `nomalizeSenxorData`, `createGrayScaleImageData`, and `applyColorMap`) to normalize and visualize frames.

For a detailed description of the `Senxor` API, available processors, and error types, see the `@senxor/core` README.

## Examples

This repository includes a Web Serial example application that demonstrates how to:

- Discover Senxor devices in the browser.
- Connect to a device and start streaming.
- Convert frames into images and display them.

Look for the `examples/web-serial` directory in the Senxor.js repository for a complete, runnable example built on top of `@senxor/web-serial` and `@senxor/core`.

