const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Building name
    address: { type: String, required: true }, // Address of the building
    isActive: { type: Boolean, default: true }, // If the building is in use
    labs: [LabSchema], // List of labs in the building
    createdAt: { type: Date, default: Date.now }
});

const Building = mongoose.model('Building', BuildingSchema);
module.exports = Building;