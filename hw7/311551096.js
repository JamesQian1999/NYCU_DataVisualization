// Define a function that returns color ranges based on the pollutant
function pollutantColors(pollutant) {
    const colorRanges = {
        'CO': ["#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"],
        'NO2': ["#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45"],
        'O3': ["#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801"],
        'PM2.5': ["#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d"],
        'PM10': ["#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"],
        'SO2': ["#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252"]
    };
    return colorRanges[pollutant] || colorRanges['CO']; // default if not found
}

d3.csv("http://vis.lab.djosix.com:2023/data/air-pollution.csv").then(data => {
    const parseDate = d3.timeParse("%Y-%m-%d %H:%M");
    data.forEach(d => {
      d['Measurement date'] = parseDate(d['Measurement date']);
      d.Address  = d.Address.split(",")[2];
      d['CO']    = +d['CO'];
      d['NO2']   = +d['NO2'];
      d['O3']    = +d['O3'];
      d['PM2.5'] = +d['PM2.5'];
      d['PM10']  = +d['PM10'];
      d['SO2']   = +d['SO2'];
    })
    
    console.log("data:",data);
    let groupedByDistrict = Object.groupBy(data, ({ Address }) => Address);
    const districts = Object.keys(groupedByDistrict);

    console.log("groupedByDistrict:",groupedByDistrict);


    // Add a time formatter for day resolution
    const formatDate = d3.timeFormat("%Y-%m-%d");

    // Process the existing 'data' array to group by day and calculate daily averages
    let dailyAveragesByDistrict = {};
    data.forEach(function(d) {
    // Format the measurement date to a day string for grouping
    const day = formatDate(d['Measurement date']);
    const district = d['Address'];

    // Initialize the district and day if not already done
    if (!dailyAveragesByDistrict[district]) {
        dailyAveragesByDistrict[district] = {};
    }
    if (!dailyAveragesByDistrict[district][day]) {
        dailyAveragesByDistrict[district][day] = [];
    }

    // Push the current record into the district's day array
    dailyAveragesByDistrict[district][day].push(d);
    });

    // Now calculate the averages for each day for each district
    let finalAverages = [];
    Object.keys(dailyAveragesByDistrict).forEach(function(district) {
        Object.keys(dailyAveragesByDistrict[district]).forEach(function(day) {
            let dayRecords = dailyAveragesByDistrict[district][day];
            let averageRecord = {
                'Measurement date': day,
                'Address': district,
                'CO': d3.mean(dayRecords, function(d) { return d['CO']; }),
                'NO2': d3.mean(dayRecords, function(d) { return d['NO2']; }),
                'O3': d3.mean(dayRecords, function(d) { return d['O3']; }),
                'PM2.5': d3.mean(dayRecords, function(d) { return d['PM2.5']; }),
                'PM10': d3.mean(dayRecords, function(d) { return d['PM10']; }),
                'SO2': d3.mean(dayRecords, function(d) { return d['SO2']; }),
            };
            finalAverages.push(averageRecord);
        });
    });

    console.log("Daily Averages by District:", finalAverages)
    groupedByDistrict = Object.groupBy(finalAverages, ({ Address }) => Address);

    SortData = []
    districts.forEach(d => {
        SortData.push({"district": d, 
                        "values" :{
                            "time"  : groupedByDistrict[d].map(item => item['Measurement date']),
                            "CO"    : groupedByDistrict[d].map(item => item['CO']),
                            "NO2"   : groupedByDistrict[d].map(item => item['NO2']),
                            "O3"    : groupedByDistrict[d].map(item => item['O3']),
                            "PM2.5" : groupedByDistrict[d].map(item => item['PM2.5']),
                            "PM10"  : groupedByDistrict[d].map(item => item['PM10']),
                            "SO2"   : groupedByDistrict[d].map(item => item['SO2'])
                        }});
    });
    console.log("SortData:",SortData);


    // Correctly bind data and create horizon charts
    const pollutants = ['CO', 'NO2', 'O3', 'PM2.5', 'PM10', 'SO2']; // List of pollutants

    const districtWrapper = d3.select('body').append('div').attr('class', 'districtWrapper');
    SortData.forEach(districtData => {
        // Create a container for each district

        pollutants.forEach(pollutant => {
            const horizonDiv = districtWrapper.append('div')
                .attr('class', 'horizon');
    
            // Pass the data for the specific district and pollutant into the horizon chart
            horizonDiv.datum(districtData.values[pollutant])
                .each(function(d) {
                    d3.horizonChart()
                    .title(`${districtData.district} - ${pollutant}`) // Set the title to district and pollutant
                    .height(70) // Reduced height if too many charts
                    .colors(pollutantColors(pollutant)) // Call a function to get the color range per pollutant
                    .call(this, d);
                });
        });
    });



});

