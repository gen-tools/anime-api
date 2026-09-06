const { Redis } = require("@upstash/redis")

let redisClient = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch (err) {
    console.warn("Failed to initialize Upstash Redis:", err.message)
  }
}

// Resilient wrapper: if redis is not configured or errors, return null so API routes can scrape directly without crashing
const safeRedis = {
  get: async (key) => {
    if (!redisClient) return null
    try {
      return await redisClient.get(key)
    } catch (err) {
      console.warn(`Redis GET error for key ${key}:`, err.message)
      return null
    }
  },
  set: async (key, value, options) => {
    if (!redisClient) return null
    try {
      return await redisClient.set(key, value, options)
    } catch (err) {
      console.warn(`Redis SET error for key ${key}:`, err.message)
      return null
    }
  },
  del: async (key) => {
    if (!redisClient) return null
    try {
      return await redisClient.del(key)
    } catch (err) {
      console.warn(`Redis DEL error for key ${key}:`, err.message)
      return null
    }
  }
}

module.exports = safeRedis