/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

class WeatherBox {

    constructor(title, bgColor, lat, lon, unit) {
        this.title = title;
        this.lat = lat;
        this.lon = lon;
        this.unit = unit;
        this.bgColor = bgColor;
        this.titleElement = "";
        this.weatherIconDiv = "";
        this.temperatureValueDiv = "";
        this.weatherDescriptionDiv = "";
        this.locationDiv = "";
    }
}

function createWeatherBox(wbox, itemNumber) {

    var newWeatherbox = document.createElement('div');
    newWeatherbox.className = "WeatherBox";
    newWeatherbox.id = "WeatherBox" + itemNumber;
    newWeatherbox.style.backgroundColor = wbox.bgColor;
    var newContent = document.createElement('div');
    newContent.className = "content";
    wbox.titleElement = document.createElement('h3');
    wbox.titleElement.id = "WeatherBoxTitle" + itemNumber;
    wbox.titleElement.textContent = wbox.title;
    newHR = document.createElement('hr');
    wbox.weatherIconDiv = document.createElement('div');
    wbox.weatherIconDiv.className = "icon";
    wbox.temperatureValueDiv = document.createElement('div');
    wbox.temperatureValueDiv.className = "tempValue";
    wbox.weatherDescriptionDiv = document.createElement('div');
    wbox.weatherDescriptionDiv.className = "weatherDescription";
    wbox.locationDiv = document.createElement('div');
    wbox.locationDiv.className = "weatherDescription";

    newWeatherbox.appendChild(newContent);
    newContent.appendChild(wbox.titleElement);
    newContent.appendChild(newHR);
    newContent.appendChild(wbox.weatherIconDiv);
    newContent.appendChild(wbox.temperatureValueDiv);
    newContent.appendChild(wbox.weatherDescriptionDiv);
    newContent.appendChild(wbox.locationDiv);
    return newWeatherbox;
}

// OpenWeather returns temp in Kelvin so we need base
// Kelvin value (273.15 K = 0 C) for conversion to C or F values. 
const KelvinBase = 273;

// API Key. Do not use this API Key. Create your own by following
// directions at https://webdesign.tutsplus.com/tutorials/build-a-simple-weather-app-with-vanilla-javascript--cms-33893
const apiKey = "52933ab99de28f41ba92abe338693782";

function updateWeather() {

}

// GET WEATHER FROM API PROVIDER
function getWeather(latitude, longitude){
    let api = `http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${key}`;
    
    fetch(api)
        .then(function(response){
            let data = response.json();
            return data;
        })
        .then(function(data){
            weather.temperature.value = Math.floor(data.main.temp - KELVIN);
            weather.description = data.weather[0].description;
            weather.iconId = data.weather[0].icon;
            weather.city = data.name;
            weather.country = data.sys.country;
        })
        .then(function(){
            displayWeather();
        });
}

// DISPLAY WEATHER TO UI
function displayWeather(){
    iconElement.innerHTML = `<img src="icons/${weather.iconId}.png"/>`;
    tempElement.innerHTML = `${weather.temperature.value}°<span>C</span>`;
    descElement.innerHTML = weather.description;
    locationElement.innerHTML = `${weather.city}, ${weather.country}`;
}

// C to F conversion
function celsiusToFahrenheit(temperature){
    return (temperature * 9/5) + 32;
}

/*
tempElement.addEventListener("click", function(){
    if(weather.temperature.value === undefined) return;
    
    if(weather.temperature.unit == "celsius"){
        let fahrenheit = celsiusToFahrenheit(weather.temperature.value);
        fahrenheit = Math.floor(fahrenheit);
        
        tempElement.innerHTML = `${fahrenheit}°<span>F</span>`;
        weather.temperature.unit = "fahrenheit";
    }else{
        tempElement.innerHTML = `${weather.temperature.value}°<span>C</span>`;
        weather.temperature.unit = "celsius"
    }
});
*/
