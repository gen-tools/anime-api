const episodeControllers = require("../controllers/episode.controllers")
const express = require("express")

const episodeRoute = express.Router()

episodeRoute.get("/",episodeControllers)

module.exports = episodeRoute
