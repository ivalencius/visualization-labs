// CHART INIT ------------------------------

// Create axis labels matching type
const label_map = {
    'stores':'Number of Stores Worldwide',
    'revenue':'Revenue in Billions of USD'
}

// Create SVG
const margin = {top: 20, right: 10, bottom: 20, left: 50}
const width = 960 - margin.left - margin.right
const height = 500 - margin.top - margin.bottom

const svg_base = d3.select(".bar-chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("role", "graphics-document")
        .attr("aria-roledescription", "bar chart")
        .attr("tabindex", "0")
        // .attr("aria-labelledby","title")
const svg = svg_base
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

// Create x-axis scale
const xScale = d3.scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.1)

// Create y-axis scale
const yScale = d3.scaleLinear()
    .rangeRound([height, 0])

// Create color scale
const cScale = d3.scaleSequentialLog()
    .interpolator(d3.interpolateOranges)

// update axes and axis title
const xAx = d3.axisBottom(xScale)
const yAx = d3.axisLeft(yScale)
    .tickFormat(d3.format(",.2r"))

// Create axis containers
const yGroup = svg.append("g")
        .attr("class","y-axis")
        .attr("aria-hidden","true")

const xGroup = svg.append("g")
        .attr("class","x-axis")
        .attr("transform",`translate(0, ${height})`)
        .attr("aria-hidden", "true")

const yLabel = svg.append("text")
        .attr("class", "y-axis-label")
        .attr("x", 0)
        .attr("y", 0 - margin.top)
        .attr("dy", "1em")
        .style("text-anchor", "start")

let type = d3.select("#group-by").node().value
let order = d3.select("#sort-button").node().value

// CHART UPDATE FUNCTION -------------------
function update(data, type){
	// update domains
    xScale.domain(data.map(d => d.company))
    yScale.domain([0, d3.max(data.map(d => d[type]))])
    cScale.domain(d3.extent(data.map(d => d[type])))

    // Change aria
    // svg_base.attr("aria-labelledby", `${type} per Coffee House Chain`)
    svg_base.attr("aria-label", type === "stores"
        ? "Bar chart showing the number of stores world-wide. Starbucks has the most stores with over 20 thousand. It is followed by Dunkin Donuts and Tim Hortons. Einstein Noah and Caffe Nero operate the fewest stores."
        : "Bar chart showing the revenue of coffee chains. Starbucks makes the most at over 16 billion with Tim Hortons making the second most at only around 3 billion. The revenue of the rest of the stores varies by around 1 billion."
    )
    // Start a transition.
    const t = svg.transition().duration(2000)
    const delayfxn = (_, i) => i*100
	// update bars
    const bars = svg.selectAll("rect")
        .data(data, d => d.company)
        .join(
            enter => enter.append("rect")
                // .property("key", i => xScale(i))) // for future transitions
                .attr("x", d => xScale(d.company))
                .attr("y", d => yScale(d[type]))
                .attr("width", xScale.bandwidth)
                .attr("height", d => height - yScale(d[type]))
                .attr("fill", d => cScale(d[type]))
                .attr("tabindex", "0")
                .attr("role", "graphics-symbol")
                .attr("aria-roledescription", "bar element")
                .attr("aria-label", d => type === "stores"
                    ? `${d.company} operates ${d[type]} stores.`
                    : `${d.company} makes ${d[type]} billion dollars in revenue.`
                ),
            update => update
                .call(update => 
                    update
                    .transition(t).delay(delayfxn)
                    .attr("height", d => height - yScale(d[type]))
                    .attr("y", d => yScale(d[type]))
                    .attr("fill", d => cScale(d[type]))
                    .attr("x", d => xScale(d.company)))
                    .attr("aria-label", d => type === "stores"
                    ? `${d.company} operates ${d[type]} stores.`
                    : `${d.company} makes ${d[type]} billion dollars in revenue.`
                    ),
                    exit => exit.remove()
        )
    
    xGroup.transition(t)
        .call(xAx)
        .call(g => g.selectAll(".tick").delay(delayfxn))

    yGroup
        .transition(t)
        .call(yAx)

    yLabel
        .text(label_map[type])
}
// CHART UPDATES ---------------------------
function sort_data(data, type){
    order = d3.select('#sort-button').node().value * -1
    d3.select('#sort-button').property("value", order)
    if (order > 0) {
        data.sort((a, b) => a[type]-b[type])
    } else if (order < 0) {
        data.sort((a, b) => b[type]-a[type])
    }
}
// Loading data
d3.csv("coffee-house-chains.csv", d3.autoType).then(data => {
    d3.select('#group-by').on("change", () =>{
        type = d3.select('#group-by').node().value
        // sort_data(data, type)
        update(data, type)
    
    // const svg = d3
    //     .select(".bar-chart")
    //     .select("svg")
    // svg_base
    //     .attr("aria-labelledby", "Stores per Coffee House Chain";

    // svg_base.select("#title").remove();
      
    //   svg.attr("aria-labelledby", "title");
    // svg
    //   .insert("title", ":first-child") // needs to be the first element
    //   .attr("id", "title")
    //   .text(
    //      type === "stores"
    //       ? "Bar chart showing the number of stores world-wide. Starbucks has the most stores with over 20 thousand. It is followed by Dunkin Donuts and Tim Hortons. Einstein Noah and Caffe Nero operate the fewest stores."
    //       : "Bar chart showing the revenue of coffee chains. Starbucks makes the most at over 16 billion with Tim Hortons making the second most at only around 3 billion. The revenue of the rest of the stores varies by around 1 billion."
    //   )
    })

    // For when sort button is clicked
    d3.select('#sort-button').on("click", () => {
        sort_data(data, type)
        update(data, type)
    })
    sort_data(data, type) // call initial sort
	update(data, type); // simply call the update function with the supplied data
});