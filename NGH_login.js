function doLogin() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("loginError");

    // Clear previous errors
    if (errorEl) errorEl.textContent = "";

    // For presentation purposes, we use a fixed admin credential
    if (u === "admin" && p === "1234") {
        // Store session data so the dashboard knows we are logged in
        localStorage.setItem("NGH_AUTH", "true");
        localStorage.setItem("NGH_USER", "Administrator");
        
        // Redirect to the main dashboard
        window.location.href = "index.html";
    } else if (u === "" || p === "") {
        if (errorEl) errorEl.textContent = "Please enter both username and password.";
    } else {
        if (errorEl) errorEl.textContent = "Invalid credentials. Hint: admin / 1234";
    }
}

// Allow pressing "Enter" to login
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        doLogin();
    }
});
