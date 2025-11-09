import {
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    CardFooter,
    Center, // Used for displaying active filters
    Divider,
    Flex,
    Heading,
    HStack,
    Icon,
    Image,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    SimpleGrid,
    Spinner,
    Tag,
    Text,
    useToast,
    VStack,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import {
    MdApartment,
    MdChevronRight,
    MdClear,
    MdFilterList,
    MdHomeWork,
    MdKingBed,
    MdLocationOn,
    MdSearch,
    MdStar
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
// Assuming these are external components
import axios from "axios";
import Pagination from "../../components/Pagination";
import StarRating from "../../components/StarRating";

// NOTE: Ensure your backend is running on http://localhost:5000
axios.defaults.baseURL = "http://localhost:5000";

/**
 * Utility function to capitalize the first letter of a string.
 */
const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    const trimmedStr = str.trim();
    if (trimmedStr.length === 0) return '';
    return trimmedStr.charAt(0).toUpperCase() + trimmedStr.slice(1);
};


const truncate = (str = "", length = 90) => 
    str.length > length ? str.slice(0, length).trim() + "..." : str;

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        type: "all",
        minPrice: "",
        maxPrice: "",
        location: "",
        minRating: "all",
        minBedrooms: "",
        maxOccupancy: "",
    });

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const propertiesPerPage = 9;

    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                // Ensure this endpoint is correct for your backend
                const res = await axios.get("/api/properties");
                setProperties(res.data);
                setFiltered(res.data);
            } catch (error) {
                console.error("Error loading properties:", error);
                toast({
                    title: "Data Fetch Error",
                    description: error.response?.data?.message || "Failed to load property listings.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [toast]);

    // --- Filter Application Logic (Updated) ---
    useEffect(() => {
        let data = [...properties];
        const { search, type, minPrice, maxPrice, location, minRating, minBedrooms, maxOccupancy } = filters;

        // Apply filters (search, type, price, location, rating)
        if (search) {
            const q = search.toLowerCase();
            data = data.filter(
                (p) =>
                    (p.title || p.name || "").toLowerCase().includes(q) ||
                    (p.type || "").toLowerCase().includes(q) ||
                    (p.location || "").toLowerCase().includes(q) ||
                    (p.description || "").toLowerCase().includes(q)
            );
        }

        if (type !== "all") {
            data = data.filter((p) => (p.type || "").toLowerCase() === type.toLowerCase());
        }

        if (location) {
            const loc = location.toLowerCase();
            data = data.filter((p) => (p.location || "").toLowerCase().includes(loc));
        }

        // Price Filters
        if (minPrice) data = data.filter((p) => Number(p.price) >= Number(minPrice));
        if (maxPrice) data = data.filter((p) => Number(p.price) <= Number(maxPrice));

        // Rating Filter
        if (minRating !== "all") {
            data = data.filter((p) => (p.averageRating || 0) >= Number(minRating));
        }

        // Bedrooms Filter
        if (minBedrooms) {
             data = data.filter((p) => Number(p.bedrooms) >= Number(minBedrooms));
        }
        
        // Max Occupancy Filter
        if (maxOccupancy) {
            data = data.filter((p) => Number(p.maxOccupancy) >= Number(maxOccupancy));
        }

        setFiltered(data);
        setCurrentPage(1);
    }, [filters, properties]);

    const handleClearFilters = () => {
        setFilters({
            search: "",
            type: "all",
            minPrice: "",
            maxPrice: "",
            location: "",
            minRating: "all",
            minBedrooms: "",
            maxOccupancy: "",
        });
    };
    
    const propertyTypes = useMemo(() => ["PG", "Hostel", "Apartment"], []);
    
    // Helper to get all active filter tags for display
    const getActiveFilters = () => {
        const active = [];
        const { search, type, minPrice, maxPrice, location, minRating, minBedrooms, maxOccupancy } = filters;
        
        if (search) active.push({ key: 'search', label: `Search: "${search}"` });
        if (type !== "all") active.push({ key: 'type', label: `Type: ${capitalizeFirstLetter(type)}` });
        if (location) active.push({ key: 'location', label: `Location: ${capitalizeFirstLetter(location)}` });
        if (minRating !== "all") active.push({ key: 'minRating', label: `Rating: ${minRating}+ Stars` });
        // Only show price ranges if one or both are set
        if (minPrice || maxPrice) {
             const minLabel = minPrice ? `Min ₹${minPrice}` : '';
             const maxLabel = maxPrice ? `Max ₹${maxPrice}` : '';
             active.push({ 
                 key: 'priceRange', 
                 label: `Price: ${minLabel}${minPrice && maxPrice ? ' - ' : ''}${maxLabel}`.trim(), 
                 clearKeys: ['minPrice', 'maxPrice'] // Custom clear logic for range
             });
        }
        if (minBedrooms) active.push({ key: 'minBedrooms', label: `Min Rooms: ${minBedrooms}` });
        if (maxOccupancy) active.push({ key: 'maxOccupancy', label: `Min Occupancy: ${maxOccupancy}` });

        return active.filter(item => item.label.trim() !== 'Price:'); // Filter out empty price tag
    };

    const removeFilter = (item) => {
        setFilters((prevFilters) => {
            const newFilters = { ...prevFilters };
            
            if (item.clearKeys) {
                item.clearKeys.forEach(key => { newFilters[key] = "" });
            } else if (item.key === 'type' || item.key === 'minRating') {
                 newFilters[item.key] = "all";
            } else {
                 newFilters[item.key] = "";
            }
            return newFilters;
        });
    };


    if (loading) {
        return (
            <Center h="70vh">
                <Spinner size="xl" color="blue.600" thickness="4px"/>
            </Center>
        );
    }

    // pagination calculations
    const totalItems = filtered.length;
    const startIndex = (currentPage - 1) * propertiesPerPage;
    const currentProperties = filtered.slice(
        startIndex,
        startIndex + propertiesPerPage
    );

    return (
        <Box p={{ base: 4, md: 8 }} maxW="8xl" mx="auto">
            {/* --- Main Heading --- */}
            <Heading 
                mb={2} 
                fontSize={{ base: "3xl", md: "4xl" }} 
                fontWeight="extrabold" 
                color="gray.800"
                letterSpacing="tight"
            >
                LodgeLink Property Listings
            </Heading>
            <Text mb={6} fontSize="lg" color="gray.600" fontWeight="medium">
                <Text as="strong" color="gray.800" fontWeight="extrabold" display="inline">
                    {totalItems}
                </Text>
                {" "} results found.
            </Text>

            {/* --- Filter Bar (Improved Design) --- */}
            <VStack 
                spacing={5} 
                align="stretch" 
                mb={10} 
                p={{ base: 4, md: 8 }} 
                bg="white" 
                borderRadius="2xl" 
                boxShadow="2xl"    
                border="2px solid" 
                borderColor="blue.100" 
            >
                {/* Section Title */}
                <HStack align="center" spacing={3} pb={2}>
                    <Icon as={MdFilterList} color="blue.600" boxSize={6} />
                    <Heading size="lg" fontWeight="extrabold" color="gray.800">
                        Refine Your Search
                    </Heading>
                </HStack>
                
                <Divider mb={4}/>
                
                {/* Primary Search and Location Row */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {/* Primary Search Input (Takes up 2 columns on medium screens) */}
                    <InputGroup gridColumn={{ md: "span 2" }}>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={MdSearch} color="blue.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search by title, description, or property type..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            variant="filled" 
                            bg="gray.50"
                            _focus={{ bg: 'white', borderColor: 'blue.500', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                    </InputGroup>

                    {/* Location Input */}
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={MdLocationOn} color="blue.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="City / Area"
                            value={filters.location}
                            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            variant="filled" 
                            bg="gray.50"
                            _focus={{ bg: 'white', borderColor: 'blue.500', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                    </InputGroup>
                </SimpleGrid>
                
                <Divider />

                {/* Secondary Filters - Grouped by Category */}
                <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} spacing={4}>
                    
                    {/* Type Select */}
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={MdHomeWork} color="gray.500" />
                        </InputLeftElement>
                        <Select
                            aria-label="Property Type"
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            variant="outline"
                            pl={10} 
                            borderColor="blue.300"
                        >
                            <option value="all">Type (All)</option>
                            {propertyTypes.map(type => (
                                <option key={type} value={type}>
                                    {capitalizeFirstLetter(type)}
                                </option>
                            ))}
                        </Select>
                    </InputGroup>
                    
                    {/* Rating Filter */}
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={MdStar} color="yellow.500" />
                        </InputLeftElement>
                        <Select
                            aria-label="Minimum Rating"
                            value={filters.minRating}
                            onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                            variant="outline"
                            pl={10}
                            borderColor="blue.300"
                        >
                            <option value="all">Rating (Any)</option>
                            <option value="4">4+ Stars</option>
                            <option value="3">3+ Stars</option>
                            <option value="2">2+ Stars</option>
                        </Select>
                    </InputGroup>

                    {/* Price Filter (Min) */}
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <Text color="gray.500" fontSize="md" fontWeight="bold">₹</Text>
                        </InputLeftElement>
                        <Input
                            placeholder="Min Price"
                            aria-label="Minimum Price"
                            type="number"
                            value={filters.minPrice}
                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                            variant="outline"
                            pl={8}
                            borderColor="blue.300"
                        />
                    </InputGroup>
                    
                    {/* Price Filter (Max) */}
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <Text color="gray.500" fontSize="md" fontWeight="bold">₹</Text>
                        </InputLeftElement>
                        <Input
                            placeholder="Max Price"
                            aria-label="Maximum Price"
                            type="number"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                            variant="outline"
                            pl={8}
                            borderColor="blue.300"
                        />
                    </InputGroup>
                    
                    {/* Minimum Bedrooms/Rooms Filter */}
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={MdApartment} color="gray.500" />
                        </InputLeftElement>
                        <Input
                            placeholder="Min Rooms"
                            aria-label="Minimum Rooms"
                            type="number"
                            min="0"
                            value={filters.minBedrooms}
                            onChange={(e) => setFilters({ ...filters, minBedrooms: e.target.value })}
                            variant="outline"
                            pl={10}
                            borderColor="blue.300"
                        />
                    </InputGroup>

                    {/* Minimum Max Occupancy/Beds Filter */}
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={MdKingBed} color="gray.500" />
                        </InputLeftElement>
                        <Input
                            placeholder="Min Beds"
                            aria-label="Minimum Max Occupancy"
                            type="number"
                            min="0"
                            value={filters.maxOccupancy}
                            onChange={(e) => setFilters({ ...filters, maxOccupancy: e.target.value })}
                            variant="outline"
                            pl={10}
                            borderColor="blue.300"
                        />
                    </InputGroup>
                </SimpleGrid>
                
                {/* Active Filters and Clear Button */}
                <Flex justify="space-between" align="center" wrap="wrap" pt={3}>
                    {/* Active Filters Display */}
                    <HStack spacing={2} wrap="wrap" flexGrow={1} minH="30px">
                        {getActiveFilters().length > 0 ? (
                            <>
                                <Text fontSize="sm" fontWeight="bold" color="gray.700">Active Filters:</Text>
                                {getActiveFilters().map(filter => (
                                    <Tag
                                        key={filter.label} // Use label or a combination for unique key
                                        size="md"
                                        variant="solid"
                                        colorScheme="blue"
                                        borderRadius="full"
                                        cursor="pointer"
                                        onClick={() => removeFilter(filter)}
                                    >
                                        <Text fontWeight="medium" isTruncated maxW="150px">{filter.label}</Text>
                                        <Icon as={MdClear} ml={1} boxSize={3} />
                                    </Tag>
                                ))}
                            </>
                        ) : (
                            <Text fontSize="sm" color="gray.500" fontStyle="italic">No active filters applied.</Text>
                        )}
                    </HStack>
                    
                    {/* Clear Filters Button */}
                    <Button
                        size="md"
                        variant="ghost"
                        leftIcon={<MdClear />}
                        onClick={handleClearFilters}
                        colorScheme="red"
                        fontWeight="semibold"
                        ml={{ base: 0, md: 4 }}
                        mt={{ base: 4, md: 0 }}
                    >
                        Clear All
                    </Button>
                </Flex>

            </VStack>

            {/* --- Property Grid (Remains the same) --- */}
            {filtered.length === 0 ? (
                <Center py={10} bg="white" borderRadius="lg" boxShadow="md">
                    <VStack spacing={3}>
                        <Heading size="lg" color="gray.500">No Listings Found</Heading>
                        <Text>Please widen your filter criteria and try again.</Text>
                    </VStack>
                </Center>
            ) : (
                <>
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 3 }} spacing={8}>
                        {currentProperties.map((property) => {
                            // Apply capitalization to display data
                            const capitalizedTitle = capitalizeFirstLetter(property.title || property.name);
                            const capitalizedType = capitalizeFirstLetter(property.type);
                            const capitalizedLocation = capitalizeFirstLetter(property.location);
                            
                            // Image source logic
                            const imgSrc =
                                property.images && property.images.length > 0
                                    ? property.images?.[0]?.url || property.images[0]
                                    : null;
                            
                            const avgRating = property.averageRating || 0;

                            const numRooms = property.bedrooms || 'N/A'; 
                            const numBeds = property.maxOccupancy || 'N/A'; 

                            return (
                                <Box
                                    key={property._id}
                                    as={Card}
                                    shadow="xl" 
                                    borderRadius="lg" 
                                    overflow="hidden"
                                    transition="transform 0.3s, box-shadow 0.3s"
                                    _hover={{ 
                                        transform: "translateY(-3px)", 
                                        shadow: "2xl", 
                                        cursor: "pointer",
                                        borderColor: 'blue.400', 
                                    }}
                                    border="1px solid"
                                    borderColor="gray.100"
                                    onClick={() => {
                                        navigate(`/property-details/${property._id}`);
                                    }}
                                >
                                    {/* Image Section */}
                                    <Box position="relative" height="200px">
                                        {imgSrc ? (
                                            <Image
                                                src={imgSrc}
                                                alt={capitalizedTitle || "Property Image"}
                                                objectFit="cover"
                                                width="100%"
                                                height="100%"
                                                fallbackSrc="https://via.placeholder.com/300x200?text=Image+Unavailable" 
                                            />
                                        ) : (
                                            <Center w="100%" h="100%" bg="gray.200">
                                                <Text color="gray.500" fontWeight="semibold">Image Unavailable</Text>
                                            </Center>
                                        )}
                                        
                                        {/* Price Tag */}
                                        <Flex 
                                            position="absolute" 
                                            bottom="0" 
                                            left="0" 
                                            bg="blue.600" 
                                            color="white" 
                                            px={4} 
                                            py={2} 
                                            borderTopRightRadius="lg"
                                            align="center"
                                        >
                                            <Text fontSize="xl" fontWeight="extrabold">
                                                ₹{property.price}
                                            </Text>
                                            <Text fontSize="sm" ml={1} fontWeight="medium">
                                                / month
                                            </Text>
                                        </Flex>
                                    </Box>

                                    <CardBody p={5} minHeight="230px"> 
                                        <VStack align="stretch" spacing={3}>
                                            {/* Title & Type Badge */}
                                            <HStack justify="space-between" align="center">
                                                <Heading size="md" noOfLines={1} color="gray.800" fontWeight="semibold">
                                                    {capitalizedTitle} 
                                                </Heading>
                                                <Badge colorScheme="blue" variant="solid" borderRadius="full" px={3} py={1} fontSize="xs">
                                                    {capitalizedType || "N/A"} 
                                                </Badge>
                                            </HStack>

                                            {/* Location */}
                                            <HStack color="gray.600" fontSize="sm">
                                                <Icon as={MdLocationOn} color="blue.500" boxSize={4}/>
                                                <Text fontWeight="medium" noOfLines={1}>
                                                    {capitalizedLocation || "Location Pending"} 
                                                </Text>
                                            </HStack>
                                            
                                            {/* Rooms and Beds Count */}
                                            <HStack spacing={4} color="gray.600" fontSize="sm" pt={1}>
                                                {/* Rooms (using 'bedrooms') */}
                                                <HStack>
                                                    <Icon as={MdApartment} color="blue.500" boxSize={4}/>
                                                    <Text fontWeight="bold">
                                                        {capitalizedType === 'Apartment' ? 'Bedrooms:' : 'Rooms:'}
                                                    </Text>
                                                    <Text fontWeight="medium">{numRooms}</Text>
                                                </HStack>
                                                
                                                {/* Beds (using 'maxOccupancy') */}
                                                <HStack>
                                                    <Icon as={MdKingBed} color="blue.500" boxSize={4}/> 
                                                    <Text fontWeight="bold">Beds:</Text>
                                                    <Text fontWeight="medium">{numBeds}</Text>
                                                </HStack>
                                            </HStack>
                                            
                                            {/* Rating */}
                                            <HStack spacing={2} align="center" borderBottom="1px solid" borderColor="gray.100" pb={3}>
                                                <StarRating
                                                    rating={avgRating}
                                                    readOnly
                                                    size="md"
                                                />
                                                <Text fontSize="sm" fontWeight="bold" color="blue.600">
                                                    {avgRating.toFixed(1)} / 5
                                                </Text>
                                                <Text fontSize="sm" color="gray.500">
                                                    ({property.numReviews || 0} Ratings)
                                                </Text>
                                            </HStack>

                                            {/* Description */}
                                            <Text fontSize="sm" color="gray.500" noOfLines={3} minH="40px" pt={2}>
                                                {property.description
                                                    ? truncate(capitalizeFirstLetter(property.description), 90) 
                                                    : "A well-maintained property offering comfortable living space."}
                                            </Text>
                                            
                                            {/* Amenities (Features) */}
                                            <Box pt={1}>
                                                <Text fontWeight="semibold" fontSize="xs" color="gray.700" mb={1}>Key Features:</Text>
                                                <Wrap spacing={1}>
                                                    {(property.amenities || []) 
                                                            .slice(0, 3) 
                                                            .map((amenity, index) => (
                                                                <WrapItem key={index}>
                                                                    <Tag 
                                                                        size="sm" 
                                                                        variant="subtle" 
                                                                        colorScheme="green" 
                                                                        fontWeight="medium"
                                                                        borderRadius="full"
                                                                    >
                                                                        {capitalizeFirstLetter(amenity)}
                                                                    </Tag>
                                                                </WrapItem>
                                                            ))}
                                                    {(property.amenities || []).length > 3 && (
                                                        <WrapItem>
                                                            <Tag 
                                                                size="sm" 
                                                                variant="subtle" 
                                                                colorScheme="gray" 
                                                                fontWeight="medium"
                                                                borderRadius="full"
                                                            >
                                                                +{(property.amenities.length - 3)} more
                                                            </Tag>
                                                        </WrapItem>
                                                    )}
                                                    {(property.amenities || []).length === 0 && (
                                                        <Text fontSize="xs" color="gray.400" fontStyle="italic">No features listed.</Text>
                                                    )}
                                                </Wrap>
                                            </Box>
                                        </VStack>
                                    </CardBody>

                                    <CardFooter pt={0} pb={4} px={5}>
                                        <Button
                                            colorScheme="blue"
                                            variant="solid" 
                                            w="full"
                                            rightIcon={<Icon as={MdChevronRight} />}
                                            fontWeight="bold"
                                            size="lg" 
                                            _hover={{ bg: 'blue.700' }}
                                            onClick={(e) => {
                                                e.stopPropagation(); 
                                                navigate(`/properties/${property._id}`);
                                            }}
                                        >
                                            View Property Details
                                        </Button>
                                    </CardFooter>
                                </Box>
                            );
                        })}
                    </SimpleGrid>

                    {/* Pagination */}
                    <Pagination
                        totalItems={totalItems}
                        itemsPerPage={propertiesPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}
        </Box>
    );
};

export default PropertyList;