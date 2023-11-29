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

  let color = getRandomHexColors(10);
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
      .domain(data.map(d => d['popularity_rank']))
      .range(color);

    const circles = g.merge(gEnter)
      .selectAll('circle').data(data);
    circles
      .enter().append('circle')
        .attr('cx', innerWidth / 2)
        .attr('cy', innerHeight / 2)
        .attr('r', 0)
      .merge(circles)
      .transition().duration(10)
      // .delay((d, i) => i )
        .attr('cy', d => yScale(yValue(d)))
        .attr('cx', d => xScale(xValue(d)))
        .attr('r', circleRadius)
        .attr("fill", d => colorScale(d['popularity_rank']));
  };

  const svg = d3.select('svg');

  const width  = +svg.attr('width');
  const height = +svg.attr('height');


  for (let i = 0; i < 5; i++) {
    for(let j = 0; j < 2; j++){
      svg.append("circle")
        .attr("cx",100 + j*200)
        .attr("cy",830 + 30*i)
        .attr("r", 6)
        .style("fill", "#ff7f0e")

      svg.append("text")
        .attr("x", 110 + j*200).attr("y", 830 + 30*i)
        .text("popularity "+String(i*10 + j*50)+"-"+String(i*10+10 + j*50)).style("font-size", "25px")
        .attr("alignment-baseline","middle")
        .style("fill", color[i + j*5])
    }
  }

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
        options: [
          'duration_ms',
          'danceability',
          'energy',
          'key',
          'loudness',
          'mode',
          'speechiness',
          'acousticness',
          'instrumentalness',
          'liveness',
          'valence',
          'tempo',
          'time_signature',
          ],
        onOptionClicked: onXColumnClicked,
        selectedOption: xColumn
      });
    
    d3.select('#y-menu')
      .call(dropdownMenu, {
          options: [
            'duration_ms',
            'danceability',
            'energy',
            'key',
            'loudness',
            'mode',
            'speechiness',
            'acousticness',
            'instrumentalness',
            'liveness',
            'valence',
            'tempo',
            'time_signature',
            ],
        onOptionClicked: onYColumnClicked,
        selectedOption: yColumn
      });
    
    svg.call(scatterPlot, {
      xValue: d => d[xColumn],
      xAxisLabel: xColumn,
      yValue: d => d[yColumn],
      circleRadius: 5,
      yAxisLabel: yColumn,
      margin: { top: 10, right: 40, bottom: 88, left: 110 },
      width,
      height,
      data
    });
  };


  d3.csv('spotify_tracks_rank.csv')
    .then(loadedData => {  
      data = loadedData;
      data.forEach(d => {
          d['popularity']       = +d['popularity'];
          d['popularity_rank']  = +d['popularity_rank'];
          d['duration_ms']      = +d['duration_ms'];
          d['danceability']     = +d['danceability'];
          d['energy']           = +d['energy'];
          d['key']              = +d['key'];
          d['loudness']         = +d['loudness'];
          d['mode']             = +d['mode'];
          d['speechiness']      = +d['speechiness'];
          d['acousticness']     = +d['acousticness'];
          d['instrumentalness'] = +d['instrumentalness'];
          d['liveness']         = +d['liveness'];
          d['valence']          = +d['valence'];
          d['tempo']            = +d['tempo'];
          d['time_signature']   = +d['time_signature'];
      });
      xColumn = "liveness";
      yColumn = "speechiness";
      // console.log(data[0]['acousticness']+1);
      render();
    });

}(d3));

function getRandomHexColors(count, minDistance = 50) {
  function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
  }

  function colorDistance(color1, color2) {
      const [r1, g1, b1] = hexToRgb(color1);
      const [r2, g2, b2] = hexToRgb(color2);
      return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
  }

  function isColorSimilar(existingColors, newColor) {
      for (const color of existingColors) {
          if (colorDistance(color, newColor) < minDistance) {
              return true;
          }
      }
      return false;
  }

  const colors = new Set();
  while (colors.size < count) {
      const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
      if (!isColorSimilar(Array.from(colors), randomColor)) {
          colors.add(randomColor);
      }
  }
  return Array.from(colors);
}




  // data['popularity']       = +data['popularity'];
  // data['duration_ms']      = +data['duration_ms'];
  // data['danceability']     = +data['danceability'];
  // data['energy']           = +data['energy'];
  // data['key']              = +data['key'];
  // data['loudness']         = +data['loudness'];
  // data['mode']             = +data['mode'];
  // data['speechiness']      = +data['speechiness'];
  // data['acousticness']     = +data['acousticness'];
  // data['instrumentalness'] = +data['instrumentalness'];
  // data['liveness']         = +data['liveness'];
  // data['valence']          = +data['valence'];
  // data['tempo']            = +data['tempo'];
  // data['time_signature']   = +data['time_signature'];

  // data['track_id']         = +data['track_id'];
  // data['artists']          = +data['artists'];
  // data['album_name']       = +data['album_name'];
  // data['track_name']       = +data['track_name'];
  // data['explicit']         = +data['explicit'];
  // data['track_genre']      = +data['track_genre'];