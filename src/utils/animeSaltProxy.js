const axiosModule = require("axios")
const axios = axiosModule.default || axiosModule
const headers = require("../configs/headers.js")

const WORKER_PROXY_URL = "https://wispy-cherry-6934.shahazaibseo038.workers.dev/"
const ALLOWED_HOSTS = new Set(["animesalt.cx", "www.animesalt.cx"])

const buildAnimeSaltProxyUrl = (target) => {
  const upstream = new URL(target)
  if (upstream.protocol !== "https:" || !ALLOWED_HOSTS.has(upstream.hostname)) {
    throw new TypeError("AnimeSalt proxy only accepts HTTPS AnimeSalt URLs")
  }

  const proxy = new URL(WORKER_PROXY_URL)
  proxy.searchParams.set("url", upstream.toString())
  return proxy.toString()
}

const fetchAnimeSaltHtml = async (target, options = {}) => {
  const response = await axios.get(buildAnimeSaltProxyUrl(target), {
    headers,
    timeout: options.timeout ?? 10000,
    responseType: "text",
  })

  return response.data
}

module.exports = { buildAnimeSaltProxyUrl, fetchAnimeSaltHtml }
