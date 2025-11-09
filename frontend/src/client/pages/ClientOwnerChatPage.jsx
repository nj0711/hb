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
import { useParams } from "react-router-dom";
import ChatBox from "../../components/ChatBox";
import { useAuth } from "../../context/AuthContext";

// --- Helper Function to Capitalize the First Letter ---
const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    // Use a regular expression to target the first letter after any whitespace
    return string.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const ClientOwnerChatPage = () => {
    const { propertyId, ownerId } = useParams();
    const { user, token } = useAuth();
    
    // New state to hold fetched details for the heading
    const [chatTargetDetails, setChatTargetDetails] = useState({
        ownerName: null,
        propertyName: null,
        loading: true,
        error: false,
        errorMessage: "Failed to load chat details. Please try again." 
    });

    // Colors
    const bgColor = useColorModeValue("gray.50", "gray.900");

    // --- Data Fetching Logic (Updated to use capitalizeFirstLetter) ---
    const fetchChatDetails = useCallback(async () => {
        if (!ownerId || !token) {
             setChatTargetDetails(prev => ({ 
                ...prev, 
                loading: false, 
                error: true, 
                errorMessage: "Missing required parameters (owner or token)." 
            }));
            return;
        }

        // Reset loading state
        setChatTargetDetails(prev => ({ ...prev, loading: true, error: false }));

        try {
            // 1. Fetch Owner Name
            const ownerRes = await axios.get(`/api/users/${ownerId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            // ✅ Apply capitalization here
            let ownerName = capitalizeFirstLetter(ownerRes.data?.name || 'Property Owner');

            let propertyName = null;
            if (propertyId) {
                // 2. Fetch Property Name
                const propRes = await axios.get(`/api/properties/${propertyId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                // ✅ Apply capitalization here
                let rawPropName = propRes.data?.title || propRes.data?.name || `Property #${propertyId.substring(0, 6)}`;
                propertyName = capitalizeFirstLetter(rawPropName);
            }

            setChatTargetDetails({
                ownerName: ownerName,
                propertyName: propertyName,
                loading: false,
                error: false,
                errorMessage: null,
            });

        } catch (err) {
            console.error("Error fetching chat details:", err);
            
            let message = "An unknown error occurred while setting up the chat.";

            if (err.response) {
                if (err.response.status === 404) {
                    message = "One or more chat targets (Owner/Property) could not be found.";
                } else if (err.response.status === 401 || err.response.status === 403) {
                    message = "Authorization failed. Please log in again.";
                } else {
                    message = err.response.data?.message || `Server error: Status ${err.response.status}`;
                }
            } else if (err.request) {
                message = "Network error: Could not reach the chat service.";
            }

            setChatTargetDetails(prev => ({ 
                ...prev, 
                loading: false, 
                error: true, 
                errorMessage: message 
            }));
        }
    }, [ownerId, propertyId, token]);

    useEffect(() => {
        fetchChatDetails();
    }, [fetchChatDetails]);


    // --- Derived Heading Text ---
    const getHeadingText = () => {
        const { ownerName, propertyName } = chatTargetDetails;
        
        if (propertyName && ownerName) {
            // Names are already capitalized
            return `Chat about "${propertyName}" with ${ownerName}`;
        }
        if (ownerName) {
            return `Chat with ${ownerName}`;
        }
        return `Chat with Property Owner`;
    };

    // --- Loading and Error States ---

    if (!user) {
         return (
             <Center h="80vh" bg={bgColor}>
                 <Text color="orange.500" fontSize="xl">
                     Please log in to start chatting.
                 </Text>
             </Center>
         );
    }
    
    if (chatTargetDetails.loading || !ownerId) {
        return (
            <Center h="80vh" bg={bgColor}>
                <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" thickness="4px" />
                    <Text color="gray.500">Loading chat details...</Text>
                </VStack>
            </Center>
        );
    }

    if (chatTargetDetails.error) {
        return (
            <Center h="80vh" bg={bgColor}>
                <VStack spacing={4} p={8} bg={useColorModeValue("white", "gray.700")} borderRadius="md" boxShadow="lg">
                    <Heading size="md" color="red.500">
                        Chat Setup Failed 😔
                    </Heading>
                    <Text color="gray.600" textAlign="center">
                        {chatTargetDetails.errorMessage}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt={2}>
                        Please check your network or try again later.
                    </Text>
                </VStack>
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
                {/* Dynamic Heading based on fetched data */}
                <VStack align="flex-start" spacing={0} p={0}>
                    <Heading size="lg" color={useColorModeValue("gray.700", "gray.100")}>
                        {getHeadingText()}
                    </Heading>
                    {chatTargetDetails.propertyName && (
                        <Text fontSize="sm" color="gray.500">
                            This conversation is linked to the property listing.
                        </Text>
                    )}
                </VStack>

                {/* The ChatBox component fills the remaining space */}
                <Box flex="1" h="100%" borderRadius="xl" shadow="xl" overflow="hidden">
                    <ChatBox 
                        receiverId={ownerId} 
                        propertyId={propertyId} 
                    />
                </Box>
            </VStack>
        </Box>
    );
};

export default ClientOwnerChatPage;