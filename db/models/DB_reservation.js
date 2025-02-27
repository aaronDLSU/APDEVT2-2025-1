const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },    // User who booked
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },      // Lab room
    date: { type: Date, required: true },                                           // Booking date
    startTime: { type: String, required: true }, 
    endTime: { type: String, required: true }, 
    status: { 
            type: String, 
            enum: ['pending', 'approved', 'rejected', 'cancelled'], 
            default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Reservation = mongoose.model('Reservation', ReservationSchema);
module.exports = Reservation;