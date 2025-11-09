import {
    Alert,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertIcon,
    Badge,
    Box,
    Button,
    Center,
    Container,
    Flex,
    Heading,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
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
    Tooltip,
    Tr,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import {
    FaBolt,
    FaCommentDots,
    FaRedo,
    FaSearch,
    FaSyncAlt,
    FaTrashAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// --- UTILITY COMPONENTS FOR DESIGN (No Change) ---

const StatusBadge = ({ status }) => {
    const colorMap = {
        active: "green",
        inactive: "gray",
        suspended: "red",
        default: "gray",
    };

    const capitalizedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

    return (
        <Badge colorScheme={colorMap[status] || colorMap.default} p={1} borderRadius="md" minW="80px" textAlign="center">
            {capitalizedStatus}
        </Badge>
    );
};

const RoleDisplay = ({ role }) => {
    const capitalizedRole = role ? role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown';
    return <Box>{capitalizedRole}</Box>;
};

// ✅ NEW UTILITY: Function to capitalize the first letter of every word (Title Case)
const capitalizeName = (name) => {
    if (!name) return 'Unknown User';
    return name.toLowerCase()
               .split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
               .join(' ');
};


const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const initialFilters = {
        name: "",
        email: "",
        role: "",
        status: "",
    };
    const [filters, setFilters] = useState(initialFilters);

    // For delete confirmation
    const [deleteUserId, setDeleteUserId] = useState(null);

    // State for status change confirmation
    const [statusChangeUser, setStatusChangeUser] = useState(null); // { userId: string, newStatus: string, currentName: string }

    const cancelRef = useRef();
    const toast = useToast();
    const navigate = useNavigate();

    // Chakra UI styling for context
    const mainBg = useColorModeValue("white", "gray.700");
    const filterBarBg = useColorModeValue("gray.50", "gray.800");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get("/api/admin/users", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            setUsers(response.data);
            setFiltered(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError(error.response?.data?.message || "Failed to fetch users");
            toast({
                title: "Error fetching users",
                description: error.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Apply filters (No Change in logic)
    useEffect(() => {
        let data = [...users];
        if (filters.name) {
            data = data.filter((u) =>
                u.name?.toLowerCase().includes(filters.name.toLowerCase())
            );
        }
        if (filters.email) {
            data = data.filter((u) =>
                u.email?.toLowerCase().includes(filters.email.toLowerCase())
            );
        }
        if (filters.role) {
            data = data.filter((u) => u.role === filters.role);
        }
        if (filters.status) {
            data = data.filter((u) => u.status === filters.status);
        }
        setFiltered(data);
    }, [filters, users]);

    // Clear filters function (No Change)
    const handleClearFilters = () => {
        setFilters(initialFilters);
        toast({
            title: "Filters cleared",
            status: "info",
            duration: 1500,
            isClosable: true,
        });
    };

    // Function to open the confirmation dialog
    const handleStatusChangeRequest = (userId, targetStatus, currentName) => {
        const currentUser = users.find(u => u._id === userId);
        if (currentUser && currentUser.status === targetStatus) {
             toast({
                 title: "Status not changed",
                 description: `User is already ${targetStatus}.`,
                 status: "info",
                 duration: 2000,
                 isClosable: true,
             });
             return;
        }

        setStatusChangeUser({
            userId: userId,
            newStatus: targetStatus,
            currentName: currentName,
        });
    };
    
    // Function to execute the status update after confirmation
    const handleConfirmStatusChange = async () => {
        if (!statusChangeUser) return;

        const { userId, newStatus, currentName } = statusChangeUser;
        const capitalizedNewStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

        try {
            await axios.put(
                `/api/admin/users/${userId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            toast({
                title: "User status updated",
                description: `${currentName}'s status successfully changed to ${capitalizedNewStatus}.`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            fetchUsers(); // Re-fetch to update table data
        } catch (error) {
            console.error("Error updating user status:", error);
            toast({
                title: "Error updating user status",
                description: error.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setStatusChangeUser(null); // Close dialog
        }
    };


    const confirmDeleteUser = (userId) => {
        setDeleteUserId(userId);
    };

    const handleDeleteUser = async () => {
        try {
            await axios.delete(`/api/admin/users/${deleteUserId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            toast({
                title: "User deleted",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast({
                title: "Error deleting user",
                description: error.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setDeleteUserId(null);
        }
    };

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
                <Alert status="error" borderRadius="lg">
                    <AlertIcon />
                    {error}
                </Alert>
            </Container>
        );
    }

    // Helper for Status Dialog message
    const getStatusChangeMessage = (status) => {
        switch (status) {
            case 'active':
                return "The user will regain full access to their account.";
            case 'inactive':
                return "The user's account will be temporarily disabled and they will not be able to log in.";
            case 'suspended':
                return "The user will be immediately logged out and permanently blocked from logging in. This is usually reserved for policy violations.";
            default:
                return "Are you sure you want to change the user's status?";
        }
    };

    return (
        <Container maxW="container.xl" py={10} bg="gray.50">
            <Box
                bg={mainBg}
                p={{ base: 4, md: 8 }}
                borderRadius="xl"
                shadow="xl"
            >
                {/* Header and Refresh Button */}
                <Flex mb={6} align="center">
                    <Heading size="xl" color="gray.800">Manage Users</Heading>
                    <Spacer />
                    <Tooltip label="Refresh Data">
                        <IconButton
                            icon={<FaSyncAlt />}
                            onClick={fetchUsers}
                            aria-label="Refresh users"
                            colorScheme="gray"
                            variant="ghost"
                        />
                    </Tooltip>
                </Flex>

                {/* 🔍 FILTERS BAR (Unchanged) */}
                <Box bg={filterBarBg} p={4} borderRadius="lg" mb={6} shadow="sm">
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={4}>
                        {/* Search by Name */}
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <FaSearch color="gray.300" />
                            </InputLeftElement>
                            <Input
                                placeholder="Search by name"
                                value={filters.name}
                                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                                size="md"
                                borderRadius="lg"
                            />
                        </InputGroup>

                        {/* Search by Email */}
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <FaSearch color="gray.300" />
                            </InputLeftElement>
                            <Input
                                placeholder="Search by email"
                                value={filters.email}
                                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                                size="md"
                                borderRadius="lg"
                            />
                        </InputGroup>

                        {/* Filter by Role */}
                        <Select
                            placeholder="Filter by role"
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            size="md"
                            borderRadius="lg"
                        >
                            <option value="client">Client</option>
                            <option value="property_owner">Property Owner</option>
                        </Select>

                        {/* Filter by Status */}
                        <Select
                            placeholder="Filter by status"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            size="md"
                            borderRadius="lg"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </Select>

                        {/* Reset Filters Button */}
                        <Button
                            leftIcon={<FaRedo />}
                            onClick={handleClearFilters}
                            colorScheme="gray"
                            variant="outline"
                            size="md"
                            borderRadius="lg"
                        >
                            Reset Filters
                        </Button>
                    </SimpleGrid>
                </Box>
                {/* 📊 User Table */}
                <Box overflowX="auto">
                    <Table variant="simple" size="md">
                        <Thead bg={filterBarBg}>
                            <Tr>
                                <Th>Name</Th>
                                <Th>Email</Th>
                                <Th>Role</Th>
                                <Th>Current Status</Th>
                                <Th>Change Status</Th>
                                <Th textAlign="center">Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filtered.filter((user) => user.role !== "admin").map((user) => (
                                <Tr
                                    key={user._id}
                                    _hover={{ bg: useColorModeValue("blue.50", "gray.700") }}
                                >
                                    {/* ✅ User Name Displayed with Capitalized First Letter */}
                                    <Td fontWeight="semibold">{capitalizeName(user.name)}</Td>
                                    <Td color="gray.600">{user.email}</Td>
                                    <Td><RoleDisplay role={user.role} /></Td>
                                    <Td>
                                        <StatusBadge status={user.status} />
                                    </Td>

                                    <Td>
                                        <Select
                                            value={user.status}
                                            onChange={(e) => 
                                                // Pass the capitalized name to the dialog state
                                                handleStatusChangeRequest(user._id, e.target.value, capitalizeName(user.name))
                                            }
                                            size="sm"
                                            w="150px"
                                        >
                                            <option value="active">Activate</option>
                                            <option value="inactive">Deactivate</option>
                                            <option value="suspended">Suspend</option>
                                        </Select>
                                    </Td>

                                    <Td>
                                        <HStack spacing={2} justifyContent="center">
                                            {/* Chat Button (No Change) */}
                                            <Tooltip label="Chat with User">
                                                <IconButton
                                                    icon={<FaCommentDots />}
                                                    colorScheme="blue"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => navigate(`/admin/chat/${user._id}`)}
                                                    aria-label="Chat"
                                                />
                                            </Tooltip>

                                            {/* Delete Button (No Change) */}
                                            <Tooltip label="Delete User">
                                                <IconButton
                                                    icon={<FaTrashAlt />}
                                                    colorScheme="red"
                                                    size="sm"
                                                    onClick={() => confirmDeleteUser(user._id)}
                                                    aria-label="Delete user"
                                                />
                                            </Tooltip>
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                            {filtered.length === 0 && (
                                <Tr>
                                    <Td colSpan={6} textAlign="center" py={5}>
                                        No users found matching the current filters.
                                    </Td>
                                </Tr>
                            )}
                        </Tbody>
                    </Table>
                </Box>
            </Box>

            {/* 🔴 Delete Confirmation Dialog (Unchanged) */}
            <AlertDialog
                isOpen={!!deleteUserId}
                leastDestructiveRef={cancelRef}
                onClose={() => setDeleteUserId(null)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete User
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete this user? This action cannot be
                            undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setDeleteUserId(null)}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleDeleteUser} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* ✅ Status Change Confirmation Dialog (IMPROVED DESIGN) */}
            <AlertDialog
                isOpen={!!statusChangeUser}
                leastDestructiveRef={cancelRef}
                onClose={() => setStatusChangeUser(null)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold" display="flex" alignItems="center">
                            <FaBolt style={{ marginRight: '8px' }} color="#4299e1" />
                            Confirm Status Change
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            {statusChangeUser && (
                                <Box>
                                    <Text mb={4} fontSize="md">
                                        You are about to change the status of
                                        <Text as="span" fontWeight="bold" color="blue.600" mx={1}>
                                            {statusChangeUser.currentName}
                                        </Text>
                                        to
                                        <Badge 
                                            ml={2} 
                                            colorScheme={statusChangeUser.newStatus === 'active' ? 'green' : statusChangeUser.newStatus === 'suspended' ? 'red' : 'gray'}
                                            fontSize="0.8em"
                                            px={2}
                                            py={1}
                                            borderRadius="full"
                                        >
                                            {statusChangeUser.newStatus.toUpperCase()}
                                        </Badge>
                                        .
                                    </Text>
                                    <Box p={3} bg={useColorModeValue('yellow.50', 'gray.600')} borderRadius="md">
                                        <Text fontWeight="medium" color={useColorModeValue('yellow.800', 'yellow.200')}>
                                            Impact:
                                        </Text>
                                        <Text fontSize="sm" mt={1}>
                                            {getStatusChangeMessage(statusChangeUser.newStatus)}
                                        </Text>
                                    </Box>
                                </Box>
                            )}
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setStatusChangeUser(null)}>
                                Cancel
                            </Button>
                            <Button 
                                colorScheme="blue" 
                                onClick={handleConfirmStatusChange} 
                                ml={3}
                            >
                                Confirm Change
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
            {/* END IMPROVED DIALOG */}
        </Container>
    );
};

export default AdminUsers;