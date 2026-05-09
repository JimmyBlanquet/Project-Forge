/**
 * Config Manager - Centralized Configuration Management
 *
 * Provides type-safe, environment-aware configuration management
 */

export interface ConfigSchema {
  [key: string]: string | number | boolean | undefined
}

export interface ConfigOptions {
  env?: 'development' | 'production' | 'staging' | 'test'
  required?: string[]
  defaults?: ConfigSchema
}

/**
 * ConfigManager - Singleton pattern for centralized config
 */
export class ConfigManager<T extends ConfigSchema = ConfigSchema> {
  private static instance: ConfigManager | null = null
  private config: T
  private env: string

  private constructor(options: ConfigOptions = {}) {
    this.env = options.env || process.env.NODE_ENV || 'development'
    this.config = this.loadConfig(options)

    // Validate required fields
    if (options.required) {
      this.validateRequired(options.required)
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance<T extends ConfigSchema = ConfigSchema>(
    options?: ConfigOptions
  ): ConfigManager<T> {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(options)
    }
    return ConfigManager.instance as ConfigManager<T>
  }

  /**
   * Reset instance (useful for testing)
   */
  static reset(): void {
    ConfigManager.instance = null
  }

  /**
   * Get configuration value
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.config[key]
  }

  /**
   * Get all configuration
   */
  getAll(): Readonly<T> {
    return { ...this.config }
  }

  /**
   * Set configuration value (use sparingly - prefer env vars)
   */
  set<K extends keyof T>(key: K, value: T[K]): void {
    this.config[key] = value
  }

  /**
   * Check if configuration key exists
   */
  has(key: keyof T): boolean {
    return key in this.config && this.config[key] !== undefined
  }

  /**
   * Get current environment
   */
  getEnv(): string {
    return this.env
  }

  /**
   * Load configuration from environment
   */
  private loadConfig(options: ConfigOptions): T {
    const config: ConfigSchema = {}

    // Load from process.env
    for (const [key, value] of Object.entries(process.env)) {
      config[key] = value
    }

    // Apply defaults
    if (options.defaults) {
      for (const [key, value] of Object.entries(options.defaults)) {
        if (!(key in config) || config[key] === undefined) {
          config[key] = value
        }
      }
    }

    return config as T
  }

  /**
   * Validate required configuration
   */
  private validateRequired(required: string[]): void {
    const missing: string[] = []

    for (const key of required) {
      if (!(key in this.config) || this.config[key] === undefined) {
        missing.push(key)
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required configuration: ${missing.join(', ')}\n` +
        `Environment: ${this.env}`
      )
    }
  }
}

/**
 * Helper to create typed config manager
 */
export function createConfigManager<T extends ConfigSchema>(
  schema: T,
  options?: ConfigOptions
): ConfigManager<T> {
  return ConfigManager.getInstance<T>(options)
}
