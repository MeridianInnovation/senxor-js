## 1.3.0 (2026-11-24)

### @senxor/core

- Receive frames as `Uint16Array` values in 0.1 K units with `onData(listener, "dK")`.
- Recognize additional module models and display corrected model names.

### @senxor/tcpip-serial-capacitor

- Connect to Senxor devices over TCP from Capacitor apps. This package requires `capacitor-tcp-socket` ^7.1.1.

### Network transports

- Explicitly closing a connection now calls `onClose`; unexpected connection loss calls `onDisconnect`.

## 1.2.0 (2026-05-27)

### @senxor/tcpip-serial-node

- feat: initial Node.js TCP/IP serial transport package

### @senxor/websocket-serial

- feat: initial browser WebSocket serial transport package

### @senxor/serial-core

- fix: log warning for bare ACK received without a corresponding command
- fix: fix build issue

### @senxor/capacitor-serial

- docs: add UsbSerial plugin configuration instructions in README

## 1.1.1 (2026-03-30)

### @senxor/core

- feat: update sensor type and module type constants for clarity

### @senxor/serial-core

- fix: enhance checksum verification in parser.ts to log failures without returning false
