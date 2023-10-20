export class HTTPError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.message = message;
    this.status = status;
    this.code = code;
  }
}
