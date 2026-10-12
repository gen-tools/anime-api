const assert = require("node:assert/strict")
const Module = require("node:module")
const path = require("node:path")
const { test } = require("node:test")

const root = path.resolve(__dirname, "..")

function installMock(filename, exports) {
  const previous = require.cache[filename]
  const mocked = new Module(filename, module)
  mocked.filename = filename
  mocked.loaded = true
  mocked.exports = exports
  require.cache[filename] = mocked
  return () => {
    if (previous) require.cache[filename] = previous
    else delete require.cache[filename]
  }
}

function listingHtml(kind, page = 1, totalPages = 38) {
  return `<!doctype html><html><body>
    <article class="post">
      <a class="lnk-blk" href="https://animesalt.cx/${kind}/verified-${page}/">
        <img data-src="https://images.example/poster-${page}.jpg" alt="Verified title ${page}">
        <h2 class="entry-title">Verified title ${page}</h2>
      </a>
    </article>
    <a class="page-link current" href="https://animesalt.cx/${kind}/page/${page}/">${page}</a>
    <a class="page-link" href="https://animesalt.cx/${kind}/page/${totalPages}/">${totalPages}</a>
  </body></html>`
}

async function withAxios(get, callback) {
  const axiosPath = require.resolve("axios")
  const restoreAxios = installMock(axiosPath, { get })
  const scraperPath = path.join(root, "src/scrapers/catalogPage.js")
  const previousScraper = require.cache[scraperPath]
  delete require.cache[scraperPath]
  try {
    await callback(require(scraperPath))
  } finally {
    delete require.cache[scraperPath]
    if (previousScraper) require.cache[scraperPath] = previousScraper
    restoreAxios()
  }
}

test("catalog scraper requests the active restricted Worker and parses real HTML listing entries", async () => {
  let requestUrl
  await withAxios(async (url) => {
    requestUrl = new URL(url)
    return {
    status: 200,
    data: listingHtml("series", 2, 38),
    headers: { "content-type": "text/html; charset=UTF-8" },
    }
  }, async ({ scrapeCatalogPage }) => {
    const catalog = await scrapeCatalogPage("series", 2)
    assert.equal(requestUrl.origin, "https://wispy-cherry-6934.sheztech.workers.dev")
    assert.equal(requestUrl.pathname, "/catalog")
    assert.equal(requestUrl.searchParams.get("kind"), "series")
    assert.equal(requestUrl.searchParams.get("page"), "2")
    assert.equal(catalog.currentPage, 2)
    assert.equal(catalog.totalPages, 38)
    assert.deepEqual(catalog.results, [{
      title: "Verified title 2",
      anime_id: "verified-2",
      poster: "https://images.example/poster-2.jpg",
    }])
  })
})

test("series and movie HTML listings retain their own kind and pagination", async () => {
  for (const [kind, totalPages] of [["series", 38], ["movies", 23]]) {
    await withAxios(async () => ({
      status: 200,
      data: listingHtml(kind, 1, totalPages),
      headers: { "content-type": "text/html; charset=UTF-8" },
    }), async ({ scrapeCatalogPage }) => {
      const catalog = await scrapeCatalogPage(kind, 1)
      assert.equal(catalog.totalPages, totalPages)
      assert.equal(catalog.results[0].anime_id, "verified-1")
    })
  }
})

test("upstream 404 is surfaced as a scrape failure and is not parsed as empty successful data", async () => {
  await withAxios(async () => {
    throw Object.assign(new Error("Request failed with status code 404"), {
      response: { status: 404, headers: { "content-type": "text/html" }, data: "not found" },
    })
  }, async ({ scrapeCatalogPage }) => {
    await assert.rejects(scrapeCatalogPage("series", 1), /HTTP 404/)
  })
})

test("catalog 404 without a last-good page returns unavailable and caches no failed data", async () => {
  const redis = memoryRedis()
  await withCatalogController(redis, async () => { throw new Error("series scraper: HTTP 404") }, async (controller) => {
    const response = responseRecorder()
    await controller({ query: { page: "1" } }, response)
    assert.equal(response.statusCode, 502)
    assert.deepEqual(response.body, { success: false, message: "Catalog temporarily unavailable" })
    assert.equal(redis.values.has("catalog:v1:series:1"), false)
    assert.equal(redis.values.get("catalog:v1:series:1:retry-after"), "1")
  })
})

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    set(name, value) { this.headers[name] = value; return this },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return body },
  }
}

function memoryRedis(seed = {}, now = () => Date.now()) {
  const values = new Map(Object.entries(seed))
  const expires = new Map()
  return {
    values,
    async get(key) {
      const expiry = expires.get(key)
      if (expiry != null && expiry <= now()) values.delete(key)
      return values.get(key) ?? null
    },
    async set(key, value, options = {}) {
      values.set(key, value)
      if (options.ex != null) expires.set(key, now() + options.ex * 1000)
      return "OK"
    },
    async del(key) { expires.delete(key); return values.delete(key) ? 1 : 0 },
  }
}

async function withCatalogController(redis, scraper, callback) {
  const redisPath = path.join(root, "src/configs/redis.js")
  const controllerPath = path.join(root, "src/controllers/catalog.controller.js")
  const restoreRedis = installMock(redisPath, redis)
  const previousController = require.cache[controllerPath]
  delete require.cache[controllerPath]
  try {
    await callback(require(controllerPath)({ kind: "series", scraper }))
  } finally {
    delete require.cache[controllerPath]
    if (previousController) require.cache[controllerPath] = previousController
    restoreRedis()
  }
}

test("catalog 404 keeps last-good data and a later successful scrape recovers", async () => {
  let now = Date.now()
  const lastGood = {
    currentPage: 1,
    totalPages: 38,
    results: [{ title: "Previously verified", anime_id: "previous", poster: null }],
  }
  const redis = memoryRedis({
    "catalog:v1:series:1": { catalog: lastGood, storedAt: now - 50_000_000 },
  }, () => now)
  let calls = 0
  await withCatalogController(redis, async () => {
    calls += 1
    if (calls === 1) throw new Error("series scraper: HTTP 404")
    return { currentPage: 1, totalPages: 38, results: [{ title: "Recovered", anime_id: "recovered" }] }
  }, async (controller) => {
    const staleResponse = responseRecorder()
    await controller({ query: { page: "1" } }, staleResponse)
    assert.equal(staleResponse.statusCode, 200)
    assert.equal(staleResponse.headers["X-Catalog-Cache"], "stale")
    assert.deepEqual(staleResponse.body.results.results, lastGood.results)

    now += 30_001
    const recoveredResponse = responseRecorder()
    await controller({ query: { page: "1" } }, recoveredResponse)
    assert.equal(recoveredResponse.statusCode, 200)
    assert.equal(recoveredResponse.body.results.results[0].anime_id, "recovered")
    assert.equal(calls, 2)
  })
})
