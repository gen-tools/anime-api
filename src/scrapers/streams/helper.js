const axios = require("axios");
const cheerio = require("cheerio");
const url = require("../../utils/Base_V5")
const header = require("../../configs/headers")
async function scrapePlayers(anime_id) {
    const urlsToTry = [
        `${url}/movies/${anime_id}/`,
        `${url}/movies/${anime_id}`,
    ];
    let data;
    for (const pageUrl of urlsToTry) {
        try {
            const response = await axios.get(pageUrl, {
                headers: header,
                timeout: 10000
            });
            data = response.data;
            if (data) break;
        } catch (e) {
            continue;
        }
    }

    if (!data) return [];

    const $ = cheerio.load(data);

    const embedLinks = [];
    $("aside.video-player iframe").each((i, el) => {

        let src = $(el).attr("src") || $(el).attr("data-src");

        if (src) {
            src = src.replace(/&#038;/g, "&");
            embedLinks.push(src);
        }

    });
    const results = [];

    for (const link of embedLinks) {

        try {

            const { data } = await axios.get(link, {
                headers: header,
                timeout: 10000
            });

            const $$ = cheerio.load(data);

            const realIframe = $$("iframe").attr("src");

            if (realIframe) {

                results.push({
                    iframe: realIframe
                });

            }

        } catch (e) {
            continue;
        }

    }
    return results;

}
module.exports = scrapePlayers;
