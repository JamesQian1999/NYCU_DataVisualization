// Assuming you've included D3 in your HTML file
// Also assuming the data is pre-processed and available in the required format

// Function to draw a horizon chart
function drawHorizonChart(data, district, pollutant, container) {
    // Define dimensions and margins
    const margin = { top: 20, right: 30, bottom: 30, left: 40 },
          width = 600 - margin.left - margin.right,
          height = 150 - margin.top - margin.bottom;
    
    // Create SVG container
    const svg = d3.select(container)
                  .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Define scales and axes
    const x = d3.scaleTime().range([0, width]),
          y = d3.scaleLinear().range([height, 0]);
    const xAxis = d3.axisBottom(x),
          yAxis = d3.axisLeft(y);
    
    // Process data
    data.forEach(d => {
      d.date = d3.timeParse("%Y-%m-%d")(d.date);
      d.value = +d.value;
    });
    
    // Set domain for scales
    x.domain(d3.extent(data, d => d.date));
    y.domain([0, d3.max(data, d => d.value)]);
    
    // Draw axes
    svg.append("g")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);
    svg.append("g")
       .call(yAxis);
    
    // Draw horizon chart
    svg.selectAll(".area")
       .data(data)
       .enter().append("path")
       .attr("class", "area")
       .attr("d", d3.area()
           .x(d => x(d.date))
           .y0(height)
           .y1(d => y(d.value)))
       .style("fill", pollutantColor(pollutant)); // Assign color based on pollutant
  
    // Add labels
    svg.append("text")
       .attr("x", (width / 2))             
       .attr("y", 0 - (margin.top / 2))
       .attr("text-anchor", "middle")  
       .style("font-size", "16px") 
       .text(district + " - " + pollutant);
  }
  
  // Function to assign color based on pollutant
  function pollutantColor(pollutant) {
    const colorMap = {
      "SO2": "#e41a1c",
      "NO2": "#377eb8",
      "O3": "#4daf4a",
      "CO": "#984ea3",
      "PM10": "#ff7f00",
      "PM2.5": "#ffff33"
    };
    return colorMap[pollutant];
  }
  
  // Load data and draw charts
  d3.csv("air-pollution.csv").then(data => {
    data.forEach(d => {
      d.Address = d.Address.split(",")[2];
    })
    const districts = Array.from(new Set(data.map(d => d.Address)));
    const pollutants = ["SO2", "NO2", "O3", "CO", "PM10", "PM2.5"];
    districts.forEach(district => {
      pollutants.forEach(pollutant => {
        const filteredData = data.filter(d => d.district === district && d.pollutant === pollutant);
        drawHorizonChart(filteredData, district, pollutant, "#chart-container");
      });
    });
  });
  