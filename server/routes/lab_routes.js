const express = require('express');
const router = express.Router();


// API Route to Fetch All Buildings
router.get('/', async (req, res) => {
    try {
        const buildings = await Lab.find({name});
        res.json(buildings);
    } catch (error) {
        console.error('Error fetching buildings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
