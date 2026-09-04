const moviesController = require("../controllers/movies.controllers")
const express = require("express")



const moviesRoute = express.Router()

moviesRoute.get("/",moviesController)

module.exports = moviesRoute