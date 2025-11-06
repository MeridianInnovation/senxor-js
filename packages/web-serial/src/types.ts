export interface SerialDeviceInfo {
  vendorId: number;
  productId: number;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface ISerialPort<
  TDeviceInfo extends SerialDeviceInfo = SerialDeviceInfo,
  TOptions extends SerialOptions = SerialOptions
> {
  deviceInfo: TDeviceInfo;
  isOpen: boolean;
  open(options?: TOptions): Promise<void>;
  close(): Promise<void>;
  write(data: Uint8Array): Promise<void>;
  on(event: "data", listener: (data: Uint8Array) => void): () => void;
  on(event: "error", listener: (error: Error) => void): () => void;
  on(event: "open", listener: () => void): () => void;
  on(event: "close", listener: () => void): () => void;
  on(event: "disconnect", listener: () => void): () => void;
}

export type SenxorCommand = {
  RREG: {
    regAddr: number;
  };
  WREG: {
    regAddr: number;
    regValue: number;
  };
  RRSE: {
    regs: Record<number, number>;
  };
};

export type SenxorAck = {
  RREG: number;
  WREG: void;
  RRSE: Record<number, number>;
  GFRA: { header?: Uint8Array; frame: Uint8Array };
  SERR: void;
};
