import {
    Box,
    Button,
    Card,
    CardBody,
    CardFooter,
    Center,
    Container,
    Divider,
    Flex,
    Heading,
    HStack,
    Icon,
    Image,
    SimpleGrid,
    Spinner,
    Tag,
    Text,
    useColorModeValue,
    useToast,
    VStack
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaBed, FaCheckCircle, FaDollarSign, FaEdit, FaHome, FaHourglassHalf, FaMapMarkerAlt, FaPlus, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:5000";

// --- Helper Functions (Kept unchanged) ---

const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return String(string).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const getStatusBadge = (isApproved) => {
    return isApproved ? (
        <Tag size="lg" colorScheme="green" variant="solid" borderRadius="full" px={3}>
            <Icon as={FaCheckCircle} mr={1} /> Approved
        </Tag>
    ) : (
        <Tag size="lg" colorScheme="yellow" variant="subtle" borderRadius="full" px={3}>
            <Icon as={FaHourglassHalf} mr={1} /> Pending
        </Tag>
    );
};

const OwnerProperties = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Theme values
    const cardBg = useColorModeValue("white", "gray.700");
    const containerBg = useColorModeValue("gray.50", "gray.800");

    useEffect(() => {
        if (!user?._id) return;

        const fetchProperties = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                const res = await axios.get("/api/property-owner/properties", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setProperties(res.data);
            } catch (err) {
                toast({
                    title: "Error fetching properties",
                    description: err.response?.data?.message || "Could not load your properties.",
                    status: "error",
                    duration: 4000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [user, toast]);

    if (loading) {
        return (
            <Center h="100vh" bg={containerBg}>
                <Spinner size="xl" color="blue.500" thickness="4px" />
            </Center>
        );
    }
    
    // Fallback function for location object or string
    const formatLocation = (location) => {
        if (typeof location === "string") {
            return capitalizeFirstLetter(location);
        }
        if (location && location.city) {
            return capitalizeFirstLetter(location.city);
        }
        return "Unknown Location";
    };


    return (
        // 1. Removed full padding from Box and added it to the Container.
        // 2. Used Container with maxW="container.xl" to prevent content from stretching too much.
        <Box minH="100vh" bg={containerBg}>
            <Container maxW="container.xl" py={{ base: 8, md: 10 }} px={{ base: 4, md: 6 }}>
                <VStack align="stretch" spacing={8}>
                    
                    {/* Header and Action Button */}
                    <Flex justify="space-between" align="center" pb={4} borderBottom="1px" borderColor={useColorModeValue("gray.200", "gray.700")}>
                        <Heading size="xl" color={useColorModeValue("gray.700", "gray.100")}>My Properties ({properties.length})</Heading>
                        <Button
                            colorScheme="blue"
                            leftIcon={<FaPlus />}
                            size="lg"
                            onClick={() => navigate("/owner/add-property")}
                        >
                            Add New Property
                        </Button>
                    </Flex>

                    {/* Property Grid or No Data State */}
                    {properties.length === 0 ? (
                        <Center py={16} flexDirection="column">
                            <Icon as={FaHome} w={16} h={16} color="blue.400" mb={4} />
                            <Heading size="lg" mb={2}>No Properties Listed Yet</Heading>
                            <Text color="gray.500" mb={6}>Start by listing your first rental property.</Text>
                            <Button
                                colorScheme="blue"
                                leftIcon={<FaPlus />}
                                size="md"
                                onClick={() => navigate("/owner/add-property")}
                            >
                                List My Property Now
                            </Button>
                        </Center>
                    ) : (
                        // 2. Changed SimpleGrid columns for better wide screen utilization: 1 (base), 2 (md), 3 (lg), 4 (xl/2xl)
                        <SimpleGrid 
                            columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} 
                            spacing={8}
                        >
                            {properties.map((property) => (
                                <Card 
                                    key={property._id} 
                                    bg={cardBg} 
                                    shadow="xl" 
                                    borderRadius="xl"
                                    overflow="hidden"
                                    transition="all 0.3s"
                                    _hover={{ shadow: "2xl", transform: "translateY(-2px)" }}
                                >
                                    {/* Property Image Section */}
                                    <Box position="relative" h="220px">
                                        {property.images && property.images.length > 0 ? (
                                            <Image
                                                src={property.images?.[0]?.url || property.images[0]}
                                                alt={property.name || "Property image"}
                                                h="100%"
                                                w="100%"
                                                objectFit="cover"
                                                fallbackSrc="https://via.placeholder.com/400x220?text=No+Image"
                                            />
                                        ) : (
                                            <Center h="100%" bg={useColorModeValue("gray.100", "gray.600")}>
                                                <Text color="gray.500">No Image Available</Text>
                                            </Center>
                                        )}
                                        <Box position="absolute" top={3} right={3}>
                                            {getStatusBadge(property.isApproved)}
                                        </Box>
                                    </Box>
                                    
                                    <CardBody p={5}>
                                        <VStack align="stretch" spacing={4}>
                                            <Heading size="md" noOfLines={1} textTransform="capitalize">
                                                {capitalizeFirstLetter(property.name) || "No Property Name"}
                                            </Heading>

                                            {/* Key Details: Location, Beds, Guests - Made wrap tighter */}
                                            <SimpleGrid columns={3} spacing={2} pb={1} fontSize="sm">
                                                
                                                <HStack spacing={1}>
                                                    <Icon as={FaMapMarkerAlt} color="blue.500" w={4} h={4} />
                                                    <Text color="gray.500" isTruncated title={formatLocation(property.location)}>
                                                        {formatLocation(property.location)}
                                                    </Text>
                                                </HStack>
                                                
                                                <HStack spacing={1}>
                                                    <Icon as={FaBed} color="teal.500" w={4} h={4} />
                                                    <Text color="gray.500">
                                                        {property.bedrooms || "N/A"} Bed{property.bedrooms !== 1 && 's'}
                                                    </Text>
                                                </HStack>
                                                
                                                <HStack spacing={1}>
                                                    <Icon as={FaUsers} color="purple.500" w={4} h={4} />
                                                    <Text color="gray.500">
                                                        {property.maxOccupancy || "N/A"} Guest{property.maxOccupancy !== 1 && 's'}
                                                    </Text>
                                                </HStack>
                                                
                                            </SimpleGrid>
                                            
                                            <Divider />

                                            {/* Price - Slightly more compact */}
                                            <HStack justify="space-between" p={2} bg={useColorModeValue("blue.50", "blue.900")} borderRadius="md">
                                                <Text fontWeight="bold" fontSize="md" color="blue.600">
                                                    <Icon as={FaDollarSign} mr={1} />
                                                    Price:
                                                </Text>
                                                <Text fontWeight="extrabold" fontSize="xl" color="blue.600">
                                                    ₹{property.price ? property.price.toLocaleString() : '0'}
                                                    <Text as="span" fontSize="md" fontWeight="medium">/night</Text>
                                                </Text>
                                            </HStack>
                                            
                                            {/* Description */}
                                            <Box>
                                                <Text fontWeight="semibold" fontSize="sm">Description:</Text>
                                                <Text noOfLines={3} color="gray.600" fontSize="sm">
                                                    {property.description || "No detailed description provided."}
                                                </Text>
                                            </Box>
                                        </VStack>
                                    </CardBody>

                                    <CardFooter pt={0} px={5} pb={5}>
                                        <HStack spacing={3} w="full">
                                            <Button
                                                flex="1"
                                                colorScheme="orange"
                                                variant="outline"
                                                leftIcon={<FaEdit />}
                                                onClick={() => navigate(`/owner/property/${property._id}`)}
                                            >
                                                Edit Details
                                            </Button>
                                        </HStack>
                                    </CardFooter>
                                </Card>
                            ))}
                        </SimpleGrid>
                    )}
                </VStack>
            </Container>
        </Box>
    );
};

export default OwnerProperties;