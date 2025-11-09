import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Flex, // Added SimpleGrid for better layout
    FormControl, // Added FormControl for proper labeling in edit mode
    FormLabel,
    Heading,
    HStack,
    Icon,
    Input,
    SimpleGrid,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaEnvelope, FaLock, FaMapMarkerAlt, FaPhone, FaSave, FaTimes, FaUserEdit } from 'react-icons/fa'; // Added Icons
import { MdVerifiedUser } from 'react-icons/md';
import { useAuth } from "../../context/AuthContext";

// Configure default base URL for axios (assuming it's not set globally elsewhere)
// axios.defaults.baseURL = 'http://localhost:5000'; 

const statusColor = (status) => {
    if (status === "active") return "green";
    if (status === "inactive") return "yellow";
    if (status === "suspended") return "red";
    return "gray";
};

// Component to display a single field in read mode
const DetailItem = ({ icon, label, value }) => (
    <HStack spacing={3} align="start" p={2} bg="gray.50" borderRadius="md" w="full">
        <Icon as={icon} color="blue.500" w={5} h={5} mt={0.5} />
        <Box>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">{label}</Text>
            <Text fontWeight="bold" color="gray.800">{value || "Not provided"}</Text>
        </Box>
    </HStack>
);

const OwnerProfile = () => {
    const { user, setUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        password: "", // Always clear on initialization
        phone: user?.phone || "",
        address: user?.address || "",
    });
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    // Sync form with user data and reset password field
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                email: user.email || "",
                password: "", // Crucially, ensure password is reset
                phone: user.phone || "",
                address: user.address || "",
            });
        }
    }, [user]);

    if (!user) return (
        <Flex justify="center" align="center" h="100vh">
            <Text fontSize="xl" color="gray.500">You need to log in to view your profile.</Text>
        </Flex>
    );

    const handleChange = (e) =>
        setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            
            // Only include password if it's not blank
            const updateData = form.password 
                ? form 
                : Object.fromEntries(
                      Object.entries(form).filter(([key]) => key !== 'password')
                  );

            const res = await axios.put(`/api/users/${user._id}`, updateData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (setUser) setUser(res.data);

            toast({ 
                title: "Profile updated successfully! 🎉", 
                status: "success",
                duration: 3000
            });
            setEditing(false);
            setForm((s) => ({ ...s, password: "" })); // Clear password field after successful save
        } catch (err) {
            toast({
                title: "Error updating profile",
                description: err.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 5000
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box p={{ base: 4, md: 8 }} maxW="800px" mx="auto">
            <Card shadow="2xl" borderRadius="2xl" overflow="hidden" bg="white" border="1px solid" borderColor="gray.100">
                
                {/* Header Section */}
                <CardHeader bg="blue.500" color="white" pt={6} pb={4}>
                    <Flex align="center" gap={4}>
                        <Avatar name={user.name} size="xl" bg="white" color="blue.500" />
                        <Box>
                            <Heading size="xl" fontWeight="extrabold">{user.name} <Icon as={MdVerifiedUser} w={6} h={6} ml={1} color="yellow.300" /></Heading>
                            <Text fontSize="lg" opacity={0.9} mt={1}>{user.role.toUpperCase()} Profile</Text>
                            <Badge 
                                colorScheme={statusColor(user.status)} 
                                mt={2} 
                                fontSize="sm"
                                variant="solid"
                                p={1.5}
                                borderRadius="lg"
                            >
                                Status: {user.status.toUpperCase()}
                            </Badge>
                        </Box>
                    </Flex>
                </CardHeader>

                <Divider />

                {/* Body Section (Details or Edit Form) */}
                <CardBody p={{ base: 4, md: 8 }}>
                    {!editing ? (
                        <VStack align="stretch" spacing={5}>
                            <Heading size="md" color="gray.700" mb={2}>Personal Information</Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                                <DetailItem icon={FaEnvelope} label="Email Address" value={user.email} />
                                <DetailItem icon={FaPhone} label="Phone Number" value={user.phone} />
                            </SimpleGrid>
                            <Box>
                                <DetailItem icon={FaMapMarkerAlt} label="Registered Address" value={user.address} />
                            </Box>
                        </VStack>
                    ) : (
                        <VStack spacing={6} align="stretch">
                            <Heading size="lg" color="blue.600">Edit Profile</Heading>

                            <FormControl id="name">
                                <FormLabel>Full Name</FormLabel>
                                <Input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Full Name"
                                    size="lg"
                                />
                            </FormControl>
                            
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                <FormControl id="email">
                                    <FormLabel>Email</FormLabel>
                                    <Input
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="Email"
                                        type="email"
                                        size="lg"
                                    />
                                </FormControl>
                                <FormControl id="phone">
                                    <FormLabel>Phone</FormLabel>
                                    <Input
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="Phone Number"
                                        size="lg"
                                    />
                                </FormControl>
                            </SimpleGrid>

                            <FormControl id="address">
                                <FormLabel>Address</FormLabel>
                                <Input
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="Complete Address"
                                    size="lg"
                                />
                            </FormControl>

                            <FormControl id="password">
                                <FormLabel><Icon as={FaLock} mr={2} /> New Password</FormLabel>
                                <Input
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="New password (leave blank to keep current)"
                                    type="password"
                                    size="lg"
                                />
                                <Text fontSize="sm" color="gray.500" mt={1}>Required only if you wish to change your password.</Text>
                            </FormControl>
                        </VStack>
                    )}
                </CardBody>

                <Divider />

                {/* Footer Section (Buttons) */}
                <CardFooter bg="gray.50" py={5} px={{ base: 4, md: 8 }}>
                    {!editing ? (
                        <Button 
                            colorScheme="blue" 
                            onClick={() => setEditing(true)}
                            leftIcon={<FaUserEdit />}
                            size="lg"
                            boxShadow="md"
                        >
                            Edit Profile
                        </Button>
                    ) : (
                        <HStack spacing={4}>
                            <Button
                                isLoading={saving}
                                colorScheme="green"
                                onClick={handleSave}
                                leftIcon={<FaSave />}
                                size="lg"
                            >
                                Save Changes
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditing(false);
                                    // Reset the form state to the current user data + clear password
                                    setForm({
                                        name: user.name || "",
                                        email: user.email || "",
                                        password: "",
                                        phone: user.phone || "",
                                        address: user.address || "",
                                    });
                                }}
                                leftIcon={<FaTimes />}
                                size="lg"
                            >
                                Cancel
                            </Button>
                        </HStack>
                    )}
                </CardFooter>
            </Card>
        </Box>
    );
};

export default OwnerProfile;