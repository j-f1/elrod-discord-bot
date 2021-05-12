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
  const start = Date.now()

  // const { token: encryptedToken, token_iv, id: encryptedId, id_iv } = req.query;
  // if (!encryptedToken || !token_iv || !encryptedId || !id_iv) {
  //   res.send(400, "Invalid request");
  //   return;
  // }
  // const [token, id] = await Promise.all([
  //   decrypt(encryptedToken, token_iv),
  //   decrypt(encryptedId, id_iv)
  // ]);

  console.log("boot");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    defaultViewport: {
    width: 1200,
    height: 1200
    }
  });
  console.log("launch");
  const page = await browser.newPage();
  const snap = async () => {
    // screenshot = await page.screenshot();
    // console.log("snap");
  };

  await page.goto("https://jstris.jezevec10.com/");
  console.log("goto");
  await snap();
  await page
    .waitForSelector("#lobby", { visible: true })
    .then(el => el.click());
  console.log("lobby");
  await snap();
  await page
    .waitForSelector("#createRoomButton", { visible: true })
    .then(el => el.click());
  console.log("createRoom");
  await snap();
  await page.evaluate(name => {
    document.getElementById("roomName").value = name;
  }, name);
  console.log("setName");
  await snap();
  await page.click("#isPrivate");
  console.log("private");
  await snap();
  await page.waitForTimeout(250);
  await page.click("#create");
  console.log("create");
  await snap();
  const roomLink = await page
    .waitForSelector(".joinLink", { visible: true })
    .then(el => el.evaluate(node => node.textContent));
  await snap();
  console.log("done in", Date.now() - start);

  await browser.close();
  res.send({ success: true, link: roomLink });

  // res.send(`Token: ${token}, ID: ${id}`);
});

app.get("/screenshot", (req, res) => {
  res.header("Content-Type", "image/png");
  res.send(screenshot);
});
app.get("/encrypt", async (req, res) => {
  const { token, id } = req.query;
  if (!token || !id) {
    res.send(400, "Invalid request");
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
