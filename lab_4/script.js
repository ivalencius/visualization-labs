let wh

// For tick labels
function formatPower(x) {
    const e = Math.log10(x);
    if (e !== Math.floor(e)) return; // Ignore non-exact power of ten.
    return `10${(e + "").replace(/./g, c => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c] || "⁻")}`;
  }

// For linear regression
function findLineByLeastSquares(values_x, values_y) {
    let x_sum = 0;
    let y_sum = 0;
    let xy_sum = 0;
    let xx_sum = 0;
    let count = 0;

    /*
     * The above is just for quick access, makes the program faster
     */
    let x = 0;
    let y = 0;
    let values_length = values_x.length;

    if (values_length != values_y.length) {
        throw new Error('The parameters values_x and values_y need to have same size!');
    }

    /*
     * Above and below cover edge cases
     */
    if (values_length === 0) {
        return [ [], [] ];
    }

    /*
     * Calculate the sum for each of the parts necessary.
     */
    for (let i = 0; i< values_length; i++) {
        x = values_x[i];
        y = values_y[i];
        x_sum+= x;
        y_sum+= y;
        xx_sum += x*x;
        xy_sum += x*y;
        count++;
    }

    /*
     * Calculate m and b for the line equation:
     * y = x * m + b
     */
    let m = (count*xy_sum - x_sum*y_sum) / (count*xx_sum - x_sum*x_sum);
    let b = (y_sum/count) - (m*x_sum)/count;

    /*
     * We then return the x and y data points according to our fit
     */
    let result_values_x = [];
    let result_values_y = [];

    for (let i = 0; i < values_length; i++) {
        x = values_x[i];
        y = x * m + b;
        result_values_x.push(x);
        result_values_y.push(y);
    }

    return [result_values_x, result_values_y, m, b];
}

const draw_charts = async() => {
    await d3.csv('wealth-health-2014.csv', d3.autoType)
        .then(data => wh = data)

    // Establish margins
    const margin = ({top: 40, right: 40, bottom: 40, left: 40})
    const width =  window.innerWidth - 200 - margin.left - margin.right
    const height = window.innerHeight - 100 - margin.top - margin.bottom

    // Establish scale for x-axis 
    const xScale = d3.scaleLog()
        .domain(d3.extent(wh.map(d => d.Income)))
        .range([0, width])

    // Establish scale for y-axis
    const yScale = d3.scaleLinear()
        .domain(d3.extent(wh.map(d => d.LifeExpectancy)))
        .range([height, 0])

    // Establish scale for region
    const regionScale = d3.scaleOrdinal()
        .domain(new Set(wh.map(d => d.Region)))
        .range(d3.schemeTableau10)

    // Establish scale for population
    const popScale = d3.scaleLinear()
        .domain(d3.extent(wh.map(d => d.Population)))
        .range([10, 40])
        // Size of circles will range from 0 to highest order of magnitude
        // .range([0, Math.floor(Math.log10(d3.max(wh.map(d=>d.Population))))])

    // Create svg
    let svg = d3.select('.chart').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Draw svg circle
    let circles = svg.selectAll("circle")
        .data(wh)
        .enter()
        .append("circle")
            .attr("cx", d => xScale(d.Income))
            .attr("cy", d => yScale(d.LifeExpectancy))
            .attr("r", d => popScale(d.Population))
            .attr("fill", d => regionScale(d.Region))
            .style("opacity", 0.75)

    // Define axes
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(6, formatPower)
    const yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(6, "~s")
    
    // Draw x-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .attr("class","axis x-axis")
        .call(xAxis)

    // Draw y-axis
    svg.append("g")
        .attr("class","axis y-axis")
        .call(yAxis)

    // X-axis title
    svg.append("text")
		.attr('x', width)
		.attr('y', height-margin.bottom/2)
		.text("Income")
            .attr("text-anchor","end")

    // Y-axis title
    svg.append("text")
		.attr('x', -margin.left/2)
		.attr('y', -margin.top/2)
		.text("Life Expectancy")
            .attr("transform","rotate(180)")
            .attr("writing-mode", "vertical-rl")
            .attr("alignment-baseline","right")
            .attr("text-anchor","end")

    // Select tooltip
    let tooltip = d3.select(".tooltip")

    // Function to show tooltip
    let show_tooltip = function() {
        tooltip.style("opacity", 1)
        d3.select(this).style("opacity",1)
    }

    // Function to set relative tooltip positioning
    let move_tooltip = function(event, d) {
        let tooltip_val = `Country: ${d.Country}
        <br>Region: ${d.Region}
        <br>Population: ${d3.format(",")(d.Population)}
        <br>Income: ${d3.format(",")(d.Income)}
        <br>Life Expectancy: ${d3.format('.2')(d.LifeExpectancy)}`

        tooltip
            .style("left", d3.pointer(event, window)[0]+3+"px")
            .style("top", d3.pointer(event, window)[1]+3+"px")
            // NEED TO ADD INFO AND FORMAT NUMBERS
            .html(tooltip_val)
    }

    // Function to hide tooltip
    let hide_tooltip = function() {
        tooltip.style("opacity", 0)
        d3.select(this).style("opacity",0.75)
            
    }

    // Create tooltip interactivity
    circles
        .on("mouseover", show_tooltip)
        .on("mousemove", move_tooltip)
        .on("mouseleave", hide_tooltip)

    // Create legend
    let legend = svg.append("g")
        .attr("class", "legend")
        .attr("x", width-200)
        .attr("y", height-225)
        // To move all children elements
        .attr("transform", `translate(${width-200},${height-225})`)
        .attr("height", 200)
        .attr("width", 200)

    // Add color boxes for legend
    legend.selectAll("rect")
        .data(regionScale.domain())
        .enter()
        .append("rect")
            .attr("position", "relative")
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", 0)
            .attr("y", (_, i) => (20+5) * i) // Use padding of 5
            .style("margin", "5px")
            .style("fill", d => regionScale(d))
    
    // Add text for legends
    legend.selectAll("label")
        .data(regionScale.domain())
        .enter()
        .append("text")
            .attr("x", 20+5)
            .attr("y", (_, i) => 15+(20+5) * i)
            .text(d => d)

    legend.selectAll("line-label")
        .data(["Dotted line indicates linear regression of all data points."])
        .enter()
        .append("text")
            .attr("x",200)
            .attr("y",15+(20+5)*6)
            .attr("text-anchor","end")
            .text(d => d)

    // get the x and y values for least squares (need to log transform x scale)
    // Need to sort values in advance
    let wh_sorted = wh.sort((a,b) => b.Income - a.Income)
    let xSeries = wh_sorted.map(d => Math.log10(d.Income))
    let ySeries = wh_sorted.map(d => d.LifeExpectancy)

    // New [x_arr, y_arr]
    let new_points = findLineByLeastSquares(xSeries, ySeries)
    let x1 = 10**d3.min(new_points[0]) // min x value
    let y1 = new_points[1][new_points[0].indexOf(Math.log10(x1))]
    let x2 = 10**d3.max(new_points[0]) // max x value
    let y2 = new_points[1][new_points[0].indexOf(Math.log10(x2))]
    let trendData = [[x1,y1,x2,y2]]

    // Draw trendline
    svg.selectAll(".trendline")
        .data(trendData)
        .enter()
        .append("line")
        .attr("class", "trendline")
        .attr("x1", d => xScale(d[0]))
        .attr("y1", d => yScale(d[1]))
        .attr("x2", d => xScale(d[2]))
        .attr("y2", d => yScale(d[3]))
        .attr("stroke", "black")
        .attr("stroke-dasharray", "10,10")
        .attr("stroke-width", 1)

}

draw_charts()