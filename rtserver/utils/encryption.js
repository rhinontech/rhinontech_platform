const crypto = require("crypto");

/**
 * Encrypt a token using AES-256-CBC
 * @param {string} token - The token to encrypt
 * @returns {string} - Encrypted token in format: iv:encryptedData
 */
function encryptToken(token) {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt a token using AES-256-CBC
 * @param {string} encryptedToken - The encrypted token in format: iv:encryptedData
 * @returns {string} - Decrypted token
 */
function decryptToken(encryptedToken) {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

    const parts = encryptedToken.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

/**
 * Generate a random encryption key (run once to create ENCRYPTION_KEY)
 * @returns {string} - 64 character hex string
 */
function generateEncryptionKey() {
    return crypto.randomBytes(32).toString("hex");
}

module.exports = {
    encryptToken,
    decryptToken,
    generateEncryptionKey,
};
