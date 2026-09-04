const { default: axios } = require("axios");
const cheerio = require("cheerio");
const url = require("../utils/Base_V5");
const header = require("../configs/headers");

const infiScraper = async (anime_id) => {
    try {
        const { data } = await axios.get(`${url}/series/${anime_id}/`, { headers: header });
        const $ = cheerio.load(data);

        const title = $(".fg1 .entry-title").text().trim();
        const descriptionDiv = $(".description");

        const overview = descriptionDiv.find("p").first().text().trim();
        const details = descriptionDiv.find("p").slice(1);

        let language, quality, runningTime;

        details.each((i, el) => {
            const text = $(el).text().trim();
            if (text.includes("Language:")) language = text.replace("Language:", "").trim();
            if (text.includes("Quality:")) quality = text.replace("Quality:", "").trim();
            if (text.includes("Running time:")) runningTime = text.replace("Running time:", "").trim();
        });

        const genres = $(".genres a").map((i, el) => $(el).text().trim()).get();
        const year = $(".year").text().trim();
        const seasons = $(".seasons").text().trim().replace("Seasons", "").trim();
        const episodes = $(".entry-meta .episodes").text().trim().replace("Episodes", "").trim();
        const rating = $(".vote-cn .vote").text().replace("TMDB", "").trim();
        let poster = $(".post-thumbnail img").attr("src")
        poster = "https:" + poster
        const  results = {
            title,
            anime_id,
            poster,
            overview,
            language,
            quality,
            runningTime,
            genres,
            year,
            seasons,
            episodes,
            rating,
        };

        return results;

    } catch (err) {
        console.error(err);
    }
};

module.exports = infiScraper;