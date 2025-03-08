const express = require('express');
const router = express.Router();

// Add model routes here
const User = require("../../db/models/DB_users");
const Reservation = require("../../db/models/DB_reservation");
const Lab = require("../../db/models/DB_labs");
const Settings = require('../../db/models/DB_settings');

// Sample user roles
const student = { username: "CChaplin", _id: "67c6e500b0ce105ba934bcf7", name: "Charlie Chaplin", password: "student", role: "student", description: "I am a first-year Computer Science major at De La Salle University (DLSU), specializing in Software Technology. Passionate about coding and problem-solving, I am eager to explore new technologies and develop innovative solutions. Currently honing my skills in programming, web development, and algorithms, I aspire to contribute to impactful projects in the tech industry.", profilePic: "student" };
const labtech = { name: "Sir", role: "labtech", description: "i am a lab technician", profilePic: "default_profilepic" };
let user = ''; // Stores the current logged-in user

// Homepage Route
router.get('/', (req, res) => {
    res.render('homepage', {
        title: "Homepage",
        pageStyle: "homepage",
        pageScripts: ["header-dropdowns"], // Scripts needed for this page
        user,
        labtech: user.role === 'labtech',
        student: user.role === 'student'
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
        console.log(req.params._id + '1');
        const otheruser = await User.findById(req.params._id).lean();
        console.log(req.params._id + '1');
        if (!otheruser) {
            return res.status(404).send('User not found');
        }

        console.log(otheruser);

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

        if (otheruser._id || otheruser.id) {
            try {
                // Get user ID as string
                const userIdString = otheruser._id || otheruser.id;
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
            otheruser,
            reservations,
            weeklyReservationCount,
            monthlyReservationCount,
            totalApprovedCount,
            currentWeekDisplay,
            currentMonthDisplay,
            labtech: user.role === 'labtech',
            student: user.role === 'student',
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
router.post('/signup', (req, res) => {

    try {
        // Extract form data from request
        const { 'signup-email': email, 'signup-password': password, 'signup-role': role } = req.body;

        // Create new user in MongoDB
        User.create({
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
            labtech: user.role === 'labtech',
            student: user.role === 'student',
            labs: uniqueLabs // Pass the unique lab objects
        });

    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).send("Internal Server Error");
    }
});

// Help & Support Page
router.get('/help-support', (req, res) => {
    res.render('help-support', {
        title: "Help & Support",
        pageStyle: "help-support",
        pageScripts: ["header-dropdowns"],
        user,
        labtech: user.role === 'labtech',
        student: user.role === 'student'
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
            labtech: user.role === 'labtech',
            student: user.role === 'student',
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

// Edit profile Page
router.get('/edit-profile', (req, res) => {
    // Check if user is logged in
    if (!user) {
        return res.redirect('/signup-login');
    }

    res.render('edit-profile', {
        title: "Edit Profile",
        pageStyle: "edit-profile",
        pageScripts: ["header-dropdowns"],
        user,
        labtech: user.role === 'labtech',
        student: user.role === 'student',
        successMessage: req.query.success,
        errorMessage: req.query.error
    });
});

// Update username route
router.post('/update-username', async (req, res) => {
    try {
        if (!user) {
            return res.redirect('/signup-login');
        }

        const { newUsername } = req.body;

        if (!newUsername || newUsername.trim() === '') {
            return res.redirect('/edit-profile?error=Username cannot be empty');
        }

        // Update the user's name in the session
        user.username = newUsername;

        // Redirect with success message
        res.redirect('/edit-profile?success=Username updated successfully');
    } catch (error) {
        console.error('Error updating username:', error);
        res.redirect('/edit-profile?error=Failed to update username');
    }
});

// Update description route
router.post('/update-description', async (req, res) => {
    try {
        if (!user) {
            return res.redirect('/signup-login');
        }

        const { newDescription } = req.body;

        if (!newDescription || newDescription.trim() === '') {
            return res.redirect('/edit-profile?error=Description cannot be empty');
        }

        // Update the user's description in the session
        user.description = newDescription;

        // Redirect with success message
        res.redirect('/edit-profile?success=Description updated successfully');
    } catch (error) {
        console.error('Error updating description:', error);
        res.redirect('/edit-profile?error=Failed to update description');
    }
});

// Placeholder route for profile picture update (without actual implementation)
router.post('/update-profile-picture', (req, res) => {
    try {
        if (!user) {
            return res.redirect('/signup-login');
        }


        res.redirect('/edit-profile?success=Profile picture updated successfully');
    } catch (error) {
        console.error('Error in profile picture update:', error);
        res.redirect('/edit-profile?error=An error occurred');
    }
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
            labtech: user.role === 'labtech',
            student: user.role === 'student'
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
        if (user.role === "student" && reservation.user.name !== user.name) {
            return res.redirect('/profile')
        }
        console.log(id, reservation, user)
        res.render('edit-reservation', {
            title: "Edit Reservation",
            pageStyle: "edit-reservation",
            pageScripts: ["header-dropdowns", "edit-reservation"], // Include edit-reservation scripts
            user,
            reservation,
            labtech: user.role === 'labtech',
            student: user.role === 'student'
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
        if (user.role === 'student') {
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
            labtech: user.role === 'labtech',
            student: user.role === 'student'
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
        const labs = await Lab.find({ availability: true }); // Fetch only available labs
        res.json(labs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching labs", error });
    }
});

module.exports = router;