import {
    Badge,
    Box,
    Button,
    Center,
    Flex,
    Heading,
    HStack,
    IconButton,
    Image,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Select,
    SimpleGrid,
    Tab,
    Table,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue,
    useToast,
    VStack
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaCheck, FaEye, FaTimes } from "react-icons/fa";
import Pagination from "../../components/Pagination";

// 🔄 UTILITY FUNCTION: Title Case conversion for names/locations
const toTitleCase = (str) => {
    if (!str) return 'N/A';
    return str.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Helper component for cleaner detail list in the modal
const DetailItem = ({ label, value, isPrice = false }) => (
    <HStack w="100%" justify="space-between">
        <Text fontWeight="medium" color="gray.500">{label}:</Text>
        <Text fontWeight={isPrice ? "bold" : "normal"}>{value || "N/A"}</Text>
    </HStack>
);

const PropertyManagementWithFilters = () => {
    const [properties, setProperties] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [filters, setFilters] = useState({
        title: "",
        owner: "",
        type: "",
        location: "",
    });

    // Pagination state for each tab
    const [currentPagePending, setCurrentPagePending] = useState(1);
    const [currentPageApproved, setCurrentPageApproved] = useState(1);
    const [currentPageRejected, setCurrentPageRejected] = useState(1);
    const [currentPageAll, setCurrentPageAll] = useState(1);

    const itemsPerPage = 10;
    const toast = useToast();
    const bgCard = useColorModeValue("white", "gray.700");
    const bgHeader = useColorModeValue("gray.100", "gray.800");

    // For modal detail view
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await axios.get("/api/properties/admin", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setProperties(res.data);
            setFiltered(res.data);
        } catch (err) {
            toast({
                title: "Error fetching properties",
                status: "error",
            });
        }
    };

    const handleApprove = async (id) => {
        try {
            await axios.put(
                `/api/properties/${id}/approve`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            toast({ title: "Property approved", status: "success" });
            fetchProperties();
            setIsDetailOpen(false); // Close modal after action
        } catch {
            toast({ title: "Failed to approve property", status: "error" });
        }
    };

    const handleReject = async (id) => {
        try {
            await axios.put(
                `/api/properties/${id}/reject`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            toast({ title: "Property rejected", status: "success" });
            fetchProperties();
            setIsDetailOpen(false); // Close modal after action
        } catch {
            toast({ title: "Failed to reject property", status: "error" });
        }
    };

    const handleFilter = () => {
        let data = [...properties];
        if (filters.title)
            data = data.filter((p) =>
                p.name?.toLowerCase().includes(filters.title.toLowerCase())
            );
        if (filters.owner)
            data = data.filter((p) =>
                p.owner?.name?.toLowerCase().includes(filters.owner.toLowerCase())
            );
        if (filters.type)
            data = data.filter(
                (p) => p.type?.toLowerCase() === filters.type.toLowerCase()
            );
        if (filters.location)
            data = data.filter((p) =>
                p.location?.toLowerCase().includes(filters.location.toLowerCase())
            );
        setFiltered(data);

        // Reset pagination when filters change
        setCurrentPagePending(1);
        setCurrentPageApproved(1);
        setCurrentPageRejected(1);
        setCurrentPageAll(1);
    };

    useEffect(() => {
        handleFilter();
    }, [filters, properties]);

    const paginate = (data, currentPage) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return data.slice(startIndex, startIndex + itemsPerPage);
    };

    const renderTable = (list, showActions = false, showApproval = false, showImage = false, isPendingView = false) => (
        <Box overflowX="auto" mt={4}>
            {list.length === 0 ? (
                <Center p={8}>
                    <Text color="gray.500">No properties found in this category.</Text>
                </Center>
            ) : (
                <Table variant="simple" size="md">
                    <Thead bg={bgHeader}>
                        <Tr>
                            {showImage && <Th w="100px">Image</Th>}
                            <Th w={{ base: "auto", md: "25%" }}>Title</Th>
                            <Th w="15%">Owner</Th>
                            <Th w="10%">Type</Th>
                            <Th w="15%">Location</Th>
                            <Th w="10%">Status</Th>
                            {showActions && <Th w="150px" textAlign="center">Actions</Th>}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {list.map((p) => (
                            <Tr key={p._id} _hover={{ bg: useColorModeValue("gray.50", "gray.600") }}>
                                {showImage && (
                                    <Td>
                                        <Image
                                            src={
                                                p.images && p.images.length > 0
                                                    ? p.images?.[0]?.url || "https://via.placeholder.com/80x60?text=No+Image"
                                                    : "https://via.placeholder.com/80x60?text=No+Image"
                                            }
                                            alt={p.name}
                                            boxSize="60px"
                                            objectFit="cover"
                                            borderRadius="md"
                                        />
                                    </Td>
                                )}
                                <Td fontWeight="bold" color="blue.600">{toTitleCase(p.name)}</Td>
                                <Td>{toTitleCase(p.owner?.name)}</Td>
                                <Td>{toTitleCase(p.type)}</Td>
                                <Td>{toTitleCase(p.location)}</Td>
                                <Td>
                                    <Badge
                                        colorScheme={
                                            p.status === "rejected"
                                                ? "red"
                                                : p.isApproved === false
                                                ? "yellow"
                                                : p.status === "available"
                                                ? "green" 
                                                : "gray"
                                        }
                                        borderRadius="full"
                                        px={3}
                                    >
                                        {p.status === "rejected"
                                            ? "Rejected"
                                            : p.isApproved === false
                                            ? "Pending"
                                            : p.status}
                                    </Badge>
                                </Td>
                                {/* 🟢 FIXED: Prioritize 'rejected' status over 'isApproved' for the Approval column */}
                               
                                {showActions && (
                                    <Td textAlign="center">
                                        <HStack spacing={2} justifyContent="center">
                                            {/* Approve/Reject Buttons (Only for Pending View) */}
                                            {isPendingView && p.status !== "rejected" && !p.isApproved && (
                                                <>
                                                    <IconButton
                                                        icon={<FaCheck />}
                                                        size="sm"
                                                        colorScheme="green"
                                                        onClick={() => handleApprove(p._id)}
                                                        aria-label="Approve"
                                                    />
                                                    <IconButton
                                                        icon={<FaTimes />}
                                                        size="sm"
                                                        colorScheme="red"
                                                        onClick={() => handleReject(p._id)}
                                                        aria-label="Reject"
                                                    />
                                                </>
                                            )}
                                            {/* View Details Button */}
                                            <IconButton
                                                icon={<FaEye />}
                                                size="sm"
                                                colorScheme="blue"
                                                onClick={() => {
                                                    setSelectedProperty(p);
                                                    setIsDetailOpen(true);
                                                }}
                                                aria-label="View Details"
                                            />
                                        </HStack>
                                    </Td>
                                )}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            )}
        </Box>
    );


    const pending = filtered.filter((p) => !p.isApproved && p.status !== "rejected");
    const approved = filtered.filter((p) => p.isApproved && p.status !== "rejected");
    const rejected = filtered.filter((p) => p.status === "rejected");
    const all = filtered;

    return (
        <Box p={5} minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
            <Box
                bg={bgCard}
                p={{ base: 4, md: 8 }}
                borderRadius="xl"
                shadow="xl"
            >
                <Heading size="xl" mb={6}>
                    Property Management
                </Heading>

                {/* 🔍 Filters */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
                    <Input
                        placeholder="Search by Title"
                        onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                        value={filters.title}
                        size="md"
                        // FaSearch icon cannot be directly added to Input, use InputGroup/InputLeftElement for that.
                    />
                    <Input
                        placeholder="Search by Owner Name"
                        onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
                        value={filters.owner}
                        size="md"
                    />
                    <Select
                        placeholder="Filter by Type"
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        value={filters.type}
                        size="md"
                    >
                        {/* NOTE: Consider dynamically generating options if types change frequently */}
                        <option value="PG">PG</option>
                        <option value="Hostel">Hostel</option>
                        <option value="Apartment">Apartment</option>
                    </Select>
                    <Input
                        placeholder="Search by Location"
                        onChange={(e) =>
                            setFilters({ ...filters, location: e.target.value })
                        }
                        value={filters.location}
                        size="md"
                    />
                </SimpleGrid>

                {/* 🟢 Tabs for property approval */}
                <Tabs variant="soft-rounded" colorScheme="blue" isLazy>
                    <TabList mb={4}>
                        <Tab>Pending ({pending.length})</Tab>
                        <Tab>Approved ({approved.length})</Tab>
                        <Tab>Rejected ({rejected.length})</Tab>
                        <Tab>All ({all.length})</Tab>
                    </TabList>

                    <TabPanels>
                        {/* 1. Pending Tab */}
                        <TabPanel p={0}>
                            {renderTable(
                                paginate(pending, currentPagePending),
                                true,    // showActions
                                false,   // showApproval (Approval status is implied by the tab)
                                true,    // showImage
                                true     // isPendingView: true
                            )}
                            <Flex justify="center" mt={4}>
                                <Pagination
                                    totalItems={pending.length}
                                    itemsPerPage={itemsPerPage}
                                    currentPage={currentPagePending}
                                    onPageChange={setCurrentPagePending}
                                />
                            </Flex>
                        </TabPanel>

                        {/* 2. Approved Tab */}
                        <TabPanel p={0}>
                            {renderTable(
                                paginate(approved, currentPageApproved),
                                true,    // showActions (View Details only)
                                false,   // showApproval
                                true,    // showImage
                                false    // isPendingView: false
                            )}
                            <Flex justify="center" mt={4}>
                                <Pagination
                                    totalItems={approved.length}
                                    itemsPerPage={itemsPerPage}
                                    currentPage={currentPageApproved}
                                    onPageChange={setCurrentPageApproved}
                                />
                            </Flex>
                        </TabPanel>

                        {/* 3. Rejected Tab */}
                        <TabPanel p={0}>
                            {renderTable(
                                paginate(rejected, currentPageRejected),
                                true,    // showActions (View Details only)
                                false,   // showApproval
                                true,    // showImage
                                false    // isPendingView: false
                            )}
                            <Flex justify="center" mt={4}>
                                <Pagination
                                    totalItems={rejected.length}
                                    itemsPerPage={itemsPerPage}
                                    currentPage={currentPageRejected}
                                    onPageChange={setCurrentPageRejected}
                                />
                            </Flex>
                        </TabPanel>

                        {/* 4. All Tab */}
                        <TabPanel p={0}>
                            {renderTable(
                                paginate(all, currentPageAll),
                                true,    // showActions (View Details only)
                                true,    // showApproval (Show approval status column, now correctly handled)
                                true,    // showImage
                                false    // isPendingView: false
                            )}
                            <Flex justify="center" mt={4}>
                                <Pagination
                                    totalItems={all.length}
                                    itemsPerPage={itemsPerPage}
                                    currentPage={currentPageAll}
                                    onPageChange={setCurrentPageAll}
                                />
                            </Flex>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>

            {/* ✅ Detail Modal - Highly Improved Design */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} size="4xl">
                <ModalOverlay />
                <ModalContent p={4} borderRadius="xl">
                    <ModalHeader borderBottom="1px" borderColor="gray.200" pb={3}>
                        {selectedProperty?.name ? toTitleCase(selectedProperty.name) : "Property Details"}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedProperty ? (
                            <SimpleGrid
                                columns={{ base: 1, md: 2 }}
                                spacing={8}
                                py={4}
                            >
                                {/* Left Column: Image and Description */}
                                <VStack align="stretch" spacing={5}>
                                    <Image
                                        src={
                                            selectedProperty.images?.[0]?.url ||
                                            selectedProperty.images?.[0] ||
                                            "https://via.placeholder.com/600x400?text=No+Image"
                                        }
                                        alt={selectedProperty.name}
                                        borderRadius="lg"
                                        maxH="300px"
                                        objectFit="cover"
                                        shadow="md"
                                    />
                                    <Box>
                                        <Text fontWeight="bold" fontSize="lg" mb={2}>Description</Text>
                                        <Text color="gray.600" fontSize="md">
                                            {selectedProperty.description || "No description provided."}
                                        </Text>
                                    </Box>
                                </VStack>

                                {/* Right Column: Key Details */}
                                <VStack align="start" spacing={3} p={2}>
                                    <Box borderBottom="1px" borderColor="gray.100" w="100%" pb={2}>
                                        <Text fontWeight="bold" color="gray.700">Status & Approval</Text>
                                        <HStack mt={1} spacing={4}>
                                            {/* 🟢 FIXED: Detail Modal Approval Badge logic */}
                                            <Badge 
                                                colorScheme={
                                                    selectedProperty.status === "rejected"
                                                        ? "red"
                                                        : selectedProperty.isApproved
                                                        ? "green"
                                                        : "yellow"
                                                }
                                                fontSize="sm" 
                                                px={3}
                                            >
                                                Approval: {
                                                    selectedProperty.status === "rejected"
                                                    ? "Rejected"
                                                    : selectedProperty.isApproved 
                                                    ? "Approved" 
                                                    : "Pending"
                                                }
                                            </Badge>
                                            <Badge colorScheme={selectedProperty.status === "rejected" ? "red" : "blue"} fontSize="sm" px={3}>
                                                Status: {toTitleCase(selectedProperty.status)}
                                            </Badge>
                                        </HStack>
                                    </Box>
                                                        
                                    <DetailItem label="Owner" value={toTitleCase(selectedProperty.owner?.name)} />
                                    <DetailItem label="Owner Email" value={selectedProperty.owner?.email} />
                                    <DetailItem label="Owner Mobile" value={selectedProperty.owner?.phone} />
                                    <DetailItem label="Type" value={selectedProperty.type} />
                                    <DetailItem label="Location" value={toTitleCase(selectedProperty.location)} />
                                    <DetailItem label="Price" value={`₹${selectedProperty.price}`} isPrice={true} />

                                    {selectedProperty.amenities?.length > 0 && (
                                        <Box mt={3} pt={2} borderTop="1px" borderColor="gray.100" w="100%">
                                            <Text fontWeight="bold" color="gray.700" mb={1}>Amenities:</Text>
                                            <Text fontSize="sm">{selectedProperty.amenities.join(", ")}</Text>
                                        </Box>
                                    )}
                                </VStack>
                            </SimpleGrid>
                        ) : (
                            <Text>No property selected</Text>
                        )}
                        
                        {/* Action buttons inside the modal, useful for quick access */}
                        {selectedProperty && !selectedProperty.isApproved && selectedProperty.status !== "rejected" && (
                            <HStack justify="flex-end" pt={4} borderTop="1px" borderColor="gray.100" mt={4}>
                                <Button colorScheme="red" leftIcon={<FaTimes />} onClick={() => handleReject(selectedProperty._id)}>
                                    Reject
                                </Button>
                                <Button colorScheme="green" leftIcon={<FaCheck />} onClick={() => handleApprove(selectedProperty._id)}>
                                    Approve
                                </Button>
                            </HStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default PropertyManagementWithFilters;