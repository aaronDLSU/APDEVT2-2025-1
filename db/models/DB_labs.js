const mongoose = require('mongoose');

const LabSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    building: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true }, 
    availability: { type: Boolean, default: true }, 
    status: { 
        type: String, 
        enum: ['available', 'booked', 'under_maintenance', 'closed'], 
        default: 'available' 
    },
    createdAt: { type: Date, default: Date.now }
});

const Lab = mongoose.model('Lab', LabSchema);
module.exports = Lab;