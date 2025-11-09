// backend/src/routes/userRoutes.js
import express from 'express';
import {
  deleteUser,
  getAllUsers,
  getUserDetails,
  reactivateUser,
  updateUserProfile,
  updateUserStatus
} from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js'; 

const router = express.Router();

// admin-only listing (your existing route)
router.get('/admin/users', auth, getAllUsers); 

// reactivate current user
router.post('/reactivate', auth, reactivateUser);

//GET /api/users/:id (To fetch single user details like name/role)
router.get('/:id', auth, getUserDetails); 

// update profile (self or admin)
router.put('/:id', auth, updateUserProfile);

// update status / delete (existing routes)
router.put('/:userId/status', auth, updateUserStatus);
router.delete('/:userId', auth, deleteUser);

// new route to fetch all admins
router.get("/admins", auth, async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("_id name email");
    res.json(admins);
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ message: "Error fetching admins" });
  }
});

export default router;
