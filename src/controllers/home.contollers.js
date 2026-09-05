const home = require("../scrapers/home.js")
const redis = require("../configs/redis.js")

const homeController = async(req,res)=>{
    const homei = "apihome"
    const cachedData = await redis.get(homei)
    if(cachedData){
        return res.json({
        success: true,
        cached: true,
        data: cachedData
      })
    }
    const results = await home()
    if (results == null) {
      return res.status(502).json({
        success: false,
        message: "home scraper returned no result"
      })
    }
    await redis.set(homei,JSON.stringify(results),{
        ex:10000
    })

    return res.json({
      success: true,
      cached: false,
      data: results
    })
}
module.exports = homeController
