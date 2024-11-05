// admin.js

// Display results or messages
function displayMessage(message) {
    document.getElementById("response-message").textContent = message;
}

// Determine the base URL dynamically
const getBaseUrl = () => {
    // If deployed, use the Render-provided URL; fallback to localhost for local dev
    return window.location.origin.includes("localhost") ? "http://localhost:5272" : "https://yourappname.onrender.com";
};


// Fetch and display all members
async function getAllMembers() {
    try {
        const response = await fetch(`${getBaseUrl()}/members`);
        if (!response.ok) throw new Error("Failed to fetch members");

        const members = await response.json();
        const membersList = document.getElementById("members-list");
        membersList.innerHTML = "<h3>All Members</h3>" + members.map(member => `
            <p>ID: ${member.id}, Name: ${member.name}, Email: ${member.email}, Package: ${member.packageType}</p>
        `).join('');
    } catch (error) {
        displayMessage("Error: " + error.message);
    }
}


// Add a new member (prompt for name, email, and package type)
async function addMember() {
    const name = prompt("Enter member name:");
    const email = prompt("Enter member email:");
    const packageType = prompt("Enter package type (e.g., Platinum, Golden):");

    if (!name || !email || !packageType) {
        displayMessage("All fields are required to add a member.");
        return;
    }

    try {
        const response = await fetch(`${getBaseUrl()}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, packageType })
        });

        if (response.ok) {
            displayMessage("Member added successfully!");
            getAllMembers(); // Refresh member list
        } else {
            const errorData = await response.json();
            displayMessage("Error: " + (errorData.error || "Failed to add member"));
        }
    } catch (error) {
        displayMessage("Network error: " + error.message);
    }
}

// Add a new admin (prompt for username and password)
async function addAdmin() {
    const username = prompt("Enter admin username:");
    const password = prompt("Enter admin password:");

    if (!username || !password) {
        displayMessage("Username and password are required to add an admin.");
        return;
    }

    try {
        const response = await fetch(`${getBaseUrl()}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            displayMessage("Admin added successfully!");
        } else {
            const errorData = await response.json();
            displayMessage("Error: " + (errorData.error || "Failed to add admin"));
        }
    } catch (error) {
        displayMessage("Network error: " + error.message);
    }
}

// Delete a member by ID (prompt for member ID)
async function deleteMember() {
    const memberId = prompt("Enter member ID to delete:");

    if (!memberId) {
        displayMessage("Member ID is required to delete a member.");
        return;
    }

    try {
        const response = await fetch(`${getBaseUrl()}/${memberId}`, {
            method: "DELETE"
        });

        if (response.ok) {
            displayMessage("Member deleted successfully!");
            getAllMembers(); // Refresh member list
        } else {
            const errorData = await response.json();
            displayMessage("Error: " + (errorData.message || "Failed to delete member"));
        }
    } catch (error) {
        displayMessage("Network error: " + error.message);
    }
}
