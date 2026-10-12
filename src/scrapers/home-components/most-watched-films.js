const cheerio = require("cheerio");
const url = require("../../utils/Base_V1.js");
const { extractPathSlug, upstreamError } = require("../../utils/scraperUtils.js");
const { fetchAnimeSaltHtml } = require("../../utils/animeSaltProxy.js");

const Most_filmsScraper = async (homepageHtml) => {
    try {
        const data = typeof homepageHtml === "string" ? homepageHtml : await fetchAnimeSaltHtml(url);
        const $ = await cheerio.load(data);
        const results = [];
        $("#torofilm_wdgt_popular-5-all .chart-item").each((i, el) => {
            results.push({
                rank: $(el).find(".chart-number").text().trim(),
                title: $(el).find(".chart-title").text().trim(),
                anime_id: extractPathSlug($(el).find(".chart-poster").attr("href"), "movies"),
                poster: (function() {
                  const raw = $(el).find(".chart-poster img").attr("data-src") || $(el).find(".chart-poster img").attr("src") || "";
                  return raw.startsWith("//") ? "https:" + raw : raw;
                })()
            })
        })

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
        console.log(results);

    } catch (err) {
        const error = upstreamError("most-watched-films scraper", url, err);
        console.error(error.message);
        return { success: false, message: "Data not Available!!", results: [] };
    }

}
module.exports=Most_filmsScraper
