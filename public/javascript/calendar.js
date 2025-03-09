// Real-time Clock
$(document).ready(function() {
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

    function changeMonth(offset) {
        selectedMonth += offset;
        generateCalendar();
    }

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
                cell.dataset.timeSlot = j;
                cell.addEventListener("click", function () {
                    this.classList.toggle("highlight");
                });
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


    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('td').forEach(cell => {
            cell.addEventListener('click', () => cell.classList.toggle('highlight'));
        });
    });

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
            // Fetch reservations for the selected room and date
            const response = await fetch(`/api/reservations?lab=${selectedRoomId}&date=${selectedYearCheck}-${selectedMonthCheck}-${selectedDate}`);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
    
            const reservations = await response.json();
    
            // Loop through the seat availability grid
            document.querySelectorAll(".available-table tbody tr").forEach((row, rowIndex) => {
                if (rowIndex >= selectedCapacity) {
                    row.style.display = "none"; // Hide extra rows
                } else {
                    row.style.display = ""; // Ensure necessary rows are shown
    
                    row.querySelectorAll("td").forEach((cell, index) => {
                        let slotHour = 7 + Math.floor(index / 2);
                        let isFirstHalf = index % 2 === 0;
                        let timeSlot = `${slotHour}:${isFirstHalf ? "00" : "30"}`;
    
                        // Clear previous reservations and past-hour classes
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
                            let resSeat = reservation.seat;
                            let resDate = new Date(reservation.date).toISOString().split("T")[0];
                            let selectedDateStr = `${selectedYearCheck}-${selectedMonthCheck.toString().padStart(2, "0")}-${selectedDate.toString().padStart(2, "0")}`;
    
                            if (resDate === selectedDateStr) {
                                let resStartTime = convertToDateTimeObject(reservation.date, reservation.startTime);
                                let resEndTime = convertToDateTimeObject(reservation.date, reservation.endTime);
                                let slotTime = convertToDateTimeObject(`${selectedYearCheck}-${selectedMonthCheck}-${selectedDate}`, timeSlot);
    
                                if (resSeat === rowIndex + 1) { // Match seat number
                                    if (slotTime >= resStartTime && slotTime < resEndTime) {
                                        cell.classList.add("reserved-hour");
                                        cell.style.backgroundColor = "red";  
                                        cell.style.color = "white";  
                                        cell.style.pointerEvents = "none";
                                        cell.innerHTML = `R`; 
                                    }
                                }
                            }
                        });
                    });
                }
            });
    
        } catch (error) {
            console.error("Error fetching reservations:", error);
        }
    }
    
    // Call `updateSeatAvailability()` when switching rooms
    document.addEventListener("click", () => {
        setTimeout(updateSeatAvailability, 200);
    });
    
    
    document.addEventListener("click", () => {
        setTimeout(updateSeatAvailability, 100);
        window.scrollTo(window.scrollX, window.scrollY);
    });
    
    
        // Temporary reserve room function
        function reserveRoom() {
            const roomList = document.getElementById('room-list').children;
            if (roomList.length === 0) {
                alert("No rooms available to reserve.");
                return;
            }
    
            const roomNames = [...roomList].map(room => room.textContent);
            const selectedRoom = prompt(`Select a room to reserve:\n${roomNames.join("\n")}`);
    
            if (selectedRoom && roomNames.includes(selectedRoom)) {
                alert(`Room "${selectedRoom}" has been reserved successfully!`);
                // implement actual reservation logic here (updating a database or UI)
            } else {
                alert("Invalid room selection.");
            }
        }

    // Call the function when a date is selected
    document.addEventListener("click", () => {
        setTimeout(updateSeatAvailability, 100); // Delay to ensure the selected date is detected
        window.scrollTo(window.scrollX, window.scrollY);
    });

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
    
    
    generateCalendar();
    generateRoomList();
    generateSeatGrid(capacity);
    window.reserveRoom = reserveRoom;
    window.changeMonth = changeMonth;
});