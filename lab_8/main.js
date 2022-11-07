function position(d) {
    const t = d3.select(this);
    // console.log('t', t)
    switch (d.side) {
      case "top":
        t.attr("text-anchor", "middle").attr("dy", "-0.7em");
        break;
      case "right":
        t.attr("dx", "0.5em")
          .attr("dy", "0.32em")
          .attr("text-anchor", "start");
        break;
      case "bottom":
        t.attr("text-anchor", "middle").attr("dy", "1.4em");
        break;
      case "left":
        t.attr("dx", "-0.5em")
          .attr("dy", "0.32em")
          .attr("text-anchor", "end");
        break;
    }
}

function halo(text) {
text
    .select(function() {
    return this.parentNode.insertBefore(this.cloneNode(true), this);
    })
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 4)
    .attr("stroke-linejoin", "round");
}

d3.csv("driving.csv", d3.autoType).then(data => {
    // console.log("driving.csv", data)

    const margin = {top: 20, right: 20, bottom: 20, left: 50}
    const width = 1100 - margin.left - margin.right
    const height = 800 - margin.top - margin.bottom

    const svg = d3.select('.chart').append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            // .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
            // .attr("style", "outline: thin solid red;")
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    // Create axes
    const x = d3.scaleLinear()
        .domain(d3.extent(data.map(d => d.miles)))
        .range([0, width])
        .nice()

    const y = d3.scaleLinear()
        .domain(d3.extent(data.map(d => d.gas)))
        .range([height, 0])
        .nice()

    // update axes and axis title
    const xAx = d3.axisBottom(x)
        .tickFormat(d3.format(",.2r"))
    const yAx = d3.axisLeft(y)
        .tickFormat(d3.format("$.3r"))

    // Create axis containers
    const yGroup = svg.append("g")
            .attr("class","y-axis")
            .call(yAx)

    const xGroup = svg.append("g")
            .attr("class","x-axis")
            .attr("transform",`translate(0, ${height})`)
            .call(xAx)

    // Edit axes appearance
    yGroup
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width)
            .attr("stroke-opacity", 0.1)
            )
    xGroup
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("y2", - height)
            .attr("stroke-opacity", 0.1)
            )

    // X-axis title
    svg.append("text")
		  .attr('x', width)
		  .attr('y', height-margin.bottom/2)
		  .text("Miles per gallon")
          .attr("text-anchor","end")
          .style("font-weight","bold")
          .call(halo)

    // Y-axis title
    svg.append("text")
		  .attr('x', 10)
		  .attr('y', 5)
		  .text("Cost per gallon")
          .style("font-weight","bold")
          .call(halo)

    // Create circles
    const points = svg.selectAll(".point")
        .data(data)
        .join(
            enter => enter.append("circle")
                .attr("class", "point")
                .attr("cx", d => x(d.miles))
                .attr("cy", d => y(d.gas))
                .attr("r", 5)
                .attr("fill", "white")
                .attr("stroke", "black")
        )

    // Create labels
    const labels = svg.selectAll(".label")
        .data(data)
        .join(
            enter => enter.append("text")
                .attr("class", "label")
                .attr("x", d => x(d.miles))
                .attr("y", d => y(d.gas))
                .text(d => d.year)
        )
        .each(position)
        .call(halo)

    // Line path generator
    const line = d3.line()
        .curve(d3.curveNatural)
        .x(d => x(d.miles))
        .y(d => y(d.gas))

    // Create path
    const path = svg.append("path")
        .datum(data)
        .style("stroke", "black")
        .style("fill", "none")
        .attr("d", line)
    
    const I = d3.range(data.map(d => d.miles).length)
    console.log('I', I)
    let duration = 5000

    // Measure the length of the given SVG path string.
    function length(path) {
        return d3.create("svg:path").attr("d", path).node().getTotalLength();
    }
    // From https://observablehq.com/@d3/connected-scatterplot
    function animate() {
        if (duration > 0) {
            const l = length(line(data))
            // console.log("l", l)
        
            path
                .interrupt()
                .attr("stroke-dasharray", `0,${l}`)
            .transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .attr("stroke-dasharray", `${l},${l}`);
    
            labels
                .interrupt()
                .attr("opacity", 0)
            .transition()
                .delay(i => length(line(I.filter(j => j <= i))) / l * (duration - 125))
                .attr("opacity", 1);
        }    
        }
    
        animate()
})