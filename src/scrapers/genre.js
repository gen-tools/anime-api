const { default: axios } = require("axios")
const cheerio = require("cheerio")
const url = require("../utils/Base_V5.js")
const Header = require("../configs/headers.js")
const { extractPathSlug, upstreamError } = require("../utils/scraperUtils.js")

const genreScraper = async (genre, page = 1) => {
    try {
        // Map special names to correct slugs
        const genreMap = {
            "action & adventure": "action-adventure",
            "sci-fi & fantasy": "sci-fi-fantasy",
            "martial art": "martial-art",
            "sci-fi": "sci-fi"
        };
        
        let slug = genre.toLowerCase().trim();
        if (genreMap[slug]) {
            slug = genreMap[slug];
        } else {
            slug = slug.replace(/\s+/g, '-');
        }

        const fetchUrl = `${url}/category/${slug}/page/${page}/`
        console.log("Fetching Genre URL:", fetchUrl);
        
        const { data } = await axios.get(fetchUrl, { headers: Header, timeout: 10000 })
        const $ = await cheerio.load(data)
        const anime = []
        
        // Try multiple selectors
        const items = $(".movies-list li").length ? $(".movies-list li") : $("#aa-movies li");
        
        items.each((_, el) => {
            const title = $(el).find(".entry-title, h2").text().trim()
            const anime_id = extractPathSlug($(el).find("a").attr("href"))
            const imgTag = $(el).find("img");
            let poster = imgTag.attr("data-src") || imgTag.attr("src");
            
            if (poster && poster.startsWith("//")) {
                poster = "https:" + poster;
            }
            if (title && anime_id) {
                anime.push({ title, anime_id, poster })
            }
        })

        return {
            success: true,
            currentPage: page,
            results: anime
        }
    } catch (err) {
        const error = upstreamError("genre scraper", `${url}/category/${genre}/page/${page}/`, err)
        console.error(error.message);
        return { success: false, results: [], error: error.message }
    }
}
module.exports = genreScraper
