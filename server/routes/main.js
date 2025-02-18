const express = require('express');
const router = express.Router();

//Routes
router.get('/', (req, res) => {
    res.send('Hello World!');
});
  
router.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

module.exports = router;