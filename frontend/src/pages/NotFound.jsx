import { Box, Button, Flex, Heading, Icon, Text, VStack } from '@chakra-ui/react';
import { Home, OctagonX } from 'lucide-react'; // Import relevant icons
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    // IMPROVEMENT 1: Use Flex to take full height and center content (inheriting App.jsx scroll fix)
    <Flex
      minH="100%" // Occupy full height of the parent container from App.jsx
      w="100%"
      align="center"
      justify="center"
      bg="gray.50" // Light background for contrast
    >
      <Box 
        textAlign="center" 
        p={{ base: 8, md: 16 }} 
        maxW="lg" 
        bg="white" 
        borderRadius="xl" 
        boxShadow="xl"
      >
        <VStack spacing={4}>
          {/* IMPROVEMENT 2: Large, distinct icon for visual impact */}
          <Icon 
            as={OctagonX} 
            w={24} 
            h={24} 
            color="red.400" 
            mb={4} 
          />

          {/* IMPROVEMENT 3: Enhanced 404 styling */}
          <Heading
            as="h1"
            size="4xl"
            fontWeight="extrabold"
            color="gray.700"
            mb={2}
          >
            404
          </Heading>

          <Heading
            as="h2"
            size="xl"
            fontWeight="semibold"
            color="red.500"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Page Not Found
          </Heading>
          
          <Text color="gray.600" fontSize="lg" maxW="400px" pt={2} pb={4}>
            We can't seem to find the page you're looking for. It might have been moved or deleted.
          </Text>

          {/* IMPROVEMENT 4: Enhanced Button Style */}
          <Button
            colorScheme="red" // Use a bolder color scheme
            size="lg"
            leftIcon={<Icon as={Home} boxSize={5} />}
            onClick={() => navigate('/')}
            borderRadius="lg"
            mt={4}
            boxShadow="md"
            _hover={{ boxShadow: 'lg', bg: 'red.600' }}
          >
            Go to Home
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
};

export default NotFound;