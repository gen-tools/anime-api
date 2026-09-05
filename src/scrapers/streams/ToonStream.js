const axios = require("axios");
const cheerio = require("cheerio");
const url = require("../../utils/Base_V5.js");
const default_Header = require("../../configs/headers.js");

const logStreamStage = (stage, details) => {
    console.warn(`[ToonStream] ${stage}`, details);
};

const toonstreamScraper = async (anime_id, season, episode) => {
    const episodeUrl = `${url}/episode/${encodeURIComponent(anime_id)}-${season}x${episode}`;

    try {
        const response = await axios.get(episodeUrl, {
            headers: default_Header,
            timeout: 15000,
            validateStatus: () => true,
        });

        const data = response.data;

        console.warn("[ToonStream DEBUG] AnimeSalt response", {
            episodeUrl,
            status: response.status,
            contentType: response.headers["content-type"],
            htmlLength: String(data || "").length,
        });

        if (response.status !== 200) {
            console.warn("[ToonStream DEBUG] AnimeSalt non-200", {
                episodeUrl,
                status: response.status,
                preview: String(data).slice(0, 300),
            });

            return [];
        }

        const $ = cheerio.load(data);
        console.warn("[ToonStream DEBUG] AnimeSalt HTML", {
            episodeUrl,
            iframeCount: $("iframe").length,
            optionsCount: $("#aa-options > div.video").length,
        });

        $("iframe").each((i, el) => {
            console.warn("[ToonStream DEBUG] iframe", {
                index: i,
                src: $(el).attr("src"),
                dataSrc: $(el).attr("data-src"),
            });
        });
        const servers = [];

        $("#aa-options > div.video").each((_, el) => {
            let iframe =
                $(el).find("iframe").attr("src") ||
                $(el).find("iframe").attr("data-src");

            if (!iframe) return;

            iframe = iframe.replace(/&#038;/g, "&");

            if (!/^https?:\/\//i.test(iframe)) {
                return;
            }

            servers.push({
                server: $(el).attr("id") || "unknown",
                link: iframe
            });
        });

        if (servers.length === 0) {
            logStreamStage("no provider iframe found", {
                episodeUrl,
                selector: "#aa-options > div.video iframe"
            });

            return [];
        }

        logStreamStage("provider iframes found", {
            episodeUrl,
            providerCount: servers.length,
            providers: servers
        });

        /*
         * The provider iframe is already the playable player.
         *
         * Do NOT request the provider URL from the backend and
         * attempt to extract another iframe/video element.
         *
         * The provider's JavaScript initializes the actual player
         * in the user's browser.
         */
        const results = servers.map((server) => ({
            server: server.server,
            embed: server.link,
            type: "iframe"
        }));

        return results;

    } catch (err) {
        logStreamStage("episode page request failed", {
            episodeUrl,
            status: err.response?.status || null,
            error: err.message
        });

        return [];
    }
};

module.exports = toonstreamScraper;
