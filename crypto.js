const crypto = require("crypto");

const algorithm = "aes-192-cbc";

exports.encrypt = data =>
  new Promise((resolve, reject) =>
    // First, we'll generate the key. The key length is dependent on the algorithm.
    // In this case for aes192, it is 24 bytes (192 bits).
    crypto.scrypt(process.env.PASSWORD, "salt", 24, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      // Then, we'll generate a random initialization vector
      crypto.randomFill(new Uint8Array(16), (err, iv) => {
        if (err) {
          reject(err);
          return;
        }

        // Once we have the key and iv, we can create and use the cipher...
        const cipher = crypto.createCipheriv(algorithm, key, iv);

        let encrypted = "";
        cipher.setEncoding("hex");

        cipher.on("data", chunk => (encrypted += chunk));
        cipher.on("end", () => resolve([encrypted, iv]));

        cipher.write(data);
        cipher.end();
      });
    })
  );

exports.decrypt = data =>
  new Promise((resolve, reject) => {
    crypto.scrypt(process.env.PASSWORD, "salt", 24, (err, key) => {
      if (err) {
        reject(err);
        return;
      }

    // The IV is usually passed along with the ciphertext.
    const iv = Buffer.alloc(16, 0); // Initialization vector.

    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    // Encrypted using same algorithm, key and iv.
    const encrypted =
      "e5f79c5915c02171eec6b212d5520d44480993d7d622a7c4c2da32f6efda0ffa";
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    console.log(decrypted);
    // Prints: some clear text data
    decipher.final([outputEncoding]);
  });
