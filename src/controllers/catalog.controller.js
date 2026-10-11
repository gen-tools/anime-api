const redis = require("../configs/redis")

const FRESH_SECONDS = 45_000
const STALE_SECONDS = 7 * 24 * 60 * 60
const RETRY_COOLDOWN_SECONDS = 30

const hasCatalogItems = (catalog) =>
  Array.isArray(catalog?.results) && catalog.results.length > 0

const parseValue = (value) => {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const cachedEntry = (value) => {
  const parsed = parseValue(value)
  if (hasCatalogItems(parsed?.catalog)) {
    return { data: parsed.catalog, storedAt: Number(parsed.storedAt) || 0 }
  }
  if (hasCatalogItems(parsed)) {
    // Legacy movie cache values contain the catalog object directly.
    return { data: parsed, storedAt: Date.now() }
  }
  return null
}

const responseBody = (kind, data) => kind === "series"
  ? { success: true, message: "Data found !!", results: data }
  : { success: true, results: data }

const emptyBody = (kind, page) => kind === "series"
  ? {
      success: false,
      message: "Data not found !!",
      results: { currentPage: page, totalPages: 1, results: [] },
    }
  : { success: false, message: "movies scraper returned no result" }

const unavailableBody = { success: false, message: "Catalog temporarily unavailable" }

const createCatalogController = ({ kind, scraper }) => async (req, res) => {
  const page = Number(req.query.page || 1)
  if (!Number.isSafeInteger(page) || page < 1) {
    return res.status(400).json({ success: false, message: "Page must be a positive integer" })
  }

  const key = `catalog:v1:${kind}:${page}`
  const retryKey = `${key}:retry-after`
  const legacyMovieKey = kind === "movies" ? `movie-${page}` : null
  let lastGood = cachedEntry(await redis.get(key))

  if (lastGood && Date.now() - lastGood.storedAt < FRESH_SECONDS * 1000) {
    console.info("[catalog-cache]", JSON.stringify({ kind, page, status: "fresh-hit", itemCount: lastGood.data.results.length }))
    return res.json(responseBody(kind, lastGood.data))
  }

  if (!lastGood && legacyMovieKey) {
    const legacy = cachedEntry(await redis.get(legacyMovieKey))
    if (legacy) {
      lastGood = legacy
      await redis.set(key, { catalog: legacy.data, storedAt: legacy.storedAt }, { ex: STALE_SECONDS })
      console.info("[catalog-cache]", JSON.stringify({ kind, page, status: "legacy-hit", itemCount: legacy.data.results.length }))
      return res.json(responseBody(kind, legacy.data))
    }
  }

  if (await redis.get(retryKey)) {
    if (lastGood) {
      res.set("X-Catalog-Cache", "stale")
      console.info("[catalog-cache]", JSON.stringify({ kind, page, status: "stale-refresh-throttled", itemCount: lastGood.data.results.length }))
      return res.json(responseBody(kind, lastGood.data))
    }
    return res.status(502).json(unavailableBody)
  }

  await redis.set(retryKey, "1", { ex: RETRY_COOLDOWN_SECONDS })

  try {
    const results = await scraper(page)
    if (!hasCatalogItems(results)) {
      if (lastGood) {
        res.set("X-Catalog-Cache", "stale")
        console.warn("[catalog-cache]", JSON.stringify({ kind, page, status: "stale-served-empty-refresh", itemCount: lastGood.data.results.length }))
        return res.json(responseBody(kind, lastGood.data))
      }
      return res.status(502).json(emptyBody(kind, page))
    }

    const storedAt = Date.now()
    await redis.set(key, { catalog: results, storedAt }, { ex: STALE_SECONDS })
    await redis.del(retryKey)
    if (legacyMovieKey) await redis.set(legacyMovieKey, results, { ex: FRESH_SECONDS })
    console.info("[catalog-cache]", JSON.stringify({ kind, page, status: "refreshed", itemCount: results.results.length }))
    return res.json(responseBody(kind, results))
  } catch (error) {
    if (lastGood) {
      res.set("X-Catalog-Cache", "stale")
      console.warn("[catalog-cache]", JSON.stringify({ kind, page, status: "stale-served-error", itemCount: lastGood.data.results.length, errorName: error?.name || "Error" }))
      return res.json(responseBody(kind, lastGood.data))
    }

    console.error("[catalog-cache]", JSON.stringify({ kind, page, status: "unavailable", errorName: error?.name || "Error" }))
    return res.status(502).json(unavailableBody)
  }
}

module.exports = createCatalogController
