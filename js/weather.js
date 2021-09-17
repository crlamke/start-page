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
        this.currentTemperature = "";
        this.currentWeatherDescription = "";
        this.currentIcon = "";
        this.currentCity = "";
        this.currentCountry = "";
    }
}

function createWeatherBox(wbox, itemNumber) {

    var newWeatherbox = document.createElement('div');
    newWeatherbox.className = "weatherBox";
    newWeatherbox.id = "WeatherBox" + itemNumber;
    newWeatherbox.style.backgroundColor = wbox.bgColor;
    var newContent = document.createElement('div');
    newContent.className = "content";
    wbox.titleElement = document.createElement('h3');
    wbox.titleElement.id = "WeatherBoxTitle" + itemNumber;
    wbox.titleElement.textContent = wbox.title;
    newHR = document.createElement('hr');
    wbox.weatherIconDiv = document.createElement('div');
    wbox.weatherIconDiv.className = "weatherIcon";
	var weatherValuesDiv = document.createElement('div');
	weatherValuesDiv.className = "weatherValues"; 
    wbox.temperatureValueDiv = document.createElement('div');
    wbox.temperatureValueDiv.className = "tempValue";
    wbox.weatherDescriptionDiv = document.createElement('div');
    wbox.weatherDescriptionDiv.className = "weatherDescription";
    wbox.locationDiv = document.createElement('div');
    wbox.locationDiv.className = "weatherLocation";

    newWeatherbox.appendChild(newContent);
    newContent.appendChild(wbox.titleElement);
    newContent.appendChild(newHR);
    newContent.appendChild(wbox.weatherIconDiv);
	newContent.appendChild(weatherValuesDiv);
    weatherValuesDiv.appendChild(wbox.temperatureValueDiv);
    weatherValuesDiv.appendChild(wbox.weatherDescriptionDiv);
    weatherValuesDiv.appendChild(wbox.locationDiv);

    wbox.temperatureValueDiv.addEventListener("click", function(){
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
    return newWeatherbox;
}

// OpenWeather returns temp in Kelvin so we need base
// Kelvin value (273.15 K = 0 C) for conversion to C or F values. 
const kelvinBase = 273;

// API Key. Please do not use this API Key in your application. 
// Create your own (it's free) by following directions at 
// https://webdesign.tutsplus.com/tutorials/build-a-simple-weather-app-with-vanilla-javascript--cms-33893
const apiKey = "52933ab99de28f41ba92abe338693782";


function updateWeather(wbox) {
    var weatherAPICall = "http://api.openweathermap.org/data/2.5/weather?"
        + "lat=" + wbox.lat + "&lon=" + wbox.lon + "&appid=" 
        + apiKey;
    
    fetch(weatherAPICall)
        .then(function(response){
            let data = response.json();
            return data;
        })
        .then(function(data){
            wbox.currentTemperature = Math.floor(data.main.temp - kelvinBase);
            wbox.currentWeatherDescription = data.weather[0].description;
            wbox.currentIcon = data.weather[0].icon;
            wbox.currentCity = data.name;
            wbox.currentCountry = data.sys.country;
        })
        .then(function(){
            updateWeatherDisplay(wbox);
        });
}


function updateWeatherDisplay(wbox){
    wbox.weatherIconDiv.innerHTML = '<img src="img/weather-icons/' +
        wbox.currentIcon + '.png"/>';
    wbox.temperatureValueDiv.innerHTML = Math.round(celsiusToFahrenheit(wbox.currentTemperature))  +
        "°<span>F</span>";
    wbox.weatherDescriptionDiv.innerHTML = wbox.currentWeatherDescription;
    wbox.locationDiv.innerHTML = wbox.currentCity + ", " + wbox.currentCountry;
}

// C to F conversion
function celsiusToFahrenheit(temperature){
    return (temperature * 9/5) + 32;
}


