const { default: axios } = require("axios");
const cheerio = require("cheerio");
const url = require("../../utils/Base_V1.js");
const headers = require("../../configs/headers.js");
const { extractPathSlug, upstreamError } = require("../../utils/scraperUtils.js");

const Most_seriesScraper = async () => {
    try {
        const { data } = await axios.get(url, { headers, timeout: 10000 });
        const $ = await cheerio.load(data);
        const results = [];
        $("#torofilm_wdgt_popular-3-all .chart-item").each((i, el) => {
            results.push({
                rank: $(el).find(".chart-number").text().trim(),
                title: $(el).find(".chart-title").text().trim(),
                anime_id: extractPathSlug($(el).find(".chart-poster").attr("href"), "series"),
                poster: $(el).find(".chart-poster img").attr("data-src").replace("//", "https://")
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
        const error = upstreamError("most-watched-series scraper", url, err);
        console.error(error.message);
        return { success: false, message: "Data not Available!!", results: [] };
    }

}
module.exports=Most_seriesScraper
