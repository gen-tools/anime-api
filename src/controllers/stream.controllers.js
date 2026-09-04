const toonStream = require("../scrapers/streams/ToonStream.js");
const redis = require("../configs/redis.js")
const toonstreamController = async (req, res) => {
    try {
        const { id, season, ep } = req.query;
        const key = `${id}-${season}x${ep}`

        if (!id || !season || !ep) {
            return res.status(400).json({
                success: false,
                message: "Missing required query parameters (id, season, ep)"
            });
        }
        const cachedData = await redis.get(key)
        if(cachedData){
            res.json({
                success:true,
                message: "Stream Found!!",
                results: cachedData
            })
        }
        const results = await toonStream(id, season, ep) || [];

        await redis.set(key,JSON.stringify(results),{
            ex: 86400
        })

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Data Not Found!!",
                results: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Data Found!!",
            results
        });

    } catch (err) {
        console.error("Controller Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = toonstreamController;