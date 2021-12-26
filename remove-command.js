const fetch = require("node-fetch");

const serverSlug = "/guilds/" + process.argv[2];
console.log(serverSlug);
// const serverSlug = "";

const callDiscord = (route, method, body) =>
  fetch(`https://discord.com/api/v8${route}`, {
    method,
    headers: new fetch.Headers([
      ["Authorization", `Bot ${process.env.DISCORD_BOT_TOKEN}`],
      ["Content-Type", "application/json"]
    ]),
    body: body ? JSON.stringify(body) : undefined
  })
    .then(res => res.json())
    .catch(console.error);

(async () => {
  for (const id of process.argv.slice(3)) {
    await callDiscord(
      `/applications/${process.env.DISCORD_APP_ID}${serverSlug}/commands/${id}`,
      "DELETE"
    ).then(console.log);
  }
})().catch(console.error);
