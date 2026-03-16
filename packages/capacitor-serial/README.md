# @senxor/capacitor-serial

`@senxor/capacitor-serial` is the Capacitor transport for Senxor.js. It lets you discover and connect Senxor devices from a Capacitor application (for example, an Android app running inside a WebView) and gives you ready-to-use `Senxor` instances from `@senxor/core`.

Use this package together with:

- `@senxor/core` – provides the `Senxor` device controller and processing helpers.
- `capacitor-serial-plugin` – a native Capacitor plugin that exposes USB serial ports.

## Installation

In your Capacitor app project, install the JavaScript dependencies:

```bash
pnpm add @senxor/core @senxor/capacitor-serial
pnpm add capacitor-serial-plugin
```

Then run Capacitor sync so the native project picks up the plugin:

```bash
npx cap sync
```

## Android configuration

On Android you must ensure that:

- The JitPack Maven repository is available so the native plugin can be resolved.
- USB permissions and device filters are correctly declared in your manifest.

### JitPack repository

In your Android project-level Gradle file (for example, `android/build.gradle` in a standard Capacitor project), add the JitPack repository to the list of repositories:

```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}
```

If your project uses `dependencyResolutionManagement` instead of `allprojects`, add the same `maven { url 'https://jitpack.io' }` entry to the appropriate repositories block.

### USB permissions and filters

Your Android manifest must declare USB permissions and, typically, a device filter so that the system knows which USB devices should trigger your app. A minimal configuration looks similar to:

```xml
<uses-permission android:name="android.permission.USB_PERMISSION" />
<uses-feature
    android:name="android.hardware.usb.host"
    android:required="true" />
```

Inside your main activity, you can also declare an intent filter and metadata for USB device attachment, for example:

```xml
<activity
    android:name=".MainActivity"
    android:exported="true">

    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
        <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
    </intent-filter>

    <meta-data
        android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
        android:resource="@xml/device_filter" />
</activity>
```

The exact requirements may vary depending on the version of `capacitor-serial-plugin`. Always refer to that plugin's documentation for the most up-to-date Android configuration details and sample `device_filter` definitions.

## Quick start

Once your Capacitor project is configured and the native plugin is installed, you can use `@senxor/capacitor-serial` from your web code to discover Senxor devices and work with `Senxor` instances.

```ts
import {
  listCapacitorSerialSenxors,
  onCapacitorSerialSenxorConnect,
} from "@senxor/capacitor-serial";
import {
  nomalizeSenxorData,
  applyColorMap,
  type SenxorData,
} from "@senxor/core";

async function initDevices() {
  const devices = await listCapacitorSerialSenxors();

  for (const senxor of devices) {
    await senxor.open();

    senxor.onError((error) => {
      console.error("Senxor error:", error);
    });

    senxor.onData((data: SenxorData) => {
      const normalized = nomalizeSenxorData(data);
      const image = applyColorMap(normalized, "rainbow2");
      // Render `image` to a canvas or process it further
    });

    await senxor.startStreaming();
  }

  // Optionally, listen for new devices being connected while the app is running
  onCapacitorSerialSenxorConnect(async (senxor) => {
    await senxor.open();
    await senxor.startStreaming();
  });
}
```

The `Senxor` instances you receive here behave the same way as in other transports. For more details about the `Senxor` API and available processors, see the `@senxor/core` README.

## API

### `listCapacitorSerialSenxors()`

```ts
import { listCapacitorSerialSenxors } from "@senxor/capacitor-serial";

const devices = await listCapacitorSerialSenxors();
```

Lists all currently available Senxor devices exposed by the Capacitor serial plugin. It:

- Asks the underlying `serial-adaptor-capacitor` to list connected serial ports.
- Filters out non-Senxor devices.
- Wraps each Senxor-compatible port in a serial transport and returns an array of `Senxor` instances.

Use this at startup or when you want to refresh the list of connected devices.

### `onCapacitorSerialSenxorConnect(listener)`

```ts
import { onCapacitorSerialSenxorConnect } from "@senxor/capacitor-serial";

const unsubscribe = onCapacitorSerialSenxorConnect((senxor) => {
  // A new Senxor device has been connected
});

// Later, to stop listening:
unsubscribe();
```

Registers a listener that is called whenever a new Senxor device is connected and detected by the Capacitor serial plugin. The listener receives a `Senxor` instance that you can open and start streaming from.

The function returns an unsubscribe callback that removes the listener when called.

## Working with @senxor/core

`@senxor/capacitor-serial` focuses on integrating with the native Capacitor serial plugin and returning `Senxor` instances. After you obtain a `Senxor` from this package, you will typically:

- Use `open()`, `close()`, `startStreaming()`, and `stopStreaming()` to control the device session.
- Subscribe to `onData` and `onError` to receive frames and handle errors.
- Use processors from `@senxor/core` (such as `nomalizeSenxorData`, `createGrayScaleImageData`, and `applyColorMap`) to normalize and visualize frames.

For a full description of the `Senxor` class, error types, and processing helpers, see the `@senxor/core` README.

## Example project

This repository includes a Capacitor example application that demonstrates how to:

- Configure the Android project with the required repositories and USB permissions.
- Install and sync the `capacitor-serial-plugin`.
- Discover and stream from Senxor devices inside a Capacitor WebView.

Look for the `examples/capacitor-serial` directory in the Senxor.js repository for a complete, runnable example built on top of `@senxor/capacitor-serial` and `@senxor/core`.

