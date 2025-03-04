// Real-time Clock
$(document).ready(function() {
    const clockContainer = document.getElementById("real-time-clock");
    const calendarGrid = document.getElementById("calendar");
    const currentMonthLabel = document.getElementById("current-month");
    const roomListContainer = document.getElementById("room-list");

    let currentDate = new Date();
    let selectedMonth = currentDate.getMonth();
    let selectedYear = currentDate.getFullYear();

    const availableRooms = [
        "Room 101 - Computer Lab",
        "Room 102 - Computer Lab",
        "Room 103 - Computer Lab",
        "Room 201 - Computer Lab",
        "Room 202 - Computer Lab",
        "Room 203 - Computer Lab",
        "Room 301 - Computer Lab",
        "Room 302 - Computer Lab"
    ];

    function updateClock() {
        const now = new Date();
        clockContainer.innerHTML = now.toLocaleDateString() + " | " + now.toLocaleTimeString();
    }

    // Drop down event listener
    document.addEventListener("DOMContentLoaded", function() {
        console.log("📢 Fetching buildings from API...");
    fetch('/api/buildings')  // Calls the API route from `server/routes/buildings.js`
        .then(response => response.json())
        .then(buildings => {
            const dropdown = document.getElementById('dropbtn');
            
            // Populate the dropdown with only building names
            dropdown.innerHTML = buildings.map(building => 
                `<option value="${building.name}">${building.name}</option>`
            ).join('');
        })
        .catch(error => console.error('Error fetching buildings:', error));
});
    
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

    function generateRoomList() {
    roomListContainer.innerHTML = "";
    const roomAvailabilityHeader = document.getElementById("room-availability");

    availableRooms.forEach(room => {
        let roomDiv = document.createElement("div");
        roomDiv.className = "room-item";
        roomDiv.innerText = room;

        roomDiv.addEventListener("click", function () {
            document.querySelectorAll(".room-item").forEach(r => r.classList.remove("selected-room"));
            this.classList.add("selected-room");

            roomAvailabilityHeader.innerText = `Seat availability at ${room}`;
        });

        roomListContainer.appendChild(roomDiv);
    });
}

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('td').forEach(cell => {
            cell.addEventListener('click', () => cell.classList.toggle('highlight'));
        });
    });

    function updateSeatAvailability() {
    let now = new Date();
    let currentHour = now.getHours();
    let currentMinutes = now.getMinutes();
    let currentDay = now.getDate();
    let currentMonth = now.getMonth();
    let currentYear = now.getFullYear();

    document.querySelectorAll(".available-table tbody tr").forEach((row) => {
        document.querySelectorAll('.available-table td').forEach(cell => {
            cell.addEventListener('click', () => {
                cell.classList.toggle('highlight');
            });
        });
        
        row.querySelectorAll("td").forEach((cell, index) => {
            let slotHour = 7 + Math.floor(index / 2); // Convert index to 24-hour format
            let isFirstHalf = index % 2 === 0; // True if it's the first 30-min slot, False if second

            // Get selected date from the highlighted calendar date
            let selectedDateElement = document.querySelector(".selected-date");
            if (!selectedDateElement) return;

            let selectedDate = parseInt(selectedDateElement.innerText);
            let selectedMonthCheck = selectedMonth;
            let selectedYearCheck = selectedYear;

            // Disable past hours for today only
            if (
                selectedDate === currentDay &&
                selectedMonthCheck === currentMonth &&
                selectedYearCheck === currentYear
            ) {
                if (slotHour < currentHour) {
                    // If the full hour has passed, disable both slots
                    cell.classList.add("past-hour");
                    cell.style.pointerEvents = "none";
                    cell.innerHTML = "X";
                } else if (slotHour === currentHour) {
                    // If it's the current hour, disable only the first half
                    if (isFirstHalf && currentMinutes >= 30) {
                        cell.classList.add("past-hour");
                        cell.style.pointerEvents = "none";
                        cell.innerHTML = "X";
                    }
                }
            } else {
                // Future time slots remain selectable
                cell.classList.remove("past-hour");
                cell.style.pointerEvents = "auto";
                if (!cell.classList.contains("highlight")) {
                    cell.innerHTML = "";
                }                
            }
        });
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
}

// Call the function when a date is selected
document.addEventListener("click", () => {
    setTimeout(updateSeatAvailability, 100); // Delay to ensure the selected date is detected
    window.scrollTo(window.scrollX, window.scrollY);
});

    generateCalendar();
    generateRoomList();
    window.changeMonth = changeMonth;
});