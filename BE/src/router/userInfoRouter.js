import express from 'express';
import { addUserInfo, getAllUserInfo, deleteUserInfo } from '../controllers/userInfoController.js';

const userInfoRouter = express.Router();

userInfoRouter.post('/add', addUserInfo);
userInfoRouter.get('/', getAllUserInfo);
userInfoRouter.delete('/:id', deleteUserInfo);

export default userInfoRouter; 