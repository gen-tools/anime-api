const axios = require("axios");
const cheerio = require("cheerio");
const url = require("../../utils/Base_V5.js");
const default_Header = require("../../configs/headers.js");
const multishowsScraper = require("./multishows.streams.js");

const CF_PROXY =
  process.env.CF_PROXY_URL ||
  "https://wispy-cherry-6934.shahazaibseo038.workers.dev/?url=";

const logStreamStage = (stage, details) => {
  console.warn(`[ToonStream] ${stage}`, details);
};

function extractServersFromHtml(html) {
  if (!html || typeof html !== "string") return [];
  const $ = cheerio.load(html);
  const servers = [];
  const seen = new Set();

  $("#aa-options div.video, .video-player div.video, aside.video-player iframe").each(
    (_, el) => {
      let iframe =
        $(el).find("iframe").attr("src") ||
        $(el).find("iframe").attr("data-src") ||
        $(el).attr("src") ||
        $(el).attr("data-src");

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
        type: "iframe",
      });
    }
  );

  return servers;
}

const toonstreamScraper = async (anime_id, season, episode) => {
  const episodeUrl = `${url}/episode/${encodeURIComponent(anime_id)}-${season}x${episode}/`;

  // 1. Try direct AnimeSalt request
  try {
    const customHeaders = {
      ...default_Header,
      Referer: `${url}/`,
    };

    const response = await axios.get(episodeUrl, {
      headers: customHeaders,
      timeout: 8000,
      validateStatus: (status) => status < 400,
    });

    if (response.data) {
      const servers = extractServersFromHtml(response.data);
      if (servers.length > 0) {
        logStreamStage("Direct AnimeSalt servers found", {
          episodeUrl,
          providerCount: servers.length,
        });
        return servers;
      }
    }
  } catch (err) {
    console.warn(`[ToonStream] Direct AnimeSalt failed (${err.message}). Trying Cloudflare Worker proxy...`);
  }

  // 2. Cloudflare Worker Proxy (Bypasses Cloudflare 403 on cloud hosts like Vercel)
  try {
    const proxyUrl = `${CF_PROXY}${encodeURIComponent(episodeUrl)}`;
    const proxyRes = await axios.get(proxyUrl, {
      timeout: 10000,
    });

    if (proxyRes.data) {
      const servers = extractServersFromHtml(proxyRes.data);
      if (servers.length > 0) {
        logStreamStage("Cloudflare Worker proxy servers found", {
          episodeUrl,
          providerCount: servers.length,
        });
        return servers;
      }
    }
  } catch (proxyErr) {
    console.warn(`[ToonStream] Cloudflare Worker proxy failed (${proxyErr.message}). Trying MultiShows fallback...`);
  }

  // 3. MultiShows fallback
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
