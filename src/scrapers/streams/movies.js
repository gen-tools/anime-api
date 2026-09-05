const { default: axios } = require("axios");
const cheerio = require("cheerio")
const url = require("../../utils/Base_V5.js")
const header = require("../../configs/headers")
const helper = require("./helper")

const infiScraper = async (anime_id) => {
    try {
        if (!anime_id) return null;
        const cleanId = anime_id.replace(/\/$/, "");
        const urlsToTry = [
            `${url}/movies/${cleanId}/`,
            `${url}/movies/${cleanId}`,
            `${url}/${cleanId}/`,
            `${url}/${cleanId}`
        ];

        let data, fetchUrl;
        for (const testUrl of urlsToTry) {
            try {
                const response = await axios.get(testUrl, { headers: header, timeout: 10000 });
                if (response?.data) {
                    data = response.data;
                    fetchUrl = testUrl;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!data) {
            return null;
        }

        const $ = await cheerio.load(data)
        const title = $(".fg1 .entry-title, .entry-title, h1, .name").first().text().trim()
            || $('meta[property="og:title"]').attr("content")?.trim()
        if (!title) return null;

        const descriptionDiv = $(".description, .synopsis, #edit-2");
        const overview = descriptionDiv.find("p").first().text().trim() || $(".wp-content p").first().text().trim();

        const languages = [];
        $('.language-list a, .language a, .mvic-info p:contains("Language") a').each((i, el) => {
            languages.push($(el).text().trim());
        });

        const run_time = $(".duration, .runtime, .runtime-info").text().trim()
            || $('.description p:contains("Running time")').text().replace("Running time:", "").trim()
        const genres = $(".genres a, .genre a").map((i, el) => $(el).text().trim()).get();
        const year = $(".year, .date").text().trim() || $('meta[property="movie:release_date"]').attr("content")?.slice(0, 4) || ""
        const rating = $(".vote-cn .vote, .imdb-rating, .rating-info").text().replace(/TMDB|IMDB/g, "").trim()
        
        const imgTag = $(".dfxb img, .poster img, .mvic-thumb img");
        let poster = imgTag.attr("data-src") || imgTag.attr("src") || imgTag.attr("data-lazy-src");
        if (poster && poster.startsWith("//")) {
            poster = "https:" + poster;
        } else if (poster && !poster.startsWith("http")) {
            poster = url + (poster.startsWith("/") ? "" : "/") + poster;
        }
        if (!poster) {
            poster = $('meta[property="og:image"]').attr("content") || ""
        }

        const stream = await helper(cleanId)
        
        const results = {
            title,
            anime_id: cleanId,
            poster,
            overview,
            languages,
            run_time,
            genres,
            year,
            rating,
            stream
        }
        return results
    } catch (err) {
        return null;
    }
}
module.exports = infiScraper
