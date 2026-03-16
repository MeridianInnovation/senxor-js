import type { SerialDeviceInfo } from "./types";
import { consts } from "@senxor/core";
const decoder = new TextDecoder("ascii");

/**
 * Convert a number to a fixed-length uppercase hexadecimal string
 * @param value - The number to convert (must be non-negative)
 * @param length - The desired length of the hex string
 * @returns The uppercase hex string padded to the specified length
 * @throws Error if value is negative or produces more digits than length
 */
export const toHexString = (value: number, length: number): string => {
  if (value < 0) {
    throw new Error(`Cannot convert negative value ${value} to hex string`);
  }
  const hex = value.toString(16).toUpperCase();
  if (hex.length > length) {
    throw new Error(`Value ${value} (0x${hex}) exceeds ${length} hex digits`);
  }
  return hex.padStart(length, "0");
};

/**
 * Decode a Uint8Array to ASCII string
 * @param buffer - The Uint8Array to decode
 * @returns The decoded string
 */
export const decodeUint8Array = (buffer: Uint8Array): string => {
  return decoder.decode(buffer);
};

export const isSenxorDevice = (device: SerialDeviceInfo): boolean => {
  return (
    device.vendorId === consts.SENXOR_VENDOR_ID &&
    device.productId! in consts.SENXOR_PRODUCT_ID
  );
};
