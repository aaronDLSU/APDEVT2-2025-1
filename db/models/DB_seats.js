const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema({
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true }, // Reference to the Lab
    seatNumber: { type: Number, required: true }, // Unique seat number in the lab
    createdAt: { type: Date, default: Date.now }
});

// Ensure unique seat numbers within the same lab
SeatSchema.index({ lab: 1, seatNumber: 1 }, { unique: true });

const Seat = mongoose.model('Seat', SeatSchema);
module.exports = Seat;
