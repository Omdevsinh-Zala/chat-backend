import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { successResponse } from "../utils/response.js";
import * as UserController from "../controllers/userController.js";

const router = Router();

router.use(verifyToken);

router.get('/profile', UserController.show);

router.put('/profile', UserController.update);

router.get('/settings', (req, res) => {
  return successResponse({res, data: null, message: "User settings fetched successfully.", statusCode: 200});
});

export { router as userRouter };