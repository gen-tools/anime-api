const { default: axios } = require("axios");
const cheerio = require("cheerio");
const url = require("../../utils/Base_V1.js"); // make sure this exports a string URL
const headers = require("../../configs/headers.js");
const { extractPathSlug, upstreamError } = require("../../utils/scraperUtils.js");

const freshdropScraper = async () => {
  try {
    const { data } = await axios.get(url, { headers, timeout: 10000 });
    const $ = cheerio.load(data);
    const results = [];

    $(".latest-ep-swiper-slide").each((i, el) => {
      const title = $(el).find(".entry-title").text().trim();
      const anime_id = extractPathSlug($(el).find(".lnk-blk").attr("href"), "series");
      const poster = "https:" + $(el).find("img").attr("data-src");
      const season = $(el).find(".post-ql").text().replace("Season","").trim();
      const episode = $(el).find(".year").text().trim().replace("EP:","");

      results.push({ title, anime_id, poster, season, episode });
    });
    var dato
    if (!results.length) {
      dato = {
        success: false,
        message: "Data not Available!!",
        results: results
      }
    }else{
      dato={
        success: true,
        message: "Data Available",
        results: results
      }
    }
    return dato
    console.log(results);
  } catch (err) {
    const error = upstreamError("fresh-drops scraper", url, err);
    console.error(error.message);
    return { success: false, message: "Data not Available!!", results: [] };
  }
};

module.exports= freshdropScraper
