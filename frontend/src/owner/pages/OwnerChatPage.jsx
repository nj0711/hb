// src/pages/OwnerChatPage.jsx (IMPROVED DESIGN)

import { ChatIcon, CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import {
    Avatar,
    Box,
    Center,
    Heading, // Added VStack
    HStack,
    Spinner, // Added Avatar
    Tag,
    Text,
    useColorModeValue,
    VStack
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import ChatBox from "../../components/ChatBox";
import { useAuth } from "../../context/AuthContext";

const OwnerChatPage = () => {
    const { token } = useAuth();
    const [adminId, setAdminId] = useState(null);
    const [adminName, setAdminName] = useState("Admin Support"); // Default name
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Aesthetic Colors ---
    const pageBg = useColorModeValue("gray.50", "gray.900"); 
    const cardBg = useColorModeValue("white", "gray.800"); 
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const primaryColor = useColorModeValue("blue.500", "blue.300");
    // ---

    useEffect(() => {
        const fetchAdmin = async () => {
            if (!token) {
                setIsLoading(false);
                setError("Authentication token is missing. Please log in.");
                return;
            }
            try {
                const res = await axios.get("/api/users/admins", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                if (res.data.length > 0) {
                    const primaryAdmin = res.data[0];
                    setAdminId(primaryAdmin._id);
                    // Use the fetched name, capitalized, or the default
                    setAdminName(primaryAdmin.name ? primaryAdmin.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Admin Support");
                } else {
                    setError("No active administrator account found.");
                }
            } catch (err) {
                console.error("Error fetching admin:", err.response || err);
                setError("Failed to connect to the admin chat service.");
            } finally {
                setIsLoading(false);
            }
        };

        setAdminId(null);
        setError(null);
        setIsLoading(true);
        fetchAdmin();
    }, [token]);

    // ----------------------------------------------------------------
    // --- Loading & Error States (Enhanced) ---
    // ----------------------------------------------------------------

    if (isLoading) {
        return (
            <Center 
                h="calc(100vh - 80px)" // Full available height
                bg={pageBg}
            >
                <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" thickness="4px" />
                    <Heading size="md" color="gray.500">Connecting to Admin Support...</Heading>
                </VStack>
            </Center>
        );
    }
    
    if (!adminId || error) {
        return (
            <Center 
                h="calc(100vh - 80px)" 
                bg={pageBg}
            >
                <VStack p={10} bg={cardBg} borderRadius="lg" shadow="xl" maxW="450px" textAlign="center">
                    <WarningIcon w={10} h={10} color="red.500" mb={4} />
                    <Heading size="lg" mb={2}>Chat Unavailable</Heading>
                    <Text color="gray.500">
                        {error || "Could not connect to the administrator for chat. Please verify configurations."}
                    </Text>
                    <Text fontSize="sm" color="gray.400" mt={3}>
                        If you require urgent assistance, please use email support.
                    </Text>
                </VStack>
            </Center>
        );
    }

    // ----------------------------------------------------------------
    // --- Main Chat View (Modern App Layout) ---
    // ----------------------------------------------------------------

    return (
        <Center
            // Center the chat application interface on the screen
            h={{ base: "calc(100vh - 64px)", lg: "85vh" }}
            maxW="900px" // Focus the chat box for better experience
            mx="auto"
            mt={{ base: 0, lg: 8 }}
            w="full"
            p={{ base: 0, lg: 4 }} 
            bg={pageBg}
        >
            <VStack
                // Inner container simulating the 'Chat Application' box
                w="full"
                h="full"
                borderRadius={{ base: 'none', lg: "2xl" }}
                overflow="hidden"
                shadow="2xl"
                bg={cardBg}
                spacing={0}
                align="stretch"
            >
                {/* 1. Header / Title Bar (Integrated Design) */}
                <HStack
                    p={4}
                    bg={useColorModeValue("gray.50", "gray.700")} // Slightly different background for header
                    borderBottom="1px solid"
                    borderColor={borderColor}
                    justify="space-between"
                    align="center"
                    minH="70px"
                >
                    <HStack spacing={3}>
                        <Avatar
                            size="md" 
                            name={adminName}
                            // Placeholder icon or real admin avatar if available
                            icon={<ChatIcon fontSize="1.5rem" />} 
                            bg={primaryColor}
                            color="white"
                        />
                        <VStack align="flex-start" spacing={0}>
                            <HStack>
                                <Heading size="md" fontWeight="bold">
                                    {adminName}
                                </Heading>
                                <Tag 
                                    size="sm" 
                                    colorScheme="green" 
                                    variant="subtle"
                                    ml={2}
                                    borderRadius="full"
                                >
                                    <CheckCircleIcon mr={1} /> Online
                                </Tag>
                            </HStack>
                            <Text fontSize="sm" color="gray.500">
                                Official System Support
                            </Text>
                        </VStack>
                    </HStack>
                </HStack>

                {/* 2. Chat Box Container (Fills remaining space) */}
                <Box 
                    flex="1" // Crucial: Makes the ChatBox fill the remaining vertical space
                    // Background here is the chat background (lighter than header)
                    bg={cardBg} 
                    overflow="hidden"
                >
                    <ChatBox 
                        receiverId={adminId} 
                        // You can pass a prop to customize the ChatBox's internal styling 
                        // if you want the sender/receiver bubbles to match the Owner theme.
                    />
                </Box>
            </VStack>
        </Center>
    );
};

export default OwnerChatPage;