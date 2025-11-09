import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    title: {
        type: String,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['PG', 'Hostel', 'Apartment'],
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    location: {
        type: String,
        required: true,
    },

    bedrooms: {
        type: Number,
        default: 1, // Default to 1 bedroom if not specified
        min: 0,
    },
    maxOccupancy: { // Maximum number of people allowed
        type: Number,
        default: 1, // Default to 1 person capacity
        min: 1,
    },

    amenities: {
        type: [String],
        default: [],
    },
    rules: {
        type: String,
    },
    images: {
        type: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            },
        ],
        default: [],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['available', 'rejected'],
        default: 'available',
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
});

const Property = mongoose.model('Property', propertySchema);

export default Property;