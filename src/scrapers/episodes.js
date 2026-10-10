const cheerio = require("cheerio");
const baseUrl = require("../utils/Base_V5");
const { fetchAnimeSaltHtml } = require("../utils/animeSaltProxy");

const episodeScraper = async (slug, season = 1) => {
  try {
    const safeSlug = String(slug || "").trim();
    const seasonNumber = Number(season || 1);
    if (!/^[a-z0-9-]+$/i.test(safeSlug) || !Number.isSafeInteger(seasonNumber) || seasonNumber < 1) {
      return null;
    }
    const episodeUrl = `${baseUrl}/episode/${encodeURIComponent(safeSlug)}-${seasonNumber}x1/`;
    const data = await fetchAnimeSaltHtml(episodeUrl, { timeout: 12000 });

    const $ = cheerio.load(data);

    let episodes = [];

    $("#episode_by_temp li").each((i, el) => {
      const episodeNumber = $(el).find(".num-epi").text().trim();
      const title = $(el).find(".entry-title").text().trim();
      const [seasonPart, episodePart] = episodeNumber.split("x");
      const epNum = episodePart || seasonPart || String(i + 1);

      const imgTag = $(el).find("img");

      let image =
        imgTag.attr("data-src") ||
        imgTag.attr("data-lazy-src") ||
        imgTag.attr("data-original") ||
        imgTag.attr("src");

      if (image && image.startsWith("//")) {
        image = "https:" + image;
      }

      episodes.push({
        title,
        season: epNum, // Upstream convention: season field contains episode number
        episode: epNum,
        image,
      });
    });

    let seasons = [];
    $(".season-btn, a[data-season], .aa-cnt li a").each((i, el) => {
      const s = $(el).attr("data-season");
      const text = $(el).text().trim() || `Season ${s}`;
      if (s && !seasons.some((item) => item.season === s)) {
        seasons.push({
          season: s,
          text,
        });
      }
    });

    seasons.sort((a, b) => parseInt(a.season, 10) - parseInt(b.season, 10));

    const totalSeasons =
      seasons.length > 0 ? String(seasons.length) : $(".n_s").text().trim() || "1";

    const result = {
      totalSeasons,
      seasons,
      episodes,
    };

    return result;
  } catch (err) {
    console.error("Scraping Error:", err.message);
    return null;
  }
};

module.exports = episodeScraper;
