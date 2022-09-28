// Variables to access globally
let cities
let buildings

// Use the Cities csv file asynchronously
const city_async = async () => {
    let filtered

    await d3.csv('cities.csv', d3.autoType)
    .then(data => cities = data)
    .then(data => {
        filtered = data.filter(d=>d.eu)
    })

    d3.select('.city-count').text(filtered.length.toString() + ' Cities')

    let extent = d3.extent(filtered.map(d => d.population))
    
    const width = 700;
    const height = 550;
    let scatter = d3.select('.population-plot')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .selectAll('div')
        .data(filtered)
        .enter()
        
    let circles = scatter.append('circle')
        .attr('cx', (d, _) => d.x)
        .attr('cy', (d, _) => d.y)
        .attr('r', (d, _) => {
            if(d.population < 1000000){
                return 4
            } else {
                return 8
            }
        })
        .style('opacity', 0.5)

    scatter.filter((d, _) => d.population >= 1000000)
        .append('text')
        .attr('text-anchor','middle')
        .attr('font-size', 11)
        .attr('x', (d, _) => d.x)
        .attr('y', (d, _) => d.y-15)
        .text((d, _) => d.city)

    // Tool tip
    let scattertip = d3.select('.population-plot')
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")

    // Three function that change the tooltip when user hover / move / leave a cell
    let mouseover = function () {
        scattertip.style("opacity", 1)
        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 1)
    }

    let mousemove = function(event, d) {
        scattertip
            .html("<strong>Country:</strong> "+ d.country +", <strong>City:</strong> "+d.city+", <strong>Population:</strong> "+d.population)
            // Need to offset because event.pageX is relative (???)
            .style("left", parseInt(event.pageX)-parseInt(d3.select(this).attr("cx"))+"px")
            .style("top", parseInt(event.pageY)+20+"px")

        console.log(parseInt(d3.select(this).attr("r")))
    }

    let mouseleave = function() {
        scattertip.style("opacity", 0)
            .transition()
            .duration(200)

        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 0.5)
    }

    let tooltip = circles
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
}

// Use the Cities csv file asynchronously
const buildings_async = async () => {
    let buildings_sorted

    await d3.csv('buildings.csv', d3.autoType)
    .then(data => buildings = data)
    .then(data =>{
        buildings_sorted = data.sort((a, b) => b.height_m-a.height_m)
    })

    let margin = {top: 30, right: 30, bottom: 30, left: 150}
    let width = 500 - margin.left - margin.right
    let height = 500 - margin.top - margin.bottom

    //Initalize svg
    let bar_chart = d3.select('.building-plot')
        .append('svg')
        .attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .append("g")
            .attr("transform","translate(" + margin.left + "," + margin.top + ")")
        .selectAll('div')
        .data(buildings_sorted)
        .enter()

    // y axis
    var y = d3.scaleBand()
        .domain(buildings_sorted.map(function(d) { return d.building; }))
        .range([0, height])
        .padding(0.2)

    bar_chart.append("g")
        .attr("transform", "translate(0,0)")
        .call(d3.axisLeft(y))
        .selectAll("text")
          .attr("transform", "translate(-10,0)rotate(-45)")
          .style("text-anchor", "end")
      
    // Create scale to convert heights to pixels
    let height_scale = d3.scaleLinear()
        .domain([
            0, 
            d3.max(buildings_sorted.map(d => d.height_m))])
        .range([height, 0]);

    //Add rectangles
    bar_chart.append('rect')
        .attr("y", (d, _) => y(d.building) )
        .attr("x", (d,_) => 0)
        .attr("height", y.bandwidth())
        .attr("width", (d,_) => width-height_scale(d.height_m))
        .style("opacity", 0.5)
        // Add interactivity
        .on('click', (_, d) =>{
            // Add image
            d3.select(".detail-panel")
                .select(".image")
                .attr("src","img/"+(buildings_sorted.indexOf(d)+1)+".jpg")
            // Add building name
            d3.select(".building-name").text(d.building)
            // Add attributes
            d3.select(".height").text(d.height_m + " m ("+d.height_ft+" ft)")
            d3.select(".city").text(d.city)
        })
        // Can't use 'this' with arrow function
        .on("mouseover", function() {
            d3.select(this)
                .style("opacity", 1)
        })
        .on("mouseleave", function() {
            d3.select(this)
                .style("opacity", 0.5)
        })
    
    // Add height text
    bar_chart.append('text')
        .attr("class", "label")
        .attr("text-anchor","end")
        .attr("x", (d, _) => width-height_scale(d.height_m)-10)
        .attr("y",(d,_) => y(d.building)+(500/(2*buildings_sorted.length)))
        .text((d, _) => d.height_m + " m")
        .style("stroke", "white")
}

// Call async fxns, 1 for each file
city_async() 
buildings_async()