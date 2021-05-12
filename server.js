const express = require("express");
const app = express();
const port = process.env.PORT;
const { encrypt, decrypt } = require("./crypto");

// ex: /?token=yW--sHWMTP80cCYbyu01KA==&token_iv=C5eSwdMxVPA4nIpGAthyLg==&id=LN88YRtw0Dc3pM/Wf3OKiQ==&id_iv=LJB4OrN5kzZrNqkfKyQmTw==
app.get("/", async (req, res) => {
  const { token: encryptedToken, token_iv, id: encryptedId, id_iv } = req.query;
  if (!encryptedToken || !token_iv || !encryptedId || !id_iv) {
    res.send(400, "Invalid request");
    return;
  }
  const [token, id] = await Promise.all(
    [decrypt(encryptedToken, token_iv), decrypt(encryptedId, id_iv)]
  );
  res.send(
    `Token: ${token}, ID: ${id}`
  );
})
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
