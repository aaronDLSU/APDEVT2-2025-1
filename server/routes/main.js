const express = require('express');
const router = express.Router();
const User = require("../../db/models/DB_users");

// Sample user roles
const student = { name: "Charlie", type: "student" };
const labtech = { name: "Sir", type: "labtech" };
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
        await User.create({ email, password, role});
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

// API Health Check (For debugging purposes)
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'Server is running!' });
});

module.exports = router;