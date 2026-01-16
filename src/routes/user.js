import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { successResponse } from "../utils/response.js";
import * as UserController from "../controllers/userController.js";
import * as PushController from "../controllers/pushSubscriptionController.js";
import { validate } from "../middlewares/validator.js"
import * as ChannelValidation from "../validations/user/channelValidation.js"

const router = Router();

router.use(verifyToken);

router.get('/profile/:id', validate(ChannelValidation.getChannelDataValidators, "params"), UserController.showProfile);
router.get('/profile', UserController.show);

router.put('/profile', UserController.update);

router.get('/files', UserController.getAllFiles);

router.get('/channels/:id', validate(ChannelValidation.getChannelDataValidators, "params"), UserController.getChannelData);
router.get('/channels', UserController.getAllChannels);

router.get('/settings', (req, res) => {
  return successResponse({ res, data: null, message: null, statusCode: 200 });
});

router.post('/channels', validate(ChannelValidation.createChannelValidators), UserController.createChannel);

router.post('/push/subscribe', PushController.saveSubscription);
router.post('/push/unsubscribe', PushController.deleteSubscription);

router.get('/', UserController.getUsers);

export { router as userRouter };