const scraperMovies = require("../scrapers/movies.js")
const createCatalogController = require("./catalog.controller.js")

module.exports = createCatalogController({ kind: "movies", scraper: scraperMovies })
