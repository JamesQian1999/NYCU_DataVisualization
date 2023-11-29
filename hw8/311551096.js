let AllData;
var units = "Widgets";

d3.sankey = function() {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 8,
      size = [1, 1],
      nodes = [],
      links = [];

  sankey.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.layout = function(iterations) {
    computeNodeLinks();
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    computeLinkDepths();
    return sankey;
  };

  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };

  sankey.link = function() {
    var curvature = .5;

    function link(d) {
      var x0 = d.source.x + d.source.dx,
          x1 = d.target.x,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y + d.sy + d.dy / 2,
          y1 = d.target.y + d.ty + d.dy / 2;
      return "M" + x0 + "," + y0
           + "C" + x2 + "," + y0
           + " " + x3 + "," + y1
           + " " + x1 + "," + y1;
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function(node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    links.forEach(function(link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function(node) {
      node.value = Math.max(
        d3.sum(node.sourceLinks, value),
        d3.sum(node.targetLinks, value)
      );
    });
  }

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  function computeNodeBreadths() {
    var remainingNodes = nodes,
        nextNodes,
        x = 0;

    while (remainingNodes.length) {
      nextNodes = [];
      remainingNodes.forEach(function(node) {
        node.x = x;
        node.dx = nodeWidth;
        node.sourceLinks.forEach(function(link) {
          if (nextNodes.indexOf(link.target) < 0) {
            nextNodes.push(link.target);
          }
        });
      });
      remainingNodes = nextNodes;
      ++x;
    }

    //
    moveSinksRight(x);
    scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
  }

  function moveSinksRight(x) {
    nodes.forEach(function(node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function(node) {
      node.x *= kx;
    });
  }

  function computeNodeDepths(iterations) {
    var nodesByBreadth = d3.nest()
        .key(function(d) { return d.x; })
        .sortKeys(d3.ascending)
        .entries(nodes)
        .map(function(d) { return d.values; });

    //
    initializeNodeDepth();
    resolveCollisions();
    for (var alpha = 1; iterations > 0; --iterations) {
      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
      relaxLeftToRight(alpha);
      resolveCollisions();
    }

    function initializeNodeDepth() {
      var ky = d3.min(nodesByBreadth, function(nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
      });

      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function(link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function(nodes, breadth) {
        nodes.forEach(function(node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function(nodes) {
        nodes.forEach(function(node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function(nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.y - b.y;
    }
  }

  function computeLinkDepths() {
    nodes.forEach(function(node) {
      node.sourceLinks.sort(ascendingTargetDepth);
      node.targetLinks.sort(ascendingSourceDepth);
    });
    nodes.forEach(function(node) {
      var sy = 0, ty = 0;
      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function(link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      return a.source.y - b.source.y;
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  function center(node) {
    return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
};

// set the dimensions and margins of the graph
var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 1500 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

// format variables
var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scaleOrdinal(d3.schemeCategory10);

// append the svg object to the body of the page
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

// Set the sankey diagram properties
var sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([width, height]);

var path = sankey.link();

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

function GetAllCombinations(attributes) {
  
  const keys = Object.keys(attributes);
  const combinations = [];

  // Any two attributes
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const firstAttribute = keys[i];
      const secondAttribute = keys[j];

      attributes[firstAttribute].forEach(firstValue => {
        attributes[secondAttribute].forEach(secondValue => {
          combinations.push({
            [firstAttribute]: firstValue,
            [secondAttribute]: secondValue
          });
        });
      });
    }
  }
  
  return combinations;
}


function countAttributePairings(data, attr1, value1, attr2, value2) {
  return data.filter(item => item[attr1] === value1 && item[attr2] === value2).length;
}

// load the data
d3.text("http://vis.lab.djosix.com:2023/data/car.data", function(data) {

  data = "buying,maint,doors,persons,lug_boot,safety,class\n" + data;
  data = csvToArr(data, ",");

  data.forEach((d) => {
      d.buying    = "buying_"   + d.buying  ;
      d.maint     = "maint_"    + d.maint   ;
      d.doors     = "doors_"    + d.doors   ;
      d.persons   = "persons_"  + d.persons ;
      d.lug_boot  = "lugboot_"  + d.lug_boot;    
      d.safety    = "safety_"   + d.safety  ;
      d.class     = "class_"    + d.class   ;
  });
  
  // Log the total number of combinations
  let attributes = {
    "buying"  : ['buying_vhigh', 'buying_high', 'buying_med', 'buying_low'],
    "maint"   : ['maint_vhigh', 'maint_high', 'maint_med', 'maint_low'],
    "doors"   : ['doors_2', 'doors_3', 'doors_4', 'doors_5more'],
    "persons" : ['persons_2', 'persons_4', 'persons_more'],
    "lug_boot": ['lugboot_small', 'lugboot_med', 'lugboot_big'],
    "safety"  : ['safety_low', 'safety_med', 'safety_high'],
    "class"   : ['class_unacc', 'class_acc', 'class_good', 'class_vgood']
  };

  AllData = data;
  render(attributes);
});


function render(attributes){
  data = AllData;
  combinations = GetAllCombinations(attributes);

  pairData = {};
  for( pair in combinations ){
    key = Object.keys(combinations[pair])
    value = Object.values(combinations[pair])
    pairData[value[0]+"-"+value[1]] = countAttributePairings(data, key[0], value[0], key[1], value[1]);
  }

  preprocess = [];
  for( pair in pairData ){
    preprocess.push({'source':pair.split("-")[0], 'target':pair.split("-")[1], 'value':pairData[pair]});
  }
 
  //set up graph in same style as original example but empty
  graph = {"nodes" : [], "links" : []};

  preprocess.forEach(function (d) {
    graph.nodes.push({ "name": d.source });
    graph.nodes.push({ "name": d.target });
    graph.links.push({ "source": d.source,
                       "target": d.target,
                       "value": +d.value });
   });

  // return only the distinct / unique nodes
  graph.nodes = d3.keys(d3.nest()
    .key(function (d) { return d.name; })
    .object(graph.nodes));


  // loop through each link replacing the text with its index from node
  graph.links.forEach(function (d, i) {
    graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
    graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
  });

  // now loop through each nodes to make nodes an array of objects
  // rather than an array of strings
  graph.nodes.forEach(function (d, i) {
    graph.nodes[i] = { "name": d };
  });

  sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(32);
  
    var tooltip = d3.select("body").append("div") 
      .attr("class", "tooltip")       
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("z-index", "10"); // make sure it's on top

  // add in the links
  var link = svg.append("g").selectAll(".link")
      .data(graph.links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) {  return Math.max(1, d.dy); })
      .on("mouseover", function(event, d) {
        var x = d3.event.pageX;
        var y = d3.event.pageY;

        tooltip.transition()
          .duration(5)
          .style("opacity", 0.9);
        tooltip.html(graph.links[d].source.name.replace("_",": ") + " → " + graph.links[d].target.name.replace("_",": ") + "<br/>" + graph.links[d].value)
          .style("height", "auto")
          .style("width", "auto")
          .style("left", (x+10) + "px")
          .style("top",  (y+10) + "px");

        d3.select(this).style("stroke-opacity", 0.5);
        })
        .on("mouseout", function() {
            tooltip.transition()
              .duration(5)
              .style("opacity", 0);
            d3.select(this).style("stroke-opacity", 0.2);
        });


  // add in the nodes
  var node = svg.append("g").selectAll(".node")
      .data(graph.nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { 
		  return "translate(" + d.x + "," + d.y + ")"; })
      .call(d3.drag()
        .subject(function(d) {
          return d;
        })
        .on("start", function() {
          this.parentNode.appendChild(this);
        })
        .on("drag", function dragmove(d) {
          // the function for moving the nodes
          d3.select(this)
            .attr("transform", 
                  "translate(" 
                    + (d.x = Math.max(0, d3.event.x) ) + "," 
                    + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y)))
                    + ")");
          sankey.relayout();
          link.attr("d", path);
        }));

  // add the rectangles for the nodes
  node.append("rect")
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) { 
		  return d.color = color(d.name.replace(/ .*/, "")); })
      .style("stroke", function(d) { 
		  return d3.rgb(d.color).darker(2); })
    .append("title")
      .text(function(d) { 
		  return d.name + "\n" + format(d.value); });

  // add in the title for the nodes
  node.append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name.replace("_",": "); })
    .filter(function(d) { return d.x < width / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");
}

// Function to update the chart based on checkbox changes
function updateChart() {
   // Get the current status of checkboxes
   var selectedAttributes = {
    "buying"  : document.getElementById("buying").checked   ? ['buying_vhigh', 'buying_high', 'buying_med', 'buying_low'] : [],
    "maint"   : document.getElementById("maint").checked    ? ['maint_vhigh', 'maint_high', 'maint_med', 'maint_low']     : [],
    "doors"   : document.getElementById("doors").checked    ? ['doors_2', 'doors_3', 'doors_4', 'doors_5more']            : [],
    "persons" : document.getElementById("persons").checked  ? ['persons_2', 'persons_4', 'persons_more']                  : [],
    "lug_boot": document.getElementById("lug_boot").checked ? ['lugboot_small', 'lugboot_med', 'lugboot_big']             : [],
    "safety"  : document.getElementById("safety").checked   ? ['safety_low', 'safety_med', 'safety_high']                 : [],
    "class"   : document.getElementById("class").checked    ? ['class_unacc', 'class_acc', 'class_good', 'class_vgood']   : []
  };

  // Clear the existing SVG to prepare for new rendering
  svg.selectAll("*").remove();

  // Render the sankey with the selected attributes
  render(selectedAttributes);
}