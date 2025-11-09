import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { motion } from "framer-motion";
import { Key, LogIn, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useAuth } from "../context/AuthContext";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const MotionBox = motion(Box);

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (formData) => {
    try {
      const user = await login(formData);

      toast({
        title: "Welcome back!",
        description: "You have logged in successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "property_owner":
          navigate("/owner");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    // FIX: Remove h="100vh" and overflow="hidden". 
    // This component should now simply fill the height given by the App.jsx Box wrapper.
    <Flex 
      minH="100%" // Ensure it fills the height of the parent Box in App.jsx
      bgGradient="linear(to-br, blue.50, white)"
    >
      
      {/* 1. Left Illustration - 50% width. This MUST retain h="100vh" if you want 
         the image to always fill the screen height, otherwise, it will only fill 
         the height of the content. We will calculate it against the viewport. */}
      <Box 
        flex={{ base: 'none', md: 1 }} 
        display={{ base: "none", md: "block" }} 
        position="relative"
        // Use 100vh or calc(100vh - NAV_HEIGHT) if you know the exact Navbar height 
        // and want this image side to be exactly full screen.
        h="calc(100vh - 60px)" // Assuming Navbar is 60px as per App.jsx suggestion
        overflow="hidden" // Hides any scroll artifacts on the image side
      >
        <Image
          src="https://plus.unsplash.com/premium_photo-1697729696966-399488ea5401?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8aW5kaWElMjBob3VzZXxlbnwwfHwwfHx8MA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000"
          alt="Modern property search background"
          objectFit="cover"
          w="100%"
          h="100%"
        />
        <Flex 
            position="absolute" 
            top="0" 
            left="0" 
            w="100%" 
            h="100%" 
            bg="rgba(49, 130, 206, 0.4)" 
            align="end" 
            justify="start"
            p={10}
        >
            <VStack align="start" color="white" textShadow="1px 1px #000000">
                <Heading size="xl">LodgeLink</Heading>
                <Text fontSize="lg">Your journey starts here. Find your ideal space.</Text>
            </VStack>
        </Flex>
      </Box>

      {/* 2. Right Form - Handles centering the form within the available space */}
      <Flex 
        flex={{ base: 1, md: 1 }} 
        align="center" 
        justify="center" 
        p={8}
        // Allows the form side to scroll if the form is too tall for the viewport 
        // (but App.jsx already handles this, so we rely on that)
      >
        {/* Removed Container - maxW is applied directly to MotionBox */}
        <MotionBox
          maxW="lg"
          w="full"
          p={{ base: 6, md: 10 }}
          borderWidth={1}
          borderRadius="xl"
          boxShadow="2xl"
          bg="white"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <VStack spacing={6}>
              <Icon as={LogIn} w={10} h={10} color="blue.500" />
              <Heading color="gray.800" size="xl">
                  Welcome Back
              </Heading>
              <Text color="gray.600">Sign in to access your dashboard</Text>
              <Divider />

            <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
              <VStack spacing={5} align="stretch">
                <FormControl isInvalid={errors.email}>
                  <FormLabel>Email</FormLabel>
                  <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                          <Icon as={Mail} color="gray.400" />
                      </InputLeftElement>
                      <Input
                          type="email"
                          placeholder="you@example.com"
                          {...register("email")}
                          variant="flushed"
                      />
                  </InputGroup>
                  <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={errors.password}>
                  <FormLabel>Password</FormLabel>
                  <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                          <Icon as={Key} color="gray.400" />
                      </InputLeftElement>
                      <Input
                          type="password"
                          placeholder="••••••••"
                          {...register("password")}
                          variant="flushed"
                      />
                  </InputGroup>
                  <FormErrorMessage>
                    {errors.password?.message}
                  </FormErrorMessage>
                </FormControl>

                <HStack justify="flex-end" py={1}>
                  <Button
                    variant="link"
                    colorScheme="blue"
                    size="sm"
                    onClick={() => navigate("/forgot-password")}
                    fontWeight="normal"
                  >
                    Forgot Password?
                  </Button>
                </HStack>

                <Button
                  type="submit"
                  colorScheme="blue"
                  leftIcon={<LogIn size={18} />}
                  isLoading={isSubmitting}
                  w="full"
                  size="lg"
                  boxShadow="lg"
                  _hover={{
                      bg: "blue.700",
                      transform: "translateY(-1px)",
                      boxShadow: "xl",
                  }}
                  transition="all 0.2s ease-in-out"
                >
                  Sign In
                </Button>
              </VStack>
            </form>

            <Text fontSize="md" pt={2}>
              Don’t have an account?{" "}
              <Button
                variant="link"
                colorScheme="blue"
                onClick={() => navigate("/register")}
                fontWeight="bold"
              >
                Create Account
              </Button>
            </Text>
          </VStack>
        </MotionBox>
      </Flex>
    </Flex>
  );
};

export default Login;