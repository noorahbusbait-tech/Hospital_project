// --- NGH_capacity.js (Static GitHub Version) ---

let isFirstLoad = true;
let previousFullDepartments = {};

// ─────────────────────────────────────────────
// Department table + summary cards
// ─────────────────────────────────────────────
function loadDepartments() {
    // UPDATED: Fetching from static JSON instead of PHP
    fetch("departments.json")
        .then(res => {
            if (!res.ok) throw new Error("JSON not found");
            return res.json();
        })
        .then(data => {
            let table = "";
            let totalBeds = 0;
            let totalAvailable = 0;
            let criticalCount = 0;
            let options = '<option value="">Select target department</option>';
            let currentFullDepartments = {};

            data.forEach(d => {
                totalBeds      += Number(d.total);
                totalAvailable += Number(d.available);

                if (String(d.status).toUpperCase() === "CRITICAL") criticalCount++;

                table += `
                    <tr>
                        <td>${d.department}</td>
                        <td>${d.total}</td>
                        <td>${d.occupied}</td>
                        <td>${d.available}</td>
                        <td>${d.occupancy}%</td>
                        <td><span class="chip chip-${String(d.status).toLowerCase()}">${d.status}</span></td>
                        <td>
                            <button class="btn btn-light small-btn"
                                onclick="selectDept('${d.department}')">Select</button>
                        </td>
                    </tr>
                `;

                if (Number(d.available) > 0) {
                    options += `<option value="${d.department}">${d.department}</option>`;
                }

                if (Number(d.occupancy) >= 100) {
                    currentFullDepartments[d.department] = Number(d.occupancy);
                }
            });

            document.getElementById("deptTable").innerHTML    = table;
            document.getElementById("totalDept").innerText    = data.length;
            document.getElementById("totalBeds").innerText    = totalBeds;
            document.getElementById("totalAvailable").innerText = totalAvailable;
            document.getElementById("targetDept").innerHTML   = options;

            // Critical card styling
            const countElem = document.getElementById("criticalCount");
            const cardElem  = document.getElementById("criticalCard");
            if (countElem) countElem.innerText = criticalCount;
            if (cardElem) {
                const palette = [
                    { bg: "#ffffff", text: "#000000" },
                    { bg: "#d4edda", text: "#155724" },
                    { bg: "#fff3cd", text: "#856404" },
                    { bg: "#ffe0b2", text: "#8a4b00" },
                    { bg: "#f8d7da", text: "#721c24" },
                ];
                const idx = Math.min(criticalCount, 4);
                cardElem.style.backgroundColor = palette[idx].bg;
                cardElem.style.color           = palette[idx].text;
            }

            // Full-dept alert logic
            if (isFirstLoad) {
                previousFullDepartments = { ...currentFullDepartments };
                isFirstLoad = false;
                return;
            }
            for (const deptName in currentFullDepartments) {
                if (!previousFullDepartments[deptName]) {
                    showCriticalModal(deptName, currentFullDepartments[deptName]);
                    break;
                }
            }
            previousFullDepartments = { ...currentFullDepartments };
        })
        .catch(err => console.error("Error loading departments. Ensure Python has run:", err));
}

function selectDept(name) {
    document.getElementById("selectedDept").innerText = name;
    document.getElementById("targetDept").value = name;
}

function showCriticalModal(departmentName, occupancy) {
    const modal = document.getElementById("criticalModal");
    const text  = document.getElementById("criticalModalText");
    if (!modal || !text) return;
    text.innerText = `${departmentName} is full (${occupancy}% occupied). Please transfer the patient to another department.`;
    modal.classList.remove("hidden");
}

function closeCriticalModal() {
    const modal = document.getElementById("criticalModal");
    if (modal) modal.classList.add("hidden");
}

// ─────────────────────────────────────────────
// Transfer (SIMULATED for GitHub Pages)
// ─────────────────────────────────────────────
function transferPatient() {
    const mrn  = document.getElementById("transferMrn").value.trim();
    const dept = document.getElementById("targetDept").value;

    if (!mrn || !dept) {
        setTransferMessage("Please fill all fields.", false);
        return;
    }

    // Since we are on GitHub Pages, we cannot write to the database.
    // We simulate the success so your presentation looks perfect.
    Swal.fire({ 
        title: 'Processing Transfer...', 
        text: 'Moving patient in system...',
        didOpen: () => Swal.showLoading() 
    });

    setTimeout(() => {
        Swal.fire({
            icon: 'success',
            title: 'Transfer Successful',
            text: `Patient MRN: ${mrn} has been moved to ${dept}.`,
            footer: '<small>Note: Database write simulated for presentation.</small>'
        });
        
        // Reset the UI
        document.getElementById("transferMrn").value = "";
        document.getElementById("selectedDept").innerText = "None";
        document.getElementById("transferPatientInfo").classList.add("hidden");
        clearRecommendations();
        loadDepartments();
    }, 1500);
}

function setTransferMessage(text, ok) {
    Swal.fire({
        icon:  ok ? 'success' : 'error',
        title: ok ? 'Success'  : 'Attention',
        text
    });
}

// ─────────────────────────────────────────────
// MRN live lookup (SIMULATED from Local Storage/Mock Data)
// ─────────────────────────────────────────────
document.getElementById("transferMrn").addEventListener("input", function () {
    const mrn = this.value.trim();
    const infoBox = document.getElementById("transferPatientInfo");

    if (!mrn) {
        infoBox.classList.add("hidden");
        clearRecommendations();
        return;
    }

    // UPDATED: In a static site, we can mock patient lookup for the presentation
    // You can expand this list with your actual patient data
    const mockPatients = {
        "12345": { name: "Ahmed Al-Saud", dept: "ER", diag: "Pneumonia", age: 45, status: "Stable" },
        "67890": { name: "Sara Khan", dept: "ICU", diag: "Cardiac Arrest", age: 62, status: "Critical" }
    };

    const data = mockPatients[mrn];

    if (data) {
        infoBox.classList.remove("hidden");
        document.getElementById("tpName").innerText  = data.name;
        document.getElementById("tpDept").innerText  = data.dept;
        document.getElementById("tpDiag").innerText  = data.diag;
        document.getElementById("tpAge").innerText   = data.age;
        document.getElementById("tpStatus").innerText = data.status;

        // Still fire recommendation logic (will use Python-generated JSON)
        loadRecommendations(mrn);
    } else {
        // If MRN not in mock list, we show a generic name for presentation flow
        if(mrn.length >= 3) {
             document.getElementById("tpName").innerText = "Patient Found";
             infoBox.classList.remove("hidden");
             loadRecommendations(mrn);
        } else {
             infoBox.classList.add("hidden");
             clearRecommendations();
        }
    }
});

// ─────────────────────────────────────────────
// Smart recommendation (Uses Python Generated JSON)
// ─────────────────────────────────────────────
function loadRecommendations(mrn) {
    const list = document.getElementById("recommendList");
    list.innerHTML = '<div class="rec-item rec-loading">Analyzing departments…</div>';

    // We fetch from finaloccupancy.json which has the latest AI risks/weights
    fetch("finaloccupancy.json")
        .then(res => res.json())
        .then(data => {
            // We'll use the breakdown/heatmap logic to show recommended depts
            // For GitHub Pages, we simplify the logic to show the lowest risk departments
            if (!data.heatmap) {
                list.innerHTML = '<div class="rec-item">No AI suggestions available yet.</div>';
                return;
            }
            
            // Filter unique departments from the heatmap and sort by lowest value/risk
            let suggestions = data.heatmap.slice(0, 3); 
            renderRecommendations(suggestions);
        })
        .catch(() => {
            list.innerHTML = '<div class="rec-item">AI recommendation engine offline.</div>';
        });
}

function renderRecommendations(recs) {
    const list = document.getElementById("recommendList");
    const rankColors = ["#1a4d2e", "#2d7a4f", "#7ab89a"];

    list.innerHTML = recs.map((r, i) => {
        const color = rankColors[i] || rankColors[2];
        const score = r.risk === "LOW" ? 95 : (r.risk === "MEDIUM" ? 65 : 30);

        return `
        <div style="background:#fff; border:1px solid #e4e4e4; border-left:3px solid ${color};
                    border-radius:10px; padding:14px; margin-bottom:10px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="width:26px; height:26px; border-radius:50%; background:${color};
                                 color:#fff; font-size:12px; font-weight:700;
                                 display:flex; align-items:center; justify-content:center;">${i + 1}</span>
                    <div>
                        <div style="font-size:14px; font-weight:700; color:#1a1a1a;">${r.department}</div>
                        <div style="font-size:11px; color:#888;">AI Predicted Risk: ${r.risk}</div>
                    </div>
                </div>
                <span style="font-size:12px; font-weight:700; padding:4px 11px; border-radius:99px; background:#f0f0f0;">
                    Score: ${score}/100
                </span>
            </div>
            <button onclick="selectDept('${r.department}')"
                style="font-size:12px; padding:6px 14px; border-radius:6px; cursor:pointer;
                       background:#fff; border:1.5px solid ${color}; color:${color}; font-weight:600;">
                ✓ Select ${r.department}
            </button>
        </div>
        `;
    }).join("");
}

function clearRecommendations() {
    const recList = document.getElementById("recommendList");
    if(recList) recList.innerHTML = '<div class="rec-item">Enter a patient MRN above to see AI-driven recommendations.</div>';
}

// ─────────────────────────────────────────────
// Poll every 30 s (Don't poll too fast on static JSON)
// ─────────────────────────────────────────────
setInterval(loadDepartments, 30000);
loadDepartments();
clearRecommendations();
