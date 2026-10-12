const assert = require("node:assert/strict")
const Module = require("node:module")
const path = require("node:path")
const { test } = require("node:test")

const root = path.resolve(__dirname, "..")

function installMock(relativePath, exports) {
  const filename = path.join(root, relativePath)
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

async function withHomeModules({ fetchHtml, components }, callback) {
  const restores = []
  const homePath = path.join(root, "src/scrapers/home.js")
  const oldHome = require.cache[homePath]
  delete require.cache[homePath]

  restores.push(installMock("src/utils/Base_V1.js", "https://animesalt.test/"))
  restores.push(installMock("src/utils/animeSaltProxy.js", { fetchAnimeSaltHtml: fetchHtml }))
  for (const [name, fn] of Object.entries(components)) {
    restores.push(installMock(`src/scrapers/home-components/${name}.js`, fn))
  }

  try {
    const home = require(homePath)
    await callback(home)
  } finally {
    delete require.cache[homePath]
    if (oldHome) require.cache[homePath] = oldHome
    for (const restore of restores.reverse()) restore()
  }
}

function validSections(prefix = "item") {
  return {
    fresh_drops: [{ title: `${prefix}-fresh`, anime_id: "fresh", poster: "fresh.jpg", season: "1", episode: "1" }],
    latest_animeMovies: [{ title: `${prefix}-movie`, anime_id: "movie", poster: "movie.jpg" }],
    mostWatched_Films: [{ title: `${prefix}-film`, anime_id: "film", poster: "film.jpg", rank: "1" }],
    mostWatched_Series: [{ title: `${prefix}-series`, anime_id: "series", poster: "series.jpg", rank: "1" }],
    on_air_series: [{ title: `${prefix}-airing`, anime_id: "airing", poster: "airing.jpg" }],
  }
}

const successfulComponents = Object.fromEntries(
  ["freshDrops", "latest-anime-movies", "most-watched-films", "most-watched-series", "on-air-series"]
    .map((name) => [name, async () => ({ success: true, results: [{ title: name }] })])
)

function installControllerModules({ home, redis }) {
  const controllerPath = path.join(root, "src/controllers/home.contollers.js")
  const oldController = require.cache[controllerPath]
  delete require.cache[controllerPath]
  const restoreHome = installMock("src/scrapers/home.js", home)
  const restoreRedis = installMock("src/configs/redis.js", redis)
  const controller = require(controllerPath)
  return () => {
    delete require.cache[controllerPath]
    if (oldController) require.cache[controllerPath] = oldController
    restoreRedis()
    restoreHome()
  }
}

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return body },
  }
}

function memoryRedis(seed = {}, now = () => Date.now()) {
  const values = new Map(Object.entries(seed))
  const expirations = new Map()
  const writes = []
  const deletes = []
  const expireIfNeeded = (key) => {
    const expiresAt = expirations.get(key)
    if (expiresAt != null && expiresAt <= now()) {
      values.delete(key)
      expirations.delete(key)
    }
  }
  return {
    values,
    writes,
    expirations,
    deletes,
    async get(key) { expireIfNeeded(key); return values.get(key) ?? null },
    async set(key, value, options = {}) {
      writes.push({ key, value, options })
      values.set(key, value)
      if (options.ex != null) expirations.set(key, now() + options.ex * 1000)
      return "OK"
    },
    async setIfAbsent(key, value, options = {}) {
      expireIfNeeded(key)
      if (values.has(key)) return false
      writes.push({ key, value, options, nx: true })
      values.set(key, value)
      if (options.ex != null) expirations.set(key, now() + options.ex * 1000)
      return true
    },
    async del(key) { deletes.push(key); expirations.delete(key); return values.delete(key) ? 1 : 0 },
  }
}

test("homepage scrape fetches once and shares identical HTML across all five section parsers", async () => {
  let fetchCount = 0
  const seenHtml = []
  const componentNames = ["freshDrops", "latest-anime-movies", "most-watched-films", "most-watched-series", "on-air-series"]
  const components = Object.fromEntries(componentNames.map((name) => [name, async (html) => {
    seenHtml.push(html)
    return { success: true, results: [{ title: name }] }
  }]))

  await withHomeModules({ fetchHtml: async () => { fetchCount += 1; return "one-homepage-document" }, components }, async (home) => {
    const result = await home()
    assert.equal(fetchCount, 1)
    assert.deepEqual(seenHtml, Array(5).fill("one-homepage-document"))
    assert.equal(result.success, true)
    assert.deepEqual(Object.keys(result.results), [
      "fresh_drops", "latest_animeMovies", "mostWatched_Films", "mostWatched_Series", "on_air_series",
    ])
    assert.equal(result.results.fresh_drops[0].title, "freshDrops")
    assert.equal(result.results.on_air_series[0].title, "on-air-series")
  })
})

test("failed homepage fetch returns the existing empty section shape without retries", async () => {
  let fetchCount = 0
  let parserCount = 0
  const components = Object.fromEntries(Object.keys(successfulComponents).map((name) => [name, async () => {
    parserCount += 1
    return { success: true, results: [{ title: name }] }
  }]))
  await withHomeModules({
    fetchHtml: async () => { fetchCount += 1; throw Object.assign(new Error("blocked"), { name: "AxiosError" }) },
    components,
  }, async (home) => {
    const result = await home()
    assert.equal(fetchCount, 1)
    assert.equal(parserCount, 0)
    assert.equal(result.success, false)
    assert.deepEqual(result.results, {
      fresh_drops: [], latest_animeMovies: [], mostWatched_Films: [], mostWatched_Series: [], on_air_series: [],
    })
  })
})

test("concurrent cold homepage requests share one scrape and preserve response data", async () => {
  let calls = 0
  let release
  const gate = new Promise((resolve) => { release = resolve })
  const expected = { success: true, message: "Data Found!!", results: validSections("same") }
  const redis = memoryRedis()
  const restore = installControllerModules({
    home: async () => { calls += 1; await gate; return expected },
    redis,
  })
  try {
    const controller = require(path.join(root, "src/controllers/home.contollers.js"))
    const first = responseRecorder()
    const second = responseRecorder()
    const firstDone = controller({}, first)
    const secondDone = controller({}, second)
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(calls, 1)
    release()
    await Promise.all([firstDone, secondDone])
    assert.equal(first.statusCode, 200)
    assert.equal(second.statusCode, 200)
    assert.deepEqual(first.body, { success: true, cached: false, data: expected })
    assert.deepEqual(second.body, { success: true, cached: false, data: expected })
    const saved = JSON.parse(redis.values.get("apihome"))
    assert.deepEqual(saved.data, expected)
    assert.equal(redis.values.get("apihome:refresh-lock"), "1")
    const leaseRemaining = redis.expirations.get("apihome:refresh-lock") - Date.now()
    assert.ok(leaseRemaining <= 30_000 && leaseRemaining > 29_000)
    assert.equal(redis.deletes.includes("apihome:refresh-lock"), false)
  } finally {
    restore()
  }
})

test("cold request losing a Redis lease waits for the shared cache instead of returning immediately", async () => {
  let calls = 0
  const expected = { success: true, message: "Data Found!!", results: validSections("other-instance") }
  const redis = memoryRedis({ "apihome:refresh-lock": "active" })
  const restore = installControllerModules({ home: async () => { calls += 1; return expected }, redis })
  try {
    const controller = require(path.join(root, "src/controllers/home.contollers.js"))
    const response = responseRecorder()
    const startedAt = Date.now()
    const pending = controller({}, response)
    setTimeout(() => {
      redis.values.set("apihome", JSON.stringify({ version: 1, storedAt: Date.now(), data: expected }))
    }, 90)
    await pending
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.body, { success: true, cached: true, data: expected })
    assert.ok(Date.now() - startedAt >= 50)
    assert.equal(calls, 0)
    assert.equal(redis.values.get("apihome:refresh-lock"), "active")
  } finally {
    restore()
  }
})

test("expired Redis refresh lease can be acquired with the configured 30-second expiry", async () => {
  let now = Date.now()
  let calls = 0
  const redis = memoryRedis({ "apihome:refresh-lock": "expired-owner" }, () => now)
  redis.expirations.set("apihome:refresh-lock", now - 1)
  const expected = { success: true, message: "Data Found!!", results: validSections("after-expiry") }
  const restore = installControllerModules({ home: async () => { calls += 1; return expected }, redis })
  try {
    const controller = require(path.join(root, "src/controllers/home.contollers.js"))
    const response = responseRecorder()
    await controller({}, response)
    assert.equal(response.statusCode, 200)
    assert.equal(calls, 1)
    const lease = redis.writes.find((write) => write.key === "apihome:refresh-lock")
    assert.deepEqual(lease.options, { ex: 30 })
    assert.equal(lease.nx, true)
    assert.equal(redis.expirations.get("apihome:refresh-lock"), now + 30_000)
  } finally {
    restore()
  }
})

test("failed and empty scrapes are not cached; a later valid scrape recovers", async () => {
  let calls = 0
  let now = Date.now()
  const redis = memoryRedis({}, () => now)
  const expected = { success: true, message: "Data Found!!", results: validSections("recovered") }
  const restore = installControllerModules({
    home: async () => {
      calls += 1
      if (calls === 1) return { success: false, message: "Data Not Found!!", results: validSections("failed") }
      if (calls === 2) return { success: true, message: "Data Found!!", results: { ...validSections("empty"), on_air_series: [] } }
      return expected
    },
    redis,
  })
  try {
    const controller = require(path.join(root, "src/controllers/home.contollers.js"))
    const failed = responseRecorder()
    await controller({}, failed)
    assert.equal(failed.statusCode, 502)
    assert.equal(redis.values.has("apihome"), false)

    // A failed refresh retains only the expiring lease; no cache or permanent lock.
    const empty = responseRecorder()
    await controller({}, empty)
    assert.equal(empty.statusCode, 502)
    assert.equal(redis.values.has("apihome"), false)
    assert.equal(calls, 1)

    now += 30_001
    const emptyScrape = responseRecorder()
    await controller({}, emptyScrape)
    assert.equal(emptyScrape.statusCode, 502)
    assert.equal(redis.values.has("apihome"), false)
    assert.equal(calls, 2)

    now += 30_001
    const recovered = responseRecorder()
    await controller({}, recovered)
    assert.equal(recovered.statusCode, 200)
    assert.deepEqual(recovered.body, { success: true, cached: false, data: expected })
    assert.equal(JSON.parse(redis.values.get("apihome")).data.success, true)
    assert.equal(redis.deletes.includes("apihome:refresh-lock"), false)
  } finally {
    restore()
  }
})

test("an unsuccessful refresh serves valid stale data without overwriting it", async () => {
  const stale = { success: true, message: "Data Found!!", results: validSections("stale") }
  const stored = JSON.stringify({ version: 1, storedAt: Date.now() - 11_000_000, data: stale })
  const redis = memoryRedis({ apihome: stored })
  const restore = installControllerModules({
    home: async () => ({ success: false, results: validSections("invalid-refresh") }),
    redis,
  })
  try {
    const controller = require(path.join(root, "src/controllers/home.contollers.js"))
    const response = responseRecorder()
    await controller({}, response)
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.body, { success: true, cached: true, data: stale })
    assert.equal(redis.values.get("apihome"), stored)
  } finally {
    restore()
  }
})
