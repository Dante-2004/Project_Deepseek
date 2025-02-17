document.getElementById("searchForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const query = document.getElementById("movieInput").value.trim();
    const resultsContainer = document.getElementById("resultsContainer");

    // Check if the query is empty
    if (!query) {
        alert("Please enter a movie name.");
        return;
    }

    try {
        // Fetch recommendations from the server
        const response = await fetch("/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ movie: query }),
        });

        // Check if the response is OK (status 200-299)
        if (!response.ok) {
            throw new Error("Failed to fetch recommendations.");
        }

        // Parse the JSON response
        const data = await response.json();
        console.log(data);  // Log the data returned from the server to check the structure

        // Clear previous results
        resultsContainer.innerHTML = "";

        // Check if recommendations exist
        if (data.recommendations && data.recommendations.length > 0) {
            // Loop through the recommendations and display each movie
            data.recommendations.forEach((movie) => {
                console.log(movie);  // Log each movie object to check the details

                // Create a new movie card
                const movieCard = document.createElement("div");
                movieCard.className = "carousel-item";  // Use the carousel-item class for styling

                // Insert the movie image and title, and add an event listener for the modal view
                movieCard.innerHTML = `
                    <img src="${movie.image_url}" alt="${movie.title}" 
                         onclick="showOverview('${movie.title}', '${movie.overview}', '${movie.image_url}')"
                         style="width: 180px; height: auto; border-radius: 8px; user-select: none;">
                    <h3>${movie.title}</h3>
                `;
                resultsContainer.appendChild(movieCard);
            });
        } else {
            resultsContainer.innerHTML = "<p>No recommendations found.</p>";
        }
    } catch (error) {
        // Handle any errors and display a message
        console.error(error);
        resultsContainer.innerHTML = "<p>Error fetching recommendations. Please try again.</p>";
    }
});

// Function to show the movie overview in a modal
function showOverview(title, content, imageUrl) {
    const modal = document.getElementById('overviewModal');
    const body = document.body;

    // Set the modal content
   // document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalContent').textContent = content;
    document.getElementById('modalImage').src = imageUrl;

    // Add blur class to body
    body.classList.add('blurred'); // Use the blurred class for CSS effect
    
    // Show the modal
    modal.style.display = 'flex';
    const modalImage = document.getElementById('modalImage');
    modalImage.style.transformOrigin = 'center'; 
    modalImage.style.transform = 'scale(1)';
    // Zoom effect on the image after a slight delay
    setTimeout(() => {
        document.getElementById('modalImage').style.transform = 'scale(0.8)'; // Increase scale for zoom effect
    }, 50);
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('overviewModal');
    const body = document.body;
    
    // Hide the modal
    modal.style.display = 'none';
    
    // Restore the background
    body.classList.remove('blurred'); // Use the blurred class for CSS effect
    
    // Reset the zoom effect on the image
    document.getElementById('modalImage').style.transform = 'scale(1)';
}

// Drag functionality for the results container
let isMouseDown = false;
let startX;
let scrollLeft;

const resultsContainer = document.getElementById("resultsContainer");

// When mouse is pressed down
resultsContainer.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    startX = e.pageX - resultsContainer.offsetLeft; // Get the starting position
    scrollLeft = resultsContainer.scrollLeft; // Get the current scroll position
    resultsContainer.style.cursor = "grabbing"; // Change cursor style to indicate dragging
});

// When mouse is released
resultsContainer.addEventListener("mouseup", () => {
    isMouseDown = false;
    resultsContainer.style.cursor = "grab"; // Change cursor style back to normal
});

// When mouse is moving
resultsContainer.addEventListener("mousemove", (e) => {
    if (!isMouseDown ) return; // Exit if not dragging
    e.preventDefault(); // Prevent default behavior
    const x = e.pageX - resultsContainer.offsetLeft; // Get current mouse position
    const walk = (x - startX) * 2; // Calculate how far to scroll
    resultsContainer.scrollLeft = scrollLeft - walk; // Scroll the container
});

// Touch events for mobile devices
resultsContainer.addEventListener("touchstart", (e) => {
    isMouseDown = true;
    startX = e.touches[0].pageX - resultsContainer.offsetLeft; // Get the starting position
    scrollLeft = resultsContainer.scrollLeft; // Get the current scroll position
    resultsContainer.style.cursor = "grabbing"; // Change cursor style to indicate dragging
});

resultsContainer.addEventListener("touchend", () => {
    isMouseDown = false;
    resultsContainer.style.cursor = "grab"; // Change cursor style back to normal
});

resultsContainer.addEventListener("touchmove", (e) => {
    if (!isMouseDown) return; // Exit if not dragging
    e.preventDefault(); // Prevent default behavior
    const x = e.touches[0].pageX - resultsContainer.offsetLeft; // Get current touch position
    const walk = (x - startX) * 2; // Calculate how far to scroll
    resultsContainer.scrollLeft = scrollLeft - walk; // Scroll the container
});
