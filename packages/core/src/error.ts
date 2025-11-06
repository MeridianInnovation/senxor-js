export class SenxorTransportError extends Error {
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "SenxorTransportError";
    this.cause = cause;
  }
}

export class SenxorError extends Error {
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "SenxorError";
    this.cause = cause;
  }
}
