const freshDrops = require("./home-components/freshDrops.js")
const latest_animeMovies = require("./home-components/latest-anime-movies.js")
const most_watched_Films = require("./home-components/most-watched-films.js")
const most_watched_Series = require("./home-components/most-watched-series.js")
const on_air_series = require("./home-components/on-air-series.js")
const url = require("../utils/Base_V1.js")
const { fetchAnimeSaltHtml } = require("../utils/animeSaltProxy.js")

const home = async()=>{
    let homepageHtml
    try {
        homepageHtml = await fetchAnimeSaltHtml(url)
    } catch (err) {
        console.error("[home-scraper] AnimeSalt homepage fetch failed:", err?.name || "Error")
        return {
            success: false,
            message: "Data Not Found!!",
            results: {
                fresh_drops: [],
                latest_animeMovies: [],
                mostWatched_Films: [],
                mostWatched_Series: [],
                on_air_series: []
            }
        }
    }

    const [fresh, latest, mostFilms, mostSeries, onAir] = await Promise.all([
        freshDrops(homepageHtml),
        latest_animeMovies(homepageHtml),
        most_watched_Films(homepageHtml),
        most_watched_Series(homepageHtml),
        on_air_series(homepageHtml)
    ])
    
    var results={
        fresh_drops: fresh.results,
        latest_animeMovies: latest.results,
        mostWatched_Films: mostFilms.results,
        mostWatched_Series: mostSeries.results,
        on_air_series: onAir.results
    }
    let dato
    if([fresh, latest, mostFilms, mostSeries, onAir].some((component) => !component || !component.success)){
        dato = {
            success: false,
            message: "Data Not Found!!",
            results: results        
        }
    }else{
        dato = {
            success: true,
            message: "Data Found!!",
            results: results
        }
    }
    
    return dato
}

module.exports = home
