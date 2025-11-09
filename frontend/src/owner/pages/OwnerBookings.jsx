import {
    CalendarIcon,
    ExternalLinkIcon,
    SearchIcon
} from '@chakra-ui/icons';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Center,
    Container,
    Flex,
    Heading,
    HStack,
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Spinner,
    Tab,
    Table,
    TableContainer,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const FilterPlaceholderIcon = (props) => (
    <svg viewBox="0 0 24 24" {...props}>
        <path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
    </svg>
);

const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

const OwnerBookings = () => {
    // Core Data and Loading States
    const [rawBookings, setRawBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Filtering States
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
    const [filterCheckInDate, setFilterCheckInDate] = useState("");
    const [filterCheckOutDate, setFilterCheckOutDate] = useState("");
    
    // Hooks
    const toast = useToast();
    const navigate = useNavigate();
    
    // --- BLUE THEME COLORS ---
    const headerColor = useColorModeValue("gray.800", "white");
    const primaryColor = "blue"; 
    const tableHeaderBg = useColorModeValue("blue.600", "blue.900"); 
    const propertyTitleColor = useColorModeValue("blue.600", "blue.300"); 
    // -----------------------------------------

    /**
     * Fetches and categorizes all bookings.
     */
    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : null; 
            
            const response = await axios.get("/api/bookings/owner", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setRawBookings(response.data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setError(error.response?.data?.message || "Failed to fetch bookings");
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Handles the confirmation or cancellation action for a booking.
     */
    const handleBookingAction = useCallback(async (bookingId, action) => {
        setIsSubmitting(true);
        try {
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : null;
            
            await axios.put(
                `/api/bookings/${bookingId}/${action}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast({
                title: `Booking ${action}ed successfully`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            await fetchBookings(); // Refresh list to update status
        } catch (error) {
            console.error(`Error ${action}ing booking:`, error);
            toast({
                title: `Error processing booking`,
                description: error.response?.data?.message || `Failed to ${action} booking.`,
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top",
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [fetchBookings, toast]); 

    // --- Memoized Filtering Logic ---
    const filteredBookings = useMemo(() => {
        let list = rawBookings;
        const lowerCaseSearch = searchTerm.toLowerCase().trim();

        if (lowerCaseSearch) {
            list = list.filter(booking => 
                (booking.property?.name || '').toLowerCase().includes(lowerCaseSearch) ||
                (booking.client?.name || '').toLowerCase().includes(lowerCaseSearch)
            );
        }

        if (filterPaymentStatus !== "all") {
            list = list.filter(booking => booking.paymentStatus === filterPaymentStatus);
        }
        
        if (filterCheckInDate || filterCheckOutDate) {
            list = list.filter(booking => {
                const checkIn = new Date(booking.checkInDate);
                const checkOut = new Date(booking.checkOutDate);
                const filterIn = filterCheckInDate ? new Date(filterCheckInDate + 'T00:00:00') : null;
                const filterOut = filterCheckOutDate ? new Date(filterCheckOutDate + 'T00:00:00') : null;
                
                let matchesIn = true;
                let matchesOut = true;
                
                if (filterIn && checkIn < filterIn) {
                    matchesIn = false;
                }
                
                if (filterOut && checkOut > filterOut) {
                    matchesOut = false;
                }
                
                return matchesIn && matchesOut;
            });
        }
        
        return list.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate));
    }, [rawBookings, searchTerm, filterPaymentStatus, filterCheckInDate, filterCheckOutDate]);

    const pendingBookings = useMemo(() => filteredBookings.filter((b) => b.status === "pending"), [filteredBookings]);
    const confirmedBookings = useMemo(() => filteredBookings.filter((b) => b.status === "confirmed"), [filteredBookings]);
    const cancelledBookings = useMemo(() => filteredBookings.filter((b) => b.status === "cancelled"), [filteredBookings]);


    // Initial data fetch and auto-refresh setup
    useEffect(() => {
        fetchBookings(); 
        const interval = setInterval(fetchBookings, 60000); 
        return () => clearInterval(interval);
    }, [fetchBookings]);

    // --- Utility functions for table ---
    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "orange";
            case "confirmed": return "green";
            case "cancelled": return "red";
            default: return "gray";
        }
    };

    const getPaymentBadge = (paymentStatus) => {
        switch (paymentStatus) {
            case "completed": return <Badge colorScheme="green">Paid</Badge>;
            case "pending": return <Badge colorScheme="yellow">Unpaid</Badge>;
            case "refunded": return <Badge colorScheme="red">Refunded</Badge>;
            default: return <Badge colorScheme="gray">Unknown</Badge>;
        }
    };
    
    // --- Booking Table Component ---
    const BookingTable = ({ bookings, showCancelBy = false }) => {
        const rowHoverBg = useColorModeValue("gray.100", "gray.700");
        const tableBg = useColorModeValue("white", "gray.800");

        if (bookings.length === 0) {
            return (
                <Center minH="150px">
                    <Text color="gray.500">No bookings match your current filters.</Text>
                </Center>
            );
        }

        const handlePropertyClick = (propertyId) => {
            if (propertyId) {
                navigate(`/owner/property/${propertyId}`);
            } else {
                 toast({
                    title: 'Property ID Missing',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                 });
            }
        };

        return (
            <TableContainer 
                borderRadius="xl" 
                shadow="md" 
                bg={tableBg}
                border="1px solid"
                borderColor={useColorModeValue("gray.200", "gray.700")}
            >
                <Table variant="simple" size="md">
                    <Thead>
                        <Tr bg={tableHeaderBg}>
                            <Th color="white">Property</Th>
                            <Th color="white">Client Info</Th>
                            <Th color="white">Check-in</Th>
                            <Th color="white">Check-out</Th>
                            <Th color="white">Payment Status</Th>
                            <Th color="white">Status</Th>
                            {showCancelBy && <Th color="white">Cancelled By</Th>}
                            <Th color="white">Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {bookings.map((booking) => {
                            const cancelledById = booking.cancelledBy && (booking.cancelledBy._id || booking.cancelledBy);
                            const ownerId = booking.owner && (booking.owner._id || booking.owner);
                            const cancelledByLabel = cancelledById
                                ? String(cancelledById) === String(ownerId) ? "Owner" : "User"
                                : "Unknown";
                            
                            // Apply capitalization
                            const formattedPropertyName = capitalizeWords(booking.property?.name);
                            const formattedClientName = capitalizeWords(booking.client?.name);
                            
                            return (
                                <Tr 
                                    key={booking._id} 
                                    bg={"transparent"} 
                                    _hover={{ bg: rowHoverBg }}
                                >
                                    {/* Property Name (Capitalized) */}
                                    <Td>
                                        <HStack 
                                            spacing={1} 
                                            cursor="pointer" 
                                            onClick={() => handlePropertyClick(booking.property?._id)}
                                        >
                                            <Icon as={ExternalLinkIcon} color={propertyTitleColor} boxSize={3} />
                                            <Text 
                                                fontWeight="semibold" 
                                                color={propertyTitleColor} 
                                                _hover={{ textDecoration: 'underline' }}
                                                isTruncated
                                                maxW="200px"
                                            >
                                                {formattedPropertyName || "N/A"}
                                            </Text>
                                        </HStack>
                                    </Td>

                                    {/* Client Name (Capitalized) */}
                                    <Td>
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="medium">{formattedClientName || "N/A"}</Text>
                                            <Text fontSize="sm" color="gray.500">{booking.client?.email || "No Email"}</Text>
                                        </VStack>
                                    </Td>

                                    <Td>{new Date(booking.checkInDate).toLocaleDateString()}</Td>
                                    <Td>{new Date(booking.checkOutDate).toLocaleDateString()}</Td>

                                    <Td>{getPaymentBadge(booking.paymentStatus)}</Td>

                                    <Td>
                                        <Badge colorScheme={getStatusColor(booking.status)}>
                                            {booking.status}
                                        </Badge>
                                    </Td>

                                    {showCancelBy && (
                                        <Td>
                                            <Text color={booking.status === "cancelled" ? "red.500" : "gray.400"}>
                                                {booking.status === "cancelled" ? cancelledByLabel : "-"}
                                            </Text>
                                        </Td>
                                    )}

                                    <Td>
                                        <HStack spacing={2}>
                                            {booking.status === "pending" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        colorScheme="green"
                                                        onClick={() => handleBookingAction(booking._id, "confirm")}
                                                        isLoading={isSubmitting}
                                                    >
                                                        Confirm
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        colorScheme="red"
                                                        onClick={() => handleBookingAction(booking._id, "cancel")}
                                                        isLoading={isSubmitting}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            )}

                                            {/* Chat button always visible */}
                                            {booking.client && (
                                                <Tooltip label={`Chat with ${booking.client.name || 'Client'}`} hasArrow>
                                                    <Button
                                                        size="sm"
                                                        colorScheme={primaryColor} 
                                                        variant="outline"
                                                        onClick={() => navigate(`/owner/chat-client/${booking.client._id}`)}
                                                    >
                                                        Chat
                                                    </Button>
                                                </Tooltip>
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>
            </TableContainer>
        );
    };

    // --- Loading and Error Screens ---
    if (loading) {
        return (
            <Center h="100vh">
                <Spinner size="xl" color="blue.500" />
            </Center>
        );
    }

    if (error) {
        return (
            <Container maxW="container.xl" py={10}>
                <Alert status="error">
                    <AlertIcon />
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")} pb={12}>
            <Container maxW="container.xl" py={10}>
                <VStack spacing={8} align="stretch">
                    <Heading color={headerColor}>Owner Bookings</Heading>

                    {/* --- Filter Bar --- */}
                    <Box 
                        p={4} 
                        bg={useColorModeValue("white", "gray.800")} 
                        borderRadius="xl" 
                        shadow="lg"
                    >
                        <Heading size="md" mb={4} color="blue.600">
                            <Icon as={FilterPlaceholderIcon} mr={2} color="blue.500" /> Filter Bookings
                        </Heading>
                        <Flex gap={4} wrap="wrap" justify="space-between">
                            
                            {/* Search by Name */}
                            <InputGroup flex={{ base: "100%", sm: 'auto', md: 2 }}>
                                <InputLeftElement pointerEvents="none">
                                    <SearchIcon color="gray.300" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Search Property or Client Name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    borderRadius="lg"
                                />
                            </InputGroup>

                            {/* Filter by Check-In Date */}
                            <InputGroup flex={{ base: "100%", sm: 1, md: 1 }}>
                                <InputLeftElement pointerEvents="none">
                                    <CalendarIcon color="gray.300" />
                                </InputLeftElement>
                                <Input
                                    type="date"
                                    value={filterCheckInDate}
                                    onChange={(e) => setFilterCheckInDate(e.target.value)}
                                    borderRadius="lg"
                                    pl="3rem"
                                />
                                <Tooltip label="Check-in Start Date" placement="top" hasArrow />
                            </InputGroup>

                            {/* Filter by Check-Out Date */}
                            <InputGroup flex={{ base: "100%", sm: 1, md: 1 }}>
                                <InputLeftElement pointerEvents="none">
                                    <CalendarIcon color="gray.300" />
                                </InputLeftElement>
                                <Input
                                    type="date"
                                    value={filterCheckOutDate}
                                    onChange={(e) => setFilterCheckOutDate(e.target.value)}
                                    borderRadius="lg"
                                    pl="3rem"
                                />
                                <Tooltip label="Check-out End Date" placement="top" hasArrow />
                            </InputGroup>

                            {/* Filter by Payment Status */}
                            <Select
                                value={filterPaymentStatus}
                                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                                w={{ base: "100%", md: "200px" }}
                                borderRadius="lg"
                            >
                                <option value="all">All Payment Statuses</option>
                                <option value="completed">Paid (Completed)</option>
                                <option value="pending">Pending Payment</option>
                                <option value="refunded">Refunded</option>
                            </Select>

                            <Button 
                                colorScheme="red" 
                                variant="ghost" 
                                onClick={() => { 
                                    setSearchTerm("");
                                    setFilterPaymentStatus("all");
                                    setFilterCheckInDate("");
                                    setFilterCheckOutDate("");
                                }}
                                w={{ base: "100%", md: "auto" }}
                            >
                                Clear Filters
                            </Button>
                        </Flex>
                    </Box>
                    {/* --- End Filter Bar --- */}

                    <Tabs variant="enclosed" colorScheme={primaryColor}>
                        <TabList>
                            <Tab position="relative">
                                <Text>Pending Requests ({pendingBookings.length})</Text>
                                {pendingBookings.length > 0 && (
                                    <Box
                                        position="absolute"
                                        top="2px"
                                        right="2px"
                                        boxSize="8px"
                                        bg="red.500" 
                                        borderRadius="full"
                                        boxShadow="0 0 0 2px white"
                                    />
                                )}
                            </Tab>

                            <Tab>
                                <Text>Confirmed Bookings ({confirmedBookings.length})</Text>
                            </Tab>

                            <Tab>
                                <Text>Cancelled Bookings ({cancelledBookings.length})</Text>
                            </Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel p={0} pt={4}>
                                <BookingTable bookings={pendingBookings} />
                            </TabPanel>

                            <TabPanel p={0} pt={4}>
                                <BookingTable bookings={confirmedBookings} />
                            </TabPanel>

                            <TabPanel p={0} pt={4}>
                                <BookingTable bookings={cancelledBookings} showCancelBy />
                            </TabPanel>
                        </TabPanels> {/* CORRECTED CLOSING TAG */}
                    </Tabs>
                </VStack>
            </Container>
        </Box>
    );
};

export default OwnerBookings;