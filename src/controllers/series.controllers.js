const seriesScraper = require("../scrapers/series.js")
const createCatalogController = require("./catalog.controller.js")

module.exports = createCatalogController({ kind: "series", scraper: seriesScraper })
