const axios = require("axios");
const cheerio = require("cheerio");
const URL = require("../../utils/Base_V1.js");
const headers = require("../../configs/headers.js");
const { extractPathSlug, upstreamError } = require("../../utils/scraperUtils.js");

async function scrapeAnimeMovies() {
  try {
    const { data } = await axios.get(URL, { headers, timeout: 10000 });
    const $ = cheerio.load(data);

    const results = [];

    $(".latest-movies-series-swiper-slide").each((i, el) => {
      const li = $(el).find("li");

      // Only Anime Movies
      if (li.hasClass("type-movies") && li.hasClass("category-anime")) {
        const title = li.find("img").attr("alt")?.trim().replace("Image ", "") || null;
        const anime_id = extractPathSlug(li.find(".lnk-blk").attr("href"), "movies");
        const poster = li.find("img").attr("data-src")
          ? "https:" + li.find("img").attr("data-src")
          : null;
        results.push({ title, anime_id, poster });
      }
    });
    var dato
    if (!results.length) {
      dato = {
        success: false,
        message: "Data not Available!!",
        results: results
      }
    } else {
      dato = {
        success: true,
        message: "Data Available",
        results: results
      }
    }
    return dato

    console.log("🎬 Anime Movies:", results);
  } catch (err) {
    const error = upstreamError("latest-anime-movies scraper", URL, err);
    console.error(error.message);
    return { success: false, message: "Data not Available!!", results: [] };
  }
}

module.exports= scrapeAnimeMovies;
