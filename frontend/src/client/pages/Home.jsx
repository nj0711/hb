// frontend/src/client/pages/Home.jsx
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  SimpleGrid,
  Text,
  VStack
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  Quote,
  Search,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  Zap
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const MotionBox = motion(Box);

const features = [
  {
    title: "Affordable Choices",
    text: "Rooms, hostels, and apartments for every budget.",
    icon: Wallet,
  },
  {
    title: "Verified Owners",
    text: "Every property is verified so you can book with confidence.",
    icon: ShieldCheck,
  },
  {
    title: "Instant Booking",
    text: "Book instantly with secure payments and quick confirmation.",
    icon: Zap,
  },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [city, setCity] = useState("");

  const handleSearch = (e) => {
  e.preventDefault();
  navigate("/properties", { state: { city } });
};


  return (
    <Box>
      {/* Hero Section */}
      <Box position="relative" h={{ base: "85vh", md: "91vh" }}>
        <Image
  src="https://plus.unsplash.com/premium_photo-1693493439354-0c64d4a49d67?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8aW5kaWFuJTIwaG9tZXxlbnwwfHwwfHx8MA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000"
  alt="Flatmates together or Indian apartment exterior"
  objectFit="cover"
  w="100%"
  h="100%"
  position="absolute"
  top="0"
  left="0"
  zIndex="-1"
/>

        {/* Overlay */}
        <Box
          bgGradient="linear(to-b, rgba(0,0,0,0.6), rgba(0,0,0,0.5))"
          w="100%"
          h="100%"
          position="absolute"
          top="0"
          left="0"
        />
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="100%"
          textAlign="center"
          px={4}
          color="white"
          position="relative"
        >
          <Heading
            size={{ base: "3xl", md: "4xl" }}
            mb={4}
            fontWeight="extrabold"
          >
            Find Your Perfect Stay
          </Heading>
          <Text fontSize={{ base: "lg", md: "xl" }} mb={10} maxW="700px">
            Affordable rooms, family homes, and rental properties across India
            for students, professionals, and families.
          </Text>

          {/* Search */}
          <MotionBox
  as="form"
  onSubmit={handleSearch}
  mt={4}
  w={{ base: "95%", md: "70%", lg: "50%" }}
  shadow="xl"
  borderRadius="full"
  overflow="hidden"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
>
  <Flex bg="white" align="center" px={4} py={2}>
    <Input
      placeholder="Search by city or area (e.g., Delhi, Pune, Chennai)"
      value={city}
      onChange={(e) => setCity(e.target.value)}
      border="none"
      _focus={{ boxShadow: "none" }}
      color="gray.700"
      fontSize="md"
    />
    <Button
      type="submit"
      bg="blue.500"
      color="white"
      borderRadius="full"
      px={4}
      _hover={{ bg: "blue.600" }}
    >
      <Icon as={Search} w={5} h={5} />
    </Button>
  </Flex>
</MotionBox>


          {/* CTA Buttons */}
{!user && (
  <HStack spacing={6} mt={8}>
    <Button
      as={Link}
      to="/login"
      variant="outline"
      colorScheme="whiteAlpha"
      size="lg"
    >
      Login
    </Button>
    <Button 
      as={Link} 
      to="/register" 
      colorScheme="blue" 
      size="lg" 
      fontWeight="bold"
    >
      Register Now
    </Button>
  </HStack>
)}

        </Flex>
      </Box>

      {/* Features */}
      <Box py={16} bg="gray.50">
        <Container maxW="container.xl">
          <Heading textAlign="center" mb={12} size="xl" color="gray.800">
            Why Choose LodgeLink?
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {features.map((f, i) => (
              <VStack
                key={i}
                p={8}
                bg="white"
                borderRadius="xl"
                shadow="lg"
                spacing={4}
                align="center"
                borderTop="4px solid"
                borderColor="blue.400"
              >
                <Icon as={f.icon} w={12} h={12} color="blue.500" />
                <Heading size="md" color="gray.700">
                  {f.title}
                </Heading>
                <Text color="gray.600" textAlign="center">
                  {f.text}
                </Text>
              </VStack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Testimonials */}
<Box py={20} bg="white">
  <Container maxW="container.xl">
    <Heading textAlign="center" mb={12} size="xl" color="gray.800">
       <Icon as={Quote} mr={3} color="blue.500" boxSize={8} /> 
      What Our Clients Say 
    </Heading>
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10}>
      {[
        {
          text: "The easiest way to find affordable student housing. Booked my hostel room in Bangalore in less than 5 minutes!",
          name: "Anjali M.",
          city: "Bengaluru",
        },
        {
          text: "Managing my property listings and bookings is seamless. The platform generates instant leads and verified clients. Highly recommend.",
          name: "Rajesh K.",
          city: "Property Owner, Delhi",
        },
      ].map((testimonial, index) => (
        <MotionBox
          key={index}
          p={8}
          bg="blue.50"
          borderRadius="xl"
          shadow="md"
          initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          {/* Stars with deeper gold color */}
          <HStack color="#FFD700" mb={4}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star key={idx} fill="#FFD700" size={22} />
            ))}
          </HStack>

          <Text fontSize="lg" fontStyle="italic" mb={4}>
            "{testimonial.text}"
          </Text>
          <Text fontWeight="bold" color="blue.600">
            {testimonial.name}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {testimonial.city}
          </Text>
        </MotionBox>
      ))}
    </SimpleGrid>
  </Container>
</Box>


      {/* Community Matching */}
      <Box py={20} bg="gray.50">
        <Container maxW="container.xl">
          <Flex direction={{ base: "column", md: "row" }} align="center" gap={10}>
            <Box flex="1">
              <Heading mb={4} size="xl">
                Community Matching
              </Heading>
              <Text color="gray.600" mb={6} fontSize="lg">
                When you book a property, discover others also interested in the
                same place. Perfect for students, professionals, or families
                looking for flatmates.
              </Text>
              <Button colorScheme="blue" size="lg" rightIcon={<Users size={20} />}>
                Join Community
              </Button>
            </Box>
            <Box flex="1">
              <Image
                src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80"
                alt="Flatmates together"
                borderRadius="xl"
                shadow="lg"
                w="100%"
                h="100%"
                objectFit="cover"
              />
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* CTA */}
<Box py={20} bg="blue.600">
  <Container maxW="container.xl" textAlign="center" color="white">
    <Heading mb={4} size="2xl">
      Start Your Search Today
    </Heading>
    <Text mb={8} fontSize="xl" opacity="0.9">
      Sign up now and explore affordable lodging services across India.
    </Text>
    {!user ? (
      <HStack justify="center" spacing={6}>
        <Button
          as={Link}
          to="/register"
          colorScheme="blue"
          size="lg"
          fontWeight="bold"
          bg="white"
          color="blue.600"
          _hover={{ bg: "gray.100" }}
        >
          Get Started
        </Button>
        <Button
          as={Link}
          to="/login"
          variant="outline"
          colorScheme="whiteAlpha"
          size="lg"
        >
          Login
        </Button>
      </HStack>
    ) : (
      <Button
        as={Link}
        to="/properties"
        colorScheme="blue"
        size="lg"
        fontWeight="bold"
        bg="white"
        color="blue.600"
        _hover={{ bg: "gray.100" }}
      >
        Browse Properties
      </Button>
    )}
  </Container>
</Box>

    </Box>
  );
};

export default Home;
