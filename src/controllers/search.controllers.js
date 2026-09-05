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
    const cachedData = await redis.get(key)
    if(cachedData){
      return res.json({
        success: true,
        results: cachedData
      })
    }
    const results = await searchScraper(keyword, page)
    if (results == null) {
      throw new Error("search controller: scraper returned no result")
    }
    await redis.set(key,JSON.stringify(results),{
      ex: 120
    })
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
