import {
    Avatar,
    Badge,
    Box,
    Center,
    Divider,
    Flex,
    Heading,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Spinner,
    Text,
    useColorModeValue,
    VStack
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaRedo, FaSearch } from "react-icons/fa";
import { useLocation, useParams } from "react-router-dom";
import ChatBox from "../../components/ChatBox";
import { useAuth } from "../../context/AuthContext";

// --- Utility Function: Capitalize First Letter of Each Word ---
const capitalizeName = (name) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// --- Helper Component for Individual User Item ---
const UserListItem = ({ user, conversation, isSelected, onClick }) => {
    const bgHover = useColorModeValue("gray.50", "gray.600");
    const bgSelected = useColorModeValue("blue.50", "blue.800");
    const primaryText = useColorModeValue("gray.800", "white");
    const secondaryText = useColorModeValue("gray.600", "gray.300");

    // Use the utility function to format the name
    const formattedName = capitalizeName(user.name);

    return (
        <HStack
            w="100%"
            p={3}
            borderRadius="lg"
            bg={isSelected ? bgSelected : "transparent"}
            _hover={{ bg: isSelected ? bgSelected : bgHover }}
            cursor="pointer"
            onClick={() => {
                // To maintain the capitalization logic when selecting the user,
                // you should ideally pass the formatted name back up, but
                // since the selectedUser object is used for the header,
                // we'll format the name in the header component too.
                onClick(user); 
            }}
            transition="background-color 0.2s"
            spacing={3}
            align="center"
        >
            {/* Display formatted name in Avatar and Text */}
            <Avatar name={formattedName} size="md" />
            <VStack align="start" flex="1" overflow="hidden" spacing={0}>
                <Text fontWeight="medium" isTruncated color={primaryText}>
                    {formattedName} {/* <-- Changed from user.name */}
                </Text>
                <Text fontSize="sm" color={secondaryText} isTruncated>
                    {user.role || 'User'}
                </Text>
            </VStack>
            {conversation.unread > 0 && (
                <Badge 
                    colorScheme="red" 
                    borderRadius="full" 
                    px={2} 
                    fontSize="xs"
                    fontWeight="bold"
                >
                    {conversation.unread}
                </Badge>
            )}
        </HStack>
    );
};

// --- Main Component ---
const AdminChatPage = () => {
    const { token } = useAuth();
    const { userId } = useParams();
    const location = useLocation();

    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

    // Dynamic colors
    const bgColor = useColorModeValue("gray.50", "gray.900");
    const bgSidebar = useColorModeValue("white", "gray.700");
    const bgContainer = useColorModeValue("white", "gray.800");
    
    // --- Data Loading Logic (rest of the logic remains the same) ---
    const loadConversations = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/messages/admin/conversations/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data || [];
            
            data.sort((a, b) => (b.unread || 0) - (a.unread || 0));
            setConversations(data);

            const preselectedId = userId || location.state?.userId;
            if (preselectedId) {
                const foundConv = data.find((c) => c.user._id === preselectedId);
                if (foundConv) setSelectedUser(foundConv.user);
            } else if (!selectedUser && data.length > 0 && !isMobileView) {
                setSelectedUser(data[0].user);
            }
        } catch (err) {
            console.error("Error loading conversations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();
        const iv = setInterval(loadConversations, 5000);
        return () => clearInterval(iv);
    }, [userId, location.state]);

    // --- Search/Filter Logic (no change) ---
    const filteredConversations = useMemo(() => {
        return conversations.filter(
            (conv) =>
                conv.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                conv.user.email?.toLowerCase().includes(search.toLowerCase())
        );
    }, [conversations, search]);

    // --- Responsiveness Logic (no change) ---
    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const showSidebar = !isMobileView || !selectedUser;
    const showChat = !isMobileView || selectedUser;

    return (
        <Box 
            p={{ base: 4, md: 8 }} 
            minH="calc(100vh - 64px)" 
            bg={bgColor}
        >
            <VStack
                spacing={6}
                maxW={{ base: "full", lg: "1000px", xl: "1200px" }} 
                mx="auto" 
                h={{ base: "calc(100vh - 120px)", md: "85vh" }} 
                align="stretch"
            >
                <Heading size="lg" color={useColorModeValue("gray.700", "gray.100")}>
                    Admin Support Dashboard
                </Heading>

                {/* Main Chat Layout: List + Chat Window */}
                <Flex 
                    flex="1"
                    maxH="100%"
                    borderRadius="xl" 
                    shadow="xl"
                    overflow="hidden" 
                    bg={bgContainer}
                >
                    {/* 1. Sidebar (User List) */}
                    {showSidebar && (
                        <VStack
                            w={{ base: "full", md: "300px" }}
                            minW={{ base: "full", md: "300px" }}
                            align="stretch"
                            p={4}
                            spacing={3}
                            bg={bgSidebar}
                            borderRight={{ base: "none", md: "1px solid" }}
                            borderColor={useColorModeValue("gray.200", "gray.700")}
                            overflowY="auto"
                            flexShrink={0}
                        >
                            <HStack justify="space-between" mb={2}>
                                <Text fontSize="xl" fontWeight="extrabold">
                                    Conversations
                                </Text>
                                <IconButton 
                                    icon={<FaRedo />} 
                                    size="sm" 
                                    onClick={loadConversations} 
                                    isLoading={loading}
                                    aria-label="Refresh Users"
                                    variant="ghost"
                                />
                            </HStack>
                            
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <FaSearch color="gray.300" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Search by name or email"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    mb={2}
                                    borderRadius="full"
                                />
                            </InputGroup>
                            
                            <Divider />

                            <Box flex="1" overflowY="auto" w="100%" px={1}>
                                {loading && conversations.length === 0 ? (
                                    <Center h="100px"><Spinner size="lg" /></Center>
                                ) : filteredConversations.length === 0 ? (
                                    <Text color="gray.500" pt={4} textAlign="center">
                                        No conversations found.
                                    </Text>
                                ) : (
                                    filteredConversations.map((conv) => (
                                        <UserListItem
                                            key={conv.user._id}
                                            user={conv.user}
                                            conversation={conv}
                                            isSelected={selectedUser?._id === conv.user._id}
                                            onClick={() => setSelectedUser(conv.user)}
                                        />
                                    ))
                                )}
                            </Box>
                        </VStack>
                    )}

                    {/* 2. Chat Area */}
                    {showChat && (
                        <VStack 
                            flex="1" 
                            align="stretch" 
                            spacing={0}
                            h="full"
                        >
                            {selectedUser ? (
                                <>
                                    {/* Chat Header (Name also capitalized here) */}
                                    <HStack 
                                        p={4} 
                                        borderBottom="1px solid" 
                                        borderColor={useColorModeValue("gray.200", "gray.700")}
                                        spacing={3}
                                        bg={bgSidebar}
                                        shadow="sm"
                                    >
                                        {isMobileView && (
                                            <IconButton
                                                icon={<FaChevronLeft />}
                                                onClick={() => setSelectedUser(null)}
                                                aria-label="Back to users"
                                                variant="ghost"
                                            />
                                        )}
                                        {/* Capitalize here too */}
                                        <Avatar name={capitalizeName(selectedUser.name)} size="md" />
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold" fontSize="lg">
                                                {capitalizeName(selectedUser.name)} {/* <-- Capitalized Name */}
                                            </Text>
                                            <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                                                {selectedUser.role} | {selectedUser.email}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                    
                                    {/* Chat Box */}
                                    <Box flex="1" p={0} overflow="hidden">
                                        <ChatBox receiverId={selectedUser._id} />
                                    </Box>
                                </>
                            ) : (
                                <Flex 
                                    flex="1" 
                                    justify="center" 
                                    align="center" 
                                    direction="column"
                                >
                                    <Text fontSize="xl" color="gray.500">
                                        Select a user to view the conversation.
                                    </Text>
                                    <Text fontSize="md" color="gray.400">
                                        Unread conversations are prioritized.
                                    </Text>
                                </Flex>
                            )}
                        </VStack>
                    )}
                </Flex>
            </VStack>
        </Box>
    );
};

export default AdminChatPage;