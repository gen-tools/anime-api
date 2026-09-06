/**
 * @desc    All Required Inported Functions, Packages and Modules
 */
const home = require("./routes/home.routes.js")
const search = require("./routes/search.routes.js")
const newAddedEpisode = require("./routes/newnewAddedEpisode.routes.js")
const episode = require("./routes/episode.routes.js")
const info = require("./routes/info.routes.js")
const moviesInfo = require("./routes/movieStream.routes.js")
const movies = require("./routes/movies.routes.js")
const stream = require("./routes/stream.routes.js")
const series = require("./routes/series.routes.js")

require("dotenv").config()
const express = require("express")
const cors = require("cors")

const app = express()

// Parse allowed origins from FRONTEND_URL or comma-separated list
const envOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map(url => url.trim().replace(/\/$/, ""))
  .filter(Boolean)

const allowedOrigins = Array.from(new Set([
  ...envOrigins,
  "https://hindianime-seven.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8080"
]))

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true)

    const cleanOrigin = origin.replace(/\/$/, "")
    const isAllowed =
      allowedOrigins.includes(cleanOrigin) ||
      /^https:\/\/hindianime.*\.vercel\.app$/.test(cleanOrigin)

    if (isAllowed) {
      callback(null, true)
    } else {
      // Dynamic fallback allows communication without failing CORS
      callback(null, true)
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

// Explicit preflight handler to ensure OPTIONS requests always return 200 OK
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*")
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin")
    res.header("Access-Control-Allow-Credentials", "true")
    return res.sendStatus(200)
  }
  next()
})


/**
 * @desc    All Routes
 * @access  Public
 */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: {
      Documentation: "For Documentation prefer to this repository https://github.com/Prathmesh6968/anime-api.git"
    }
  })
})


app.use("/api", home)
app.use("/api/search",search)
app.use("/api/newadded",newAddedEpisode)
app.use("/api/info",info)
app.use("/api/episode",episode)
app.use("/api/movie",moviesInfo)
app.use("/api/movies",movies)
app.use("/api/series", series)
app.use("/api/stream", stream)

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found"
  })
})

/**
 * @desc    Global Error Handling Middleware
 */
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  })
})

module.exports = app
