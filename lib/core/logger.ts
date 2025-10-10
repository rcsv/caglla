// 環境別ロガーユーティリティ
// 本番環境での情報漏洩を防ぐため、環境に応じたログレベル制御を実装

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LoggerConfig {
  level: LogLevel
  enableColors: boolean
  enableTimestamp: boolean
}

class Logger {
  private config: LoggerConfig

  constructor() {
    // 環境に応じたデフォルト設定
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isTest = process.env.NODE_ENV === 'test'
    
    this.config = {
      level: isDevelopment ? LogLevel.DEBUG : isTest ? LogLevel.WARN : LogLevel.ERROR,
      enableColors: isDevelopment,
      enableTimestamp: true,
    }
  }

  // ログレベルの設定
  setLevel(level: LogLevel) {
    this.config.level = level
  }

  // 現在のログレベルを取得
  getLevel(): LogLevel {
    return this.config.level
  }

  // タイムスタンプを生成
  private getTimestamp(): string {
    if (!this.config.enableTimestamp) return ''
    const now = new Date()
    return `[${now.toISOString()}]`
  }

  // ログメッセージのフォーマット
  private formatMessage(level: string, message: string): string {
    const timestamp = this.getTimestamp()
    return `${timestamp} ${level}: ${message}`
  }

  // データのサニタイズ（機密情報を隠す）
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sensitiveKeys = [
      'password',
      'token',
      'apiKey',
      'api_key',
      'privateKey',
      'private_key',
      'secret',
      'authorization',
      'credential',
    ]

    const sanitized: any = Array.isArray(data) ? [] : {}

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const lowerKey = key.toLowerCase()
        const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive.toLowerCase()))

        if (isSensitive) {
          sanitized[key] = '***REDACTED***'
        } else if (typeof data[key] === 'object' && data[key] !== null) {
          sanitized[key] = this.sanitizeData(data[key])
        } else {
          sanitized[key] = data[key]
        }
      }
    }

    return sanitized
  }

  // DEBUGレベルログ（開発環境のみ）
  debug(message: string, ...args: any[]) {
    if (this.config.level <= LogLevel.DEBUG) {
      const sanitizedArgs = args.map(arg => this.sanitizeData(arg))
      console.debug(this.formatMessage('DEBUG', message), ...sanitizedArgs)
    }
  }

  // INFOレベルログ
  info(message: string, ...args: any[]) {
    if (this.config.level <= LogLevel.INFO) {
      const sanitizedArgs = args.map(arg => this.sanitizeData(arg))
      console.info(this.formatMessage('INFO', message), ...sanitizedArgs)
    }
  }

  // WARNレベルログ
  warn(message: string, ...args: any[]) {
    if (this.config.level <= LogLevel.WARN) {
      const sanitizedArgs = args.map(arg => this.sanitizeData(arg))
      console.warn(this.formatMessage('WARN', message), ...sanitizedArgs)
    }
  }

  // ERRORレベルログ
  error(message: string, error?: Error | any, ...args: any[]) {
    if (this.config.level <= LogLevel.ERROR) {
      const sanitizedArgs = args.map(arg => this.sanitizeData(arg))
      
      if (error instanceof Error) {
        // 本番環境ではスタックトレースを隠す
        if (process.env.NODE_ENV === 'production') {
          console.error(this.formatMessage('ERROR', message), error.message, ...sanitizedArgs)
        } else {
          console.error(this.formatMessage('ERROR', message), error, ...sanitizedArgs)
        }
      } else if (error) {
        const sanitizedError = this.sanitizeData(error)
        console.error(this.formatMessage('ERROR', message), sanitizedError, ...sanitizedArgs)
      } else {
        console.error(this.formatMessage('ERROR', message), ...sanitizedArgs)
      }
    }
  }

  // API呼び出しログ（デバッグ用）
  apiCall(method: string, url: string, data?: any) {
    if (this.config.level <= LogLevel.DEBUG) {
      const sanitizedData = data ? this.sanitizeData(data) : undefined
      this.debug(`API Call: ${method} ${url}`, sanitizedData)
    }
  }

  // API応答ログ（デバッグ用）
  apiResponse(method: string, url: string, status: number, data?: any) {
    if (this.config.level <= LogLevel.DEBUG) {
      const sanitizedData = data ? this.sanitizeData(data) : undefined
      this.debug(`API Response: ${method} ${url} - Status: ${status}`, sanitizedData)
    }
  }

  // パフォーマンス測定開始
  time(label: string) {
    if (this.config.level <= LogLevel.DEBUG) {
      console.time(label)
    }
  }

  // パフォーマンス測定終了
  timeEnd(label: string) {
    if (this.config.level <= LogLevel.DEBUG) {
      console.timeEnd(label)
    }
  }
}

// シングルトンインスタンス
const logger = new Logger()

export default logger

// 便利な関数エクスポート
export const debug = logger.debug.bind(logger)
export const info = logger.info.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)
export const apiCall = logger.apiCall.bind(logger)
export const apiResponse = logger.apiResponse.bind(logger)
export const time = logger.time.bind(logger)
export const timeEnd = logger.timeEnd.bind(logger)

