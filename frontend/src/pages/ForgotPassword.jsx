import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/forgot-password", { email });
      toast({
        title: "Password reset link sent",
        description: "If an account exists, a password reset link has been sent to your email address.",
        status: "success",
        duration: 7000,
        isClosable: true,
      });
      setEmail("");
    } catch (err) {
      toast({
        title: "Error requesting reset",
        description: err.response?.data?.message || "Could not process request. Please try again.",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // The component no longer needs to use minH/h="100vh" or overflow, 
    // as the main page structure in App.jsx now handles the scrolling viewport.
    <Flex 
      minH="100%" // Use minH="100%" to fill the height of the parent Box in App.jsx
      align="center" 
      justify="center" 
      // The background color is now applied here (or on the parent Box in App.jsx)
      bg="gray.50" 
      p={4} // Add responsive padding to keep the card off the edges
    > 
        <Box 
            p={8} 
            maxW="md" 
            w="full" 
            bg="white" 
            borderRadius="xl" 
            boxShadow="2xl"
            borderWidth={1}
            // CRITICAL FIX: Remove maxH, overflowY, and css props. 
            // The Box will now size perfectly to its content, and App.jsx handles the rest.
        >
            <VStack as="form" spacing={6} onSubmit={handleSubmit} align="stretch">
                <Icon as={LockKeyhole} w={12} h={12} color="blue.500" mx="auto" /> 
                <Heading size="xl" textAlign="center" color="gray.700">
                    Forgot Password
                </Heading>
                <Text color="gray.500" textAlign="center" mb={4}>
                    Enter your email to receive a password reset link.
                </Text>

                <FormControl isRequired>
                    <FormLabel fontWeight="medium">Email Address</FormLabel>
                    <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                            <Icon as={Mail} color="gray.400" />
                        </InputLeftElement>
                        <Input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            variant="filled" 
                            focusBorderColor="blue.500"
                        />
                    </InputGroup>
                </FormControl>

                <Button 
                    type="submit" 
                    colorScheme="blue" 
                    isLoading={loading} 
                    loadingText="Sending Link..."
                    width="full"
                    size="lg"
                    mt={4}
                    boxShadow="md"
                    _hover={{ boxShadow: 'lg' }}
                >
                    Send Reset Link
                </Button>
            </VStack>
        </Box>
    </Flex>
  );
};

export default ForgotPassword;