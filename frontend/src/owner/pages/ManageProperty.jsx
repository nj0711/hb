// frontend/src/owner/pages/ManageProperty.jsx

import {
    CheckIcon,
    CloseIcon,
    DeleteIcon,
    EditIcon,
} from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Container,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    IconButton,
    Image,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Select,
    SimpleGrid,
    Spinner,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Textarea,
    Tooltip,
    useDisclosure,
    useToast,
    VStack
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import {
    FaClipboardList,
    FaExclamationTriangle,
    FaHome,
    FaImage,
    FaInfoCircle,
    FaMapMarkerAlt,
    FaMoneyBillAlt,
    FaTrash
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

// Helper component for read-only details - Now accepts isCapitalized prop
const DetailItem = ({ icon, label, value, isCapitalized = false, ...props }) => (
    <HStack align="flex-start" spacing={3} p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200" {...props}>
        <Box as={icon} color="blue.500" w={4} h={4} mt={1} flexShrink={0} />
        <VStack align="flex-start" spacing={0} maxW="100%">
            <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase">
                {label}
            </Text>
            <Text 
                fontWeight="semibold" 
                fontSize="sm" 
                color="gray.800" 
                isTruncated
                // Apply capitalization
                textTransform={isCapitalized ? "capitalize" : "none"}
            >
                {value || "Not provided"}
            </Text>
        </VStack>
    </HStack>
);

const ManageProperty = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const editModal = useDisclosure();
    const deleteModal = useDisclosure();

    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);

    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
        type: "",
        price: 0,
        location: "",
        amenities: "",
        rules: "",
    });

    const [newImages, setNewImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    useEffect(() => {
        fetchProperty();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchProperty = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`/api/property-owner/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = response.data;

            setProperty(data);
            setEditForm({
                name: data.name || "",
                description: data.description || "",
                type: data.type || "PG",
                price: data.price || 0,
                location:
                    typeof data.location === "string"
                        ? data.location
                        : data.location?.city || "",
                amenities: data.amenities?.join(", ") || "",
                rules: data.rules || "",
            });
            setExistingImages(data.images || []);
        } catch (error) {
            toast({
                title: "Error fetching property",
                description: error.response?.data?.message || "Something went wrong",
                status: "error",
            });
             if (error.response?.status === 404 || error.response?.status === 403) {
                navigate("/owner");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Utility Functions (Kept) ---

    const validateForm = () => {
        if (!editForm.name || editForm.name.length < 3) return "Name must be at least 3 characters.";
        if (!editForm.description || editForm.description.length < 10) return "Description must be at least 10 characters.";
        if (!editForm.type) return "Select property type.";
        if (!editForm.price || isNaN(editForm.price) || Number(editForm.price) <= 0) return "Price must be a positive number.";
        if (!editForm.location || editForm.location.length < 3) return "Location must be at least 3 characters.";
        return null;
    };

    const handleImageChange = (e) => {
        setNewImages([...newImages, ...Array.from(e.target.files)]);
        e.target.value = null;
    };

    const removeNewImage = (index) => setNewImages(newImages.filter((_, i) => i !== index));

    const removeExistingImage = (index) => setExistingImages(existingImages.filter((_, i) => i !== index));

    // --- Update/Delete Handlers (Kept) ---

    const handleUpdate = async (e) => {
        e.preventDefault();
        const errorMsg = validateForm();
        if (errorMsg) {
            toast({ title: "Validation Error", description: errorMsg, status: "error" });
            setTabIndex(0);
            return;
        }

        if (existingImages.length + newImages.length < 1) {
            toast({ title: "Image Required", description: "You must have at least one image for the property.", status: "error" });
            setTabIndex(1);
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();

            formData.append("name", editForm.name);
            formData.append("description", editForm.description);
            formData.append("type", editForm.type);
            formData.append("price", editForm.price);
            formData.append("location", editForm.location);
            formData.append("rules", editForm.rules);

            const amenitiesArray = editForm.amenities.split(",").map((a) => a.trim()).filter((a) => a);
            formData.append("amenities", JSON.stringify(amenitiesArray));
            formData.append("existingImages", JSON.stringify(existingImages));
            newImages.forEach((img) => formData.append("images", img));

            await axios.put(`/api/property-owner/properties/${id}`, formData, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
            });

            toast({ title: "Property updated successfully! 🎉", status: "success" });
            await fetchProperty();
            editModal.onClose();
            setNewImages([]);
            setTabIndex(0);
        } catch (error) {
            toast({
                title: "Error updating property",
                description: error.response?.data?.message || "Something went wrong",
                status: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`/api/property-owner/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast({ title: "Property deleted successfully.", status: "success" });
            deleteModal.onClose();
            navigate("/owner");
        } catch (error) {
            toast({
                title: "Error deleting property",
                description: error.response?.data?.message || "Something went wrong",
                status: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render ---

    if (loading) return (
        <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text ml={3} fontSize="xl">Loading Property Details...</Text>
        </Flex>
    );

    if (!property) return (
        <Text fontSize="xl" textAlign="center" mt={10} color="red.500">Property not found or access denied.</Text>
    );

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                {/* Header and Actions - Applied textTransform here */}
                <HStack justify="space-between" align="center" pb={2}>
                    <Heading 
                        size="xl" 
                        color="blue.700" 
                        textTransform="capitalize" // <-- Property Name Capitalized
                    >
                        {property.name}
                    </Heading>
                    <HStack spacing={3}>
                        <Button colorScheme="blue" onClick={editModal.onOpen} leftIcon={<EditIcon />} size="md">
                            Edit Property
                        </Button>
                        <Tooltip label="Permanently delete this property" hasArrow>
                            <Button colorScheme="red" onClick={deleteModal.onOpen} leftIcon={<DeleteIcon />} size="md">
                                Delete
                            </Button>
                        </Tooltip>
                    </HStack>
                </HStack>

                {/* Property Details Grid - Applied isCapitalized prop */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <DetailItem icon={FaHome} label="Type" value={property.type} isCapitalized />
                    <DetailItem icon={FaMoneyBillAlt} label="Price" value={`₹${property.price} / month`} />
                    <DetailItem icon={FaMapMarkerAlt} label="Location" value={property.location} isCapitalized />
                </SimpleGrid>

                {/* Main Content Cards (Unchanged from last version) */}
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
                    <VStack spacing={6} gridColumn={{ base: "span 1", lg: "span 2" }} align="stretch">
                        <Card shadow="lg" borderRadius="lg">
                            <CardHeader bg="gray.50">
                                <Heading size="md" color="blue.700">Description & Rules</Heading>
                            </CardHeader>
                            <CardBody>
                                <VStack align="stretch" spacing={6}>
                                    <Box>
                                        <Heading size="sm" mb={2} color="gray.600">Description</Heading>
                                        <Text whiteSpace="pre-wrap" bg="blue.50" p={3} borderRadius="md">{property.description}</Text>
                                    </Box>
                                    <Box>
                                        <Heading size="sm" mb={2} color="gray.600">House Rules</Heading>
                                        <Text whiteSpace="pre-wrap" bg="blue.50" p={3} borderRadius="md">{property.rules || "No special rules specified."}</Text>
                                    </Box>
                                </VStack>
                            </CardBody>
                        </Card>

                        <Card shadow="lg" borderRadius="lg">
                            <CardHeader bg="gray.50">
                                <Heading size="md" color="blue.700">Amenities</Heading>
                            </CardHeader>
                            <CardBody>
                                <HStack spacing={2} wrap="wrap">
                                    {property.amenities?.length > 0 ? (
                                        property.amenities.map((amenity, i) => (
                                            <Badge key={i} colorScheme="teal" variant="solid" p={2} borderRadius="md">
                                                {amenity}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Text color="gray.500">No amenities listed.</Text>
                                    )}
                                </HStack>
                            </CardBody>
                        </Card>
                    </VStack>

                    <Card shadow="lg" borderRadius="lg">
                        <CardHeader bg="gray.50">
                            <Heading size="md" color="blue.700">Images ({property.images?.length || 0})</Heading>
                        </CardHeader>
                        <CardBody>
                            <SimpleGrid columns={2} spacing={3}>
                                {property.images?.map((img, i) => (
                                    <Image
                                        key={i}
                                        src={img?.url || "https://via.placeholder.com/150?text=No+Image"}
                                        alt={`Property Image ${i + 1}`}
                                        boxSize="100%"
                                        maxH="150px"
                                        objectFit="cover"
                                        borderRadius="md"
                                        shadow="sm"
                                    />
                                ))}
                            </SimpleGrid>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Edit Modal with Tabs (Unchanged from last version, except for the fix to the modal close button import) */}
                <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="3xl" scrollBehavior="inside">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader bg="blue.500" color="white" borderTopRadius="md">
                            <HStack spacing={2}>
                                <EditIcon /> <Text>Editing: {property.name}</Text>
                            </HStack>
                        </ModalHeader>
                        <ModalCloseButton color="white" />
                        <form onSubmit={handleUpdate}>
                            <ModalBody p={6}>
                                <Tabs index={tabIndex} onChange={(index) => setTabIndex(index)} variant="enclosed-colored">
                                    <TabList>
                                        <Tab><FaInfoCircle style={{ marginRight: '8px' }} /> Details</Tab>
                                        <Tab><FaImage style={{ marginRight: '8px' }} /> Images ({existingImages.length + newImages.length})</Tab>
                                        <Tab><FaClipboardList style={{ marginRight: '8px' }} /> Rules & Amenities</Tab>
                                    </TabList>

                                    <TabPanels>
                                        {/* TAB 1: Core Details - Inputs remain as they are, capitalization is for display only */}
                                        <TabPanel>
                                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                                <FormControl isRequired>
                                                    <FormLabel>Property Name</FormLabel>
                                                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                                </FormControl>
                                                <FormControl isRequired>
                                                    <FormLabel>Property Type</FormLabel>
                                                    <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} >
                                                        <option value="PG">PG</option>
                                                        <option value="Hostel">Hostel</option>
                                                        <option value="Apartment">Apartment</option>
                                                    </Select>
                                                </FormControl>
                                                <FormControl isRequired>
                                                    <FormLabel>Price (₹/month)</FormLabel>
                                                    <NumberInput min={100} value={editForm.price} onChange={(val) => setEditForm({ ...editForm, price: val })} >
                                                        <NumberInputField />
                                                        <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                                    </NumberInput>
                                                </FormControl>
                                                <FormControl isRequired>
                                                    <FormLabel>Location / City</FormLabel>
                                                    <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                                                </FormControl>
                                            </SimpleGrid>
                                            <FormControl isRequired mt={6}>
                                                <FormLabel>Description</FormLabel>
                                                <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} minH="100px" />
                                            </FormControl>
                                        </TabPanel>

                                        {/* TAB 2: Images */}
                                        <TabPanel>
                                            <VStack spacing={4} align="stretch">
                                                <FormControl>
                                                    <FormLabel>Existing Images (Click <FaTrash style={{ display: 'inline' }} /> to remove)</FormLabel>
                                                    <SimpleGrid columns={{ base: 3, md: 5 }} spacing={3} p={2} bg="gray.50" borderRadius="md">
                                                        {existingImages.map((img, i) => (
                                                            <Box key={i} position="relative" w="full" h="80px">
                                                                <Image src={img?.url || "https://via.placeholder.com/150?text=No+Image"} borderRadius="md" objectFit="cover" w="full" h="full" />
                                                                <IconButton
                                                                    icon={<FaTrash />}
                                                                    aria-label="Remove existing image"
                                                                    size="xs"
                                                                    colorScheme="red"
                                                                    position="absolute"
                                                                    top={1}
                                                                    right={1}
                                                                    onClick={() => removeExistingImage(i)}
                                                                />
                                                            </Box>
                                                        ))}
                                                    </SimpleGrid>
                                                </FormControl>

                                                <Divider />

                                                <FormControl>
                                                    <FormLabel>Upload New Images</FormLabel>
                                                    <Input type="file" multiple accept="image/*" onChange={handleImageChange} p={2} variant="filled" />
                                                    <HStack wrap="wrap" mt={4} spacing={3}>
                                                        {newImages.map((img, i) => (
                                                            <Box key={i} position="relative" w="80px" h="80px">
                                                                <Image src={URL.createObjectURL(img)} alt="New upload preview" objectFit="cover" w="full" h="full" borderRadius="md" />
                                                                <IconButton
                                                                    icon={<CloseIcon />}
                                                                    aria-label="Remove new image"
                                                                    size="xs"
                                                                    colorScheme="red"
                                                                    position="absolute"
                                                                    top={1}
                                                                    right={1}
                                                                    onClick={() => removeNewImage(i)}
                                                                />
                                                            </Box>
                                                        ))}
                                                    </HStack>
                                                    <Text fontSize="sm" color="gray.500" mt={2}>Total Images: **{existingImages.length + newImages.length}** (Minimum 1 required)</Text>
                                                </FormControl>
                                            </VStack>
                                        </TabPanel>

                                        {/* TAB 3: Rules & Amenities */}
                                        <TabPanel>
                                            <VStack spacing={6} align="stretch">
                                                <FormControl>
                                                    <FormLabel>Amenities (comma separated list)</FormLabel>
                                                    <Textarea
                                                        value={editForm.amenities}
                                                        onChange={(e) => setEditForm({ ...editForm, amenities: e.target.value })}
                                                        placeholder="e.g., Wi-Fi, Laundry, Gym, Parking"
                                                        minH="100px"
                                                    />
                                                </FormControl>
                                                <FormControl>
                                                    <FormLabel>House Rules</FormLabel>
                                                    <Textarea
                                                        value={editForm.rules}
                                                        onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })}
                                                        placeholder="e.g., No smoking, Quiet hours after 10 PM"
                                                        minH="100px"
                                                    />
                                                </FormControl>
                                            </VStack>
                                        </TabPanel>
                                    </TabPanels>
                                </Tabs>
                            </ModalBody>

                            <ModalFooter borderTop="1px solid" borderColor="gray.100">
                                <Button variant="ghost" mr={3} onClick={editModal.onClose} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    colorScheme="blue"
                                    size="md"
                                    isLoading={isSubmitting}
                                    loadingText="Saving Changes"
                                    leftIcon={<CheckIcon />}
                                >
                                    Save All Changes
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalContent>
                </Modal>

                {/* Delete Confirmation Modal (Unchanged) */}
                <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} isCentered>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader color="red.600">
                            <HStack><FaExclamationTriangle /> <Text>Confirm Deletion</Text></HStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Alert status="warning" borderRadius="md" variant="left-accent" mb={4}>
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>Danger Zone!</AlertTitle>
                                    <AlertDescription>
                                        Are you absolutely sure you want to delete the property **{property.name}**? This action cannot be undone.
                                    </AlertDescription>
                                </Box>
                            </Alert>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" onClick={deleteModal.onClose} mr={3} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                colorScheme="red"
                                isLoading={isSubmitting}
                                loadingText="Deleting"
                                onClick={handleDelete}
                                leftIcon={<FaTrash />}
                            >
                                Delete Property
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Container>
    );
};

export default ManageProperty;