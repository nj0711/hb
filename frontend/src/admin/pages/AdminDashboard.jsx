import {
    Box,
    Flex,
    Heading,
    Icon,
    SimpleGrid,
    SkeletonText,
    Spinner,
    Stat,
    StatLabel,
    StatNumber,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import {
    MdCalendarMonth,
    MdDashboard,
    MdGroup,
    MdListAlt,
    MdLocationOn,
    MdOutlineApartment,
    MdOutlineEventAvailable
} from "react-icons/md";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// NOTE: Placeholder components
import BookingHistory from "./BookingHistory";
import PropertyManagementWithFilters from "./PropertyManagementWithFilters";


// --- HELPER FUNCTION: Capitalizes first letter of each word (No change) ---
const capitalizeFirstLetterOfEachWord = (string) => {
    if (!string) return '';
    return String(string).toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

// --- Data Processing Function (No change) ---
const processAnalyticsData = (allBookings, allUsers, allProperties) => {
    
    // 1. Booking Status Data (for Pie Chart)
    const bookingStatusMap = allBookings.reduce((acc, booking) => {
        const status = booking.status ? booking.status.toLowerCase() : 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const bookingStatusData = [
        { name: 'Confirmed', value: bookingStatusMap.confirmed || 0, color: '#38A169' }, 
        { name: 'Pending', value: bookingStatusMap.pending || 0, color: '#F6AD55' },    
        { name: 'Cancelled', value: bookingStatusMap.cancelled || 0, color: '#E53E3E' }, 
        { name: 'Unknown', value: bookingStatusMap.unknown || 0, color: '#A0AEC0' }, 
    ].filter(d => d.value > 0); 


    // 2. Monthly User Registration Data (for Line Chart - keeping last 6 mos)
    const monthlyUsersMap = allUsers.reduce((acc, user) => {
        const date = new Date(user.createdAt);
        if (!isNaN(date)) {
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
    }, {});

    let monthlyUsersData = Object.keys(monthlyUsersMap).map(key => {
        const [year, month] = key.split('-');
        const readableMonth = new Date(year, month - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
        return {
            month: readableMonth,
            sortKey: key, 
            users: monthlyUsersMap[key],
        };
    }).sort((a, b) => a.sortKey.localeCompare(b.sortKey)); 

    monthlyUsersData = monthlyUsersData.slice(-6);

    // 3. Properties by Location Data (for Vertical Bar Chart - keeping top 5 location)
    const propertiesByLocationMap = allProperties.reduce((acc, property) => {
        const location = property.location ? capitalizeFirstLetterOfEachWord(property.location) : 'Unknown Location';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
    }, {});

    const propertiesByLocationData = Object.keys(propertiesByLocationMap)
        .map(location => ({
            location: location,
            count: propertiesByLocationMap[location],
        }))
        .sort((a, b) => b.count - a.count) // Sort by count descending
        .slice(0, 5); // Show top 5 locations

    return { bookingStatusData, monthlyUsersData, propertiesByLocationData };
};
// --------------------------------------------------------------------------------


// --- Custom Component for Admin Stats Card (No change) ---
const AdminStatCard = ({ icon, label, number, colorScheme }) => (
    <Stat
        p={5}
        bg="white"
        shadow="md"
        borderLeft="4px solid"
        borderColor={`${colorScheme}.500`}
        borderRadius="lg"
        transition="transform 0.2s, box-shadow 0.2s"
        _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
    >
        <Flex justifyContent="space-between" alignItems="center">
            <Box>
                <StatLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.500"
                    textTransform="uppercase"
                >
                    {label}
                </StatLabel>
                <StatNumber fontSize="3xl" fontWeight="extrabold" color="gray.900">
                    {number}
                </StatNumber>
            </Box>
            <Icon as={icon} w={8} h={8} color={`${colorScheme}.500`} opacity={0.7} />
        </Flex>
    </Stat>
);
// --------------------------------------------------------------------------------


// --- CHART COMPONENT 1: Booking Status Pie Chart (No functional change) ---
const BookingStatusChart = ({ data }) => (
    <Box p={6} bg="white" borderRadius="lg" shadow="md" h="400px">
        <Heading size="md" mb={4} color="gray.700">Booking Status Distribution</Heading>
        <ResponsiveContainer width="100%" height="80%">
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : null}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            </PieChart>
        </ResponsiveContainer>
    </Box>
);
// --------------------------------------------------------------------------------


// --- CHART COMPONENT 2: Monthly User Registration LINE Chart (PROFESSIONAL BLUE) ---
const MonthlyUsersChart = ({ data }) => (
    <Box p={6} bg="white" borderRadius="lg" shadow="md" h="400px">
        <Heading size="md" mb={4} color="gray.700">Monthly User Registrations (Last 6 Mos)</Heading>
        <ResponsiveContainer width="100%" height="80%">
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /> {/* Lighter grid */}
                <XAxis dataKey="month" stroke="#718096" /> {/* Darker axis labels */}
                <YAxis allowDecimals={false} stroke="#718096" />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#3182CE" // Professional Blue
                    name="New Users" 
                    strokeWidth={3}
                    dot={{ fill: '#3182CE', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#3182CE' }}
                />
            </LineChart>
        </ResponsiveContainer>
    </Box>
);
// --------------------------------------------------------------------------------


// --- CHART COMPONENT 3: Properties by Location Vertical Bar Chart (HIGH CONTRAST RED) ---
const PropertiesByLocationChart = ({ data }) => (
    <Box p={6} bg="white" borderRadius="lg" shadow="md" h="400px">
        <Flex align="center" mb={4}>
            <Icon as={MdLocationOn} w={5} h={5} color="gray.500" mr={2}/>
            <Heading size="md" color="gray.700">Top 5 Property Locations</Heading>
        </Flex>
        <ResponsiveContainer width="100%" height="80%">
            <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /> {/* Lighter grid */}
                <XAxis dataKey="location" angle={-15} textAnchor="end" height={50} interval={0} stroke="#718096" />
                <YAxis allowDecimals={false} stroke="#718096" />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar 
                    dataKey="count" 
                    fill="#34971eff" // High Contrast Red/Crimson
                    name="Property Count" 
                    radius={[5, 5, 0, 0]} 
                />
            </BarChart>
        </ResponsiveContainer>
    </Box>
);
// --------------------------------------------------------------------------------


const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalUsers: 0,
        totalBookings: 0,
    });
    const [allProperties, setAllProperties] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    const [bookingStatusData, setBookingStatusData] = useState([]);
    const [monthlyUsersData, setMonthlyUsersData] = useState([]);
    const [propertiesByLocationData, setPropertiesByLocationData] = useState([]); 

    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Design variables for the management tabs
    const tabContainerBg = useColorModeValue("white", "gray.800"); 
    const borderColor = useColorModeValue("gray.100", "gray.700");


    useEffect(() => {
        const fetchDataAndProcess = async () => {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }
            
            try {
                // 1. Fetch all raw data using existing endpoints
                const [propertiesRes, usersRes, bookingsRes] = await Promise.all([
                    axios.get("/api/properties/admin", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/admin/bookings", { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                const properties = propertiesRes.data || [];
                const users = usersRes.data || [];
                const bookings = bookingsRes.data || [];
                
                // 2. Update core statistics
                setStats({
                    totalProperties: properties.length,
                    totalUsers: users.length,
                    totalBookings: bookings.length,
                });

                // 3. Store raw lists
                setAllProperties(properties);
                setAllBookings(bookings);
                setAllUsers(users);

                // 4. Process the raw lists for chart data (No change to logic)
                const { bookingStatusData, monthlyUsersData, propertiesByLocationData } = processAnalyticsData(bookings, users, properties);

                // 5. Update chart data state
                setBookingStatusData(bookingStatusData);
                setMonthlyUsersData(monthlyUsersData);
                setPropertiesByLocationData(propertiesByLocationData); 

            } catch (error) {
                console.error("Error fetching and processing dashboard data:", error);
                toast({
                    title: "Error",
                    description: "Failed to fetch dashboard data.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        }
        fetchDataAndProcess();
    }, []);


    // --- Data Preparation for Child Components (Capitalization) ---
    const capitalizedUsers = allUsers.map(user => ({
        ...user,
        name: capitalizeFirstLetterOfEachWord(user.name),
    }));

    const capitalizedProperties = allProperties.map(property => ({
        ...property,
        name: capitalizeFirstLetterOfEachWord(property.name),
        location: capitalizeFirstLetterOfEachWord(property.location),
    }));

    const capitalizedBookings = allBookings.map(booking => ({
        ...booking,
        property: booking.property ? {
            ...booking.property,
            name: capitalizeFirstLetterOfEachWord(booking.property.name),
        } : null,
        user: booking.user ? {
            ...booking.user,
            name: capitalizeFirstLetterOfEachWord(booking.user.name),
        } : null,
    }));
    // -------------------------------------------------------------


    // Unified Loading State with Skeletons
    if (loading) {
        return (
            <Box p={{ base: 4, md: 10 }} minH="100vh" bg="gray.50">
                <Box bg="white" p={6} borderRadius="lg" mb={8} shadow="sm">
                    <SkeletonText noOfLines={1} spacing='4' skeletonHeight='8' mb={6} />
                </Box>
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6} mb={10}>
                    {[1, 2, 3].map((i) => (
                        <Box key={i} p={6} bg="white" shadow="md" borderRadius="lg">
                            <SkeletonText noOfLines={2} spacing='4' />
                        </Box>
                    ))}
                </SimpleGrid>
                {/* Adjusting skeleton for 3 charts */}
                <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6} mb={12}>
                     {[1, 2, 3].map((i) => (
                        <Box key={i} p={6} bg="white" shadow="md" borderRadius="lg" h="400px">
                            <SkeletonText noOfLines={1} spacing='4' skeletonHeight='5' mb={8} />
                            <Spinner size="lg" color="blue.500" />
                        </Box>
                    ))}
                </SimpleGrid>
                <Box bg="white" p={6} borderRadius="lg" shadow="xl">
                    <SkeletonText noOfLines={10} spacing='4' />
                </Box>
            </Box>
        );
    }

    return (
        <Box p={{ base: 4, md: 10 }} minH="100vh" bg="gray.50">

            {/* --- 1. Structured Page Header --- */}
            <Box
                bg="white"
                p={6}
                borderRadius="lg"
                mb={8}
                shadow="lg"
                borderBottom="3px solid"
                borderColor="blue.100"
            >
                <Flex align="center">
                    <Icon as={MdDashboard} w={8} h={8} color="blue.500" mr={3} />
                    <Heading
                        fontSize={{ base: "2xl", md: "3xl" }}
                        color="gray.800"
                        fontWeight="bold"
                    >
                        Admin Dashboard
                    </Heading>
                </Flex>
                <Box color="gray.500" mt={2} ml={10}>
                    <Text fontSize="sm">Overview of platform statistics and management tools.</Text>
                </Box>
            </Box>
            
            {/* --- 2. Statistics Cards Grid --- */}
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6} mb={12}>
                <AdminStatCard
                    icon={MdOutlineApartment}
                    label="Total Properties"
                    number={stats.totalProperties}
                    colorScheme="teal"
                />
                <AdminStatCard
                    icon={MdGroup}
                    label="Registered Users"
                    number={stats.totalUsers}
                    colorScheme="blue"
                />
                <AdminStatCard
                    icon={MdOutlineEventAvailable}
                    label="Total Bookings"
                    number={stats.totalBookings}
                    colorScheme="orange"
                />
            </SimpleGrid>

            {/* --- 3. Charts Grid (Professionally styled) --- */}
            <Heading size="lg" mb={6} color="gray.700">Platform Analytics</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6} mb={12}>
                <BookingStatusChart data={bookingStatusData} />
                <MonthlyUsersChart data={monthlyUsersData} /> {/* Professional Blue Line Chart */}
                <PropertiesByLocationChart data={propertiesByLocationData} /> {/* High Contrast Red Bar Chart */}
            </SimpleGrid>
            {/* ------------------------------------------------------------------- */}


            {/* --- 4. Main Content Tabs (Unchanged Design) --- */}
            <Box
                bg={tabContainerBg}
                p={{ base: 4, md: 8 }}
                borderRadius="xl"
                shadow="xl"
                border="1px solid"
                borderColor={borderColor}
            >
                <Heading size="lg" mb={4} color="gray.800">
                    Content Management
                </Heading>

                {/* Retaining the soft-rounded variant for a cleaner look */}
                <Tabs variant="soft-rounded" colorScheme="blue" mt={6}> 
                    <TabList mb={4}>
                        <Tab 
                            fontWeight="bold" 
                            fontSize="md" 
                            borderRadius="full"
                            leftIcon={<MdListAlt />}
                        >
                            Property Management
                        </Tab>
                        <Tab 
                            fontWeight="bold" 
                            fontSize="md"
                            borderRadius="full"
                            leftIcon={<MdCalendarMonth />}
                        >
                            Booking History
                        </Tab>
                    </TabList>

                    <Box 
                        bg={useColorModeValue("white", "gray.700")} 
                        p={{ base: 2, md: 4 }} 
                        borderRadius="lg" 
                        border="1px solid" 
                        borderColor={borderColor}
                    >
                        <TabPanels>
                            <TabPanel px={0} py={4}>
                                <PropertyManagementWithFilters properties={capitalizedProperties} /> 
                                <Text color="gray.500" fontSize="sm" mt={4} fontStyle="italic">
                                    Managing all platform properties. Property names and locations are capitalized.
                                </Text>
                            </TabPanel>
                            <TabPanel px={0} py={4}>
                                <BookingHistory bookings={capitalizedBookings} users={capitalizedUsers} />
                                <Text color="gray.500" fontSize="sm" mt={4} fontStyle="italic">
                                    Reviewing booking records. User and Property names are capitalized.
                                </Text>
                            </TabPanel>
                        </TabPanels>
                    </Box>
                </Tabs>
            </Box>
            {/* ------------------------------------------------ */}

        </Box>
    );
};

export default AdminDashboard;