import { Box, Heading, HStack, Icon, Image, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import { Link } from "react-router-dom";
// Import icons for clear representation: MdApartment for Rooms, MdKingBed for Beds
import { MdApartment, MdKingBed } from "react-icons/md";
import StarRating from "./StarRating"; // Assuming this component exists

const PropertyCard = ({ property }) => {
    const cardBg = useColorModeValue("white", "gray.800");
    const hoverBorderColor = "blue.400"; // Primary blue color for hover
    const priceColor = useColorModeValue("green.600", "green.400"); // Use green for price to stand out

    // 🔑 USING ORIGINAL SCHEMA FIELDS:
    // 'bedrooms' is the Number of Rooms
    const numRooms = property.bedrooms || null; 
    // 'maxOccupancy' is the Number of Beds
    const numBeds = property.maxOccupancy || null; 
    
    // Helper to ensure 'name' is available
    const propertyName = property.name || property.title || 'Property Name';

    return (
        <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={useColorModeValue("gray.200", "gray.700")}
            borderRadius="xl"
            overflow="hidden"
            p={0}
            shadow="lg"
            transition="all 0.2s ease-in-out"
            _hover={{
                shadow: "xl",
                transform: "translateY(-2px)",
                borderColor: hoverBorderColor,
            }}
        >
            <Link to={`/properties/${property._id}`}>
                {/* --- Image Section --- */}
                <Image
                    src={property.images?.[0]?.url || 'https://via.placeholder.com/600x400?text=No+Image'}
                    alt={propertyName}
                    width="100%"
                    height="200px"
                    objectFit="cover"
                />

                {/* --- Content Section --- */}
                <Stack p={4} spacing={1}>
                    <Heading 
                        size="md" 
                        fontWeight="bold"
                        isTruncated
                        maxW="100%"
                    >
                        {propertyName}
                    </Heading>

                    {/* ⭐ Rating & Review Count */}
                    <Stack direction="row" align="center" spacing={1}>
                        <StarRating rating={property.averageRating || 0} />
                        <Text fontSize="sm" color="gray.500">
                            ({property.reviewCount || property.numReviews || 0} reviews)
                        </Text>
                    </Stack>
                    
                    {/* 🏠 Rooms and 🛏️ Beds Count (using original fields) */}
                    <HStack 
                        fontSize="md" 
                        color="gray.600" 
                        pt={1} 
                        // Only show this HStack if at least one piece of data is present
                        display={(numRooms !== null || numBeds !== null) ? 'flex' : 'none'}
                        wrap="wrap"
                        spacing={3} // Space between the Room count and Bed count
                    >
                        {/* Display Rooms (using 'bedrooms' field) */}
                        {numRooms !== null && (
                            <HStack spacing={1}>
                                <Icon as={MdApartment} color="blue.500" boxSize={4} />
                                <Text fontWeight="semibold">Rooms:</Text>
                                <Text>{numRooms}</Text>
                            </HStack>
                        )}
                        
                        {/* Display Beds (using 'maxOccupancy' field) */}
                        {numBeds !== null && (
                            <HStack spacing={1}>
                                <Icon as={MdKingBed} color="blue.500" boxSize={4} />
                                <Text fontWeight="semibold">Beds:</Text>
                                <Text>{numBeds}</Text>
                            </HStack>
                        )}
                    </HStack>
                    
                    <Text fontSize="md" color="gray.600" isTruncated>
                        {property.location}
                    </Text>

                    {/* Price */}
                    <Text fontSize="xl" fontWeight="extrabold" color={priceColor} pt={2}>
                        ${property.price}
                        <Text as="span" fontSize="sm" fontWeight="normal" color="gray.500">
                            {" "} / night
                        </Text>
                    </Text>
                </Stack>
            </Link>
        </Box>
    );
};

export default PropertyCard;