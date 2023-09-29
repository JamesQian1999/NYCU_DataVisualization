
// set the dimensions and margins of the graph
const margin = {top: 20, right: 30, bottom: 80, left: 30},
  width = 960 - margin.left - margin.right,
  height = 1000 - margin.top - margin.bottom;
// append the svg object to the body of the page
const svg = d3.select("#container")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        `translate(${margin.left},${margin.top})`);

// Parse the Data
d3.csv("iris.csv").then( function(data) {

  // Color scale: give me a specie name, I return a color
  const color = d3.scaleOrdinal()
    .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica" ])
    .range([ "#440154ff", "#21908dff", "#fde725ff"])

  // Here I set the list of dimension manually to control the order of axis:
  dimensions = ["sepal length", "sepal width", "petal length", "petal width"]

  // For each dimension, I build a linear scale. I store all in a y object
  const y = {}
  for (i in dimensions) {
    n = dimensions[i]
    y[n] = d3.scaleLinear()
      .domain( [0,8] )
      .range([height, 0])
  }

  const dropdownMenu = (selection, props) => {
    const {
      options,
      onOptionClicked,
      selectedOption
    } = props;
    
    let select = selection.selectAll('select').data([null]);
    select = select.enter().append('select')
      .merge(select)
        .on('change', function() {
          onOptionClicked(this.value);
        });
    
    const option = select.selectAll('option').data(options);
    option.enter().append('option')
      .merge(option)
        .attr('value', d => d)
        .style("background", "#edf2ff")
        .property('selected', d => d === selectedOption)
        .text(d => d)
  };

  const render = () => {
      
    d3.select('#menu1')
      .call(dropdownMenu, {
        options: ['sepal length',
                  'sepal width',
                  'petal length',
                  'petal width'],
        // onOptionClicked: onXColumnClicked,
        // selectedOption: xColumn
      });
    
    d3.select('#menu2')
      .call(dropdownMenu, {
        options: ['sepal length',
                  'sepal width',
                  'petal length',
                  'petal width'],
        // onOptionClicked: onXColumnClicked,
        // selectedOption: xColumn
      });

      d3.select('#menu3')
      .call(dropdownMenu, {
        options: ['sepal length',
                  'sepal width',
                  'petal length',
                  'petal width'],
        // onOptionClicked: onXColumnClicked,
        // selectedOption: xColumn
      });
    
    d3.select('#menu4')
      .call(dropdownMenu, {
        options: ['sepal length',
                  'sepal width',
                  'petal length',
                  'petal width'],
        // onOptionClicked: onXColumnClicked,
        // selectedOption: xColumn
      });

  };

    render()

  // Build the X scale -> it find the best position for each Y axis
  x = d3.scalePoint()
    .range([0, width])
    .domain(dimensions);

  // Highlight the specie that is hovered
  const highlight = function(event, d){

    selected_specie = d.class

    // first every group turns grey
    d3.selectAll(".line")
      .transition().duration(200)
      .style("stroke", "lightgrey")
      .style("opacity", "0.2")
    // Second the hovered specie takes its color
    d3.selectAll("." + selected_specie)
      .transition().duration(200)
      .style("stroke", color(selected_specie))
      .style("opacity", "1")
  }

  // Unhighlight
  const doNotHighlight = function(event, d){
    d3.selectAll(".line")
      .transition().duration(200).delay(1000)
      .style("stroke", function(d){ return( color(d.class))} )
      .style("opacity", "1")
  }

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function path(d) {
      return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
  }

  // Draw the lines
  svg
    .selectAll("myPath")
    .data(data)
    .join("path")
      .attr("class", function (d) { return "line " + d.class } ) // 2 class for each line: 'line' and the group name
      .attr("d",  path)
      .style("fill", "none" )
      .style("stroke", function(d){ return( color(d.class))} )
      .style("opacity", 0.5)
      .on("mouseover", highlight)
      .on("mouseleave", doNotHighlight )

  // Draw the axis:
  svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append("g")
    .attr("class", "axis")
    // I translate this element to its right position on the x axis
    .attr("transform", function(d) { return `translate(${x(d)})`})
    // And I build the axis with the call function
    .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d])); })
    // Add axis title
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; })
      .style("fill", "black")

})