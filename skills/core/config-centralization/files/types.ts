/**
 * Config Centralization - Type Definitions
 */

/**
 * Base configuration schema
 */
export interface BaseConfig {
  NODE_ENV: 'development' | 'production' | 'staging' | 'test'
  PORT?: number
  HOST?: string
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * Database configuration
 */
export interface DatabaseConfig extends BaseConfig {
  DATABASE_URL: string
  DB_POOL_MIN?: number
  DB_POOL_MAX?: number
  DB_SSL?: boolean
}

/**
 * API configuration
 */
export interface APIConfig extends BaseConfig {
  API_URL: string
  API_KEY?: string
  API_TIMEOUT?: number
  API_RETRY_ATTEMPTS?: number
}

/**
 * Full application configuration
 */
export interface AppConfig extends BaseConfig, DatabaseConfig, APIConfig {
  // Add your custom config fields here
}

/**
 * Configuration validation result
 */
export interface ConfigValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Environment-specific configuration
 */
export type EnvironmentConfig<T> = {
  [env in 'development' | 'production' | 'staging' | 'test']?: Partial<T>
}
