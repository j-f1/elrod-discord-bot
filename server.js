const express = require("express");
const app = express();
const port = process.env.PORT;
const { encrypt } = require("./crypto");

app.get("/encrypt", async (req, res) => {
  const { token, id } = req.query;
  if (!token || !id) {
    res.send(400, "Invalid request");
    return;
  }
  const [[encryptedToken, tokenIv], [encryptedId, idIv]] = await Promise.all(
    [token, id].map(encrypt)
  );
  res.send(`/?token=${encryptedToken}&token, ID: ${encryptedId}`);
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
