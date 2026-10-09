const scraperMovies = require("../scrapers/movies")
const redis = require("../configs/redis")

const hasCatalogItems = (catalog) =>
    Array.isArray(catalog?.results) && catalog.results.length > 0

const moviesController = async (req, res, next) => {
    try {
        const page = req.query.page || 1
        const key = `movie-${page}`
        const cachedData = await redis.get(key)
        if (hasCatalogItems(cachedData)) {
            console.info("[catalog-cache]", JSON.stringify({
                kind: "movies",
                page: String(page),
                status: "hit",
                itemCount: cachedData.results.length,
            }))
            return res.json({
                success: true,
                results: cachedData
            })
        }

        // Ignore/remove empty legacy entries; they must never mask a fresh scrape.
        if (cachedData) {
            console.info("[catalog-cache]", JSON.stringify({
                kind: "movies",
                page: String(page),
                status: "discard-empty",
                itemCount: Array.isArray(cachedData.results) ? cachedData.results.length : 0,
            }))
            await redis.del(key)
        } else {
            console.info("[catalog-cache]", JSON.stringify({
                kind: "movies",
                page: String(page),
                status: "miss",
            }))
        }

        const results = await scraperMovies(page)
        if (!hasCatalogItems(results)) {
            return res.status(502).json({
                success: false,
                message: "movies scraper returned no result"
            })
        }
        await redis.set(key, results, {
            ex: 45000
        })
        res.json({
            success: true,
            results
        })
    } catch (err) {
        next(err)
    }
}

module.exports = moviesController
