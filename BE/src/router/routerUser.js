import { Router } from "express";

import { userSchema } from "../validations/user.js";
import { getUser } from "../middlewares/getUser.js";
import { checkPermission } from "../middlewares/checkPermission.js";
import { checkRequestBody } from "../middlewares/checkRequestBody.js";
import { 
    createUser, 
    getAllUser, 
    getUserByEmail, 
    getUserById, 
    removeUserById, 
    deleteUserById,
    restoreUserById, 
    updateUser, 
    updateUserProfile, 
    removeServiceFromUser, 
    removeServiceFromProfile,
    addUserInformation,
    updateUserInformation,
    deleteUserInformation,
    getUserServices
} from "../controllers/user.js";

const routerUser = Router();

// Public routes
routerUser.get('/', checkPermission(), getAllUser);
routerUser.get('/:id', checkPermission(), getUserById);
routerUser.get('/email/:email', checkPermission(), getUserByEmail);
routerUser.get('/:id/services', checkPermission(), getUserServices);
routerUser.delete('/:id', checkPermission(), removeUserById);
routerUser.delete('/permanent/:id', checkPermission(), deleteUserById);
routerUser.delete('/restore/:id', checkPermission(), restoreUserById);

// User information routes (no schema validation needed)
routerUser.post('/information', getUser, addUserInformation);
routerUser.put('/information/:informationId', getUser, updateUserInformation);
routerUser.delete('/information/:informationId', getUser, deleteUserInformation);

// Routes that need user schema validation
routerUser.use(checkRequestBody(userSchema));
routerUser.use(getUser);
routerUser.post('/', checkPermission(), createUser);
routerUser.put('/:id', checkPermission(), updateUser);
routerUser.patch('/', getUser, updateUserProfile);
routerUser.delete('/:id/service', removeServiceFromUser);
routerUser.patch('/profile/service', getUser, removeServiceFromProfile);

export default routerUser;