const moviesStream = require("../scrapers/streams/movies")
const redis = require("../configs/redis")

const moviesStreamController = async(req,res,next)=>{
    try{
        const anime_id = req.query.id
        if (!anime_id) {
            return res.status(400).json({
                success: false,
                message: "id query param is required",
                results: {}
            })
        }

        const cacheKey = `movie-info:${anime_id}`
        const catchData = await redis.get(cacheKey)
        if(catchData){
            const parsedResults = typeof catchData === "string" ? JSON.parse(catchData) : catchData
            return res.json({
                success: true,
                message: "data found",
                results: parsedResults
            })
        }

        const results = await moviesStream(anime_id)
        
        if (results) {
            await redis.set(cacheKey, JSON.stringify(results), {
                ex: 86400
            })
        }

        return res.json({
            success: results ? true : false,
            message: results ? "data found" : "data not found",
            results: results || {}
        })
    }catch(err){
        next(err)
    }
}

module.exports = moviesStreamController
