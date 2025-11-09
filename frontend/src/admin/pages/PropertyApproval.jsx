import {
  Badge,
  Box,
  Button,
  Heading,
  Image,
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
  useToast
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

const PropertyApproval = () => {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [approvedProperties, setApprovedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        axios.get('/api/properties/admin/pending'),
        axios.get('/api/properties/admin/approved')
      ]);
      setPendingProperties(pendingRes.data);
      setApprovedProperties(approvedRes.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch properties',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (propertyId) => {
    try {
      await axios.put(`/api/properties/${propertyId}/approve`);
      toast({
        title: 'Success',
        description: 'Property approved successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchProperties();
    } catch (error) {
      console.error('Error approving property:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve property',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleReject = async (propertyId) => {
    try {
      await axios.put(`/api/properties/${propertyId}/reject`);
      toast({
        title: 'Success',
        description: 'Property rejected successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchProperties();
    } catch (error) {
      console.error('Error rejecting property:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject property',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return <Box p={5}>Loading...</Box>;
  }

  return (
    <Box p={5}>
      <Heading mb={6}>Property Management</Heading>
      <Tabs>
        <TabList>
          <Tab>Pending Approval</Tab>
          <Tab>Approved Properties</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Property</Th>
                  <Th>Owner</Th>
                  <Th>Type</Th>
                  <Th>Price</Th>
                  <Th>Location</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pendingProperties.map((property) => (
                  <Tr key={property._id}>
                    <Td>
                      <Box>
                        <Image
                          src={property.images?.[0]?.url}
                          alt={property.name}
                          boxSize="100px"
                          objectFit="cover"
                        />
                        <Text mt={2}>{property.name}</Text>
                      </Box>
                    </Td>
                    <Td>{property.owner.name}</Td>
                    <Td>{property.type}</Td>
                    <Td>₹{property.price}</Td>
                    <Td>{property.location}</Td>
                    <Td>
                      <Button
                        colorScheme="green"
                        size="sm"
                        mr={2}
                        onClick={() => handleApprove(property._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleReject(property._id)}
                      >
                        Reject
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>

          <TabPanel>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Property</Th>
                  <Th>Owner</Th>
                  <Th>Type</Th>
                  <Th>Price</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {approvedProperties.map((property) => (
                  <Tr key={property._id}>
                    <Td>
                      <Box>
                        <Image
                          src={property.images?.[0]?.url}
                          alt={property.name}
                          boxSize="100px"
                          objectFit="cover"
                        />
                        <Text mt={2}>{property.name}</Text>
                      </Box>
                    </Td>
                    <Td>{property.owner.name}</Td>
                    <Td>{property.type}</Td>
                    <Td>₹{property.price}</Td>
                    <Td>{property.location}</Td>
                    <Td>
                      <Badge colorScheme="green">Approved</Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default PropertyApproval; 