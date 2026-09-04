const moviesStreamController = require("../controllers/moviesStream.controllers")
const express = require("express")

const moviesStreamRoute = express.Router()

moviesStreamRoute.get("/",moviesStreamController)

module.exports = moviesStreamRoute