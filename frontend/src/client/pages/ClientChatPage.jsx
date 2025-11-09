import {
    Box,
    Center,
    Heading,
    Spinner,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import ChatBox from "../../components/ChatBox";
import { useAuth } from "../../context/AuthContext";

const ClientChatPage = () => {
    // Destructure user as well for a preliminary login check
    const { token, user } = useAuth(); 
    const [adminId, setAdminId] = useState(null);
    const [loading, setLoading] = useState(true);
    // Use a more descriptive state for the error message
    const [errorMessage, setErrorMessage] = useState(null); 

    // Color for the container box
    const bgColor = useColorModeValue("gray.50", "gray.900");
    const containerBg = useColorModeValue("white", "gray.800");

    const fetchAdmin = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setErrorMessage("Authentication token is missing. Please log in.");
            return;
        }

        try {
            const res = await axios.get("/api/users/admins", {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (res.data.length > 0) {
                setAdminId(res.data[0]._id); // pick the first admin
            } else {
                setErrorMessage("No administrators found to chat with. Please try again later.");
            }
        } catch (err) {
            console.error("Error fetching admin:", err);
            
            // --- IMPROVED ERROR HANDLING ---
            let message = "Failed to connect to chat service.";
            if (err.response) {
                if (err.response.status === 401 || err.response.status === 403) {
                    message = "Authorization failed. Please log in again.";
                } else {
                    message = err.response.data?.message || `Server error: Status ${err.response.status}`;
                }
            } else if (err.request) {
                 message = "Network error: Could not reach the chat server.";
            }
            setErrorMessage(message);

        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAdmin();
    }, [fetchAdmin]);


    // --- Preliminary Login Check ---
    if (!user) {
        return (
            <Center h="80vh" bg={bgColor}>
                <Text color="orange.500" fontSize="xl">
                    You must be logged in to access the Support Chat.
                </Text>
            </Center>
        );
    }
    
    // --- Loading and Error States ---

    if (loading) {
        return (
            <Center h="80vh" bg={bgColor}>
                <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" thickness="4px" />
                    <Text color="gray.500">Connecting to Support Admin...</Text>
                </VStack>
            </Center>
        );
    }

    if (errorMessage) {
        return (
            <Center h="80vh" bg={bgColor}>
                <Box p={8} bg={containerBg} borderRadius="lg" shadow="md">
                    <Heading size="lg" color="red.500">Support Chat Unavailable</Heading>
                    <Text mt={4} color={useColorModeValue("gray.700", "gray.300")}>{errorMessage}</Text>
                    <Text mt={2} fontSize="sm" color="gray.500">If the issue persists, please contact technical support.</Text>
                </Box>
            </Center>
        );
    }

    // --- Main Chat View ---

    return (
        <Box 
            p={{ base: 4, md: 8 }} 
            minH="calc(100vh - 64px)" 
            bg={bgColor}
        >
            <VStack
                spacing={6}
                maxW="800px" 
                mx="auto" 
                h={{ base: "calc(100vh - 120px)", md: "75vh" }} 
                align="stretch"
            >
                <Heading size="lg" color={useColorModeValue("gray.700", "gray.100")}>
                    Support Chat
                </Heading>

                {/* The ChatBox component itself */}
                <Box flex="1" h="100%" borderRadius="xl" shadow="xl" overflow="hidden">
                    <ChatBox receiverId={adminId} />
                </Box>
            </VStack>
        </Box>
    );
};

export default ClientChatPage;