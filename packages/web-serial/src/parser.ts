import type { LengthPrefixedParserOptions as PrefixLengthParserOptions } from "serial-packet-parser";
import { toHexString, decodeUint8Array } from "./utils";

const encoder = new TextEncoder();

/**
 * Senxor message format:
 * [prefix][length][body]
 * prefix: 4 bytes, "   #"
 * length: 4 bytes, hex string, e.g. "000A"
 * body: length bytes
 *
 * Senxor message body format:
 * [cmd][data][checksum]
 * cmd: 4 bytes, command code, string
 * data: length-8 bytes, data bytes, string|Uint8Array, depending on the command
 * checksum: 4 bytes, hex string, calculated by last 4 bytes of the sum of the [length][body-without-checksum]
 *
 */
const msgPrefixStr = "   #";
const msgPrefix = encoder.encode(msgPrefixStr);
const msgLenFieldSize = 4;

const msgLenFieldStart = 4;
const msgBodyStart = msgLenFieldStart + msgLenFieldSize; // 8
const msgCmdStart = msgBodyStart;

const cmdLen = 4;
const checksumLen = 4;
const checksumIndex = -checksumLen;

const msgDataStart = msgCmdStart + cmdLen;

export const parseMessageLength = (
  buf: Uint8Array,
  start: number,
  size: number
) => {
  const hexString = decodeUint8Array(buf.slice(start, start + size));
  return Number.parseInt(hexString, 16);
};

export const verifyChecksum = (
  message: Uint8Array,
  _payloadStart: number,
  _payloadLen: number
) => {
  void _payloadStart;
  void _payloadLen;
  const checksumFromMessage = decodeUint8Array(message.slice(checksumIndex));

  const dataToChecksum = message.slice(msgLenFieldStart, checksumIndex);
  const dataSum = dataToChecksum.reduce((acc, val) => acc + val, 0) & 0xffff;
  const checksumToVerify = toHexString(dataSum, 4);

  return checksumFromMessage === checksumToVerify;
};

export const parseMessageBody = (message: Uint8Array) => {
  const cmd = decodeUint8Array(
    message.slice(msgCmdStart, msgCmdStart + cmdLen)
  );
  const data = message.slice(msgDataStart, checksumIndex);
  return { cmd, data };
};

export const messageParserOptions: PrefixLengthParserOptions = {
  prefix: msgPrefix,
  lengthFieldSize: msgLenFieldSize,
  parseLength: parseMessageLength,
  minPayloadLen: 4,
  maxPayloadLen: 64 * 1024,
  maxBufferSize: 64 * 1024,
  verifyMessage: verifyChecksum,
  onMessage: undefined,
  onError: undefined,
  onResync: undefined,
};

/**
 *  ------------------------------------------------
 *  Details:
 *
 *   W/R |  CMD   | MSG LENGTH |   MSG BODY
 *       | ------ | ---------- | ------------------------------------------------------ |
 *   W   |  RREG  |    000A    | RREG{REG_ADDR:2x}XXXX
 *       |  WREG  |    000C    | WREG{REG_ADDR:2x}{REG_VALUE:2x}XXXX
 *       |  RRSE  |    VARY    | RRSE{REG_ADDR:2x}...{REG_ADDR:2x}FFXXXX
 *       | ------ | ---------- | ------------------------------------------------------ |
 *   R   |  RREG  |    000A    | RREG{REG_VALUE:2x}{CHECKSUM:4x}
 *  (ACK)|  WREG  |    0008    | WREG01FD  # The checksum is always 01FD
 *       |  RRSE  |    VARY    | RRSE{REG_ADDR:2x}{REG_VALUE:2x}...{CHECKSUM:4x}
 *       |  GFRA  |    VARY    | GFRA{RESERVED:vary}{HEADER:vary}{DATA:vary}{CHECKSUM:4x}
 */

type GfraDataSlice = {
  header?: { start: number; end: number };
  frame: { start: number; end: number };
};

export const gfraDataFormat: Record<number, GfraDataSlice> = {
  10080: {
    header: undefined,
    frame: { start: 160, end: 10080 },
  },
  10240: {
    header: { start: 160, end: 320 },
    frame: { start: 320, end: 10240 },
  },
  39360: {
    header: undefined,
    frame: { start: 960, end: 39360 },
  },
  39680: {
    header: { start: 960, end: 1280 },
    frame: { start: 1280, end: 39680 },
  },
  5200: {
    header: { start: 100, end: 200 },
    frame: { start: 200, end: 5200 },
  },
};

export const senxorAckDecoder = {
  RREG(data: Uint8Array): number {
    const hexString = decodeUint8Array(data);
    return Number.parseInt(hexString, 16);
  },
  WREG(data: Uint8Array): void {
    // data of WREG ack is empty
    void data;
  },
  RRSE(data: Uint8Array): Record<number, number> {
    const regs: Record<number, number> = {};
    for (let i = 0; i < data.length; i += 4) {
      const regAddr = Number.parseInt(
        decodeUint8Array(data.slice(i, i + 2)),
        16
      );
      const regValue = Number.parseInt(
        decodeUint8Array(data.slice(i + 2, i + 4)),
        16
      );
      regs[regAddr] = regValue;
    }
    return regs;
  },
  GFRA(data: Uint8Array) {
    const length = data.length;
    if (length in gfraDataFormat) {
      const { header: headerSlice, frame: frameSlice } = gfraDataFormat[length];
      const header = headerSlice
        ? data.slice(headerSlice.start, headerSlice.end)
        : undefined;
      const frame = data.slice(frameSlice.start, frameSlice.end);
      return { header, frame };
    }
    throw new Error(`Invalid GFRA data length: ${length}`);
  },
  SERR(data: Uint8Array): void {
    void data;
  },
};

export const senxorAckEncoder = {
  RREG(regAddr: number): string {
    const regAddrHex = toHexString(regAddr, 2);
    return `   #000ARREG${regAddrHex}XXXX`;
  },
  WREG(regAddr: number, regValue: number): string {
    const regAddrHex = toHexString(regAddr, 2);
    const regValueHex = toHexString(regValue, 2);
    return `   #000CWREG${regAddrHex}${regValueHex}XXXX`;
  },
  RRSE(addrs: number[]): string {
    const addrsHex = addrs.map((addr) => toHexString(addr, 2)).join("");
    const payload = `RRSE${addrsHex}FFXXXX`;
    return `   #${toHexString(payload.length, 4)}${payload}`;
  },
};
