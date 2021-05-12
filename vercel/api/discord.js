const { verifyKey } = require("discord-interactions");
const { default: fetch } = require("node-fetch");

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
  // handle ping
  if (req.body.type === 1) {
    res.json({ type: 1 });
    return;
  }

  const bodyChunks = [];
  req
    .on("data", (chunk) => bodyChunks.push(chunk))
    .on("end", async () => {
      if (
        !verifyKey(
          Buffer.concat(bodyChunks),
          req.headers["X-Signature-Ed25519"],
          req.headers["X-Signature-Timestamp"],
          process.env.DISCORD_APP_PUBLIC_KEY
        )
      ) {
        return res.status(401).end("invalid request signature");
      }

      const command = req.body.data;
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

      res.json({
        type: 5,
        data: {
          tts: false,
          content: "Generating a link…",
          allowed_mentions: { parse: [] },
        },
      });

      // const roomData = await fetch(
      //   "/glitch?name=" + encodeURIComponent(req.body.data)
      // );
    });
};
