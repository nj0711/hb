// src/pages/OwnerChatClientPage.jsx (IMPROVED DESIGN)

import {
    ArrowBackIcon,
    ExternalLinkIcon,
    WarningIcon
} from "@chakra-ui/icons";
import {
    Avatar,
    Badge,
    Box, // Added Badge
    Button,
    Center,
    Heading,
    HStack,
    IconButton,
    Link,
    Spinner,
    Text,
    useColorModeValue,
    VStack
} from "@chakra-ui/react";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import ChatBox from "../../components/ChatBox";
import { useAuth } from "../../context/AuthContext";

// Capitalize utility (assuming accessible)
const capitalizeName = (string) =>
    string
        ? string
            .toLowerCase()
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        : "";

const OwnerChatClientPage = () => {
    const { clientId } = useParams();
    const { token } = useAuth();
    const [clientDetails, setClientDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);

    // --- Aesthetic Colors ---
    const pageBg = useColorModeValue("gray.50", "gray.900"); 
    const cardBg = useColorModeValue("white", "gray.800"); 
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const primaryColor = useColorModeValue("blue.500", "blue.300");
    // ---

    // --- Logic: Fetch Client Details ---
    const fetchClientDetails = useCallback(async () => {
        if (!clientId || !token) {
            setIsLoadingDetails(false);
            return;
        }
        try {
            const res = await axios.get(`/api/users/${clientId}`, { 
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setClientDetails({
                ...res.data,
                name: capitalizeName(res.data.name),
                role: capitalizeName(res.data.role || 'User')
            });
        } catch (err) {
            console.error("Error fetching client details:", err);
            setClientDetails({ 
                name: "Client Error", 
                role: "Unknown",
                avatarUrl: null,
                _id: clientId // Keep ID for ChatBox
            });
        } finally {
            setIsLoadingDetails(false);
        }
    }, [clientId, token]);
    
    useEffect(() => {
        setClientDetails(null);
        setIsLoadingDetails(true);
        fetchClientDetails();
    }, [clientId, fetchClientDetails]);
    
    // --- Loading and Error States (Unchanged for logic) ---
    if (!clientId) {
        return (
            <Center h="calc(100vh - 80px)" bg={pageBg}>
                <WarningIcon w={8} h={8} color="red.500" mr={3} />
                <Text fontSize="xl" fontWeight="medium">Client ID Missing</Text>
            </Center>
        );
    }

    if (isLoadingDetails) {
        return (
            <Center h="calc(100vh - 80px)" bg={pageBg}>
                <Spinner size="lg" color="blue.500" mr={3} />
                <Text fontSize="lg">Loading client details...</Text>
            </Center>
        );
    }
    
    const displayName = clientDetails?.name || `Client: ${clientId.substring(0, 8)}...`;
    const displayRole = clientDetails?.role || 'User';

    // --- Main Chat View (Full-Screen Single Chat) ---
    return (
        <Center
            // Center the chat application interface on the screen
            h={{ base: "calc(100vh - 64px)", lg: "85vh" }}
            maxW="1000px" // Increased max width for a more spacious chat
            mx="auto"
            mt={{ base: 0, lg: 8 }}
            w="full"
            p={{ base: 0, lg: 4 }} 
            bg={pageBg}
        >
            <VStack
                w="full"
                h="full"
                borderRadius={{ base: 'none', lg: "2xl" }}
                overflow="hidden"
                shadow="2xl"
                bg={cardBg}
                spacing={0}
                align="stretch"
            >
                {/* 1. Header / Title Bar (Enhanced Design) */}
                <HStack
                    p={4}
                    bg={cardBg} 
                    borderBottom="1px solid"
                    borderColor={borderColor}
                    justify="space-between"
                    align="center"
                    shadow="sm"
                >
                    <HStack spacing={3}>
                        {/* Back Button to Conversations List */}
                        <Link as={RouterLink} to="/owner/chat" _hover={{ textDecoration: 'none' }}>
                            <IconButton
                                icon={<ArrowBackIcon boxSize={6} />}
                                aria-label="Back to conversations list"
                                variant="ghost"
                                size="lg"
                                colorScheme="gray"
                            />
                        </Link>

                        <Avatar
                            size="md" 
                            name={displayName}
                            src={clientDetails?.avatarUrl}
                        />

                        <VStack align="flex-start" spacing={0}>
                            <HStack>
                                <Heading size="md" fontWeight="bold">
                                    {displayName}
                                </Heading>
                                {/* Badge for Role */}
                                <Badge colorScheme="blue" variant="subtle" size="sm" ml={2}>
                                    {displayRole}
                                </Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                                Client ID: {clientId.substring(0, 12)}...
                            </Text>
                        </VStack>
                    </HStack>
                    
                    {/* Action Button: View Profile */}
                    <Link as={RouterLink} to={`/owner/clients/${clientId}`} target="_blank">
                        <Button
                            size="sm"
                            leftIcon={<ExternalLinkIcon />}
                            colorScheme="blue"
                            variant="outline"
                        >
                            View Profile
                        </Button>
                    </Link>
                </HStack>

                {/* 2. Chat Box Container */}
                <Box 
                    flex="1"
                    bg={useColorModeValue("gray.50", "gray.900")} 
                    overflow="hidden"
                >
                    <ChatBox 
                        receiverId={clientId} 
                        token={token}
                        // Optionally pass a flag to tell ChatBox it's a full-page view, if needed
                        isFullPageView={true}
                    />
                </Box>
            </VStack>
        </Center>
    );
};

export default OwnerChatClientPage;