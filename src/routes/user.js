import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import * as UserController from "../controllers/userController.js";
import * as PushController from "../controllers/pushSubscriptionController.js";
import * as SettingsController from "../controllers/settingsController.js";
import * as ChannelController from "../controllers/channelController.js";
import { validate } from "../middlewares/validator.js"
import * as ChannelValidation from "../validations/user/channelValidation.js"
import * as SettingsValidation from "../validations/user/settingsValidation.js"
import * as ChannelManagementValidation from "../validations/user/channelManagementValidation.js"
import { updateUserValidation } from "../validations/user/updateUserValidation.js";
import { profileMulterUpload } from "../utils/fileUpload.js";

const router = Router();

router.use(verifyToken);

router.get('/profile/:id', validate(ChannelValidation.getChannelDataValidators, "params"), UserController.showProfile);
router.get('/profile', UserController.show);

router.put('/profile', validate(updateUserValidation), UserController.update);
router.post('/profile/avatar', profileMulterUpload.single('file'), UserController.uploadProfileImage);

router.get('/files', UserController.getAllFiles);

router.get('/channels/:id', validate(ChannelValidation.getChannelDataValidators, "params"), UserController.getChannelData);
router.get('/channels', UserController.getAllChannels);

router.get('/settings', SettingsController.getUserSettings);
router.put('/settings', validate(SettingsValidation.updateSettingsValidators), SettingsController.updateUserSettings);

router.post('/channels', validate(ChannelValidation.createChannelValidators), UserController.createChannel);
router.delete('/channels/:id', ChannelController.deleteChannel);
router.put('/channels/:channelId/members/:userId/role', validate(ChannelManagementValidation.updateMemberRoleValidators), ChannelController.updateMemberRole);

router.post('/push/subscribe', PushController.saveSubscription);
router.post('/push/unsubscribe', PushController.deleteSubscription);

router.get('/', UserController.getUsers);

export { router as userRouter };