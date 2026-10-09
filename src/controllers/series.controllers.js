const seriesScraper = require("../scrapers/series.js")

const seriesController = async (req, res) => {
  const page = req.query.page || 1
  const results = await seriesScraper(page)

  if (!results || !Array.isArray(results.results) || results.results.length === 0) {
    const pageNumber = Number(page)
    return res.status(502).json({
      success: false,
      message: "Data not found !!",
      results: {
        currentPage: Number.isSafeInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
        totalPages: 1,
        results: [],
      },
    })
  }

  return res.json({
    success: true,
    message: "Data found !!",
    results,
  })
}

module.exports = seriesController
