@senxor/core

The core protocol and processing layer for Senxor.js. This package provides the `Senxor` high-level device controller, frame processing helpers, error types, and protocol metadata that are used by all Senxor transports.

Most applications will use `@senxor/core` together with a transport package such as `@senxor/web-serial` or `@senxor/capacitor-serial`. Those transports create and manage the underlying connection and give you ready-to-use `Senxor` instances.

## Installation

```bash
pnpm add @senxor/core
```

In most real projects you will also install a transport:

- Browser (Web Serial): `pnpm add @senxor/core @senxor/web-serial`
- Capacitor (Android, etc.): `pnpm add @senxor/core @senxor/capacitor-serial`

## Overview

`@senxor/core` focuses on three main areas:

- `Senxor` class for managing a connected device session.
- Processing helpers in `processors` for turning raw frames into normalized data and images.
- Error types and protocol metadata (`error`, `FIELDS`, `REGISTERS`, `consts`, `types`) that describe and validate Senxor devices.

Transport packages are responsible for discovering devices and opening connections. Once you have a connected device from a transport, you work with it through the `Senxor` class and the processors provided here.

## Senxor class

The `Senxor` class represents a single connected Senxor device. It manages device state, streaming, register and field access, and delivers processed frames to your application.

Typical capabilities include:

- Connection lifecycle:
  - `open()` – open the device and load commonly used registers and fields.
  - `close()` – close the device and clear cached state.
- Streaming control:
  - `startStreaming()` – enable continuous frame streaming.
  - `stopStreaming()` – disable continuous frame streaming.
- Event-style callbacks:
  - `onData(listener: (data: SenxorData) => void, unit?: "C")` – receive Celsius frames; use `onData(listener, "dK")` to receive frames in 0.1 K units.
  - `onError(listener: (error: SenxorError) => void)` – receive errors during operation.
  - `onOpen(listener: () => void)` – notified when the device is successfully opened.
  - `onClose(listener: () => void)` – notified when the device is closed.
  - `onDisconnect(listener: () => void)` – notified when the underlying transport disconnects.
- Registers and fields:
  - `readReg(address: number)` / `readRegs(addresses: number[])` – read low-level registers.
  - `writeReg(address: number, value: number)` – write a low-level register with validation.
  - `getFieldValue(field: FieldName, refresh?: boolean)` – read a logical field value.
  - `setFieldValue(field: FieldName, value: number)` – update a logical field with safety checks.
- Cached state and metadata:
  - `isOpen` – whether the device is currently open.
  - `isStreaming` – whether continuous streaming is enabled.
  - `deviceInfo` – read-only information from the underlying transport.
  - `fieldsCache` / `registersCache` – snapshots of recently read values.
- Device info and configuration helpers:
  - Device info:
    - `getShape()` – frame shape as `[height, width]` inferred from `SENXOR_TYPE`.
    - `getFwVersion()` – firmware version string like `"4.5.12"`.
    - `getSenxorType()` – human-readable Senxor type name.
    - `getModuleType()` – human-readable module type name.
    - `getMcuType()` – human-readable MCU type name.
    - `getModuleName()` – friendly module name: `"Cougar"`, `"Panther"`, or `"Cheetah"`.
    - `getProductionYear()` – production year as a four-digit number (e.g. `2024`).
    - `getProductionWeek()` – production week (1–52).
    - `getManufLocation()` – manufacturing location code.
    - `getSerialNumber()` – serial number as an integer.
    - `getSn()` – full SN code as a hex string in the format `YYWWLLSSSSSS`.
  - Frame rate and gain:
    - `getFrameRateDivider()` / `setFrameRateDivider(divider)` – read and update the frame rate divider.
    - `getModuleGain()` / `setModuleGain(gain)` – read and update the module gain.
  - Temperature correction:
    - `getSensitivity()` / `setSensitivity(value)` – multiplicative sensitivity correction factor.
    - `getEmissivity()` / `setEmissivity(value)` – emissivity used for temperature conversion.
    - `getOffset()` / `setOffset(value)` – temperature offset correction in K/°C.
    - `getOtf()` / `setOtf(value)` – OTF (optical transfer) correction factor.
  - Filters:
    - `disableAllFilters()` – disable all supported onboard filters in one call.
    - `getFiltersStatus()` – get availability and enable state of all filters.
    - `getStarkEnable()` / `setStarkEnable(enabled)` – STARK filter.
    - `getMmsKxmsEnable()` / `setMmsKxmsEnable(enabled)` – MMS KXMS filter.
    - `getMmsRaEnable()` / `setMmsRaEnable(enabled)` – MMS RA filter.
    - `getMedianEnable()` / `setMedianEnable(enabled)` – median filter.
    - `getTemporalEnable()` / `setTemporalEnable(enabled)` – temporal filter.


Transport packages such as `@senxor/web-serial` and `@senxor/capacitor-serial` create and manage `Senxor` instances for you. In typical usage you receive a `Senxor` from a transport API, subscribe to its events, and then call `open()`, `startStreaming()`, and `stopStreaming()` as needed.

## Frame units

By default, `onData` delivers `data.frame` as a `Float32Array` of Celsius values:

```ts
senxor.onData((data) => {
  const celsius = data.frame[0];
});
```

Pass `"dK"` to receive a `Uint16Array` in units of 0.1 K:

```ts
senxor.onData((data) => {
  const celsius = data.frame[0] * 0.1 - 273.15;
}, "dK");
```

Registering `onData` again replaces the previous callback. Temperature fields in the frame header remain in Celsius for both units. The existing processors accept Celsius `Float32Array` frames; convert dK values with `value * 0.1 - 273.15` before passing them to those processors.

## Processing helpers (processors)

The `processors` module provides utilities for working with frame data emitted by `Senxor`:

- `getMinMax(array: Float32Array)` – compute the minimum and maximum values in a frame.
- `normalizeFloat32Array(array: Float32Array, min?: number, max?: number)` – normalize values into the `[0, 1]` range, returning a new `Float32Array`.
- `nomalizeSenxorData(data: SenxorData, min?: number, max?: number)` – normalize a full `SenxorData` frame and return a rich `senxorNormalizedData` object that includes:
  - `frame`: normalized `Float32Array` in `[0, 1]`.
  - `width`, `height`: frame dimensions.
  - `minValue`, `maxValue`: actual min/max used for normalization.
  - `header` and `timestamp`: forwarded from the original data.
- Image conversion:
  - `createGrayScaleImageData(data: senxorNormalizedData)` – convert normalized data into grayscale `ImageData` suitable for drawing on a canvas.
  - `applyColorLUT(data: senxorNormalizedData, lut: Uint8Array)` – apply a custom 256×3 color lookup table and return `ImageData`.
- Color maps:
  - `ColorMap` – union of built-in color map names.
  - `getColorMapList()` – list available color map names.
  - `registerColorMap(name: string, lut: Uint8Array)` – register a custom color map.
  - `applyColorMap(data: senxorNormalizedData, map: ColorMap | string)` – apply a named color map and return `ImageData`.

These helpers make it easy to turn raw temperature frames into normalized arrays and renderable images without dealing with low-level conversion logic yourself.

## Error handling

`@senxor/core` defines two main error types:

- `SenxorError` – generic errors raised by high-level Senxor operations, such as invalid field names, unsupported settings, or failed register operations.
- `SenxorTransportError` – errors coming from the underlying transport (for example, connection failures or I/O problems).

You can handle these errors by:

- Registering an `onError` listener on a `Senxor` instance to receive errors that occur during streaming and callbacks.
- Using `try`/`catch` around operations such as `open()`, `readReg()`, or `setFieldValue()` to catch and react to failures.

Both error types include a `cause` property that can hold a lower-level error when available.

## Protocol metadata and utilities

In addition to the main classes and processors, `@senxor/core` exposes several supporting modules:

- `FIELDS` – a map of logical field definitions used by `getFieldValue` and `setFieldValue`. Each field describes how it is stored inside registers, including bit ranges and read/write capabilities.
- `REGISTERS` – metadata for device registers, including addresses and human-readable names.
- `consts` – protocol-level constants, such as module and frame type mappings.
- `utils` – lower-level helpers used internally for bit manipulation and raw frame processing.
- `types` – shared TypeScript types such as `SenxorData`, `SenxorHeader`, `ISenxorTransport`, and related structures.

Most applications will only interact directly with:

- `Senxor` for device control and data streaming.
- `processors` for frame normalization and visualization.
- `SenxorError` and `SenxorTransportError` for error handling.

The metadata and utility exports exist mainly to support advanced use cases and tooling.

## Related packages

- `@senxor/web-serial` – browser transport using the Web Serial API. This is usually the best choice when running in modern desktop browsers.
- `@senxor/capacitor-serial` – Capacitor transport for mobile and embedded WebView environments.

Use one of these transports to discover and connect to devices, then rely on `@senxor/core` to manage the session and process the incoming data.

