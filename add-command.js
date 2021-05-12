const fetch = require("node-fetch");

const serverSlug = "/guilds/809610588040855552";
// const serverSlug = "";

const callDiscord = (route, method, body) =>
  fetch(`https://discord.com/api/v8${route}`, {
    method,
    headers: new fetch.Headers([
      ["Authorization", `Bot ${process.env.DISCORD_BOT_TOKEN}`],
      ["Content-Type", "application/json"],
    ]),
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch(console.error);

(async () => {
  await callDiscord(
    `/applications/${process.env.DISCORD_APP_ID}${serverSlug}/commands`,
    "POST",
    {
      name: "jstris",
      description: "Create a jstris room",
      options: [
        {
          name: "name",
          description: "Custom room name (default: “Brown Band”)",
          type: 3,
          required: false,
        },
      ],
    }
  ).then(console.log);
  await callDiscord(
    `/applications/${process.env.DISCORD_APP_ID}${serverSlug}/commands`,
    "POST",
    {
      name: "about-tetrod",
      description: "About Tetrod",
    }
  ).then(console.log);
})().catch(console.error);
