import {
    Avatar,
    Badge,
    Box,
    Button,
    Center,
    Divider,
    Flex,
    Heading,
    HStack,
    Icon,
    Input,
    InputGroup,
    InputLeftElement, // Added Divider for visual separation
    Spinner,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { ChevronLeft } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa"; // Using FaSearch for a different search icon
import ChatBox from "../../components/ChatBox";
import { useAuth } from "../../context/AuthContext";

// FIX: Reduced polling frequency to 3 seconds
const POLLING_INTERVAL = 3000;

// Utility to capitalize name (needed for display logic)
const capitalizeName = (string) =>
    string
        ? string
            .toLowerCase()
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        : "";

// --- Conversation List Item Component ---
const ConversationListItem = ({ conv, selectedUser, onClick, selectedBtnColor, hoverBg, unreadColor }) => {
    const isSelected = selectedUser?._id === conv.user._id;
    const initial = conv.user.name ? conv.user.name.charAt(0).toUpperCase() : '?';

    return (
        <HStack
            as="button"
            onClick={() => onClick(conv.user)}
            p={3}
            borderRadius="lg"
            bg={isSelected ? selectedBtnColor : "transparent"}
            _hover={{ bg: hoverBg }}
            justify="space-between"
            align="center"
            transition="0.2s"
            w="full"
            cursor="pointer"
            borderLeft={isSelected ? '4px solid' : 'none'}
            borderColor={isSelected ? 'blue.500' : 'transparent'} // Use a fixed blue for the stripe
            spacing={3}
        >
            <Avatar size="md" name={conv.user.name} src={conv.user.avatarUrl} bg="blue.100" color="blue.800">
                 {/* Fallback initial inside Avatar is no longer required if `ui-avatars` is used or name is set */}
            </Avatar>
            <VStack align="flex-start" spacing={0} flex="1" overflow="hidden">
                <Text
                    fontWeight={conv.unread > 0 ? "bold" : "medium"}
                    isTruncated
                    maxW="100%"
                    fontSize="md"
                >
                    {capitalizeName(conv.user.name)}
                </Text>
                <Text fontSize="xs" color="gray.500" isTruncated>
                    {capitalizeName(conv.user.role || "User")}
                </Text>
            </VStack>

            {conv.unread > 0 && (
                <Badge
                    colorScheme={unreadColor}
                    borderRadius="full"
                    minW="24px"
                    textAlign="center"
                    fontSize="xs"
                    fontWeight="bold"
                    px={1.5}
                    flexShrink={0}
                >
                    {conv.unread}
                </Badge>
            )}
        </HStack>
    );
};
// ---------------------------------------------


const OwnerChatListPage = () => {
    const { token } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState("");
    const [listLoading, setListLoading] = useState(true);
    const [isTypingInChat, setIsTypingInChat] = useState(false); 
    const pollIntervalRef = useRef(null);

    // Theme values for enhanced look
    const cardBg = useColorModeValue("white", "gray.800"); // Used for the main card container/sidebar
    const chatBackground = useColorModeValue("gray.50", "gray.900"); // Used for the chat background
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const selectedBtnColor = useColorModeValue("blue.50", "blue.900");
    const hoverBg = useColorModeValue("gray.100", "gray.700");
    const unreadColor = "red";
    
    const markMessagesAsRead = useCallback(async (userId) => {
        if (!token || !userId) return;
        try {
            await axios.put(`/api/messages/read/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error("Error marking messages as read", err);
        }
    }, [token]);

    const fetchConversations = useCallback(async () => {
        // Stop polling if user is typing
        if (isTypingInChat) return;

        try {
            const res = await axios.get("/api/messages/my/conversations", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setConversations(res.data);
            
            // If we have conversations but no user selected, auto-select the first one
            if (res.data.length > 0 && !selectedUser) {
                setSelectedUser(res.data[0].user);
            }

            // If the currently selected user has new unread messages, mark them read
            if (selectedUser) {
                const currentConv = res.data.find(c => c.user._id === selectedUser._id);
                if (currentConv && currentConv.unread > 0) {
                    markMessagesAsRead(selectedUser._id); 
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setListLoading(false);
        }
    }, [token, selectedUser, markMessagesAsRead, isTypingInChat]);

    // Polling setup: reduced frequency and stable dependencies
    useEffect(() => {
        if (!token) return;
        
        // Clear any existing interval
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        // Initial fetch & set up polling
        fetchConversations();
        pollIntervalRef.current = setInterval(fetchConversations, POLLING_INTERVAL);
        
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [token, fetchConversations]);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        // We call markMessagesAsRead here and rely on the next poll to clear the badge, 
        // or optionally trigger a small delay refresh.
        markMessagesAsRead(user._id);
        setTimeout(fetchConversations, 500); 
    };

    const handleBackToConversations = () => {
        setSelectedUser(null);
    };


    const filtered = conversations.filter(
        (conv) =>
            conv.user.name?.toLowerCase().includes(search.toLowerCase()) ||
            conv.user.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (listLoading) {
        return (
            <Center h="80vh">
                <Spinner size="xl" color="blue.500" thickness="4px" />
            </Center>
        );
    }
    
    return (
        <HStack
            h={{ base: 'calc(100vh - 64px)', lg: '85vh' }} // Larger height on desktop
            maxW="1200px" 
            mx="auto" // Center the container horizontally
            mt={{ base: 0, lg: 8 }} // Margin top on desktop
            w="full"
            borderRadius="2xl" // Rounded corners for the main container
            overflow="hidden"
            shadow="2xl" // Stronger shadow for the card effect
            bg={cardBg} // Use cardBg for the main container
            spacing={0}
        >
            {/* 1. Sidebar/Conversation List */}
            <VStack 
                w={{ base: 'full', md: '320px' }} // Full width on mobile when chat is closed
                minW="280px"
                align="stretch" 
                borderRight="1px solid" 
                borderColor={borderColor} 
                bg={cardBg}
                spacing={4}
                p={4}
                h="full"
                // Mobile responsiveness: Hide the list if a user is selected
                display={{ base: selectedUser ? 'none' : 'flex', md: 'flex' }}
            >
                <Heading size="lg" color="blue.600">
                    Chats
                </Heading>
                
                <InputGroup>
                    <InputLeftElement pointerEvents="none">
                        <Icon as={FaSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        size="md"
                        borderRadius="full" // Rounded search bar
                        variant="outline"
                    />
                </InputGroup>

                <Divider />

                <VStack 
                    align="stretch" 
                    overflowY="auto" 
                    flex="1"
                    spacing={1}
                    // Custom Scrollbar Styling (like in the ClientChatListPage example)
                    css={{ 
                        '&::-webkit-scrollbar': { width: '6px' },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: useColorModeValue('gray.300', 'gray.600'),
                            borderRadius: '24px',
                        },
                    }}
                >
                    {filtered.length === 0 ? (
                        <Center flex="1" p={4}>
                            <Text color="gray.500" fontStyle="italic" textAlign="center">
                                No conversations found.
                            </Text>
                        </Center>
                    ) : (
                        filtered.map((conv) => (
                            <ConversationListItem
                                key={conv.user._id}
                                conv={conv}
                                selectedUser={selectedUser}
                                onClick={handleSelectUser}
                                selectedBtnColor={selectedBtnColor}
                                hoverBg={hoverBg}
                                unreadColor={unreadColor}
                            />
                        ))
                    )}
                </VStack>
            </VStack>

            {/* 2. Chat Window */}
            <Flex 
                flex="1" 
                bg={chatBackground} 
                direction="column" 
                h="full"
                // Mobile responsiveness: Show the chat window if a user is selected
                display={{ base: selectedUser ? 'flex' : 'none', md: 'flex' }}
            >
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <HStack
                            p={4}
                            bg={cardBg} 
                            borderBottom="1px solid"
                            borderColor={borderColor}
                            justify="flex-start"
                            align="center"
                            shadow="sm"
                            minH="65px"
                        >
                            {/* Mobile Back Button */}
                            <Button
                                display={{ base: "block", md: "none" }}
                                size="sm"
                                variant="ghost"
                                onClick={handleBackToConversations}
                                p={0}
                                mr={1}
                                colorScheme="blue"
                            >
                                <Icon as={ChevronLeft} boxSize={6} />
                            </Button>

                            <Avatar
                                size="sm"
                                name={selectedUser.name}
                                src={selectedUser.avatarUrl}
                            />
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" fontSize="md">
                                    {capitalizeName(selectedUser.name)}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    {capitalizeName(selectedUser.role || "User")}
                                </Text>
                            </VStack>
                        </HStack>
                        
                        {/* ChatBox Component */}
                        {/* NOTE: If ChatBox uses the `onTypingChange` prop, pass it here too */}
                        <Box flex="1" h="calc(100% - 65px)"> 
                            <ChatBox 
                                receiverId={selectedUser._id} 
                                token={token} 
                                // Assuming you want to stop polling when typing:
                                // onTypingChange={setIsTypingInChat} 
                            />
                        </Box>
                    </>
                ) : (
                    <Flex h="full" justify="center" align="center" direction="column" color="gray.500" p={8}>
                        <Icon as={ChatIcon} w={12} h={12} mb={4} color="blue.300" />
                        <Text fontSize="xl" fontWeight="medium">Welcome to your Chat Inbox</Text>
                        <Text fontSize="md" mt={2}>Select a conversation on the left to start chatting.</Text>
                    </Flex>
                )}
            </Flex>
        </HStack>
    );
};

export default OwnerChatListPage;