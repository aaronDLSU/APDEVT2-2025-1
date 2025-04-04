const mongoose = require("mongoose");
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const MongoStore = require('connect-mongo');

router.use(cookieParser());

router.use(
    session({
      secret: "secret-key",
      resave:false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
      }),
      proxy: true,
      cookie:{
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
      }
    })
  );

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/");
    }
};

// Add model routes here
const User = require("../../db/models/DB_users");
const Reservation = require("../../db/models/DB_reservation");
const Lab = require("../../db/models/DB_labs");
const Settings = require('../../db/models/DB_settings');
const Seat = require("../../db/models/DB_seats");

// Sample user roles
// const student = { _id: "67c6e500b0ce105ba934bcf7", name: "Charlie Chaplin", password: "student", role: "student", description: "I am a first-year Computer Science major at De La Salle University (DLSU), specializing in Software Technology. Passionate about coding and problem-solving, I am eager to explore new technologies and develop innovative solutions. Currently honing my skills in programming, web development, and algorithms, I aspire to contribute to impactful projects in the tech industry.", profilePic: "/images/student.jpg" };
// const labtech = { name: "Sir", role: "labtech", description: "i am a lab technician", profilePic: "/images/default_profilepic.jpg" };
// let user = ''; // Stores the current logged-in user

const uploadDir = path.join(__dirname, '../../public/images/temp-uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created temp uploads directory:', uploadDir);
}


async function updateReserveStatus() {
    try {
        const now = new Date();
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000) //convert date object to local time

        const currentTime = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"); //change current time to string
        //console.log(todayDate)
        //console.log(currentTime);

        const reservations = await Reservation.find({
            $or: [
                { status: "approved" },
                { status: "pending" }
            ],
            date: { $lte: todayDate }
        }).lean();

        for (const reservation of reservations) {
            console.log(reservation.date, todayDate, reservation.date <= todayDate);
            if (reservation.date.getTime() === todayDate.getTime()) {
                let resEndTime;
                let resStartTime;

                if (reservation.endTime.length === 4)
                    resEndTime = "0" + reservation.endTime;
                else
                    resEndTime = reservation.endTime;

                if (reservation.startTime.length === 4)
                    resStartTime = "0" + reservation.startTime;
                else
                    resStartTime = reservation.startTime;

                //console.log(resStartTime);
                //console.log(resEndTime);

                if (resEndTime <= currentTime) {
                    //console.log("COMPLETED ", reservation)
                    await Reservation.findByIdAndUpdate(reservation._id, { status: "completed" });
                }
                else if (currentTime >= resStartTime)
                    //console.log("PENDING", reservation)
                    await Reservation.findByIdAndUpdate(reservation._id, { status: "pending" });
            } else if (reservation.date.getTime() < todayDate.getTime())
                //console.log("COMPLETED", reservation)
                await Reservation.findByIdAndUpdate(reservation._id, { status: "completed" })
        }
    } catch (err) {
        console.error("Error updating reservations:", err);
    }
}

// Homepage Route
router.get('/', async (req, res) => {
    await updateReserveStatus();
    const userData = req.session.user || null;
    console.log('User data:', userData); // Debugging: Log user data

    res.render('homepage', {
        title: "Homepage",
        pageStyle: "homepage",
        pageScripts: ["header-dropdowns"], // Scripts needed for this page
        user: userData,
        labtech: userData?.role === 'labtech',
        student: userData?.role === 'student'
    });
});

router.get('/api/users', async (req, res) => {
    const userData = req.session.user || null;
    try {
        let filter = {} //only show activated users
        //get only public users if user is student
        if (userData?.role === 'student' || !userData) {
            const publicUsers = await Settings.find({ accVisibility: 'Public' }).select("user");
            const userIds = publicUsers.map(setting => setting.user); //extract user IDs

            filter = { _id: { $in: userIds } }
        }

        const usersList = await User.find(filter).sort({ name: 1 }).lean();

        res.json({
            success: true,
            count: usersList.length,
            data: usersList
        });
        //console.log('Search results:', usersList);
    } catch (error) {
        console.error('API Search error:', error);
        res.status(500).json({
            error: "Server error",
            message: error.message
        });
    }
});

//Use to check users with email key, calendar.js
router.get('/api/users/find-by-email', async (req, res) => {
    try {
        const { email } = req.query;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Email query parameter is required."
            });
        }

        // Validate that the email is a DLSU email
        const isDLSUEmail = email.endsWith('@dlsu.edu.ph');
        if (!isDLSUEmail) {
            return res.status(400).json({
                success: false,
                message: "Only @dlsu.edu.ph emails are allowed."
            });
        }

        // Look for a student with this email
        const studentUser = await User.findOne({ email, role: 'student' }).lean();
        //Possibly need to remove
        if (!studentUser) {
            return res.status(404).json({
                success: false,
                message: "No student found with that email."
            });
        }

        return res.status(200).json({
            success: true,
            data: studentUser
        });

    } catch (error) {
        console.error('Error in /api/users/find-by-email:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
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
    const userData = req.session.user || null;
    try {
        await updateReserveStatus(); //update reservation status
        console.log("Looking up profile for ID:", req.params._id);

        // Find the user by ID
        let otheruser = await User.findById(req.params._id).lean();

        if (!otheruser) {
            return res.status(404).send('User not found');
        }
        //other user's settings
        let otherSettings = await Settings.findOne({ user: otheruser._id }).lean();
        console.log(otherSettings)

        if (!otherSettings) {
            return res.status(404).send('Users Settings not found');
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
                let filter = {}

                if (userData?.role !== 'labtech') {
                    let statusFilters = []
                    filter = { isAnonymous: false }
                    if (otherSettings.showReserves) {
                        if (otherSettings.showBooked)
                            statusFilters.push('approved')
                        if (otherSettings.showOngoing)
                            statusFilters.push('pending')
                        if (otherSettings.showPrevious)
                            statusFilters.push('completed')
                    }

                    filter.status = { $in: statusFilters }
                }

                // Get all reservations
                const allReservations = await Reservation.find(filter)
                    .populate('lab')
                    .populate('seat', 'seatNumber')
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
            user: userData,
            otheruser, // The user being viewed (with processed data)
            reservations,
            weeklyReservationCount,
            monthlyReservationCount,
            totalApprovedCount,
            currentWeekDisplay,
            currentMonthDisplay,
            showSummary: otherSettings.showStats || (userData?.role === 'labtech'),
            labtech: userData?.role === 'labtech',
            student: userData?.role === 'student',
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

async function getName(email) {
    username = email.split('@')[0];
    console.log('username:' + username);
    return username;
}

router.post('/signup', async (req, res) => {
    try {
        // Extract form data from request
        const { 'signup-email': email, 'signup-password': password, 'signup-role': role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already in use" });
        }


        let name = await getName(email);
        // Create new user in MongoDB
        const hashedPass = await bcrypt.hash(password, 13);
        let newUser = await User.create({
            name: name,
            email: email,
            password: hashedPass,
            role: role,
        });
        //create (Default) settings for new user
        await Settings.create({
            user: newUser._id
        })
        // console.log(hashedPass);
        res.json({ success: true, message: "Signup successful!" });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ success: false, message: "An error occurred during signup" });
    }
});

// Handle User Login
router.post('/login', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const { 'email-input': email, 'password-input': password,
            'login-checkbox': remembered } = req.body;

        const currUser = await User.findOne({ email: email });

        if (!currUser) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials Try Again!"
            });
        }

        const validPass = await bcrypt.compare(password, currUser.password);
        // Simulated login (replace this with database authentication later)
        if (currUser.email === email && validPass) {
            req.session.user = currUser;
            res.cookie("sessionId", req.sessionID);

            if (remembered) {
                req.session.cookie.maxAge = 3 * 7 * 24 * 60 * 60 * 1000;
            }

            return res.json({
                success: true,
                message: "Login successful!"
            });
        } else {
            return res.status(400).json({
                sucess: false,
                message: "Invalid Credentials Try Again!"
            });
        }
    } catch (error) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: "An error occurred during login"
        });
    }
});

// Calendar Dropdown for Bldg names in calendar.js
router.get('/calendar', async (req, res) => {
    const userData = req.session.user || null;
    try {
        await updateReserveStatus(); //update reservation status
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
            user: userData,
            labtech: userData?.role === 'labtech',
            student: userData?.role === 'student',
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
    const userData = req.session.user || null;
    res.render('help-support', {
        title: "Help & Support",
        pageStyle: "help-support",
        pageScripts: ["header-dropdowns"],
        user: userData,
        labtech: userData?.role === 'labtech',
        student: userData?.role === 'student'
    });
});

// User Profile Page
router.get('/profile', isAuthenticated, async (req, res) => {
    const userData = req.session.user || null;
    try {
        // Check if user is logged in
        if (!userData) {
            return res.redirect('/signup-login');
        }
        await updateReserveStatus(); //update reservation status
        console.log("Current user:", userData);

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

        if (userData._id || userData.id) {
            try {
                // Get user ID as string
                const userIdString = userData._id || userData.id;
                console.log("Looking for reservations with user ID:", userIdString);

                // Get all reservations
                const allReservations = await Reservation.find()
                    .populate('lab')
                    .populate('seat', 'seatNumber')
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

                console.log(`Found ${userReservations.length} reservations for ${userData.name}`);

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
            user: userData,
            reservations,
            weeklyReservationCount,
            monthlyReservationCount,
            totalApprovedCount,
            currentWeekDisplay,
            currentMonthDisplay,
            reservations,
            labtech: userData?.role === 'labtech',
            student: userData?.role === 'student',
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
    const userData = req.session.user || null;

    res.render('edit-profile', {
        title: "Edit Profile",
        pageStyle: "edit-profile",
        pageScripts: ["header-dropdowns"],
        user: userData,
        labtech: userData?.role === 'labtech',
        student: userData?.role === 'student'
    });
});

router.post('/update-profile-picture', (req, res) => {
    const userData = req.session.user || null;
    try {
        if (!userData) {
            return res.redirect('/signup-login');
        }

        // Check if a file was uploaded
        if (!req.files || !req.files.profilePicture) {
            return res.redirect('/edit-profile?error=Please select an image file');
        }

        const profilePicture = req.files.profilePicture;

        // Check if it's an image
        if (!profilePicture.mimetype.startsWith('image/')) {
            return res.redirect('/edit-profile?error=Please upload only image files');
        }

        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(profilePicture.name);
        const fileName = 'profile-' + uniqueSuffix + fileExtension;

        // Ensure the upload directory exists
        const uploadDir = path.join(__dirname, '../../public/images/temp-uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // The upload path
        const uploadPath = path.join(uploadDir, fileName);

        // The relative path for the browser
        const relativePath = `/images/temp-uploads/${fileName}`;

        // Move the file to the upload directory
        profilePicture.mv(uploadPath, function (err) {
            if (err) {
                console.error('File upload error:', err);
                return res.redirect('/edit-profile?error=Error uploading file');
            }

            // Update user session with new profile pic path (without saving to DB)
            userData.profilePic = relativePath;

            console.log(`Updated profile picture in session to: ${relativePath}`);

            return res.redirect('/edit-profile?success=Profile picture updated for this session');
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        return res.redirect('/edit-profile?error=' + encodeURIComponent(error.message));
    }
});

// Update username route
router.post('/update-username', async (req, res) => {
    const userData = req.session.user || null;
    try {
        if (!userData) {
            return res.redirect('/signup-login');
        }

        const { newUsername } = req.body;

        if (!newUsername || newUsername.trim() === '') {
            return res.redirect('/edit-profile?error=Username cannot be empty');
        }

        // Update the user's name in the session
        userData.username = newUsername;

        // Redirect with success message
        res.redirect('/edit-profile?success=Username updated successfully');
    } catch (error) {
        console.error('Error updating username:', error);
        res.redirect('/edit-profile?error=Failed to update username');
    }
});

// Update description route
router.post('/update-description', async (req, res) => {
    const userData = req.session.user || null;
    try {
        if (!userData) {
            return res.redirect('/signup-login');
        }

        const { newDescription } = req.body;

        if (!newDescription || newDescription.trim() === '') {
            return res.redirect('/edit-profile?error=Description cannot be empty');
        }

        // Update the user's description in the database
        const updatedUser = await User.findByIdAndUpdate(
            userData._id,
            { description: newDescription },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.redirect('/edit-profile?error=Failed to update description in database');
        }

        // Update the user's description in the session
        userData.description = newDescription;

        // Redirect with success message
        res.redirect('/edit-profile?success=Description updated successfully');
    } catch (error) {
        console.error('Error updating description:', error);
        res.redirect('/edit-profile?error=Failed to update description');
    }
});

// manage account Page
router.get('/manage-account', async (req, res) => {
    const userData = req.session.user || null;
    try {
        if (!userData) {
            return res.redirect('/signup-login');
        }
        //console.log("Current user:", user._id);
        await updateReserveStatus(); //update reservation status
        const objID = await User.findById(userData._id);
        //console.log(objID)
        const userSettings = await Settings.findOne({ user: objID }).populate("user").lean();
        //create user settings (if it does not exist already)
        if (!userSettings) {
            await Settings.create({
                user: objID
            })
        }

        //console.log(userSettings)
        res.render('manage-account', {
            title: "Manage Account",
            pageStyle: "manage-account",
            pageScripts: ["header-dropdowns"],
            user: userData,
            userSettings,
            labtech: userData?.role === 'labtech',
            student: userData?.role === 'student'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

router.post('/change-password', async (req, res) => {
    const userData = req.session.user || null;
    try {
        if (!userData) {
            return res.redirect('/signup-login');
        }

        const { oldPass, newPass } = req.body;
        //check if old pass == new pass
        const isEqual = await bcrypt.compare(oldPass, userData.password);

        if (isEqual) {
            //hash new password
            const hashedPass = await bcrypt.hash(newPass, 13);
            //update password
            const updatedUser = await User.findByIdAndUpdate(
                userData._id, { password: hashedPass }
            )
            if (updatedUser) {
                res.status(200).json({
                    success: true,
                    message: "Password changed successfully",
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: "Update password failed",
                });
            }
        }
        else {
            res.status(200).json({
                success: false,
                message: "Wrong Password!",
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

router.post('/change-privacy-settings', async (req, res) => {
    const userData = req.session.user || null;
    try {
        if (!userData) {
            return res.redirect('/signup-login');
        }

        const { id, accVisibility, showStats, showReserves, showBooked, showOngoing, showPrevious } = req.body;
        if (!id || !accVisibility) {
            return res.status(400).json({ success: false, message: "Missing parameters" });
        }

        const userSetting = await Settings.findById(id);

        if (!userSetting) {
            return res.status(404).send("User's settings not found");
        }
        const updatedSettings = await Settings.findByIdAndUpdate(
            userSetting._id,
            {
                accVisibility: accVisibility,
                showStats: showStats,
                showReserves: showReserves,
                showBooked: showBooked,
                showOngoing: showOngoing,
                showPrevious: showPrevious,
            }
        )

        console.log("Updated User:", updatedSettings);
        if (updatedSettings) {
            res.status(200).json({
                success: true,
                message: "Priv settings edited successfully",
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: "Priv settings update failed",
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

router.post('/delete-account', async (req, res) => {
    const userData = req.session.user || null;
    try {
        if (!userData) {
            return res.redirect('/signup-login');
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Missing parameters" });
        }

        const isPassEqual = await bcrypt.compare(password, userData.password)
        if (email === userData.email && isPassEqual) {
            //signout from account b4 deleting
            req.session.destroy(error => {
                if (error) {
                    return res.status(500)
                        .json({ success: false, message: "Error signing out" });
                }
                res.clearCookie('connect.sid');
            });

            /*delete settings from the DB*/
            const deletedSettings = await Settings.deleteMany({ user: userData._id });
            if (!deletedSettings) {
                return res.status(500)
                    .json({ success: false, message: "Error deleting settings" });
            }


            /*delete reservations from the DB*/
            const deletedReserves = await Reservation.deleteMany({ user: userData._id });

            if (!deletedReserves) {
                return res.status(500)
                    .json({ success: false, message: "Error deleting reservations" });
            }

            /* DELETE ACCOUNT IN THE DB*/
            const deletedUser = await User.findByIdAndDelete(userData._id)

            // console.log("deleted:", deletedSettings, deletedReserves, deletedUser)

            if (!deletedUser) {
                return res.status(500)
                    .json({ success: false, message: "Error deleting account" });
            }

            res.status(200).json({
                success: true,
                message: "Account successfully deleted",
            });
        }
        else {
            return res.status(200).json({ success: false, message: "Email/password mismatch" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

//check availability
router.post('/check-availability', async (req, res) => {
    try {
        const { building, lab, date } = req.body;
        if (!building || !lab || !date) {
            return res.status(400).json({ success: false, message: "Missing parameters" });
        }
        let labID = await getLabId(building, lab);
        if (!labID) {
            return res.status(404).json({ success: false, message: "Lab room not found" });
        }

        let labData = await Lab.findById(labID)

        res.status(200).json({
            success: true,
            message: "Seats loaded",
            capacity: labData.capacity,
            available: labData.availability
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

async function overlapsReserve(seatID, startTime, endTime, date) {
    try {
        function timeToInt(time) {
            return parseInt(time.replace(":", ""), 10); //HH:MM to HHMM(int)
        }

        const startInt = timeToInt(startTime);
        const endInt = timeToInt(endTime);
        console.log(seatID, startTime, endTime, date)

        const reservations = await Reservation.find({ seat: seatID, date: date });
        console.log(reservations)

        for (let res of reservations) {
            let resStartInt = timeToInt(res.startTime);
            let resEndInt = timeToInt(res.endTime);

            if (startInt < resEndInt && endInt > resStartInt) {
                console.log(startInt, endInt);
                console.log(resStartInt, resEndInt);
                console.log(res)
                return true;
            }
        }

        return false; // No overlap
    } catch (error) {
        console.error(error);
        return true;
    }
}

//save changes to reservation
router.post('/update-reservation', async (req, res) => {
    const userData = req.session.user || null;
    try {
        if (!userData) {
            return res.redirect('/signup-login');
        }
        const { id, seat, startTime, endTime, lab, building, date, isAnonymous } = req.body;
        if (!id || !seat || !startTime || !endTime || !lab || !building || !date) {
            return res.status(400).json({ success: false, message: "Missing parameters" });
        }

        await updateReserveStatus()

        const selectedReserve = await Reservation.findById(id);

        if (!selectedReserve) {
            return res.status(404).send("Reservation not found");
        }

        if (selectedReserve.status === "approved") {
            const selectedLab = await getLabId(building, lab);
            const newDate = new Date(date);
            const seatID = await Seat.findOne({ lab: selectedLab, seatNumber: seat }).select("_id")
            const overlap = await overlapsReserve(seatID, startTime, endTime, newDate)

            if (overlap) {
                res.status(200).json({
                    success: false,
                    overlap: true,
                    message: "Existing reservation overlaps",
                    labtech: userData?.role === 'labtech',
                    student: userData?.role === 'student'
                });
            }
            else {
                console.log(isAnonymous)
                const updatedReserve = await Reservation.findByIdAndUpdate(
                    selectedReserve._id,
                    {
                        seat: seatID,
                        startTime: startTime,
                        endTime: endTime,
                        date: newDate,
                        isAnonymous: isAnonymous
                    }
                )

                console.log("Updated Reservation:", updatedReserve);

                res.status(200).json({
                    success: true,
                    overlap: false,
                    message: "Reservation edited successfully",
                    labtech: userData?.role === 'labtech',
                    student: userData?.role === 'student'
                });
            }
        }
        else {
            res.status(200).json({
                success: false,
                cannotEdit: true,
                message: "You cannot edit this reservation anymore!",
                labtech: userData?.role === 'labtech',
                student: userData?.role === 'student'
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

// Edit Reservation Page
router.post('/edit-reservation', async (req, res) => {
    const userData = req.session.user || null;
    try {
        if (!userData) {
            return res.redirect('/signup-login');
        }

        await updateReserveStatus()

        const { id } = req.body;
        if (!id) {
            return res.status(400).send("Reservation ID is required");
        }
        const reservation = await Reservation.findOne({ _id: id }).populate("user lab seat").lean();
        const labs = await Lab.find().lean();

        if (!reservation) {
            return res.status(404).send("Reservation not found");
        }
        //if student tries to edit another user's reservation. have yet to test.
        if (userData.type === "student" && reservation.user.name !== userData.name) {
            return res.redirect('/profile')
        }
        console.log(id, reservation, userData)
        if (reservation.status === "approved") {
            res.render('edit-reservation', {
                title: "Edit Reservation",
                pageStyle: "edit-reservation",
                pageScripts: ["header-dropdowns", "edit-reservation"], // Include edit-reservation scripts
                user: userData,
                reservation,
                labs,
                labtech: userData?.role === 'labtech',
                student: userData?.role === 'student',
                helpers: {
                    uniqueBuildings: function (labs) {
                        const buildings = [];
                        const seen = new Set();

                        labs.forEach(function (lab) {
                            if (!seen.has(lab.building)) {
                                buildings.push(lab);
                                seen.add(lab.building);
                            }
                        });
                        return buildings;
                    }
                }
            });
        }
        else {
            res.send('You cannot edit this reservation anymore!. <p style="color:blue; text-decoration: underline; display:inline-block" onclick="history.back()">Back</p>');
        }
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
    const userData = req.session.user || null;
    try {
        if (!userData) {
            return res.redirect('/signup-login');
        }
        if (userData.type === 'student') {
            return res.redirect('/')
        }

        await updateReserveStatus(); //update reservation status

        const { building, lab, date } = req.query; //get filter query
        //only reservations not cancelled nor rejected
        let filter = {
            $nor: [{ status: "cancelled" }, { status: "rejected" }]
        };
        //console.log(building,lab, date);
        const labId = await getLabId(building, lab); //call getlabId function to get the ObjectId of the lab

        if (labId || date) { //only apply filters if there are actual queries in the filter.
            filter = { ...filter, lab: labId, date: new Date(date) };
        }

        //console.log(filter);
        //select data based on filter (returns everything if there are no filters)
        const reservations = await Reservation.find(filter).populate('user lab seat').sort({ date: 1 }).lean()
        const labs = await Lab.find().sort({ name: 1 }).lean()
        //console.log(reservations)
        console.log(labs)

        const statusPriority = {
            'approved': 1,
            'pending': 2,
            'rejected': 3,
            'cancelled': 4
        };

        // Sort reservations by status priority, then by date
        reservations.sort((a, b) => {
            // First sort by status priority
            const priorityA = statusPriority[a.status] || 99;
            const priorityB = statusPriority[b.status] || 99;

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // If same status, sort by date (newest first)
            return new Date(b.date) - new Date(a.date);
        });

        res.render('reservation-list', {
            title: "Reservation List",
            pageStyle: "reservation-list",
            pageScripts: ["header-dropdowns", "reservation-list"],
            reservations,
            user: userData,
            labs,
            labtech: userData?.role === 'labtech',
            student: userData?.role === 'student'
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
        /* delete reservation from the DB*/
        const deletedRes = await Reservation.findByIdAndDelete(ObjID);

        console.log(deletedRes);

        if (!deletedRes) {
            res.status(400).json({ success: false, message: "Reservation deleted failed" });
        }
        res.status(200).json({ success: true, message: "Reservation deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

//signout
router.post('/signout', (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500)
                .json({ success: false, message: "Error signing out" });
        }
        res.clearCookie('connect.sid');
        res.redirect('/');

    });
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

//get settings
router.get("/api/settings", async (req, res) => {
    try {
        const { user } = req.query
        if (!user) return res.status(400).json({ message: "User ID is required" });

        //find user
        const userId = await User.findById(user).select("_id")
        if (!userId) return res.status(404).json({ message: "User not found" });

        //find user's settings
        const settings = await Settings.find({ user: userId }).lean(); // Convert to plain JS object for performance boost
        res.json(settings);
    } catch (error) {
        console.error("Error fetching user settings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

// Handles Reservations for calendar.js
router.post("/api/reserveroom", async (req, res) => {
    try {
        const { lab, seat, date, startTime, endTime, isAnonymous, user: passedUserId } = req.body;

        // Hardcoded user ID 
        //const userId = "67c66192b0ce105ba934bc95";

        //Newly added to use sessions
        const sessionUser = req.session.user; // Access user ID from the session
        let userId = sessionUser?._id;

        if (!userId) {
            return res.status(401).json({ message: "User is not authenticated" });
        }

        // Allow labtechs to book for others
        if (sessionUser.role === "labtech" && passedUserId) {
            userId = passedUserId;
        }

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

// API route to get current session user ID, calendar.js
router.get('/api/current-user-id', (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Session not found or user not logged in"
            });
        }

        const { _id, role } = req.session.user;

        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "User ID missing in session"
            });
        }

        return res.status(200).json({
            success: true,
            userId: _id,
            role: role
        });

    } catch (err) {
        console.error("Error in /api/current-user-id:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

module.exports = router;
