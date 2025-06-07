function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const mobileMenuPanel = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenuPanel) {
        menuBtn.addEventListener('click', () => {
            mobileMenuPanel.classList.add('visible');
            mobileMenuPanel.classList.remove('hidden');
            menuBtn.setAttribute('aria-expanded', 'true');
        });
    }

    if (closeBtn && mobileMenuPanel) {
        closeBtn.addEventListener('click', () => {
            mobileMenuPanel.classList.remove('visible');
            mobileMenuPanel.classList.add('hidden');
            if (menuBtn) {
                menuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    document.addEventListener('click', (event) => {
        if (mobileMenuPanel && mobileMenuPanel.classList.contains('visible')) {
            const isClickInsideMenu = mobileMenuPanel.contains(event.target);
            const isClickOnMenuButton = menuBtn ? menuBtn.contains(event.target) : false;

            if (!isClickInsideMenu && !isClickOnMenuButton) {
                mobileMenuPanel.classList.remove('visible');
                mobileMenuPanel.classList.add('hidden');
                if (menuBtn) {
                    menuBtn.setAttribute('aria-expanded', 'false');
                }
            }
        }
    });

    function getWeekOfYear(date) {
        const targetDate = new Date(date.valueOf());
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const dayOfYear = ((targetDate - startOfYear) / 86400000) + 1;
        const jan1Day = (startOfYear.getDay() === 0) ? 7 : startOfYear.getDay();
        const weekNumber = Math.ceil((dayOfYear + jan1Day - 1) / 7);
        return weekNumber;
    }

    let allNationalHolidaysData = {};
    let allCalendarGridHolidaysData = {};
    let allCvSUEventsData = {};
    let allCalendarGridEventsData = {};
    let allSpecificGoldDatesData = {};
    let rawEventData = {};
    let eventHighlightsData = [];

    const categoriesToDisplay = ['Event'];

    async function fetchCalendarData() {
        try {
            const response = await fetch('../json/calendar_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allNationalHolidaysData = data.allNationalHolidays || {};
            allCalendarGridHolidaysData = data.allCalendarGridHolidays || {};
            allCvSUEventsData = data.allCvSUEvents || {};
            allCalendarGridEventsData = data.allCalendarGridEvents || {};
            allSpecificGoldDatesData = data.allSpecificGoldDates || {};
            console.log("Calendar data (including CvSU events) loaded successfully.");
            return true;
        } catch (error) {
            console.error("Could not fetch calendar data:", error);
            allNationalHolidaysData = {};
            allCalendarGridHolidaysData = {};
            allCvSUEventsData = {};
            allCalendarGridEventsData = {};
            allSpecificGoldDatesData = {};
            return false;
        }
    }

    async function fetchAllEventData() {
        try {
            const response = await fetch('../json/events_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            rawEventData = await response.json();
            console.log("Raw event data for highlights loaded successfully:", rawEventData);
            return true;
        } catch (error) {
            console.error("Could not fetch all event data for highlights:", error);
            rawEventData = {};
            return false;
        }
    }

    function renderListedEventsAndHolidays(year, month) {
        const listElement = document.getElementById('nationalHolidaysList');
        if (!listElement) {
            console.error("National holidays & events list element not found.");
            return;
        }

        listElement.innerHTML = '';

        const monthKey = `${year}-${month}`;
        const nationalHolidaysForMonth = allNationalHolidaysData[monthKey] || [];
        const cvsuEventsForMonth = allCvSUEventsData[monthKey] || [];

        let combinedList = [];

        nationalHolidaysForMonth.forEach(holiday => {
            combinedList.push({ ...holiday, type: 'holiday' });
        });

        cvsuEventsForMonth.forEach(event => {
            combinedList.push({ ...event, type: 'cvsu_event' });
        });
        
        if (combinedList.length > 0) {
            combinedList.forEach(item => {
                const listItem = document.createElement('li');
                const dateSpan = document.createElement('span');
                
                if (item.type === 'holiday') {
                    dateSpan.classList.add('holiday-date');
                } else if (item.type === 'cvsu_event') {
                    dateSpan.classList.add('cvsu-event-date-text');
                }
                dateSpan.textContent = item.dateText;

                const nameSpan = document.createElement('span');
                if (item.type === 'holiday') {
                    nameSpan.classList.add('holiday-name');
                } else {
                    nameSpan.classList.add('event-name');
                }
                nameSpan.textContent = item.eventName;

                listItem.appendChild(dateSpan);
                listItem.appendChild(document.createTextNode(' '));
                listItem.appendChild(nameSpan);
                listElement.appendChild(listItem);
            });
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = "No holidays or CvSU events listed for this month.";
            listItem.style.fontStyle = "italic";
            listElement.appendChild(listItem);
        }
    }

    function renderEventHighlights() {
        const eventHighlightsContainer = document.querySelector('.event-highlights');
        if (!eventHighlightsContainer) {
            console.error("Event highlights container not found.");
            return;
        }

        const existingCards = eventHighlightsContainer.querySelectorAll('.event-card');
        existingCards.forEach(card => card.remove());
        
        const existingMessages = eventHighlightsContainer.querySelectorAll('p.status-message');
        existingMessages.forEach(msg => msg.remove());

        const highlightsToDisplay = eventHighlightsData.slice(0, 2);

        if (highlightsToDisplay.length > 0) {
            highlightsToDisplay.forEach(event => {
                const card = document.createElement('div');
                card.classList.add('event-card');

                const img = document.createElement('img');
                img.src = event.imgSrc;
                img.alt = event.altText || event.title;
                img.onerror = function() { this.src='https://placehold.co/300x180/333333/DAA520?text=Image+Error'; };

                const title = document.createElement('h4');
                title.textContent = event.title;

                const description = document.createElement('p');
                description.textContent = event.description;

                card.appendChild(img);
                card.appendChild(title);
                card.appendChild(description);
                eventHighlightsContainer.appendChild(card);
            });
        } else {
            const noEventsMessage = document.createElement('p');
            noEventsMessage.classList.add('status-message');
            noEventsMessage.textContent = `No event highlights available for the selected categories: ${categoriesToDisplay.join(', ')}.`;
            noEventsMessage.style.textAlign = "center";
            noEventsMessage.style.padding = "10px";
            eventHighlightsContainer.appendChild(noEventsMessage);
        }
    }

    const monthYearElement = document.getElementById('monthYear');
    const calendarBody = document.getElementById('calendarBody');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');

    let currentDisplayDate = new Date(2025, 5, 1);

    function renderCalendar() {
        if (!monthYearElement || !calendarBody) {
            console.error("Calendar elements (monthYear or calendarBody) not found.");
            return;
        }

        calendarBody.innerHTML = '';
        const year = currentDisplayDate.getFullYear();
        const month = currentDisplayDate.getMonth();

        renderListedEventsAndHolidays(year, month);

        const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
        monthYearElement.textContent = `${monthNames[month]}`;

        const firstDayOfMonthDateObj = new Date(year, month, 1);
        const firstDayOfMonthDOW = firstDayOfMonthDateObj.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const prevMonthDateObj = new Date(year, month, 0);
        const daysInPrevMonth = prevMonthDateObj.getDate();

        let startingDayIndex = (firstDayOfMonthDOW === 0) ? 6 : firstDayOfMonthDOW - 1;

        let dateCounter = 1;
        let nextMonthDateCounter = 1;

        const currentMonthGridHolidays = allCalendarGridHolidaysData[`${year}-${month}`] || {};
        const currentMonthCvSUEventsGrid = allCalendarGridEventsData[`${year}-${month}`] || {};
        const currentMonthSpecificGoldDatesRaw = allSpecificGoldDatesData[`${year}-${month}`] || [];
        const specificGoldDaysForMonth = Array.isArray(currentMonthSpecificGoldDatesRaw) ? currentMonthSpecificGoldDatesRaw : [];

        const gridStartDate = new Date(year, month, 1 - startingDayIndex);

        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');
            
            const identifierCell = document.createElement('td');
            identifierCell.classList.add('calendar-row-identifier');
            const firstDateOfCurrentRow = new Date(gridStartDate);
            firstDateOfCurrentRow.setDate(gridStartDate.getDate() + i * 7);
            const weekNumber = getWeekOfYear(firstDateOfCurrentRow);
            identifierCell.textContent = weekNumber < 10 ? `0${weekNumber}` : weekNumber.toString();
            row.appendChild(identifierCell);

            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                let cellText = "";

                if (i === 0 && j < startingDayIndex) {
                    const day = daysInPrevMonth - startingDayIndex + j + 1;
                    cellText = day;
                    cell.classList.add('prev-next-month');
                } else if (dateCounter > daysInMonth) {
                    cellText = nextMonthDateCounter;
                    cell.classList.add('prev-next-month');
                    nextMonthDateCounter++;
                } else {
                    cellText = dateCounter;
                    cell.classList.add('current-month');
                    cell.setAttribute('data-day', dateCounter);

                    const holidayKey = `${month}_${dateCounter}`;
                    
                    if (currentMonthGridHolidays[holidayKey]) {
                        cell.classList.add('specific-red-date');
                    } else if (currentMonthCvSUEventsGrid[holidayKey]) {
                        cell.classList.add('cvsu-event-date');
                    } else {
                        if (specificGoldDaysForMonth.includes(dateCounter)) {
                            cell.classList.add('specific-gold-date');
                        }
                        if ((j === 5 || j === 6) &&
                            !cell.classList.contains('specific-red-date') &&
                            !cell.classList.contains('cvsu-event-date') &&
                            !cell.classList.contains('specific-gold-date')) {
                            cell.classList.add('specific-gold-date');
                        }
                    }
                    dateCounter++;
                }
                cell.textContent = cellText;
                row.appendChild(cell);
            }
            calendarBody.appendChild(row);

            if (dateCounter > daysInMonth && (startingDayIndex + daysInMonth) <= ((i + 1) * 7)) {
                 let totalCellsFilledForCurrentMonth = startingDayIndex + daysInMonth;
                 if (totalCellsFilledForCurrentMonth <= (i + 1) * 7) {
                     if (i >= 3 && nextMonthDateCounter > 1) { 
                         break;
                     }
                 }
            }
        }
    }

    async function initializeApp() {
        const calendarDataLoaded = await fetchCalendarData();
        const allEventDataSuccessfullyFetched = await fetchAllEventData();

        if (allEventDataSuccessfullyFetched) {
            let combinedEventItems = [];
            if (rawEventData.featuredItems && Array.isArray(rawEventData.featuredItems)) {
                combinedEventItems = combinedEventItems.concat(rawEventData.featuredItems);
            }
            if (rawEventData.announcements && Array.isArray(rawEventData.announcements)) {
                combinedEventItems = combinedEventItems.concat(rawEventData.announcements);
            }

            eventHighlightsData = combinedEventItems.filter(event =>
                event.category && categoriesToDisplay.includes(event.category)
            );

            console.log(`Filtered events for highlights [${categoriesToDisplay.join(', ')}]:`, eventHighlightsData);
            renderEventHighlights();
        } else {
            renderEventHighlights(); 
        }

        if (calendarDataLoaded) {
            if (prevMonthButton && nextMonthButton) {
                prevMonthButton.addEventListener('click', () => {
                    currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
                    renderCalendar();
                });

                nextMonthButton.addEventListener('click', () => {
                    currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
                    renderCalendar();
                });
            }

            if (monthYearElement && calendarBody) {
                renderCalendar();
            } else {
                console.error("Cannot render calendar: monthYearElement or calendarBody not found after data load.");
            }
        } else {
            if (monthYearElement) monthYearElement.textContent = "Error loading calendar data";
            
            const listElement = document.getElementById('nationalHolidaysList');
            if(listElement) {
                listElement.innerHTML = '<li>Error loading event and holiday data.</li>';
            }
            console.error("Calendar initialization failed due to data loading error.");
        }
    }

    initializeApp();
});