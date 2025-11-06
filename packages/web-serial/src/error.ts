export { SenxorTransportError } from "@senxor/core";

export class SerialPortError extends Error {
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "SerialPortError";
    this.cause = cause;
  }
}
