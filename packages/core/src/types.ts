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
  deviceInfo: object;

  open(): Promise<void>;
  close(): Promise<void>;

  readReg(address: number): Promise<number>;
  writeReg(address: number, value: number): Promise<void>;
  readRegs(addresses: number[]): Promise<Record<number, number>>;

  onData(listener: (data: SenxorRawData) => void): void;
  onError(listener: (error: SenxorTransportError) => void): void;
  onOpen(listener: () => void): void;
  onClose(listener: () => void): void;
  onDisconnect(listener: () => void): void;
}

export type SenxorModuleName = "Cougar" | "Panther" | "Cheetah";
