const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accVisibility: { type: String, enum: ['Public', 'Private'] , default: 'Public' },
    showStats: { type: Boolean, default: false },
    showReserves: { type: Boolean, default: false },
    showBooked: { type: Boolean, default: false },
    showOngoing: { type: Boolean, default: false },
    showPrevious: { type: Boolean, default: false },
});

const Settings = mongoose.model('Setting', SettingSchema);
module.exports = Settings;