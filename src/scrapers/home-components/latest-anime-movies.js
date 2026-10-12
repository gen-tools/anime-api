const cheerio = require("cheerio");
const URL = require("../../utils/Base_V1.js");
const { extractPathSlug, upstreamError } = require("../../utils/scraperUtils.js");
const { fetchAnimeSaltHtml } = require("../../utils/animeSaltProxy.js");

async function scrapeAnimeMovies(homepageHtml) {
  try {
    const data = typeof homepageHtml === "string" ? homepageHtml : await fetchAnimeSaltHtml(URL);
    const $ = cheerio.load(data);

    const results = [];

    $(".latest-movies-series-swiper-slide").each((i, el) => {
      const li = $(el).find("li");

      // Only Anime Movies
      if (li.hasClass("type-movies") && li.hasClass("category-anime")) {
        const title = li.find("img").attr("alt")?.trim().replace("Image ", "") || null;
        const anime_id = extractPathSlug(li.find(".lnk-blk").attr("href"), "movies");
        const rawPoster = li.find("img").attr("data-src") || li.find("img").attr("src") || "";
        const poster = rawPoster
          ? (rawPoster.startsWith("//") ? "https:" + rawPoster : rawPoster)
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
