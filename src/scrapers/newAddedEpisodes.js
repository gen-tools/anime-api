const { default: axios } = require("axios");
const cheerio = require("cheerio");
const url = require("../utils/Base_V5");
const headers = require("../configs/headers");
const { extractPathSlug, upstreamError } = require("../utils/scraperUtils");

const newAddedScraper = async () => {
    try {
        const requestUrl = `${url}/home/`;
        const { data } = await axios.get(requestUrl, {
            headers: headers,
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const results = [];

        $(".post-lst li").each((_, el) => {

            const episodeCode = $(el).find(".num-epi").text().trim();
            if (!episodeCode) return;

            const [season, episode] = episodeCode.split("x");

            const fullTitle = $(el).find(".entry-title").text().trim();
            const title = fullTitle.replace(/\s\d+x\d+$/, "");

            const href = $(el).find("a.lnk-blk").attr("href");

            let anime_id = extractPathSlug(href, "episode");

            anime_id = anime_id?.replace(/[-]?\d+x\d+$/, "");

            const imgTag = $(el).find("img");

            let poster =
                imgTag.attr("data-src") ||
                imgTag.attr("data-lazy-src") ||
                imgTag.attr("data-original") ||
                imgTag.attr("src");

            if (poster && poster.startsWith("data:image")) {
                poster = null;
            }

            if (poster && poster.startsWith("//")) {
                poster = "https:" + poster;
            }

            results.push({
                title,
                anime_id,
                season,
                episode,
                poster
            });
        });

        return results;

    } catch (err) {
        const error = upstreamError("new-added scraper", `${url}/home/`, err);
        console.error(error.message);
        throw error;
    }
};

module.exports = newAddedScraper;
