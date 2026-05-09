export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  requestId?: string
  userId?: string
  route?: string
  method?: string
  statusCode?: number
  duration?: number
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  [key: string]: unknown
}

export interface LogEntry extends LogContext {
  timestamp: string
  level: LogLevel
  message: string
}

export interface Logger {
  debug: (_message: string, _context?: LogContext) => void
  info: (_message: string, _context?: LogContext) => void
  warn: (_message: string, _context?: LogContext) => void
  error: (_message: string, _context?: LogContext) => void
}
