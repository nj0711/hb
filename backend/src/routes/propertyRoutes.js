import express from 'express';
import {
  approveProperty,
  createProperty,
  deleteProperty,
  getAdminProperties,
  getOwnerProperties,
  getProperties,
  getPropertyById,
  rejectProperty,
  updateProperty
} from '../controllers/propertyController.js';
import { auth } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';
// import { upload } from '../utils/cloudinary.js';
import upload from '../middleware/upload.js';
const router = express.Router();

// ===================== PUBLIC ROUTES ===================== //

// Get all approved properties (public list)
router.get('/', getProperties);

// ===================== ADMIN ROUTES ===================== //

// 🔥 Flexible admin fetch with filters + search
router.get('/admin', auth, isAdmin, getAdminProperties);

// Approve / Reject properties
router.put('/:id/approve', auth, isAdmin, approveProperty);
router.put('/:id/reject', auth, isAdmin, rejectProperty);

// ===================== OWNER ROUTES ===================== //

// Get all properties for logged-in owner
router.get('/owner', auth, getOwnerProperties);

// Create new property
router.post('/', auth, upload.array('images', 5), createProperty);

// Update property
router.put('/:id', auth, (req, res, next) => {
  console.log("Raw body before upload:", req.body);
  next();
}, upload.array('images', 5), updateProperty);

// Delete property
router.delete('/:id', auth, deleteProperty);

// Get single property (by ID, public)
router.get('/:id', auth,getPropertyById);

export default router;


// // 🔥 Flexible admin fetch with filters + search
// router.get('/admin', auth, isAdmin, async (req, res) => {
//   try {
//     const { search, filter } = req.query;
//     const query = {};

//     // Search by title/name, location, or type
//     if (search) {
//       query.$or = [
//         { name: new RegExp(search, 'i') },
//         { location: new RegExp(search, 'i') },
//         { type: new RegExp(search, 'i') },
//       ];
//     }

//     // Filter by approval/status
//     if (filter === 'pending') query.isApproved = false;
//     if (filter === 'approved') query.isApproved = true;
//     if (filter === 'maintenance') query.status = 'maintenance';

//     const properties = await Property.find(query)
//       .populate('owner', 'name email')
//       .sort({ createdAt: -1 });

//     res.json(properties);
//   } catch (err) {
//     console.error('Error fetching properties:', err);
//     res.status(500).json({ message: 'Error fetching properties' });
//   }
// });
