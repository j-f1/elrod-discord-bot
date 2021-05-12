const express = require("express");
const app = express();
const port = process.env.PORT;
const { encrypt, decrypt } = require("./crypto");
const puppeteer = require("puppeteer");

let screenshot;

// ex: /?token=yW--sHWMTP80cCYbyu01KA==&token_iv=C5eSwdMxVPA4nIpGAthyLg==&id=LN88YRtw0Dc3pM/Wf3OKiQ==&id_iv=LJB4OrN5kzZrNqkfKyQmTw==
app.get("/", async (req, res) => {
  const { name } = req.query;
  if (!name) {
    res.status(400).send("Invalid request");
    return;
  }
  const start = Date.now();

  // const { token: encryptedToken, token_iv, id: encryptedId, id_iv } = req.query;
  // if (!encryptedToken || !token_iv || !encryptedId || !id_iv) {
  //   res.send(400, "Invalid request");
  //   return;
  // }
  // const [token, id] = await Promise.all([
  //   decrypt(encryptedToken, token_iv),
  //   decrypt(encryptedId, id_iv)
  // ]);
  res.end({ success: true });

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
      console.log("launch", (Date.now() - start) / 1000);
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

      console.log("createRoom", (Date.now() - start) / 1000);
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
      console.log("create", (Date.now() - start) / 1000);
      await snap();
      await page.waitForTimeout(500);
      await snap();

      await page.waitForTimeout(500);
      await snap();

      const roomLink = await page
        .waitForSelector(".joinLink")
        .then((el) => el.evaluate((node) => node.textContent));
      await snap();
      console.log("done in", Date.now() - start);

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

      if (!done) {
        // TODO: update embed
      }
    } catch (e) {
      console.error(e);
      await browser.close();
      res.end({ success: false });
    }
  } catch (e) {
    console.error(e);
    res.end({ success: false });
  }
});

// app.get("/screenshot", (req, res) => {
//   res.header("Content-Type", "image/png");
//   res.end(screenshot);
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
