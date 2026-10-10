const cheerio = require("cheerio")
const url = require("../utils/Base_V5.js")
const { extractPathSlug, upstreamError } = require("../utils/scraperUtils.js")
const { fetchAnimeSaltHtml } = require("../utils/animeSaltProxy.js")

const searchScraper = async (keyword, page = 1) => {
    const pageNumber = Number(page)
    if (!Number.isSafeInteger(pageNumber) || pageNumber < 1) {
        throw new TypeError("Search page must be a positive integer")
    }
    const searchUrl = new URL(url)
    searchUrl.searchParams.set("s", String(keyword).trim())
    if (pageNumber > 1) searchUrl.pathname = `/page/${pageNumber}/`
    let data

    try {
        data = await fetchAnimeSaltHtml(searchUrl.toString())
    } catch (err) {
        throw upstreamError("search scraper", searchUrl.toString(), err)
    }
    const $ = cheerio.load(data)
    const anime = []
    $("article.post").each((_, el) => {
        const article = $(el)
        const anchor = article.find("a.lnk-blk").first()
        const href = anchor.attr("href")
        let detailUrl
        try {
            detailUrl = href ? new URL(href, url) : null
        } catch {
            return
        }
        if (detailUrl && !["animesalt.cx", "www.animesalt.cx"].includes(detailUrl.hostname)) return
        const section = detailUrl?.pathname.split("/").filter(Boolean)[0]
        if (section !== "series" && section !== "movies") return

        const title = article.find("h2.entry-title").first().text().trim()
            || anchor.attr("title")?.trim()
            || article.find("img").first().attr("alt")?.replace(/^image\s+/i, "").trim()
            || ""
        const anime_id = extractPathSlug(href, section)
        const imgTag = article.find("img").first()
        let poster = imgTag.attr("data-src") || imgTag.attr("data-lazy-src")
            || imgTag.attr("data-original") || imgTag.attr("src") || null

        if (poster?.startsWith("data:")) poster = null
        if (poster?.startsWith("//")) poster = `https:${poster}`
        if (title && anime_id) anime.push({ title, anime_id, poster })
    })

    const currentText = Number($(".page-link.current").first().text().trim())
    const currentPage = Number.isSafeInteger(currentText) && currentText > 0 ? currentText : pageNumber
    const pageNumbers = [pageNumber]
    $(".page-link").each((_, el) => {
        const link = $(el)
        const textPage = Number(link.text().trim())
        if (Number.isSafeInteger(textPage) && textPage > 0) pageNumbers.push(textPage)
        const href = link.attr("href") || ""
        const match = href.match(/\/page\/(\d+)(?:\/|$)/)
        if (match) pageNumbers.push(Number(match[1]))
    })
    const totalPages = Math.max(...pageNumbers)

    const results = {
        currentPage,
        totalPages,
        results: anime
    }

    return results


}

module.exports = searchScraper
