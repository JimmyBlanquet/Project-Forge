/**
 * Config Centralization - Test Suite
 *
 * Tests for ConfigManager and type-safe configuration management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ConfigManager, createConfigManager } from '../files/config-manager'
import type { AppConfig } from '../files/types'

describe('ConfigManager', () => {
  // Reset singleton before each test
  beforeEach(() => {
    ConfigManager.reset()
    // Clear process.env test variables
    delete process.env.TEST_VAR
    delete process.env.NODE_ENV
    delete process.env.PORT
    delete process.env.DATABASE_URL
    delete process.env.API_URL
    delete process.env.API_KEY
    delete process.env.LOG_LEVEL
  })

  afterEach(() => {
    ConfigManager.reset()
  })

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = ConfigManager.getInstance()
      const instance2 = ConfigManager.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should create new instance after reset', () => {
      const instance1 = ConfigManager.getInstance()
      ConfigManager.reset()
      const instance2 = ConfigManager.getInstance()

      expect(instance1).not.toBe(instance2)
    })
  })

  describe('Configuration Loading', () => {
    it('should load configuration from process.env', () => {
      process.env.TEST_VAR = 'test_value'

      const config = ConfigManager.getInstance()

      expect(config.get('TEST_VAR')).toBe('test_value')
    })

    it('should apply defaults for missing values', () => {
      const config = ConfigManager.getInstance({
        defaults: {
          DEFAULT_VAR: 'default_value',
          PORT: 3000
        }
      })

      expect(config.get('DEFAULT_VAR')).toBe('default_value')
      expect(config.get('PORT')).toBe(3000)
    })

    it('should not override env vars with defaults', () => {
      process.env.PORT = '8080'

      const config = ConfigManager.getInstance({
        defaults: {
          PORT: 3000
        }
      })

      expect(config.get('PORT')).toBe('8080')
    })
  })

  describe('Environment Detection', () => {
    it('should default to development environment', () => {
      const config = ConfigManager.getInstance()

      expect(config.getEnv()).toBe('development')
    })

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production'

      const config = ConfigManager.getInstance({ env: 'production' })

      expect(config.getEnv()).toBe('production')
    })

    it('should use custom environment', () => {
      const config = ConfigManager.getInstance({ env: 'staging' })

      expect(config.getEnv()).toBe('staging')
    })
  })

  describe('Required Field Validation', () => {
    it('should validate required fields on startup', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test'

      expect(() => {
        ConfigManager.getInstance({
          required: ['DATABASE_URL']
        })
      }).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      expect(() => {
        ConfigManager.getInstance({
          required: ['MISSING_REQUIRED_FIELD']
        })
      }).toThrow('Missing required configuration: MISSING_REQUIRED_FIELD')
    })

    it('should throw error for multiple missing required fields', () => {
      expect(() => {
        ConfigManager.getInstance({
          required: ['FIELD_1', 'FIELD_2', 'FIELD_3']
        })
      }).toThrow('Missing required configuration: FIELD_1, FIELD_2, FIELD_3')
    })

    it('should include environment in error message', () => {
      try {
        ConfigManager.getInstance({
          env: 'production',
          required: ['MISSING_FIELD']
        })
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).toContain('Environment: production')
      }
    })
  })

  describe('get() method', () => {
    it('should get configuration value', () => {
      process.env.API_URL = 'https://api.example.com'

      const config = ConfigManager.getInstance()

      expect(config.get('API_URL')).toBe('https://api.example.com')
    })

    it('should return undefined for missing key', () => {
      const config = ConfigManager.getInstance()

      expect(config.get('NONEXISTENT_KEY')).toBeUndefined()
    })

    it('should be type-safe with generic types', () => {
      interface TestConfig {
        API_URL: string
        PORT: number
      }

      process.env.API_URL = 'https://api.example.com'
      process.env.PORT = '3000'

      const config = ConfigManager.getInstance<TestConfig>()
      const url: string = config.get('API_URL')!

      expect(url).toBe('https://api.example.com')
    })
  })

  describe('set() method', () => {
    it('should set configuration value', () => {
      const config = ConfigManager.getInstance()

      config.set('NEW_KEY', 'new_value')

      expect(config.get('NEW_KEY')).toBe('new_value')
    })

    it('should override existing value', () => {
      process.env.EXISTING_KEY = 'old_value'

      const config = ConfigManager.getInstance()
      config.set('EXISTING_KEY', 'new_value')

      expect(config.get('EXISTING_KEY')).toBe('new_value')
    })
  })

  describe('has() method', () => {
    it('should return true for existing key', () => {
      process.env.EXISTING_KEY = 'value'

      const config = ConfigManager.getInstance()

      expect(config.has('EXISTING_KEY')).toBe(true)
    })

    it('should return false for missing key', () => {
      const config = ConfigManager.getInstance()

      expect(config.has('NONEXISTENT_KEY')).toBe(false)
    })

    it('should return false for undefined value', () => {
      const config = ConfigManager.getInstance()
      config.set('UNDEF_KEY', undefined)

      expect(config.has('UNDEF_KEY')).toBe(false)
    })
  })

  describe('getAll() method', () => {
    it('should return all configuration', () => {
      process.env.KEY1 = 'value1'
      process.env.KEY2 = 'value2'

      const config = ConfigManager.getInstance()
      const all = config.getAll()

      expect(all.KEY1).toBe('value1')
      expect(all.KEY2).toBe('value2')
    })

    it('should return immutable copy', () => {
      const config = ConfigManager.getInstance()
      const all1 = config.getAll()
      const all2 = config.getAll()

      expect(all1).not.toBe(all2)
    })
  })

  describe('createConfigManager helper', () => {
    it('should create typed config manager', () => {
      interface MyConfig {
        API_URL: string
        PORT: number
      }

      process.env.API_URL = 'https://api.example.com'
      process.env.PORT = '3000'

      const schema: MyConfig = {
        API_URL: '',
        PORT: 0
      }

      const config = createConfigManager(schema)

      expect(config.get('API_URL')).toBe('https://api.example.com')
      expect(config.get('PORT')).toBe('3000')
    })
  })

  describe('Integration Tests', () => {
    it('should work with full AppConfig type', () => {
      process.env.NODE_ENV = 'production'
      process.env.DATABASE_URL = 'postgresql://localhost/mydb'
      process.env.API_URL = 'https://api.example.com'

      const config = ConfigManager.getInstance<AppConfig>({
        required: ['DATABASE_URL', 'API_URL'],
        defaults: {
          PORT: 3000,
          LOG_LEVEL: 'info'
        }
      })

      expect(config.get('DATABASE_URL')).toBe('postgresql://localhost/mydb')
      expect(config.get('API_URL')).toBe('https://api.example.com')
      // Note: process.env values are always strings, even if defaults are numbers
      expect(config.get('PORT')).toBe(3000)  // From defaults
      expect(config.get('LOG_LEVEL')).toBe('info')  // From defaults
      expect(config.getEnv()).toBe('production')
    })

    it('should handle complex configuration scenario', () => {
      // Setup environment
      process.env.NODE_ENV = 'staging'
      process.env.DATABASE_URL = 'postgresql://staging/db'
      process.env.API_URL = 'https://staging.api.example.com'
      process.env.API_KEY = 'staging_key_12345'

      const config = ConfigManager.getInstance({
        env: 'staging',
        required: ['DATABASE_URL', 'API_URL', 'API_KEY'],
        defaults: {
          PORT: 4000,
          LOG_LEVEL: 'debug',
          API_TIMEOUT: 5000,
          DB_POOL_MIN: 2,
          DB_POOL_MAX: 10
        }
      })

      // Verify all values
      expect(config.getEnv()).toBe('staging')
      expect(config.get('DATABASE_URL')).toBe('postgresql://staging/db')
      expect(config.get('API_URL')).toBe('https://staging.api.example.com')
      expect(config.get('API_KEY')).toBe('staging_key_12345')
      // Note: defaults are applied if not in process.env
      expect(config.get('PORT')).toBe(4000)  // From defaults
      expect(config.get('LOG_LEVEL')).toBe('debug')  // From defaults

      // Verify has()
      expect(config.has('DATABASE_URL')).toBe(true)
      expect(config.has('NONEXISTENT')).toBe(false)

      // Verify getAll()
      const all = config.getAll()
      expect(all.DATABASE_URL).toBe('postgresql://staging/db')
      expect(all.PORT).toBe(4000)
    })

    it('should fail validation in production without required fields', () => {
      // Reset to ensure clean state
      ConfigManager.reset()
      process.env.NODE_ENV = 'production'
      // Remove any existing values
      delete process.env.DATABASE_URL
      delete process.env.API_URL
      delete process.env.API_KEY

      expect(() => {
        ConfigManager.getInstance({
          env: 'production',
          required: ['DATABASE_URL', 'API_URL', 'API_KEY']
        })
      }).toThrow('Missing required configuration')
    })
  })
})
