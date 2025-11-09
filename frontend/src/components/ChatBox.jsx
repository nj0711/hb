import {
    Avatar,
    Box,
    Button,
    Center,
    Flex,
    HStack,
    Icon,
    Input,
    Spinner,
    Text,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

// Fallback icon for send button
const SendIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const ChatBox = ({ receiverId, propertyId = null, onTypingChange }) => {
    const { user, token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);
    const pollRef = useRef(null);
    const toast = useToast();

    // Theme Colors
    const myMsgBg = useColorModeValue("blue.500", "blue.400");
    const myMsgColor = "white";
    const otherMsgBg = useColorModeValue("gray.100", "gray.600");
    const otherMsgColor = useColorModeValue("gray.800", "white");
    const chatBg = useColorModeValue("gray.50", "gray.800");
    const inputBarBg = useColorModeValue("white", "gray.700");
    const inputBorderColor = useColorModeValue("gray.200", "gray.600");

    // --- Core Scroll Function ---
    const scrollToBottom = useCallback((isInitialLoad = false) => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ 
                // 🛠️ FIX: Use 'auto' for instant snap on conversation switch
                behavior: isInitialLoad ? "auto" : "smooth", 
                block: "end" 
            });
        }
    }, []);

    // Signal typing status
    useEffect(() => {
        if (onTypingChange) {
            const isTyping = value.trim().length > 0;
            onTypingChange(isTyping);
        }
    }, [value, onTypingChange]);

    // Fetch messages (Memoized)
    const fetchMessages = useCallback(async () => {
        if (!receiverId || !token) return;
        try {
            const res = await axios.get(`/api/messages/${receiverId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Determine if this is the initial load for the current receiver
            const isInitialLoad = messages.length === 0 || 
                                 (messages.length > 0 && res.data?.data?.[0]?.receiver?._id !== receiverId);

            setMessages(res.data?.data || res.data || []);
            setLoading(false);

            // Mark as read
            await axios.put(`/api/messages/read/${receiverId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Scroll immediately after setting messages, using 'auto' for new conversations
            // We pass the flag here to ensure an instant scroll for conversation switches
            scrollToBottom(isInitialLoad); 
            
        } catch (err) {
            console.error("Fetch messages error:", err.response || err);
            setLoading(false);
        }
    }, [receiverId, token, scrollToBottom]);

    // Polling setup and initial fetch when receiverId changes
    useEffect(() => {
        // Clear previous interval when receiverId changes
        if (pollRef.current) {
            clearInterval(pollRef.current);
        }

        // Fetch messages will handle initial scroll (instant snap)
        fetchMessages(); 
        
        if (receiverId && token) {
            // Poll every 3 seconds
            pollRef.current = setInterval(fetchMessages, 3000); 
        }
        return () => clearInterval(pollRef.current);
    }, [receiverId, token, fetchMessages]);

    // Auto-scroll for NEW messages (run when messages array changes length/content)
    // This will run 'smooth' when a message is sent or polled, but the initial load 
    // is handled by fetchMessages with 'auto'. We keep 'smooth' here for new incoming messages
    // to give a slight animation, which is often desired.
    useEffect(() => {
        // Only trigger smooth scroll if messages length changed (new message arrived/sent)
        // We only want smooth for new messages, not a full conversation reload
        if (messages.length > 0) {
            // Trigger smooth scroll when messages update
            scrollToBottom(false); 
        }
    }, [messages.length, scrollToBottom]); 
    
    // Send message
    const sendMessage = async () => {
        const text = value.trim();
        if (!text || !receiverId || !token) return;

        try {
            const body = { receiver: receiverId, message: text };
            if (propertyId) body.property = propertyId;

            const res = await axios.post("/api/messages", body, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Add the new message to the state and clear the input
            const newMessage = res.data?.data || res.data;
            setMessages((m) => [...m, newMessage]);
            setValue("");
            
            // Immediate smooth scroll to the new message
            scrollToBottom(false); 

            // Clear typing status
            if (onTypingChange) {
                onTypingChange(false);
            }

            // Mark as read after sending (optional, but ensures state is clean)
            await axios.put(`/api/messages/read/${receiverId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

        } catch (err) {
            console.error("Send message error:", err.response || err);
            toast({
                title: "Message not sent",
                description: err.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 4000
            });
        }
    };

    const isMine = (msg) => {
        const senderId = msg.sender?._id || msg.sender;
        const userId = user?._id || user?.id;
        return senderId && userId && senderId.toString() === userId.toString();
    };

    const renderMessageBubble = (msg, mine) => {
        const senderName = msg.sender?.name || "User";
        
        // Define bubble radius for a modern chat UI look
        const borderRadius = mine 
            ? { borderTopLeftRadius: "xl", borderBottomLeftRadius: "xl", borderTopRightRadius: "md", borderBottomRightRadius: "sm" }
            : { borderTopRightRadius: "xl", borderBottomRightRadius: "xl", borderTopLeftRadius: "md", borderBottomLeftRadius: "sm" };
        
        return (
            <Flex
                key={msg._id}
                justify={mine ? "flex-end" : "flex-start"}
                align="flex-end"
                my={2} // Increased vertical margin between messages
            >
                {/* Avatar (Other User) */}
                {!mine && (
                    <Avatar
                        size="sm"
                        name={senderName}
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`}
                        mr={2}
                    />
                )}
                
                <Box
                    maxW="80%" // Slightly wider maximum message width
                    bg={mine ? myMsgBg : otherMsgBg}
                    color={mine ? myMsgColor : otherMsgColor}
                    px={4}
                    py={3} // Increased vertical padding for content
                    boxShadow="md"
                    {...borderRadius} // Apply the specific radius rules
                >
                    <Text fontSize="sm" whiteSpace="pre-wrap">{msg.message}</Text>
                    <Text 
                        fontSize="xs" 
                        opacity={mine ? 0.8 : 0.6}
                        mt={1} 
                        textAlign="right"
                    >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Text>
                </Box>
            </Flex>
        );
    };

    return (
        <Flex
            direction="column"
            h="100%"
            bg={chatBg}
            borderRadius="xl" // Sharper corners for the outer box
            shadow="lg" // Add a clear shadow to distinguish the chat box
            overflow="hidden"
        >
            {/* Messages Container */}
            <VStack
                align="stretch"
                spacing={0}
                p={4}
                overflowY="auto"
                flex="1"
            >
                {loading ? (
                    <Center h="100%">
                         <Spinner size="lg" color="blue.500" />
                    </Center>
                ) : messages.length === 0 ? (
                    <Center h="100%">
                        <Text color="gray.500" textAlign="center">
                            No messages yet. Say hi.
                        </Text>
                    </Center>
                ) : (
                    messages.map((msg) => renderMessageBubble(msg, isMine(msg)))
                )}
                <div ref={scrollRef} />
            </VStack>

            {/* Input Bar */}
            <HStack 
                p={3} 
                borderTop="1px solid" 
                borderColor={inputBorderColor} 
                bg={inputBarBg}
                spacing={2}
            >
                <Input
                    placeholder="Type a message..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    borderRadius="2xl"
                    bg={useColorModeValue("gray.50", "gray.600")}
                    borderColor={useColorModeValue("gray.300", "gray.600")}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                    h="10"
                />
                <Button
                    colorScheme="blue"
                    borderRadius="2xl"
                    w="10"
                    h="10"
                    onClick={sendMessage}
                    isDisabled={!value.trim()}
                    p={0}
                >
                    <Icon as={SendIcon} w={5} h={5} />
                </Button>
            </HStack>
        </Flex>
    );
};

export default ChatBox;