class HTTPError extends Error {
  constructor(message, status, code) {
    super(message);
    this.message = message;
    this.status = status;
    this.code = code;
  }
}

module.exports = {
  HTTPError,
};
