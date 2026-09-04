const infoController = require("../controllers/info.controllers")
const express = require("express")

const infoRoute = express.Router()

infoRoute.get("/",infoController)

module.exports = infoRoute