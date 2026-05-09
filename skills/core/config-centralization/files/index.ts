/**
 * Config Centralization - Public API
 *
 * Centralized configuration management for Next.js applications
 */

export { ConfigManager, createConfigManager } from './config-manager'
export type { ConfigSchema, ConfigOptions } from './config-manager'
export type {
  BaseConfig,
  DatabaseConfig,
  APIConfig,
  AppConfig,
  ConfigValidation,
  EnvironmentConfig
} from './types'

// Re-export for convenience
import { ConfigManager } from './config-manager'
export default ConfigManager
