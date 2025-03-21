// Real-time Clock
$(document).ready(function() {
    console.log('works ');
    const clockContainer = document.getElementById("real-time-clock");
    const calendarGrid = document.getElementById("calendar");
    const currentMonthLabel = document.getElementById("current-month");
    const roomListContainer = document.getElementById("room-list");

    let currentDate = new Date();
    let selectedMonth = currentDate.getMonth();
    let selectedYear = currentDate.getFullYear();

    function updateClock() {
        const now = new Date();
        clockContainer.innerHTML = now.toLocaleDateString() + " | " + now.toLocaleTimeString();
    }
    
    setInterval(updateClock, 1000);
    updateClock();

    function generateCalendar() {
        calendarGrid.innerHTML = "";
        let firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
        let daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        let today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize date for accurate comparison

        currentMonthLabel.innerText = new Date(selectedYear, selectedMonth).toLocaleString('default', {
            month: 'long',
            year: 'numeric'
        });

        let selectedDateElement = null;

        // Fill empty slots before the first day
        for (let i = 0; i < firstDay; i++) {
            let emptyCell = document.createElement("div");
            emptyCell.classList.add("date");
            emptyCell.style.visibility = "hidden";
            calendarGrid.appendChild(emptyCell);
        }

        // Create calendar dates
        for (let i = 1; i <= daysInMonth; i++) {
            let dateBox = document.createElement("div");
            dateBox.classList.add("date");
            dateBox.innerText = i;

            let currentDateCheck = new Date(selectedYear, selectedMonth, i);
            currentDateCheck.setHours(0, 0, 0, 0);

            if (currentDateCheck < today) {
                dateBox.classList.add("past-date");
            } else {
                dateBox.addEventListener("click", function () {
                    // Remove selection from previously selected date
                    if (selectedDateElement) {
                        selectedDateElement.classList.remove("selected-date");
                    }
                    // Select the new date
                    this.classList.add("selected-date");
                    selectedDateElement = this;
                });
            }

            calendarGrid.appendChild(dateBox);
            }
        }

        window.changeMonth = function(offset) {
        selectedMonth += offset;

        if (selectedMonth < 0) {
            selectedMonth = 11;
            selectedYear--;
        } else if (selectedMonth > 11) {
            selectedMonth = 0;
            selectedYear++;
        }

        generateCalendar();
    };
    
    function generateSeatGrid(capacity) {
        const seatTableBody = document.querySelector(".seats-table tbody");
        seatTableBody.innerHTML = ""; // Clear previous seats
    
        const seatsPerRow = 5; // Change this value if needed
        let row;
    
        for (let i = 0; i < capacity; i++) {
            if (i % seatsPerRow === 0) {
                // Create a new row every `seatsPerRow` seats
                row = document.createElement("tr");
                seatTableBody.appendChild(row);
            }
    
            let seatCell = document.createElement("td");
            seatCell.classList.add("seat");
            seatCell.innerText = `Seat ${i + 1}`;
            row.appendChild(seatCell);
        }
    
        generateAvailabilityGrid(capacity); // Ensure availability grid updates
    }
    
    
    function generateAvailabilityGrid(capacity) {
        const availabilityTableBody = document.querySelector(".available-table tbody");
        availabilityTableBody.innerHTML = ""; // Clear previous table
    
        for (let i = 0; i < capacity; i++) {
            let row = document.createElement("tr");
    
            for (let j = 0; j < 24; j++) {
                let cell = document.createElement("td");
                //cell.dataset.timeSlot = j;
                //cell.addEventListener("click", function () {
                //    this.classList.toggle("highlight");
                //});
                row.appendChild(cell);
            }
    
            availabilityTableBody.appendChild(row);
        }
    }
    
    

    // Show available lab room from DB_labs
    async function generateRoomList() {
        try {
            const response = await fetch("/api/labs");
            const labs = await response.json();
    
            const buildingDropdown = document.getElementById("dropbtn");
            const selectedBuilding = buildingDropdown.value;
            const roomListContainer = document.getElementById("room-list");
            const roomAvailabilityHeader = document.getElementById("room-availability");
    
            roomListContainer.innerHTML = "";
    
            const filteredLabs = labs.filter(lab => lab.building === selectedBuilding);
    
            filteredLabs.forEach(lab => {
                let roomDiv = document.createElement("div");
                roomDiv.className = "room-item";
                roomDiv.innerText = `${lab.name} (Capacity: ${lab.capacity})`;
                roomDiv.dataset.capacity = lab.capacity;  // Store capacity
                roomDiv.dataset.roomId = lab._id;         // Store Room ID here
    
                // Click event to select room and update seat grid dynamically
                roomDiv.addEventListener("click", function () {
                    document.querySelectorAll(".room-item").forEach(r => r.classList.remove("selected-room"));
                    this.classList.add("selected-room");
    
                    roomAvailabilityHeader.innerText = `Seat availability at ${lab.name}`;
                    generateSeatGrid(lab.capacity); // Call function to update seat grid
                });
    
                roomListContainer.appendChild(roomDiv);
            });
        } catch (error) {
            console.error("Error fetching lab rooms:", error);
        }
    }
    
    // Resets room selection when changing building
    document.getElementById("dropbtn").addEventListener("change", generateRoomList);

    function convertToDateTimeObject(dateStr, timeStr) {
        let [hours, minutes] = timeStr.split(":").map(Number);
        let dateObj = new Date(dateStr);
        dateObj.setHours(hours, minutes, 0, 0); // Set time for comparison
        return dateObj;
    }
    

    // Checks time and marks out passed time and reserved seats
    async function updateSeatAvailability() {
        let now = new Date();
        let currentHour = now.getHours();
        let currentMinutes = now.getMinutes();
        let currentDay = now.getDate();
        let currentMonth = now.getMonth();
        let currentYear = now.getFullYear();
    
        // Get the selected room
        const selectedRoom = document.querySelector(".selected-room");
        if (!selectedRoom) return;
    
        let selectedCapacity = parseInt(selectedRoom.dataset.capacity, 10);
        let selectedRoomId = selectedRoom.dataset.roomId;
        if (!selectedRoomId) {
            console.error("Error: Selected room does not have a valid ID.");
            return;
        }
    
        // Get the selected date
        let selectedDateElement = document.querySelector(".selected-date");
        if (!selectedDateElement) return;
    
        let selectedDate = parseInt(selectedDateElement.innerText);
        let selectedMonthCheck = selectedMonth + 1; // Ensure correct month format
        let selectedYearCheck = selectedYear;
    
        // Reset the UI before applying new reservations
        generateSeatGrid(selectedCapacity);
    
        try {
            // Fetch all seats for the selected lab
            const seatResponse = await fetch(`/api/seats?lab=${selectedRoomId}`);
            if (!seatResponse.ok) {
                throw new Error("Seat API request failed.");
            }
            const seatData = await seatResponse.json();
            console.log("Seat Data:", seatData);
    
            // Create a seat mapping `{ seatObjectId -> seatNumber }`
            let seatMap = {};
            seatData.forEach(seat => {
                seatMap[seat._id] = seat.seatNumber;
            });
    
            // Fetch reservations for the selected room and date
            const reservationResponse = await fetch(
                `/api/reservations?lab=${selectedRoomId}&date=${selectedYearCheck}-${selectedMonthCheck}-${selectedDate}`
            );
            if (!reservationResponse.ok) {
                throw new Error(`API request failed with status ${reservationResponse.status}`);
            }
    
            const reservations = await reservationResponse.json();
            console.log("Reservations Data:", reservations);
    
            // *Update the UI based on reservations
            document.querySelectorAll(".available-table tbody tr").forEach((row, rowIndex) => {
                if (rowIndex >= selectedCapacity) {
                    row.style.display = "none"; // Hide extra rows
                } else {
                    row.style.display = ""; // Ensure necessary rows are shown
    
                    row.querySelectorAll("td").forEach((cell, index) => {
                        let slotHour = 7 + Math.floor(index / 2);
                        let isFirstHalf = index % 2 === 0;
                        let timeSlot = `${slotHour}:${isFirstHalf ? "00" : "30"}`;
    
                        // Reset cell styling
                        cell.classList.remove("reserved-hour", "past-hour");
                        cell.style.backgroundColor = "";
                        cell.style.color = "";
                        cell.style.pointerEvents = "auto";
                        cell.innerHTML = "";
    
                        // Mark past time slots as unavailable
                        if (
                            selectedDate === currentDay &&
                            selectedMonthCheck === currentMonth + 1 &&
                            selectedYearCheck === currentYear
                        ) {
                            if (slotHour < currentHour || (slotHour === currentHour && isFirstHalf && currentMinutes >= 30)) {
                                cell.classList.add("past-hour");
                                cell.style.pointerEvents = "none";
                                cell.innerHTML = "X";
                            }
                        }
    
                        // Check reservations and update UI
                        reservations.forEach(reservation => {
                            let resSeatId = reservation.seat; // This is ObjectId
                            let resSeatNumber = seatMap[resSeatId]; // Convert to seat number
    
                            let resDate = new Date(reservation.date).toISOString().split("T")[0];
                            let selectedDateStr = `${selectedYearCheck}-${selectedMonthCheck.toString().padStart(2, "0")}-${selectedDate.toString().padStart(2, "0")}`;
    
                            if (resDate === selectedDateStr) {
                                let resStartTime = convertToDateTimeObject(reservation.date, reservation.startTime);
                                let resEndTime = convertToDateTimeObject(reservation.date, reservation.endTime);
                                let slotTime = convertToDateTimeObject(`${selectedYearCheck}-${selectedMonthCheck}-${selectedDate}`, timeSlot);
    
                                if (resSeatNumber === rowIndex + 1) { // Match seat number correctly
                                    if (slotTime >= resStartTime && slotTime < resEndTime) {
                                        cell.classList.add("reserved-hour");
                                        cell.style.backgroundColor = "red";
                                        cell.style.color = "white";
                                        //cell.style.pointerEvents = "none"; // Comment out to enable selectable
                                        cell.innerHTML = `R`;
                                    }
                                }
                            }
                        });
                    });
                }
            });
    
        } catch (error) {
            console.error(" Error fetching reservations:", error);
        }
    }
    
    
    // Call `updateSeatAvailability()` when switching rooms
    //document.addEventListener("click", () => {
    //    setTimeout(updateSeatAvailability, 200);
    //});
    
    
    document.addEventListener("click", () => {
    //    setTimeout(updateSeatAvailability, 100);
        window.scrollTo(window.scrollX, window.scrollY);
    });
    
    // Call the function when a date is selected
    document.addEventListener("click", () => {
        if (event.target.closest(".date") || event.target.closest(".room-item")) {
        setTimeout(updateSeatAvailability, 100); // Delay to ensure the selected date is detected
        //window.scrollTo(window.scrollX, window.scrollY);
        }
    });

    // Make Green Cells
    //document.addEventListener('DOMContentLoaded', () => {
    //    document.querySelectorAll('td').forEach(cell => {
    //       cell.addEventListener('click', () => cell.classList.toggle('highlight'));
    //    });
    //});

    // Reserving without logging in
    function promptLogin() {
        alert("Please log in to your school email account.");
        window.location.href = "/signup-login"; // Redirect to login page
        return;
    }

    document.addEventListener("DOMContentLoaded", function() {
        document.getElementById("login-reserve-room-btn").addEventListener("click", promptLogin);
    });
    
    
    // Reserve room function
    async function reserveRoom() {
        try {
            // Fetch the current user's ID from the session using the API
            const userResponse = await fetch('/api/current-user-id');

            if (!userResponse.ok) {
                const errText = await userResponse.text();
                console.error("User fetch failed:", errText);
                alert("Could not determine current user session. Try re-logging in.");
                return;
            }
            
            const currentUserData = await userResponse.json();
            
            if (!currentUserData.success || !currentUserData.userId) {
                alert("You must be logged in to make a reservation.");
                window.location.href = "/signup-login"; // Redirect to login page
                return;
            }
    
            // Store the user ID as an object
            const currentUser = {
                _id: currentUserData.userId,
                role: currentUserData.role
            };
    
            // Get selected lab room
            const selectedRoom = document.querySelector(".selected-room");
            if (!selectedRoom) {
                alert("Please select a lab room first.");
                return;
            }
    
            const labId = selectedRoom.dataset.roomId; // Get the selected Lab ID
            const selectedLabName = selectedRoom.innerText;
    
            // Get the selected date
            const selectedDateElement = document.querySelector(".selected-date");
            if (!selectedDateElement) {
                alert("Please select a date first.");
                return;
            }
    
            const selectedDate = selectedDateElement.innerText;
            const reservationDate = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${selectedDate.padStart(2, "0")}`;
    
            // Get the selected seat number
            const seatDropdown = document.getElementById("seat-selection");
            const selectedSeatNumber = seatDropdown.value;
            if (!selectedSeatNumber) {
                alert("Please select a seat.");
                return;
            }
    
            // Get the selected start and end times
            const startTimeDropdown = document.getElementById("start-time");
            const endTimeDropdown = document.getElementById("end-time");
    
            const selectedStartTime = startTimeDropdown.value;
            const selectedEndTime = endTimeDropdown.value;
    
            if (!selectedStartTime || !selectedEndTime) {
                alert("Please select both start and end times.");
                return;
            }
    
            // Check if "Reserve Anonymously" checkbox is checked
            const anonymousCheckbox = document.getElementById("anonymous-checkbox");
            const isAnonymous = anonymousCheckbox.checked;
            
            // Check if the current user is a LabTech and handle student email
            let userIdForReservation = currentUser._id; // Default to the current user's ID
            if (currentUser.role === "labtech") {
                const studentEmailInput = document.getElementById("student-email");

                if (!studentEmailInput || !studentEmailInput.value.trim()) {
                    alert("Please enter the student's email.");
                    return;
                }

                const studentEmail = studentEmailInput.value.trim();

                // Checks if email uses @dlsu.edu.ph
                const emailPattern = /^[a-zA-Z0-9._-]+@dlsu\.edu\.ph$/;
                if (!emailPattern.test(studentEmail)) {
                    alert("Please enter a valid DLSU email (e.g., student@dlsu.edu.ph).");
                    return;
                }

                // Fetch user data by email to get the user ID for the reservation
                const emailResponse = await fetch(`/api/users/find-by-email?email=${studentEmail}`);
                const emailData = await emailResponse.json();

                if (emailData.success && emailData.data.length > 0) {
                    const student = emailData.data[0];
                    //Checks if email entered is a student account
                    if (student.role !== "student") {
                        alert("This email is not associated with a student account.");
                        return;
                    }
                    userIdForReservation = student._id;
                    //userIdForReservation = emailData.data[0]._id; // Assign the found user ID
                } else {
                    alert("No user found with that email.");
                    return;
                }
            }

            // Fetch the seat ObjectId from DB using seat number and lab ID
            const seatResponse = await fetch(`/api/seats?lab=${labId}&seatNumber=${selectedSeatNumber}`);
            if (!seatResponse.ok) {
                throw new Error("Failed to fetch seat data.");
            }
    
            const seatData = await seatResponse.json();
            if (!seatData || !seatData._id) {
                alert("Error: Selected seat not found in the database.");
                return;
            }
    
            const selectedSeatId = seatData._id; // Extract seat ObjectId
    
            // Construct the reservation object
            const reservationData = {
                name: `Reservation for ${selectedLabName}`,
                user: userIdForReservation,  // Use the session's user ID, updated to check if labtech or student role
                isAnonymous: isAnonymous,
                lab: labId,
                seat: selectedSeatId, // Store Seat ObjectId
                date: reservationDate,
                startTime: selectedStartTime,
                endTime: selectedEndTime,
                status: "approved"  // Default status
            };
    
            // Send reservation to backend
            const response = await fetch("/api/reserveroom", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reservationData)
            });
    
            if (!response.ok) {
                throw new Error(`Reservation failed. Status: ${response.status}`);
            }
    
            const result = await response.json();
            alert(`Reservation successful! 
                \nLab: ${selectedLabName}
                \nSeat: ${selectedSeatNumber}
                \nDate: ${reservationDate}
                \nTime: ${selectedStartTime} - ${selectedEndTime}`);
    
            // Refresh seat availability after booking
            updateSeatAvailability();
    
        } catch (error) {
            console.error("Error making reservation:", error);
            alert("Error making reservation. Please try again.");
        }
    }
    
    // Assign function globally so it works with the button
    window.reserveRoom = reserveRoom;
    
    function populateReservationDropdowns() {
        const seatDropdown = document.getElementById("seat-selection");
        const startTimeDropdown = document.getElementById("start-time");
        const endTimeDropdown = document.getElementById("end-time");
    
        if (!seatDropdown || !startTimeDropdown || !endTimeDropdown) return;
    
        // Save the currently selected values
        const previousSeat = seatDropdown.value;
        const previousStartTime = startTimeDropdown.value;
        const previousEndTime = endTimeDropdown.value;
    
        // Clear existing dropdown options
        seatDropdown.innerHTML = "";
        startTimeDropdown.innerHTML = "";
        endTimeDropdown.innerHTML = "";
    
        // Get selected room
        const selectedRoom = document.querySelector(".selected-room");
        if (!selectedRoom) return;
    
        let seatCapacity = parseInt(selectedRoom.dataset.capacity, 10);
    
        // Populate seat dropdown
        for (let i = 1; i <= seatCapacity; i++) {
            let option = document.createElement("option");
            option.value = i;
            option.textContent = `Seat ${i}`;
            seatDropdown.appendChild(option);
        }
    
        // Restore previous seat selection if still valid
        if (seatDropdown.querySelector(`option[value="${previousSeat}"]`)) {
            seatDropdown.value = previousSeat;
        }
    
        // Generate time slots (7:00 AM - 6:00 PM)
        const startHour = 7;
        const endHour = 18;
        const timeSlots = [];
    
        for (let hour = startHour; hour < endHour; hour++) {
            timeSlots.push(`${hour}:00`, `${hour}:30`);
        }
    
        // Populate start time dropdown
        timeSlots.forEach(time => {
            let option = document.createElement("option");
            option.value = time;
            option.textContent = time;
            startTimeDropdown.appendChild(option);
        });
    
        // Restore previous start time selection if still valid
        if (startTimeDropdown.querySelector(`option[value="${previousStartTime}"]`)) {
            startTimeDropdown.value = previousStartTime;
        }
    
        // Function to populate end time dropdown dynamically
        function updateEndTimeOptions() {
            endTimeDropdown.innerHTML = "";
            let selectedIndex = startTimeDropdown.selectedIndex;
    
            for (let i = selectedIndex + 1; i < timeSlots.length; i++) {
                let option = document.createElement("option");
                option.value = timeSlots[i];
                option.textContent = timeSlots[i];
                endTimeDropdown.appendChild(option);
            }
    
            // Restore previous end time selection if still valid
            if (endTimeDropdown.querySelector(`option[value="${previousEndTime}"]`)) {
                endTimeDropdown.value = previousEndTime;
            }
        }
    
        // Update end time dropdown when start time changes
        startTimeDropdown.addEventListener("change", updateEndTimeOptions);
    
        // Initialize end time options
        updateEndTimeOptions();
    }
    
    // Call function when a room is selected
    document.addEventListener("click", () => {
        setTimeout(populateReservationDropdowns, 100);
    });
    
    async function generateReservationInfo() {
        try {
            console.log("Fetching reservation data...");
    
            // Get selected lab room
            const selectedRoom = document.querySelector(".selected-room");
            if (!selectedRoom) {
                console.warn("No room selected.");
                return;
            }
    
            const selectedRoomId = selectedRoom.dataset.roomId;
            if (!selectedRoomId) {
                console.error("Error: Selected room does not have a valid ID.");
                return;
            }
    
            // Get the selected date
            const selectedDateElement = document.querySelector(".selected-date");
            if (!selectedDateElement) {
                console.warn("No date selected.");
                return;
            }
    
            const selectedDate = parseInt(selectedDateElement.innerText);
            const selectedMonthCheck = selectedMonth + 1;
            const selectedYearCheck = selectedYear;
            const formattedDate = `${selectedYearCheck}-${selectedMonthCheck.toString().padStart(2, "0")}-${selectedDate.toString().padStart(2, "0")}`;
    
            console.log(`Selected Date: ${formattedDate}`);
    
            // Fetch all seats for the selected lab
            const seatResponse = await fetch(`/api/seats?lab=${selectedRoomId}`);
            if (!seatResponse.ok) throw new Error("Seat API request failed.");
            const seatData = await seatResponse.json();
    
            // Create seat mapping `{ seatObjectId -> seatNumber }`
            let seatMap = {};
            seatData.forEach(seat => {
                seatMap[seat._id] = seat.seatNumber;
            });
    
            // Fetch reservations for the selected room and date
            const reservationResponse = await fetch(
                `/api/reservations?lab=${selectedRoomId}&date=${formattedDate}`
            );
            if (!reservationResponse.ok) {
                throw new Error(`API request failed with status ${reservationResponse.status}`);
            }
    
            const reservations = await reservationResponse.json();
            console.log("Reservations Data:", reservations);
    
            // Ensure previous event listeners are removed before adding new ones
            const availabilityTable = document.querySelector(".available-table tbody");
            const newTable = availabilityTable.cloneNode(true);
            availabilityTable.parentNode.replaceChild(newTable, availabilityTable);
    
            // Attach event listener for clicking on reserved slots
            newTable.addEventListener("click", function (event) {
                let cell = event.target;
    
                //console.log("Cell clicked:", cell);
    
                // Ensure only reserved cells trigger this function
                if (!cell.classList.contains("reserved-hour")) {
                    console.warn("Clicked cell is not reserved.");
                    return;
                }
                
                // Seating table
                // Get clicked column index
                const columnIndex = Array.from(cell.parentNode.children).indexOf(cell);
    
                // Get time from column index
                const slotHour = 7 + Math.floor(columnIndex / 2);
                const isFirstHalf = columnIndex % 2 === 0;
                const clickedTime = `${slotHour}:${isFirstHalf ? "00" : "30"}`;
    
                // Get clicked row index (seat number)
                const rowIndex = Array.from(cell.parentNode.parentNode.children).indexOf(cell.parentNode);
                const seatNumber = rowIndex + 1;
    
                //console.log(`Clicked Seat: ${seatNumber}, Time: ${clickedTime}, Date: ${formattedDate}`);
    
                // Find matching reservation
                const matchingReservation = reservations.find(reservation => {
                    let resSeatNumber = seatMap[reservation.seat]; // Convert seat ID to seat number
                    let resStartTime = convertToDateTimeObject(reservation.date, reservation.startTime);
                    let resEndTime = convertToDateTimeObject(reservation.date, reservation.endTime);
                    let slotTime = convertToDateTimeObject(formattedDate, clickedTime);
    
                    return (
                        resSeatNumber === seatNumber &&
                        slotTime >= resStartTime &&
                        slotTime < resEndTime
                    );
                });
        
                // Ensure the reservation info container exists
                let infoContainer = document.getElementById("reserve-details-container");
                if (!infoContainer) {      

                    // Create the container dynamically
                    infoContainer = document.createElement("div");
                    infoContainer.id = "reservation-info-container";
                    infoContainer.classList.add("reservation-info-container");
    
                    const parentContainer = document.getElementById("reservation-details-container") || document.body;
                    parentContainer.appendChild(infoContainer);
                }
    
                // Update reservation info UI
                if (matchingReservation) {
                    const isAnonymous = matchingReservation.isAnonymous === true;
                    const userId = matchingReservation.user?._id;
                    const userName = isAnonymous ? "Anonymous" : matchingReservation.user?.name || "Unknown User";
    
                    // Create user profile link
                    let userProfileLink = isAnonymous
                        ? "Anonymous"
                        : `<a href="/profile/${userId}" style="color: blue; text-decoration: underline;">${userName}</a>`;
    
                    infoContainer.innerHTML = `
                        <h3>Reservation Details</h3>
                        <p><strong>Reserved By:</strong> ${userProfileLink}</p>
                        <p><strong>Lab:</strong> ${selectedRoom.innerText}</p>
                        <p><strong>Seat:</strong> ${seatNumber}</p>
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <p><strong>Time:</strong> ${matchingReservation.startTime} - ${matchingReservation.endTime}</p>
                    `;
                } else {
                    console.warn("No matching reservation found.");
                    infoContainer.innerHTML = `<p>No reservation found for this time slot.</p>`;
                }
            });
    
        } catch (error) {
            console.error("Error fetching reservation info:", error);
        }
    }
    
    // Call function when a date or room is selected
    document.addEventListener("click", () => {
        if (event.target.closest(".date") || event.target.closest(".room-item")) {
            console.log("📢 Date or room changed. Updating reservations...");
            setTimeout(generateReservationInfo, 100);
        }
    });

    generateCalendar();
    generateRoomList();
    window.reserveRoom = reserveRoom;
    window.changeMonth = changeMonth;
});