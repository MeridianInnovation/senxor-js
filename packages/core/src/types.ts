import { SenxorTransportError } from "./error";

export type SenxorHeader = {
  frameCount: number;
  vdd: number;
  dieTemp: number;
  timestamp: number;
  maxVal: number;
  minVal: number;
  crc: number;
};

export type SenxorRawData = {
  header?: Uint8Array;
  frame: Uint8Array;
  timestamp: number;
};

export type SenxorData = {
  header?: SenxorHeader;
  frame: Float32Array;
  width: number;
  height: number;
  timestamp: number;
};

export interface ISenxorTransport {
  isOpen: boolean;
  deviceInfo: Record<string, unknown>;

  open(): Promise<void>;
  close(): Promise<void>;

  readReg(address: number): Promise<number>;
  writeReg(address: number, value: number): Promise<void>;

  onData(listener: (data: SenxorRawData) => void): void;
  onError(listener: (error: SenxorTransportError) => void): void;
  onOpen(listener: () => void): void;
  onClose(listener: () => void): void;
}
