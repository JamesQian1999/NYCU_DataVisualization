// Graph dimension
const margin = {top: 85, right: 85, bottom: 85, left: 85},
    width = 800 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom

function csvToArr(stringVal, splitter) {
    const [keys, ...rest] = stringVal
        .trim()
        .split("\n")
        .map((item) => item.split(splitter));
    const formedArr = rest.map((item) => {
        const object = {};
        keys.forEach((key, index) => (object[key] = item.at(index)));
        return object;
    });
    return formedArr;
    }

function render(sex, num){

    d3.text("http://vis.lab.djosix.com:2023/data/abalone.data", function(data) {
        data = "Sex,Length,Diameter,Height,Whole_weight,Shucked_weight,Viscera_weight,Shell_weight,Rings\n" + data;
        // console.log("data:",data);
        NewData = csvToArr(data, ",");
        // console.log("NewData:",NewData);
        NewData.forEach((d) => {
            d.Length            = +d.Length;
            d.Diameter          = +d.Diameter;
            d.Height            = +d.Height;
            d.Whole_weight      = +d.Whole_weight;
            d.Shucked_weight    = +d.Shucked_weight;
            d.Viscera_weight    = +d.Viscera_weight;
            d.Shell_weight      = +d.Shell_weight;
            d.Rings             = +d.Rings;
        });
        console.log("NewData:",NewData);
    
        var SEX_M = NewData.filter(function(d){ 
            return d.Sex == "M"; 
        })
        var SEX_F = NewData.filter(function(d){ 
            return d.Sex == "F"; 
        })
        var SEX_I = NewData.filter(function(d){ 
            return d.Sex == "I"; 
        })
    
        cols = ["Length",
                "Diameter",
                "Height",
                "Whole_weight",
                "Shucked_weight",
                "Viscera_weight",
                "Shell_weight",
                "Rings"]
        var corr_M = jz.arr.correlationMatrix(SEX_M, cols);
        console.log("corr_M:",corr_M);
        var corr_F = jz.arr.correlationMatrix(SEX_F, cols);
        console.log("corr_F:",corr_F);
        var corr_I = jz.arr.correlationMatrix(SEX_I, cols);
        console.log("corr_I:",corr_I);
    
        if(sex == "M"){
            var corr = corr_M;
            var legend_top = 15;
        }
        else if(sex == "F"){
            var corr = corr_F;
            var legend_top = 15;
        }
        else{
            var corr = corr_I;
            var legend_top = 15;
        }

        // Create the svg area
        const svg = d3.select("#grid"+num)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},16)`);
    
        var extent = d3.extent(corr.map(function(d){ return d.correlation; }).filter(function(d){ return d !== 1; }));
    
        var grid = data2grid.grid(corr);
        var rows = d3.max(grid, function(d){ return d.row; });
    
        var padding = 0.05;
    
        var x = d3.scaleBand()
            .range([0, width])
            .paddingInner(padding)
            .domain(d3.range(1, rows + 1));
    
        var y = d3.scaleBand()
            .range([0, height])
            .paddingInner(padding)
            .domain(d3.range(1, rows + 1));
    
        var color1 = "#FF3C12";
        var color2 = "#F4F906";
    
        var c = chroma.scale([color1, color2])
            .domain([extent[0], extent[1]]);
    
        var x_axis = d3.axisTop(y).tickFormat(function(d, i){ return cols[i]; });
        var y_axis = d3.axisLeft(x).tickFormat(function(d, i){ return cols[i]; });
    
        svg.append("g")
            .attr("class", "x axis")
            .call(x_axis);
    
        svg.append("g")
            .attr("class", "y axis")
            .call(y_axis);
    
        svg.selectAll("rect")
            .data(grid, function(d){ return d.column_a + d.column_b; })
            .enter().append("rect")
            .attr("x", function(d){ return x(d.column); })
            .attr("y", function(d){ return y(d.row); })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function(d){ return c(d.correlation); })
            .style("opacity", 1e-6)
            .transition()
            .style("opacity", 1);
    
        console.log("grid:",grid)
    
        let roundDecimal = function (val, precision) {
            return Math.round(Math.round(val * Math.pow(10, (precision || 0) + 1)) / 10) / Math.pow(10, (precision || 0));
          }
        svg.selectAll(".rect")
            .data(grid, function(d){ return ; })
            .enter().append("text")
            .attr("x", function(d){ return x(d.column)+x.bandwidth()/2-12; })
            .attr("y", function(d){ return y(d.row)+y.bandwidth()/2+5; })
            .text(function(d){
                return roundDecimal(d.correlation, 2);
            })
    
        // legend scale
        var legend_height = 15;
    
        var legend_svg = d3.select("#legend"+num).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", legend_height + 15)
            .append("g")
            .attr("transform", "translate(" + margin.left + ", " + legend_top + ")");
    
        var defs = legend_svg.append("defs");
    
        var gradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");
    
        var stops = [{offset: 0, color: color1, value: extent[0]}, {offset: 1, color: color2, value: extent[1]}];
        
        gradient.selectAll("stop")
            .data(stops)
            .enter().append("stop")
            .attr("offset", function(d){ return (100 * d.offset) + "%"; })
            .attr("stop-color", function(d){ return d.color; });
    
        legend_svg.append("rect")
            .attr("width", width)
            .attr("height", legend_height)
            .style("fill", "url(#linear-gradient)");
    
        legend_svg.selectAll("text")
            .data(stops)
            .enter().append("text")
            .attr("x", function(d){ return width * d.offset; })
            .attr("dy", -3)
            .style("text-anchor", function(d, i){ return i == 0 ? "start" : i == 1 ? "middle" : "end"; })
            .text(function(d, i){ return d.value.toFixed(2) + (i == 2 ? ">" : ""); })
    });

}

render("M", "1"); 
render("F", "2"); 
render("I", "3"); 

