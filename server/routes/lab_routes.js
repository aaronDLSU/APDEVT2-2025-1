const express = require('express');
const router = express.Router();
const Lab = require("../../db/models/DB_labs");

// API Route to Fetch All Buildings
router.get('/', async (req, res) => {
    try {
        const { name } = req.query; // Extracting 'name' from query parameters

        let query = {};
        if (name) {
            query.name = name; // Filtering only if 'name' is provided
        }
        console.log("Query received:", query); // 🔍 Debugging

        const labs = await Lab.find(query);
        console.log("Labs fetched:", labs); // 🔍 Debugging

        res.json(labs);
        res.render('labs', { labs });  

    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;