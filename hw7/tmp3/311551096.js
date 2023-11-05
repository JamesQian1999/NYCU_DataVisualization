d3.csv("../air-pollution.csv").then(data => {
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
    
    // districts = [{"stock":"A","values":[1,0.1,3,3.2]},{"stock":"B","values":[3.4,2,3,4]},{"stock":"C","values":[2.4,2,3.2,1.4]}];
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

    // You will need to create a wrapper div to contain all horizon chart divs
    const chartWrapper = d3.select('body').selectAll('div.chartWrapper')
    .data(SortData)
    .enter()
    .append('div')
    .attr('class', 'chartWrapper');

    // For each district, create a horizon chart for each pollutant
    SortData.forEach(districtData => {
    pollutants.forEach(pollutant => {
        chartWrapper.append('div')
        .datum(districtData.values[pollutant]) // Bind pollutant data
        .attr('class', 'horizon')
        .each(function(d) {
            d3.horizonChart()
            .title(`${districtData.district} - ${pollutant}`) // Set the title to district and pollutant
            .height(50)
            .colors(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]) // Example color range
            .call(this, d);
        });
    });
    });

    // d3.select('body')
    // .data(SortData)
    // .enter()
    // .append('div')
    // .attr('class', 'horizon')
    // .each(function(d) {
    //     d3.horizonChart()
    //         .title(d.district)
    //         .height(50)
    //         .call(this, d.values['CO'])
    //         ;
    // });

});

