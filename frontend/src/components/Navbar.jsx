// frontend/src/components/Navbar.jsx
import {
  Box,
  Button,
  Collapse,
  Flex,
  Heading,
  HStack,
  IconButton,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import {
  Building,
  Calendar,
  Home,
  LayoutDashboard, // Added for logout button
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  User, // Added for login button
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onToggle } = useDisclosure();

  // --- REVISED COLOR PALETTE FOR PREMIUM LOOK ---
  const navBg = useColorModeValue("white", "gray.900");
  const primaryColor = "blue.600";
  const linkColor = useColorModeValue("gray.600", "gray.300");
  const linkHoverBg = useColorModeValue("blue.50", "blue.800");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getHomeRoute = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin";
    if (user.role === "property_owner") return "/owner";
    return "/";
  };

  // --- LINKS (No change from last step, as they were already good) ---
  const clientLinks = [
    { to: "/properties", label: "Properties", icon: Building },
    { to: "/my-bookings", label: "My Bookings", icon: Calendar },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/client/chats", label: "Chats", icon: MessageSquare },
  ];

  const ownerLinks = [
    { to: "/owner", label: "Dashboard", icon: LayoutDashboard },
    { to: "/owner/properties", label: "My Properties", icon: Home },
    { to: "/owner/bookings", label: "Bookings", icon: Calendar },
    { to: "/owner/profile", label: "Profile", icon: User },
    { to: "/owner/chats", label: "Chats", icon: MessageSquare },
  ];

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/chat", label: "Chats", icon: MessageSquare },
  ];

  const publicLinks = [
    { to: "/properties", label: "Properties", icon: Building },
  ];

  const getLinks = () => {
    if (!user) return publicLinks;
    if (user.role === "admin") return adminLinks;
    if (user.role === "property_owner") return ownerLinks;
    return clientLinks;
  };
  // ---------------------------------

  return (
    <Box
      bg={navBg}
      // STRONGER SHADOW: Use 2xl for a prominent, floating effect
      boxShadow="2xl" 
      px={{ base: 4, md: 8 }} // Increased padding
      py={4} // Increased vertical padding
      position="sticky"
      top="0"
      zIndex="1000"
      borderBottom="1px solid" // Subtle border for definition
      borderColor="gray.100"
    >
      <Flex maxW="container.xl" mx="auto" align="center" justify="space-between">
        {/* Logo */}
        <Heading
          size={{ base: "lg", lg: "xl" }} // Larger logo on all screens
          color={primaryColor} // Use primary color
          letterSpacing="tight" // Tighter letter spacing for a modern look
          fontWeight="900" // Maximum bold
        >
          <Link to={getHomeRoute()}>LodgeLink</Link>
        </Heading>

        {/* Desktop Nav */}
        <HStack spacing={8} display={{ base: "none", md: "flex" }}>
          {getLinks().map((link) => (
            <Button
              key={link.to}
              as={Link}
              to={link.to}
              variant="link"
              color={linkColor}
              fontSize="md"
              fontWeight="medium"
              transition="color 0.2s ease-in-out, transform 0.2s ease-in-out" // Added transition for smoothness
              _hover={{
                color: primaryColor,
                textDecoration: "none",
                transform: "translateY(-1px)",
              }}
            >
              {link.label}
            </Button>
          ))}
          {user ? (
            <Button
              colorScheme="red"
              variant="solid"
              size="md" // Slightly larger button
              onClick={handleLogout}
              leftIcon={<LogOut size={18} />}
              // POLISHED HOVER EFFECT
              boxShadow="md"
              _hover={{
                boxShadow: "lg",
                transform: "translateY(-1px)",
              }}
            >
              Logout
            </Button>
          ) : (
            <HStack spacing={3}>
              <Button 
                as={Link} 
                to="/login" 
                size="md" 
                colorScheme="blue" 
                variant="ghost" // Use ghost for Login to de-emphasize slightly
                leftIcon={<LogIn size={18} />}
                _hover={{
                  bg: "blue.50",
                  color: primaryColor,
                }}
              >
                Login
              </Button>
              <Button
                as={Link}
                to="/register"
                size="md"
                variant="solid" // Use solid for Register to make it the main CTA
                colorScheme="blue"
                leftIcon={<UserPlus size={18} />}
                 // POLISHED HOVER EFFECT
                boxShadow="lg" 
                _hover={{
                  boxShadow: "xl",
                  transform: "translateY(-1px)",
                  bg: "blue.700"
                }}
              >
                Register
              </Button>
            </HStack>
          )}
        </HStack>

        {/* Mobile Menu Toggle */}
        <IconButton
          display={{ base: "flex", md: "none" }}
          aria-label="Toggle menu"
          icon={isOpen ? <X /> : <Menu />}
          variant="ghost"
          colorScheme="blue"
          onClick={onToggle}
          size="lg"
        />
      </Flex>

      {/* Mobile Menu */}
      <Collapse in={isOpen} animateOpacity>
        <VStack
          align="start"
          bg={navBg}
          px={{ base: 4, md: 8 }}
          py={4}
          spacing={2}
          display={{ md: "none" }}
          borderTop="1px solid"
          borderColor="gray.200"
        >
          {getLinks().map((link) => (
            <Button
              key={link.to}
              as={Link}
              to={link.to}
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              color={linkColor}
              leftIcon={<link.icon size={18} />}
              _hover={{ bg: linkHoverBg, color: primaryColor }}
              onClick={onToggle}
            >
              {link.label}
            </Button>
          ))}
          {user ? (
            <Button
              colorScheme="red"
              w="full"
              variant="solid"
              leftIcon={<LogOut size={18} />}
              onClick={() => {
                handleLogout();
                onToggle();
              }}
            >
              Logout
            </Button>
          ) : (
            <VStack w="full" spacing={2} pt={2}>
              <Button
                as={Link}
                to="/login"
                w="full"
                colorScheme="blue"
                variant="solid"
                leftIcon={<LogIn size={18} />}
                onClick={onToggle}
              >
                Login
              </Button>
              <Button
                as={Link}
                to="/register"
                w="full"
                variant="outline"
                colorScheme="blue"
                leftIcon={<UserPlus size={18} />}
                onClick={onToggle}
              >
                Register
              </Button>
            </VStack>
          )}
        </VStack>
      </Collapse>
    </Box>
  );
};

export default Navbar;