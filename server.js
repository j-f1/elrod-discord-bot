const express = require("express");
const app = express();
const port = process.env.PORT;
const { encrypt, decrypt } = require("./crypto");
const puppeteer = require("puppeteer");
const fetch = require("node-fetch").default;

let screenshot;

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

// ex: /?token=yW--sHWMTP80cCYbyu01KA==&token_iv=C5eSwdMxVPA4nIpGAthyLg==
app.get("/", async (req, res) => {
  const { name, token: encryptedToken, iv } = req.query;
  if (!name || !encryptedToken || !iv) {
    res.status(400).send({ success: false, query: req.query });
    return;
  }
  const start = Date.now();

  const token = await decrypt(encryptedToken, iv);

  res.send({ success: true });

  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint:
        "wss://chrome.browserless.io?timeout=60000&token=" +
        process.env.BROWSERLESS_TOKEN,
      // args: ["--no-sandbox"],
      // defaultViewport: {
      //   width: 1200,
      //   height: 1200,
      // },
    });
    try {
      // console.log("launch", (Date.now() - start) / 1000);
      const page = await browser.newPage();
      const snap = async () => {
        // screenshot = await page.screenshot();
        // console.log("snap");
      };

      await page.goto("https://jstris.jezevec10.com/");
      await snap();

      await page.waitForSelector("#lobby").then((el) =>
        el.evaluate((node) => {
          node.click();
          document.getElementById("createRoomButton").click();
        })
      );
      await snap();

      // console.log("createRoom", (Date.now() - start) / 1000);
      await page.evaluate(
        (name) =>
          new Promise((resolve) => {
            document.getElementById("roomName").value = name;
            document.getElementById("isPrivate").click();
            setTimeout(() => {
              document.getElementById("create").click();
              resolve();
            }, 500);
          }),
        name
      );
      // console.log("create", (Date.now() - start) / 1000);
      await snap();
      await page.waitForTimeout(500);
      await snap();

      await page.waitForTimeout(500);
      await snap();

      const roomLink = await page
        .waitForSelector(".joinLink")
        .then((el) => el.evaluate((node) => node.textContent));
      await snap();
      console.log("generated link in", (Date.now() - start) / 1000);

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
              footer: {
                text: "Waiting for someone to join…",
              },
            },
          ],
        }
      );

      // now wait for the user to show up
      let done = false;
      while (Date.now() - start < 30e3) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        done = await page.evaluate(() => {
          const count = document.querySelectorAll(".chl.srv").length;
          if (count > 2) {
            document.getElementById("chatInput").value =
              "[elrod] someone has joined the room, so I’ll see myself out. Good luck!";
            document.getElementById("sendMsg").click();
            return true;
          }
        });
        if (done) break;
      }
      await browser.close();

      if (done) {
        await callDiscord(
          `/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`,
          "PATCH",
          { embeds: [embed] }
        );
      } else {
        await callDiscord(
          `/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`,
          "PATCH",
          {
            embeds: [
              {
                ...embed,
                color: "15158332",
                url: undefined,
                description: "Room timed out. Run `/jstris` to get a new link!",
              },
            ],
          }
        );
      }
    } catch (e) {
      console.error(e);
      await browser.close();
      res.send({ success: false });
    }
  } catch (e) {
    console.error(e);
    res.send({ success: false });
  }
});

// app.get("/screenshot", (req, res) => {
//   res.header("Content-Type", "image/png");
//   res.send(screenshot);
// });

app.get("/encrypt", async (req, res) => {
  const { token, id } = req.query;
  if (!token || !id) {
    res.end(400, "Invalid request");
    return;
  }
  const [[encryptedToken, tokenIv], [encryptedId, idIv]] = await Promise.all(
    [token, id].map(encrypt)
  );
  res.send(
    `/?token=${encryptedToken}&token_iv=${tokenIv}&id=${encryptedId}&id_iv=${idIv}`
  );
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
