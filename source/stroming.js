/**
 * Get the current viewport width using multiple methods for better browser compatibility
 * @returns {number} - Current viewport width in pixels
 */
function getViewportWidth() {
    return window.innerWidth || 
            document.documentElement.clientWidth || 
            document.body.clientWidth || 
            1200; // Fallback to a reasonable default
}

/**
 * Returns the maximum allowed end date string (YYYY-MM-DD) given the selected start date.
 * The maximum end date is exactly three days after the start date.
 * @param {string} startDate - Date string in YYYY-MM-DD format.
 * @returns {string} - Maximum allowed end date string.
 */
function getMaxEndDate(startDate) {
    const start = new Date(`${startDate}T00:00:00`);
    start.setDate(start.getDate() + 2);
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMaxStartDate() {
    const maxStart = new Date();
    maxStart.setDate(maxStart.getDate() + 1);
    const year = maxStart.getFullYear();
    const month = String(maxStart.getMonth() + 1).padStart(2, '0');
    const day = String(maxStart.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Sets default date and time values for the form inputs when the page loads.
 * Start date/time is set to current date/time, end date/time is set to 48 hours later.
 * This provides a reasonable default time range for fetching dive site data.
 */
function setDefaultDateTime() {
    const now = new Date();
    // Set start to today at 00:00 local time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    const currentTime = '00:00';
    document.getElementById('startDate').value = currentDate;
    document.getElementById('startTime').value = currentTime;

    // Set end to 48 hours after start (i.e., two days later at 23:59 local time)
    const endDateObj = new Date(year, now.getMonth(), now.getDate() + 2, 23, 59, 0, 0);
    const endYear = endDateObj.getFullYear();
    const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDateObj.getDate()).padStart(2, '0');
    const endDate = `${endYear}-${endMonth}-${endDay}`;
    const endTime = '23:59';
    document.getElementById('endDate').value = endDate;
    document.getElementById('endTime').value = endTime;

    syncEndDateTimeConstraints();
}

/**
 * Keep end date/time constrained so it cannot be before the selected start date/time.
 * Also auto-corrects existing end values when start moves forward.
 */
function syncEndDateTimeConstraints() {
    const startDateInput = document.getElementById('startDate');
    const startTimeInput = document.getElementById('startTime');
    const endDateInput = document.getElementById('endDate');
    const endTimeInput = document.getElementById('endTime');

    if (!startDateInput || !startTimeInput || !endDateInput || !endTimeInput) {
        return;
    }

    const startDate = startDateInput.value;
    const startTime = startTimeInput.value;
    const endDate = endDateInput.value;
    const endTime = endTimeInput.value;

    if (!startDate || !startTime) {
        return;
    }

    const maxStartDate = getMaxStartDate();
    const maxEndDate = getMaxEndDate(startDate);
    startDateInput.max = maxStartDate;
    endDateInput.min = startDate;
    endDateInput.max = maxEndDate;

    if (startDateInput.value > maxStartDate) {
        startDateInput.value = maxStartDate;
    }

    if (endDateInput.value < startDate) {
        endDateInput.value = startDate;
    }

    if (endDateInput.value > maxEndDate) {
        endDateInput.value = maxEndDate;
    }

    if (endDateInput.value === startDate) {
        endTimeInput.min = startTime;
    } else {
        endTimeInput.removeAttribute('min');
    }

    if (endDateInput.value && endTime) {
        const startDateTime = new Date(`${startDate}T${startTime}:00`);
        const endDateTime = new Date(`${endDateInput.value}T${endTime}:00`);

        if (endDateTime < startDateTime) {
            endDateInput.value = startDate;
            endTimeInput.value = startTime;
            endTimeInput.min = startTime;
        }
    }
}

let availableDiveSites = [];
let diveMap = null;
let diveSiteMarkersLayer = null;

/**
 * Renders a friendly API error message with a small info button that reveals the detailed error.
 * @param {HTMLElement} container - The container that should receive the error UI.
 * @param {Error|string} error - The error object or message to display.
 * @param {string} friendlyMessage - The short, user-friendly message to show by default.
 */
function renderApiError(container, error, friendlyMessage = 'Fout bij het ophalen van gegevens van Rijkswaterstaat. Probeer het later nog eens') {
    const wrapper = document.createElement('div');
    wrapper.style.color = '#d32f2f';
    wrapper.style.margin = '15px 0';
    wrapper.style.fontSize = '1.1em';
    wrapper.style.fontWeight = 'bold';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'flex-start';
    wrapper.style.gap = '8px';
    wrapper.style.flexWrap = 'wrap';

    const message = document.createElement('span');
    message.textContent = friendlyMessage;
    wrapper.appendChild(message);

    const detailText = error instanceof Error ? error.message : String(error ?? '');
    if (detailText) {
        const infoButton = document.createElement('button');
        infoButton.type = 'button';
        infoButton.textContent = '🛈';
        infoButton.setAttribute('aria-label', 'Toon detailinformatie');
        infoButton.title = 'Toon detailinformatie';
        infoButton.style.border = 'none';
        infoButton.style.background = '#f5f5f5';
        infoButton.style.color = '#0f172a';
        infoButton.style.cursor = 'pointer';
        infoButton.style.borderRadius = '50%';
        infoButton.style.width = '22px';
        infoButton.style.height = '22px';
        infoButton.style.display = 'inline-flex';
        infoButton.style.alignItems = 'center';
        infoButton.style.justifyContent = 'center';
        infoButton.style.fontSize = '0.85em';
        infoButton.style.fontWeight = 'bold';
        infoButton.style.flexShrink = '0';

        const details = document.createElement('div');
        details.style.display = 'none';
        details.style.width = '100%';
        details.style.marginTop = '4px';
        details.style.padding = '8px';
        details.style.background = '#fff5f5';
        details.style.border = '1px solid #f5c2c7';
        details.style.borderRadius = '4px';
        details.style.color = '#7f1d1d';
        details.style.fontSize = '0.9em';
        details.style.fontWeight = 'normal';
        details.style.wordBreak = 'break-word';
        details.textContent = detailText;

        infoButton.addEventListener('click', () => {
            const isVisible = details.style.display === 'block';
            details.style.display = isVisible ? 'none' : 'block';
            infoButton.textContent = isVisible ? '🛈' : '✕';
            infoButton.setAttribute('aria-expanded', String(!isVisible));
        });

        wrapper.appendChild(infoButton);
        container.appendChild(wrapper);
        container.appendChild(details);
    } else {
        container.appendChild(wrapper);
    }
}

/**
 * Returns map marker style based on location type and selection state.
 * @param {boolean} isDiveLocation - True when location name contains 'duiklocatie'
 * @param {boolean} isSelected - True when marker matches current dropdown selection
 * @returns {Object} Leaflet circleMarker style
 */
function getMarkerStyle(isDiveLocation, isSelected) {
    if (isSelected) {
        return {
            radius: 8,
            color: '#0f172a',
            weight: 2,
            fillColor: '#f59e0b',
            fillOpacity: 0.98
        };
    }

    return {
        radius: 6,
        color: isDiveLocation ? '#1e3a8a' : '#607d8b',
        weight: 1,
        fillColor: isDiveLocation ? '#2563eb' : '#90a4ae',
        fillOpacity: isDiveLocation ? 0.95 : 0.85
    };
}

/**
 * Highlights the selected location marker to match the dropdown value.
 */
function updateSelectedMarkerHighlight() {
    const diveSiteSelect = document.getElementById('diveSite');
    if (!diveSiteSelect || !diveSiteMarkersLayer) {
        return;
    }

    const selectedLocationId = diveSiteSelect.value;

    diveSiteMarkersLayer.eachLayer(marker => {
        const markerLocationId = marker.locationId;
        const isDiveLocation = marker.isDiveLocation === true;
        const isSelected = markerLocationId === selectedLocationId;
        marker.setStyle(getMarkerStyle(isDiveLocation, isSelected));
    });
}

/**
 * Opens the popup for the location selected in the dropdown and closes any previous popup.
 */
function openSelectedMarkerPopup() {
    const diveSiteSelect = document.getElementById('diveSite');
    if (!diveSiteSelect || !diveSiteMarkersLayer || !diveMap) {
        return;
    }

    const selectedLocationId = diveSiteSelect.value;
    if (!selectedLocationId) {
        return;
    }

    let selectedMarker = null;
    diveSiteMarkersLayer.eachLayer(marker => {
        if (marker.locationId === selectedLocationId) {
            selectedMarker = marker;
        }
    });

    if (selectedMarker) {
        diveMap.closePopup();
        selectedMarker.openPopup();
    }
}

/**
 * Updates map markers to match the currently visible dive site list.
 * @param {Array} locations - Filtered location list
 */
function renderMapMarkers(locations) {
    if (!diveMap || !diveSiteMarkersLayer) {
        return;
    }

    diveSiteMarkersLayer.clearLayers();

    locations.forEach(location => {
        if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
            return;
        }

        const isDiveLocation = location.isDiveLocation === true;

        const marker = L.circleMarker([location.latitude, location.longitude], getMarkerStyle(isDiveLocation, false));
        marker.locationId = location.id;
        marker.isDiveLocation = isDiveLocation;
        marker.bindPopup(location.name);
        marker.on('click', () => {
            const diveSiteSelect = document.getElementById('diveSite');
            if (!diveSiteSelect) {
                return;
            }

            const optionExists = Array.from(diveSiteSelect.options).some(option => option.value === location.id);
            if (!optionExists) {
                return;
            }

            diveSiteSelect.value = location.id;
            diveSiteSelect.dispatchEvent(new Event('change'));
        });
        diveSiteMarkersLayer.addLayer(marker);
    });

    updateSelectedMarkerHighlight();
}

/**
 * Initializes the interactive OpenStreetMap view for the configured bounding box.
 */
function initDiveMap() {
    const mapContainer = document.getElementById('dive-sites-map');
    if (!mapContainer || typeof L === 'undefined' || diveMap) {
        return;
    }

    diveMap = L.map('dive-sites-map');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(diveMap);

    diveMap.setView([51.601813, 3.964005], 10);
    diveSiteMarkersLayer = L.layerGroup().addTo(diveMap);

    if (availableDiveSites.length > 0) {
        renderDiveSites();
    }
}

/**
 * Renders dive site options based on the checkbox filter state.
 */
function renderDiveSites() {
    const diveSiteSelect = document.getElementById('diveSite');
    const onlyDiveLocationsCheckbox = document.getElementById('onlyDiveLocations');

    if (!diveSiteSelect || !onlyDiveLocationsCheckbox) {
        return;
    }

    const showOnlyDiveLocations = onlyDiveLocationsCheckbox.checked;
    const filteredLocations = showOnlyDiveLocations
        ? availableDiveSites.filter(location => location.isDiveLocation)
        : availableDiveSites;

    renderMapMarkers(filteredLocations);

    diveSiteSelect.innerHTML = '';

    if (filteredLocations.length === 0) {
        diveSiteSelect.innerHTML = '<option value="" selected disabled>Geen duikplaatsen beschikbaar</option>';
        diveSiteSelect.disabled = true;
        return;
    }

    filteredLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        diveSiteSelect.appendChild(option);
    });

    diveSiteSelect.disabled = false;
    
    // Restore selected dive site from local storage if available
    const savedDiveSite = localStorage.getItem('selectedDiveSite');
    if (savedDiveSite) {
        const option = diveSiteSelect.querySelector(`option[value="${savedDiveSite}"]`);
        if (option) {
            option.selected = true;
        } else {
            // Fallback to first option if saved dive site is not available
            diveSiteSelect.selectedIndex = 0;
        }
    } else {
        // No saved selection, use first option
        diveSiteSelect.selectedIndex = 0;
    }
    
    updateSelectedMarkerHighlight();
}

/**
 * Gets moon phase data for the specified year from the USNO API 
 *and returns an array of objects with phase and local date. 
*/
async function getMoonPhases(year) {
    const moonphaseUrl = `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`;

    try {
        const response = await fetch(moonphaseUrl);

        if (!response.ok) {
            const errorText = response.statusText || 'Unknown error';
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        const data = await response.json();

        const tideMap = {
                "New Moon": "Springtij",
                "Full Moon": "Springtij",
                "First Quarter": "Dood tij",
                "Last Quarter": "Dood tij"
            };

            const result = [];        

            data.phasedata.forEach(entry => {
                const [hours, minutes] = entry.time.split(':').map(Number);
                const utcMillis = Date.UTC(entry.year, entry.month - 1, entry.day, hours, minutes);
                const localDate = new Date(utcMillis);

                // original moon phase entry
                result.push({
                    phase: entry.phase,
                    date: localDate
                });

                // derived tide entry, 2 days later
                const tideDate = new Date(localDate);
                tideDate.setDate(tideDate.getDate() + 2);

                result.push({
                    phase: tideMap[entry.phase],
                    date: tideDate
                });
            });

            return result;
    } catch (error) {
        console.error('Error fetching moon phase data:', error);
        throw error;
    }
}

/*
 * Fetches moon phase data for all years in the specified date range and returns a
 * merged, sorted array.
*/
async function getMoonPhasesInRange(startDate, endDate) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // Build an array of years to fetch, e.g. [2025, 2026]
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
        years.push(y);
    }

    // Fetch all years in parallel rather than one-by-one
    const results = await Promise.all(years.map(year => getMoonPhases(year)));

    // Flatten the array-of-arrays into one array
    const merged = results.flat();

    // Sort by date, just in case (API returns per-year data already sorted,
    // but merging two years' worth benefits from an explicit sort)
    merged.sort((a, b) => a.date - b.date);

    // Optional: filter down to just the requested date range
    const filtered = merged.filter(entry => entry.date >= startDate && entry.date <= endDate);

    return filtered;
}

/* 
 * Adds moon phase information to each event in the API result based on the event's local date.
 */
function GetMoonPhaseForDate(timeStamp, moonPhases) {
    // Build a lookup: local date string -> phase name, for fast matching

    // Dutch translation of moon phases
    const moonPhaseTranslations = {
        'New Moon': 'Nieuwe Maan',
        'First Quarter': 'Eerste kwartier',
        'Full Moon': 'Volle Maan',
        'Last Quarter': 'Laatste kwartier',
        'Springtij': 'Springtij',
        'Dood tij': 'Dood tij'
    };
    const moonPhaseIcons = {
        'New Moon': 'images/newmoon.png',
        'First Quarter': 'images/firstquarter.png',
        'Full Moon': 'images/fullmoon.png',
        'Last Quarter': 'images/lastquarter.png',
        'Springtij': 'images/springtide.png',
        'Dood tij': 'images/neaptide.png'
    };

    
    
    const phaseByDate = new Map();
    moonPhases.forEach(mp => {
        phaseByDate.set(mp.date.toDateString(), mp.phase);
    });
    const eventDate = new Date(timeStamp); // parses ISO UTC string into local-aware Date
    const key = eventDate.toDateString();
    moonPhase = null;
    moonPhaseIcon = null;
    if (phaseByDate.has(key)) {
        moonPhase = moonPhaseTranslations[phaseByDate.get(key)];
        moonPhaseIcon = moonPhaseIcons[phaseByDate.get(key)];
        return { name: moonPhase, icon: moonPhaseIcon };
    }

    
}

/**
 * Loads available dive sites from the RWS locations API and fills the dive site select list.
 * Uses feature.properties.locationName as label and feature.properties.id as value.
 */
async function loadDiveSites() {
    const diveSiteSelect = document.getElementById('diveSite');
    if (!diveSiteSelect) {
        return;
    }

    const locationsUrl = 'https://rwsos.rws.nl/wb-api/dd/2.0/locations/geojson?sourceName=compute&observationTypeId=SG_SOF_6.1.ms&boundingBox=%5B3.4%2C51.45%2C4.3%2C51.8%5D&';

    diveSiteSelect.disabled = true;
    diveSiteSelect.innerHTML = '<option value="" selected disabled>Duikplaatsen laden...</option>';
    
    // Disable the fetch button while loading or when no dive sites are available
    const fetchDataButton = document.getElementById('fetchDataButton');
    if (fetchDataButton) {
        fetchDataButton.disabled = true;
    }

    // Remove any existing error message
    const existingError = document.getElementById('dive-sites-error');
    if (existingError) {
        existingError.remove();
    }

    try {
        const response = await fetch(locationsUrl);
        
        if (!response.ok) {
            const errorText = response.statusText || 'Unknown error';
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const features = Array.isArray(data.features) ? data.features : [];

        const locations = features
            .map(feature => {
                const properties = feature?.properties || {};
                const coordinates = Array.isArray(feature?.geometry?.coordinates)
                    ? feature.geometry.coordinates
                    : [];

                const originalName = String(properties.locationName || properties.locationname || '').trim();
                const isDiveLocation = /\([^)]*duiklocatie[^)]*\)/i.test(originalName);
                const cleanedName = originalName
                    .replace(/\s*\([^)]*\)\s*/g, ' ')
                    .replace(/\s{2,}/g, ' ')
                    .trim();

                return {
                    id: properties.id,
                    name: cleanedName,
                    fullName: originalName,
                    isDiveLocation: isDiveLocation,
                    longitude: Number(coordinates[0]),
                    latitude: Number(coordinates[1])
                };
            })
            .filter(location =>
                location.id &&
                location.name &&
                Number.isFinite(location.longitude) &&
                Number.isFinite(location.latitude)
            )
            .sort((a, b) => a.name.localeCompare(b.name, 'nl-NL'));

        if (locations.length === 0) {
            throw new Error('No dive sites returned by API');
        }

        availableDiveSites = locations;
        renderDiveSites();
    } catch (error) {
        console.error('Error loading dive sites:', error);
        diveSiteSelect.innerHTML = '<option value="" selected disabled>Duikplaatsen niet beschikbaar</option>';
        diveSiteSelect.disabled = true;
        
        // Keep the fetch button disabled when there's an error
        if (fetchDataButton) {
            fetchDataButton.disabled = true;
        }
        
        // Show a friendly error message beneath the dropdown with optional technical details.
        const errorElement = document.createElement('div');
        errorElement.id = 'dive-sites-error';
        errorElement.style.marginTop = '8px';
        errorElement.style.fontSize = '0.9em';
        renderApiError(errorElement, error);
        
        const formGroup = diveSiteSelect.closest('.form-group');
        if (formGroup) {
            formGroup.appendChild(errorElement);
        }
    } finally {
        if (availableDiveSites.length > 0) {
            diveSiteSelect.disabled = false;
            // Enable the fetch button when dive sites are available
            if (fetchDataButton) {
                fetchDataButton.disabled = false;
            }
        }
    }
}
/**
 * Converts degrees (0-360) to wind direction abbreviation (N, NE, E, SE, S, SW, W, NW).
 * Uses mathematical calculation instead of array lookup for better performance.
 * @param {number} degrees - The direction in degrees (0-360)
 * @returns {string} - Wind direction abbreviation (e.g., "N", "SE")
 */
function getWindDirection(degrees) {
    // Normalize degrees to ensure positive value in 0-360 range
    // The double modulo operation handles negative values correctly
    degrees = ((degrees % 360) + 360) % 360;
    
    // Convert degrees to 8-point compass index using mathematical division
    // Each compass point covers 45 degrees (360/8 = 45)
    const directions = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];
    return directions[Math.round(degrees / 45) % 8];
}

/**
 * Main function to fetch water current data from Rijkswaterstaat API and display results.
 * Retrieves both current speed and direction data for the selected dive site and time range.
 * Handles UI state management (loading spinner, clearing previous results) and error handling.
 */
async function fetchData() {
    // Clear containers immediately when button is pressed to provide immediate user feedback
    const diveWindowsContainer = document.getElementById('dive-windows');
    const resultsContainer = document.getElementById('results');
    const loadingSpinner = document.getElementById('loading-spinner');
    const legend = document.querySelector('.legend');
    
    // Reset UI state - clear previous results and show loading state
    diveWindowsContainer.innerHTML = '';
    resultsContainer.innerHTML = '';
    
    // Remove any existing error message
    const existingError = document.getElementById('data-fetch-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Hide legend and show loading spinner to indicate data is being fetched
    legend.style.display = 'none';
    loadingSpinner.style.display = 'block';

    // Extract form values for API request parameters
    const startDate = document.getElementById('startDate').value;
    const startTime = document.getElementById('startTime').value;
    const endDate = document.getElementById('endDate').value;
    const endTime = document.getElementById('endTime').value;
    const diveSiteSelect = document.getElementById('diveSite');
    const diveSite = diveSiteSelect.value;
    const selectedLocation = availableDiveSites.find(location => location.id === diveSite);
    const diveSiteName = selectedLocation?.fullName || diveSiteSelect.options[diveSiteSelect.selectedIndex]?.text || diveSite;

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);
    if (endDateTime < startDateTime) {
        loadingSpinner.style.display = 'none';
        resultsContainer.textContent = 'Einddatum/tijd kan niet vóór startdatum/tijd liggen.';
        return;
    }

    // Get the moon phases for the selected date range to display in the results
    const moonphases = await getMoonPhasesInRange(startDateTime, endDateTime);
    // Construct ISO datetime strings from separate date and time inputs
    // Format: YYYY-MM-DDTHH:MM:SS (ISO 8601 format)
    const localStartDateTimeString = `${startDate}T${startTime}:00`;
    const localEndDateTimeString = `${endDate}T${endTime}:00`;

    // Convert local time to UTC for API requests (RWS API expects UTC timestamps)
    const StartDateISO = LocalToUTC(localStartDateTimeString);
    const EndDateISO = LocalToUTC(localEndDateTimeString);

    // Use the RWS API to fetch data for the selected dive site and time range
    // Note: The observationTypeId and sourceName are hardcoded based on the API documentation 
    // url is the URL to fetch the water speed data, and url_w is the URL to fetch the water direction data
    const url = `https://rwsos.rws.nl/wb-api/dd/2.0/timeseries?observationTypeId=SG_SOF_6.1.ms&sourceName=compute&&locationCode=${encodeURIComponent(diveSite)}&&startTime=${encodeURIComponent(StartDateISO)}&endTime=${encodeURIComponent(EndDateISO)}&&`;
    const url_w = `https://rwsos.rws.nl/wb-api/dd/2.0/timeseries?observationTypeId=SG.2&sourceName=SOF_6&&locationCode=${encodeURIComponent(diveSite)}&&startTime=${encodeURIComponent(StartDateISO)}&endTime=${encodeURIComponent(EndDateISO)}`;

    try {
        // Make parallel API calls to fetch both speed and direction data simultaneously
        // This is more efficient than sequential calls
        let response, response_w;
        try {
            response = await fetch(url);
            response_w = await fetch(url_w);
        } catch (fetchError) {
            // Network-level errors (CORS, DNS, etc.) - these don't return a response object
            throw new Error(`Netwerkfout: ${fetchError.message}`);
        }
        
        // Check both responses for errors
        let errorMessage = null;
        if (!response.ok || !response_w.ok) {
            const speedError = !response.ok ? `Stroomsnelheid API: HTTP ${response.status} ${response.statusText || ''}` : null;
            const directionError = !response_w.ok ? `Stromingsrichting API: HTTP ${response_w.status} ${response_w.statusText || ''}` : null;
            errorMessage = [speedError, directionError].filter(Boolean).join(' | ') || 'Onbekende API-fout';
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        const data_w = await response_w.json();
        
        // Process and display the fetched data
        displayResults(data, data_w, diveSiteName, moonphases);
        
        // Scroll to dive windows section after displaying results (especially useful on mobile)
        setTimeout(() => {
            const diveWindowsElement = document.getElementById('dive-windows');
            if (diveWindowsElement && diveWindowsElement.hasChildNodes()) {
                diveWindowsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    } catch (error) {
        // Handle network errors, API errors, or JSON parsing errors
        console.error('Error fetching data:', error);
        
        // Show a friendly error below the "Duikvensters" title with optional technical details.
        const errorElement = document.createElement('div');
        errorElement.id = 'data-fetch-error';
        renderApiError(errorElement, error);
        
        diveWindowsContainer.appendChild(errorElement);
    } finally {
        // Always hide loading spinner when done, regardless of success or failure
        loadingSpinner.style.display = 'none';
    }
}

/**
 * Main function to process and display water current data in both timeline and tabular formats.
 * Creates dive windows visualization showing optimal diving periods and detailed current information.
 * @param {Object} data - Speed data from RWS API containing current measurements in m/s
 * @param {Object} data_w - Direction data from RWS API containing current direction in degrees
 * @param {Object} moonphases - Moon phase data for the time period
 */
function displayResults(data ,data_w, diveSiteName, moonphases) {
    const diveWindowsContainer = document.getElementById('dive-windows');
    const resultsContainer = document.getElementById('results');
    const legend = document.querySelector('.legend');

    // Verify that we have valid data before proceeding
    if (data.results && data.results.length > 0) {
        // Combine speed and direction data into a single array for easier processing
        const speedEvents = data.results[0].events;
        const directionEvents = data_w.results[0].events;

        // Map direction values by timestamp for robust timestamp alignment
        const directionByTimestamp = new Map(
            directionEvents
                .filter(evt => evt && evt.timeStamp)
                .map(evt => [evt.timeStamp, parseFloat(evt.value)])
        );

        // Create combined measurements array with speed and direction data, filtering out invalid entries
        const currentMeasurements = speedEvents
            .map((speedEvent) => {
                const directionValue = directionByTimestamp.get(speedEvent.timeStamp);
                return {
                    timeStamp: speedEvent.timeStamp,
                    speed: parseFloat(speedEvent.value), // Current speed in m/s
                    direction: typeof directionValue === 'number' && !Number.isNaN(directionValue)
                        ? directionValue
                        : null,
                    isLowest: false, // Will be set during slack time calculation
                    isPeak: false, // Will be set during peak current calculation
                    isLocalLow: false, // Will be set during slack time calculation
                    isLocalPeak: false, // Will be set during peak current calculation
                    signed: null, // Will be set during mean direction calculation
                    signChange: false, // Will be set during sign change detection
                    index: null // Will be set during iteration for local peak/low detection
                };
            })
            .filter(measurement => 
                !Number.isNaN(measurement.speed) &&
                measurement.speed !== null &&
                measurement.speed !== undefined &&
                measurement.direction !== null &&
                measurement.direction !== undefined &&
                !Number.isNaN(measurement.direction)
            )
            .sort((a, b) => new Date(a.timeStamp) - new Date(b.timeStamp));

        /**
         * Calculate the difference in minutes between two timestamp objects
         * @param {Object} start - Event object with timeStamp property
         * @param {Object} end - Event object with timeStamp property
         * @returns {number} - Difference in minutes
         */
        const getMinutesBetween = (start, end) => {
            if (!start || !end) return 0;
            return (new Date(end.timeStamp) - new Date(start.timeStamp)) / (1000 * 60);
        };

        /**
         * Format timestamp to display only time portion (HH:MM)
         * @param {string} timestamp - UTC timestamp string
         * @returns {string} - Formatted time string
         */
        const formatTime = (timestamp) => UTCToLocal(timestamp).toLocaleString().split(', ')[1].substring(0,5);

        /**
         * Format timestamp to display only date portion
         * @param {string} timestamp - UTC timestamp string
         * @returns {string} - Formatted date string
         */
        const formatDate = (timestamp) => UTCToLocal(timestamp).toLocaleString().split(', ')[0];

        const formatDateLabel = (timestamp) => {
            const date = new Date(timestamp);
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            if (date.toDateString() === today.toDateString()) {
                return 'Vandaag';
            } else if (date.toDateString() === tomorrow.toDateString()) {
                return 'Morgen';
            } else {
                return formatDate(timestamp);
            }
        };

        /* returns the maximum width of a collection of elements in pixels. */
        const getMaxElementWidth = (elements) => {
            const maxWidth = Math.max(
                ...Array.from(elements).map(bar => bar.getBoundingClientRect().width)
            );

                return maxWidth;
        };

        const FLOAT_TOLERANCE = 1e-9;
        const DIRECTION_CHANGE_THRESHOLD_DEGREES = 100;

        const approximatelyEqual = (valueA, valueB) => Math.abs(valueA - valueB) < FLOAT_TOLERANCE;

        const normalizeDirection = (direction) => {
            if (typeof direction !== 'number' || Number.isNaN(direction)) {
                return direction;
            }
            return ((direction % 360) + 360) % 360;
        };

        const isDirectionChange = (dir1, dir2) => {
            const a = normalizeDirection(dir1);
            const b = normalizeDirection(dir2);
            const diff = Math.abs(a - b);
            return diff >= DIRECTION_CHANGE_THRESHOLD_DEGREES;
        };

        const isSignChange = (value, beforevalue, aftervalue) => {
            if (typeof value !== 'number' || typeof beforevalue !== 'number' || typeof aftervalue !== 'number') {
                return false;
            }
            return (value < 0 && beforevalue >= 0) || (value >= 0 && beforevalue < 0) || (value < 0 && aftervalue >= 0) || (value >= 0 && aftervalue < 0); 
        };

        const toRadians = (degrees) => degrees * (Math.PI / 180);
        const toDegrees = (radians) => radians * (180 / Math.PI);

        const calculateTheta0  = (measurements) => {
            // filter low speed measurements to avoid noise in theta0 calculation
            const lowSpeedThreshold = 0.1; // m/s
            const filteredMeasurements = measurements.filter(entry => entry.speed > lowSpeedThreshold);

            if (filteredMeasurements.length === 0) {
                return null; // No valid measurements to calculate theta0
            } else {
                const sumCos = filteredMeasurements.reduce((sum, entry) => sum + ((entry.speed ** 2) * Math.cos(toRadians(entry.direction * 2))), 0);
                const sumSin = filteredMeasurements.reduce((sum, entry) => sum + ((entry.speed ** 2) * Math.sin(toRadians(entry.direction * 2))), 0);
                const meanDirectionRad = Math.atan2(sumSin, sumCos);
                const meanDirectionDeg = toDegrees(meanDirectionRad);
                const theta0 = ((meanDirectionDeg /2 ) % 360); 
                return Math.abs(theta0);
            }

        };

        const calculateSigned = (snelheid, richting, theta0) => {
            if (typeof snelheid !== 'number' || typeof richting !== 'number' || typeof theta0 !== 'number') {
                return null;
            }
            const signedSpeed = snelheid * Math.cos(toRadians(richting - theta0));
            return signedSpeed;
        };

        const isLocalPeak = (index) => {
            const speed = currentMeasurements[index].speed;
            if (index === 0) {
                return speed > currentMeasurements[index + 1].speed + FLOAT_TOLERANCE;
            }
            if (index === currentMeasurements.length - 1) {
                return speed > currentMeasurements[index - 1].speed + FLOAT_TOLERANCE;
            }
            const prevSpeed = currentMeasurements[index - 1].speed;
            const nextSpeed = currentMeasurements[index + 1].speed;
            return speed >= prevSpeed - FLOAT_TOLERANCE &&
                speed >= nextSpeed - FLOAT_TOLERANCE &&
                (speed > prevSpeed + FLOAT_TOLERANCE || speed > nextSpeed + FLOAT_TOLERANCE);
        };

        const findNearestPeakBefore = (startIndex, endIndex) => {
            let bestPeakIndex = -1;
            let bestPeakSpeed = -Infinity;
            for (let i = startIndex; i <= endIndex; i++) {
                if (isLocalPeak(i)) {
                    const speed = currentMeasurements[i].speed;
                    if (speed > bestPeakSpeed + FLOAT_TOLERANCE || (approximatelyEqual(speed, bestPeakSpeed) && i > bestPeakIndex)) {
                        bestPeakSpeed = speed;
                        bestPeakIndex = i;
                    }
                }
            }
            if (bestPeakIndex !== -1) {
                return bestPeakIndex;
            }

            let bestIndex = startIndex;
            let bestSpeed = currentMeasurements[startIndex].speed;
            for (let i = startIndex + 1; i <= endIndex; i++) {
                const speed = currentMeasurements[i].speed;
                if (speed > bestSpeed + FLOAT_TOLERANCE || (approximatelyEqual(speed, bestSpeed) && i > bestIndex)) {
                    bestSpeed = speed;
                    bestIndex = i;
                }
            }
            return bestIndex;
        };

        const findNearestPeakAfter = (startIndex, endIndex) => {
            let bestPeakIndex = -1;
            let bestPeakSpeed = -Infinity;
            for (let i = startIndex; i <= endIndex; i++) {
                if (isLocalPeak(i)) {
                    const speed = currentMeasurements[i].speed;
                    if (speed > bestPeakSpeed + FLOAT_TOLERANCE || (approximatelyEqual(speed, bestPeakSpeed) && (bestPeakIndex === -1 || i < bestPeakIndex))) {
                        bestPeakSpeed = speed;
                        bestPeakIndex = i;
                    }
                }
            }
            if (bestPeakIndex !== -1) {
                return bestPeakIndex;
            }

            let bestIndex = startIndex;
            let bestSpeed = currentMeasurements[startIndex].speed;
            for (let i = startIndex + 1; i <= endIndex; i++) {
                const speed = currentMeasurements[i].speed;
                if (speed > bestSpeed + FLOAT_TOLERANCE || (approximatelyEqual(speed, bestSpeed) && i < bestIndex)) {
                    bestSpeed = speed;
                    bestIndex = i;
                }
            }
            return bestIndex;
        };

        const isLocalMinimum = (index) => {
            const speed = currentMeasurements[index].speed;
            if (index === 0) {
                return speed < currentMeasurements[index + 1].speed - FLOAT_TOLERANCE;
            }
            if (index === currentMeasurements.length - 1) {
                return speed < currentMeasurements[index - 1].speed - FLOAT_TOLERANCE;
            }
            const prevSpeed = currentMeasurements[index - 1].speed;
            const nextSpeed = currentMeasurements[index + 1].speed;
            return speed <= prevSpeed + FLOAT_TOLERANCE &&
                speed <= nextSpeed + FLOAT_TOLERANCE &&
                (speed < prevSpeed - FLOAT_TOLERANCE || speed < nextSpeed - FLOAT_TOLERANCE);
        };


        // add helpers to the measurements for later use
        const theta0 = calculateTheta0(currentMeasurements);
        currentMeasurements.forEach((measurement,index) => {
            if (index >= currentMeasurements.length - 1) {
                return;
            }

            const nextMeasurement = currentMeasurements[index + 1];
            const previousMeasurement = index > 0 ? currentMeasurements[index - 1] : null;
            measurement.signed = calculateSigned(measurement.speed, measurement.direction, theta0);

            const signChange = previousMeasurement ? isSignChange(measurement.signed, previousMeasurement.signed, calculateSigned(nextMeasurement.speed, nextMeasurement.direction, theta0)) : false;
            measurement.signChange = signChange;
            measurement.isLocalPeak = isLocalPeak(index);
            measurement.isLocalLow = isLocalMinimum(index);
            measurement.indexnumber = index;
        });

        const slackTideCandidates = currentMeasurements.filter((measurement) => {
            return measurement.isLocalLow && measurement.signChange;
        }); 

        /**
         * Filtert valse kentering-kandidaten (door "klotsen") uit een lijst van
         * signChange-kandidaten. Kandidaten die kort na elkaar vallen (binnen
         * clusterWindowMs) worden als één cluster gezien; per cluster wordt alleen
         * de kandidaat met de laagste snelheid (dichtst bij echte stilstand)
         * behouden. Bij gelijke snelheid wint de eerste (vroegste) kandidaat.
         *
         * @param {Array} candidates - lijst van kentering-kandidaten, elk met
         *   minimaal { timeStamp: string (ISO), speed: number }.
         *   Moet al gesorteerd zijn op timeStamp oplopend.
         * @param {number} clusterWindowMs - max tijd tussen opeenvolgende
         *   kandidaten om nog tot hetzelfde cluster te horen (default 2 uur).
         * @returns {Array} gefilterde lijst met alleen de "echte" kenteringen,
         *   in dezelfde volgorde als de input.
         */
        const filterSlackTideCandidates = (candidates) => {
            if (!candidates || candidates.length === 0) return [];

            const clusterWindowMs = 2 * 60 * 60 * 1000 // 2 uur in milliseconden

            // Zorg dat we op tijd sorteren, voor het geval de input dat nog niet is
            const sorted = [...candidates].sort(
                (a, b) => new Date(a.timeStamp) - new Date(b.timeStamp)
            );

            // Stap 1: groepeer opeenvolgende kandidaten in clusters
            // ("chained clustering": zolang het gat met de vórige kandidaat
            // binnen het venster valt, blijft het dezelfde cluster)
            const clusters = [];
            let currentCluster = [sorted[0]];

            for (let i = 1; i < sorted.length; i++) {
                const prevTime = new Date(sorted[i - 1].timeStamp).getTime();
                const currTime = new Date(sorted[i].timeStamp).getTime();

                if (currTime - prevTime <= clusterWindowMs) {
                    currentCluster.push(sorted[i]);
                } else {
                    clusters.push(currentCluster);
                    currentCluster = [sorted[i]];
                }
            }
            clusters.push(currentCluster);

            // Stap 2: kies per cluster de kandidaat met de laagste snelheid
            // (dichtst bij echte stilstand); bij gelijkspel de eerste (vroegste)
            const winners = clusters.map((cluster) => {
                let best = cluster                                                                      [0];
                for (let i = 1; i < cluster.length; i++) {
                    if (cluster[i].speed < best.speed) {
                        best = cluster[i];
                    }
                    // bij gelijke snelheid: best blijft de eerder gevonden
                    // (= eerdere) kandidaat, dus geen actie nodig
                }
                return best;
            });

            return winners;
        }

        // const dedupeSlackIndices = (indices) => {
        //     const deduped = [];
        //     indices.forEach((index) => {
        //         if (deduped.length === 0) {
        //             deduped.push(index);
        //             return;
        //         }
        //         const previousIndex = deduped[deduped.length - 1];
        //         if (
        //             index === previousIndex + 1 &&
        //             approximatelyEqual(currentMeasurements[index].speed, currentMeasurements[previousIndex].speed)
        //         ) {
        //             return;
        //         }
        //         deduped.push(index);
        //     });
        //     return deduped;
        // };

        //const slackIndices = dedupeSlackIndices(Array.from(slackIndicesCandidates).sort((a, b) => a - b));
        const slackTides = filterSlackTideCandidates(Array.from(slackTideCandidates).sort((a, b) => a - b));

        const peakIndices = new Set();
        slackTides.forEach((slackTide, slackPosition) => {
            const previousSlackIndex = slackPosition > 0 ? slackTides[slackPosition - 1].indexnumber : -1;
            const nextSlackIndex = slackPosition < slackTides.length - 1 ? slackTides[slackPosition + 1].indexnumber : currentMeasurements.length;

            const peakBeforeStart = previousSlackIndex + 1;
            const peakBeforeEnd = Math.max(slackTide.indexnumber - 1, peakBeforeStart);
            if (peakBeforeStart <= peakBeforeEnd) {
                peakIndices.add(findNearestPeakBefore(peakBeforeStart, peakBeforeEnd));
            }

            const peakAfterStart = slackTide.indexnumber + 1;
            const peakAfterEnd = Math.min(nextSlackIndex - 1, currentMeasurements.length - 1);
            if (peakAfterStart <= peakAfterEnd) {
                peakIndices.add(findNearestPeakAfter(peakAfterStart, peakAfterEnd));
            }
        });

        peakIndices.forEach((peakIndex) => {
            currentMeasurements[peakIndex].isPeak = true;
        });
        
        slackTides.forEach((slackTide) => {
            currentMeasurements[slackTide.indexnumber].isLowest = true;
        });

        /**
         * Determine tide indicator (LW=Low Water, HW=High Water) based on direction change
         * @param {number} slackIndex - Index of slack time in events array
         * @returns {string} - 'LW', 'HW', or empty string
         */
        const getTideIndicator = (slackIndex) => {
            // Get direction before and after the slack time to determine tide type
            const beforeDirection = slackIndex > 0 ? 
                currentMeasurements[slackIndex - 1].direction : 
                currentMeasurements[slackIndex].direction;
            const afterDirection = slackIndex < currentMeasurements.length - 1 ? 
                currentMeasurements[slackIndex + 1].direction : 
                currentMeasurements[slackIndex].direction;
            
            // Determine tide type based on direction change pattern
            if (beforeDirection > 180 && afterDirection < 180) return 'LW';
            if (beforeDirection < 180 && afterDirection > 180) return 'HW';
            return '';
        };

        // Add header for dive windows section
        const diveWindowsHeader = document.createElement('h2');
        diveWindowsHeader.textContent = `Duikvensters - ${diveSiteName}`;
        diveWindowsContainer.appendChild(diveWindowsHeader);

        // Check if conditions are favorable throughout the entire period
        const allSpeedsBelowTwenty = currentMeasurements.length > 0 && currentMeasurements.every(measurement => measurement.speed <= 0.2);
        const allSpeedsBelowThirty = currentMeasurements.length > 0 && currentMeasurements.every(measurement => measurement.speed <= 0.3);

        if (allSpeedsBelowTwenty) {
            // Existing green panel for very low current during the full period (< 20 cm/s)
            const favorableConditionsPanel = document.createElement('div');
            favorableConditionsPanel.style.backgroundColor = '#d4edda';
            favorableConditionsPanel.style.color = '#155724';
            favorableConditionsPanel.style.border = '1px solid #c3e6cb';
            favorableConditionsPanel.style.borderRadius = '8px';
            favorableConditionsPanel.style.padding = '15px';
            favorableConditionsPanel.style.margin = '15px 0 20px 0';
            favorableConditionsPanel.style.fontSize = '1.1em';
            favorableConditionsPanel.style.fontWeight = 'bold';
            favorableConditionsPanel.style.textAlign = 'center';
            favorableConditionsPanel.innerHTML = '🌊 Gunstige omstandigheden, duiken kan gedurende de hele periode worden gedaan!<br><span style="font-size: 0.9em; font-weight: normal; color: #0f5132;">De stroming is ≤ 20 cm/s</span>';

            diveWindowsContainer.appendChild(favorableConditionsPanel);
        } else if (allSpeedsBelowThirty) {
            // Orange panel for manageable current during the full period (< 30 cm/s)
            const experiencedDiversPanel = document.createElement('div');
            experiencedDiversPanel.style.backgroundColor = '#fff3cd';
            experiencedDiversPanel.style.color = '#7a4b00';
            experiencedDiversPanel.style.border = '1px solid #f0ad4e';
            experiencedDiversPanel.style.borderRadius = '8px';
            experiencedDiversPanel.style.padding = '15px';
            experiencedDiversPanel.style.margin = '15px 0 20px 0';
            experiencedDiversPanel.style.fontSize = '1.1em';
            experiencedDiversPanel.style.fontWeight = 'bold';
            experiencedDiversPanel.style.textAlign = 'center';
            experiencedDiversPanel.innerHTML = '🌊 Duiken kan gedurende de hele periode worden gedaan voor ervaren getijdenduikers.<br><span style="font-size: 0.9em; font-weight: normal; color: #9a6700;">De stroming is ≤ 30 cm/s</span>';

            diveWindowsContainer.appendChild(experiencedDiversPanel);
        }

        // Create timeline container for visual representation of dive windows
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container';

        // PHASE 1: Create dive windows based on slack tides - one window per slack tide
        // Each window extends from the peak before the slack tide to the peak after it
        let windows = []; // Array to store all valid dive windows
        let maxDuration = 0; // Used for proportional scaling of timeline bars
        
        // Create a window for each slack tide
        slackTides.forEach((slackTide, windowIndex) => {
            // Find the peak before this slack tide
            let peakBeforeIndex = -1;
            for (let i = slackTide.indexnumber - 1; i >= 0; i--) {
                if (currentMeasurements[i].isPeak) {
                    peakBeforeIndex = i;
                    break;
                }
            }
            
            // Find the peak after this slack tide
            let peakAfterIndex = -1;
            for (let i = slackTide.indexnumber + 1; i < currentMeasurements.length; i++) {
                if (currentMeasurements[i].isPeak) {
                    peakAfterIndex = i;
                    break;
                }
            }
            
            // Only create a window if we have both peaks (or use data boundaries)
            let windowStart, windowEnd;
            
            if (peakBeforeIndex !== -1) {
                windowStart = currentMeasurements[peakBeforeIndex];
            } else {
                // If no peak before, start from beginning of data
                windowStart = currentMeasurements[0];
            }
            
            if (peakAfterIndex !== -1) {
                windowEnd = currentMeasurements[peakAfterIndex];
            } else {
                // If no peak after, end at end of data
                windowEnd = currentMeasurements[currentMeasurements.length - 1];
            }
            
            const duration = getMinutesBetween(windowStart, windowEnd);
            maxDuration = Math.max(maxDuration, duration);
            const windowStartIndex = currentMeasurements.findIndex(m => m === windowStart);
            const windowEndIndex = currentMeasurements.findIndex(m => m === windowEnd);
            const windowMeasurements = currentMeasurements.slice(windowStartIndex, windowEndIndex + 1);
            
            windows.push({
                windowStart,
                windowEnd,
                slackTime: currentMeasurements[slackTide.indexnumber],
                slackIndex: slackTide.indexnumber,
                duration,
                tideIndicator: getTideIndicator(slackTide.indexnumber),
                windowStartIndex,
                windowEndIndex,
                measurements: windowMeasurements
            });
        });

        // If there is less than 2 hours of data after the last slack tide,
        // do not render that final visual time window.
        if (windows.length > 0) {
            const lastWindow = windows[windows.length - 1];
            const lastMeasurement = currentMeasurements[currentMeasurements.length - 1];
            const minutesAfterLastSlack = getMinutesBetween(lastWindow.slackTime, lastMeasurement);

            if (minutesAfterLastSlack < 120) {
                windows.pop();
            }
        }

        // Recalculate max duration from the windows that will actually be rendered.
        maxDuration = windows.reduce((largest, window) => Math.max(largest, window.duration), 0);

        // PHASE 2: Create visual timeline representation
        // Find the window with the longest time between start and slack for alignment
        let maxStartToSlackTime = 0;
        windows.forEach(window => {
            if (window.slackTime) {
                const startToSlackTime = getMinutesBetween(window.windowStart, window.slackTime);
                maxStartToSlackTime = Math.max(maxStartToSlackTime, startToSlackTime);
            }
        });

        // Generate visual timeline bars for each diving window
        previousDate = null; // Track previous date to avoid duplicate date labels
        windows.forEach(window => {
            // Create main container for this timeline row
            const timelineRow = document.createElement('div');
            timelineRow.className = 'timeline-row';
            
            const rowMoonPhase = GetMoonPhaseForDate(window.slackTime.timeStamp, moonphases);
            const divedate = new Date(window.slackTime.timeStamp);
            if (!previousDate || divedate.toDateString() !== previousDate.toDateString()) {
                const dateLabel = document.createElement('div');
                dateLabel.className = 'timeline-date';
                dateLabel.textContent = formatDateLabel(window.slackTime.timeStamp);
                if (rowMoonPhase) {
                    const moonIcon = document.createElement('img');
                    moonIcon.src = rowMoonPhase.icon;
                    moonIcon.alt = rowMoonPhase.name;
                    moonIcon.title = rowMoonPhase.name;
                    moonIcon.className = 'moon-icon';
                    dateLabel.appendChild(moonIcon);
                }
                timelineRow.appendChild(dateLabel);
            }
            previousDate = divedate;

            // Create container for the bar and labels
            const timelineBarContainer = document.createElement('div');
            timelineBarContainer.className = 'timeline-bar-container';

            // Create the main timeline bar representing the diving window
            const timelineBar = document.createElement('div');
            timelineBar.className = 'timeline-bar';
            
            // Calculate filler duration to align slack times across all windows
            // Filler = (max start-to-slack time across all windows) - (this window's start-to-slack time)
            const currentStartToSlackTime = getMinutesBetween(window.windowStart, window.slackTime);
            const fillerDuration = maxStartToSlackTime - currentStartToSlackTime;
            
            // Determine base width based on screen size for better responsiveness
            const screenWidth = getViewportWidth();
            let baseWidth;
            
            if (screenWidth >= 1400) {
                baseWidth = 1200; // Large screens - use more space
            } else if (screenWidth >= 1200) {
                baseWidth = 1000; // Medium-large screens
            } else if (screenWidth >= 900) {
                baseWidth = 800; // Medium screens - original size
            } else {
                baseWidth = 500; // Small screens - compact size
            }
            
            // Calculate consistent pixels-per-minute ratio for all timeline bars
            // This ensures segments with the same duration have the same pixel width across all bars
            const maxTotalDuration = maxDuration //+ maxStartToSlackTime;
            const pixelsPerMinute = baseWidth / maxTotalDuration;
            
            // Scale bar width proportionally to window duration plus filler using consistent scale
            const totalDuration = window.duration + fillerDuration;
            let barWidth = totalDuration * pixelsPerMinute;
            
            // Ensure minimum width for very short durations on large screens
            if (screenWidth >= 900) {
                barWidth = Math.max(barWidth, baseWidth * 0.6); // At least 60% of base width
                // Recalculate pixels per minute if we had to apply minimum width
                if (barWidth === baseWidth * 0.6) {
                    // Only recalculate if this bar was adjusted to minimum width
                    const adjustedPixelsPerMinute = barWidth / totalDuration;
                }
            }

            timelineBar.style.width = `${barWidth}px`;
            
            // Add filler segment first if needed to align slack times
            if (fillerDuration > 0) {
                const fillerSegment = document.createElement('div');
                fillerSegment.className = 'timeline-segment filler';
                fillerSegment.style.backgroundColor = 'transparent';
                fillerSegment.style.border = 'none';
                const fillerWidthPx = fillerDuration * pixelsPerMinute;
                fillerSegment.style.width = `${fillerWidthPx}px`;
                timelineBar.appendChild(fillerSegment);
            }

            // Create segments based on current speed thresholds
            // Get indices for window start and end
            const windowStartIndex = currentMeasurements.findIndex(m => m === window.windowStart);
            const windowEndIndex = currentMeasurements.findIndex(m => m === window.windowEnd);
            
            // Analyze the current data to create color-coded segments
            let currentSegmentStart = windowStartIndex;
            let currentSegmentType = null;
            
            // Helper function to determine segment type based on current speed
            const getSegmentType = (speedInMs) => {
                const speedInCms = speedInMs * 100;
                if (speedInCms > 30) return 'strong'; // >= 30 cm/s - red
                if (speedInCms > 20) return 'moderate'; // 20-30 cm/s - orange  
                return 'weak'; // < 20 cm/s - green
            };
            
            // Create segments by analyzing speed changes
            const segments = [];
            let segmentStartTime = window.windowStart.timeStamp;
            let segmentStartType = getSegmentType(currentMeasurements[windowStartIndex].speed);
            
            for (let i = windowStartIndex + 1; i <= windowEndIndex; i++) {
                const currentType = getSegmentType(currentMeasurements[i].speed);
                
                // If segment type changes, close current segment and start new one
                if (currentType !== segmentStartType || i === windowEndIndex) {
                    const segmentEndTime = currentMeasurements[i].timeStamp;
                    const segmentDuration = (new Date(segmentEndTime) - new Date(segmentStartTime)) / (1000 * 60);
                    
                    segments.push({
                        type: segmentStartType,
                        duration: segmentDuration,
                        startTime: segmentStartTime,
                        endTime: segmentEndTime
                    });
                    
                    segmentStartTime = segmentEndTime;
                    segmentStartType = currentType;
                }
            }

            const firstModerateSegment = segments.find(segment => segment.type === 'moderate') || null;
            const lastModerateSegment = segments.slice().reverse().find(segment => segment.type === 'moderate') || null;
            const slackTimeMs = new Date(window.slackTime.timeStamp).getTime();
            const weakSlackSegment = segments.find(segment => {
                if (segment.type !== 'weak') {
                    return false;
                }
                const startMs = new Date(segment.startTime).getTime();
                const endMs = new Date(segment.endTime).getTime();
                return slackTimeMs >= startMs && slackTimeMs <= endMs;
            }) || null;

            window.advancedWindow = {
                startTime: firstModerateSegment ? firstModerateSegment.startTime : null,
                endTime: lastModerateSegment ? lastModerateSegment.endTime : null
            };
            window.beginnerWindow = {
                startTime: weakSlackSegment ? weakSlackSegment.startTime : null,
                endTime: weakSlackSegment ? weakSlackSegment.endTime : null
            };
            
            // Create visual segments
            let isFirstVisible = true;
            segments.forEach((segment, index) => {
                const segmentDiv = document.createElement('div');
                segmentDiv.className = 'timeline-segment';
                
                // Apply appropriate styling based on segment type
                switch (segment.type) {
                    case 'strong':
                        segmentDiv.classList.add('speed-strong');
                        break;
                    case 'moderate':
                        segmentDiv.classList.add('speed-moderate');
                        break;
                    case 'weak':
                        segmentDiv.classList.add('speed-weak');
                        break;
                }
                
                // Mark first visible segment
                if (isFirstVisible && fillerDuration === 0) {
                    segmentDiv.classList.add('first-visible');
                    isFirstVisible = false;
                } else if (isFirstVisible) {
                    segmentDiv.classList.add('first-visible');
                    isFirstVisible = false;
                }
                
                // Mark first segment (peak tide boundary)
                if (index === 0) {
                    segmentDiv.classList.add('first-segment');
                }
                
                // Mark last segment (peak tide boundary)
                if (index === segments.length - 1) {
                    segmentDiv.classList.add('last-segment');
                }
                
                // Calculate width in pixels using consistent pixels-per-minute ratio
                // This ensures segments with the same duration appear the same width across all timeline bars
                const segmentWidthPx = segment.duration * pixelsPerMinute;
                segmentDiv.style.width = `${segmentWidthPx}px`;
                
                // Add slack time indicator if this segment contains the slack time
                const segmentStartMs = new Date(segment.startTime).getTime();
                const segmentEndMs = new Date(segment.endTime).getTime();
                const slackTimeMs = new Date(window.slackTime.timeStamp).getTime();
                
                if (slackTimeMs >= segmentStartMs && slackTimeMs <= segmentEndMs) {
                    segmentDiv.style.position = 'relative';
                    
                    // Calculate relative position within the segment
                    const relativePosition = ((slackTimeMs - segmentStartMs) / (segmentEndMs - segmentStartMs)) * 100;
                    
                    // Create visual indicator for slack time (dark green line)
                    const slackContainer = document.createElement('div');
                    slackContainer.style.position = 'absolute';
                    slackContainer.style.left = `${relativePosition}%`;
                    slackContainer.style.top = '-15px'; // Extended upward but stops just below slack label
                    slackContainer.style.height = '45px'; // Covers from just below slack label to bottom of bar
                    slackContainer.style.transform = 'translateX(-50%)';
                    slackContainer.style.width = '2px';
                    slackContainer.style.backgroundColor = '#006600';
                    slackContainer.style.zIndex = '2';
                    
                    segmentDiv.appendChild(slackContainer);
                }
                
                timelineBar.appendChild(segmentDiv);
            });

            timelineRow.appendChild(timelineBar);

            // Add time labels above the timeline bar
            const timeLabels = document.createElement('div');
            timeLabels.className = 'timeline-labels';

            /**
             * Helper function to create positioned time labels above timeline bars
             * @param {Object} measurement - Measurement object with timeStamp property
             * @param {number} position - Pixel position for label placement
             * @param {string} className - CSS class for the label
             * @param {boolean} isStaggered - Whether this label should be positioned higher (staggered)
             */
            const createLabel = (measurement, position, className = 'start', isStaggered = false) => {
                if (measurement) {
                    // No overlap checking needed since labels are staggered at different heights
                    const label = document.createElement('span');
                    label.textContent = formatTime(measurement.timeStamp);
                    label.style.left = `${position}px`;
                    label.className = className + (isStaggered ? ' staggered' : '');
                    timeLabels.appendChild(label);
                }
            };

            // Position labels at key points in the diving window
            
            // Counter for staggering labels
            let labelCount = 0;
            
            // Start of window label - adjusted for filler using consistent pixel scale
            const startLabelPosition = fillerDuration > 0 ? 
                fillerDuration * pixelsPerMinute : 0;
            createLabel(window.windowStart, startLabelPosition, 'start', labelCount % 2 === 0);
            labelCount++;

            // Add labels for each segment transition, but only if there's enough space
            let cumulativeDuration = fillerDuration;
            segments.forEach((segment, index) => {
                // Add label at the start of each segment (except the first one, which is the window start)
                if (index > 0) {
                    const segmentStartPosition = cumulativeDuration * pixelsPerMinute;
                    // Find the measurement at this transition point
                    const segmentStartTime = new Date(segment.startTime);
                    const transitionMeasurement = currentMeasurements.find(m => 
                        Math.abs(new Date(m.timeStamp) - segmentStartTime) < 1000 // Within 1 second
                    );
                    if (transitionMeasurement) {
                        createLabel(transitionMeasurement, segmentStartPosition, 'transition', labelCount % 2 === 0);
                        labelCount++;
                    }
                }
                cumulativeDuration += segment.duration;
            });

            // End of window label using consistent pixel scale
            const endLabelPosition = fillerDuration > 0 ? 
                (fillerDuration + window.duration) * pixelsPerMinute : barWidth;
            createLabel(window.windowEnd, endLabelPosition, 'end', labelCount % 2 === 0);
            labelCount++;

            // Add special slack time label with tide indicator
            if (window.slackTime) {
                // Slack time should be positioned at the same location for all windows using consistent pixel scale
                // Position = maxStartToSlackTime from the start of the timeline
                const slackLabelPosition = maxStartToSlackTime * pixelsPerMinute;
                
                // Create container for slack time information (time + tide type)
                const slackContainer = document.createElement('div');
                slackContainer.className = 'slack-container';
                slackContainer.style.left = `${slackLabelPosition}px`;
                
                // Add tide type indicator (LW = Low Water, HW = High Water)
                if (window.tideIndicator) {
                    const tideLabel = document.createElement('div');
                    tideLabel.textContent = window.tideIndicator;
                    tideLabel.className = 'tide-indicator';
                    slackContainer.appendChild(tideLabel);
                }
                
                // Add the actual slack time
                const slackLabel = document.createElement('div');
                slackLabel.textContent = formatTime(window.slackTime.timeStamp);
                slackLabel.className = 'slack-time';
                slackContainer.appendChild(slackLabel);
                
                timeLabels.appendChild(slackContainer);
            }

            const moreInfo = document.createElement('div');
            moreInfo.className = 'more-info';
            moreInfo.textContent = '🔍';
            moreInfo.setAttribute('role', 'button');
            moreInfo.setAttribute('aria-label', 'Bekijk extra informatie over dit duikvenster');
            moreInfo.tabIndex = 0;
            moreInfo.style.cursor = 'pointer';

            timelineBarContainer.classList.add('interactive-timeline');
            timelineBarContainer.setAttribute('role', 'button');
            timelineBarContainer.setAttribute('aria-label', 'Open duikvenster detailkaart');
            timelineBarContainer.tabIndex = 0;
            timelineBarContainer.style.cursor = 'pointer';

            const openPopup = (event) => {
                event.stopPropagation();
                showDiveWindowPopup(window, diveSiteName, moonphases);
            };

            timelineRow.addEventListener('click', openPopup);
            timelineRow.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    showDiveWindowPopup(window, diveSiteName, moonphases);
                }
            });

            timelineBarContainer.addEventListener('click', openPopup);
            timelineBarContainer.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    showDiveWindowPopup(window, diveSiteName, moonphases);
                }
            });

            moreInfo.addEventListener('click', openPopup);
            moreInfo.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    showDiveWindowPopup(window, diveSiteName, moonphases);
                }
            });            
            
            // Assemble the complete timeline row
            timelineBarContainer.appendChild(timelineBar);
            timelineBarContainer.appendChild(timeLabels);
            timelineRow.appendChild(timelineBarContainer);
            timelineRow.appendChild(moreInfo);

            // Add this timeline row to the main container
            timelineContainer.appendChild(timelineRow);
        });

        // Add spacing and append timeline to the page
        timelineContainer.style.marginBottom = "20px";
        diveWindowsContainer.appendChild(timelineContainer);
        
        // Add mobile scroll hint for timeline
        const scrollHint = document.createElement('div');
        scrollHint.className = 'scroll-hint';
        scrollHint.innerHTML = '↔ Swipe om tijdlijn te bekijken';
        scrollHint.style.display = 'none'; // Hidden by default, shown via CSS media query
        diveWindowsContainer.appendChild(scrollHint);

        // update the width of the date label to match the dive window timeline bar width for better alignment
        const dateLabels = timelineContainer.querySelectorAll('.timeline-date');
        const bars = document.querySelectorAll('.timeline-bar');
        const maxDateLabelWidth = getMaxElementWidth(bars);

        dateLabels.forEach(label => {
            label.style.width = maxDateLabelWidth + 'px';
        });

        // PHASE 3: Create detailed current data table (collapsible section)
        // Add collapsible header for detailed current information
        const currentDetailsHeader = document.createElement('h2');
        currentDetailsHeader.style.cursor = 'pointer';
        currentDetailsHeader.style.userSelect = 'none';
        currentDetailsHeader.innerHTML = '<span class="collapse-arrow">▼</span> Stromingsdetails';
        
        // Create container for the detailed data table (hidden by default)
        const detailsContainer = document.createElement('div');
        detailsContainer.id = 'details-container';
        detailsContainer.style.display = 'none'; // Collapsed by default to save screen space
        
        // Add click handler to toggle the detailed view
        currentDetailsHeader.addEventListener('click', function() {
            const arrow = this.querySelector('.collapse-arrow');
            if (detailsContainer.style.display === 'none') {
                detailsContainer.style.display = 'block';
                arrow.textContent = '▲'; // Change arrow to indicate expanded state
            } else {
                detailsContainer.style.display = 'none';
                arrow.textContent = '▼'; // Change arrow to indicate collapsed state
            }
        });
        
        resultsContainer.appendChild(currentDetailsHeader);

        // Create comprehensive data table showing all current measurements
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create table headers for the detailed current data
        const headerRow = document.createElement('tr');
        const dateHeader = document.createElement('th');
        dateHeader.textContent = 'Datum'; // Date column
        const timeHeader = document.createElement('th');
        timeHeader.textContent = 'Tijd'; // Time column
        const valueHeader = document.createElement('th');
        valueHeader.textContent = 'Stroming (cm/s)'; // Current speed in cm/s
        const DirectionHeader = document.createElement('th');
        DirectionHeader.textContent = 'Richting (°)'; // Current direction in degrees

        // Assemble table header
        headerRow.appendChild(dateHeader);
        headerRow.appendChild(timeHeader);
        headerRow.appendChild(valueHeader);
        headerRow.appendChild(DirectionHeader);
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Populate table with all current measurement data
        // Note: slack times were already calculated earlier, so we just use the isLowest flag
        currentMeasurements.forEach((measurement, index) => {
            if (measurement.speed === null || measurement.speed === undefined || Number.isNaN(measurement.speed)) return; // Skip only invalid current data
            
            const row = document.createElement('tr');
            const dateCell = document.createElement('td');
            const timeCell = document.createElement('td');
            const valueCell = document.createElement('td');
            const directionCell = document.createElement('td');

            // Format and populate cell data
            dateCell.textContent = formatDate(measurement.timeStamp);
            timeCell.textContent = formatTime(measurement.timeStamp);
            valueCell.textContent = Math.round(measurement.speed * 100); // Convert m/s to cm/s and round
            directionCell.textContent = measurement.direction + " (" + getWindDirection(measurement.direction) + ")";

            // Apply color-coded background based on current strength and slack times
            if (measurement.isLowest) {
                // Dark green for slack times (minimal current, ideal for diving)
                row.style.backgroundColor = '#81bd81'; // darker green
            } else if (measurement.isPeak) {
                // Light purple for peak currents (maximum current, distinctive but not alarming)
                row.style.backgroundColor = '#c47878'; // light purple
            } else if (measurement.speed > 0.30) {
                // Red for strong current (diving not recommended)
                row.style.backgroundColor = '#ffcccc'; // light pastel red
            } else if (measurement.speed > 0.20) {
                // Orange for moderate current (experienced divers only)
                row.style.backgroundColor = '#ffe6cc'; // light pastel orange
            } else {
                // Light green for weak current (suitable for all divers)
                row.style.backgroundColor = '#ccffcc'; // light pastel green
            }
            
            // Assemble table row
            row.appendChild(dateCell);
            row.appendChild(timeCell);
            row.appendChild(valueCell);
            row.appendChild(directionCell);
            tbody.appendChild(row);
        });

        // Finalize and display the results
        table.appendChild(tbody);
        
        // Create a wrapper for horizontal scrolling on mobile
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        tableWrapper.appendChild(table);
        
        detailsContainer.appendChild(tableWrapper);
        resultsContainer.appendChild(detailsContainer);
        
        // Show the color-coded legend now that results are displayed
        legend.style.display = 'inline-block';
    } else {
        // Handle case where no data is available from the API
        resultsContainer.textContent = 'No results found.';
    }
}

/**
 * Converts UTC timestamp to browser's local timezone.
 * Handles the API's timestamp format and ensures proper timezone conversion.
 * @param {string} utcstring - UTC timestamp string from API (format: YYYY-MM-DDTHH:MM:SSZ)
 * @returns {Date} - Date object in local timezone
 */
function UTCToLocal(utcstring) {
    // Ensure timestamp has proper milliseconds format for Date constructor
    utcISOString = utcstring.replace(':00Z',':00.000Z');
    var strUTC = ( new Date(utcISOString) ).toISOString();
    var datetimeLocal = new Date( strUTC );

    return datetimeLocal; 
}

/**
 * Formats a UTC timestamp into local time string (HH:MM).
 * @param {string} timestamp - UTC timestamp string from API.
 * @returns {string} - Local time formatted as HH:MM.
 */
function formatTime(timestamp) {
    return UTCToLocal(timestamp).toLocaleString().split(', ')[1].substring(0, 5);
}

/**
 * Formats a UTC timestamp into local date string.
 * @param {string} timestamp - UTC timestamp string from API.
 * @returns {string} - Local date string.
 */
function formatDate(timestamp) {
    return UTCToLocal(timestamp).toLocaleString().split(', ')[0];
}

/**
 * Format date label to display only date portion, with "Vandaag" for today and "Morgen" for tomorrow.
 * @param {string} timestamp - UTC timestamp string
 * @returns {string} - Formatted date string
 */
function formatDateLabel(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) {
        return 'Vandaag';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Morgen';
    } else {
        return formatDate(timestamp);
    }
};


/**
 * Converts local datetime string to UTC format required by the RWS API.
 * Takes browser's local time and converts it to UTC for API requests.
 * @param {string} localstring - Local datetime string (format: YYYY-MM-DDTHH:MM:SS)
 * @returns {string} - UTC timestamp string formatted for API (YYYY-MM-DDTHH:MM:SSZ)
 */
function LocalToUTC(localstring) {
    // Convert local time to UTC ISO string
    var strUTC = ( new Date(localstring) ).toISOString();
    // Format for RWS API (remove milliseconds, use Z suffix)
    strUTCFormatted = strUTC.replace(':00.000Z',':00Z');
    return strUTCFormatted; 
}

// Initialize the page when it loads - set default date/time values and UI behavior
window.onload = function() {
    setDefaultDateTime();

    const diveSiteSelect = document.getElementById('diveSite');
    const diveWindowsContainer = document.getElementById('dive-windows');
    const resultsContainer = document.getElementById('results');
    const startDateInput = document.getElementById('startDate');
    const startTimeInput = document.getElementById('startTime');
    const endDateInput = document.getElementById('endDate');
    const onlyDiveLocationsCheckbox = document.getElementById('onlyDiveLocations');

    if (diveSiteSelect && diveWindowsContainer && resultsContainer) {
        diveSiteSelect.addEventListener('change', () => {
            // Save selected dive site to local storage
            localStorage.setItem('selectedDiveSite', diveSiteSelect.value);
            updateSelectedMarkerHighlight();
            openSelectedMarkerPopup();
            diveWindowsContainer.innerHTML = '';
            resultsContainer.innerHTML = '';
        });
    }

    if (onlyDiveLocationsCheckbox && diveWindowsContainer && resultsContainer) {
        // Restore checkbox state from local storage if available
        const savedState = localStorage.getItem('onlyDiveLocations');
        if (savedState !== null) {
            onlyDiveLocationsCheckbox.checked = savedState === 'true';
        }
        
        onlyDiveLocationsCheckbox.addEventListener('change', () => {
            // Save checkbox state to local storage
            localStorage.setItem('onlyDiveLocations', onlyDiveLocationsCheckbox.checked);
            renderDiveSites();
            diveWindowsContainer.innerHTML = '';
            resultsContainer.innerHTML = '';
        });
    }

    if (startDateInput) {
        startDateInput.addEventListener('change', syncEndDateTimeConstraints);
    }

    if (startTimeInput) {
        startTimeInput.addEventListener('change', syncEndDateTimeConstraints);
    }

    if (endDateInput) {
        endDateInput.addEventListener('change', syncEndDateTimeConstraints);
    }

    loadDiveSites();
    initDiveMap();
    
    // Initialize back to top button visibility
    setupBackToTopButton();
};

/**
 * Shows a popup card with the selected dive window visualization.
 * The popup duplicates the clicked timeline row to preserve the exact visible dive window.
 * @param {Object} windowData - The selected dive window object.
 * @param {string} diveSiteName - The name of the selected dive site.
 * @param {HTMLElement} timelineRow - The timeline row element to clone.
 */
function showDiveWindowPopup(windowData, diveSiteName, moonphases) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.tabIndex = -1;

    const card = document.createElement('div');
    card.className = 'popup-card';

    const header = document.createElement('div');
    header.className = 'popup-card-header';

    const title = document.createElement('h2');
    title.textContent = `Duikvenster ${diveSiteName} ${formatDateLabel(windowData.slackTime.timeStamp)} ${formatTime(windowData.slackTime.timeStamp)}`;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'popup-card-close';
    closeButton.setAttribute('aria-label', 'Sluit duikvenster kaart');
    closeButton.textContent = '✕';

    header.appendChild(title);
    header.appendChild(closeButton);
    card.appendChild(header);

    const content = document.createElement('div');
    content.className = 'popup-card-content';

    const rowMoonPhase = GetMoonPhaseForDate(windowData.slackTime.timeStamp, moonphases);
    const advancedWindow = windowData.advancedWindow || {};
    const beginnerWindow = windowData.beginnerWindow || {};
    const hasAdvanced = advancedWindow.startTime && advancedWindow.endTime;
    const hasBeginner = beginnerWindow.startTime && beginnerWindow.endTime;
    const hasSlack = windowData.slackTime && windowData.slackTime.timeStamp;

    if (rowMoonPhase || hasAdvanced || hasBeginner || hasSlack) {
        const extraInfo = document.createElement('div');
        extraInfo.className = 'popup-extra-info';

        if (rowMoonPhase) {
            const header = document.createElement('div');
            header.className = 'popup-extra-info-header';

            const moonIcon = document.createElement('img');
            moonIcon.src = rowMoonPhase.icon;
            moonIcon.alt = rowMoonPhase.name;
            moonIcon.title = rowMoonPhase.name;
            moonIcon.className = 'moon-icon';

            const text = document.createElement('span');
            text.textContent = rowMoonPhase.name;

            header.appendChild(moonIcon);
            header.appendChild(text);
            extraInfo.appendChild(header);
        }

        const calculateDurationText = (startTime, endTime) => {
            if (!startTime || !endTime) {
                return 'n.v.t.';
            }
            const deltaMinutes = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));
            const hours = Math.floor(deltaMinutes / 60);
            const minutes = deltaMinutes % 60;
            return hours > 0 ? `${hours}u ${minutes}m` : `${minutes}m`;
        };

        const createInfoRow = (labelText, value1, value2) => {
            const row = document.createElement('tr');

            const labelCell = document.createElement('td');
            labelCell.className = 'popup-info-label';
            labelCell.textContent = labelText;

            const durationCell = document.createElement('td');
            durationCell.className = 'popup-info-duration';
            durationCell.textContent = value1;

            const timeCell = document.createElement('td');
            timeCell.className = 'popup-info-time';
            timeCell.textContent = value2

            row.appendChild(labelCell);
            row.appendChild(durationCell);
            row.appendChild(timeCell);
            return row;
        };

        const extraInfoTable = document.createElement('table');
        extraInfoTable.className = 'popup-extra-info-table';

        if (hasBeginner) {
            const durationText = calculateDurationText(beginnerWindow.startTime, beginnerWindow.endTime);
            const timeText = beginnerWindow.startTime && beginnerWindow.endTime ? `${formatTime(beginnerWindow.startTime)} - ${formatTime(beginnerWindow.endTime)}` : 'n.v.t.';
            extraInfoTable.appendChild(createInfoRow('Duikvenster matig', durationText, timeText));
        }
        if (hasAdvanced) {
            const durationText = calculateDurationText(advancedWindow.startTime, advancedWindow.endTime);
            const timeText = advancedWindow.startTime && advancedWindow.endTime ? `${formatTime(advancedWindow.startTime)} - ${formatTime(advancedWindow.endTime)}` : 'n.v.t.';
            extraInfoTable.appendChild(createInfoRow('Duikvenster gevorderd', durationText, timeText));
        }
        if (hasSlack) {
            slackTimeText = windowData.slackTime.timeStamp ? formatTime(windowData.slackTime.timeStamp) : 'n.v.t.';
            slackPeakText = windowData.tideIndicator ? `${windowData.tideIndicator}` : 'n.v.t.';
            extraInfoTable.appendChild(createInfoRow('Kentering', slackPeakText, slackTimeText));
        }

        extraInfo.appendChild(extraInfoTable);
        content.appendChild(extraInfo);
    }

    if (Array.isArray(windowData.measurements) && windowData.measurements.length > 0) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'popup-chart-container';

        const chartTitle = document.createElement('div');
        chartTitle.className = 'popup-chart-title';
        chartTitle.textContent = 'Stroming tijdens dit duikvenster';
        chartContainer.appendChild(chartTitle);

        const chartCanvas = document.createElement('canvas');
        chartContainer.appendChild(chartCanvas);
        content.appendChild(chartContainer);

        const labels = [];
        const lowSpeed = [];
        const mediumSpeed = [];
        const highSpeed = [];

        const getBand = (value) => {
            if (value > 30) return 'high';
            if (value > 20) return 'medium';
            return 'low';
        };

        const getBoundaryThreshold = (bandA, bandB) => {
            const pair = [bandA, bandB].sort().join('-');
            if (pair === 'high-medium') return 30;
            if (pair === 'low-medium') return 20;
            return null;
        };

  

        windowData.measurements.forEach((item, index) => {
            const value = Math.round(item.speed * 100);
            const band = getBand(value);
            labels.push(formatTime(item.timeStamp));
            lowSpeed.push(band === 'low' ? value : null);
            mediumSpeed.push(band === 'medium' ? value : null);
            highSpeed.push(band === 'high' ? value : null);

            const nextItem = windowData.measurements[index + 1];
            if (nextItem) {
                const nextValue = Math.round(nextItem.speed * 100);
                const nextBand = getBand(nextValue);
                if (nextBand !== band) {
                    const threshold = getBoundaryThreshold(band, nextBand);
                    if (threshold !== null) {
                        const boundaryLabel = `${formatTime(nextItem.timeStamp)}\u200B`;
                        labels.push(boundaryLabel);
                        lowSpeed.push((band === 'low' || nextBand === 'low') && threshold === 20 ? 20 : null);
                        mediumSpeed.push((band === 'medium' || nextBand === 'medium') && threshold === 20 ? 20 : (band === 'medium' || nextBand === 'medium') && threshold === 30 ? 30 : null);
                        highSpeed.push((band === 'high' || nextBand === 'high') && threshold === 30 ? 30 : null);
                    }
                }
            }
        });

        // Find the slack tide index and time for the callout annotation
        let slackTideIndex = -1;
        let slackTideTime = null;
        
        if (windowData.slackTime && windowData.slackTime.timeStamp) {
            slackTideTime = formatTime(windowData.slackTime.timeStamp);
            // Find the index of the slack tide measurement in the array
            slackTideIndex = labels.indexOf(slackTideTime);
        }

        new Chart(chartCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '≤ 20 cm/s',
                        data: lowSpeed,
                        backgroundColor: 'rgba(34, 197, 94, 0.75)',
                        borderColor: 'rgba(34, 197, 94, 0.9)',
                        fill: true,
                        spanGaps: false,
                        tension: 0.3,
                        pointRadius: 0,
                        borderWidth: 1,
                        order: 1
                    },
                    {
                        label: '21-30 cm/s',
                        data: mediumSpeed,
                        backgroundColor: 'rgba(251, 191, 36, 0.75)',
                        borderColor: 'rgba(234, 115, 22, 0.9)',
                        fill: true,
                        spanGaps: false,
                        tension: 0.3,
                        pointRadius: 0,
                        borderWidth: 1,
                        order: 2
                    },
                    {
                        label: '> 30 cm/s',
                        data: highSpeed,
                        backgroundColor: 'rgba(244, 63, 94, 0.75)',
                        borderColor: 'rgba(220, 38, 38, 0.9)',
                        fill: true,
                        spanGaps: false,
                        tension: 0.3,
                        pointRadius: 0,
                        borderWidth: 1,
                        order: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Tijd' },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: 'Snelheid (cm/s)' },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { mode: 'index', intersect: false },
                    annotation: {
                        annotations: {
                            slackTideCallout: {
                                type: 'label',
                                xValue: slackTideIndex !== -1 ? labels[slackTideIndex] : null,
                                yValue: slackTideIndex !== -1 ? Math.round(windowData.slackTime.speed * 100) : 0,
                                content: slackTideIndex !== -1 ? [`${slackPeakText} ${slackTideTime}`] : [],
                                //backgroundColor: 'rgba(0, 102, 0, 0.8)',
                                color: 'rgba(0, 102, 0, 0.8)',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                },
                                padding: 6,
                                borderRadius: 4,
                                position: 'top',
                                xAdjust: 10,
                                yAdjust: -180,
                                callout: {
                                    display: true,
                                    borderColor: 'rgba(0, 102, 0, 0.8)',
                                    borderWidth: 2
                                },
                                display: slackTideIndex !== -1
                            }
                        }
                    }
                },
                interaction: { mode: 'index', intersect: false }
            }
        });
    }

    card.appendChild(content);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const closePopup = () => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    };

    closeButton.addEventListener('click', closePopup);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closePopup();
        }
    });

    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', onKeyDown);
        }
    };
    document.addEventListener('keydown', onKeyDown);
    overlay.focus();
}

/**
 * Smoothly scroll to the top of the page
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Setup scroll event listener for showing/hiding back to top button
 */
function setupBackToTopButton() {
    const backToTopButton = document.getElementById('fixed-back-to-top');
    if (!backToTopButton) return;
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });
}
