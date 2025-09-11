// make routers
import express from 'express';
import { adminLogin, createUser, deleteUser, getUsers, login, signup, updateUser } from '../controllers/userController.js';
import { authVerify } from '../middleware/authVerify.js';
import { addQuery, AddSpecialist, assignSpecialist, getAllQueries, getQueryById, getQueryTypes, getRoles, getSpecialistQueries, getSpecialists, getUserQueries, updateQueryStatus } from '../controllers/queryController.js';


const router = express.Router();
// auth endpoints
router.post('/signup',signup)
router.post('/login',login)
router.post('/login-admin',adminLogin)
router.get('/users',getUsers)
// user panel endpoints

router.post('/query', addQuery)
router.get('/user/queries', getUserQueries)
router.get('/query/:queryId', getQueryById)
router.get('/query-types', getQueryTypes)
router.get('/all-queries', getAllQueries)
router.put('/query/:queryId/status', updateQueryStatus);
router.put('/query/:queryId/assign', assignSpecialist);
router.get('/specialists', getSpecialists);
router.get('/specialist/:specialistName/queries', getSpecialistQueries);
router.get('/roles', getRoles);
router.post('/admin/users', createUser);
router.put('/admin/users/:id', updateUser);
router.delete('/admin/users/:id', deleteUser);
router.post('/add-specialist', AddSpecialist);

export default router;