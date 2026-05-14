// --- 1. HANDLE LOGOUT (Updated for Static GitHub Pages) ---
function logout() {
    localStorage.clear();
    // Redirecting to index.html because GitHub Pages cannot run index.php
    window.location = "index.html"; 
}

// --- 2. DYNAMIC FETCH FROM MODEL OUTPUT ---
// Updated path: GitHub Actions will save the JSON in the main folder, not /outputs/
fetch("finaloccupancy.json") 
    .then(response => {
        if (!response.ok) throw new Error("JSON not found - Make sure GitHub Actions has run at least once.");
        return response.json();
    })
    .then(data => {
        console.log("Data loaded successfully:", data);

        // Map 'breakdown' from Python to 'forecast'
        if (!data.forecast && data.breakdown) {
            data.forecast = data.breakdown; 
        }

        // 🔹 A. Hospital Risk
        const riskBox = document.getElementById("patientPrediction");
        if (riskBox && data.hospital_shortage_risk) {
            const hRisk = data.hospital_shortage_risk;
            // Updated to handle both "HIGH" and "CRITICAL" logic from your Python script
            const riskStyle = (hRisk === "CRITICAL" || hRisk === "HIGH") 
                ? "color:#E74C3C; font-weight:bold;" 
                : "color:#16A085;";

            riskBox.innerHTML = `
                <strong>Overall Hospital Bed Shortage Risk:</strong>
                <span style="${riskStyle}">${hRisk}</span>`;
        }

        // 🔹 B. Occupancy Table
        const occupancyBox = document.getElementById("occupancyResults");
        if (occupancyBox && data.forecast) {
            let tableHtml = `
                <strong>Next Week's Bed Occupancy:</strong>
                <table style="width:100%; margin-top:10px; border-collapse:collapse;">
                    <tr style="border-bottom:2px solid #eee;">
                        <th style="text-align:left; padding:5px;">Date</th>
                        <th style="text-align:right; padding:5px;">Occupancy</th>
                    </tr>`;

            data.forecast.forEach(row => {
                const val = Math.round(Number(row.total_occupancy) || 0);
                tableHtml += `
                    <tr style="border-bottom:1px solid #f9f9f9;">
                        <td style="padding:5px;">${row.date}</td>
                        <td style="padding:5px; text-align:right; font-weight:bold;">${val} Beds</td>
                    </tr>`;
            });

            tableHtml += `</table>`;
            occupancyBox.innerHTML = tableHtml;
        }

        // 🔹 C. First day value (The immediate forecast)
        if (data.forecast?.length > 0) {
            const first = Math.round(Number(data.forecast[0].total_occupancy) || 0);
            const predEl = document.getElementById("predOccupancy");
            if (predEl) {
                predEl.innerText = first + " Beds";
            }
        }

        // 🔹 D. Department Cards
        const deptList = document.getElementById("deptResultsList");
        if (deptList && data.dept_predictions) {
            deptList.innerHTML = "";
            Object.keys(data.dept_predictions).forEach(dept => {
                const stats = data.dept_predictions[dept];
                // Convert "85.5%" string to a decimal (0.855) for logic
                const occupancyRate = parseFloat(stats.occupancy_pct) / 100;
                let color = occupancyRate >= 0.75 ? "#E74C3C" : (occupancyRate >= 0.50 ? "#F39C12" : "#2ECC71");

                deptList.innerHTML += `
                    <div style="background:#fff; border:2px solid ${color}; padding:15px; border-radius:8px; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                        <h4 style="color:#1F3A5F; margin-bottom:10px;">${dept}</h4>
                        <div style="font-size:1.2em; font-weight:bold;">${Math.round(stats.beds)} / ${stats.capacity} Beds</div>
                        <div style="margin-top:5px; font-weight:bold; color:${color};">Risk: ${stats.risk}</div>
                        <div style="font-size:0.8em; color:#888; margin-top:5px;">Share: ${stats.share_percent}</div>
                    </div>`;
            });
        }

        // 🔹 E. HEATMAP TABLE
        const deptTimeline = document.getElementById("deptTimeline");
        if (deptTimeline && data.forecast && data.dept_predictions) {
            let html = `
                <strong>Next Week Bed Occupancy Heatmap</strong>
                <div style="overflow-x:auto; margin-top:10px;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.85em;">
                        <thead>
                            <tr style="background:#1F3A5F; color:white;">
                                <th style="padding:10px; text-align:left;">Date</th>`;

            Object.keys(data.dept_predictions).forEach(dept => {
                html += `<th style="padding:10px; text-align:right;">${dept}</th>`;
            });

            html += `<th style="padding:10px; text-align:right;">TOTAL</th></tr></thead><tbody>`;

            data.forecast.forEach(day => {
                const total = Math.round(day.total_occupancy);
                html += `<tr><td style="padding:10px; font-weight:bold; border-bottom:1px solid #eee;">${day.date}</td>`;

                Object.keys(data.dept_predictions).forEach(deptName => {
                    const deptData = day.departments[deptName];
                    const val = Math.round(parseFloat(deptData.beds)); 
                    const risk = deptData.risk;

                    // Heatmap Color Logic
                    let bg = "#2ECC71"; let txt = "#fff";
                    if (risk === "HIGH" || risk === "CRITICAL") { bg = "#E74C3C"; }
                    else if (risk === "MEDIUM") { bg = "#F1C40F"; txt = "#000"; }

                    html += `
                        <td style="padding:10px; text-align:right; font-weight:bold; background:${bg}; color:${txt}; border-bottom:1px solid #fff;">
                            ${val}
                        </td>`;
                });

                html += `<td style="padding:10px; text-align:right; font-weight:bold; background:#ECF0F1;">${total}</td></tr>`;
            });

            html += `</tbody></table></div>
                <div style="margin-top:10px; font-size:0.8em; display:flex; gap:10px;">
                    <span style="background:#2ECC71; color:#fff; padding:2px 6px; border-radius:3px;">LOW</span>
                    <span style="background:#F1C40F; padding:2px 6px; border-radius:3px;">MEDIUM</span>
                    <span style="background:#E74C3C; color:#fff; padding:2px 6px; border-radius:3px;">HIGH</span>
                </div>`;
            deptTimeline.innerHTML = html;
        }
    }) 
    .catch(err => {
        console.error("Error loading forecast data:", err);
        const occupancyBox = document.getElementById("occupancyResults");
        if (occupancyBox) occupancyBox.innerHTML = "<p style='color:red;'>Forecasting data is currently being updated. Please check back in a few minutes.</p>";
    }); 

// --- 3. SCROLL FUNCTIONS ---
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToPredictions() {
    const element = document.getElementById("prediction-section");
    if (element) {
        window.scrollTo({ top: element.offsetTop - 20, behavior: 'smooth' });
    }
}
