// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

if (typeof globalThis.Response === 'undefined') {
  class SimpleResponse {
    constructor(body, init = {}) {
      this._body = body
      this.status = init.status ?? 200
    }

    async json() {
      if (typeof this._body === 'string') {
        try {
          return JSON.parse(this._body)
        } catch {
          return this._body
        }
      }
      return this._body
    }

    async text() {
      if (this._body === undefined || this._body === null) {
        return ''
      }
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
    }
  }

  globalThis.Response = SimpleResponse
}



