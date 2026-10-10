const searchScraper = require("../scrapers/search")
const redis = require("../configs/redis")
const searchController = async (req, res, next) => {
  try {
    const keyword = req.query.s
    const page = req.query.page || 1
    const key = (`${keyword}-${page}`)
    if (!keyword) {
      res.status(400)
      throw new Error("Keyword is required")
    }
    const cachedValue = await redis.get(key)
    let cachedData = cachedValue
    if (typeof cachedData === "string") {
      try {
        cachedData = JSON.parse(cachedData)
      } catch {
        cachedData = null
      }
    }
    if (Array.isArray(cachedData?.results) && cachedData.results.length > 0) {
      return res.json({
        success: true,
        results: cachedData
      })
    }
    if (cachedValue) await redis.del(key)

    const results = await searchScraper(keyword, page)
    if (results == null) {
      throw new Error("search controller: scraper returned no result")
    }
    if (Array.isArray(results.results) && results.results.length > 0) {
      await redis.set(key, JSON.stringify(results), { ex: 120 })
    }
    res.json({
      success: true,
      mmessage: "Data Found!!",
      results
    })

  } catch (err) {
    next(err)
  }
}

module.exports = searchController
