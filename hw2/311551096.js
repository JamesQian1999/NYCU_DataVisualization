const margin = {top: 20, right: 30, bottom: 80, left: 30},
  width = 910 - margin.left - margin.right,
  height = 1200 - margin.top - margin.bottom;

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


    let DATA;
    let yColumn1, yColumn2, yColumn3, yColumn4;
    let dimensions;
    const onYColumnClicked1 = column => {
    dimensions[0] = column;
    yColumn1 = column;
    d3.select("svg").remove();
    render(dimensions);
    };
    const onYColumnClicked2 = column => {
    dimensions[1] = column;
    yColumn2 = column;
    d3.select("svg").remove();
    render(dimensions);
    };
    const onYColumnClicked3 = column => {
    dimensions[2] = column;
    yColumn3 = column;
    d3.select("svg").remove();
    render(dimensions);
    };
    const onYColumnClicked4 = column => {
    dimensions[3] = column;
    yColumn4 = column;
    d3.select("svg").remove();
    render(dimensions);
    };  


    const render = (dimensions) => {
        
        d3.select('#menu1')
            .call(dropdownMenu, {
            options: ['sepal length',
                        'sepal width',
                        'petal length',
                        'petal width'],
            onOptionClicked: onYColumnClicked1,
            selectedOption: yColumn1
            });
        
        d3.select('#menu2')
            .call(dropdownMenu, {
            options: ['sepal width',
                        'sepal length',
                        'petal length',
                        'petal width'],
            onOptionClicked: onYColumnClicked2,
            selectedOption: yColumn2
            });

            d3.select('#menu3')
            .call(dropdownMenu, {
            options: ['petal length',
                        'petal width',
                        'sepal length',
                        'sepal width'],
            onOptionClicked: onYColumnClicked3,
            selectedOption: yColumn3
            });
        
        d3.select('#menu4')
            .call(dropdownMenu, {
            options: ['petal width',
                        'petal length',
                        'sepal length',
                        'sepal width'],
            onOptionClicked: onYColumnClicked4,
            selectedOption: yColumn4
            });
        
        const color = d3.scaleOrdinal()
        .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica" ])
        .range([ "#ff7f0e", "#2ca02c", "#1f77b4"])  

          const y = {}
          for (i in dimensions) {
            n = dimensions[i]
            y[n] = d3.scaleLinear()
              .domain( [0,8] )
              .range([height-480, 0])
          }
    
        params = dimensions.map(function(d, i) {
            return d + "-" + i;
          });
          x = d3.scalePoint()
            .range([0, width])
            .domain(params);
          const highlight = function(event, d){
        
            selected_specie = d.class
            d3.selectAll(".line")
              .transition().duration(200)
              .style("stroke", "lightgrey")
              .style("opacity", "0.2")
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
        
          //input: row of the csv
          //output: x and y
          function path(d) {
              return d3.line()(params.map(function(p) { return [x(p), y[p.substr(0, p.length-2)](d[p.substr(0, p.length-2)])]; }));
          }
        
          // Draw the lines
          const svg = d3.select("#container")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform",
                  `translate(${margin.left},${margin.top})`);
          svg
            .selectAll("myPath")
            .data(DATA)
            .join("path")
              .attr("class", function (d) { return "line " + d.class } )
              .attr("d",  path)
              .style("fill", "none" )
              .style("stroke", function(d){ return( color(d.class))} )
              .style("opacity", 0.8)
              .on("mouseover", highlight)
              .on("mouseleave", doNotHighlight )
        
          // Draw axis
          svg
            .selectAll("myAxis")
            .data(params).enter()
            .append("g")
            .attr("class", "axis")
            // I translate the element to right position on the x axis
            .attr("transform", function(d) { return `translate(${x(d)})`})
            // build the axis
            .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d.substr(0, d.length-2)])); })
      

             svg.append("text")
             .attr("x", 5).attr("y", 640)
             .text("Iris-setosa").style("font-size", "25px")
             .attr("alignment-baseline","middle")
             .style("fill", "#ff7f0e")
     
         svg.append("text")
             .attr("x", 5).attr("y", 670)
             .text("Iris-versicolor").style("font-size", "25px")
             .attr("alignment-baseline","middle")
             .style("fill", "#2ca02c")
     
         svg.append("text")
             .attr("x", 5).attr("y", 700)
             .text("Iris-virginica").style("font-size", "25px")
             .attr("alignment-baseline","middle")
             .style("fill", "#1f77b4")
     

    };

function removeNaN(data,length){
    for (var i = 0; i < length; i++) {
        if( (!data[i]['sepal length']) || isNaN(data[i]['sepal length']) || isNaN(data[i]['sepal width']) || isNaN(data[i]['petal length']) || isNaN(data[i]['petal width']))
        {
        delete data[i];
        data.length -= 1;
        }
    }
    return data;
}

d3.csv("http://vis.lab.djosix.com:2023/data/iris.csv").then( function(data) {
    dimensions = ["sepal length", "sepal width", "petal length", "petal width"];
    DATA = removeNaN(data, data.length);
    render(dimensions);

})