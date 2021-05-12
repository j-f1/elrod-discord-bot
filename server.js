const express = require("express");
const app = express();
const port = process.env.PORT;

app.get("/", (req, res) => {
  const { token, id } = req.query;
  if (!token || !id) {
    res.send(400, "Invalid request");
    return;
  }
  res.send(`Token: ${token}, ID: ${id}`);
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
