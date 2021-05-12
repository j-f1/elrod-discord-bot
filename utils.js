const fetch = require("node-fetch").default;

exports.callDiscord = (route, method, body) =>
  fetch(`https://discord.com/api/v8${route}`, {
    method,
    headers: new fetch.Headers([
      ["Authorization", `Bot ${process.env.DISCORD_BOT_TOKEN}`],
      ["Content-Type", "application/json"]
    ]),
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .catch(console.error);