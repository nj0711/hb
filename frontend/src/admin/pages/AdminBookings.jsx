import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Container,
  Heading,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/admin/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error.response?.data?.message || 'Failed to fetch bookings');
      toast({
        title: 'Error fetching bookings',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await axios.put(`/api/admin/bookings/${bookingId}/status`, { status: newStatus });
      toast({
        title: 'Booking status updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error updating booking status',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      await axios.delete(`/api/admin/bookings/${bookingId}`);
      toast({
        title: 'Booking deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: 'Error deleting booking',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'confirmed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
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
    <Container maxW="container.xl" py={10}>
      <Box>
        <Heading mb={6}>Manage Bookings</Heading>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Property</Th>
              <Th>Client</Th>
              <Th>Owner</Th>
              <Th>Start Date</Th>
              <Th>End Date</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {bookings.map((booking) => (
              <Tr key={booking._id}>
                <Td>{booking.property?.name}</Td>
                <Td>{booking.client?.name}</Td>
                <Td>{booking.owner?.name}</Td>
                <Td>{new Date(booking.startDate).toLocaleDateString()}</Td>
                <Td>{new Date(booking.endDate).toLocaleDateString()}</Td>
                <Td>₹{booking.totalAmount}</Td>
                <Td>
                  <Select
                    value={booking.status}
                    onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </Td>
                <Td>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => handleDeleteBooking(booking._id)}
                  >
                    Delete 
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
    
  );
};

export default AdminBookings; 