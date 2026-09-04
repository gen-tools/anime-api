const genreScraper = require("../scrapers/genre")

const genreController = async (req, res, next) => {
  try {
    const genre = req.query.id
    const page = req.query.page || 1
    
    if (!genre) {
      res.status(400).json({ success: false, message: "Genre ID is required" })
      return
    }

    const results = await genreScraper(genre, page)
    
    res.json({
      success: true,
      results
    })

  } catch (err) {
    next(err)
  }
}

module.exports = genreController
