import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Center,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  Button,
  Icon,
  Divider,
  Image,
  Tag,
  Card,
  CardBody,
  useToast,
} from "@chakra-ui/react";
import {
  MdFilterList,
  MdSearch,
  MdClear,
  MdLocationOn,
  MdCalendarToday,
  MdAccountBalanceWallet,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../../components/Pagination"; 

// 🔧 Helpers
const toTitleCase = (str) =>
  str ? str.replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.substr(1).toLowerCase()) : "";

const capitalizeFirstLetter = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const getStatusColorScheme = (status) => {
  switch (status) {
    case "pending":
      return "orange";
    case "confirmed":
      return "green";
    case "cancelled":
      return "red";
    default:
      return "gray";
  }
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    paymentStatus: "all",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const toast = useToast();
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/bookings/client", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data);
      setFiltered(res.data);
    } catch (err) {
      toast({
        title: "Error fetching bookings",
        description:
          err.response?.data?.message ||
          "Failed to retrieve your booking history.",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const normalizeDate = (d) => {
    if (!d) return null;
    const nd = new Date(d);
    return new Date(nd.getFullYear(), nd.getMonth(), nd.getDate());
  };

  useEffect(() => {
    let data = [...bookings];
    const {
      search,
      status,
      paymentStatus,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = filters;

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (b) =>
          b.property?.name?.toLowerCase().includes(q) ||
          b.property?.location?.toLowerCase().includes(q)
      );
    }

    if (status !== "all") {
      data = data.filter((b) => b.status === status);
    }

    if (paymentStatus !== "all") {
      data = data.filter((b) => b.paymentStatus === paymentStatus);
    }

    if (startDate) {
      const start = normalizeDate(startDate);
      data = data.filter((b) => normalizeDate(b.checkInDate) >= start);
    }

    if (endDate) {
      const end = normalizeDate(endDate);
      data = data.filter((b) => normalizeDate(b.checkOutDate) <= end);
    }

    if (minAmount) {
      data = data.filter((b) => b.totalAmount >= Number(minAmount));
    }

    if (maxAmount) {
      data = data.filter((b) => b.totalAmount <= Number(maxAmount));
    }

    setFiltered(data);
    setCurrentPage(1);
  }, [filters, bookings]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = filtered.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleCancel = async (booking) => {
    const checkIn = new Date(booking.checkInDate);
    const diffDays = (checkIn - new Date()) / (1000 * 60 * 60 * 24);

    if (booking.status !== "pending") {
      toast({
        title: "Only pending bookings can be cancelled",
        status: "error",
      });
      return;
    }
    if (diffDays < 2) {
      toast({
        title: "Too late to cancel",
        description:
          "Cancellations are only allowed at least 2 days before check-in",
        status: "error",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/bookings/${booking._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: "Booking cancelled successfully",
        status: "success",
      });
      fetchBookings();
    } catch (err) {
      toast({
        title: "Cancellation Failed",
        description:
          err.response?.data?.message ||
          "An unexpected error occurred during cancellation.",
        status: "error",
      });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      paymentStatus: "all",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
    });
  };

  if (loading) {
    return (
      <Center h="70vh">
        <Spinner size="xl" color="blue.600" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto">
      <Heading
        mb={2}
        fontSize={{ base: "3xl", md: "4xl" }}
        fontWeight="extrabold"
        color="gray.800"
      >
        My Reservations
      </Heading>
      <Text mb={6} fontSize="lg" color="gray.600" fontWeight="medium">
        <Text
          as="strong"
          color="gray.800"
          fontWeight="extrabold"
          display="inline"
        >
          {filtered.length}
        </Text>{" "}
        results found.
      </Text>

      {/* --- Filter Bar --- */}
      <VStack
        spacing={4}
        align="stretch"
        mb={8}
        p={{ base: 4, md: 5 }}
        bg="white"
        borderRadius="xl"
        boxShadow="lg"
        border="1px solid"
        borderColor="gray.200"
      >
        <HStack align="center" spacing={3} pb={1}>
          <Icon as={MdFilterList} color="blue.600" boxSize={6} />
          <Text fontSize="lg" fontWeight="bold" color="blue.700">
            Refine Search
          </Text>
        </HStack>

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
          {/* Search */}
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              Property Search
            </Text>
            <InputGroup w="full">
              <InputLeftElement pointerEvents="none">
                <Icon as={MdSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Name or location"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                variant="outline"
                borderColor="gray.300"
              />
            </InputGroup>
          </VStack>

          {/* Booking Status */}
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              Booking Status
            </Text>
            <Select
              w="full"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              variant="outline"
              borderColor="gray.300"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </VStack>

          {/* Payment Status */}
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              Payment Status
            </Text>
            <Select
              w="full"
              value={filters.paymentStatus}
              onChange={(e) =>
                setFilters({ ...filters, paymentStatus: e.target.value })
              }
              variant="outline"
              borderColor="gray.300"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </Select>
          </VStack>

          {/* Date Range */}
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              Reservation Dates
            </Text>
            <HStack w="full">
              <Input
                placeholder="Check-in From"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                variant="outline"
                borderColor="gray.300"
              />
              <Input
                placeholder="Check-out By"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                variant="outline"
                borderColor="gray.300"
              />
            </HStack>
          </VStack>
        </SimpleGrid>

        <Flex justify="flex-end">
          <Button
            onClick={handleClearFilters}
            colorScheme="red"
            variant="ghost"
            size="md"
            leftIcon={<Icon as={MdClear} />}
          >
            Clear All Filters
          </Button>
        </Flex>
      </VStack>

      {/* --- Booking Grid --- */}
      {filtered.length === 0 ? (
        <Center py={10} bg="gray.50" borderRadius="lg" boxShadow="md">
          <VStack spacing={3}>
            <Heading size="lg" color="gray.500">
              No Bookings Found
            </Heading>
            <Text>Your search returned no results. Try clearing filters.</Text>
          </VStack>
        </Center>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 1, lg: 2 }} spacing={6}>
            {currentBookings.map((booking) => {
              const checkIn = new Date(booking.checkInDate);
              const checkOut = new Date(booking.checkOutDate);
              const diffDays = (checkIn - new Date()) / (1000 * 60 * 60 * 24);
              const canCancel =
                booking.status !== "cancelled" && diffDays >= 2;

              const imgSrc =
                booking.property?.images?.[0]?.url ||
                booking.property?.images?.[0] ||
                null;

              return (
                <Card
                  key={booking._id}
                  shadow="lg"
                  borderRadius="xl"
                  overflow="hidden"
                  direction={{ base: "column", sm: "row" }}
                  border="1px solid"
                  borderColor="gray.200"
                  transition="box-shadow 0.3s"
                  _hover={{ shadow: "xl" }}
                >
                  {/* Image */}
                  <Box
                    flexShrink={0}
                    w={{ base: "100%", sm: "180px" }}
                    h={{ base: "180px", sm: "full" }}
                  >
                    <Image
                      src={imgSrc}
                      alt={booking.property?.name || "Property"}
                      objectFit="cover"
                      w="100%"
                      h="100%"
                      fallbackSrc="https://via.placeholder.com/300x300?text=NO+IMAGE"
                    />
                  </Box>

                  {/* Body */}
                  <CardBody p={5} flexGrow={1}>
                    <VStack align="stretch" spacing={3}>
                      {/* Title + Status */}
                      <HStack justify="space-between" align="flex-start">
                        <Heading size="md" color="gray.800" noOfLines={1}>
                          {toTitleCase(
                            booking.property?.name || "Untitled Property"
                          )}
                        </Heading>
                        <Tag
                          colorScheme={getStatusColorScheme(booking.status)}
                          variant="solid"
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {capitalizeFirstLetter(booking.status)}
                        </Tag>
                      </HStack>

                      {/* Payment Status */}
                      <Tag
                        size="sm"
                        colorScheme={
                          booking.paymentStatus === "paid"
                            ? "green"
                            : "orange"
                        }
                        variant="subtle"
                        alignSelf="flex-start"
                      >
                        Payment:{" "}
                        {capitalizeFirstLetter(
                          booking.paymentStatus || "pending"
                        )}
                      </Tag>

                      {/* Location */}
                      <HStack color="gray.600" fontSize="sm">
                        <Icon as={MdLocationOn} color="blue.500" />
                        <Text>
                          {toTitleCase(
                            booking.property?.location || "Location Unknown"
                          )}
                        </Text>
                      </HStack>

                      <Divider />

                      {/* Dates */}
                      <SimpleGrid columns={2} spacing={2} fontSize="sm">
                        <VStack align="start" spacing={0}>
                          <Text
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="xs"
                          >
                            Check-in
                          </Text>
                          <HStack spacing={1}>
                            <Icon
                              as={MdCalendarToday}
                              boxSize={3.5}
                              color="gray.500"
                            />
                            <Text>{checkIn.toLocaleDateString()}</Text>
                          </HStack>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="xs"
                          >
                            Check-out
                          </Text>
                          <HStack spacing={1}>
                            <Icon
                              as={MdCalendarToday}
                              boxSize={3.5}
                              color="gray.500"
                            />
                            <Text>{checkOut.toLocaleDateString()}</Text>
                          </HStack>
                        </VStack>
                      </SimpleGrid>

                      <Divider />

                      {/* Amount + Actions */}
                      <Flex justify="space-between" align="center">
                        <VStack align="start" spacing={0}>
                          <Text
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="xs"
                          >
                            Total Cost
                          </Text>
                          <HStack spacing={1}>
                            <Icon
                              as={MdAccountBalanceWallet}
                              boxSize={5}
                              color="green.600"
                            />
                            <Text
                              fontSize="xl"
                              color="green.600"
                              fontWeight="extrabold"
                            >
                              ₹{booking.totalAmount}
                            </Text>
                          </HStack>
                        </VStack>

                        <HStack spacing={2}>
                          {canCancel && (
                            <Button
                              colorScheme="red"
                              size="md"
                              onClick={() => handleCancel(booking)}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            colorScheme="blue"
                            size="md"
                            variant="outline"
                            onClick={() =>
                              navigate(`/properties/${booking.property?._id}`)
                            }
                          >
                            Details
                          </Button>
                        </HStack>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>

          <Pagination
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}
    </Box>
  );
};

export default MyBookings;
