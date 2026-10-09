const { scrapeCatalogPage } = require("./catalogPage.js")

const moviesScraper = async (page = 1) => scrapeCatalogPage("movies", page)

module.exports = moviesScraper
