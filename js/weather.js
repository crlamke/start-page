/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

// Weather boxes, one per entry in userConfig.weatherPreferences, using the
// OpenWeather "current weather" API. The API key is read from secrets.js
// (not kept in git); see secrets.example.js.

const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

class WeatherBox {
    constructor(title, bgColor, lat, lon, unit, itemNumber) {
        this.title = title;
        this.bgColor = bgColor;
        this.lat = lat;
        this.lon = lon;
        // "imperial" shows °F, "metric" shows °C. Click the temperature to switch.
        this.unit = (unit === "metric") ? "metric" : "imperial";
        this.itemNumber = itemNumber;
        this.temperature = null;  // last reading, in this.unit
        this.contentDiv = null;
        this.iconImg = null;
        this.temperatureDiv = null;
        this.descriptionDiv = null;
        this.locationDiv = null;
        this.rowDiv = null;
        this.messageDiv = null;
    }
}

function openWeatherApiKey() {
    if (typeof secrets === "undefined" || !secrets || !secrets.openWeatherApiKey) {
        return "";
    }
    return String(secrets.openWeatherApiKey).trim();
}

function createWeatherBox(wbox) {
    const box = createBox("weatherBox", "weatherBox" + wbox.itemNumber,
            wbox.title, wbox.bgColor);
    wbox.contentDiv = box.contentDiv;

    const row = document.createElement("div");
    row.className = "weatherRow";
    wbox.iconImg = document.createElement("img");
    wbox.iconImg.className = "weatherIcon";
    wbox.iconImg.alt = "";
    const values = document.createElement("div");
    values.className = "weatherValues";
    wbox.temperatureDiv = document.createElement("button");
    wbox.temperatureDiv.type = "button";
    wbox.temperatureDiv.className = "tempValue";
    wbox.temperatureDiv.title = "Click to switch between °F and °C";
    wbox.descriptionDiv = document.createElement("div");
    wbox.descriptionDiv.className = "weatherDescription";
    wbox.locationDiv = document.createElement("div");
    wbox.locationDiv.className = "weatherLocation";

    values.append(wbox.temperatureDiv, wbox.descriptionDiv, wbox.locationDiv);
    row.append(wbox.iconImg, values);
    row.hidden = true;  // shown once the first reading arrives
    wbox.rowDiv = row;
    wbox.messageDiv = document.createElement("div");
    wbox.messageDiv.className = "boxMessage";
    wbox.messageDiv.textContent = "Loading…";
    wbox.contentDiv.append(row, wbox.messageDiv);

    wbox.temperatureDiv.addEventListener("click", () => {
        if (wbox.temperature === null) {
            return;
        }
        if (wbox.unit === "imperial") {
            wbox.temperature = (wbox.temperature - 32) * 5 / 9;
            wbox.unit = "metric";
        } else {
            wbox.temperature = wbox.temperature * 9 / 5 + 32;
            wbox.unit = "imperial";
        }
        showTemperature(wbox);
    });

    return box.boxDiv;
}

function showTemperature(wbox) {
    const symbol = (wbox.unit === "metric") ? "C" : "F";
    wbox.temperatureDiv.textContent = Math.round(wbox.temperature) + "°" + symbol;
}

// Show a message in place of the reading (or clear it with "").
function setWeatherMessage(wbox, message) {
    wbox.messageDiv.textContent = message;
    wbox.messageDiv.hidden = (message === "");
    wbox.rowDiv.hidden = (message !== "");
}

function updateWeather(wbox) {
    const apiKey = openWeatherApiKey();
    if (apiKey === "") {
        setWeatherMessage(wbox,
                "No OpenWeather API key. Copy secrets.example.js to secrets.js and add your key.");
        return;
    }

    const url = OPENWEATHER_URL
            + "?lat=" + encodeURIComponent(wbox.lat)
            + "&lon=" + encodeURIComponent(wbox.lon)
            + "&units=" + wbox.unit
            + "&appid=" + encodeURIComponent(apiKey);

    fetch(url)
        .then(response => {
            if (response.status === 401) {
                throw new Error("OpenWeather rejected the API key (check secrets.js)");
            }
            if (!response.ok) {
                throw new Error("OpenWeather returned HTTP " + response.status);
            }
            return response.json();
        })
        .then(data => {
            // The API answers in the unit we asked for.
            wbox.temperature = data.main.temp;
            const icon = data.weather && data.weather[0] ? data.weather[0].icon : "";
            wbox.iconImg.src = "img/weather-icons/"
                    + (/^\d\d[dn]$/.test(icon) ? icon : "unknown") + ".png";
            wbox.descriptionDiv.textContent =
                    data.weather && data.weather[0] ? data.weather[0].description : "";
            wbox.locationDiv.textContent = [data.name, data.sys && data.sys.country]
                    .filter(Boolean).join(", ");
            showTemperature(wbox);
            setWeatherMessage(wbox, "");
        })
        .catch(error => {
            console.error("Weather for '" + wbox.title + "': " + error.message);
            // Keep the last good reading on screen if there is one.
            if (wbox.temperature === null) {
                setWeatherMessage(wbox, "Weather unavailable: " + error.message);
            }
        });
}

function addWeatherBoxes(container) {
    const locations = configValue("weatherPreferences", []);
    const minutes = Number(configValue("weatherRefreshMinutes", 10)) || 10;

    locations.forEach((loc, i) => {
        const wbox = new WeatherBox(loc.locationName || "Weather", loc.color || "",
                loc.lat, loc.lon, loc.unit, i + 1);
        const boxDiv = createWeatherBox(wbox);
        setBoxKey(boxDiv, "weather", wbox.title);
        container.appendChild(boxDiv);
        updateWeather(wbox);
        // Don't poll forever when there is no key; the box already says why.
        if (openWeatherApiKey() !== "") {
            setInterval(updateWeather, minutes * 60 * 1000, wbox);
        }
    });
}
