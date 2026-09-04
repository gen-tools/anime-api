const { default: axios } = require("axios")
const cheerio = require("cheerio")
const url = require("../utils/Base_V5.js")
const Header = require("../configs/headers.js")
const { extractPathSlug, upstreamError } = require("../utils/scraperUtils.js")

const moviesScraper = async (page = 1) => {
    const requestUrl = `${url}/movies/page/${page}/`
    let data
    try {
        ({ data } = await axios.get(requestUrl, { headers: Header, timeout: 10000 }))
    } catch (err) {
        throw upstreamError("movies scraper", requestUrl, err)
    }
    const $ = await cheerio.load(data)
    const anime = []
    $("li.movies").each((_, el) => {
        const title = $(el).find("h2.entry-title").text().trim()
        const anime_id = extractPathSlug($(el).find("a.lnk-blk").attr("href"), "movies")
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
        anime.push({ title, anime_id, poster })
    })


    const currentPage = Number($(".current").text().trim())


    let totalPages = 1;
    $(".page-link").each((_, el) => {
        let pageNum = $(el).text().trim()
        if (!isNaN(pageNum)) {
            totalPages = Math.max(totalPages, pageNum)
        }
    })

    const results = {
        currentPage,
        totalPages,
        results: anime
    }
    return results


}
module.exports = moviesScraper
