var width = 960;
var size = 230;
var padding = 20;

var x = d3.scale.linear()
    .range([padding / 2, size - padding / 2]);

var y = d3.scale.linear()
    .range([size - padding / 2, padding / 2]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(6);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(6);

//取得x軸的上下界
// var xMax = data


function color(c) {
    s = ["Iris-setosa", "Iris-versicolor", "Iris-virginica"];
    colors = ["#ff7f0e", "#2ca02c", "#1f77b4"];
    return colors[s.indexOf(c)];
}

function cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;)
        for (j = -1; ++j < m;)
            c.push({ x: a[i], i: i, y: b[j], j: j });
    return c;
}

function removeNaN(data, length) {
    for (var i = 0; i < length; i++) {
        if ((!data[i]['sepal length']) || isNaN(data[i]['sepal length']) || isNaN(data[i]['sepal width']) || isNaN(data[i]['petal length']) || isNaN(data[i]['petal width'])) {
            delete data[i];
            data.length -= 1;
        }
    }
    return data;
}

d3.csv("http://vis.lab.djosix.com:2023/data/iris.csv", function (error, data) {
    if (error) throw error;

    data = removeNaN(data, data.length);

    var domainByTrait = {};
    var traits = d3.keys(data[0]).filter(function (d) { return d !== "class"; });
    var n = traits.length;

    traits.forEach(function (trait) {
    domainByTrait[trait] = d3.extent(data, function (d) { return d[trait]; });
    });

    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * n);

    var brush = d3.svg.brush()
    .x(x)
    .y(y)
    .on("brushstart", brushstart)
    .on("brush", brushmove)
    .on("brushend", brushend);

    var svg = d3.select("div").append("svg")
    .attr("width", size * n + padding)
    .attr("height", size * n + padding)
    .append("g")
    .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

    svg.selectAll(".x.axis")
    .data(traits)
    .enter().append("g")
    .attr("class", "x axis")
    .attr("transform", function (d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
    .each(function (d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

    svg.selectAll(".y.axis")
    .data(traits)
    .enter().append("g")
    .attr("class", "y axis")
    .attr("transform", function (d, i) { return "translate(0," + i * size + ")"; })
    .each(function (d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

    var cell = svg.selectAll(".cell")
    .data(cross(traits, traits))
    .enter().append("g")
    .attr("class", "cell")
    .attr("transform", function (d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; });

    cell.filter(function (d) { return d.i === d.j; })
    .each(plotDiagonal);
     
    // Scatterplots for the non-diagonal elements.
    cell.filter(function (d) { return d.i !== d.j; })
    .each(plotScatter);

    cell.call(brush);

    function plotDiagonal(p) {
        var cell = d3.select(this);
        var xTrait = p.x;
        var yTrait = p.y;
    
        // Get the data's minimum and maximum values
        var xmin = domainByTrait[xTrait][0];
        var xmax = domainByTrait[xTrait][1];
    
        // Create an x scale
        var xScale = d3.scale.linear()
            .domain([xmin, xmax])
            .range([padding / 2, size - padding / 2]);
    
        // Create a histogram layout
        var histogram = d3.layout.histogram()
            .bins(xScale.ticks(20))
            .value(function(d) { return d[xTrait]; });
    
        // Group data by class
        var classes = d3.set(data.map(function(d) { return d.class; })).values();
    
        // Stack layout
        var stack = d3.layout.stack()
            .offset("zero")
            .values(function(d) { return d.values; });
    
        // Prepare data for stacking
        var dataForStack = classes.map(function(className) {
            var classData = data.filter(function(d) { return d.class === className; });
            return {
                class: className,
                values: histogram(classData)
            };
        });
    
        // Stack the data
        var stackedData = stack(dataForStack);
    
        // Create a y scale
        var yScale = d3.scale.linear()
            .domain([0, d3.max(stackedData, function(layer) {
                return d3.max(layer.values, function(d) {
                    return d.y + d.y0;
                });
            })])
            .nice()
            .range([size - padding / 2, padding / 2]);
    
        // Create a frame (rectangle)
        cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding);
    
        // Create bars for each class
        var bars = cell.selectAll(".bar")
            .data(stackedData)
            .enter().append("g")
            .attr("class", "bar")
            .style("fill", function(d) {
                // Set the color of the bars here
                return color(d.class);
            });
    
        bars.selectAll("rect")
            .data(function(d) { return d.values; })
            .enter().append("rect")
            .attr("x", function(d) { return xScale(d.x); })
            .attr("y", function(d) { return yScale(d.y + d.y0); })
            .attr("width",13)
            .attr("height", function(d) { return yScale(d.y0) - yScale(d.y + d.y0); });
    } 

    function plotScatter(p) {
        var cell = d3.select(this);
        var xTrait = p.x;
        var yTrait = p.y;

        x.domain(domainByTrait[xTrait]);
        y.domain(domainByTrait[yTrait]);

        cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding);

        cell.selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", function (d) { return x(d[xTrait]); })
            .attr("cy", function (d) { return y(d[yTrait]); })
            .attr("r", 4)
            .style("fill", function (d){
            return color(d.class);
            });
    }

    // Titles for the diagonal.
    cell.filter(function(d) { return d.i === d.j; }).append("text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) { return d.x; });

    var brushCell;

    // Clear the previously-active brush, if any.
    function brushstart(p) {
    if (brushCell !== this) {
        d3.select(brushCell).call(brush.clear());
        x.domain(domainByTrait[p.x]);
        y.domain(domainByTrait[p.y]);
        brushCell = this;
    }
    }

    // Highlight the selected circles.
    function brushmove(p) {
    var e = brush.extent();
    svg.selectAll("circle").classed("hidden", function (d) {
        return e[0][0] > d[p.x] || d[p.x] > e[1][0] || e[0][1] > d[p.y] || d[p.y] > e[1][1];
    });
    }

    // If the brush is empty, select all circles.
    function brushend() {
    if (brush.empty()) svg.selectAll(".hidden").classed("hidden", false);
    }
});
