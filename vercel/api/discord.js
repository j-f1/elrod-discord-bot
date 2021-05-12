const { verifyKey } = require("discord-interactions");
const { default: fetch } = require("node-fetch");
const { encrypt } = require("../crypto");

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405);
    res.end("Bad method");
    return;
  }
  if (!req.body) {
    res.status(400);
    res.end("missing body");
    return;
  }

  const bodyChunks = [];
  req
    .on("data", (chunk) => bodyChunks.push(chunk))
    .on("end", async () => {
      if (
        !verifyKey(
          Buffer.concat(bodyChunks),
          req.headers["X-Signature-Ed25519".toLowerCase()],
          req.headers["X-Signature-Timestamp".toLowerCase()],
          process.env.DISCORD_APP_PUBLIC_KEY
        )
      ) {
        return res.status(401).end("invalid request signature");
      }

      // handle ping
      if (req.body.type === 1) {
        res.json({ type: 1 });
        return;
      }

      const command = req.body.data;
      if (command && command.name === "about-tetrod") {
        res.json({
          type: 4,
          data: {
            title: `Tetrod`,
            type: "rich",
            url: "https://github.com/j-f1/elrod-discord-bot",
            description: `Tetrod is a bot by Jed Fox`,
            fields: [
              {
                name: "Commit SHA",
                value: process.env.VERCEL_GIT_COMMIT_SHA,
              },
              {
                name: "Deployment URL",
                value: process.env.VERCEL_URL,
              },
            ],
          },
        });
        return;
      }
      if (!command || command.name !== "jstris") {
        res.json({
          type: 4,
          data: {
            tts: false,
            content: `Unrecognized command \`${command?.name ?? "<unknown>"}\``,
            embeds: [],
            allowed_mentions: { parse: [] },
          },
        });
        return;
      }

      const args = new Map(
        (req.body.data.options || []).map(({ name, value }) => [name, value])
      );

      const [encryptedToken, iv] = await encrypt(req.body.token);

      const result = await fetch(
        `https://${process.env.LINK_SERVER_HOST}/?name=${encodeURIComponent(
          args.get("name") || "Brown Band"
        )}&token=${encryptedToken}&iv=${iv}`
      )
        .then((res) => res.json())
        .catch((err) => {
          console.error(err);
        });

      if (result.success) {
        res.json({ type: 5 });
      } else {
        console.log(result);
        res.json({
          type: 4,
          data: {
            tts: false,
            content: "Oops, something went wrong! cc <@706842348239323199>",
            allowed_mentions: {
              users: ["706842348239323199"],
            },
          },
        });
      }
    });
};
