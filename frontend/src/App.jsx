import { Box, ChakraProvider, Flex } from "@chakra-ui/react"; // Import Flex and Box
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Admin Pages
import AdminBookings from "./admin/pages/AdminBookings";
import AdminChatPage from "./admin/pages/AdminChatPage";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProperties from "./admin/pages/AdminProperties";
import AdminUsers from "./admin/pages/AdminUsers";

// Owner Pages
import AddProperty from "./owner/pages/AddProperty";
import ManageProperty from "./owner/pages/ManageProperty";
import OwnerBookings from "./owner/pages/OwnerBookings";
import OwnerChatClientPage from "./owner/pages/OwnerChatClientPage";
import OwnerChatListPage from "./owner/pages/OwnerChatListPage";
import OwnerChatPage from "./owner/pages/OwnerChatPage";
import OwnerDashboard from "./owner/pages/OwnerDashboard";
import OwnerProfile from "./owner/pages/OwnerProfile";
import OwnerProperties from "./owner/pages/OwnerProperties";

// Client Pages
import ClientChatListPage from "./client/pages/ClientChatListPage";
import ClientChatPage from "./client/pages/ClientChatPage";
import ClientOwnerChatPage from "./client/pages/ClientOwnerChatPage";
import Home from "./client/pages/Home";
import MyBookings from "./client/pages/MyBookings";
import Profile from "./client/pages/Profile";
import PropertyDetails from "./client/pages/PropertyDetails";
import PropertyList from "./client/pages/PropertyList";

// Shared Pages
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  // Define a height for the Navbar to help calculate remaining space.
  // Adjust this value (e.g., to "60px") to match your Navbar's actual height.
  const NAVBAR_HEIGHT = "60px"; 
  
  return (
    <ChakraProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* CRITICAL FIX: The main container takes full viewport height and disables page scrolling */}
          <Flex direction="column" h="100vh" overflowY="hidden">
            
            {/* Navbar (Fixed Height) */}
            <Navbar h={NAVBAR_HEIGHT} /> 

            {/* Content Area (Takes remaining height and handles its own scrolling) */}
            <Box 
              flex="1" 
              overflowY="auto" 
              // Optional: Add padding to separate content from the screen edges
              p={0} 
            >
              <Routes>
                {/* ---------------------------------------------------- */}
                {/* 1. PUBLIC ROUTES */}
                {/* ---------------------------------------------------- */}
                <Route path="/" element={<Home />} />
                <Route path="/properties" element={<PropertyList />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />
                
                {/* Authentication Pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                
                {/* ---------------------------------------------------- */}
                {/* 2. ADMIN ROUTES */}
                {/* ---------------------------------------------------- */}
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/properties" element={<AdminProperties />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/bookings" element={<AdminBookings />} />
                  <Route path="/admin/chat" element={<AdminChatPage />} />
                  <Route path="/admin/chat/:userId" element={<AdminChatPage />} />
                </Route>

                {/* ---------------------------------------------------- */}
                {/* 3. OWNER ROUTES */}
                {/* ---------------------------------------------------- */}
                <Route
                  element={<ProtectedRoute allowedRoles={["property_owner"]} />}
                >
                  <Route path="/owner" element={<OwnerDashboard />} />
                  <Route path="/owner/properties" element={<OwnerProperties />} />
                  <Route path="/owner/add-property" element={<AddProperty />} />
                  <Route path="/owner/property/:id" element={<ManageProperty />} />
                  <Route path="/owner/bookings" element={<OwnerBookings />} />
                  <Route path="/owner/profile" element={<OwnerProfile />} />
                  <Route path="/owner/chats" element={<OwnerChatListPage />} />
                  
                  {/* Owner Chat Routes */}
                  <Route path="/owner/chat-admin" element={<OwnerChatPage />} />
                  <Route
                    path="/owner/chat-client/:clientId"
                    element={<OwnerChatClientPage />}
                  />
                </Route>

                {/* ---------------------------------------------------- */}
                {/* 4. CLIENT ROUTES */}
                {/* ---------------------------------------------------- */}
                <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
                  <Route path="/my-bookings" element={<MyBookings />} />
                  <Route path="/profile" element={<Profile />} /> 
                  <Route path="/client/chats" element={<ClientChatListPage />} />
                  
                  {/* Client Chat Routes */}
                  <Route path="/client/chat-admin" element={<ClientChatPage />} />
                  <Route
                    path="/client/chat-owner/:propertyId/:ownerId"
                    element={<ClientOwnerChatPage />}
                  />
                </Route>
                
                {/* ---------------------------------------------------- */}
                {/* 5. FALLBACK ROUTE */}
                {/* ---------------------------------------------------- */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Box>
          </Flex>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;