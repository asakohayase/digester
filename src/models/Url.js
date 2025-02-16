import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Url', urlSchema);
