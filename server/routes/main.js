const mongoose = require("mongoose");
const express = require('express');
const router = express.Router();

// Add model routes here
const User = require("../../db/models/DB_users");
const Reservation = require("../../db/models/DB_reservation");
const Lab = require("../../db/models/DB_labs");
const Settings = require('../../db/models/DB_settings');
const Seat = require("../../db/models/DB_seats");

// Sample user roles
const student = { _id: "67c6e500b0ce105ba934bcf7", name: "Charlie Chaplin", password: "student", type: "student", description: "I am a first-year Computer Science major at De La Salle University (DLSU), specializing in Software Technology. Passionate about coding and problem-solving, I am eager to explore new technologies and develop innovative solutions. Currently honing my skills in programming, web development, and algorithms, I aspire to contribute to impactful projects in the tech industry.", profilePic: "student" };
const labtech = { name: "Sir", type: "labtech", description: "i am a lab technician", profilePic: "default_profilepic" };
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

router.get('/api/users', async (req, res) => {
    try {
        const usersList = await User.find({}).lean();
        console.log(usersList);

        res.json({
            success: true,
            count: usersList.length,
            data: usersList
        });
        console.log('Search results:', usersList);
    } catch (error) {
        console.error('API Search error:', error);
        res.status(500).json({
            error: "Server error",
            message: error.message
        });
    }
});

router.get('/search_user', async (req, res) => {
    try {
        const searchTerm = req.query["search-bar"];

        if (!searchTerm?.trim()) {
            return res.status(400).send('Invalid search term');
        }

        // Case-insensitive search with partial matching
        const users = await User.find({
            name: { $regex: new RegExp(searchTerm, 'i') }
        });
        console.log(users);

        if (!users.length) {
            res.status(400).send(' user not found');
        } else {
            return res.redirect(`/profile/${users[0]._id}`);
        }

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).send(' error');
    }
});


// Individual profile route
router.get('/profile/:_id', async (req, res) => {
    try {
        console.log("Looking up profile for ID:", req.params._id);

        // Find the user by ID
        let otheruser = await User.findById(req.params._id).lean();

        if (!otheruser) {
            return res.status(404).send('User not found');
        }

        // Log the raw user data from database
        console.log("Raw user data from database:", {
            _id: otheruser._id,
            name: otheruser.name,
            username: otheruser.username,
            role: otheruser.role,
            profilePic: otheruser.profilePic,
            description: otheruser.description
        });

        // Make a copy to avoid modifying the original
        otheruser = { ...otheruser };


        // Ensure description exists
        if (!otheruser.description) {
            otheruser.description = "No description available.";
        }

        // Log the processed user data
        console.log("Processed user data:", {
            id: otheruser._id,
            name: otheruser.name,
            role: otheruser.role,
            profilePic: otheruser.profilePic,
            description: otheruser.description
        });

        // Fetch user's reservations
        let reservations = [];
        let weeklyReservationCount = 0;
        let monthlyReservationCount = 0;
        let totalApprovedCount = 0;

        // Calculate current week and month for display
        const today = new Date();

        // Current week (Sunday-Saturday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
        endOfWeek.setHours(23, 59, 59, 999);

        // Format week display
        const currentWeekDisplay = `${startOfWeek.toLocaleDateString('en-US', { month: 'short' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}`;

        // Current month
        const currentMonthDisplay = today.toLocaleDateString('en-US', { month: 'long' });

        // Start of current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        // End of current month
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        if (otheruser._id) {
            try {
                // Get user ID as string
                const userIdString = otheruser._id.toString();
                console.log("Looking for reservations with user ID:", userIdString);

                // Get all reservations
                const allReservations = await Reservation.find()
                    .populate('lab')
                    .sort({ date: 1 }) // Sort by date to get original order
                    .lean();

                console.log(`Total reservations in database: ${allReservations.length}`);

                // Filter reservations for this user by comparing string IDs
                const userReservations = allReservations.filter(reservation => {
                    // Handle both ObjectId and string comparisons
                    const resUserId = reservation.user ?
                        (reservation.user.toString ? reservation.user.toString() : reservation.user)
                        : null;

                    return resUserId === userIdString;
                });

                console.log(`Found ${userReservations.length} reservations for ${otheruser.name}`);

                const approvedReservations = userReservations.filter(
                    reservation => reservation.status === "approved"
                );

                totalApprovedCount = approvedReservations.length;
                console.log(`Total approved reservations: ${totalApprovedCount}`);

                // Count approved reservations for current week and month
                approvedReservations.forEach(reservation => {
                    const reservationDate = new Date(reservation.date);
                    const dayOfWeek = reservationDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

                    // Only count Monday-Saturday (exclude Sunday)
                    if (dayOfWeek !== 0 && reservationDate >= startOfWeek && reservationDate <= endOfWeek) {
                        weeklyReservationCount++;
                    }

                    if (reservationDate >= startOfMonth && reservationDate <= endOfMonth) {
                        monthlyReservationCount++;
                    }
                });

                // Assign sequential numbers based on original order
                userReservations.forEach((reservation, index) => {
                    reservation.originalNumber = index + 1; // Start from 1
                });

                // Define status priority
                const statusPriority = {
                    'approved': 1,
                    'pending': 2,
                    'rejected': 3,
                    'cancelled': 4
                };

                // Sort reservations by status priority, then by date
                reservations = userReservations.sort((a, b) => {
                    // First sort by status priority
                    const priorityA = statusPriority[a.status] || 99;
                    const priorityB = statusPriority[b.status] || 99;

                    if (priorityA !== priorityB) {
                        return priorityA - priorityB;
                    }

                    // If same status, sort by date (newest first)
                    return new Date(b.date) - new Date(a.date);
                });

            } catch (error) {
                console.error("Error fetching reservations:", error);
            }
        }

        res.render('profile', {
            title: `${otheruser.name}'s Profile`,
            pageStyle: "profile",
            pageScripts: ["header-dropdowns"],
            user, // Current logged in user
            otheruser, // The user being viewed (with processed data)
            reservations,
            weeklyReservationCount,
            monthlyReservationCount,
            totalApprovedCount,
            currentWeekDisplay,
            currentMonthDisplay,
            labtech: user && user.role === 'labtech',
            student: user && user.role === 'student',
            helpers: {
                formatDate: function (date) {
                    return new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                },
                eq: function (a, b) {
                    return a === b;
                },
                add: function (a, b) {
                    return parseInt(a) + parseInt(b);
                },
                includes: function (str, substr) {
                    if (typeof str !== 'string') return false;
                    return str.includes(substr);
                }
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).send('Internal server error');
    }
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
            role: role
        });
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

// Calendar Dropdown for Bldg names in calendar.js
router.get('/calendar', async (req, res) => {
    try {
        const { name } = req.query; // Extracting 'name' from query parameters
        let query = {};

        if (name) {
            query.name = name; // Filter if name is provided
        }

        const labs = await Lab.find(query).lean(); // Fetch labs

        // Create a Map to ensure uniqueness based on building names
        const uniqueLabs = Array.from(new Map(labs.map(lab => [lab.building, lab])).values());

        console.log("Unique labs:", uniqueLabs);

        res.render('calendar', {
            title: "Reserve your lab room!",
            pageStyle: "calendar",
            pageScripts: ["header-dropdowns", "calendar"], // Include scripts for calendar functionality
            user,
            labtech: user.type === 'labtech',
            student: user.type === 'student',
            labs: uniqueLabs // Pass the unique lab objects
        });

    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).send("Internal Server Error");
    }
});

// To fetch seat object id for calendar.js
router.get("/api/seats", async (req, res) => {
    try {
        const { lab, seatNumber } = req.query;

        console.log("Incoming Seat Request:", { lab, seatNumber });

        // Validate Lab ID
        if (!lab) {
            console.error("Missing Lab ID");
            return res.status(400).json({ message: "Lab ID is required!" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab)) {
            console.error("Invalid Lab ObjectId:", lab);
            return res.status(400).json({ message: "Invalid Lab ID!" });
        }

        let query = { lab: new mongoose.Types.ObjectId(lab) }; // Base query for lab

        // If seatNumber is provided, validate it and add to query
        if (seatNumber) {
            const seatNum = parseInt(seatNumber, 10);
            if (isNaN(seatNum) || seatNum <= 0) {
                console.error("Invalid Seat Number:", seatNumber);
                return res.status(400).json({ message: "Invalid Seat Number!" });
            }
            query.seatNumber = seatNum;
        }

        // Fetch seats (single seat if seatNumber is provided, otherwise all seats for lab)
        const seats = await Seat.find(query);

        if (!seats.length) {
            console.warn(`No seats found for Lab ${lab}${seatNumber ? `, Seat ${seatNumber}` : ""}`);
            return res.status(404).json({ message: `No seats found for the specified criteria.` });
        }

        console.log("Seats Found:", seats);
        res.status(200).json(seatNumber ? seats[0] : seats); // Return single seat if filtering by seatNumber

    } catch (error) {
        console.error("Error fetching seat:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
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
router.get('/profile', async (req, res) => {
    try {
        // Check if user is logged in
        if (!user) {
            return res.redirect('/signup-login');
        }

        console.log("Current user:", user);

        // Fetch user's reservations
        let reservations = [];
        let weeklyReservationCount = 0;
        let monthlyReservationCount = 0;
        let totalApprovedCount = 0;
        // Calculate current week and month for display
        const today = new Date();

        // Current week (Sunday-Saturday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
        endOfWeek.setHours(23, 59, 59, 999);

        // Format week display
        const currentWeekDisplay = `${startOfWeek.toLocaleDateString('en-US', { month: 'short' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}`;

        // Current month
        const currentMonthDisplay = today.toLocaleDateString('en-US', { month: 'long' });

        // Start of current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        // End of current month
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        if (user._id || user.id) {
            try {
                // Get user ID as string
                const userIdString = user._id || user.id;
                console.log("Looking for reservations with user ID:", userIdString);

                // Get all reservations
                const allReservations = await Reservation.find()
                    .populate('lab')
                    .sort({ date: 1 }) // Sort by date to get original order
                    .lean();

                console.log(`Total reservations in database: ${allReservations.length}`);

                // Filter reservations for this user by comparing string IDs
                const userReservations = allReservations.filter(reservation => {
                    // Handle both ObjectId and string comparisons
                    const resUserId = reservation.user ?
                        (reservation.user.toString ? reservation.user.toString() : reservation.user)
                        : null;

                    return resUserId === userIdString;
                });

                console.log(`Found ${userReservations.length} reservations for ${user.name}`);

                const approvedReservations = userReservations.filter(
                    reservation => reservation.status === "approved"
                );

                totalApprovedCount = approvedReservations.length;
                console.log(`Total approved reservations: ${totalApprovedCount}`);

                // Count approved reservations for current week and month
                approvedReservations.forEach(reservation => {
                    const reservationDate = new Date(reservation.date);
                    const dayOfWeek = reservationDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

                    // Only count Monday-Saturday (exclude Sunday)
                    if (dayOfWeek !== 0 && reservationDate >= startOfWeek && reservationDate <= endOfWeek) {
                        weeklyReservationCount++;
                    }

                    if (reservationDate >= startOfMonth && reservationDate <= endOfMonth) {
                        monthlyReservationCount++;
                    }
                });



                // Assign sequential numbers based on original order
                userReservations.forEach((reservation, index) => {
                    reservation.originalNumber = index + 1; // Start from 1
                });

                // Define status priority
                const statusPriority = {
                    'approved': 1,
                    'pending': 2,
                    'rejected': 3,
                    'cancelled': 4
                };

                // Sort reservations by status priority, then by date
                reservations = userReservations.sort((a, b) => {
                    // First sort by status priority
                    const priorityA = statusPriority[a.status] || 99;
                    const priorityB = statusPriority[b.status] || 99;

                    if (priorityA !== priorityB) {
                        return priorityA - priorityB;
                    }

                    // If same status, sort by date (earliest first)
                    return new Date(b.date) - new Date(a.date);
                });

            } catch (error) {
                console.error("Error fetching reservations:", error);
            }
        }

        res.render('profile', {
            title: "Profile Page",
            pageStyle: "profile",
            pageScripts: ["header-dropdowns"],
            user,
            reservations,
            weeklyReservationCount,
            monthlyReservationCount,
            totalApprovedCount,
            currentWeekDisplay,
            currentMonthDisplay,
            reservations,
            labtech: user.type === 'labtech',
            student: user.type === 'student',
            helpers: {
                formatDate: function (date) {
                    return new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                },
                eq: function (a, b) {
                    return a === b;
                },
                add: function (a, b) {
                    return parseInt(a) + parseInt(b);
                }
            }
        });
    } catch (err) {
        console.error('Profile page error:', err);
        res.status(500).send('Server Error');
    }
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
router.get('/manage-account', async (req, res) => {
    try {
        if (!user) {
            return res.redirect('/signup-login');
        }
        //console.log("Current user:", user._id);

        const objID = await User.findById(user._id);
        //console.log(objID)
        const userSettings = await Settings.findOne({ user: objID }).populate("user").lean();
        console.log(userSettings)
        res.render('manage-account', {
            title: "Manage Account",
            pageStyle: "manage-account",
            pageScripts: ["header-dropdowns"],
            user, userSettings,
            labtech: user.type === 'labtech',
            student: user.type === 'student'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

router.post('/change-password', (req, res) => {

})

router.post('/change-privacy-settings', (req, res) => {

})

router.post('/delete-account', (req, res) => { })

// Edit Reservation Page
router.post('/edit-reservation', async (req, res) => {
    try {
        if (!user) {
            return res.redirect('/signup-login');
        }

        const { id } = req.body;
        if (!id) {
            return res.status(400).send("Reservation ID is required");
        }
        const reservation = await Reservation.findOne({ _id: id }).populate('user lab').lean();
        console.log(reservation);

        if (!reservation) {
            return res.status(404).send("Reservation not found");
        }
        //if student tries to edit another user's reservation. have yet to test.
        if (user.type === "student" && reservation.user.name !== user.name) {
            return res.redirect('/profile')
        }
        console.log(id, reservation, user)
        res.render('edit-reservation', {
            title: "Edit Reservation",
            pageStyle: "edit-reservation",
            pageScripts: ["header-dropdowns", "edit-reservation"], // Include edit-reservation scripts
            user,
            reservation,
            labtech: user.type === 'labtech',
            student: user.type === 'student'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//returns the ObjectID of lab. returns null if the lab does not exist in the DB
async function getLabId(buildName, labName) {
    try {
        const doc = await Lab.findOne({ building: buildName, name: labName }).select("_id");
        return doc ? doc._id : null;
    } catch (error) {
        console.log(error);
        return null
    }
}

// Reservation list Page
router.get('/reservation-list', async (req, res) => {
    try {
        if (!user) {
            return res.redirect('/signup-login');
        }
        if (user.type === 'student') {
            return res.redirect('/')
        }

        const { building, lab, date } = req.query; //get filter query

        let filter = {};
        //console.log(building,lab, date);
        const labId = await getLabId(building, lab); //call getlabId function to get the ObjectId of the lab

        if (labId || date) { //only apply filters if there are actual queries in the filter.
            filter = { lab: labId, date: new Date(date) };
        }
        //console.log(filter);
        //select data based on filter (returns everything if there are no filters)
        const reservations = await Reservation.find(filter).populate('user lab').sort({ date: 1 }).lean();
        //console.log(reservations)

        res.render('reservation-list', {
            title: "Reservation List",
            pageStyle: "labtech-reservation-list",
            pageScripts: ["header-dropdowns", "reservation-list"],
            reservations,
            user,
            labtech: user.type === 'labtech',
            student: user.type === 'student'
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
//delete reservation function
router.post('/delete-reservation', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).send("Reservation not found");
        }
        const selectedReserve = await Reservation.findById(id);

        if (!selectedReserve) {
            return res.status(404).send("Reservation not found");
        }

        const ObjID = selectedReserve._id;
        const deletedRes = await Reservation.findByIdAndDelete(ObjID);
        console.log(deletedRes);

        if (!deletedRes) {
            return res.status(404).send("Reservation not found");
        }
        res.status(200).json({ success: true, message: "Reservation deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

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

// API route to fetch available labs rooms for calendar.js
router.get("/api/labs", async (req, res) => {
    try {
        const labs = await Lab.find({ availability: true }).select("name building capacity"); // Fetch only available labs
        res.json(labs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching labs", error });
    }
});

// Checks reservation list for calendar.js
router.get("/api/reservations", async (req, res) => {
    try {
        // Fetch all reservations, populating related user and lab details
        const reservations = await Reservation.find()
            .populate("user", "name email")  // Fetch user details (only name and email)
            .populate("lab", "name location") // Fetch lab details (only name and location)
            .lean(); // Convert to plain JS object for performance boost

        res.json(reservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Handles Reservations for calendar.js
router.post("/api/reserveroom", async (req, res) => {
    try {
        const { lab, seat, date, startTime, endTime, isAnonymous } = req.body;

        // Hardcoded user ID 
        const userId = "67c6e500b0ce105ba934bcf7";

        if (!lab || !seat || !date || !startTime || !endTime) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        // Fetch the seat ObjectId
        const seatObj = await Seat.findOne({ _id: seat, lab });

        if (!seatObj) {
            return res.status(400).json({ message: "Invalid seat selection!" });
        }

        // Convert date and time strings into Date objects
        const reservationDate = new Date(date);
        if (isNaN(reservationDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format!" });
        }

        const now = new Date();
        now.setSeconds(0, 0); // Ignore seconds/milliseconds

        const startTimeObj = new Date(reservationDate);
        const [startHour, startMinute] = startTime.split(":").map(Number);
        startTimeObj.setHours(startHour, startMinute, 0, 0);

        const endTimeObj = new Date(reservationDate);
        const [endHour, endMinute] = endTime.split(":").map(Number);
        endTimeObj.setHours(endHour, endMinute, 0, 0);

        if (startTimeObj < now) {
            return res.status(400).json({ message: "Cannot book past time slots!" });
        }

        if (startTimeObj >= endTimeObj) {
            return res.status(400).json({ message: "End time must be after start time!" });
        }

        // Prevent overlapping reservations
        const existingReservation = await Reservation.findOne({
            lab,
            seat: seatObj._id, // Compare ObjectId, not seat number
            date: reservationDate,
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
            ]
        });

        if (existingReservation) {
            return res.status(409).json({ 
                message: `Seat is already reserved from ${existingReservation.startTime} to ${existingReservation.endTime}!`
            });
        }

        // Create reservation
        const newReservation = new Reservation({
            name: `Reservation ${Date.now()}`,
            user: userId,
            lab,
            isAnonymous: !!isAnonymous,
            seat: seatObj._id, // Store seat as ObjectId
            date: reservationDate,
            startTime,
            endTime,
            status: "approved"
        });

        await newReservation.save();

        res.status(201).json({ message: "Reservation successful", reservation: newReservation });

    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;