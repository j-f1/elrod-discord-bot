const express = require("express");
const app = express();
const port = process.env.PORT;

const { encrypt, decrypt } = require("./crypto");
const jstris = require("./jstris");
const { callDiscord } = require("./utils");
const bodyParser = require("body-parser");
const { verifyKeyMiddleware } = require("discord-interactions");
const child_process = require("child_process");

app.post(
  "/discord",
  verifyKeyMiddleware(process.env.DISCORD_APP_PUBLIC_KEY),
  (req, res) => {
    const command = req.body.data;
    switch (command && command.name) {
      case "about-tetrod": {
        res.json({
          type: 4,
          data: {
            embeds: [
              {
                title: `Tetrod`,
                type: "rich",
                url: "https://github.com/j-f1/elrod-discord-bot",
                description: `Tetrod is a bot by Jed Fox. [Glitch link](https://glitch.com/edit/#!/magic-inquisitive-cobra).`,
                fields: [
                  {
                    name: "Commit SHA",
                    value: `\`${child_process
                      .execSync("git rev-parse HEAD", { encoding: "utf-8" })
                      .trim()}\``,
                  },
                ],
              },
            ],
          },
        });
        return;
      }
      case "jstris": {
        try {
          const args = new Map(
            (req.body.data.options || []).map(({ name, value }) => [
              name,
              value,
            ])
          );

          const token = req.body.token;

          const name = args.get("name") || "Brown Band";
          const start = Date.now();

          res.json({ type: 5 });

          jstris(name, async (roomLink) => {
            const embed = {
              title: `Jstris: ${name}`,
              type: "rich",
              url: roomLink,
              color: "3066993",
              description: `<${roomLink}>`,
            };

            await callDiscord(
              `/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`,
              "PATCH",
              {
                embeds: [
                  {
                    ...embed,
                    // footer: {
                    //   text: "Waiting for someone to join…"
                    // }
                  },
                ],
              }
            );
          })
            .then(([roomWorkedOut, roomLink]) => {
              if (roomWorkedOut) {
                // await callDiscord(
                //   `/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`,
                //   "PATCH",
                //   { embeds: [embed] }
                // );
              } else {
                return callDiscord(
                  `/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`,
                  "PATCH",
                  {
                    embeds: [
                      {
                        title: `Jstris: ${name}`,
                        type: "rich",
                        color: "15158332",
                        url: undefined,
                        description:
                          "Room timed out. Run `/jstris` to get a new link!",
                      },
                    ],
                  }
                );
              }
            })
            .catch(console.error);
        } catch (e) {
          console.error(e);
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
        return;
      }
      default: {
        res.json({
          type: 4,
          data: {
            tts: false,
            content: `Unrecognized command \`${
              (command && command.name) || "<unknown>"
            }\``,
            embeds: [],
            allowed_mentions: { parse: [] },
          },
        });
        return;
      }
    }
  }
);

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
