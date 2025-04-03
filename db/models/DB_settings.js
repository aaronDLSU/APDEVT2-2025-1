const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accVisibility: { type: String, enum: ['Public', 'Private'] , default: 'Public' },
    showStats: { type: Boolean, default: true },
    showReserves: { type: Boolean, default: true },
    showBooked: { type: Boolean, default: true },
    showOngoing: { type: Boolean, default: true },
    showPrevious: { type: Boolean, default: true },
});

const Settings = mongoose.model('Setting', SettingSchema);
module.exports = Settings;