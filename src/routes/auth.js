import { Router } from "express";
import * as AuthController from "../controllers/authController.js";
import { validate } from "../middlewares/validator.js";
import { registerValidators } from "../validations/user/registerValidators.js";
import { loginValidators } from "../validations/user/loginValidators.js";
import { validateUsername } from "../validations/usernameValidator.js";

export const router = Router();

router.post('/register', validate(registerValidators), AuthController.registerUser);
router.post('/login', validate(loginValidators), AuthController.loginUser);
router.get('/refresh', AuthController.refreshToken);

router.get('/verify/username', validate(validateUsername), AuthController.checkUsername);

router.post('/logout', AuthController.logoutUser);