const express = require('express');
const router = express.Router();

// Add model routes here
const User = require("../../db/models/DB_users");
const Reservation = require("../../db/models/DB_reservation");
const Lab = require("../../db/models/DB_labs");

// Sample user roles
const student = { name: "Charlie", type: "student", description: "I am a first-year Computer Science major at De La Salle University (DLSU), specializing in Software Technology. Passionate about coding and problem-solving, I am eager to explore new technologies and develop innovative solutions. Currently honing my skills in programming, web development, and algorithms, I aspire to contribute to impactful projects in the tech industry." };
const labtech = { name: "Sir", type: "labtech", description: "i am a lab technician"};
let user = ''; // Stores the current logged-in user

// Homepage Route
router.get('/', (req, res) => {
    res.render('homepage', {
        title: "Homepage",
        pageStyle: "homepage",
        pageScripts: ["header-dropdowns"], // Scripts needed for this page
        user,
        labtech: user.type === 'labtech',
        student: user.type === 'student'
    });
});


// Signup/Login Page
router.get('/signup-login', (req, res) => {
    res.render('signup-login', {
        title: "Signup | Login",
        pageStyle: "login-signup",
        pageScripts: ["login-signup"], // Scripts needed for login page
        layout: "signup-login"
    });
});

// Handle User Signup
router.post('/signup', async (req, res) => {
    try {
        // Extract form data from request
        const { 'signup-email': email, 'signup-password': password, 'signup-role': role } = req.body;
        
        // Create new user in MongoDB
        await User.create({
            email: email,
            password: password,
            role: role});
        res.redirect('/signup-login'); // Redirect back to login page
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).send('Error creating user');
    }
});

// Handle User Login
router.post('/login', express.urlencoded({ extended: true }), (req, res) => {
    const { 'email-input': email, 'password-input': password } = req.body;

    // Validate input
    if (!email || !password) return res.status(400).send("Missing credentials");

    // Simulated login (replace this with database authentication later)
    if (email === 'student@dlsu.edu.ph' && password === 'student') {
        user = student;
        res.redirect('/');
    } else if (email === 'labtech@dlsu.edu.ph' && password === 'labtech') {
        user = labtech;
        res.redirect('/');
    } else {
        res.send('Invalid Credentials. <p style="color:blue; text-decoration: underline; display:inline-block" onclick="history.back()">Try Again</p>');
    }
});

// Calendar Page (Lab Reservations)
router.get('/calendar', (req, res) => {
    res.render('calendar', {
        title: "Reserve your lab room!",
        pageStyle: "calendar",
        pageScripts: ["header-dropdowns", "calendar"], // Include scripts for calendar functionality
        user,
        labtech: user.type === 'labtech',
        student: user.type === 'student'
    });
});

// Help & Support Page
router.get('/help-support', (req, res) => {
    res.render('help-support', {
        title: "Help & Support",
        pageStyle: "help-support",
        pageScripts: ["header-dropdowns"],
        user,
        labtech: user.type === 'labtech',
        student: user.type === 'student'
    });
});

// User Profile Page
router.get('/profile', (req, res) => {
    res.render('profile', {
        title: "Profile Page",
        pageStyle: "profile",
        pageScripts: ["header-dropdowns"],
        user,
        labtech: user.type === 'labtech',
        student: user.type === 'student'
    });
});

// edit profile Page
router.get('/edit-profile', (req, res) => {
    res.render('edit-profile', {
        title: "Edit Profile",
        pageStyle: "edit-profile",
        pageScripts: ["header-dropdowns"],
        user,
        labtech: user.type === 'labtech',
        student: user.type === 'student'
    });
});

// manage account Page
router.get('/manage-account', (req, res) => {
    res.render('manage-account', {
        title: "Manage Account",
        pageStyle: "manage-account",
        pageScripts: ["header-dropdowns","manage-account"],
        user,
        labtech: user.type === 'labtech',
        student: user.type === 'student'
    });
});

// Edit Reservation Page
router.get('/edit-reservation', (req, res) => {
    res.render('edit-reservation', {
        title: "Edit Reservation",
        pageStyle: "edit-reservation",
        pageScripts: ["header-dropdowns", "edit-reservation"], // Include edit-reservation scripts
        user,
        labtech: user.type === 'labtech',
        student: user.type === 'student'
    });
});

//returns the ObjectID of lab. returns null if the lab does not exist in the DB
async function getLabId(buildName, labName) {
    try {
        const doc = await Lab.findOne({building: buildName, name: labName}).select("_id");
        return doc ? doc._id : null;
    } catch (error) {
        console.log(error);
        return null
    }
}



// Reservation list Page
router.get('/reservation-list', async (req, res) => {
    try{
        const {building, lab, date} = req.query; //get filter query

        let filter = {};
        console.log(building,lab, date);
        const labId = await getLabId(building, lab); //call getlabId function to get the ObjectId of the lab

        if(labId || date){ //only apply filters if there are actual queries in the filter.
            filter = {lab: labId, date: new Date(date)};
        }
        console.log(filter);
        //select data based on filter (returns everything if there are no filters)
        const reservations = await Reservation.find(filter).populate('user lab').sort({date: 1}).lean();
        console.log(reservations)

    res.render('reservation-list', {
        title: "Reservation List",
        pageStyle: "labtech-reservation-list",
        pageScripts: ["header-dropdowns", "reservation-list"],
            reservations
    });
    }
    catch(err){
        console.error(err);
        res.status(500).send("Server Error");
    }
});

//signout
router.post('/signout', (req, res) => {
    user = '';
    console.log('User signed out:' + user);
    res.redirect('/');
});

// API Health Check (For debugging purposes)
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'Server is running!' });
});

module.exports = router;