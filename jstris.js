const puppeteer = require("puppeteer");

module.exports = async function (name, handleRoomLink) {
  const start = Date.now();

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
      // exports.screenshot[0] = await page.screenshot();
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

    await handleRoomLink(roomLink);

    // now wait for the user to show up
    let done = false;
    while (Date.now() - start < 60e3) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      done = await page.evaluate(() => {
        const serverMessages = document.querySelectorAll(".chl.srv");
        if (serverMessages.length > 2) {
          try {
            const message = serverMessages[2];
            let user;
            if (message.querySelector("a")) {
              user = message.querySelector("a").textContent;
            } else {
              user = message.querySelector("em").textContent.split(" ")[0];
            }
            document.getElementById(
              "chatInput"
            ).value = `[tetrod] Welcome @${user}. Now that you’ve joined the room, my services are no longer needed. Good luck!`;
          } catch (e) {
            document.getElementById("chatInput").value =
              "[tetrod] someone has joined the room, so I’ll see myself out. Good luck!";
          }
          document.getElementById("sendMsg").click();
          return true;
        }
      });
      if (done) break;
    }
    await browser.close();
    return [done, roomLink];
  } catch (e) {
    console.error(e);
    await browser.close();
    return [false];
  }
};
module.exports.screenshot = [];
