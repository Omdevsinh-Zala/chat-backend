import jwt from "jsonwebtoken";
import { config } from "../config/app.js";
import { b2 } from "../config/b2.js";

export const generateToken = (payload, type) => {
    return jwt.sign(payload, config.jwt[type].secret, {
        expiresIn: config.jwt[type].expire
    })
}

export const b2AuthToken = async (path = '', time) => {
    const token = await b2.getDownloadAuthorization({
        bucketId: config.b2.bucketID,
        fileNamePrefix: path,
        validDurationInSeconds: time
    });
    return token.data.authorizationToken;
}

export const b2ProfileToken = async (time) => {
    const token = await b2.getDownloadAuthorization({
        bucketId: config.b2.bucketID,
        fileNamePrefix: 'profileImages',
        validDurationInSeconds: time
    });
    return token.data.authorizationToken;
}