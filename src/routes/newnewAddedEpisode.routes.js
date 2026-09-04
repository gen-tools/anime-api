const newAddedController = require("../controllers/newaddedEpisode")
const express = require("express")

const newaddedRoute = express.Router()

newaddedRoute.get("/",newAddedController)

module.exports = newaddedRoute