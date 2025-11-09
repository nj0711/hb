import { DeleteIcon } from '@chakra-ui/icons';
import {
    Box,
    Button,
    Container,
    Divider,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    HStack,
    Icon,
    IconButton,
    Image,
    Input,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Select,
    SimpleGrid,
    Text,
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Import additional icons from react-icons/md for better options
import { GoCheckCircleFill } from 'react-icons/go'; // Importing a clean checkmark for the toast
import { MdAddHomeWork, MdDescription, MdHomeWork, MdLocationOn, MdMonetizationOn } from 'react-icons/md';

import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';

// NOTE: Ensure your backend is running on http://localhost:5000
axios.defaults.baseURL = 'http://localhost:5000';

// =================================================================
// YUP VALIDATION SCHEMA DEFINITION 
// =================================================================
const propertySchema = yup.object({
    name: yup
        .string()
        .min(3, 'Property name must be at least 3 characters.')
        .required('Property Name is required.'),
    description: yup
        .string()
        .min(10, 'Description must be at least 10 characters.')
        .required('Description is required.'),
    type: yup
        .string()
        .oneOf(['PG', 'Hostel', 'Apartment'], 'Invalid property type selected.')
        .required('Property Type is required.'),
    
    price: yup
        .number()
        .typeError('Price must be a number.')
        .positive('Price per night must be a positive number.')
        .required('Price is required.'),
    
    location: yup
        .string()
        .min(3, 'Location must be at least 3 characters.')
        .required('Location is required.'),
    
    amenities: yup
        .string()
        .matches(/^$|^([a-zA-Z0-9\s]+,?\s*)*$/, 'Amenities must be comma-separated words (letters and numbers only).'),

    rules: yup
        .string()
        .min(5, 'Rules must be at least 5 characters.')
        .required('Rules are required.'),
    
    bedrooms: yup
        .number()
        .typeError('Rooms must be a number.')
        .integer('Rooms must be a whole number.')
        .min(1, 'Number of rooms must be at least 1.')
        .required('Number of rooms is required.'),

    maxOccupancy: yup
        .number()
        .typeError('Max occupancy must be a number.')
        .integer('Max occupancy must be a whole number.')
        .min(1, 'Max occupancy must be at least 1.')
        .required('Max occupancy is required.'),
}).required();

const AddProperty = () => {
    const [images, setImages] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [imageError, setImageError] = useState(false); 
    const navigate = useNavigate();
    const toast = useToast();
    
    const fileInputRef = useRef(null); 

    const {
        control,
        register,
        handleSubmit: hookFormHandleSubmit, 
        formState: { errors, isSubmitting: isFormSubmitting, isSubmitted, isValid }, 
    } = useForm({
        resolver: yupResolver(propertySchema),
        defaultValues: {
            name: '',
            description: '',
            type: 'PG',
            price: 100,
            location: '',
            amenities: '',
            rules: '',
            bedrooms: 1, 
            maxOccupancy: 1, 
        },
        mode: 'onChange', 
    });

    /**
     * Handles file selection for images.
     */
    const handleImageChange = (e) => {
        const newFiles = Array.from(e.target.files); 
        
        setImages((prevImages) => {
            const updatedImages = [...prevImages, ...newFiles];
            return updatedImages;
        });

        if (newFiles.length > 0) {
            setImageError(false);
        }
    };

    /**
     * Removes an image from the preview list.
     */
    const removeImage = (index) => {
        setImages((prevImages) => {
            const newImages = prevImages.filter((_, i) => i !== index);
            
            if (newImages.length === 0 && fileInputRef.current) {
                fileInputRef.current.value = null;
                if (isSubmitted) { 
                    setImageError(true);
                }
            }
            return newImages;
        });
    };

    /**
     * Handles the form submission logic.
     */
    const onSubmit = async (data) => {
        if (images.length === 0) {
            setImageError(true);
            toast({
                title: 'Image Required',
                description: 'Please upload at least one property image.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
                position: 'top',
            });
            return; 
        }

        setIsLoading(true);
        setImageError(false); 
        
        try {
            const formDataToSend = new FormData();
            
            // Append all RHF data fields
            Object.keys(data).forEach((key) => {
                if (['price', 'bedrooms', 'maxOccupancy'].includes(key)) {
                     formDataToSend.append(key, Number(data[key]));
                } else {
                     formDataToSend.append(key, data[key]);
                }
            });

            // Append images
            images.forEach((image) => {
                formDataToSend.append('images', image);
            });

            const response = await axios.post(
                '/api/properties', 
                formDataToSend,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`, 
                    },
                    withCredentials: true,
                }
            );

            if (response.data) {
                toast({
                    title: 'Success!',
                    // 💥 REPLACED EMOJI with an explicit icon (no change in text)
                    description: 'Property listing added successfully', 
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                    position: 'top', 
                    // Add an icon to the toast for better visual feedback
                    icon: <Icon as={GoCheckCircleFill} color="green.500" />,
                });
                navigate('/owner/properties'); 
            }
        } catch (error) {
            const status = error.response?.status;
            let message = 'An unknown error occurred.';

            if (status) {
                if (status >= 500) {
                    message = error.response?.data?.message || 'A critical server error occurred (5xx).';
                } else if (status >= 400) {
                    message = error.response?.data?.message || 'Invalid request data (4xx).';
                }
            } else {
                 message = 'Could not connect to the server. Please check your connection.';
            }

            toast({
                title: 'Submission Failed',
                description: message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const isSubmittingCombined = isLoading || isFormSubmitting;
    
    // Check for combined validation error state for the image field
    const imageInputError = imageError || (isSubmitted && images.length === 0);

    return (
        <Container maxW="container.lg" py={{ base: 6, md: 10 }}>
            <VStack 
                spacing={8} 
                align="stretch" 
                p={{ base: 4, md: 10 }}
                bg="white"
                borderRadius="2xl"
                boxShadow="xl"
                border="1px solid"
                borderColor="gray.100"
            >
                <Heading 
                    size="xl" 
                    color="blue.600" 
                    pb={2}
                    fontWeight="extrabold"
                    letterSpacing="tight"
                >
                    {/* 💥 REPLACED EMOJI with an Icon component */}
                    <Icon as={MdAddHomeWork} mr={3} color="blue.600" w={7} h={7} verticalAlign="middle" />
                    Add New Property Listing
                </Heading>
                <Text color="gray.600" fontSize="lg">
                    Enter the details for your new listing. Fields marked with an asterisk are required.
                </Text>

                <Divider borderColor="blue.100" />

                <form onSubmit={hookFormHandleSubmit(onSubmit)}>
                    <VStack spacing={8}>
                        
                        {/* 1. Basic Details */}
                        <Box w="full">
                             <Heading size="md" mb={4} color="gray.700" fontWeight="bold">
                                 <Icon as={MdDescription} mr={2} color="blue.500" />
                                 Listing Info
                             </Heading>
                            <VStack spacing={6}>
                                
                                {/* Property Name */}
                                <FormControl isRequired isInvalid={errors.name}>
                                    <FormLabel fontWeight="bold">Property Name</FormLabel>
                                    <Input
                                        {...register('name')}
                                        placeholder="e.g., Green Valley PG, Liberty Apartment"
                                        size="lg"
                                        variant="filled"
                                        bg="gray.50"
                                    />
                                    <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                                </FormControl>

                                {/* Description */}
                                <FormControl isRequired isInvalid={errors.description}>
                                    <FormLabel fontWeight="bold">Description</FormLabel>
                                    <Textarea
                                        {...register('description')}
                                        placeholder="Describe the property, neighborhood, and main selling points."
                                        rows={4}
                                        variant="filled"
                                        bg="gray.50"
                                    />
                                    <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
                                </FormControl>
                            </VStack>
                        </Box>
                        
                        <Divider borderColor="gray.200" />

                        {/* 2. Pricing and Key Metrics (rest of the fields are here) */}
                        <Box w="full">
                             <Heading size="md" mb={4} color="gray.700" fontWeight="bold">
                                 <Icon as={MdMonetizationOn} mr={2} color="blue.500" />
                                 Pricing & Capacity
                             </Heading>
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
                                
                                <FormControl isRequired isInvalid={errors.price}>
                                    <FormLabel fontWeight="bold">Price (₹/night)</FormLabel>
                                    <Controller
                                        name="price"
                                        control={control}
                                        render={({ field }) => (
                                            <NumberInput
                                                {...field}
                                                onChange={(val) => field.onChange(val)}
                                                min={1}
                                                clampValueOnBlur={false}
                                                size="lg"
                                            >
                                                <NumberInputField placeholder="Min 1" />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        )}
                                    />
                                    <FormErrorMessage>{errors.price?.message}</FormErrorMessage>
                                </FormControl>
                                
                                <FormControl isRequired isInvalid={errors.bedrooms}>
                                    <FormLabel fontWeight="bold">Rooms/Bedrooms</FormLabel>
                                    <Controller
                                        name="bedrooms"
                                        control={control}
                                        render={({ field }) => (
                                            <NumberInput
                                                {...field}
                                                onChange={(val) => field.onChange(val)}
                                                min={1}
                                                clampValueOnBlur={false}
                                                size="lg"
                                            >
                                                <NumberInputField placeholder="e.g., 2" />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        )}
                                    />
                                    <FormErrorMessage>{errors.bedrooms?.message}</FormErrorMessage>
                                    <Text fontSize="sm" color="gray.500" mt={1}>For PG/Hostel: total rooms.</Text>
                                </FormControl>

                                <FormControl isRequired isInvalid={errors.maxOccupancy}>
                                    <FormLabel fontWeight="bold">Max Occupancy / Beds</FormLabel>
                                    <Controller
                                        name="maxOccupancy"
                                        control={control}
                                        render={({ field }) => (
                                            <NumberInput
                                                {...field}
                                                onChange={(val) => field.onChange(val)}
                                                min={1}
                                                clampValueOnBlur={false}
                                                size="lg"
                                            >
                                                <NumberInputField placeholder="e.g., 6" />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        )}
                                    />
                                    <FormErrorMessage>{errors.maxOccupancy?.message}</FormErrorMessage>
                                    <Text fontSize="sm" color="gray.500" mt={1}>Maximum number of residents.</Text>
                                </FormControl>
                            </SimpleGrid>
                        </Box>

                        <Divider borderColor="gray.200" />
                        
                        {/* 3. Location and Type */}
                        <Box w="full">
                             <Heading size="md" mb={4} color="gray.700" fontWeight="bold">
                                 <Icon as={MdLocationOn} mr={2} color="blue.500" />
                                 Address & Type
                             </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                                
                                <FormControl isRequired isInvalid={errors.type}>
                                    <FormLabel fontWeight="bold">Property Type</FormLabel>
                                    <Select
                                        {...register('type')}
                                        size="lg"
                                        borderColor="blue.300"
                                    >
                                        <option value="PG">PG (Paying Guest)</option>
                                        <option value="Hostel">Hostel</option>
                                        <option value="Apartment">Apartment</option>
                                    </Select>
                                    <FormErrorMessage>{errors.type?.message}</FormErrorMessage>
                                </FormControl>
                                
                                <FormControl isRequired isInvalid={errors.location}>
                                    <FormLabel fontWeight="bold">Location (City/Area)</FormLabel>
                                    <Input
                                        {...register('location')}
                                        placeholder="e.g., Velachery, Chennai"
                                        size="lg"
                                        variant="filled"
                                        bg="gray.50"
                                    />
                                    <FormErrorMessage>{errors.location?.message}</FormErrorMessage>
                                </FormControl>
                            </SimpleGrid>
                        </Box>
                        
                        <Divider borderColor="gray.200" />
                        
                        {/* 4. Amenities and Rules */}
                        <Box w="full">
                             <Heading size="md" mb={4} color="gray.700" fontWeight="bold">
                                 <Icon as={MdHomeWork} mr={2} color="blue.500" />
                                 Features & Guidelines
                             </Heading>
                            <VStack spacing={6}>
                                <FormControl isInvalid={errors.amenities}>
                                    <FormLabel fontWeight="bold">Amenities (comma-separated)</FormLabel>
                                    <Input
                                        {...register('amenities')}
                                        placeholder="e.g., WiFi, AC, Parking, Laundry"
                                        size="lg"
                                        variant="filled"
                                        bg="gray.50"
                                    />
                                    <FormErrorMessage>{errors.amenities?.message}</FormErrorMessage>
                                    <Text fontSize="sm" color="gray.500" mt={1}>Separate features with commas (e.g., WiFi, AC).</Text>
                                </FormControl>

                                <FormControl isRequired isInvalid={errors.rules}>
                                    <FormLabel fontWeight="bold">Rules</FormLabel>
                                    <Textarea
                                        {...register('rules')}
                                        placeholder="e.g., No smoking, Quiet hours after 10 PM."
                                        rows={3}
                                        variant="filled"
                                        bg="gray.50"
                                    />
                                    <FormErrorMessage>{errors.rules?.message}</FormErrorMessage>
                                </FormControl>
                            </VStack>
                        </Box>
                        
                        <Divider borderColor="gray.200" />

                        {/* 5. Image Upload and Preview */}
                        <FormControl 
                            isRequired 
                            isInvalid={imageInputError} 
                        >
                            <FormLabel fontWeight="bold">Property Images (Min 1)</FormLabel>
                            <Input
                                type="file"
                                multiple
                                p={1} 
                                accept="image/*"
                                onChange={handleImageChange}
                                ref={fileInputRef} 
                                border="1px solid"
                                borderColor="gray.300"
                                borderRadius="md"
                                sx={{
                                    borderColor: imageInputError ? 'red.500' : 'gray.300',
                                    ':focus': {
                                        boxShadow: imageInputError ? '0 0 0 1px #E53E3E' : 'auto',
                                    },
                                }}
                            />
                            
                            {imageInputError && (
                                <FormErrorMessage mt={2}>At least one property image is required.</FormErrorMessage>
                            )}
                            
                            <HStack mt={4} spacing={4} wrap="wrap">
                                {images.map((image, index) => (
                                    <Box key={index} position="relative" w="100px" h="100px">
                                        <Image
                                            src={URL.createObjectURL(image)}
                                            alt={`Preview ${index + 1}`}
                                            boxSize="100%"
                                            objectFit="cover"
                                            borderRadius="lg"
                                            border="2px solid"
                                            borderColor="blue.400"
                                        />
                                        <IconButton
                                            icon={<DeleteIcon />}
                                            size="xs"
                                            colorScheme="red"
                                            variant="solid"
                                            position="absolute"
                                            top={-2}
                                            right={-2}
                                            borderRadius="full"
                                            onClick={() => removeImage(index)}
                                            aria-label={`Remove image ${index + 1}`}
                                            boxShadow="md"
                                        />
                                    </Box>
                                ))}
                            </HStack>
                        </FormControl>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            colorScheme="blue"
                            isLoading={isSubmittingCombined}
                            loadingText="Adding Property..."
                            width="full"
                            size="lg"
                            mt={8}
                            py={7}
                            fontSize="xl"
                            fontWeight="extrabold"
                        >
                            Submit Property Listing
                        </Button>
                    </VStack>
                </form>
            </VStack>
        </Container>
    );
};

export default AddProperty;