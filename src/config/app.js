import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(import.meta.dirname, '../../', '.env') });

export const config = {
    port: process.env.PORT,
    env: process.env.NODE_ENV,
    private_key_secret: process.env.PRIVATE_KEY_SECRET,
    jwt: {
        access: {
            secret: process.env.ACCESS_TOKEN_SECRET,
            expire: process.env.ACCESS_TOKEN_EXPIRE,
        },
        refresh: {
            secret: process.env.REFRESH_TOKEN_SECRET,
            expire: process.env.REFRESH_TOKEN_EXPIRE,
        }
    }
}