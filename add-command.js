const fetch = require("node-fetch");
(async () => {
  const res = await fetch(
    `https://discord.com/api/v8/applications/${process.env.DISCORD_APP_ID}/commands`,
    {
      method: "POST",
      headers: new fetch.Headers([
        ["Authorization", `Bot ${process.env.DISCORD_BOT_TOKEN}`],
        ["Content-Type", "application/json"],
      ]),
      body: JSON.stringify({
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
      }),
    }
  );
  const text = await res.text();
  console.log(text);
})().catch(console.error);
