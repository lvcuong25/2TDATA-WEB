            import { Router } from "express";

            import { userSchema } from "../validations/user.js";
            import { getUser } from "../middlewares/getUser.js";
            import { checkPermission } from "../middlewares/checkPermission.js";
            import { checkRequestBody } from "../middlewares/checkRequestBody.js";
            import { createUser, getAllUser, getUserByEmail, getUserById, removeUserById, restoreUserById, updateUser, updateUserProfile, removeServiceFromUser, removeServiceFromProfile } from "../controllers/user.js";

            const routerUser = Router();
            routerUser.get('/', checkPermission(), getAllUser);
            routerUser.get('/:id', checkPermission(), getUserById);
            routerUser.get('/email/:email', checkPermission(), getUserByEmail);
            routerUser.delete('/:id', checkPermission(), removeUserById);
            routerUser.delete('/restore/:id', checkPermission(), restoreUserById);
            // routerUser.use(checkRequestBody(userSchema));
            routerUser.post('/', checkPermission(), createUser);
            routerUser.put('/:id', checkPermission(), updateUser);
            routerUser.patch('/', getUser, updateUserProfile);
            routerUser.delete('/:id/service', removeServiceFromUser);
            routerUser.patch('/profile/service', getUser, removeServiceFromProfile);
            export default routerUser;