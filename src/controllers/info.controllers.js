const infoScraper = require("../scrapers/info")
const redis = require("../configs/redis")

const infoController = async (req, res, next) => {
  try {
    const id = req.query.id

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required"
      })
    }

    const cachedData = await redis.get(id)

    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        data: cachedData
      })
    }
    const results = await infoScraper(id)
    if (results == null) {
      return res.status(502).json({
        success: false,
        message: "info scraper returned no result"
      })
    }
    await redis.set(id, JSON.stringify(results), {
      ex: 10000
    })

    return res.json({
      success: true,
      cached: false,
      data: results
    })

  } catch (err) {
    next(err)
  }
}

module.exports = infoController
