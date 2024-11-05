document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the form from refreshing the page

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:5272/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        // Check if the response status is OK (200-299)
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error:", errorText);
            document.getElementById("response-message").textContent = `Error: ${errorText || "Login failed"}`;
            return; // Exit if there's an error
        }

        // Parse the JSON response for successful login
        const data = await response.json();
        console.log("Login successful:", data.message);
        document.getElementById("response-message").textContent = "Login successful! Redirecting...";

        // Redirect to admin page on successful login
        // Redirect to admin page with cache-busting query string
        window.location.href = "admin.html?v=" + new Date().getTime();

    } catch (error) {
        console.error("Network error:", error.message);
        document.getElementById("response-message").textContent = "Network error: " + error.message;
    }
});
