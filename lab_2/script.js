// TODO: load the dataset 
let attractions;
// fetch() is asynschronous, need to get around this
const request = async () => {
        const response = await fetch('attractions.json')
            .then(response => response.json())
            .then(data => {
                attractions = data;
            });
        // Wait until fetch is complete then create the initial bar chart
        filterData('all')
    }
    
    request();

function filterData(category) {

	/* **************************************************
	 *
	 * TODO: filter attractions by the selected category
	 * TODO: filter top 5 attractions
	 *
	 * CALL THE FOLLOWING FUNCTION TO RENDER THE BAR-CHART:
	 *
	 * renderBarChart(data)
	 *
	 * - 'data' must be an array of JSON objects
	 * - the max. length of 'data' is 5
	 *
	 * **************************************************/
    if (category === 'all'){
        // Create initial bar chart regardless of category
        renderBarChart(attractions.sort(function(a,b){return a.Visitors - b.Visitors}).reverse().slice(0, 5))
    } else {
        // Only return elements matching the given category
        let categorized = attractions.filter(element => {return element.Category === category})
        // sort() is in ascending order, .reverse() to get descending
        let sorted = categorized.sort(function(a,b){return a.Visitors - b.Visitors}).reverse()
        renderBarChart(sorted.slice(0, 5))
    }
}

// TODO: Define an event listener for the dropdown menu
//       Call filterData with the selected category

document.querySelector('#attraction-category').addEventListener('click', event =>{
    let park_type  = event.target.value
    filterData(park_type)
})