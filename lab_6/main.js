import AreaChart from './AreaChart.js'
import StackedAreaChart from './StackedAreaChart.js'

d3.csv("unemployment.csv", d3.autoType).then(data =>{
    // Get total employment count per date
    data.map(d => {
        // d.date = Date(d.date),
        d.total = d3.sum(data.columns.filter(d => d !== 'date'), c => d[c])
    })
    const stackedAreaChart = StackedAreaChart(".area-chart")
    stackedAreaChart.update(data)

    const areaChart = AreaChart(".area-chart")
    areaChart.update(data)

    // Brushing based on area chart
    areaChart.on("brushed", (range) =>{
        // console.log(range)
        stackedAreaChart.filterByDate(range); // coordinating with stackedAreaChart
    })

    // Zooming based on stacked chart
    stackedAreaChart.on("zoomed", timeRange=>{
        areaChart.setBrush(timeRange);
    })
})