const { scrapeCatalogPage } = require("./catalogPage.js")

const seriesScraper = async (page = 1) => scrapeCatalogPage("series", page)

module.exports = seriesScraper
