// frontend/src/pages/PropertyDetails.jsx

import {
    Avatar,
    Box,
    Button,
    Card,
    Flex,
    Heading,
    HStack,
    Icon,
    Image,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    SimpleGrid,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Pagination from "../../components/Pagination";
import StarRating from "../../components/StarRating";

// LUCIDE ICON IMPORTS
import {
    Bed,
    IndianRupee,
    MapPin,
    MessageSquare,
    Quote,
    Trash2,
    User,
    Users, // Icon for Capacity
} from "lucide-react";



const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    const trimmedStr = str.trim();
    if (trimmedStr.length === 0) return '';
    return trimmedStr.charAt(0).toUpperCase() + trimmedStr.slice(1);
};

// New Utility function for names, in case the name contains multiple words
const capitalizeName = (str) => {
    if (!str) return 'Anonymous';
    return str.toLowerCase().split(' ').map(s => capitalizeFirstLetter(s)).join(' ');
}


const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);

    // Booking states
    const [isOpen, setIsOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [checkInDate, setCheckInDate] = useState("");
    const [checkOutDate, setCheckOutDate] = useState("");
    const [available, setAvailable] = useState(false);

    // Reviews states
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsPerPage = 10;

    const toast = useToast();

    useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

    const getCurrentUserId = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            const decoded = JSON.parse(atob(token.split(".")[1]));
            return decoded.userId;
        } catch {
            return null;
        }
    };

    const calculateTotalAmount = () => {
        if (!checkInDate || !checkOutDate || !property?.price) return 0;

        const date1 = new Date(checkInDate);
        const date2 = new Date(checkOutDate);
        
        const diffTime = date2.getTime() - date1.getTime();

        if (diffTime <= 0) return 0;
        
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        const nights = Math.floor(diffDays); 

        return property.price * nights;
    };

    const fetchProperty = async () => {
        try {
            const res = await axios.get(`/api/properties/${id}`);
            setProperty(res.data);
        } catch {
            toast({ title: "Error fetching property", status: "error" });
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`/api/reviews/${id}`);
            setReviews(res.data);
        } catch (err) {
            console.error("Error fetching reviews:", err);
        }
    };

    useEffect(() => {
        fetchProperty();
        fetchReviews();
    }, [id]);

    // Pagination for reviews
    const totalReviews = reviews.length;
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const currentReviews = reviews.slice(startIndex, startIndex + reviewsPerPage);

    useEffect(() => {
        setCurrentPage(1); 
    }, [reviews]);

    // Check availability
    const handleCheckAvailability = async () => {
        if (!checkInDate || !checkOutDate) {
            toast({ title: "Select both dates", status: "warning" });
            return;
        }
        
        const inDate = new Date(checkInDate);
        const outDate = new Date(checkOutDate);

        if (outDate <= inDate) {
            toast({
                title: "Invalid dates",
                description: "Check-out must be after check-in",
                status: "error",
            });
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        if (inDate < today) {
            toast({
                title: "Invalid Check-in Date",
                description: "Check-in date must be today or in the future.",
                status: "error",
            });
            return;
        }
        
        const token = localStorage.getItem("token");
        if (!token) {
            toast({ title: "Authentication required", description: "Please log in to check availability.", status: "info" });
            return;
        }

        try {
            await axios.post(
                "/api/bookings/check-availability",
                {
                    propertyId: property._id,
                    checkInDate: inDate.toISOString(),
                    checkOutDate: outDate.toISOString(),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: "Available! ", status: "success" });
            setAvailable(true);
        } catch (err) {
            toast({
                title: "Not available ",
                description: err.response?.data?.message || "Something went wrong",
                status: "error",
            });
            setAvailable(false);
        }
    };

    // Confirm booking (with mock Razorpay payment integration)
    const handleBooking = async () => {
  const totalAmount = calculateTotalAmount();

  if (!checkInDate || !checkOutDate || !available || totalAmount <= 0) {
    toast({
      title: "Invalid booking or availability check required",
      status: "error",
    });
    return;
  }

  try {
    const token = localStorage.getItem("token");

    // Step 1: Create booking
    const bookingRes = await axios.post(
      "/api/bookings",
      {
        property: id,
        checkInDate: new Date(checkInDate).toISOString(),
        checkOutDate: new Date(checkOutDate).toISOString(),
        totalAmount: totalAmount,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const bookingId = bookingRes.data._id;

    // Step 2: Create Razorpay order
    const orderRes = await axios.post(
      "/api/payment/order",
      { amount: totalAmount, bookingId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { order, key } = orderRes.data;

    // Step 3: Open Razorpay checkout
    const options = {
      key,
      amount: order.amount,
      currency: order.currency,
      name: "LodgeLink Booking",
      description: `Payment for ${property.name}`,
      order_id: order.id,
      handler: async function (response) {
        await axios.post(
          "/api/payment/verify",
          {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast({
          title: "Payment Successful",
          description: "Booking confirmed and payment verified.",
          status: "success",
        });

        navigate("/my-bookings");
      },
      theme: { color: "#3399cc" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error("Booking/payment error:", error);
    toast({
      title: "Booking failed",
      description:
        error.response?.data?.message || "Something went wrong during booking.",
      status: "error",
    });
  }
};




    // Add review
    const handleAddReview = async () => {
        if (!rating || rating < 1 || rating > 5) {
            toast({ title: "Please provide a rating (1–5)", status: "warning" });
            return;
        }
        if (!comment || comment.trim().length < 5) {
            toast({
                title: "Invalid comment",
                description: "Review must be at least 5 characters",
                status: "warning",
            });
            return;
        }
        
        const token = localStorage.getItem("token");
        if (!token) {
             toast({ title: "Login required", description: "You must be logged in to post a review.", status: "info" });
             return;
        }

        try {
            const res = await axios.post(
                "/api/reviews",
                { propertyId: id, rating, comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReviews([res.data, ...reviews]);
            setRating(0);
            setComment("");
            fetchProperty();
            toast({ title: "Review added", status: "success" });
        } catch(error) {
            toast({ 
                title: "Error adding review", 
                description: error.response?.data?.message || "Something went wrong. Have you completed a booking here?",
                status: "error" 
            });
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete your review?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`/api/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReviews(reviews.filter((r) => r._id !== reviewId));
            fetchProperty();
            toast({ title: "Review deleted", status: "success" });
        } catch {
            toast({ title: "Error deleting review", status: "error" });
        }
    };
    
    // Memoize the processed data for performance
    const displayProperty = useMemo(() => {
        if (!property) return null;
        
        // 1. Capitalize Name, Location, and Description
        const name = capitalizeFirstLetter(property.name);
        const location = capitalizeFirstLetter(property.location);
        const description = capitalizeFirstLetter(property.description);

        // 2. Capitalize each Amenity
        const amenities = property.amenities?.map(amenity => capitalizeFirstLetter(amenity)).join(", ");
        
        // 3. Get and Capitalize Owner Name
        // FIX: Use the new capitalizeName utility
        const ownerName = capitalizeName(property.owner?.name || "Unknown Owner");
        
        // FIX: Ensure rooms and capacity are passed to the display object
        const rooms = property.rooms || 0;
        const capacity = property.capacity || 1;


        return {
            ...property,
            name,
            location,
            description,
            amenities,
            ownerName,
            rooms, // Included
            capacity, // Included
        };
    }, [property]);


    if (loading) return <Text p={8}>Loading property details...</Text>;
    if (!displayProperty) return <Text p={8}>Property not found</Text>;

    const isOwner = displayProperty.owner?._id === getCurrentUserId();

    return (
        <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto">
            <VStack align="stretch" spacing={10}>
                
                {/* --- SECTION 1: Property Images & Details --- */}
                <Flex gap={8} align="flex-start" wrap={{ base: "wrap", lg: "nowrap" }}>
                    
                    {/* LEFT: Image Gallery */}
                    <Box 
                        flex="2" 
                        minW={{ base: "100%", lg: "500px" }} 
                        position="relative"
                    >
                        {displayProperty.images?.length > 0 ? (
                            <Image
                                src={displayProperty.images[0]?.url || displayProperty.images[0]}
                                alt={displayProperty.name}
                                borderRadius="xl"
                                w="100%"
                                h={{ base: "300px", md: "500px" }}
                                objectFit="cover"
                                shadow="lg"
                                fallbackSrc="https://via.placeholder.com/600x400?text=No+Image"
                            />
                        ) : (
                            <Box
                                h={{ base: "300px", md: "500px" }}
                                bg="gray.100"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                borderRadius="xl"
                            >
                                <Text color="gray.500">No Image Available</Text>
                            </Box>
                        )}
                    </Box>

                    {/* RIGHT: Details & Booking Card */}
                    <Box flex="1" minW={{ base: "100%", lg: "400px" }}>
                        <VStack align="start" spacing={5}>
                            {/* Title and Rating */}
                            <Heading size="xl" color="gray.800" fontWeight="extrabold">
                                {displayProperty.name}
                            </Heading>
                            <HStack spacing={4}>
                                <StarRating
                                    rating={displayProperty.averageRating || 0}
                                    readOnly
                                    size="lg"
                                />
                                <Text fontSize="xl" fontWeight="bold" color="blue.600">
                                    {displayProperty.averageRating?.toFixed(1) || "0.0"} / 5
                                </Text>
                                <Text color="gray.600">
                                    ({displayProperty.reviewCount || reviews.length} reviews)
                                </Text>
                            </HStack>

                            {/* Location */}
                            <HStack pt={2} align="flex-start">
                                <Icon as={MapPin} boxSize={5} color="gray.600" />
                                <Text fontSize="lg" color="gray.700">
                                    {displayProperty.location}
                                </Text>
                            </HStack>
                            
                            {/* Rooms and Capacity (Now with data from displayProperty) */}
                            <HStack spacing={8} pt={2} pb={2} wrap="wrap">
                                <HStack>
                                    <Icon as={Bed} boxSize={5} color="blue.500" />
                                    <Text fontWeight="semibold" color="gray.700">
                                        Rooms: <Text as="span" fontWeight="bold">{displayProperty.bedrooms}</Text>
                                    </Text>
                                </HStack>
                                <HStack>
                                    <Icon as={Users} boxSize={5} color="blue.500" />
                                    <Text fontWeight="semibold" color="gray.700">
                                        Max Guests: <Text as="span" fontWeight="bold">{displayProperty.maxOccupancy}</Text>
                                    </Text>
                                </HStack>
                            </HStack>

                            {/* Owner Info Card (Now with capitalized name) */}
                            <Card 
                                p={4} 
                                bg="blue.50" 
                                w="100%" 
                                shadow="sm" 
                                borderRadius="lg"
                                borderLeft="4px solid"
                                borderLeftColor="blue.500"
                            >
                                <HStack spacing={4}>
                                    <Icon as={User} boxSize={6} color="blue.600" />
                                    <VStack align="start" spacing={0}>
                                        <Text fontSize="md" color="gray.600">
                                            Property Listed By:
                                        </Text>
                                        <Text fontSize="lg" fontWeight="bold" color="gray.800">
                                            {displayProperty.ownerName}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </Card>


                            {/* Description */}
                            <Box w="100%">
                                <Text fontWeight="bold" fontSize="lg" mb={1} color="gray.800">
                                    Description
                                </Text>
                                <Text color="gray.600">{displayProperty.description}</Text>
                            </Box>

                            {/* Amenities (If Available) */}
                            {displayProperty.amenities?.length > 0 && (
                                <Box w="100%">
                                    <Text fontWeight="bold" fontSize="lg" mb={1} color="gray.800">
                                        Amenities
                                    </Text>
                                    <Text color="gray.600">{displayProperty.amenities}</Text>
                                </Box>
                            )}
                        </VStack>
                        
                        {/* Booking/Action Card - Floating Element */}
                        <Card 
                            mt={6} 
                            p={5} 
                            shadow="xl" 
                            borderRadius="xl"
                            border="1px solid"
                            borderColor="gray.200"
                            w="100%"
                        >
                            <VStack spacing={4} align="stretch">
                                {/* Price */}
                                <HStack justifyContent="center" py={1}>
                                    <Icon as={IndianRupee} boxSize={6} color="#38A169" /> 
                                    <Text fontSize="3xl" fontWeight="extrabold" color="green.600">
                                        {displayProperty.price}
                                    </Text>
                                    <Text fontSize="xl" color="gray.600">
                                        / Night
                                    </Text>
                                </HStack>
                                
                                {/* Action Buttons */}
                                {!isOwner ? (
                                    <>
                                        <Button 
                                            colorScheme="blue" 
                                            size="lg"
                                            onClick={() => setIsOpen(true)}
                                        >
                                            Check Availability & Book
                                        </Button>

                                        <Button
                                            colorScheme="blue"
                                            variant="outline"
                                            size="lg"
                                            leftIcon={<Icon as={MessageSquare} boxSize={5} />}
                                            onClick={() => navigate(`/client/chat-owner/${displayProperty._id}/${displayProperty.owner._id}`)}
                                        >
                                            Chat with Owner
                                        </Button>
                                    </>
                                ) : (
                                     <Button 
                                        colorScheme="teal" 
                                        size="lg"
                                        isDisabled
                                    >
                                        You Own This Property
                                    </Button>
                                )}
                            </VStack>
                        </Card>
                    </Box>
                </Flex>

                {/* --- SECTION 2: Add Review Form --- */}
                <Box pt={8} borderTop="1px solid" borderColor="gray.200">
                    <Heading size="lg" mb={6} display="flex" alignItems="center" color="gray.800">
                        <Icon as={Quote} boxSize={7} mr={3} color="blue.500" />
                        Share Your Experience
                    </Heading>
                    <VStack 
                        spacing={4} 
                        align="stretch" 
                        p={6} 
                        bg="gray.50" 
                        borderRadius="lg"
                    >
                        <Text fontWeight="semibold" color="gray.700">Your Rating:</Text>
                        <StarRating rating={rating} setRating={setRating} size="lg" />
                        <Input
                            placeholder="Write your review (min 5 characters)..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            size="lg"
                        />
                        <Button colorScheme="blue" size="lg" onClick={handleAddReview} w={{ base: 'full', sm: '200px' }}>
                            Submit Review
                        </Button>
                    </VStack>
                </Box>

                {/* --- SECTION 3: Reviews Section with Pagination --- */}
                <Box mt={10} pt={8} borderTop="1px solid" borderColor="gray.200">
                    <Heading size="lg" mb={6} color="gray.800">
                        Client Reviews ({totalReviews})
                    </Heading>

                    {totalReviews === 0 ? (
                        <Text color="gray.500">
                            No reviews yet. Be the first to add a review!
                        </Text>
                    ) : (
                        <>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                {currentReviews.map((rev) => (
                                    <Box
                                        key={rev._id}
                                        p={5}
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        bg="white"
                                        shadow="sm"
                                    >
                                        <Flex justify="space-between" align="flex-start" mb={3}>
                                            <HStack spacing={3}>
                                                <Avatar
                                                    // FIX: Use capitalizeName utility for client name
                                                    name={capitalizeName(rev.user?.name || "User")}
                                                    src={rev.user?.image}
                                                    size="md"
                                                />
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="bold">
                                                        {/* FIX: Use capitalizeName utility for client name */}
                                                        {capitalizeName(rev.user?.name || "Anonymous")}
                                                    </Text>
                                                    <HStack spacing={2}>
                                                        <StarRating rating={rev.rating} readOnly size="sm" />
                                                        <Text fontSize="sm" color="gray.600">
                                                            ({rev.rating} / 5)
                                                        </Text>
                                                    </HStack>
                                                </VStack>
                                            </HStack>

                                            {rev.user?._id === getCurrentUserId() && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="red"
                                                    onClick={() => handleDeleteReview(rev._id)}
                                                    leftIcon={<Icon as={Trash2} boxSize={4} />}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </Flex>
                                        
                                        <Text mt={2} fontStyle="italic" color="gray.700">
                                            "{rev.comment}"
                                        </Text>
                                        <Text fontSize="xs" color="gray.500" alignSelf="flex-end" pt={2}>
                                            Reviewed on: {new Date(rev.createdAt).toLocaleDateString()}
                                        </Text>

                                    </Box>
                                ))}
                            </SimpleGrid>

                            {/* Pagination */}
                            <Box mt={8}>
                                <Pagination
                                    totalItems={totalReviews}
                                    itemsPerPage={reviewsPerPage}
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                />
                            </Box>
                        </>
                    )}
                </Box>

                {/* --- Modals --- */}
                {/* Availability Modal */}
                <Modal isOpen={isOpen} onClose={() => {setIsOpen(false); setAvailable(false);}} isCentered>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader borderBottom="1px solid" borderColor="gray.100">Check Availability</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4}>
                                <Text fontWeight="semibold" w="full" textAlign="left">Check-in Date:</Text>
                                <Input
                                    type="date"
                                    value={checkInDate}
                                    placeholder="Select Check-in Date"
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => {
                                        setCheckInDate(e.target.value);
                                        setAvailable(false); 
                                    }}
                                />
                                <Text fontWeight="semibold" w="full" textAlign="left">Check-out Date:</Text>
                                <Input
                                    type="date"
                                    value={checkOutDate}
                                    placeholder="Select Check-out Date"
                                    min={checkInDate ? new Date(new Date(checkInDate).getTime() + 86400000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                                    onChange={(e) => {
                                        setCheckOutDate(e.target.value);
                                        setAvailable(false); 
                                    }}
                                />
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            {!available ? (
                                <Button colorScheme="blue" onClick={handleCheckAvailability} isDisabled={!checkInDate || !checkOutDate}>
                                    Check Availability
                                </Button>
                            ) : (
                                <Button colorScheme="green" onClick={() => setConfirmOpen(true)}>
                                    Book Now
                                </Button>
                            )}
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Confirmation Modal */}
                <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} isCentered>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader borderBottom="1px solid" borderColor="gray.100">Confirm Your Booking</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack align="start" spacing={3} p={2} bg="blue.50" borderRadius="md">
                                <Text>
                                    <Text as="b">Property:</Text> {displayProperty.name}
                                </Text>
                                <Text>
                                    <Text as="b">Check-in:</Text> {new Date(checkInDate).toLocaleDateString()}
                                </Text>
                                <Text>
                                    <Text as="b">Check-out:</Text> {new Date(checkOutDate).toLocaleDateString()}
                                </Text>
                                <HStack pt={2} align="center">
                                    <Text fontSize="lg" fontWeight="extrabold">Total Amount:</Text>
                                    <Text fontSize="xl" fontWeight="extrabold" color="green.600">
                                        ₹{calculateTotalAmount()}
                                    </Text>
                                </HStack>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button colorScheme="green" onClick={handleBooking} mr={3}>
                                Confirm Booking
                            </Button>
                            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Box>
    );
};

export default PropertyDetails;