
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
    const criteria = document.getElementById("sortCriteria").value;
    console.log("criteria:",criteria+"_rank");
    if (order === "desc") {
        allData.sort((a, b) => a[criteria+"_rank"] - b[criteria+"_rank"]);
    } else {
        allData.sort((b, a) => a[criteria+"_rank"] - b[criteria+"_rank"]);
    }
    updateChart(allData);
}

function updateChart(data) {
    svg.selectAll("*").remove(); // Clear existing chart elements

    color.domain(["scores_teaching", "scores_research", "scores_citations", "scores_industry_income", "scores_international_outlook"]);
    data.forEach(d => {
        let y0 = 0;
        d.criteria = color.domain().map(name => {
            return { name: name, y0: y0, y1: y0 += +d[name] };
        });
        d.total = d.criteria[d.criteria.length - 1].y1;
    });


    y.domain(data.map(d => d.name));
    x.domain([0, d3.max(data, d => d.total)]);

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0," + -300  + ")") // This moves the x-axis to the bottom of the SVG
        .call(yAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.5em")
        .attr("dy", "-.5em")
        .attr("transform", "rotate(-35)");
        

    const university = svg.selectAll(".university")
        .data(data)
        .enter().append("g")
        .attr("class", "g")
        .attr("transform", d => "translate(0," + y(d.name) + ")");

    university.selectAll("rect")
        .data(d => d["criteria"].map(obj => {
            obj['scores_overall'] = d['scores_overall'];
            obj['university_name'] = d['name'];
            obj['criteria'] = d['criteria'];
            return obj;
          }))
        .enter().append("rect")
        .attr("transform", "translate(0," + -300  + ")")
        .attr("height", y.bandwidth())
        .attr("width", 100)
        .attr("x", d => x(d.y0))
        .attr("width", d => (x(d.y1) - x(d.y0)))
        .style("fill", d => color(d.name))
        .on("mouseover", function(event, d) {
            tooltip.transition()        
                .duration(200)      
                .style("opacity", 1);    
            tooltip.html(d.university_name + '<br/>'
                        + "Overall: " + d.scores_overall  + '<br/>'
                        +d.criteria[0].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[0].y1 - d.criteria[0].y0)*1000)/1000 + '<br/>'
                        +d.criteria[1].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[1].y1 - d.criteria[1].y0)*1000)/1000 + '<br/>'
                        +d.criteria[2].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[2].y1 - d.criteria[2].y0)*1000)/1000 + '<br/>'
                        +d.criteria[3].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[3].y1 - d.criteria[3].y0)*1000)/1000 + '<br/>'
                        +d.criteria[4].name.replace("scores_","").replace("_"," ") + ": " + Math.round((d.criteria[4].y1 - d.criteria[4].y0)*1000)/1000 )
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
        .text(d => d.replace("scores_","").replace("_"," "))
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
d3.csv("http://vis.lab.djosix.com:2023/data/TIMES_WorldUniversityRankings_2024.csv").then(data => {
    allData = data;
    allData.forEach(d => {
        d["scores_teaching"]                = d["scores_teaching"]=='n/a'              ? 0 : +d["scores_teaching"];
        d["scores_research"]                = d["scores_research"]=='n/a'              ? 0 : +d["scores_research"];
        d["scores_citations"]               = d["scores_citations"]=='n/a'             ? 0 : +d["scores_citations"];
        d["scores_industry_income"]         = d["scores_industry_income"]=='n/a'       ? 0 : +d["scores_industry_income"];
        d["scores_international_outlook"]   = d["scores_international_outlook"]=='n/a' ? 0 : +d["scores_international_outlook"];

        d["scores_overall_rank"]                 = d["scores_overall_rank"]== '0'               ? 5000 : +d["scores_overall_rank"];
        d["scores_teaching_rank"]                = d["scores_teaching_rank"]== '0'              ? 5000 : +d["scores_teaching_rank"];
        d["scores_research_rank"]                = d["scores_research_rank"]== '0'              ? 5000 : +d["scores_research_rank"];
        d["scores_citations_rank"]               = d["scores_citations_rank"]== '0'             ? 5000 : +d["scores_citations_rank"];
        d["scores_industry_income_rank"]         = d["scores_industry_income_rank"]== '0'       ? 5000 : +d["scores_industry_income_rank"];
        d["scores_international_outlook_rank"]   = d["scores_international_outlook_rank"]== '0' ? 5000 : +d["scores_international_outlook_rank"];
    })
    updateChart(allData);
});
