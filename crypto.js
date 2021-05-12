const crypto = require("crypto");

const algorithm = "aes-192-cbc";

const encode = data => data.replace(/\+/g, "-");
const decode = data => data.replace(/-/g, "+");

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
        cipher.setEncoding("base64");

        cipher.on("data", chunk => (encrypted += chunk));
        cipher.on("end", () =>
          resolve([
            encode(encrypted),
            encode(Buffer.from(iv).toString("base64"))
          ])
        );

        cipher.write(data);
        cipher.end();
      });
    })
  );

exports.decrypt = (encrypted, iv) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(process.env.PASSWORD, "salt", 24, (err, key) => {
      if (err) {
        reject(err);
        return;
      }

      const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(decode(iv), 'base64'));

      // Encrypted using same algorithm, key and iv.
      let decrypted = decipher.update(decode(encrypted), "base64", "utf8");
      decrypted += decipher.final("utf8");
      resolve(decrypted);
    });
  });
