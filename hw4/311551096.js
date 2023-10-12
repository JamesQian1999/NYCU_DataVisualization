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

d3.csv("iris.csv", function (error, data) {
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

    var svg = d3.select("body").append("svg")
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

    // Titles for the diagonal.
    cell.filter(function(d) { return d.i === d.j; }).append("text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) { return d.x; });
    cell.filter(function (d) { return d.i === d.j; })
    .each(plotDiagonal);
    // Scatterplots for the non-diagonal elements.
    cell.filter(function (d) { return d.i !== d.j; })
    .each(plotScatter);

    cell.call(brush);

    function plotDiagonal(p) {
        // var cell = d3.select(this);
        // var trait = p.x;
        
        // console.log("trait:",trait);
        // console.log("data:",data);
        // x.domain(domainByTrait[trait]);

        // var dataValues = data.map(function (d) { return +d[trait]; });

        // console.log(dataValues);
        // var hist = d3.layout.histogram()
        //     .bins(x.ticks(20))
        //     (dataValues);

        // var histScale = d3.scale.linear()
        //     .domain([0, d3.max(hist, function (d) { return d.y; })])
        //     .range([size - padding / 2, padding / 2]);

        cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding);

        // console.log("hist:",hist);
        // cell.selectAll(".bar")
        //     .data(hist)
        //     .enter().append("rect")
        //     .attr("class", "bar")
        //     .attr("x", 40)
        //     .attr("width", size / 20 - 1)
        //     .attr("y", function (d) { return histScale(d.y); })
        //     .attr("height", function (d) { return size - histScale(d.y) - padding / 2; })
        //     .style("fill", function (d){
        //         return color(d.class);
        //         });
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
