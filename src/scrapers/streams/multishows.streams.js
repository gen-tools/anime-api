const axios = require("axios");
const cheerio = require("cheerio");
const multishowsBaseUrl = require("../../utils/Base_V2.js") || "https://multishows.top";

/**
 * Scrapes streaming embed iframes from MultiShows (multishows.top).
 * Example URL: https://multishows.top/episode/jujutsu-kaisen/1-1
 */
const multishowsScraper = async (anime_id, season, episode) => {
  if (!anime_id) return [];

  const cleanSlug = String(anime_id)
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/^\/?(series|movies|episode|anime)\//, "")
    .replace(/\/+$/, "")
    .trim();

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: `${multishowsBaseUrl}/`,
  };

  const candidateUrls = [
    `${multishowsBaseUrl}/episode/${encodeURIComponent(cleanSlug)}/${season}-${episode}`,
    `${multishowsBaseUrl}/episode/${encodeURIComponent(cleanSlug)}-${season}x${episode}/`,
    `${multishowsBaseUrl}/episode/${encodeURIComponent(cleanSlug)}-season-${season}-episode-${episode}/`,
  ];

  for (const pageUrl of candidateUrls) {
    try {
      const response = await axios.get(pageUrl, {
        headers,
        timeout: 12000,
        validateStatus: (status) => status < 400,
      });

      const html = response.data;
      if (!html || typeof html !== "string") continue;

      const $ = cheerio.load(html);
      const results = [];
      const seenEmbeds = new Set();

      // 1. Extract from selectServer onclick handlers (e.g., Sony Yay Hindi dub, CR Audio, etc.)
      const selectMatches = [...html.matchAll(/selectServer\('([^']+)',\s*'([^']+)'\)/g)];
      for (const match of selectMatches) {
        let embed = match[1];
        let name = match[2].replace(/&amp;/g, "&").trim();
        if (embed && /^https?:\/\//i.test(embed) && !seenEmbeds.has(embed)) {
          seenEmbeds.add(embed);
          results.push({
            server: name || `Server ${results.length + 1}`,
            embed: embed.replace(/&#038;/g, "&"),
            type: "iframe",
          });
        }
      }

      // 2. Extract from iframes on the page
      $("iframe").each((_, el) => {
        let src = $(el).attr("src") || $(el).attr("data-src");
        if (!src) return;
        src = src.replace(/&#038;/g, "&").trim();

        if (src.startsWith("//")) {
          src = "https:" + src;
        }

        if (
          /^https?:\/\//i.test(src) &&
          !src.includes("about:blank") &&
          !seenEmbeds.has(src)
        ) {
          seenEmbeds.add(src);
          results.push({
            server: `Server ${results.length + 1}`,
            embed: src,
            type: "iframe",
          });
        }
      });

      if (results.length > 0) {
        console.warn(`[MultiShows] Found ${results.length} streams for ${cleanSlug} ${season}x${episode}`);
        return results;
      }
    } catch (err) {
      // Try next URL format
      continue;
    }
  }

  return [];
};

module.exports = multishowsScraper;
