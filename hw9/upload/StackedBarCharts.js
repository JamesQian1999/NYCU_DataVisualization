
// Constants
const margin = { top: 20, right: 20, bottom: 30, left: 200 }, //絕對位置
    width = 960 - margin.left - margin.right,
    height = 20000 - margin.top - margin.bottom; // Adjusted height
    // 20000

// Scales and Axes
const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().rangeRound([0, 30000], 0.1) //調整scale大小
                        .paddingInner(0.2)// Adjusted y scale
                        .paddingOuter(0.8);
const color = d3.scaleOrdinal(d3.schemeCategory10);

const xAxis = d3.axisTop(x);
const yAxis = d3.axisLeft(y);

let allData;

// SVG canvas
const svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right+100)
    .attr("height", 30300)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")  
    .style("opacity", 0);

function sortData(order) {
    const Select_track_genre = document.getElementById("track_genre").value;
    const criteria           = document.getElementById("sortCriteria").value;
    if (order === "desc") {
        allData.sort((a, b) => a[criteria] - b[criteria]);
    } else {
        allData.sort((b, a) => a[criteria] - b[criteria]);
    }
    updateChart(allData, Select_track_genre);
}

function updateChart(data, track_genre) {
    svg.selectAll("*").remove(); // Clear existing chart elements

    color.domain([
        "popularity",
        "duration_min",
        "danceability",
        "energy",
        "speechiness",
        "acousticness",
        "liveness",
        "valence",
        "tempo"
    ]);


    data = data.filter(function(d){ 
        return d.track_genre == track_genre; 
    })

    // console.log("data:",data)
    var ids = data.map(({ track_name }) => track_name);
    data = data.filter(({ track_name }, index) => !ids.includes(track_name, index + 1));

    data.forEach(d => {
        let y0 = 0;
        d.criteria = color.domain().map(name => {
            // console.log(name,+d[name]);
            return { name: name, y0: y0, y1: y0 += +d[name] };
        });
        // console.log("d.criteria:",d.criteria);
        d.total = d.criteria[d.criteria.length - 1].y1;
        
    });
    
    y.domain(data.map(d => d.track_name));
    x.domain([0, d3.max(data, d => d.total)]);
    
    svg.append("g")
    .attr("class", "x axis")
    .call(xAxis);

    var pos = -(data.length/2-400); 
    if(track_genre == "acoustic"){
        var pos = -400;
    }
    else if(track_genre == "afrobeat"){
        var pos = -300;
    }
    else if(track_genre == "alt-rock"){
        var pos = -350;
    }
    else if(track_genre == "alternative"){
        var pos = 0;
    }

    console.log("data:",data.length,"pos:",pos);
    svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(0," + pos + ")") // This moves the x-axis to the bottom of the SVG
    .call(yAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.5em")
    .attr("dy", "-.5em")
    .attr("transform", "rotate(-35)");
    
    
    console.log("data:",data);
    const track_name = svg.selectAll(".track_name")
        .data(data)
        .enter().append("g")
        .attr("class", "g")
        .attr("transform", d => "translate(0," + y(d.track_name) + ")");

        track_name.selectAll("rect")
        .data(d => d["criteria"].map(obj => {
            obj['track_name'] = d['track_name'];
            obj['criteria']   = d['criteria'];
            return obj;
          }))
        .enter().append("rect")
        .attr("transform", "translate(0," + pos + ")")
        .attr("height", y.bandwidth())
        .attr("width", 100)
        .attr("x", d => x(d.y0))
        .attr("width", d => (x(d.y1) - x(d.y0)))
        .style("fill", d => color(d.name))
        .on("mouseover", function(event, d) {
            tooltip.transition()        
                .duration(200)      
                .style("opacity", 1);    
            tooltip.html(d.track_name + '<br/>'
                        +d.criteria[0].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[0].y1 - d.criteria[0].y0)*1000)/1000 + '<br/>'
                        +d.criteria[1].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[1].y1 - d.criteria[1].y0)*1000)/1000 + '<br/>'
                        +d.criteria[2].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[2].y1 - d.criteria[2].y0)*1000)/1000 + '<br/>'
                        +d.criteria[3].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[3].y1 - d.criteria[3].y0)*1000)/1000 + '<br/>'
                        +d.criteria[4].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[4].y1 - d.criteria[4].y0)*1000)/1000 + '<br/>'
                        +d.criteria[5].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[5].y1 - d.criteria[5].y0)*1000)/1000 + '<br/>'
                        +d.criteria[6].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[6].y1 - d.criteria[6].y0)*1000)/1000 + '<br/>'
                        +d.criteria[7].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[7].y1 - d.criteria[7].y0)*1000)/1000 + '<br/>'
                        +d.criteria[8].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[8].y1 - d.criteria[8].y0)*1000)/1000 + '<br/>')
                .style("height", "auto")
                .style("width", "auto")
                .style("left", (event.pageX + 5) + "px")     
                .style("top", (event.pageY - 28) + "px");    
        })                  
        .on("mouseout", function(event, d) {       
            tooltip.transition()        
                .duration(500)      
                .style("opacity", 0);   
        });

        
    console.log("color.domain().slice().reverse():",color.domain().slice().reverse())


    const legend = svg.selectAll(".legend")
        .data(color.domain().slice().reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => "translate(0," + (i * 20 + 20)+ ")");

    legend.append("rect")
        .attr("x", width )
        .attr("width", 25)
        .attr("height", 20)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 10)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(d => d)
        .each(function(d) {
            var bbox = this.getBBox();
            legend.insert("rect", "text")
               .style("fill", "#FFE6F0")
               .attr("x", bbox.x)
               .attr("y", bbox.y)
               .attr("width", bbox.width)
               .attr("height", bbox.height);
         });
     ;
}

// Load data
d3.csv("http://vis.lab.djosix.com:2023/data/spotify_tracks.csv").then(data => {
    data.forEach(d => {
        d["popularity"]   = +d["popularity"];
        d["duration_min"]  = (+d["duration_ms"])/(1000*60);
        d["danceability"] = +d["danceability"];
        d["energy"]       = +d["energy"];
        d["speechiness"]   = +d["speechiness"];
        d["acousticness"] = +d["acousticness"];
        d["liveness"]     = +d["liveness"];
        d["valence"]      = +d["valence"];
        d["tempo"]        = (+d["tempo"])/60;
    })
    allData = data;
    data.sort((b, a) => a['popularity'] - b['popularity']);
    updateChart(allData, "acoustic");
});
