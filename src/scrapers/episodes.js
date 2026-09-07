const axios = require("axios");
const cheerio = require("cheerio");
const baseUrl = require("../utils/Base_V5");
const headers = require("../configs/headers");

const PROXY_URL = "https://wispy-cherry-6934.shahazaibseo038.workers.dev/?url=";

const episodeScraper = async (slug, season = 1) => {
  try {
    const url = `${baseUrl}/episode/${slug}-${season}x1/`;

    let data;
    try {
      const res = await axios.get(url, { headers, timeout: 8000 });
      data = res.data;
    } catch {
      // Cloudflare worker proxy fallback for resilient scraping
      const proxyRes = await axios.get(`${PROXY_URL}${encodeURIComponent(url)}`, {
        headers,
        timeout: 12000,
      });
      data = proxyRes.data;
    }

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