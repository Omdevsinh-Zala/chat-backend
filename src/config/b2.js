import B2 from "backblaze-b2";
import { config } from "./app.js";

export const b2 = new B2({
    applicationKey: config.b2.appKey,
    applicationKeyId: config.b2.keyID,
});