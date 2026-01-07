import { generateKeyPairSync } from 'crypto';
import { config } from '../config/app.js';

export const createUserKeys = () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem"
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      cipher: "aes-256-cbc",
      passphrase: config.private_key_secret
    }
  });

  return { publicKey, privateKey };
}