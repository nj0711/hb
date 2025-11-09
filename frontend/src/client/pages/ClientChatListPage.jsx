import {
    Avatar,
    Badge,
    // ... imports remain the same
    Box,
    Button,
    Center,
    Divider,
    Flex,
    HStack,
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    Spinner,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react"; // ADDED useRef
import { useAuth } from "../../context/AuthContext";
// Assuming ChatBox now accepts an 'isTyping' prop
import { ChevronLeft } from 'lucide-react';
import { FaSearch } from "react-icons/fa";
import ChatBox from "../../components/ChatBox";

// Capitalize utility
const capitalizeName = (string) =>
    string
        ? string
            .toLowerCase()
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        : "";

// Sidebar Conversation Item (unchanged)
const ConversationListItem = ({ conv, selected, onClick }) => {
    // ... (component code remains the same as before)
    const isSelected = selected?._id === conv.user._id;
    const selectedBg = useColorModeValue("blue.50", "blue.700");
    const hoverBg = useColorModeValue("gray.100", "gray.600");
    const unreadColor = "red";

    return (
        <HStack
            as="button"
            onClick={() => onClick(conv.user)}
            p={3}
            borderRadius="lg"
            bg={isSelected ? selectedBg : "transparent"}
            _hover={{ bg: hoverBg }}
            justify="space-between"
            align="center"
            transition="0.2s"
            w="full"
            cursor="pointer"
        >
            <HStack spacing={3} maxW="80%">
                <Avatar
                    size="md"
                    name={conv.user.name}
                    src={
                        conv.user.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            conv.user.name
                        )}&background=random`
                    }
                />
                <VStack align="start" spacing={0} overflow="hidden">
                    <Text
                        fontWeight={conv.unread > 0 ? "bold" : "medium"}
                        fontSize="md"
                        noOfLines={1}
                        color={useColorModeValue("gray.800", "white")}
                    >
                        {capitalizeName(conv.user.name)}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {capitalizeName(conv.user.role || "User")}
                    </Text>
                </VStack>
            </HStack>

            {conv.unread > 0 && (
                <Badge 
                    colorScheme={unreadColor} 
                    borderRadius="full" 
                    minW="24px"
                    textAlign="center"
                    fontSize="xs"
                    fontWeight="bold"
                    px={1.5}
                >
                    {conv.unread}
                </Badge>
            )}
        </HStack>
    );
};


// Main Component
const ClientChatListPage = () => {
    const { token, loading: authLoading } =
        typeof useAuth === "function"
            ? useAuth()
            : { token: "mock-token", loading: false };

    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState("");
    const [listLoading, setListLoading] = useState(true);
    // NEW STATE: Flag to stop polling when user is typing
    const [isTypingInChat, setIsTypingInChat] = useState(false); 
    
    const pollIntervalRef = useRef(null); // Ref to store the interval ID

    // Colors (unchanged)
    const cardBg = useColorModeValue("white", "gray.800"); 
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const chatBackground = useColorModeValue("gray.50", "gray.900"); 

    const fetchConversations = useCallback(async () => {
        // IMPORTANT: Only fetch if the user isn't actively typing in the chat input
        if (isTypingInChat) return; 

        try {
            const currentToken = token;
            if (!currentToken || !axios.get) return;

            const res = await axios.get("/api/messages/my/conversations", {
                headers: { Authorization: `Bearer ${currentToken}` },
            });
            
            setConversations(res.data);
            
            if (res.data.length > 0 && !selectedUser) {
                setSelectedUser(res.data[0].user);
            }
        } catch (err) {
            console.error("Error fetching chats:", err);
        } finally {
            setListLoading(false);
        }
    }, [token, selectedUser, isTypingInChat]); // Added isTypingInChat dependency

    useEffect(() => {
        // Clear any existing interval
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        // Set up the new interval
        if (token) {
            fetchConversations();
            pollIntervalRef.current = setInterval(fetchConversations, 3000); 
        }

        // Cleanup function
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [token, fetchConversations]);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
    };

    const filtered = conversations.filter((c) =>
        c.user.name.toLowerCase().includes(search.toLowerCase())
    );

    if (authLoading || listLoading) {
        return (
            <Center h="80vh">
                <Spinner size="xl" color="blue.500" thickness="4px" />
            </Center>
        );
    }

    return (
        <HStack
            h={{ base: "calc(100vh - 64px)", lg: "85vh" }}
            maxW="1200px"
            mx="auto"
            mt={{ base: 0, lg: 8 }}
            w="full"
            borderRadius="2xl"
            overflow="hidden"
            shadow="2xl"
            bg={cardBg}
            spacing={0}
        >
            {/* Sidebar (List of Conversations) - unchanged structure */}
            <VStack
                w={{ base: "full", md: "320px" }}
                align="stretch"
                bg={cardBg} 
                borderRight="1px solid"
                borderColor={borderColor}
                p={4}
                spacing={4}
                display={{ base: selectedUser ? "none" : "flex", md: "flex" }} 
                h="full"
            >
                <Text 
                    fontWeight="extrabold"
                    fontSize="2xl"
                    color="blue.600" 
                    mb={2}
                >
                    Chats
                </Text>
                
                <InputGroup>
                    <InputLeftElement pointerEvents="none">
                        <Icon as={FaSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        borderRadius="full"
                        variant="outline"
                    />
                </InputGroup>
                
                <Divider my={2} />
                
                <VStack
                    align="stretch"
                    spacing={1}
                    overflowY="auto"
                    flex="1"
                    pr={1}
                    css={{ 
                        '&::-webkit-scrollbar': { width: '6px' },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: useColorModeValue('gray.300', 'gray.600'),
                            borderRadius: '24px',
                        },
                    }}
                >
                    {filtered.length > 0 ? (
                        filtered.map((conv) => (
                            <ConversationListItem
                                key={conv.user._id}
                                conv={conv}
                                selected={selectedUser}
                                onClick={handleSelectUser}
                            />
                        ))
                    ) : (
                        <Center flex="1">
                            <Text color="gray.500" p={4}>No conversations found. Start a chat from a property page!</Text>
                        </Center>
                    )}
                </VStack>
            </VStack>

            {/* Chat Window - unchanged structure */}
            <Box 
                flex="1" 
                bg={chatBackground} 
                display={{ 
                    base: selectedUser ? "flex" : "none",
                    md: "flex" 
                }} 
                flexDirection="column"
                h="full"
            >
                {selectedUser ? (
                    <Flex 
                        direction="column" 
                        h="full"
                    >
                        {/* Header - unchanged */}
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
                                <Button
                                    display={{ base: "block", md: "none" }}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedUser(null)}
                                    p={0}
                                >
                                    <Icon as={ChevronLeft} boxSize={6} />
                                </Button>
                                <Avatar
                                    size="sm"
                                    name={selectedUser.name}
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        selectedUser.name
                                    )}&background=random`}
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
                        </HStack>

                        {/* ChatBox Component */}
                        <Box flex="1" h="calc(100% - 65px)"> 
                            <ChatBox 
                                receiverId={selectedUser._id} 
                                // NEW PROP: Pass the function to update typing state
                                onTypingChange={setIsTypingInChat} 
                            /> 
                        </Box>
                    </Flex>
                ) : (
                    <Center flex="1">
                        <Text color="gray.500" fontSize="lg">
                            Select a conversation to start chatting
                        </Text>
                    </Center>
                )}
            </Box>
        </HStack>
    );
};

export default ClientChatListPage;