const cheerio = require("cheerio")
const Header = require("../configs/headers.js")
const { extractPathSlug, upstreamError } = require("../utils/scraperUtils.js")

const CATALOG_WORKER_URL = "https://wispy-cherry-6934.sheztech.workers.dev/catalog"
const ARTICLE_SELECTOR = "article.post"

const responseHeader = (headers, name) =>
  headers?.get?.(name) || headers?.[name.toLowerCase()] || headers?.[name] || null

const safeErrorMessage = (error) =>
  String(error?.message || "Unknown error")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/(authorization|cookie|token|api[_-]?key)[=:]\s*[^\s,;]+/gi, "$1=[redacted]")
    .slice(0, 180)

const logDiagnostic = (event, fields) => {
  console.info(`[catalog-scraper] ${JSON.stringify({ event, ...fields })}`)
}

const normalizePage = (page) => {
  const value = Number(page ?? 1)
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError("Catalog page must be a positive integer")
  }
  return value
}

const extractCatalogSlug = (href, kind) => {
  if (!href) return null

  try {
    const detailUrl = new URL(href, "https://animesalt.cx")
    if (
      detailUrl.protocol !== "https:" ||
      !["animesalt.cx", "www.animesalt.cx"].includes(detailUrl.hostname)
    ) {
      return null
    }

    const segments = detailUrl.pathname.split("/").filter(Boolean)
    if (segments[0] !== kind || !segments[1]) return null
    return extractPathSlug(detailUrl.toString(), kind)
  } catch {
    return null
  }
}

const normalizePoster = (poster) => {
  if (!poster || poster.startsWith("data:")) return null
  return poster.startsWith("//") ? `https:${poster}` : poster
}

const parseCatalogHtml = (html, kind, requestedPage, responseHeaders = null) => {
  if (/<rss\b/i.test(html)) {
    const $ = cheerio.load(html, { xmlMode: true })
    const items = []

    $("item").each((_, element) => {
      const item = $(element)
      const title = item.find("title").first().text().trim()
      const href = item.find("link").first().text().trim()
      const animeId = extractCatalogSlug(href, kind)
      if (!animeId || !title) return
      items.push({ title, anime_id: animeId, poster: null })
    })

    const reportedTotalPages = Number(responseHeader(responseHeaders, "x-catalog-total-pages"))
    const reportedPageSize = Number(responseHeader(responseHeaders, "x-catalog-page-size"))
    const hasReportedTotal = Number.isSafeInteger(reportedTotalPages) && reportedTotalPages > 0
    const hasReportedPageSize = Number.isSafeInteger(reportedPageSize) && reportedPageSize > 0
    const totalPages = hasReportedTotal
      ? reportedTotalPages
      : items.length > 0 && (!hasReportedPageSize || items.length >= reportedPageSize)
        ? requestedPage + 1
        : requestedPage

    return {
      catalog: { currentPage: requestedPage, totalPages, results: items },
      diagnostics: {
        articleCount: 0,
        feedItemCount: $("item").length,
        parsedItemCount: items.length,
        paginationLinkCount: 0,
        paginationValueCount: hasReportedTotal ? 1 : 0,
        totalPages,
      },
    }
  }

  const $ = cheerio.load(html)
  const articles = $(ARTICLE_SELECTOR)
  const items = []

  articles.each((_, element) => {
    const article = $(element)
    const anchor = article.find("a.lnk-blk").first()
    const href = anchor.attr("href")
    const animeId = extractCatalogSlug(href, kind)
    const image = article.find("img").first()
    const imageAlt = image.attr("alt")?.replace(/^image\s+/i, "").trim()
    const title =
      article.find("h2.entry-title").first().text().trim() ||
      anchor.attr("title")?.trim() ||
      imageAlt ||
      ""
    const poster = normalizePoster(
      image.attr("data-src") ||
        image.attr("data-lazy-src") ||
        image.attr("data-original") ||
        image.attr("src")
    )

    if (!animeId || !title) return
    items.push({ title, anime_id: animeId, poster })
  })

  const pageLinks = $(".page-link")
  const pageNumbers = [requestedPage]
  pageLinks.each((_, element) => {
    const link = $(element)
    const textPage = Number(link.text().trim())
    if (Number.isSafeInteger(textPage) && textPage > 0) pageNumbers.push(textPage)

    const href = link.attr("href") || ""
    const match = href.match(new RegExp(`/${kind}/page/(\\d+)(?:/|$)`))
    if (match) pageNumbers.push(Number(match[1]))
  })

  const currentText = Number($(".page-link.current").first().text().trim())
  const currentPage = Number.isSafeInteger(currentText) && currentText > 0
    ? currentText
    : requestedPage
  const totalPages = Math.max(...pageNumbers)

  return {
    catalog: { currentPage, totalPages, results: items },
    diagnostics: {
      articleCount: articles.length,
      parsedItemCount: items.length,
      paginationLinkCount: pageLinks.length,
      paginationValueCount: pageNumbers.length - 1,
      totalPages,
    },
  }
}

const scrapeCatalogPage = async (kind, page = 1) => {
  if (kind !== "series" && kind !== "movies") {
    throw new TypeError("Catalog kind must be series or movies")
  }

  const pageNumber = normalizePage(page)
  const upstreamPath = `/${kind}/page/${pageNumber}/`
  const workerUrl = new URL(CATALOG_WORKER_URL)
  workerUrl.searchParams.set("kind", kind)
  workerUrl.searchParams.set("page", String(pageNumber))

  let response
  try {
    const axiosModule = require("axios")
    const axios = axiosModule.default || axiosModule
    response = await axios.get(workerUrl.toString(), {
      headers: Header,
      timeout: 10000,
      responseType: "text",
    })
  } catch (error) {
    const headers = error?.response?.headers
    const responseData = error?.response?.data
    const responseLength = typeof responseData === "string"
      ? Buffer.byteLength(responseData, "utf8")
      : Buffer.isBuffer(responseData)
        ? responseData.length
        : null

    logDiagnostic("upstream-error", {
      kind,
      page: pageNumber,
      upstreamPath,
      status: error?.response?.status || null,
      contentType: responseHeader(headers, "content-type"),
      contentLength: responseLength ?? responseHeader(headers, "content-length"),
      server: responseHeader(headers, "x-catalog-upstream-server") || responseHeader(headers, "server"),
      cfRay: responseHeader(headers, "x-catalog-upstream-cf-ray") || responseHeader(headers, "cf-ray"),
      errorName: error?.name || "Error",
      errorMessage: safeErrorMessage(error),
    })
    throw upstreamError(`${kind} scraper`, workerUrl.toString(), error)
  }

  const html = typeof response.data === "string" ? response.data : String(response.data ?? "")
  const parsed = parseCatalogHtml(html, kind, pageNumber, response.headers)
  const contentLength = Buffer.byteLength(html, "utf8")
  const hasItems = parsed.catalog.results.length > 0

  logDiagnostic("parsed", {
    kind,
    page: pageNumber,
    upstreamPath,
    status: response.status,
    contentType: responseHeader(response.headers, "content-type"),
    contentLength,
    server: responseHeader(response.headers, "x-catalog-upstream-server") || responseHeader(response.headers, "server"),
    cfRay: responseHeader(response.headers, "x-catalog-upstream-cf-ray") || responseHeader(response.headers, "cf-ray"),
    ...parsed.diagnostics,
    returnedItemCount: hasItems ? parsed.catalog.results.length : 0,
  })

  return hasItems ? parsed.catalog : null
}

module.exports = { scrapeCatalogPage, parseCatalogHtml, normalizePage }
