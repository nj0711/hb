# PG Booking Website

A full-stack web application for managing PG listings, bookings, and user roles (admin, property owner, and client). Property owners can list properties, clients can book them, and admins can manage the system.

## Features

### Admin Features
- Approve or reject property listings
- Manage all users (owners & clients)
- Monitor all bookings and system activity

### Property Owner Features
- Register/login and manage profile
- Add new properties with details and images
- Update or delete listed properties
- View and manage bookings for their properties
- Access booking history and client details

### Client Features
- Register/login and manage profile
- Browse and search available properties
- View property details with images and owner info
- Book properties with check-in / check-out dates
- Track booking status and history
- Leave reviews

## Tech Stack

### Frontend
- React.js (Vite)
- Chakra UI (UI components)
- React Router for navigation
- Context API for authentication state management
- Axios for API requests

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose (Atlas-ready)
- Cloudinary (image storage)
- Multer & multer-storage-cloudinary (file upload)
- JWT for authentication & role-based access
- Bcrypt for password hashing
- Nodemailer for email notifications (password reset, etc.)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Cloudinary account
- Git

## Installation

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Install backend dependencies
```bash
cd backend
npm install
```

4. Create environment variables
Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/t2
CLOUDINARY_CLOUD_NAME=dvrlfqokm
CLOUDINARY_API_KEY=332498836659466
CLOUDINARY_API_SECRET=IvPdptct1rEb8R0iAPoBatL14J0
JWT_SECRET=your_jwt_secret
PORT=5000 
FRONTEND_URL=http://localhost:3000
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=3c9e97f7417e55
EMAIL_PASS=****8959
```

## Project Structure
```
Directory structure:
└── V3L/
    ├── backend/
    │   ├── package.json
    │   └── src/
    │       ├── server.js
    │       ├── controllers/
    │       │   ├── adminController.js
    │       │   ├── authController.js
    │       │   ├── bookingController.js
    │       │   ├── messageController.js
    │       │   ├── propertyController.js
    │       │   ├── reviewController.js
    │       │   └── userController.js
    │       ├── middleware/
    │       │   ├── auth.js
    │       │   ├── isAdmin.js
    │       │   └── upload.js
    │       ├── models/
    │       │   ├── Booking.js
    │       │   ├── Message.js
    │       │   ├── Property.js
    │       │   ├── Review.js
    │       │   └── User.js
    │       ├── routes/
    │       │   ├── adminRoutes.js
    │       │   ├── authRoutes.js
    │       │   ├── bookingRoutes.js
    │       │   ├── clientRoutes.js
    │       │   ├── messageRoutes.js
    │       │   ├── propertyOwnerRoutes.js
    │       │   ├── propertyRoutes.js
    │       │   ├── reviewRoutes.js
    │       │   └── userRoutes.js
    │       └── utils/
    │           ├── cloudinary.js
    │           └── sendEmail.js
    └── frontend/
        ├── index.html
        ├── package.json
        ├── vite.config.js
        └── src/
            ├── App.jsx
            ├── index.css
            ├── main.jsx
            ├── theme.js
            ├── admin/
            │   └── pages/
            │       ├── AdminBookings.jsx
            │       ├── AdminChatPage.jsx
            │       ├── AdminDashboard.jsx
            │       ├── AdminProperties.jsx
            │       ├── AdminUsers.jsx
            │       ├── BookingHistory.jsx
            │       ├── PropertyApproval.jsx
            │       └── PropertyManagementWithFilters.jsx
            ├── client/ 
            │   └── pages/
            │       ├── ClientChatListPage.jsx
            │       ├── ClientChatPage.jsx
            │       ├── ClientOwnerChatPage.jsx
            │       ├── Home.jsx
            │       ├── MyBookings.jsx
            │       ├── Profile.jsx
            │       ├── PropertyDetails.jsx
            │       └── PropertyList.jsx
            ├── components/
            │   ├── ChatBox.jsx
            │   ├── Navbar.jsx
            │   ├── Pagination.jsx
            │   ├── PropertyCard.jsx
            │   ├── ReactivateButton.jsx
            │   ├── StarRating.jsx
            │   └── ThemeSwitcher.jsx
            ├── context/
            │   └── AuthContext.jsx
            ├── owner/
            │   └── pages/
            │       ├── AddProperty.jsx
            │       ├── ManageProperty.jsx
            │       ├── OwnerBookings.jsx
            │       ├── OwnerChatClientPage.jsx
            │       ├── OwnerChatListPage.jsx
            │       ├── OwnerChatPage.jsx
            │       ├── OwnerDashboard.jsx
            │       ├── OwnerProfile.jsx
            │       └── OwnerProperties.jsx
            └── pages/
                ├── ForgotPassword.jsx
                ├── Login.jsx
                ├── NotFound.jsx
                ├── Register.jsx
                └── ResetPassword.jsx
```
## Running the Application

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend development server
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/forgot-password
- POST /api/auth/reset-password/:token

### Admin Endpoints
- GET /api/admin/properties
- PUT /api/admin/properties/:id/approve
- PUT /api/admin/properties/:id/reject
- GET /api/admin/users
- GET /api/admin/bookings

### Property Owner Endpoints
- POST /api/property-owner/properties
- GET /api/property-owner/properties
- PUT /api/property-owner/properties/:id
- DELETE /api/property-owner/properties/:id
- GET /api/property-owner/bookings

### Client Endpoints
- GET /api/client/properties
- POST /api/client/bookings
- GET /api/client/bookings
- PUT /api/client/bookings/:id

### Messaging Endpoints
- POST /api/messages
- GET /api/messages/:conversationId

### Reviews
- POST /api/reviews
- GET /api/reviews/:propertyId

