const episodesScraper = require("../scrapers/episodes")
const redis = require("../configs/redis")


const episodeControllers = async (req, res, next) => {
    try {
        const { id, season } = req.query;
        const key = `${id}-${season}`
        const cachedData = await redis.get(key)
        if (cachedData) {
            return res.json({
                success: true,
                message: "Redis Found!!",
                results: cachedData
            })
        }
        const results = await episodesScraper(id, season)
        if (results == null) {
            return res.status(502).json({
                success: false,
                message: "episode scraper returned no result"
            })
        }
        await redis.set(key, results, {
            ex: 86400
        })
        res.json({
            success: true,
            message: "Data scraped!!",
            results
        })
    } catch (err) {
        next(err)
    }
}


module.exports = episodeControllers
