(function (d3) {
    // 'use strict';
  
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
  
    const scatterPlot = (selection, props) => {
      const {
        xValue,
        xAxisLabel,
        yValue,
        circleRadius,
        yAxisLabel,
        margin,
        width,
        height,
        data
      } = props;
      
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = (height-200) - margin.top - margin.bottom;
      
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, xValue))
        .range([0, innerWidth])
        .nice();
      
      const yScale = d3.scaleLinear();
      yScale.domain(d3.extent(data, yValue));
      yScale.range([innerHeight, 0]);
      yScale.nice();
      
      const g = selection.selectAll('.container').data([null]);
      const gEnter = g
        .enter().append('g')
          .attr('class', 'container');
      gEnter
        .merge(g)
          .attr('transform',
            `translate(${margin.left},${margin.top})`
          );
      
      const xAxis = d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickPadding(15);
      
      const yAxis = d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickPadding(10);
      
      const yAxisG = g.select('.y-axis');
      const yAxisGEnter = gEnter
        .append('g')
          .attr('class', 'y-axis')
          .style("font", "20px times");
      yAxisG
        .merge(yAxisGEnter)
          .call(yAxis)
          .selectAll('.domain').remove();
      
      const yAxisLabelText = yAxisGEnter
        .append('text')
          .attr('class', 'axis-label')
          .attr('y', -93)
          .attr('fill', 'black')
          .attr('transform', `rotate(-90)`)
          .attr('text-anchor', 'middle')
        .merge(yAxisG.select('.axis-label'))
          .attr('x', -innerHeight / 2)
          .text(yAxisLabel)
          .style("font", "25px times");
      
      
      const xAxisG = g.select('.x-axis');
      const xAxisGEnter = gEnter
        .append('g')
          .attr('class', 'x-axis')
          .style("font", "20px times");
      xAxisG
        .merge(xAxisGEnter)
          .attr('transform', `translate(0,${innerHeight})`)
          .call(xAxis)
          .selectAll('.domain').remove();
      
      const xAxisLabelText = xAxisGEnter
        .append('text')
          .attr('class', 'axis-label')
          .attr('y', 75)
          .attr('fill', 'black')
        .merge(xAxisG.select('.axis-label'))
          .attr('x', innerWidth / 2)
          .text(xAxisLabel)
          .style("font", "25px times");
  
        // Create a color scale for flower classes
        const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d['class']))
        .range(["#ff7f0e", "#2ca02c", "#1f77b4"]);

      const circles = g.merge(gEnter)
        .selectAll('circle').data(data);
      circles
        .enter().append('circle')
          .attr('cx', innerWidth / 2)
          .attr('cy', innerHeight / 2)
          .attr('r', 0)
        .merge(circles)
        .transition().duration(2000)
        .delay((d, i) => i * 10)
          .attr('cy', d => yScale(yValue(d)))
          .attr('cx', d => xScale(xValue(d)))
          .attr('r', circleRadius)
          .attr("fill", d => colorScale(d['class']));
    };
  
    const svg = d3.select('svg');
  
    const width  = +svg.attr('width');
    const height = +svg.attr('height');


    svg.append("circle")
        .attr("cx",100)
        .attr("cy",830)
        .attr("r", 6)
        .style("fill", "#ff7f0e")

    svg.append("circle")
        .attr("cx",100)
        .attr("cy",860)
        .attr("r", 6)
        .style("fill", "#2ca02c")

    svg.append("circle")
        .attr("cx",100)
        .attr("cy",890)
        .attr("r", 6)
        .style("fill", "#1f77b4")

    svg.append("text")
        .attr("x", 110).attr("y", 830)
        .text("Iris-setosa").style("font-size", "25px")
        .attr("alignment-baseline","middle")
        .style("fill", "#ff7f0e")

    svg.append("text")
        .attr("x", 110).attr("y", 860)
        .text("Iris-versicolor").style("font-size", "25px")
        .attr("alignment-baseline","middle")
        .style("fill", "#2ca02c")

    svg.append("text")
        .attr("x", 110).attr("y", 890)
        .text("Iris-virginica").style("font-size", "25px")
        .attr("alignment-baseline","middle")
        .style("fill", "#1f77b4")

  
    let data;
    let xColumn;
    let yColumn;
  
    const onXColumnClicked = column => {
      xColumn = column;
      render();
    };
  
    const onYColumnClicked = column => {
      yColumn = column;
      render();
    };

  
    const render = () => {
      
      d3.select('#x-menu')
        .call(dropdownMenu, {
          options: ['sepal length',
                    'sepal width',
                    'petal length',
                    'petal width'],
          onOptionClicked: onXColumnClicked,
          selectedOption: xColumn
        });
      
      d3.select('#y-menu')
        .call(dropdownMenu, {
            options: ['sepal length',
                      'sepal width',
                      'petal length',
                      'petal width'],
          onOptionClicked: onYColumnClicked,
          selectedOption: yColumn
        });
      
      svg.call(scatterPlot, {
        xValue: d => d[xColumn],
        xAxisLabel: xColumn,
        yValue: d => d[yColumn],
        circleRadius: 10,
        yAxisLabel: yColumn,
        margin: { top: 10, right: 40, bottom: 88, left: 110 },
        width,
        height,
        data
      });
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
    d3.csv('http://vis.lab.djosix.com:2023/data/iris.csv')
      .then(loadedData => {  
        data = loadedData;
        data.forEach(d => {
          d['sepal length'] = +d['sepal length'];
          d['sepal width']  = +d['sepal width'];
          d['petal length'] = +d['petal length'];
          d['petal width']  = +d['petal width'];
        });
        data = removeNaN(data, data.length);
        xColumn = data.columns[0];
        yColumn = data.columns[1];
        render();
      });
  
  }(d3));