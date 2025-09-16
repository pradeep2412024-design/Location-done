// Market data caching utility
class MarketDataCache {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.maxCacheSize = 100
  }

  // Generate cache key
  generateKey(crop, location, state, month) {
    return `${crop}-${location}-${state}-${month}`.toLowerCase().replace(/\s+/g, '-')
  }

  // Get cached data
  get(crop, location, state, month) {
    const key = this.generateKey(crop, location, state, month)
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    
    // Remove expired entry
    if (cached) {
      this.cache.delete(key)
    }
    
    return null
  }

  // Set cached data
  set(crop, location, state, month, data) {
    const key = this.generateKey(crop, location, state, month)
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // Clear cache
  clear() {
    this.cache.clear()
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      timeout: this.cacheTimeout
    }
  }
}

// Global cache instance
const marketCache = new MarketDataCache()

export default marketCache
