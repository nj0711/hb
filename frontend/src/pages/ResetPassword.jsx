import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel, // Imported Box
  Heading,
  Icon,
  Input, // Imported Heading
  InputGroup,
  InputLeftElement,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { LockKeyhole, ShieldCheck } from "lucide-react"; // Imported icons
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validation
    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both fields",
        status: "error",
      });
      return;
    }

    // Add min length check for a stronger password
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        status: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        status: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // NOTE: Ensure your backend endpoint handles the token from the URL params
      await axios.put(`/api/auth/reset-password/${token}`, { password });
      toast({
        title: "Success! 🎉",
        description: "Your password has been updated. Please log in.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      navigate("/login");
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Something went wrong. The link might be invalid or expired.",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIX: Use Flex to take minH="100%" (from App.jsx content box) and center the content
    <Flex 
        minH="100%" 
        align="center" 
        justify="center" 
        bg="gray.50" 
        p={4}
    >
        <Box 
            p={{ base: 6, md: 8 }} 
            maxW="md" 
            w="full" 
            bg="white" 
            borderRadius="xl" 
            boxShadow="2xl" // Enhanced shadow
            borderWidth={1}
        >
            <VStack as="form" spacing={6} onSubmit={handleSubmit} align="stretch">
                <Icon as={ShieldCheck} w={12} h={12} color="blue.500" mx="auto" /> 
                <Heading size="xl" textAlign="center" color="gray.700">
                    Set New Password
                </Heading>
                <Text color="gray.500" textAlign="center" mb={4}>
                    Enter your new secure password below.
                </Text>

                <FormControl isRequired>
                    <FormLabel fontWeight="medium">New Password</FormLabel>
                    <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                            <Icon as={LockKeyhole} color="gray.400" />
                        </InputLeftElement>
                        <Input
                            type="password"
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            variant="filled" 
                            focusBorderColor="blue.500"
                        />
                    </InputGroup>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel fontWeight="medium">Confirm Password</FormLabel>
                    <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                            <Icon as={LockKeyhole} color="gray.400" />
                        </InputLeftElement>
                        <Input
                            type="password"
                            placeholder="Repeat new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            variant="filled"
                            focusBorderColor="blue.500"
                        />
                    </InputGroup>
                </FormControl>

                <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={loading}
                    width="full"
                    size="lg"
                    mt={4}
                    boxShadow="md"
                    _hover={{ boxShadow: 'lg' }}
                >
                    Reset Password
                </Button>
            </VStack>
        </Box>
    </Flex>
  );
};

export default ResetPassword;