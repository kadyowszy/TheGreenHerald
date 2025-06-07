document.addEventListener('DOMContentLoaded', () => {
    const weatherDataUrl = '../json/weather.json'; // Path relative to the scripts folder

    async function fetchWeatherData() {
        try {
            const response = await fetch(weatherDataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            updateWeatherUI(data);
        } catch (error) {
            console.error("Could not fetch weather data:", error);
            // Optionally, display an error message to the user on the page
        }
    }

    function updateWeatherUI(data) {
        // Update "TODAY" section in the forecast card
        const currentTempEl = document.querySelector('.forecast-card .current-temp');
        const feelsLikeTempEl = document.querySelector('.forecast-card .feels-like-temp');
        
        if (currentTempEl) {
            currentTempEl.innerHTML = `${data.currentWeather.temperature}<span class="degree">°</span>`;
        }
        if (feelsLikeTempEl) {
            feelsLikeTempEl.innerHTML = `feels like ${data.currentWeather.feelsLike}<span class="degree">°</span>`;
        }

        // Update the 6-day forecast list
        const forecastItems = document.querySelectorAll('.forecast-list .forecast-item');
        data.dailyForecast.forEach((item, index) => {
            if (forecastItems[index]) {
                const tempEl = forecastItems[index].querySelector('.temp');
                const dayEl = forecastItems[index].querySelector('.date-info .day');
                const dateEl = forecastItems[index].querySelector('.date-info .date');

                if (tempEl) tempEl.innerHTML = `${item.temp}<span class="degree">°</span>`;
                if (dayEl) dayEl.textContent = item.day;
                if (dateEl) dateEl.textContent = item.date;
            }
        });

        // Update main weather section (campus name and weather icon)
        const campusTextEl = document.querySelector('.main-weather .campus-text');
        const weatherIconEl = document.querySelector('.sun-container img'); // Assuming it's still .sun-container

        if (campusTextEl) {
            campusTextEl.textContent = data.locationName;
        }
        if (weatherIconEl) {
            // Assuming icons are in ../assets/images/weather/ relative to weather.html
            // The script is in ../scripts/, so the path from script to assets is ../assets/
            weatherIconEl.src = `../assets/images/weather/${data.currentWeather.weatherIcon}`;
            weatherIconEl.alt = `${data.currentWeather.weatherIcon.split('.')[0]} weather icon`;
        }

        // Update current conditions
        const conditionItems = document.querySelectorAll('.current-conditions .condition-item');
        if (conditionItems.length >= 3) {
            // UV Index
            const uvValueEl = conditionItems[0].querySelector('.condition-value');
            if (uvValueEl) uvValueEl.textContent = data.currentWeather.uvIndex;

            // Wind Speed
            const windValueEl = conditionItems[1].querySelector('.condition-value');
            if (windValueEl) windValueEl.textContent = data.currentWeather.windSpeed;
            
            // Chance of Rain
            const rainValueEl = conditionItems[2].querySelector('.condition-value');
            if (rainValueEl) rainValueEl.innerHTML = `${data.currentWeather.chanceOfRain}<span class="percent">%</span>`;
        }
    }

    fetchWeatherData();
});
