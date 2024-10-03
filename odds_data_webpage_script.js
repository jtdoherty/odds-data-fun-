let sortDirection = 'desc';
let advantages = [];
let selectedSportsbooks = new Set();
let selectedSports = new Set();
let currentSortColumn = 'roi';

function sortAdvantages(advantages) {
    advantages.sort((a, b) => {
        const timeA = a.event_start_time ? new Date(a.event_start_time).getTime() : Infinity;
        const timeB = b.event_start_time ? new Date(b.event_start_time).getTime() : Infinity;
        return timeA - timeB;
    });
}

function sortByROI(advantages) {
    advantages.sort((a, b) => {
        const roiA = parseFloat(a.EV) || 0;
        const roiB = parseFloat(b.EV) || 0;
        return sortDirection === 'desc' ? roiB - roiA : roiA - roiB;
    });
}

function sortByDate(advantages) {
    advantages.sort((a, b) => {
        const timeA = a.event_start_time ? new Date(a.event_start_time).getTime() : Infinity;
        const timeB = b.event_start_time ? new Date(b.event_start_time).getTime() : Infinity;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });
}

function updateTable(filteredAdvantages) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const mostRecentFoundAt = filteredAdvantages.reduce((latest, advantage) => {
        const foundAt = advantage.lastFoundAt ? new Date(advantage.lastFoundAt) : null;
        return foundAt && (!latest || foundAt > latest) ? foundAt : latest;
    }, null);

    const lastFoundAtElement = document.getElementById('lastFoundAt');
    if (mostRecentFoundAt) {
        lastFoundAtElement.textContent = `Last Found At: ${mostRecentFoundAt.toLocaleString()}`;
    } else {
        lastFoundAtElement.textContent = 'Last Found At: N/A';
    }

    filteredAdvantages.forEach(advantage => {
        const row = document.createElement('tr');
        
        let formattedTime = 'N/A';
        if (advantage.event_start_time) {
            const date = new Date(advantage.event_start_time);
            formattedTime = date.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }

        row.innerHTML = `
            <td>
                <div>${advantage.market_name || 'N/A'}</div>
                <div class="text-sm text-gray-500">${advantage.competition_instance_name || 'N/A'}</div>
                <div class="text-sm text-gray-500">${formattedTime}</div>
                <div class="text-sm font-semibold text-gray-700">${advantage.sport || 'N/A'}</div>
            </td>
            <td>
                <div>${advantage.participant || 'N/A'}</div>
                <div class="text-sm text-gray-500">Type: ${advantage.type || 'N/A'}</div>
                <div class="text-sm text-gray-500">Source: ${advantage.source || 'N/A'}</div>
            </td>
            <td class="text-right">${advantage.implied_probability || 'N/A'}</td>
            <td class="text-right">
                <div class="flex">
                    <span class="font-bold mr-2">${advantage.outcome_payout || 'N/A'}</span>
                    <img src="/placeholder.svg?height=24&width=24" alt="Bookmaker" width="24" height="24">
                </div>
            </td>
            <td class="text-right font-bold text-green-600">${advantage.EV || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateSportsbookFilter(sportsbooks) {
    const filterContainer = document.querySelector('#sportsbook-filter .checkbox-group');
    sportsbooks.forEach(sportsbook => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = sportsbook;
        checkbox.value = sportsbook;
        checkbox.checked = true;
        selectedSportsbooks.add(sportsbook);

        const label = document.createElement('label');
        label.htmlFor = sportsbook;
        label.textContent = sportsbook;

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedSportsbooks.add(sportsbook);
            } else {
                selectedSportsbooks.delete(sportsbook);
            }
            updateTable(filterAdvantages(advantages));
        });

        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        filterContainer.appendChild(checkboxItem);
    });
}

function updateSportFilter(sports) {
    const sportFilterContainer = document.querySelector('#sport-filter .checkbox-group');
    sports.forEach(sport => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `sport-${sport}`;
        checkbox.value = sport;
        checkbox.checked = true;
        selectedSports.add(sport);

        const label = document.createElement('label');
        label.htmlFor = `sport-${sport}`;
        label.textContent = sport;

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedSports.add(sport);
            } else {
                selectedSports.delete(sport);
            }
            updateTable(filterAdvantages(advantages));
        });

        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        sportFilterContainer.appendChild(checkboxItem);
    });
}

function filterAdvantages(advantages) {
    return advantages.filter(advantage => 
        selectedSports.has(advantage.sport) &&
        selectedSportsbooks.has(advantage.source)
    );
}

function updateSortButtons() {
    const eventSortHeader = document.getElementById('eventSort');
    const roiSortHeader = document.getElementById('roiSort');

    eventSortHeader.className = `sortable-header ${currentSortColumn === 'date' ? sortDirection : ''}`;
    roiSortHeader.className = `sortable-header text-right ${currentSortColumn === 'roi' ? sortDirection : ''}`;

    eventSortHeader.querySelector('.arrow').textContent = currentSortColumn === 'date' ? (sortDirection === 'asc' ? '▲' : '▼') : '▼';
    roiSortHeader.querySelector('.arrow').textContent = currentSortColumn === 'roi' ? (sortDirection === 'asc' ? '▲' : '▼') : '▼';
}

function toggleFilters() {
    const filterSections = document.getElementById('filterSections');
    const toggleButton = document.getElementById('toggleFilters');
    if (filterSections.style.display === 'none') {
        filterSections.style.display = 'block';
        toggleButton.textContent = 'Hide Filters';
    } else {
        filterSections.style.display = 'none';
        toggleButton.textContent = 'Show Filters';
    }
}

// Updated function to fetch data from the specific JSON file
async function fetchAdvantagesData() {
    try {
        const response = await fetch('research/output7.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Could not fetch advantages data:", error);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        advantages = await fetchAdvantagesData();
        
        const sportsbooks = [...new Set(advantages.map(a => a.source))];
        updateSportsbookFilter(sportsbooks);
        
        const sports = [...new Set(advantages.map(a => a.sport))];
        updateSportFilter(sports);
        
        sortAdvantages(advantages);
        updateTable(filterAdvantages(advantages));

        const toggleButton = document.getElementById('toggleFilters');
        toggleButton.addEventListener('click', toggleFilters);

        const eventSortHeader = document.getElementById('eventSort');
        const roiSortHeader = document.getElementById('roiSort');

        eventSortHeader.addEventListener('click', () => {
            currentSortColumn = 'date';
            sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
            sortByDate(advantages);
            updateTable(filterAdvantages(advantages));
            updateSortButtons();
        });

        roiSortHeader.addEventListener('click', () => {
            currentSortColumn = 'roi';
            sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
            sortByROI(advantages);
            updateTable(filterAdvantages(advantages));
            updateSortButtons();
        });

        updateSortButtons();
    } catch (error) {
        console.error("Error initializing data:", error);
    }
});

// ... rest of your existing JavaScript code ...