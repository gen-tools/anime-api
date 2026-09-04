const redis = require("../configs/redis.js");
const newAddedEpisode = require("../scrapers/newAddedEpisodes");

const newAddedController = async (req, res) => {
    try {
        const cacheKey = "newadded";

        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.json({
                success: true,
                results: cachedData
            });
        }

        const results = await newAddedEpisode();
        if (results == null) {
            return res.status(502).json({
                success: false,
                message: "new-added scraper returned no result"
            });
        }

        await redis.set(cacheKey, JSON.stringify(results), {
            ex: 300
        });

        res.json({
            success: true,
            message: "Data Found!!",
            results
        });
    } catch (error) {
        console.error(error);
        res.status(error.response?.status || 502).json({
            success: false,
            message: "Unable to fetch new-added episodes from upstream",
            error: error.message
        });
    }
};

module.exports = newAddedController;
