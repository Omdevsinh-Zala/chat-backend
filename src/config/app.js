import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(import.meta.dirname, '../../', '.env') });

export const config = {
    port: process.env.PORT,
    env: process.env.NODE_ENV,
    private_key_secret: process.env.PRIVATE_KEY_SECRET,
    pbkdf2: {
        iterations: parseInt(process.env.PBKDF2_ITERATIONS, 10),
        keylen: parseInt(process.env.PBKDF2_KEYLEN, 10),
        digest: process.env.PBKDF2_DIGEST,
    },
    aes: {
        algorithm: process.env.AES_ALGORITHM,
        iv: parseInt(process.env.AES_IV_LENGTH, 10),
    },
    saltRounds: parseInt(process.env.PRIVATE_KEY_ENCRYPTION_SALT_ROUNDS, 10),
    jwt: {
        access: {
            secret: process.env.ACCESS_TOKEN_SECRET,
            expire: process.env.ACCESS_TOKEN_EXPIRE,
        },
        refresh: {
            secret: process.env.REFRESH_TOKEN_SECRET,
            expire: process.env.REFRESH_TOKEN_EXPIRE,
        }
    },
    origins: process.env.WEB_DOMAIN.split(',').map((domain) => domain.trim()),
    pagination: {
        limit: parseInt(process.env.PAGINATION_LIMIT, 10),
        offset: parseInt(process.env.PAGINATION_OFFSET, 10),
    },
    support_email: process.env.SUPPORT_EMAIL,
    vapid: {
        public_key: process.env.VAPID_PUBLIC_KEY,
        private_key: process.env.VAPID_PRIVATE_KEY
    },
    profileImagePrefix: process.env.PROFILE_IMAGE_PATH
}