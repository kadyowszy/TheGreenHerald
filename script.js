(function() {
    'use strict';

    const config = {
        googleApiKey: 'AIzaSyCnSSFVL8j2jYkfNFo7yPCFCO7yWkh5Pf0',
        accuWeatherApiKey: 'sFnPqC5sWxWuC2lBNpbsvGMZtbcug93n',

        calendars: {
            university: 'thegreenherald@gmail.com',
            holidays: 'en.philippines#holiday@group.v.calendar.google.com'
        },
        allowedHolidayNames: [
            "New Year's Day", "Araw ng Kagitingan", "Maundy Thursday", "Good Friday",
            "Labor Day", "Independence Day", "National Heroes Day", "Bonifacio Day",
            "Christmas Day", "Rizal Day", "Ninoy Aquino Day", "All Saints' Day",
            "Feast of the Immaculate Conception of Mary", "Last Day of the Year",
            "EDSA People Power Revolution Anniversary", "Chinese New Year",
            "Black Saturday", "Christmas Eve", "All Saints' Day Eve",
            "Eidul-Fitar", "Eid al-Adha"
        ],
        weather: {
            accuWeatherLocationKey: '262691',
            locationName: 'Indang',
            units: 'metric'
        },
        newsDataPath: '../json/news_data.json',
        display: {
            maxEventsForHeroBlocks: 7,
            maxEventsToShowInList: 15,
            maxEventsToFetchPerCalendar: 25,
            marqueeSeparator: '&nbsp;&nbsp;&nbsp;&nbsp;'
        },
        selectors: {
            menuBtn: '#menu-btn',
            closeBtn: '#close-btn',
            mobileMenu: '#mobile-menu',
            mobileNavLinks: '#mobile-menu nav a',
            calendarContainer: '#calendar-events',
            dateBlockPrefix: 'date-block-',
            monthPrefix: 'month-',
            dayPrefix: 'day-',
            locationPrefix: 'location-',
            marqueeInner: '.l-header__info__inner.js-auto-scroll__inner'
        },
        uiMessages: {
            loading: '<p>Loading calendar events...</p>',
            error: '<p>Could not load calendar events. Please try again later.</p>',
            errorGoogleConfig: '<p>Please configure Google API Key in script.js</p>',
            errorWeatherConfig: '<p>Please configure AccuWeather API Key and Location Key in script.js</p>',
            noEvents: '<p>No upcoming events or allowed holidays found.</p>',
            newsLoadingError: '<p>Could not load latest news.</p>'
        }
    };

    const elements = {
        menuBtn: document.querySelector(config.selectors.menuBtn),
        closeBtn: document.querySelector(config.selectors.closeBtn),
        mobileMenu: document.querySelector(config.selectors.mobileMenu),
        mobileNavLinks: document.querySelectorAll(config.selectors.mobileNavLinks),
        calendarContainer: document.querySelector(config.selectors.calendarContainer),
        marqueeInnerElements: document.querySelectorAll(config.selectors.marqueeInner)
    };

    let appState = {
        calendarEvents: [],
        weatherData: null,
        newsItems: []
    };

    // --- utility ---

    function formatEventDateParts(dateString) {
        const fallback = { full: dateString || 'Date N/A', month: '---', day: '--' };
        if (!dateString) return fallback;

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) throw new Error("Invalid Date object");

            const optionsFull = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
            if (dateString.includes('T')) {
                optionsFull.hour = 'numeric';
                optionsFull.minute = '2-digit';
            }
            const optionsMonth = { month: 'short' };
            const optionsDay = { day: '2-digit' };

            return {
                full: date.toLocaleDateString(undefined, optionsFull),
                month: date.toLocaleDateString(undefined, optionsMonth).toUpperCase(),
                day: date.toLocaleDateString(undefined, optionsDay)
            };
        } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return fallback;
        }
    }

    function getComparableDate(googleDateObj) {
        if (!googleDateObj) return null;

        try {
            const dateStr = googleDateObj.dateTime || googleDateObj.date;
            if (!dateStr) return null;

            if (googleDateObj.date && !googleDateObj.dateTime) {
                const parts = dateStr.split('-');
                return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            }
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        } catch (error) {
            console.error("Error creating comparable date:", googleDateObj, error);
            return null;
        }
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // --- updates ---

    function updateHeroDateBlocks(events) {
        for (let i = 0; i < config.display.maxEventsForHeroBlocks; i++) {
            const blockIndex = i + 1;
            const monthEl = document.getElementById(`${config.selectors.monthPrefix}${blockIndex}`);
            const dayEl = document.getElementById(`${config.selectors.dayPrefix}${blockIndex}`);
            const titleEl = document.getElementById(`${config.selectors.locationPrefix}${blockIndex}`);

            if (monthEl && dayEl && titleEl) {
                const event = events[i];
                if (event) {
                    const eventStartDateString = event.start?.dateTime || event.start?.date;
                    const eventTitle = event.summary || 'Upcoming Event';
                    const dateParts = formatEventDateParts(eventStartDateString);

                    monthEl.textContent = dateParts.month;
                    dayEl.textContent = dateParts.day;
                    titleEl.textContent = eventTitle;
                } else {
                    monthEl.textContent = '---';
                    dayEl.textContent = '--';
                    titleEl.textContent = 'No Event';
                }
            } else {
                console.warn(`Hero block elements not found for index: ${blockIndex}`);
            }
        }
    }

    function renderCalendarList(events) {
        if (!elements.calendarContainer) return;

        elements.calendarContainer.innerHTML = '';

        if (!events || events.length === 0) {
            elements.calendarContainer.innerHTML = config.uiMessages.noEvents;
            return;
        }

        const eventList = document.createElement('ul');
        eventList.className = 'events-list';

        const eventsToDisplay = events.slice(0, config.display.maxEventsToShowInList);

        eventsToDisplay.forEach(event => {
            const listItem = document.createElement('li');
            if (event.calendarSource === config.calendars.holidays) {
                listItem.classList.add('holiday-event');
            }

            const eventTitle = event.summary || 'Untitled Event';
            const eventStartDateString = event.start?.dateTime || event.start?.date;
            const eventDescription = event.description || '';
            const eventLocation = event.location || '';
            const formattedDate = formatEventDateParts(eventStartDateString).full;

            listItem.innerHTML = `
                <strong class="event-title">${escapeHtml(eventTitle)}</strong>
                <span class="event-date">${escapeHtml(formattedDate)}</span>
                ${eventLocation ? `<p class="event-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(eventLocation)}</p>` : ''}
                ${eventDescription ? `<p class="event-description">${escapeHtml(eventDescription).replace(/\n/g, '<br>')}</p>` : ''}
            `;
            eventList.appendChild(listItem);
        });
        elements.calendarContainer.appendChild(eventList);
    }

    // --- dito ung marquee ---

    function getCalendarMarqueeItemHtml(event) {
        if (!event) return null;

        const eventTitle = event.summary || 'Upcoming Event';
        const eventStartDateString = event.start?.dateTime || event.start?.date;
        const dateParts = formatEventDateParts(eventStartDateString);
        const eventLink = event.htmlLink || '#calendar';

        return `<a href="${escapeHtml(eventLink)}" target="_blank" rel="noopener noreferrer"><span class="latest-label">EVENT:</span> ${escapeHtml(eventTitle)} (${dateParts.month} ${dateParts.day})</a>`;
    }

    function getNewsMarqueeItemHtml(newsItem) {
        if (!newsItem) return null;

        const newsId = newsItem.id;
        const newsHeadline = newsItem.headline || 'Latest News';

        if (newsId) {
            return `<a href="../sections/article.html?id=${encodeURIComponent(newsId)}"><span class="latest-label">NEWS:</span> ${escapeHtml(newsHeadline)}</a>`;
        }
        return `<a href="#"><span class="latest-label">NEWS:</span> ${escapeHtml(newsHeadline)} (ID missing)</a>`;
    }

    function getWeatherMarqueeItemHtml(weatherData) {
        if (!weatherData || weatherData.temp === null || weatherData.temp === undefined) return null;

        const temp = Math.round(weatherData.temp);
        const unit = weatherData.unit;
        const desc = weatherData.description ? `, ${escapeHtml(weatherData.description)}` : '';
        const locationName = weatherData.location ? ` in ${escapeHtml(weatherData.location)}` : '';
        let feelsLikeString = '';

        if (weatherData.feelsLike !== null && weatherData.feelsLike !== undefined) {
            const feelsLikeTemp = Math.round(weatherData.feelsLike);
            feelsLikeString = `${desc ? ' ' : ', '} (Feels like ${feelsLikeTemp}${unit})`;
        }
        return `<a href="../sections/weather.html"><span class="latest-label">WEATHER:</span> ${temp}${unit}${desc}${feelsLikeString}${locationName}</a>`;
    }

    function updateMarqueeContent() {
        if (!elements.marqueeInnerElements || elements.marqueeInnerElements.length === 0) {
            console.warn("Marquee inner elements (.l-header__info__inner) not found.");
            return;
        }

        const marqueeItemsHtml = [];

        const eventHtml = getCalendarMarqueeItemHtml(appState.calendarEvents[0]);
        if (eventHtml) {
            marqueeItemsHtml.push(eventHtml);
        }

        const newsHtml = getNewsMarqueeItemHtml(appState.newsItems[0]);
        if (newsHtml) {
            marqueeItemsHtml.push(newsHtml);
        } else {
            marqueeItemsHtml.push(`<a href="#"><span class="latest-label">NEWS:</span> Not available</a>`);
        }

        const weatherHtml = getWeatherMarqueeItemHtml(appState.weatherData);
        if (weatherHtml) {
            marqueeItemsHtml.push(weatherHtml);
        } else {
            marqueeItemsHtml.push(`<a href="../sections/weather.html"><span class="latest-label">WEATHER:</span> Unavailable</a>`);
        }

        const finalMarqueeHtmlContent = marqueeItemsHtml.join(config.display.marqueeSeparator);

        elements.marqueeInnerElements.forEach(element => {
            element.innerHTML = finalMarqueeHtmlContent || 'Loading data...';
        });
    }

    // --- dito nakuha ng data ---

    async function fetchCalendarEvents(calendarId) {
        if (!calendarId) return [];
        if (!config.googleApiKey) {
            return [];
        }

        const timeMin = new Date().toISOString();
        const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${config.googleApiKey}&timeMin=${timeMin}&maxResults=${config.display.maxEventsToFetchPerCalendar}&singleEvents=true&orderBy=startTime`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error fetching calendar ${calendarId}: ${response.status} ${response.statusText}`, errorText);
                return [];
            }
            const data = await response.json();
            const items = data.items || [];
            items.forEach(item => item.calendarSource = calendarId);
            return items;
        } catch (error) {
            console.error(`Network/Fetch error for calendar ${calendarId}:`, error);
            return [];
        }
    }

    async function fetchWeatherData() {
        if (!config.accuWeatherApiKey || !config.weather.accuWeatherLocationKey) {
            console.warn(config.uiMessages.errorWeatherConfig);
            return null;
        }

        const locationKey = config.weather.accuWeatherLocationKey;
        const apiKey = config.accuWeatherApiKey;
        const apiUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                let errorDetails = '';
                try {
                    const errorData = await response.json();
                    errorDetails = errorData?.Message || response.statusText;
                } catch (e) {
                    errorDetails = response.statusText;
                }
                console.error(`Error fetching AccuWeather: ${response.status} ${errorDetails}`);
                return null;
            }
            const data = await response.json();

            if (!data || !Array.isArray(data) || data.length === 0) {
                console.error('AccuWeather response format unexpected or empty:', data);
                return null;
            }

            const currentConditions = data[0];
            const tempMetric = currentConditions.Temperature?.Metric?.Value;
            const tempImperial = currentConditions.Temperature?.Imperial?.Value;
            const feelsLikeMetric = currentConditions.RealFeelTemperature?.Metric?.Value;
            const feelsLikeImperial = currentConditions.RealFeelTemperature?.Imperial?.Value;
            const weatherText = currentConditions.WeatherText;
            const weatherIcon = currentConditions.WeatherIcon;

            const displayTemp = (config.weather.units === 'imperial' && tempImperial !== undefined) ? tempImperial : tempMetric;
            const displayUnit = (config.weather.units === 'imperial' && tempImperial !== undefined) ? '°F' : '°C';
            const displayFeelsLike = (config.weather.units === 'imperial' && tempImperial !== undefined) ? feelsLikeImperial : feelsLikeMetric;

            return {
                temp: displayTemp,
                unit: displayUnit,
                feelsLike: displayFeelsLike,
                description: weatherText,
                icon: weatherIcon,
                location: config.weather.locationName
            };
        } catch (error) {
            console.error('Network/Fetch error for AccuWeather:', error);
            return null;
        }
    }

    async function fetchAndProcessNewsData() {
        try {
            const response = await fetch(config.newsDataPath);
            if (!response.ok) {
                console.error(`Error fetching news data: ${response.status} ${response.statusText}`);
                appState.newsItems = [];
                return;
            }

            const jsonData = await response.json();
            const allNews = jsonData.articles;

            if (!Array.isArray(allNews)) {
                console.error('The "articles" property in news data is not an array or is missing:', allNews);
                appState.newsItems = [];
                return;
            }

            const latestNewsItem = allNews.find(item => item.layout_category === "latest");
            appState.newsItems = latestNewsItem ? [latestNewsItem] : [];
        } catch (error) {
            console.error('Error processing news data:', error);
            appState.newsItems = [];
        }
    }

    // --- dito nagpaprocess ng data ---

    async function processCalendarData() {
        if (!config.googleApiKey) {
            console.warn("Google API Key not configured.");
            if (elements.calendarContainer) elements.calendarContainer.innerHTML = config.uiMessages.errorGoogleConfig;
            updateHeroDateBlocks([]);
            return [];
        }

        if (elements.calendarContainer) elements.calendarContainer.innerHTML = config.uiMessages.loading;

        try {
            const calendarFetchPromises = Object.values(config.calendars).map(fetchCalendarEvents);
            const results = await Promise.allSettled(calendarFetchPromises);

            let combinedEvents = results
                .filter(r => r.status === 'fulfilled' && Array.isArray(r.value))
                .flatMap(r => r.value);

            const filteredEvents = combinedEvents.filter(event => {
                if (event.calendarSource === config.calendars.university) {
                    return true;
                }
                if (event.calendarSource === config.calendars.holidays) {
                    const eventSummary = (event.summary || "").trim();
                    return config.allowedHolidayNames.some(allowedName => allowedName.toLowerCase() === eventSummary.toLowerCase());
                }
                return false;
            });

            filteredEvents.sort((a, b) => {
                const dateA = getComparableDate(a.start);
                const dateB = getComparableDate(b.start);
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return dateA - dateB;
            });

            appState.calendarEvents = filteredEvents;
            updateHeroDateBlocks(appState.calendarEvents);
            renderCalendarList(appState.calendarEvents);
            return appState.calendarEvents;
        } catch (error) {
            console.error('Error processing calendar events:', error);
            if (elements.calendarContainer) elements.calendarContainer.innerHTML = config.uiMessages.error;
            updateHeroDateBlocks([]);
            return [];
        }
    }

    async function processWeatherData() {
        try {
            appState.weatherData = await fetchWeatherData();
            return appState.weatherData;
        }
        catch (error) {
            console.error("Error processing weather data:", error);
            appState.weatherData = null;
            return null;
        }
    }

    // --- mobile menu ---

    function openMenu() {
        if (elements.mobileMenu) {
            elements.mobileMenu.classList.remove('hidden');
            elements.mobileMenu.classList.add('visible');
            elements.menuBtn?.setAttribute('aria-expanded', 'true');
        }
    }

    function closeMenu() {
        if (elements.mobileMenu) {
            elements.mobileMenu.classList.remove('visible');
            elements.mobileMenu.classList.add('hidden');
            elements.menuBtn?.setAttribute('aria-expanded', 'false');
        }
    }

    function setupMenuListeners() {
        if (elements.menuBtn) {
            elements.menuBtn.addEventListener('click', openMenu);
        }

        if (elements.closeBtn) {
            elements.closeBtn.addEventListener('click', closeMenu);
        }

        elements.mobileNavLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('click', (event) => {
            if (elements.mobileMenu?.classList.contains('visible') &&
                !elements.mobileMenu.contains(event.target) &&
                event.target !== elements.menuBtn &&
                !elements.menuBtn?.contains(event.target)) {
                closeMenu();
            }
        });
    }

    // --- para mag run ---

    async function initialize() {
        setupMenuListeners();

        await Promise.allSettled([
            processCalendarData(),
            processWeatherData(),
            fetchAndProcessNewsData()
        ]);

        updateMarqueeContent();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();