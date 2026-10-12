const home = require("../scrapers/home.js")
const redis = require("../configs/redis.js")

const HOME_CACHE_KEY = "apihome"
const HOME_RETRY_KEY = "apihome:refresh-lock"
const HOME_FRESH_SECONDS = 10_000
const HOME_MAX_AGE_SECONDS = 24 * 60 * 60
const HOME_RETRY_SECONDS = 30
const HOME_LOCK_WAIT_MS = 500
const HOME_LOCK_POLL_MS = 50
const HOME_SECTIONS = [
  "fresh_drops",
  "latest_animeMovies",
  "mostWatched_Films",
  "mostWatched_Series",
  "on_air_series",
]

let homepageRefreshInFlight = null

const parseStoredValue = (value) => {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const isValidHomepage = (value) =>
  value?.success === true &&
  value.results &&
  HOME_SECTIONS.every((section) =>
    Array.isArray(value.results[section]) &&
    value.results[section].length > 0 &&
    value.results[section].every((item) =>
      typeof item?.title === "string" && item.title.trim() &&
      typeof item?.anime_id === "string" && item.anime_id.trim()
    )
  )

const readHomepageCache = (value) => {
  const parsed = parseStoredValue(value)
  if (parsed?.version === 1 && isValidHomepage(parsed.data)) {
    const storedAt = Number(parsed.storedAt)
    return Number.isFinite(storedAt) && storedAt > 0 && storedAt <= Date.now()
      ? { data: parsed.data, storedAt }
      : null
  }

  // Existing apihome entries contain the response directly and expire after
  // HOME_FRESH_SECONDS, so a valid legacy value is still fresh while present.
  if (isValidHomepage(parsed)) return { data: parsed, storedAt: Date.now() }
  return null
}

const staleResponse = (res, entry) => res.json({
  success: true,
  cached: true,
  data: entry.data,
})

const waitForHomepageCache = async () => {
  const deadline = Date.now() + HOME_LOCK_WAIT_MS
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, HOME_LOCK_POLL_MS))
    const entry = readHomepageCache(await redis.get(HOME_CACHE_KEY))
    if (entry && (Date.now() - entry.storedAt) / 1000 < HOME_MAX_AGE_SECONDS) return entry
  }
  return null
}

const refreshHomepage = () => {
  if (homepageRefreshInFlight) return homepageRefreshInFlight

  const flight = (async () => {
    let result = null
    try {
      const scraped = await home()
      if (isValidHomepage(scraped)) result = scraped
    } catch (err) {
      console.error("[home-cache] homepage refresh failed:", err?.name || "Error")
    }

    if (result) {
      const storedAt = Date.now()
      await redis.set(HOME_CACHE_KEY, JSON.stringify({ version: 1, storedAt, data: result }), {
        ex: HOME_MAX_AGE_SECONDS,
      })
    }
    return result
  })().finally(() => {
    if (homepageRefreshInFlight === flight) homepageRefreshInFlight = null
  })

  homepageRefreshInFlight = flight
  return flight
}

const homeController = async (req, res) => {
  let cachedEntry = null
  try {
    const cachedValue = await redis.get(HOME_CACHE_KEY)
    cachedEntry = readHomepageCache(cachedValue)
    if (cachedValue != null && !cachedEntry) await redis.del(HOME_CACHE_KEY)
    const ageSeconds = cachedEntry ? (Date.now() - cachedEntry.storedAt) / 1000 : Infinity

    if (cachedEntry && ageSeconds < HOME_FRESH_SECONDS) {
      return staleResponse(res, cachedEntry)
    }

    if (homepageRefreshInFlight) {
      const sharedResult = await refreshHomepage()
      if (sharedResult) return res.json({ success: true, cached: false, data: sharedResult })
      if (cachedEntry && ageSeconds < HOME_MAX_AGE_SECONDS) return staleResponse(res, cachedEntry)
      return res.status(502).json({ success: false, message: "home scraper returned no result" })
    }

    if (await redis.get(HOME_RETRY_KEY)) {
      if (cachedEntry && ageSeconds < HOME_MAX_AGE_SECONDS) return staleResponse(res, cachedEntry)
      const completedEntry = await waitForHomepageCache()
      if (completedEntry) return staleResponse(res, completedEntry)
      return res.status(502).json({ success: false, message: "home scraper returned no result" })
    }

    // NX makes the short refresh lease atomic across API instances. If Redis
    // is unavailable, the in-process promise below still coalesces local calls.
    const acquired = await redis.setIfAbsent(HOME_RETRY_KEY, "1", { ex: HOME_RETRY_SECONDS })
    if (acquired === false) {
      if (homepageRefreshInFlight) {
        const sharedResult = await refreshHomepage()
        if (sharedResult) return res.json({ success: true, cached: false, data: sharedResult })
      }
      const latestEntry = readHomepageCache(await redis.get(HOME_CACHE_KEY))
      if (latestEntry && (Date.now() - latestEntry.storedAt) / 1000 < HOME_MAX_AGE_SECONDS) {
        return staleResponse(res, latestEntry)
      }
      const completedEntry = await waitForHomepageCache()
      if (completedEntry) return staleResponse(res, completedEntry)
      return res.status(502).json({ success: false, message: "home scraper returned no result" })
    }

    const results = await refreshHomepage()
    if (results) return res.json({ success: true, cached: false, data: results })

    if (cachedEntry && ageSeconds < HOME_MAX_AGE_SECONDS) return staleResponse(res, cachedEntry)
    return res.status(502).json({ success: false, message: "home scraper returned no result" })
  } catch (err) {
    console.error("[home-cache] homepage controller failed:", err?.name || "Error")
    if (cachedEntry && (Date.now() - cachedEntry.storedAt) / 1000 < HOME_MAX_AGE_SECONDS) {
      return staleResponse(res, cachedEntry)
    }
    return res.status(502).json({ success: false, message: "home scraper returned no result" })
  }
}

module.exports = homeController
