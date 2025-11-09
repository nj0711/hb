// frontend/src/client/pages/OwnerDashboard.jsx

import {
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    Center,
    Container,
    Divider,
    Flex,
    Heading,
    Icon,
    SimpleGrid,
    Spinner,
    Stat,
    StatHelpText,
    StatLabel,
    StatNumber,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import {
    FaArrowDown,
    FaArrowUp,
    FaCalendarCheck,
    FaChartLine,
    // FIX: FaCheckCircle was missing from the imports list
    FaCheckCircle,
    FaDollarSign,
    FaExclamationTriangle,
    FaHome,
    FaHourglassHalf,
    FaListUl,
    FaPlus,
    FaRegLightbulb,
    FaStar
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAuth } from "../../context/AuthContext";

// Configuration (Keep this external or use .env in a real project)
axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:5000"; 

// --- Helper Function to Capitalize the First Letter of each word ---
const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return String(string).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const StatCard = ({ icon, label, number, helpText, color }) => (
    <Stat 
        p={6} 
        shadow="md" 
        borderRadius="xl"
        bg={useColorModeValue("white", "gray.700")} 
        borderLeft="4px solid"
        borderColor={color}
    >
        <Flex justifyContent="space-between">
            <Box>
                <StatLabel fontWeight="bold">{label}</StatLabel>
                <StatNumber fontSize="3xl">{number}</StatNumber>
            </Box>
            <Icon as={icon} w={10} h={10} color={color} opacity={0.6} />
        </Flex>
        <StatHelpText color="gray.500">{helpText}</StatHelpText>
    </Stat>
);

// --- NEW COMPONENT: Key Performance Indicator (KPI) Scorecard ---
const ScorecardKPI = ({ label, value, trend, icon, color, description }) => {
    const trendIcon = trend > 0 ? FaArrowUp : trend < 0 ? FaArrowDown : null;
    const trendColor = trend > 0 ? "green.500" : trend < 0 ? "red.500" : "gray.500";

    return (
        <Box 
            p={5} 
            bg={useColorModeValue("white", "gray.800")} 
            borderRadius="lg" 
            shadow="lg"
            borderBottom="3px solid"
            borderColor={color}
        >
            <Flex align="center" justify="space-between">
                <Icon as={icon} w={6} h={6} color={color} />
                <Badge 
                    colorScheme={trendIcon ? (trend > 0 ? "green" : "red") : "gray"}
                    borderRadius="full" 
                    px={3} 
                    py={1}
                >
                    {trendIcon && <Icon as={trendIcon} mr={1} />}
                    {Math.abs(trend)}%
                </Badge>
            </Flex>
            <Heading size="md" mt={2} color={useColorModeValue("gray.700", "gray.100")}>
                {label}
            </Heading>
            <Text fontSize="3xl" fontWeight="extrabold" color={color} mt={1}>
                {value}
            </Text>
            <Text fontSize="sm" color="gray.500" mt={1}>
                {description}
            </Text>
        </Box>
    );
};
// ------------------------------------------------------------------

const OwnerDashboard = () => {
    const [properties, setProperties] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    
    // Theme colors
    const cardBg = useColorModeValue("white", "gray.800");
    const gridStrokeColor = useColorModeValue("gray.200", "gray.600");
    const textColor = useColorModeValue("gray.700", "gray.100");
    const welcomeBg = "blue.600"; 

    useEffect(() => {
        if (!user?._id) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                toast({ title: "Authentication Error", description: "Please log in", status: "error" });
                navigate("/login");
                return;
            }

            const [propRes, bookingRes] = await Promise.all([
                axios.get("/api/property-owner/properties", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("/api/bookings/owner", { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            setProperties(propRes.data);
            setBookings(bookingRes.data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <Center h="100vh">
                <Spinner size="xl" color="blue.500" />
            </Center>
        );
    }

    // --- Data Calculation Logic ---
    const totalRevenue = bookings
        .filter((b) => b.status === "confirmed")
        .reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    
    const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
    const pendingBookings = bookings.filter(b => b.status === "pending").length;
    const approvalRate = properties.length > 0 
        ? Math.round((properties.filter(p => p.isApproved).length / properties.length) * 100) 
        : 0;

    // Revenue map calculation... (Unchanged)
    const revenueMap = {};
    bookings.forEach((b) => {
        if (b.status === "confirmed") {
            const date = new Date(b.checkInDate);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            revenueMap[key] = (revenueMap[key] || 0) + (b.totalAmount || 0);
        }
    });

    let revenueData = Object.keys(revenueMap).map((key) => {
        const [year, month] = key.split("-");
        return {
            month: new Date(year, month).toLocaleString("default", { month: "short", year: "numeric" }),
            sortKey: new Date(year, month).getTime(),
            revenue: revenueMap[key],
        };
    });
    revenueData = revenueData.sort((a, b) => a.sortKey - b.sortKey);

    // Monthly map calculation... (Unchanged)
    const monthlyMap = {};
    properties.forEach((p) => {
        const date = new Date(p.createdAt || Date.now());
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyMap[key]) monthlyMap[key] = { properties: 0, bookings: 0, confirmed: 0 };
        monthlyMap[key].properties += 1;
    });
    bookings.forEach((b) => {
        const date = new Date(b.checkInDate);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyMap[key]) monthlyMap[key] = { properties: 0, bookings: 0, confirmed: 0 };
        monthlyMap[key].bookings += 1;
        if (b.status === "confirmed") {
            monthlyMap[key].confirmed += 1;
        }
    });

    let monthlyData = Object.keys(monthlyMap).map((key) => {
        const [year, month] = key.split("-");
        return {
            month: new Date(year, month).toLocaleString("default", { month: "short", year: "numeric" }),
            sortKey: new Date(year, month).getTime(),
            properties: monthlyMap[key].properties,
            bookings: monthlyMap[key].bookings,
            confirmed: monthlyMap[key].confirmed,
        };
    });
    monthlyData = monthlyData.sort((a, b) => a.sortKey - b.sortKey);
    
    const topProperties = properties.slice(0, 2); 


    return (
        <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
            
            {/* 1. Hero / Welcome Banner */}
            <Box bg={welcomeBg} color="white" py={12}>
                <Container maxW="container.xl">
                    <Flex justify="space-between" align="center">
                        <VStack align="flex-start" spacing={1}>
                            <Text fontSize="md" fontWeight="semibold">OWNER DASHBOARD</Text>
                            <Heading size="xl">Welcome Back, {capitalizeFirstLetter(user?.name?.split(' ')[0]) || "Owner"}! 👋</Heading>
                            <Text fontSize="md" opacity={0.9} mt={1}>
                                Quick overview of your property portfolio and performance.
                            </Text>
                        </VStack>
                        <Button
                            leftIcon={<FaPlus />}
                            colorScheme="whiteAlpha" 
                            size="lg"
                            onClick={() => navigate("/owner/add-property")}
                        >
                            New Property
                        </Button>
                    </Flex>
                </Container>
            </Box>

            <Container maxW="container.xl" py={10}>
                <VStack spacing={10} align="stretch">
                    
                    {/* 2. Key Statistics Grid */}
                    <Heading size="lg" color={textColor} mb={4}>Key Financials</Heading>
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
                        <StatCard 
                            icon={FaHome} 
                            label="Total Properties" 
                            number={properties.length} 
                            helpText={`Status: ${properties.filter(p => p.isApproved).length} Approved`}
                            color="teal.500" 
                        />
                        <StatCard 
                            icon={FaCalendarCheck} 
                            label="Confirmed Bookings" 
                            number={confirmedBookings} 
                            helpText={`${pendingBookings} Pending Review`}
                            color="blue.500" 
                        />
                        <StatCard 
                            icon={FaDollarSign} 
                            label="Total Revenue" 
                            number={`₹${totalRevenue.toLocaleString()}`} 
                            helpText="Confirmed bookings only"
                            color="orange.500" 
                        />
                    </SimpleGrid>

                    {/* 3. Quick Actions */}
                    <Heading size="md" color={textColor} pt={4}>Quick Actions</Heading>
                    <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={4}>
                        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={() => navigate("/owner/add-property")}>
                            Add Property
                        </Button>
                        <Button leftIcon={<FaListUl />} variant="outline" colorScheme="blue" onClick={() => navigate("/owner/properties")}>
                            View Properties
                        </Button>
                        <Button leftIcon={<FaCalendarCheck />} variant="outline" colorScheme="blue" onClick={() => navigate("/owner/bookings")}>
                            View Bookings
                        </Button>
                        <Button leftIcon={<FaChartLine />} variant="outline" colorScheme="blue" onClick={() => navigate("/owner/reports")}>
                            Run Reports
                        </Button>
                    </SimpleGrid>

                    <Divider pt={4} />

                    {/* 4. Analytics Section (Scorecard KPIs + Chart) */}
                    <Heading size="lg" color={textColor}>Deep Dive Analytics</Heading>
                    <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>

                        {/* LEFT COLUMN: KPI SCORECARDS (Data without chart) */}
                        <VStack spacing={6} align="stretch" gridColumn={{ lg: 'span 1' }}>
                            <ScorecardKPI
                                label="Property Approval Rate"
                                value={`${approvalRate}%`}
                                trend={10} // Placeholder trend data
                                icon={FaCheckCircle} // This is now correctly defined
                                color="green.500"
                                description="Percentage of your properties approved by Admin."
                            />
                            <ScorecardKPI
                                label="Overall Occupancy Rate"
                                value={`~75%`}
                                trend={-5} // Placeholder trend data
                                icon={FaRegLightbulb}
                                color="purple.500"
                                description="Estimated usage rate across all listed properties."
                            />
                             <ScorecardKPI
                                label="Average Property Rating"
                                value={`4.5 / 5`}
                                trend={2} // Placeholder trend data
                                icon={FaStar}
                                color="yellow.500"
                                description="Average review score from all confirmed bookings."
                            />
                        </VStack>

                        {/* RIGHT COLUMN: Monthly Activity Bar Chart (One chart remaining) */}
                        <Box p={6} bg={cardBg} borderRadius="lg" shadow="md" gridColumn={{ lg: 'span 2' }}>
                            <Heading size="md" mb={6} color={textColor}>
                                Property & Booking Activity Trend
                            </Heading>
                            <Box w="100%" h="350px">
                                <ResponsiveContainer>
                                    <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                                        <XAxis dataKey="month" style={{ fontSize: '10px' }} stroke={textColor} />
                                        <YAxis stroke={textColor} />
                                        <Tooltip contentStyle={{ backgroundColor: cardBg, border: 'none' }} />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        <Bar dataKey="properties" fill="#F6AD55" name="New Properties" radius={[5, 5, 0, 0]} />
                                        <Bar dataKey="bookings" fill="#3182CE" name="New Bookings" radius={[5, 5, 0, 0]} />
                                        <Bar dataKey="confirmed" fill="#38A169" name="Confirmed" radius={[5, 5, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>
                    </SimpleGrid>

                    <Divider pt={4} />

                    {/* 5. Recent Bookings Table (Unchanged) */}
                    <Box p={6} bg={cardBg} borderRadius="lg" shadow="md">
                        <Flex justify="space-between" align="center" mb={4}>
                            <Heading size="lg" color={textColor}>Recent Bookings</Heading>
                            <Button size="sm" variant="link" colorScheme="blue" onClick={() => navigate("/owner/bookings")}>
                                View All ({bookings.length})
                            </Button>
                        </Flex>
                        
                        {bookings.length > 0 ? (
                            <Table variant="simple" size="md"> 
                                <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                                    <Tr>
                                        <Th color={textColor}>Property</Th>
                                        <Th color={textColor}>Check-in</Th>
                                        <Th color={textColor}>Status</Th>
                                        <Th color={textColor} isNumeric>Amount</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {bookings.slice(0, 5).map((b) => (
                                        <Tr key={b._id}>
                                            <Td fontWeight="semibold">{capitalizeFirstLetter(b.property?.name || 'N/A')}</Td> 
                                            <Td>{new Date(b.checkInDate).toLocaleDateString()}</Td>
                                            <Td>
                                                <Badge
                                                    colorScheme={
                                                         b.status === "confirmed" ? "green"
                                                         : b.status === "pending" ? "yellow"
                                                         : "red"
                                                     }
                                                     textTransform="capitalize"
                                                >
                                                     {b.status}
                                                </Badge>
                                            </Td>
                                            <Td isNumeric>₹{b.totalAmount ? b.totalAmount.toLocaleString() : '0'}</Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        ) : (
                            <Center py={8} flexDirection="column">
                                <Icon as={FaHourglassHalf} w={10} h={10} color="orange.400" mb={3} />
                                <Text color="gray.500" fontWeight="semibold">No recent bookings yet.</Text>
                                <Text color="gray.500" fontSize="sm">Time to promote your properties!</Text>
                            </Center>
                        )}
                    </Box>

                    {/* 6. Featured Properties (Unchanged) */}
                    <Box>
                        <Heading size="lg" color={textColor} mb={4}>
                            Featured Properties
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            {properties.length > 0 ? topProperties.map((p) => (
                                <Card 
                                    key={p._id} 
                                    p={0} 
                                    bg={cardBg} 
                                    shadow="xl" 
                                    borderRadius="xl"
                                    overflow="hidden"
                                    onClick={() => navigate(`/owner/properties/${p._id}/edit`)}
                                    cursor="pointer"
                                    _hover={{ transform: 'translateY(-2px)', shadow: '2xl' }}
                                    transition="0.2s"
                                >
                                    <CardBody p={6}>
                                        <Flex justify="space-between" align="flex-start">
                                            <VStack align="flex-start" spacing={1}>
                                                <Heading size="md" color={textColor}>{capitalizeFirstLetter(p.name)}</Heading> 
                                                <Text fontSize="sm" color="gray.500">{capitalizeFirstLetter(p.location)}</Text> 
                                            </VStack>
                                            <Badge 
                                                colorScheme={p.isApproved ? "green" : "yellow"} 
                                                textTransform="uppercase"
                                                fontSize="xs"
                                                px={3}
                                            >
                                                {p.isApproved ? "Approved" : "Pending Review"}
                                            </Badge>
                                        </Flex>

                                        <Divider my={3} />

                                        <Flex justify="space-between" align="center">
                                            <Badge colorScheme="blue" textTransform="capitalize">
                                                {p.type}
                                            </Badge>
                                            <Text fontWeight="extrabold" fontSize="xl" color="green.500">
                                                ₹{p.price.toLocaleString()}/<Text as="span" fontWeight="normal" fontSize="md" color="gray.500">night</Text> 
                                            </Text>
                                        </Flex>
                                    </CardBody>
                                </Card>
                            )) : (
                                <Center py={12} gridColumn={{ md: 'span 2' }} flexDirection="column" bg={useColorModeValue("white", "gray.700")} borderRadius="lg" shadow="md">
                                    <Icon as={FaExclamationTriangle} w={10} h={10} color="red.400" mb={3} />
                                    <Text fontSize="lg" fontWeight="semibold" color={textColor}>You haven't listed any properties yet.</Text>
                                    <Button mt={4} colorScheme="blue" leftIcon={<FaPlus />} onClick={() => navigate("/owner/add-property")}>
                                        List Your First Property
                                    </Button>
                                </Center>
                            )}
                        </SimpleGrid>
                        {properties.length > 2 && (
                            <Center mt={6}>
                                <Button variant="link" colorScheme="blue" onClick={() => navigate("/owner/properties")}>
                                    View All Properties
                                </Button>
                            </Center>
                        )}
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
};

export default OwnerDashboard;