import { Router } from "express";
import * as AuthController from "../controllers/authController.js";
import { validate } from "../middlewares/validator.js";
import { registerValidators } from "../validations/user/registerValidators.js";
import { loginValidators } from "../validations/user/loginValidators.js";

export const router = Router();

router.post('/auth/register', validate(registerValidators), AuthController.registerUser);
router.post('/auth/login', validate(loginValidators), AuthController.loginUser);
router.get('/auth/refresh', AuthController.refreshToken);

router.post('/auth/logout', AuthController.logoutUser);