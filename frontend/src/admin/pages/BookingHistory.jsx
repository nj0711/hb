import {
    Badge,
    Box,
    Center,
    Flex,
    Heading,
    HStack,
    Input,
    Select,
    SimpleGrid,
    Spacer,
    Spinner,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import Pagination from "../../components/Pagination";

// 🔄 NEW UTILITY FUNCTION: Title Case conversion
const toTitleCase = (str) => {
    if (!str) return 'N/A';
    return str.toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
};

const BookingHistory = () => {
    const [bookings, setBookings] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);

    const initialFilters = {
        property: "",
        location: "",
        client: "",
        checkIn: "",
        checkOut: "",
        status: "all",
        cancelledBy: "",
    };

    const [filters, setFilters] = useState(initialFilters);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const toast = useToast();
    const bgCard = useColorModeValue("white", "gray.700");
    // 🎨 Lighter background for the table header
    const bgHeader = useColorModeValue("gray.100", "gray.800"); 
    const bgFilter = useColorModeValue("gray.50", "gray.800");

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, bookings]);

    const fetchBookings = async () => {
        try {
            const response = await axios.get("/api/bookings/admin", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setBookings(response.data);
            setFiltered(response.data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast({
                title: "Error",
                description: "Failed to fetch bookings",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let data = [...bookings];

        if (filters.property)
            data = data.filter((b) =>
                b.property?.name?.toLowerCase().includes(filters.property.toLowerCase())
            );

        if (filters.location)
            data = data.filter((b) =>
                b.property?.location
                    ?.toLowerCase()
                    .includes(filters.location.toLowerCase())
            );

        if (filters.client)
            data = data.filter(
                (b) =>
                    b.client?.name?.toLowerCase().includes(filters.client.toLowerCase()) ||
                    b.client?.email?.toLowerCase().includes(filters.client.toLowerCase())
            );

        if (filters.checkIn)
            data = data.filter(
                (b) =>
                    b.checkInDate &&
                    new Date(b.checkInDate).toISOString().split("T")[0] === filters.checkIn
            );

        if (filters.checkOut)
            data = data.filter(
                (b) =>
                    b.checkOutDate &&
                    new Date(b.checkOutDate).toISOString().split("T")[0] === filters.checkOut
            );

        if (filters.status !== "all")
            data = data.filter((b) => b.status === filters.status);

        if (filters.cancelledBy)
            data = data.filter((b) => {
                if (b.status !== "cancelled") return false;
                const cancelledById = b.cancelledBy?._id || b.cancelledBy;
                const ownerId = b.owner?._id || b.owner;
                const clientId = b.client?._id;

                if (filters.cancelledBy === "Owner")
                    return String(cancelledById) === String(ownerId);
                if (filters.cancelledBy === "User")
                    return String(cancelledById) === String(clientId);

                return false;
            });

        setFiltered(data);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed":
                return "green";
            case "pending":
                return "orange";
            case "cancelled":
                return "red";
            default:
                return "gray";
        }
    };

    const formatCurrency = (amount) => {
        // Assuming Indian Rupees (INR)
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Pagination logic
    const totalItems = filtered.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filtered.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
        return (
            <Center h="60vh">
                <Spinner size="xl" color="blue.500" />
            </Center>
        );
    }

    return (
        <Box p={5} minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
            <Box
                bg={bgCard}
                p={{ base: 4, md: 8 }}
                borderRadius="xl"
                shadow="xl"
            >
                {/* Header */}
                <Flex mb={6} align="center">
                    <Heading size="xl" color="gray.800">Booking History</Heading>
                    <Spacer />
                    <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                        Total Bookings: {bookings.length}
                    </Text>
                </Flex>

                {/* 🔍 Filter Grid (No Change) */}
                <SimpleGrid columns={{ base: 1, sm: 2, md: 4, lg: 7 }} spacing={4} p={4} bg={bgFilter} borderRadius="lg" mb={6}>
                    <Input
                        size="md"
                        placeholder="Property Name"
                        onChange={(e) => setFilters({ ...filters, property: e.target.value })}
                        value={filters.property}
                        variant="filled"
                    />
                    <Input
                        size="md"
                        placeholder="Location"
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                        value={filters.location}
                        variant="filled"
                    />
                    <Input
                        size="md"
                        placeholder="Client (name/email)"
                        onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                        value={filters.client}
                        variant="filled"
                    />
                    <Input
                        size="md"
                        type="date"
                        placeholder="Check In Date"
                        onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })}
                        value={filters.checkIn}
                    />
                    <Input
                        size="md"
                        type="date"
                        placeholder="Check Out Date"
                        onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })}
                        value={filters.checkOut}
                    />
                    <Select
                        size="md"
                        placeholder="Status"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        variant="filled"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    </Select>
                    <Select
                        size="md"
                        placeholder="Cancelled By"
                        value={filters.cancelledBy}
                        onChange={(e) =>
                            setFilters({ ...filters, cancelledBy: e.target.value })
                        }
                        isDisabled={filters.status !== "cancelled" && filters.status !== "all"}
                        variant="filled"
                    >
                        <option value="Owner">Owner</option>
                        <option value="User">User</option>
                    </Select>
                </SimpleGrid>

                {/* 📊 Table */}
                <Box overflowX="auto">
                    <Table 
                        variant="simple" // 🎨 Changed from 'striped' to 'simple' for a cleaner look
                        size="md"
                    >
                        <Thead bg={bgHeader}> {/* 🎨 Used the lighter header background */}
                            <Tr>
                                <Th>Property & Location</Th>
                                <Th>Client Details</Th>
                                <Th>Check In</Th>
                                <Th>Check Out</Th>
                                <Th isNumeric>Total Amount</Th>
                                <Th>Status</Th>
                                <Th>Cancelled By</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {currentData.length === 0 ? (
                                <Tr>
                                    <Td colSpan="7" textAlign="center" py={5}>
                                        <Text fontWeight="medium" color="gray.500">
                                            No bookings match your filters.
                                        </Text>
                                    </Td>
                                </Tr>
                            ) : (
                                currentData.map((booking) => {
                                    const cancelledById =
                                        booking.cancelledBy && (booking.cancelledBy._id || booking.cancelledBy);
                                    const ownerId = booking.owner && (booking.owner._id || booking.owner);
                                    const clientId = booking.client?._id;

                                    let cancelledByLabel = "-";
                                    if (booking.status === "cancelled") {
                                        if (String(cancelledById) === String(ownerId))
                                            cancelledByLabel = "Owner";
                                        else if (String(cancelledById) === String(clientId))
                                            cancelledByLabel = "User";
                                        else cancelledByLabel = "Unknown";
                                    }

                                    return (
                                        <Tr key={booking._id} _hover={{ bg: useColorModeValue("blue.50", "gray.600") }}>
                                            <Td>
                                                {/* 🔄 Applied Title Case */}
                                                <Text fontWeight="bold">{toTitleCase(booking.property?.name)}</Text>
                                                <Text fontSize="sm" color="gray.500">
                                                    {/* 🔄 Applied Title Case */}
                                                    {toTitleCase(booking.property?.location)}
                                                </Text>
                                            </Td>
                                            <Td>
                                                {/* 🔄 Applied Title Case */}
                                                <Text>{toTitleCase(booking.client?.name)}</Text>
                                                <Text fontSize="sm" color="gray.500">
                                                    {booking.client?.email || "N/A"}
                                                </Text>
                                            </Td>
                                            <Td>
                                                <Text fontWeight="medium">
                                                    {booking.checkInDate
                                                        ? new Date(booking.checkInDate).toLocaleDateString()
                                                        : "-"}
                                                </Text>
                                            </Td>
                                            <Td>
                                                <Text fontWeight="medium">
                                                    {booking.checkOutDate
                                                        ? new Date(booking.checkOutDate).toLocaleDateString()
                                                        : "-"}
                                                </Text>
                                            </Td>
                                            <Td isNumeric fontWeight="semibold">
                                                {formatCurrency(booking.totalAmount)}
                                            </Td>
                                            <Td>
                                                <Badge 
                                                    colorScheme={getStatusColor(booking.status)}
                                                    textTransform="uppercase"
                                                    px={3}
                                                    py={1}
                                                    borderRadius="md" // 🎨 Subtle change on badge design
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </Td>
                                            <Td>{cancelledByLabel}</Td>
                                        </Tr>
                                    );
                                })
                            )}
                        </Tbody>
                    </Table>
                </Box>

                {/* Pagination Component (No Change) */}
                {totalItems > 0 && (
                    <Center mt={6}>
                        <HStack spacing={4}>
                            <Text fontSize="sm" color="gray.600">
                                Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} bookings
                            </Text>
                            <Pagination
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </HStack>
                    </Center>
                )}
            </Box>
        </Box>
    );
};

export default BookingHistory;