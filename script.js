
// Handle form
document.addEventListener('DOMContentLoaded', function() {
    // Get real time values
    document.getElementById('weight').oninput = function() {
        document.getElementById('weightValue').textContent = this.value + ' kg';
    };

    document.getElementById('height').oninput = function() {
        document.getElementById('heightValue').textContent = this.value + ' cm';
    };

    document.getElementById('date').oninput = function() {
        document.getElementById('dateValue').textContent = this.value;
    };

    document.getElementById('sex').oninput = function() {
        document.getElementById('sexValue').textContent = this.value;
    };

    document.getElementById('maleName').oninput = function() {
        document.getElementById('maleNameValue').textContent = this.value;
    };

    document.getElementById('femaleName').oninput = function() {
        document.getElementById('femaleNameValue').textContent = this.value;
    };

    // SUbmit
    document.getElementById('guessForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const data = {
            weight: document.getElementById('weight').value,
            height: document.getElementById('height').value,
            date: document.getElementById('date').value,
            sex: document.getElementById('sex').value,
            maleName: document.getElementById('maleName').value,
            femaleName: document.getElementById('femaleName').value,
            guesserName: document.getElementById('guesserName').value
        };

        fetch('https://baby-guess.azurewebsites.net/api/guess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            alert('Guess submitted successfully!');
            loadResults(); // Reload the results after a successful submission
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Failed to submit guess.');
        });
    });

    loadResults(); // Load results when the page is loaded
});


// Function to load results from the API
function loadResults() {
    fetch('https://baby-guess.azurewebsites.net/api/guess')
    .then(response => response.json())
    .then(data => {
        populateResultsTable(data);
    })
    .catch(error => {
        console.error('Error fetching results:', error);
    });
}

// Load results when the page is loaded
document.addEventListener('DOMContentLoaded', loadResults);

function populateResultsTable(results) {
    const maleNames = {};
    const femaleNames = {};
    const combinedNames = [];
    const tableBody = document.getElementById('resultsTable').querySelector('tbody');
    tableBody.innerHTML = ''; // Clear existing table data

    results.forEach(result => {
        if (result.guesserName && result.weight && result.height && 
            result.date && result.sex && 
            result.maleName && result.femaleName) {
            // const row = document.createElement('tr');
            // row.innerHTML = `
            //     <td>${result.guesserName}</td>
            //     <td>${result.weight} kg</td>
            //     <td>${result.height} cm</td>
            //     <td>${result.date}</td>
            //     <td>${result.sex}</td>
            //     <td>${result.maleName}</td>
            //     <td>${result.femaleName}</td>
            // `;
            // tableBody.appendChild(row);
            // Count names for the word cloud
            maleNames[result.maleName] = (maleNames[result.maleName] || 0) + 1;
            femaleNames[result.femaleName] = (femaleNames[result.femaleName] || 0) + 1;
        }
    });

    // Prepare combined data with explicit category assignment
    Object.keys(maleNames).forEach(name => {
        combinedNames.push({x: name, value: maleNames[name], category: 'Maschio'}); 
    });
    Object.keys(femaleNames).forEach(name => {
        combinedNames.push({x: name, value: femaleNames[name], category: 'Femmina'});
    });

    //createWordCloud(maleNames, 'maleNameCloud');
    //createWordCloud(femaleNames, 'femaleNameCloud');
    createCombinedWordCloud(combinedNames, 'combinedNameCloud');
    createScatterPlot(results)
    createHeatmap(prepareHeatmapData(results));
    // document.addEventListener('DOMContentLoaded', function() {
    //     // Ensure this is not causing multiple executions
    //     //var cal = new CalHeatMap();
    //     createHeatmap(prepareHeatmapData(results));
    // }, { once: true }); // The 'once' option auto-removes the listener after firing
}



function createWordCloud(names, elementId) {
    const data = Object.keys(names).map(name => {
        return {x: name, value: names[name]};
    });

    // ensure the container is ready for the new chart
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    // create a tag (word) cloud chart
    anychart.onDocumentReady(function () {
        var chart = anychart.tagCloud(data);

        // set the chart title
        chart.title(`Names - ${elementId.replace('Cloud', '')}`);

        // configure the visual settings of the chart
        chart.angles([0])
        chart.colorRange(false);

        // display the word cloud chart
        chart.container(elementId);
        chart.draw();
    });
}


function createCombinedWordCloud(names, elementId) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    anychart.onDocumentReady(function () {
        var chart = anychart.tagCloud(names);

        // chart.title('Nomi');
        chart.angles([0])
        chart.colorRange(false);

        // Set text color based on category within the data mapping.

        chart.data(names, {
            mode: 'by-x',
            categories: ['category']
        });

        chart.colorScale(anychart.scales.ordinalColor().colors(['#76cfe3', '#e290da']));


        chart.textSpacing(5);
        chart.normal().fontFamily('Arial').fontWeight(600);
        chart.tooltip().format(function() {
            return this.value + ' volte';
        });

        chart.container(elementId);
        chart.draw();
    });
}

function createScatterPlot(results) {
    const weights = results.map(result => result.weight);
    const heights = results.map(result => result.height);
    const guessers = results.map(result => result.guesserName);
    const sexes = results.map(result => result.sex);

    var trace = {
        x: weights,
        y: heights,
        mode: 'markers',
        type: 'scatter',
        text: guessers.map((guesser, index) => `Guesser: ${guesser}<br>Peso: ${weights[index]} kg<br>Altezza: ${heights[index]} cm`),
        hoverinfo: 'text',
        marker: {
            size: 12,
            color: sexes.map(sex => sex === 'Maschio' ? '#0000FF' : '#FFC0CB') // Blue for Maschio, Pink for Femmina
        }
    };

    var layout = {
        title: "Pesi & Altezze",
        xaxis: {
            title: 'Peso (kg)',
            range: [2, 4],
            fixedrange: true
        },
        yaxis: {
            title: 'Altezza (cm)',
            range: [35, 70],
            fixedrange: true
        },
        hovermode: 'closest',
        margin: { l: 40, r: 40, t: 40, b: 40 }
    };

    var config = {
        displayModeBar: false, // This hides the toolbar
        // staticPlot: true,       // Prevents zoom and pan
        // scrollZoom: false,
        // dragMode: false
    };

    Plotly.newPlot('scatterPlot', [trace], layout, config);
}


function createHeatmap(data) {
    var container = document.getElementById('calendar-heatmap');
    container.innerHTML = ''; // Clear existing heatmap before creating a new one

    var maxVal = Math.max(...Object.values(data)); // Assuming data is an object of date counts
    var step = maxVal / 4; // Divide max value into 4 steps for the legend

    var cal = new CalHeatMap();
    cal.init({
        itemSelector: "#calendar-heatmap",
        domain: "month",
        subDomain: "day",
        data: data,
        start: new Date(2024, 8, 1), // Correctly set for September
        end: new Date(2024, 10, 30), // Correctly set for end of November
        range: 3, // This should cover September to November if aligned correctly
        cellSize: 16,
        subDomainTextFormat: "%d",
        legend: [step, step * 2, step * 3, maxVal].map(Math.floor),
        displayLegend: true,
        tooltip: true,
        considerMissingDataAsZero: true,
        domainGutter: 10,
        domainDynamicDimension: false,
        domainLabelFormat: "%B %Y",
        subDomainTitleFormat: {
            empty: "No data on {date}",
            filled: "There were {count} entries on {date}"
        },
        domainLabelOrientation: "horizontal",
        legendColors: {
            min: "#efefef",
            max: "#08306b",
            empty: "white",
            base: "grey"
        }
    });
}


function prepareHeatmapData(results) {
    var dateCounts = {};
    results.forEach(function(result) {
        var date = new Date(result.date);
        var timestamp = Math.floor(date.getTime() / 1000); // Convert to UNIX timestamp in seconds
        if (timestamp >= new Date(2024, 8, 1).getTime() / 1000 && timestamp <= new Date(2024, 10, 30).getTime() / 1000) {
            dateCounts[timestamp] = (dateCounts[timestamp] || 0) + 1;
        }
    });
    return dateCounts;
}

document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('#calendar-heatmap');
    container.addEventListener('mouseover', function(e) {
        const tooltip = document.querySelector('.domain-tooltip');
        if (tooltip) {
            // Adjust the position based on the container’s boundaries
            const containerRect = container.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.top < containerRect.top) {
                tooltip.style.top = '0px'; // Adjust this value as necessary
            }
            if (tooltipRect.bottom > containerRect.bottom) {
                tooltip.style.top = `-${tooltipRect.height}px`; // Push it up by its own height
            }
        }
    });
});


// function createHeatmap(data) {
//     console.log(data)
//     var container = document.getElementById('calendar-heatmap');
//     container.innerHTML = ''; // Clear existing heatmap before creating a new one
//     const heatmap = new CalendarHeatmap();
//     heatmap.init({
//         id: 'calendar-heatmap', // the container ID
//         data: data,
//         coloring: '#ff4500', // Example coloring, change as needed
//         labels: {
//             days: false,
//             months: true,
//             custom: {
//                 weekDayLabels: null,
//                 monthLabels: 'MMM'
//             }
//         },
//         startYear: 2024,
//         startMonth: 9, // September
//         endYear: 2024,
//         endMonth: 11, // November
//         width: 600,  // Adjust as per container size or make responsive
//     });
// }

// function prepareHeatmapData(results) {
//     var dateCounts = {};
//     results.forEach(result => {
//         // Ensure the date is valid before processing
//         var date = new Date(result.date);
//         //console.log(resultDate);
//         //console.log(date);
//         if (!isNaN(date.getTime())) { // Check if the date is valid
//             var timestamp = date.toISOString().slice(0, 10); // YYYY-MM-DD format
//             dateCounts[timestamp] = (dateCounts[timestamp] || 0) + 1;
//             console.log('Valid date:', result.date);
//         } else {
//             // console.error('Invalid date:', result.date);
//         }
//     });
//     return dateCounts;
//}


