const axios = require("axios");
const cheerio = require("cheerio");
const url = require("../../utils/Base_V5.js");
const default_Header = require("../../configs/headers.js");
const multishowsScraper = require("./multishows.streams.js");

const logStreamStage = (stage, details) => {
    console.warn(`[ToonStream] ${stage}`, details);
};

const toonstreamScraper = async (anime_id, season, episode) => {
    // 1. Try primary AnimeSalt scraper
    const episodeUrl = `${url}/episode/${encodeURIComponent(anime_id)}-${season}x${episode}/`;

    try {
        const customHeaders = {
            ...default_Header,
            Referer: `${url}/`,
        };

        const response = await axios.get(episodeUrl, {
            headers: customHeaders,
            timeout: 10000,
            validateStatus: () => true,
        });

        const data = response.data;

        if (response.status === 200 && data) {
            const $ = cheerio.load(data);
            const servers = [];
            const seen = new Set();

            $("#aa-options div.video, .video-player div.video").each((_, el) => {
                let iframe =
                    $(el).find("iframe").attr("src") ||
                    $(el).find("iframe").attr("data-src");

                if (!iframe) return;

                iframe = iframe.replace(/&#038;/g, "&").trim();
                if (iframe.startsWith("//")) iframe = "https:" + iframe;

                if (!/^https?:\/\//i.test(iframe) || seen.has(iframe)) {
                    return;
                }

                seen.add(iframe);
                servers.push({
                    server: $(el).attr("id") || `options-${servers.length}`,
                    embed: iframe,
                    type: "iframe"
                });
            });

            if (servers.length > 0) {
                logStreamStage("provider iframes found on AnimeSalt", {
                    episodeUrl,
                    providerCount: servers.length,
                });
                return servers;
            }
        } else {
            console.warn(`[ToonStream] AnimeSalt returned status ${response.status} for ${episodeUrl}. Falling back to MultiShows...`);
        }
    } catch (err) {
        console.warn(`[ToonStream] AnimeSalt fetch failed (${err.message}). Falling back to MultiShows...`);
    }

    // 2. Secondary fallback: MultiShows (not blocked by Cloudflare on cloud datacenters)
    try {
        const msResults = await multishowsScraper(anime_id, season, episode);
        if (msResults && msResults.length > 0) {
            return msResults;
        }
    } catch (msErr) {
        console.warn(`[ToonStream] MultiShows fallback error:`, msErr.message);
    }

    return [];
};

module.exports = toonstreamScraper;
