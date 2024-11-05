document.getElementById("subscription-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent form from refreshing the page

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const packageType = document.getElementById("packageType").value;

    try {
        const response = await fetch(`${getBaseUrl()}/members`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                packageType: packageType
            })
        });
        

        // Parse the JSON response only once and store it in a variable
        const result = await response.json();

        if (response.ok) {
            document.getElementById("response-message").textContent = result.message || "Subscription successful!";
        } else {
            document.getElementById("response-message").textContent = "Error: " + (result.error || "Unexpected error.");
        }
    } catch (error) {
        document.getElementById("response-message").textContent = "Network error: " + error.message;
    }
});
// Determine the base URL dynamically
const getBaseUrl = () => {
    // If deployed, use the Render-provided URL; fallback to localhost for local dev
    return window.location.origin.includes("localhost") ? "http://localhost:5272" : "https://yourappname.onrender.com";
};
