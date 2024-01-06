// get main SVG and its attributes & setting hyper-parameters; 
const svg = d3.select('#mainsvg');
const width = +svg.attr('width');
const height = +svg.attr('height');
const margin = {top: 100, right: 120, bottom: 100, left: 120};
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const xValue = (datum) => { return dates.indexOf(datum['saledate']); };
const yValue = (datum) => { return datum['MA']};
let low_max = 2700000; 
let up_max  = 2700000;
let xScale, yScale, nyScale;
let maxX, maxY;
let dates; 
let aduration = 1000;
let metapop;
let AllData;

let area_house, area_unit;
let prestack_unit; 
let prestack_house; 
let keys_unit;  
let keys_house; 
let current;

let prestack_up;
let prestack_down;

const xAxisLabel = 'Time';
const yAxisLabel = '';


var province_color = {
    "house_2": "#DD6B66",
    "house_3": "#759AA0",
    "house_4": "#E69D87",
    "house_5": "#8DC1A9",
    "unit_1":  "#EA7E53",
    "unit_2":  "#EEDD78",
    "unit_3":  "#73A373",
}


const renderinit = function(data, seq){  
    xScale = d3.scaleLinear()
    .domain([0, dates.length-1])
    .range([0, innerWidth]);

    // Introducing y-Scale; 
    yScale = d3.scaleLinear()
        .domain([-up_max, 0, low_max]) 
        .range([innerHeight, innerHeight / 2, 0])
        .nice();

    nyScale = d3.scaleLinear()
        .domain([up_max, 0, -low_max])
        .range([innerHeight, innerHeight / 2, 0])
        .nice();

 
    maxX = xScale(d3.max(data, xValue));
    maxY = yScale(d3.max(data, yValue));

    svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr('id', 'housegroup');

    svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('id', 'unitgroup');

    const axis = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('id', 'axisgroup');

    // Adding axes; 
    var formatter = d3.format("0")
    const yAxis = d3.axisLeft(yScale)
    .tickSize(-innerWidth)
    .tickFormat(function (d) { 
        if (d === 0) return 0; // No label for '0'
        else if (d < 0) d = -d; // No nagative labels
        return formatter(d);
    })
    .tickPadding(10); // .tickPadding is used to prevend intersection of ticks; 
    const xAxis = d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickPadding(10)
        .ticks(dates.length);

    let yAxisGroup = axis.append('g').call(yAxis).attr('id', 'yaxis')
    d3.selectAll('#yaxis .tick text').attr('transform', `translate(${0}, ${-3})`);
    yAxisGroup.append('text')
        .attr('transform', `rotate(-90)`)
        .attr('x', -innerHeight / 2)
        .attr('y', -80)
        .attr('fill', 'white')
        .text(yAxisLabel)
        .attr('text-anchor', 'middle') // Make label at the middle of axis. 
    yAxisGroup.selectAll('.domain').remove(); // we can select multiple tags using comma to seperate them and we can use space to signify nesting; 
    
    let xAxisGroup = axis.append('g')
        .call(xAxis).attr('transform', `translate(${0}, ${innerHeight})`)
        .attr('id', 'xaxis');

    d3.selectAll('#xaxis .tick text')
        .attr('transform', `translate(${0}, ${5})`);

    xAxisGroup.append('text')
        .attr('y', 60)
        .attr('x', innerWidth / 2)
        .attr('fill', 'Black')
        .text(xAxisLabel);

    xAxisGroup.selectAll('.domain').remove();

    for(let tid = 0; tid < dates.length; tid++){
        if(tid % 3 == 0 ){
            document.getElementById('xaxis').getElementsByClassName('tick')[tid].getElementsByTagName('text')[0].textContent = dates[tid];
        }
        else{
            document.getElementById('xaxis').getElementsByClassName('tick')[tid].getElementsByTagName('text')[0].textContent = "";
        }
    }
  
};

const render = function(data, keys, area, order="OrderByType"){
    console.log("render keys:",keys);
    let g, layers;
    if(order === "OrderByType"){
        if(keys.includes("house_2")||keys.includes("house_3")||keys.includes("house_4")||keys.includes("house_5")){
            g = d3.select('#housegroup');
            data.forEach(datum => {
                if(!("house_2" in datum)){
                    datum["house_2"] = 0;
                }
                if(!("house_3" in datum)){
                    datum["house_3"] = 0;
                }
                if(!("house_4" in datum)){
                    datum["house_4"] = 0;
                }
                if(!("house_5" in datum)){
                    datum["house_5"] = 0;
                }
            });
    
        }else{
            g = d3.select('#unitgroup');
            data.forEach(datum => {
                if(!("unit_1" in datum)){
                    datum["unit_1"] = 0;
                }
                if(!("unit_2" in datum)){
                    datum["unit_2"] = 0;
                }
                if(!("unit_3" in datum)){
                    datum["unit_3"] = 0;
                }
            });    
        }
    }
    if(order === "OrderByBedrooms"){
        if(keys.includes("unit_1")||keys.includes("unit_2")||keys.includes("house_2")||keys.includes("house_3")){
            g = d3.select('#housegroup');
            data.forEach(datum => {
                if(!("unit_1" in datum)){
                    datum["unit_1"] = 0;
                }
                if(!("unit_2" in datum)){
                    datum["unit_2"] = 0;
                }
                if(!("house_2" in datum)){
                    datum["house_2"] = 0;
                }
                if(!("house_3" in datum)){
                    datum["house_3"] = 0;
                }
            });
    
        }else{
            g = d3.select('#unitgroup');
            data.forEach(datum => {
                if(!("unit_3" in datum)){
                    datum["unit_3"] = 0;
                }
                if(!("house_4" in datum)){
                    datum["house_4"] = 0;
                }
                if(!("house_5" in datum)){
                    datum["house_5"] = 0;
                }
            });    
        }
    }

    layers = d3.stack()
            .keys(keys)
            .offset(d3.stackOffsetNone) 
            //.order(d3.stackOrderDescending)
            .order(d3.stackOrderNone)
            (data);
    // console.log("layers",layers); 

    const path = g.selectAll("path")
        .data(layers)
        .enter().append("path")
        .attr("d", area)
        .attr("opacity",0.9)
        // fill attrbute requires designers to assign colors for each province; 
        .attr("fill", function (d,i) {
            return province_color[d["key"]]; });
};
const seqgen = function(data){
    // re-arrange the data sequentially; 
    let prestack = []; 
    dates.forEach(datum => {
        prestack.push({'saledate': datum});
    });
    data.forEach(datum => {
        prestack[dates.indexOf(datum['saledate'])][datum['cat']] = yValue(datum);
    });
    // console.log("prestack:",prestack);
    return prestack
}

function getCategory(type, bedrooms) {
    if (type === "house" && bedrooms === 3) return "house_3";
    if (type === "house" && bedrooms === 4) return "house_4";
    if (type === "house" && bedrooms === 2) return "house_2";
    if (type === "house" && bedrooms === 5) return "house_5";
    if (type === "unit"  && bedrooms === 1) return "unit_1";
    if (type === "unit"  && bedrooms === 2) return "unit_2";
    if (type === "unit"  && bedrooms === 3) return "unit_3";
    return "Unknown Category"; // If unknown category
}

d3.csv('http://vis.lab.djosix.com:2023/data/ma_lga_12345.csv').then(function(data){
    current = "OrderByType";
    data.forEach(d => {
        // // pre-process the data; 
        // d.saledate      = d3.timeParse("%d/%m/%Y")(d.saledate);
        d['MA']         = +d['MA'];
        d['bedrooms']   = +d['bedrooms'];
        d['cat']        = getCategory(d['type'], d['bedrooms']);
    });

    console.log("data:",data);
    // console.log("data:",data);

    // remove duplicated items; 
    alldates = Array.from(new Set(data.map( datum => datum['saledate'])));

    // make sure dates are listed according to real time order; 
    alldates = alldates.sort(function(a,b){
        const a_year = a.split("/")[2];
        const a_month = a.split("/")[1];
        const a_day = a.split("/")[0];
        const b_year = b.split("/")[2];
        const b_month = b.split("/")[1];
        const b_day = b.split("/")[0];
        return  new Date(a_year, a_month, a_day) - new Date(b_year, b_month, b_day);
    });
    dates = alldates;

    // generate sequential data; 
    AllData = data;
    let sequential = []; 
    alldates.forEach(datum => {
        sequential.push([]);
    });
    data.forEach(datum => {
        sequential[alldates.indexOf(datum['saledate'])].push(datum);
    });

    // split data from Hu-Bei and not from Hu-Bei; 
    data_house = data.filter(datum => {return datum['type'] === 'house'}); //hubei
    data_unit = data.filter(datum => {return datum['type'] !== 'house'}); 

    prestack_unit = seqgen(data_unit);
    prestack_house = seqgen(data_house);
    keys_unit  = ["unit_1","unit_2","unit_3"];  
    keys_house = ["house_2", "house_3", "house_4", "house_5"];

    // initialize the chart; 
    renderinit(data);
    // console.log("data:",data)
    area_house = d3.area()
        .curve(d3.curveCardinal.tension(0.3)) // default is d3.curveLinear, d3.curveBundle.beta(1.0)
        .x(d => xScale(xValue(d.data)))
        .y0(function(d) { return yScale(d[0]);})
        .y1(function(d) { return yScale(d[1]);});

    area_unit = d3.area()
        .curve(d3.curveCardinal.tension(0.3))
        .x((d) => xScale(xValue(d.data)))
        .y0(function(d) { return nyScale(d[0]);})
        .y1(function(d) { return nyScale(d[1]);});

    // set the animation interval; 
    render(prestack_house, keys_house, area_house);
    render(prestack_unit, keys_unit, area_unit);
    
});

function OrderByType(){
    updateChart();
    current = "OrderByType";
}

function OrderByBedrooms(){
    data = AllData;
    data_up = data.filter(datum => {  return (datum['cat'] === 'unit_1' ) || (datum['cat'] === 'unit_2') || (datum['cat'] === 'house_2') || (datum['cat'] === 'house_3');});
    data_down = data.filter(datum => {return (datum['cat'] === 'unit_3') || (datum['cat'] === 'house_4') || (datum['cat'] === 'house_5')}); 
    prestack_up = seqgen(data_up);
    prestack_down  = seqgen(data_down);

    let activeKeys = Object.keys(province_color).filter(key => d3.select(`#${key}`).property('checked'));
    let activeHouseKeys, activeUnitKeys, activeHouseData, activeUnitData;
    activeHouseKeys = activeKeys.filter(key => (key.includes('unit_1') || key.includes('unit_2') || key.includes('house_2') || key.includes('house_3')));
    activeUnitKeys = activeKeys.filter(key => (key.includes('unit_3') || key.includes('house_4') || key.includes('house_5')));
    // Filter the data based on active keys
    activeHouseData = prestack_up.map(d => {
        let filteredData = { saledate: d.saledate };
        activeHouseKeys.forEach(key => filteredData[key] = d[key] || 0);
        return filteredData;
    });
    
    activeUnitData = prestack_down.map(d => {
        let filteredData = { saledate: d.saledate };
        activeUnitKeys.forEach(key => filteredData[key] = d[key] || 0);
        return filteredData;
    });

    // Redraw the chart
    d3.select('#housegroup').selectAll('*').remove();
    d3.select('#unitgroup').selectAll('*').remove();
    // renderinit(AllData);
    render(activeHouseData,   activeHouseKeys, area_house , "OrderByBedrooms");
    render(activeUnitData, activeUnitKeys, area_unit, "OrderByBedrooms");
    current = "OrderByBedrooms";
}

// Function to update the chart based on checkbox changes
function updateChart() {
    console.log("current:",current);
    let activeKeys = Object.keys(province_color).filter(key => d3.select(`#${key}`).property('checked'));
    console.log("activeKeys:",activeKeys);
    let activeHouseKeys, activeUnitKeys, activeHouseData, activeUnitData;
    if(current === "OrderByBedrooms"){
        activeHouseKeys = activeKeys.filter(key => (key.includes('unit_1') || key.includes('unit_2') || key.includes('house_2') || key.includes('house_3')));
        activeUnitKeys = activeKeys.filter(key => (key.includes('unit_3') || key.includes('house_4') || key.includes('house_5')));
        // Filter the data based on active keys
        activeHouseData = prestack_up.map(d => {
            let filteredData = { saledate: d.saledate };
            activeHouseKeys.forEach(key => filteredData[key] = d[key] || 0);
            return filteredData;
        });
      
        activeUnitData = prestack_down.map(d => {
            let filteredData = { saledate: d.saledate };
            activeUnitKeys.forEach(key => filteredData[key] = d[key] || 0);
            return filteredData;
        });
    }
    else{
        activeHouseKeys = activeKeys.filter(key => key.includes('house'));
        activeUnitKeys = activeKeys.filter(key => key.includes('unit'));
        // Filter the data based on active keys
        activeHouseData = prestack_house.map(d => {
            let filteredData = { saledate: d.saledate };
            activeHouseKeys.forEach(key => filteredData[key] = d[key] || 0);
            return filteredData;
        });
      
        activeUnitData = prestack_unit.map(d => {
            let filteredData = { saledate: d.saledate };
            activeUnitKeys.forEach(key => filteredData[key] = d[key] || 0);
            return filteredData;
        });
    }
    
  
    // Redraw the chart
    d3.select('#housegroup').selectAll('*').remove();
    d3.select('#unitgroup').selectAll('*').remove();
    // renderinit(AllData);
    render(activeHouseData, activeHouseKeys, area_house, current);
    render(activeUnitData, activeUnitKeys, area_unit   , current);
  }
