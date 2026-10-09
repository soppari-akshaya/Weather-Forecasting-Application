if (typeof auth !== "undefined") {
    auth.onAuthStateChanged(function (user) {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const userName = user.displayName || "User";
        const userEmail = user.email || "";
        const profileImage =
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                userName
            )}&background=1976d2&color=ffffff`;

        setText("userName", userName);
        setText("userEmail", userEmail);
        setImage("profileImage", profileImage);

        setText("menuUserName", userName);
        setText("menuUserEmail", userEmail);
        setImage("menuProfileImage", profileImage);
    });
}
function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function setImage(id, src) {
    const element = document.getElementById(id);

    if (element) {
        element.src = src;
    }
}

function showMessage(message) {
    setText("message", message);
}

const profileButton = document.getElementById("profileButton");
const profileMenu = document.getElementById("profileMenu");

if (profileButton && profileMenu) {
    profileButton.addEventListener("click", function (event) {
        event.stopPropagation();
        profileMenu.classList.toggle("show");
    });
}
const themeButton = document.getElementById("themeButton");
const themeMenu = document.getElementById("themeMenu");
const themeOptions = document.querySelectorAll(".theme-option");

const availableThemes = ["light", "dark", "blue", "green"];

function applyTheme(theme) {
    if (!availableThemes.includes(theme)) {
        theme = "blue";
    }
    document.body.dataset.theme = theme;

    themeOptions.forEach(function (option) {
        const isSelected = option.dataset.theme === theme;

        option.classList.toggle("active", isSelected);
        option.setAttribute("aria-pressed", String(isSelected));
    });

    try {
        localStorage.setItem("weatherTheme", theme);
    } catch (error) {
        console.warn("Unable to save theme preference.", error);
    }
}

if (themeButton && themeMenu) {
    themeButton.addEventListener("click", function (event) {
        event.stopPropagation();
        themeMenu.classList.toggle("show");
    });
}

themeOptions.forEach(function (option) {
    option.addEventListener("click", function (event) {
        event.stopPropagation();

        const selectedTheme = option.dataset.theme;

        if (selectedTheme) {
            applyTheme(selectedTheme);
        }

        if (themeMenu) {
            themeMenu.classList.remove("show");
        }
    });
});

try {
    const savedTheme = localStorage.getItem("weatherTheme");
    applyTheme(savedTheme || "blue");
} catch (error) {
    applyTheme("blue");
}
document.addEventListener("click", function (event) {
    if (!event.target.closest(".profile-container")) {
        if (profileMenu) {
            profileMenu.classList.remove("show");
        }
    }

    if (!event.target.closest(".theme-selector")) {
        if (themeMenu) {
            themeMenu.classList.remove("show");
        }
    }
});

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
        try {
            if (typeof auth === "undefined") {
                throw new Error("Firebase authentication is unavailable.");
            }

            await auth.signOut();
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout error:", error);
            showMessage("Unable to log out. Please try again.");
        }
    });
}
function showCurrentDate() {
    const today = new Date();

    const formattedDate = today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    setText("currentDate", formattedDate);
}
async function getWeather() {
    const cityInput = document.getElementById("cityInput");
    const weatherContainer = document.getElementById("weatherContainer");
    const welcome = document.getElementById("welcome");

    if (!cityInput) {
        showMessage("City search input was not found.");
        return;
    }

    const city = cityInput.value.trim();

    if (!city) {
        showMessage("Please enter a city name.");
        cityInput.focus();
        return;
    }

    showMessage("Loading weather information...");

    try {
      
        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Unable to find the location.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(
                "City not found. Please enter a valid city name."
            );
        }

        const location = geoData.results[0];
        await loadWeather(
            location.latitude,
            location.longitude,
            location.name,
            location.country || "",
            location.admin1 || "",
            location.timezone || ""
        );
        setText("placeCountry", location.country || "-");
        setText("placeRegion", location.admin1 || "-");
        setText(
            "placeLatitude",
            Number(location.latitude).toFixed(4)
        );
        setText(
            "placeLongitude",
            Number(location.longitude).toFixed(4)
        );
        setText("placeTimezone", location.timezone || "-");

        const placeSection = document.getElementById("placeSection");

        if (placeSection) {
            placeSection.style.display = "block";
        }
        getPlaceInformation(location.name);

        if (weatherContainer) {
            weatherContainer.classList.remove("hidden");
        }

        if (welcome) {
            welcome.style.display = "none";
        }

        showMessage("");
    } catch (error) {
        console.error("Weather search error:", error);
        showMessage(error.message || "Unable to load weather information.");

        if (weatherContainer) {
            weatherContainer.classList.add("hidden");
        }
    }
}
async function loadWeather(
    latitude,
    longitude,
    cityName,
    country = "",
    region = "",
    timezone = ""
) {
    showMessage("Loading weather information...");

    const weatherURL =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=10`;

    const weatherResponse = await fetch(weatherURL);

    if (!weatherResponse.ok) {
        throw new Error("Unable to fetch weather information.");
    }

    const weatherData = await weatherResponse.json();

    if (!weatherData.current || !weatherData.daily) {
        throw new Error("Weather information is incomplete.");
    }

    displayCurrentWeather(weatherData, cityName, country);
    displayForecast(weatherData);
    setText("placeCountry", country || "-");
    setText("placeRegion", region || "-");
    setText("placeLatitude", Number(latitude).toFixed(4));
    setText("placeLongitude", Number(longitude).toFixed(4));
    setText("placeTimezone", weatherData.timezone || timezone || "-");

    const placeSection = document.getElementById("placeSection");

    if (placeSection) {
        placeSection.style.display = "block";
    }

    const weatherContainer = document.getElementById("weatherContainer");
    const welcome = document.getElementById("welcome");

    if (weatherContainer) {
        weatherContainer.classList.remove("hidden");
    }

    if (welcome) {
        welcome.style.display = "none";
    }

    showMessage("");
}

function displayCurrentWeather(weatherData, cityName, country) {
    const current = weatherData.current;

    const locationText = country
        ? `${cityName}, ${country}`
        : cityName;

    setText("location", locationText);

    setText(
        "currentTemperature",
        Math.round(current.temperature_2m)
    );

    setText(
        "currentDescription",
        getWeatherDescription(current.weather_code)
    );

    setText(
        "currentIcon",
        getWeatherIcon(current.weather_code)
    );

    setText(
        "humidity",
        `${current.relative_humidity_2m}%`
    );

    setText(
        "windSpeed",
        `${Math.round(current.wind_speed_10m)} km/h`
    );

    setText(
        "feelsLike",
        `${Math.round(current.apparent_temperature)}°C`
    );
}

function displayForecast(weatherData) {
    const forecastContainer = document.getElementById("forecast");

    if (!forecastContainer) {
        console.warn("Forecast container was not found.");
        return;
    }

    forecastContainer.innerHTML = "";

    const daily = weatherData.daily;

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(`${daily.time[i]}T00:00:00`);
        const dayName = i === 0
            ? "TODAY"
            : date.toLocaleDateString("en-US", {
                weekday: "short"
            }).toUpperCase();

        const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });

        const icon = getWeatherIcon(daily.weather_code[i]);
        const description = getWeatherDescription(daily.weather_code[i]);
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);

        const card = document.createElement("div");
        card.className = "forecast-card";

        if (i === 0) {
            card.classList.add("today");
        }
        const dayElement = document.createElement("div");
        dayElement.className = "forecast-day";
        dayElement.textContent = dayName;

        const dateElement = document.createElement("div");
        dateElement.className = "forecast-date";
        dateElement.textContent = formattedDate;

        const iconElement = document.createElement("div");
        iconElement.className = "forecast-icon";
        iconElement.textContent = icon;

        const temperatureElement = document.createElement("div");
        temperatureElement.className = "forecast-temperature";

        const maxElement = document.createElement("span");
        maxElement.textContent = `${maxTemp}°C`;

        const minElement = document.createElement("span");
        minElement.textContent = ` / ${minTemp}°C`;

        temperatureElement.append(maxElement, minElement);

        const descriptionElement = document.createElement("div");
        descriptionElement.className = "forecast-description";
        descriptionElement.textContent = description;

        card.append(
            dayElement,
            dateElement,
            iconElement,
            temperatureElement,
            descriptionElement
        );

        forecastContainer.appendChild(card);
    }
}
function getWeatherDescription(code) {
    const descriptions = {
        0: "Clear Sky",
        1: "Mainly Clear",
        2: "Partly Cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Rime Fog",
        51: "Light Drizzle",
        53: "Drizzle",
        55: "Heavy Drizzle",
        56: "Freezing Drizzle",
        57: "Heavy Freezing Drizzle",
        61: "Light Rain",
        63: "Rain",
        65: "Heavy Rain",
        66: "Freezing Rain",
        67: "Heavy Freezing Rain",
        71: "Light Snow",
        73: "Snow",
        75: "Heavy Snow",
        77: "Snow Grains",
        80: "Rain Showers",
        81: "Rain Showers",
        82: "Heavy Showers",
        85: "Snow Showers",
        86: "Heavy Snow Showers",
        95: "Thunderstorm",
        96: "Thunderstorm with Hail",
        99: "Heavy Thunderstorm"
    };

    return descriptions[code] || "Unknown Weather";
}

function getWeatherIcon(code) {
    if (code === 0) {
        return "☀️";
    }

    if (code === 1 || code === 2) {
        return "🌤️";
    }

    if (code === 3) {
        return "☁️";
    }

    if (code === 45 || code === 48) {
        return "🌫️";
    }

    if (code >= 51 && code <= 57) {
        return "🌦️";
    }

    if (code >= 61 && code <= 67) {
        return "🌧️";
    }

    if (code >= 71 && code <= 77) {
        return "❄️";
    }

    if (code >= 80 && code <= 82) {
        return "🌦️";
    }

    if (code === 85 || code === 86) {
        return "🌨️";
    }

    if (code >= 95) {
        return "⛈️";
    }

    return "🌤️";
}

const cityInput = document.getElementById("cityInput");

if (cityInput) {
    cityInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            getWeather();
        }
    });
}
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showMessage("Geolocation is not supported by your browser.");
        return;
    }

    showMessage("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
        async function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            try {
                let cityName = "Current Location";
                let country = "";
                let region = "";
                try {
                    const locationURL =
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;

                    const response = await fetch(locationURL);

                    if (response.ok) {
                        const data = await response.json();
                        const address = data.address || {};

                        cityName =
                            address.city ||
                            address.town ||
                            address.village ||
                            address.municipality ||
                            address.county ||
                            "Current Location";

                        country = address.country || "";
                        region = address.state || "";
                    }
                } catch (error) {
                    console.warn("Could not determine city name.", error);
                }

                await loadWeather(
                    latitude,
                    longitude,
                    cityName,
                    country,
                    region
                );
                if (cityName !== "Current Location") {
                    getPlaceInformation(cityName);
                } else {
                    setText(
                        "placeName",
                        "About Your Current Location"
                    );

                    setText(
                        "placeDescription",
                        "Weather information is displayed using your current GPS coordinates."
                    );

                    const wikipediaLink =
                        document.getElementById("wikipediaLink");

                    if (wikipediaLink) {
                        wikipediaLink.style.display = "none";
                    }
                }
            } catch (error) {
                console.error("GPS weather error:", error);
                showMessage(
                    error.message || "Unable to fetch weather for your location."
                );
            }
        },

        function (error) {
            console.error("GPS error:", error);

            if (error.code === 1) {
                showMessage(
                    "Location permission denied. Please allow location access."
                );
            } else if (error.code === 2) {
                showMessage("Unable to determine your location.");
            } else if (error.code === 3) {
                showMessage("Location request timed out. Please try again.");
            } else {
                showMessage("Unable to get your current location.");
            }
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}
async function getPlaceInformation(city) {
    try {
        setText("placeName", `About ${city}`);
        setText("placeDescription", "Loading place information...");

        const searchURL =
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(city)}&format=json&origin=*&srlimit=1`;

        const searchResponse = await fetch(searchURL);

        if (!searchResponse.ok) {
            throw new Error("Unable to search Wikipedia.");
        }

        const searchData = await searchResponse.json();

        if (
            !searchData.query ||
            !searchData.query.search ||
            searchData.query.search.length === 0
        ) {
            showPlaceInformation(
                city,
                "No detailed information was found for this location."
            );
            return;
        }

        const pageTitle = searchData.query.search[0].title;

        const summaryURL =
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;

        const summaryResponse = await fetch(summaryURL);

        if (!summaryResponse.ok) {
            throw new Error("Unable to load the Wikipedia summary.");
        }

        const summaryData = await summaryResponse.json();

        showPlaceInformation(
            city,
            summaryData.extract ||
                "No description is available for this location.",
            summaryData.content_urls?.desktop?.page || null
        );
    } catch (error) {
        console.error("Place information error:", error);

        showPlaceInformation(
            city,
            "Place information is currently unavailable."
        );
    }
}
function showPlaceInformation(
    city,
    description,
    wikipediaURL = null
) {
    setText("placeName", `About ${city}`);
    setText("placeDescription", description);

    const wikipediaLink = document.getElementById("wikipediaLink");

    if (!wikipediaLink) {
        return;
    }

    if (wikipediaURL) {
        wikipediaLink.href = wikipediaURL;
        wikipediaLink.target = "_blank";
        wikipediaLink.rel = "noopener noreferrer";
        wikipediaLink.style.display = "inline-block";
    } else {
        wikipediaLink.removeAttribute("href");
        wikipediaLink.style.display = "none";
    }
}
function scrollForecast(direction) {
    const forecastWrapper =
        document.getElementById("forecastWrapper");

    const forecast =
        document.getElementById("forecast");

   
    const scrollTarget = forecastWrapper || forecast;

    if (!scrollTarget) {
        return;
    }

    scrollTarget.scrollBy({
        left: direction * 350,
        behavior: "smooth"
    });
}

const aboutNavLink = document.getElementById("aboutNavLink");

if (aboutNavLink) {
aboutNavLink.addEventListener("click", function (event) {
event.preventDefault();

 
    const placeSection = document.getElementById("placeSection");

    if (placeSection && placeSection.style.display !== "none") {
        placeSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } else {
        showMessage(
            "Please search for a city or use your current location first."
        );
    }
});
}
showCurrentDate();
if (typeof auth !== "undefined") {
auth.onAuthStateChanged(function (user) {
if (user) {
getCurrentLocation();
}
});
}
