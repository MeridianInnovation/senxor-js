# Senxor Capacitor Serial Example

This is a Capacitor-based example that shows how to use `@senxor/capacitor-serial` and `@senxor/core` to connect to Senxor devices from an Android app running inside a WebView.

## Prerequisites

- Install dependencies at the repository root:

```bash
pnpm install
```

- A working Android development environment (Android Studio, Android SDK, an emulator or a physical device).
- A Capacitor project configured for Android.
- The native serial plugin and Android configuration set up as described in the `@senxor/capacitor-serial` README (including the JitPack repository and USB permissions).

## Run the example on Android

From the repository root:

```bash
cd examples/capacitor-serial
pnpm start
```

The `start` script will:

- Build the web assets with Vite.
- Run `npx cap run android` to launch the Android app on your chosen device or emulator.

On the first run, Android Studio or the Android tooling may need to download additional SDK components. Follow the prompts from the Android tooling if that happens.

