import {
    Box,
    Button,
    Divider,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    Icon,
    Image,
    Input,
    InputGroup,
    Radio,
    RadioGroup,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { motion } from "framer-motion";
import {
    Home,
    Lock,
    Mail,
    MapPin,
    Phone,
    User,
    UserPlus
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useAuth } from "../context/AuthContext";

// --- VALIDATION SCHEMA ---
const schema = yup.object({
    name: yup.string().min(3, "Name must be at least 3 characters").required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
    role: yup.string().oneOf(["client", "property_owner"], "Invalid role").required("Role is required"),
    phone: yup
        .string()
        .matches(/^[6-9]\d{9}$/, "Phone must be 10 digits and start with 6, 7, 8, or 9")
        .required("Phone is required"),
    address: yup.string().min(5, "Address must be at least 5 characters").required("Address is required"),
});

const MotionBox = motion(Box);

const Register = () => {
    const { register: registerUser } = useAuth(); 
    const navigate = useNavigate();
    const toast = useToast();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            role: 'client',
        }
    });

    const onSubmit = async (formData) => {
        try {
            const user = await registerUser(formData);
            toast({
                title: "Registration successful",
                description: "Welcome to LodgeLink! 🎉",
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
                title: "Registration failed",
                description: error.response?.data?.message || "Something went wrong during registration.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Flex 
            // FIX 1: Set minH to 100% of the parent container (the scrollable Box in App.jsx). 
            // This allows the container to grow with content but keeps alignment.
            minH="100%" 
            // FIX 2: Remove overflowY="auto" from here. App.jsx handles the scroll.
            bgGradient="linear(to-br, blue.50, white)"
        >
            
            {/* 1. Left Image Panel (Dynamic Height) */}
            <Box 
                flex="1" 
                display={{ base: "none", md: "block" }} 
                position="relative"
                // FIX 3: Set minH to 100% to fill the *content height*, not the viewport height.
                // This ensures the image background extends as far as the form content.
                minH="100%" 
            >
                <Image
                    src="https://images.unsplash.com/photo-1632398414290-15262b0ec12d?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aW5kaWFuJTIwaG91c2V8ZW58MHx8MHx8fDA%3D&ixlib=rb-4.1.0&q=60&w=3000"
                    alt="Indian apartment complex or residential building"
                    objectFit="cover"
                    w="100%"
                    h="100%"
                />
                {/* Overlay content unchanged */}
                <Flex 
                    position="absolute" 
                    top="0" 
                    left="0" 
                    w="100%" 
                    h="100%" 
                    bg="rgba(26, 32, 44, 0.6)" 
                    align="center" 
                    justify="center"
                    p={10}
                    textAlign="center"
                >
                    <VStack spacing={4} color="white" textShadow="1px 1px #000000">
                        <Icon as={Home} w={16} h={16} color="blue.300"/>
                        <Heading size="2xl" fontWeight="extrabold">
                            LodgeLink
                        </Heading>
                        <Text fontSize="xl" fontWeight="medium">
                            Web-based Application for Lodging Services
                        </Text>
                        <Divider w="50%" borderColor="blue.300" />
                        <Text fontSize="lg" maxW="400px">
                            Connect directly with property owners for accessible and reliable living facilities outside the typical metro hubs.
                        </Text>
                    </VStack>
                </Flex>
            </Box>

            {/* 2. Right Form Panel */}
            <Flex
                flex="1"
                maxW={{ base: "100%", md: "50%" }}
                align="center"
                // Set to flex-start and add padding to prevent content from touching the top edge when scrolled
                justify="center" 
                p={{ base: 4, md: 10 }}
            >
                <MotionBox
                    w="100%"
                    maxW="600px"
                    p={{base: 6, md: 8}} 
                    borderWidth={1}
                    borderRadius="xl"
                    boxShadow="2xl"
                    bg="white"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <VStack spacing={5}>
                        <Heading color="blue.600" size="xl" mb={1}>
                            Secure Your Lodging
                        </Heading>
                        <Text color="gray.600" fontSize="md" textAlign="center">
                            Register to find or list your ideal space.
                        </Text>
                        
                        <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
                            <VStack spacing={6} align="stretch" mt={4}>
                                
                                {/* 🌟 SECTION 1: ROLE SELECTION 🌟 */}
                                <Box p={3} bg="blue.50" borderRadius="md">
                                    <FormControl isInvalid={errors.role}>
                                        <FormLabel fontWeight="bold" color="blue.700" mb={3} textAlign="center">
                                            How will you use LodgeLink?
                                        </FormLabel>
                                        <RadioGroup 
                                            value={watch('role')}
                                            onChange={(nextValue) => setValue('role', nextValue, { shouldValidate: true })}
                                            name="role"
                                        >
                                            <Stack direction={{base: 'column', sm: 'row'}} spacing={4} justify="space-around">
                                                <Radio value="client" colorScheme="blue" size="lg">
                                                    <Icon as={User} mr={1} boxSize={5} /> I need lodging
                                                </Radio>
                                                <Radio value="property_owner" colorScheme="blue" size="lg">
                                                    <Icon as={Home} mr={1} boxSize={5} /> I own property
                                                </Radio>
                                            </Stack>
                                        </RadioGroup>
                                        <FormErrorMessage textAlign="center" mt={2}>{errors.role?.message}</FormErrorMessage>
                                    </FormControl>
                                </Box>

                                <Divider my={2} />

                                {/* 🌟 SECTION 2: PERSONAL DETAILS (Condensed) 🌟 */}
                                <Heading size="md" color="gray.700" mt={2} mb={0}>Personal & Contact Details</Heading>
                                
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                    {/* Name Field */}
                                    <FormControl isInvalid={errors.name}>
                                        <FormLabel>Full Name</FormLabel>
                                        <InputGroup size="lg">
                                            <Icon as={User} color="gray.400" ml={3} position="absolute" top="50%" transform="translateY(-50%)" zIndex={10} />
                                            <Input placeholder="Enter full name" {...register("name")} variant="flushed" pl={10}/>
                                        </InputGroup>
                                        <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                                    </FormControl>

                                    {/* Phone Field */}
                                    <FormControl isInvalid={errors.phone}>
                                        <FormLabel>Phone Number</FormLabel>
                                        <InputGroup size="lg">
                                            <Icon as={Phone} color="gray.400" ml={3} position="absolute" top="50%" transform="translateY(-50%)" zIndex={10} />
                                            <Input type="tel" placeholder="9876543210" {...register("phone")} variant="flushed" pl={10}/>
                                        </InputGroup>
                                        <FormErrorMessage>{errors.phone?.message}</FormErrorMessage>
                                    </FormControl>
                                </SimpleGrid>

                                {/* Address (Full width) */}
                                <FormControl isInvalid={errors.address}>
                                    <FormLabel>Residential Address</FormLabel>
                                    <Box position="relative"> 
                                        <Textarea 
                                            placeholder="House No, Street, City, State" 
                                            {...register("address")} 
                                            variant="flushed" 
                                            minH="80px"
                                            pl={10} 
                                        />
                                        
                                        <Icon 
                                            as={MapPin} 
                                            color="gray.400" 
                                            position="absolute"
                                            left="0"
                                            top="12px" 
                                            zIndex={10}
                                            boxSize={5} 
                                            ml={3} 
                                        />
                                    </Box>
                                    <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
                                </FormControl>

                                <Divider my={2} />

                                {/* 🌟 SECTION 3: ACCOUNT CREDENTIALS (Condensed) 🌟 */}
                                <Heading size="md" color="gray.700" mt={2} mb={0}>Account Credentials</Heading>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                    {/* Email Field */}
                                    <FormControl isInvalid={errors.email}>
                                        <FormLabel>Email Address</FormLabel>
                                        <InputGroup size="lg">
                                            <Icon as={Mail} color="gray.400" ml={3} position="absolute" top="50%" transform="translateY(-50%)" zIndex={10} />
                                            <Input type="email" placeholder="Your primary email" {...register("email")} variant="flushed" pl={10}/>
                                        </InputGroup>
                                        <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                                    </FormControl>

                                    {/* Password Field */}
                                    <FormControl isInvalid={errors.password}>
                                        <FormLabel>Password</FormLabel>
                                        <InputGroup size="lg">
                                            <Icon as={Lock} color="gray.400" ml={3} position="absolute" top="50%" transform="translateY(-50%)" zIndex={10} />
                                            <Input type="password" placeholder="Min 6 characters" {...register("password")} variant="flushed" pl={10}/>
                                        </InputGroup>
                                        <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                                    </FormControl>
                                </SimpleGrid>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    colorScheme="blue"
                                    width="full"
                                    isLoading={isSubmitting}
                                    leftIcon={<UserPlus size={18} />}
                                    size="lg"
                                    mt={6}
                                    boxShadow="lg"
                                    _hover={{ boxShadow: 'xl', bg: 'blue.700' }}
                                >
                                    Register Account
                                </Button>
                            </VStack>
                        </form>

                        <Text fontSize="sm" mt={4}>
                            Already a member?{" "}
                            <Button variant="link" colorScheme="blue" onClick={() => navigate("/login")} fontWeight="bold">
                                Login here
                            </Button>
                        </Text>
                    </VStack>
                </MotionBox>
            </Flex>
        </Flex>
    );
};

export default Register;