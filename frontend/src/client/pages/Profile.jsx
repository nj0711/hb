import { useEffect, useState } from "react";
// Since external imports are failing, we'll assume the necessary components
// are available via a global context or direct inclusion, but structurally,
// we must retain the original import structure to maintain component integrity
// for when the environment is correctly configured. 
import {
    Avatar,
    Badge,
    Box,
    Button,
    Center,
    Divider,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Icon,
    Input,
    SimpleGrid,
    Spinner,
    Text,
    useColorModeValue,
    useToast,
    VStack
} from "@chakra-ui/react"; // Chakra UI components (failing import)
import axios from "axios"; // Assuming axios is available
import { useAuth } from "../../context/AuthContext"; // Local Auth Context (failing import)
// Importing icons (failing imports)
import { BsCalendarFill } from 'react-icons/bs';
import { FaEnvelope, FaLock, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { MdCancel, MdEdit, MdSave } from 'react-icons/md';

// Helper function to capitalize the first letter of a string (handling "john doe" -> "John Doe")
const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

// Helper function to map user status to Chakra color schemes
const statusColor = (status) => {
    if (status === "active") return "green";
    if (status === "inactive") return "yellow";
    if (status === "suspended") return "red";
    return "gray";
};

// Sub-component for displaying a single profile field (used in Read View)
const ProfileDetail = ({ icon, label, value }) => {
    const iconColor = useColorModeValue("blue.500", "blue.300");
    const labelColor = "secondary-text";
    const valueColor = "primary-text";
    const boxBg = "card-bg"; 
    const boxHoverBg = useColorModeValue("gray.50", "gray.750"); 

    return (
        <VStack 
            align="stretch" 
            p={4} 
            borderRadius="xl"
            bg={boxBg}
            shadow="sm" 
            border="1px solid"
            borderColor="border-color"
            transition="all 0.2s"
            _hover={{ bg: boxHoverBg }}
        >
            <HStack spacing={3}>
                <Icon as={icon} boxSize={5} color={iconColor} />
                <Text fontSize="sm" fontWeight="medium" color={labelColor}>
                    {label}
                </Text>
            </HStack>
            <Text fontSize="md" fontWeight="semibold" color={valueColor} wordBreak="break-word" pl={8}>
                {value || "Not specified"}
            </Text>
        </VStack>
    );
};


const Profile = () => {
    // Global semantic tokens
    const pageBg = 'app-bg'; 
    const cardBg = 'card-bg';
    const borderColor = 'border-color';
    const panelBg = useColorModeValue("white", "gray.800"); 

    const { user, setUser, loading } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
    });
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    // Mock joined date for display purposes
    // NOTE: In a real app, this should come from user.createdAt or similar API field.
    const joinedDate = "January 15, 2023"; 

    // Sync form whenever user changes
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                email: user.email || "",
                password: "",
                phone: user.phone || "",
                address: user.address || "",
            });
        }
    }, [user]);

    // Handle loading state
    if (loading) {
        return (
            <Center minH="100vh" bg={pageBg}>
                <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" thickness="4px" />
                    <Text color="primary-text">Loading profile...</Text>
                </VStack>
            </Center>
        );
    }

    if (!user) return <Text color="primary-text" p={8}>You need to log in to view profile</Text>;

    const handleChange = (e) =>
        setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

    // Validation logic 
    const validateForm = () => {
        if (!form.name || form.name.trim().length < 2) return "Name must be at least 3 characters";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.email || !emailRegex.test(form.email)) return "Invalid email address";
        if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) return "Phone must be 10 digits starting with 6, 7, 8, or 9";
        if (form.address && form.address.trim().length < 5) return "Address must be at least 5 characters";
        if (form.password && form.password.length < 6) return "Password must be at least 6 characters";
        return null;
    };

    const handleSave = async () => {
        const errorMsg = validateForm();
        if (errorMsg) {
            toast({ title: "Validation Error", description: errorMsg, status: "error" });
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            const updatePayload = { 
                ...form, 
                ...(form.password ? { password: form.password } : {}) 
            };
            
            // NOTE: In a real environment, this axios call updates the backend user data
            const res = await axios.put(`/api/users/${user._id}`, updatePayload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (setUser) setUser(res.data);

            toast({ title: "Profile updated successfully", status: "success" });
            setEditing(false);
            setForm((s) => ({ ...s, password: "" }));
        } catch (err) {
            console.error("Error updating profile", err);
            toast({
                title: "Error updating profile",
                description: err.response?.data?.message || "Something went wrong",
                status: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditing(false);
        // Reset form state to current user data
        setForm({
            name: user.name || "",
            email: user.email || "",
            password: "",
            phone: user.phone || "",
            address: user.address || "",
        });
    }

    const displayName = capitalizeFirstLetter(user.name);

    // --- Main Layout ---
    return (
        <Box p={6} maxW="1200px" mx="auto" bg={pageBg} minH="90vh">
            <VStack spacing={8} align="stretch">
                <Heading 
                    fontSize={{ base: "3xl", md: "4xl" }} 
                    fontWeight="extrabold" 
                    color="primary-text"
                >
                    {displayName}'s Dashboard
                </Heading>

                {/* --- Two-Column Dashboard Layout --- */}
                <SimpleGrid 
                    templateColumns={{ base: "1fr", md: "300px 1fr" }} 
                    spacing={{ base: 8, md: 10 }}
                    alignItems="flex-start" 
                >
                    {/* LEFT PANEL: PROFILE SUMMARY (The "Personal Website" Card) */}
                    <Box 
                        p={6}
                        bg={panelBg} 
                        borderRadius="2xl" 
                        shadow="xl" 
                        border="1px solid"
                        borderColor={borderColor}
                        position="sticky"
                        top="6"
                    >
                        <VStack spacing={6} align="center">
                            <Avatar 
                                name={displayName} 
                                size="2xl" 
                                src={user.avatarUrl}
                                border="4px solid"
                                borderColor="blue.500" 
                            />
                            <VStack spacing={0} textAlign="center">
                                <Heading size="lg" color="primary-text">{displayName}</Heading>
                                <Text fontSize="md" color="secondary-text">{user.email}</Text>
                            </VStack>

                            <Divider borderColor={borderColor} />

                            <VStack spacing={2} align="stretch" w="full">
                                <HStack justify="space-between" w="full">
                                    <Text fontWeight="semibold" color="secondary-text">Role:</Text>
                                    <Text color="primary-text">{user.role ? user.role.toUpperCase() : 'CLIENT'}</Text>
                                </HStack>
                                <HStack justify="space-between" w="full">
                                    <Text fontWeight="semibold" color="secondary-text">Status:</Text>
                                    <Badge 
                                        colorScheme={statusColor(user.status)} 
                                        variant="solid" 
                                        borderRadius="md"
                                        px={3}
                                    >
                                        {user.status.toUpperCase()}
                                    </Badge>
                                </HStack>
                            </VStack>
                            
                            <Divider borderColor={borderColor} />
                            
                            {/* Edit Button in the fixed panel */}
                            {!editing ? (
                                <Button 
                                    colorScheme="blue" 
                                    onClick={() => setEditing(true)}
                                    leftIcon={<Icon as={MdEdit} />}
                                    w="full"
                                    size="md"
                                >
                                    Edit Profile
                                </Button>
                            ) : (
                                <Text color="blue.500" fontWeight="bold">Editing Mode Active</Text>
                            )}

                        </VStack>
                    </Box>

                    {/* RIGHT PANEL: DETAILS & FORM (The Dynamic Content) */}
                    <Box>
                        {editing ? (
                             // --- EDIT MODE ---
                            <VStack spacing={8} align="stretch" p={8} bg={cardBg} borderRadius="2xl" shadow="md">
                                <Heading size="lg" color="blue.500">Update Account Information</Heading>
                                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                                    <FormControl id="name">
                                        <FormLabel color="secondary-text">Full Name</FormLabel>
                                        <Input name="name" value={form.name} onChange={handleChange} variant="filled" />
                                    </FormControl>

                                    <FormControl id="phone">
                                        <FormLabel color="secondary-text">Phone Number</FormLabel>
                                        <Input name="phone" value={form.phone} onChange={handleChange} type="tel" variant="filled" />
                                    </FormControl>
                                    
                                    <FormControl id="email" gridColumn={{ base: 'span 1', lg: 'span 2' }}>
                                        <FormLabel color="secondary-text">Email Address</FormLabel>
                                        <Input name="email" value={form.email} onChange={handleChange} variant="filled" />
                                    </FormControl>

                                    <FormControl id="address" gridColumn={{ base: 'span 1', lg: 'span 2' }}>
                                        <FormLabel color="secondary-text">Address</FormLabel>
                                        <Input name="address" value={form.address} onChange={handleChange} variant="filled" />
                                    </FormControl>
                                </SimpleGrid>

                                <Divider my={2} borderColor={borderColor} />

                                <Heading size="md" color="red.500" mt={4}>Change Password</Heading>
                                <FormControl id="password" maxW={{ base: 'full', lg: '50%' }}>
                                    <FormLabel color="secondary-text" display="flex" alignItems="center">
                                        <Icon as={FaLock} mr={2} /> New Password
                                    </FormLabel>
                                    <Input name="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current" type="password" variant="filled" />
                                </FormControl>
                                
                                <HStack spacing={4} pt={4} justify="flex-end">
                                    <Button 
                                        isLoading={saving} 
                                        colorScheme="green" 
                                        onClick={handleSave}
                                        leftIcon={<Icon as={MdSave} />}
                                        size="lg"
                                        minW="120px"
                                    >
                                        Save Changes
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        leftIcon={<Icon as={MdCancel} />}
                                        size="lg"
                                        minW="120px"
                                    >
                                        Cancel
                                    </Button>
                                </HStack>
                            </VStack>
                        ) : (
                            // --- READ VIEW ---
                            <VStack spacing={8} align="stretch">
                                <Box>
                                    <Heading size="lg" mb={4} color="primary-text" borderBottom="2px solid" borderColor="blue.500" pb={1}>
                                        Contact Information
                                    </Heading>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <ProfileDetail icon={FaEnvelope} label="Email Address" value={user.email} />
                                        <ProfileDetail icon={FaPhone} label="Phone Number" value={user.phone} />
                                    </SimpleGrid>
                                </Box>

                                <Box>
                                    <Heading size="lg" mb={4} color="primary-text" borderBottom="2px solid" borderColor="blue.500" pb={1}>
                                        Location & Tenure
                                    </Heading>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <ProfileDetail icon={FaMapMarkerAlt} label="Primary Address" value={user.address} />
                                        {/* Member Since Field */}
                                        <ProfileDetail 
                                            icon={BsCalendarFill} 
                                            label="Member Since" 
                                            value={joinedDate} 
                                        />
                                    </SimpleGrid>
                                </Box>
                            </VStack>
                        )}
                    </Box>
                </SimpleGrid>
            </VStack>
        </Box>
    );
};

export default Profile;