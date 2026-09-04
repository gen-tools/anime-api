require("dotenv").config()
const app = require("./src/app.js")
const redis = require("./src/configs/redis.js")

const PORT = process.env.PORT || 3000;

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log("Server running on port", PORT);
  });
}