document.addEventListener('DOMContentLoaded', () => {
    const weatherDataUrl = '../json/weather.json';

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
        }
    }

    function updateWeatherUI(data) {
        const currentTempEl = document.querySelector('.forecast-card .current-temp');
        const feelsLikeTempEl = document.querySelector('.forecast-card .feels-like-temp');

        if (currentTempEl) {
            currentTempEl.innerHTML = `${data.currentWeather.temperature}<span class="degree">°</span>`;
        }
        if (feelsLikeTempEl) {
            feelsLikeTempEl.innerHTML = `feels like ${data.currentWeather.feelsLike}<span class="degree">°</span>`;
        }

        const forecastItems = document.querySelectorAll('.forecast-list .forecast-item');
        data.dailyForecast.forEach((item, index) => {
            if (forecastItems[index]) {
                const tempEl = forecastItems[index].querySelector('.temp');
                const dayEl = forecastItems[index].querySelector('.date-info .day');
                const dateEl = forecastItems[index].querySelector('.date-info .date');

                if (tempEl) {
                    tempEl.innerHTML = `${item.temp}<span class="degree">°</span>`;
                }
                if (dayEl) {
                    dayEl.textContent = item.day;
                }
                if (dateEl) {
                    dateEl.textContent = item.date;
                }
            }
        });

        const campusTextEl = document.querySelector('.main-weather .campus-text');
        const weatherIconEl = document.querySelector('.sun-container img');

        if (campusTextEl) {
            campusTextEl.textContent = data.locationName;
        }
        if (weatherIconEl) {
            weatherIconEl.src = `../assets/images/weather/${data.currentWeather.weatherIcon}`;
            weatherIconEl.alt = `${data.currentWeather.weatherIcon.split('.')[0]} weather icon`;
        }

        const conditionItems = document.querySelectorAll('.current-conditions .condition-item');
        if (conditionItems.length >= 3) {
            const uvValueEl = conditionItems[0].querySelector('.condition-value');
            if (uvValueEl) {
                uvValueEl.textContent = data.currentWeather.uvIndex;
            }

            const windValueEl = conditionItems[1].querySelector('.condition-value');
            if (windValueEl) {
                windValueEl.textContent = data.currentWeather.windSpeed;
            }

            const rainValueEl = conditionItems[2].querySelector('.condition-value');
            if (rainValueEl) {
                rainValueEl.innerHTML = `${data.currentWeather.chanceOfRain}<span class="percent">%</span>`;
            }
        }
    }

    fetchWeatherData();
});