const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    name: { type: String, required: true }, //default name: "Reservation {number}"
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },    // User who booked
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },      // Lab room
    seat: { type : Number, required: true },
    date: { type: Date, required: true },                                           // Booking date
    startTime: { type: String, required: true }, 
    endTime: { type: String, required: true }, 
    status: { 
            type: String, 
            enum: ['pending', 'approved', 'rejected', 'cancelled'], 
            default: 'approved' },
    createdAt: { type: Date, default: Date.now }
});

const Reservation = mongoose.model('Reservation', ReservationSchema);
module.exports = Reservation;