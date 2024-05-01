
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

        chart.title('Nomi');
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
            range: [2, 4]
        },
        yaxis: {
            title: 'Altezza (cm)',
            range: [35, 70]
        },
        hovermode: 'closest',
        margin: { l: 40, r: 40, t: 40, b: 40 }
    };

    var config = {
        displayModeBar: false // This hides the toolbar
    };

    Plotly.newPlot('scatterPlot', [trace], layout, config);
}


function createHeatmap(data) {
    var container = document.getElementById('calendar-heatmap');
    container.innerHTML = ''; // Clear existing heatmap before creating a new one
    var cal = new CalHeatMap();
    cal.init({
        itemSelector: "#calendar-heatmap",
        domain: "month",
        subDomain: "day",
        data: data,
        start: new Date(2024, 8, 1),
        end: new Date(2024, 10, 30),
        range: 3,
        cellSize: 20,
        subDomainTextFormat: "%d",
        legend: [1, 5, 10],
        displayLegend: true,
        tooltip: true,
        considerMissingDataAsZero: true,
        domainGutter: 10,
        domainDynamicDimension: false,
        nextSelector: "#next-button",
        previousSelector: "#prev-button",
        // Custom color scale
        scale: [1, 3, 5, 10],
        domainLabelFormat: "%B %Y",
        subDomainTitleFormat: {
            empty: "No data on {date}",
            filled: "There were {count} entries on {date}"
        },
        domainLabelOrientation: "horizontal",
        // Define the range of colors from lower to higher values
        range: 5, // The number of segments in your color scale
        legendColors: {
            min: "#efefef",
            max: "#08306b",
            empty: "white", // Background color for empty cells
            base: "grey" // Color used under the heatmap, visible when no data
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



