import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    query,
    where,
    serverTimestamp,
    limit
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Core Logic imports removed broken client-auth dependency

// ========================================
// Auth State Listener for Lawyer Dashboard
// ========================================
onAuthStateChanged(auth, (user) => {
    const loginArea = document.getElementById("loginArea");
    const dashboardArea = document.getElementById("dashboardArea");
    const welcomeMsg = document.getElementById("welcomeMsg");
    const welcomeMsgEn = document.getElementById("welcomeMsgEn");

    if (user) {
        if (loginArea) loginArea.style.display = "none";
        if (dashboardArea) dashboardArea.style.display = "block";
        if (welcomeMsg) welcomeMsg.textContent = user.displayName || user.email;
        if (welcomeMsgEn) welcomeMsgEn.textContent = user.displayName || user.email;
        loadLawyerDashboard(user);
    } else {
        if (loginArea) loginArea.style.display = "block";
        if (dashboardArea) dashboardArea.style.display = "none";
    }
});

// Lawyer Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => signOut(auth));
}

// Lawyer Login Form
const lawyerLoginForm = document.getElementById("lawyerLoginForm");
if (lawyerLoginForm) {
    lawyerLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("lawyerUser").value.trim();
        const pass = document.getElementById("lawyerPass").value.trim();
        const errorMsg = document.getElementById("loginError");

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            if (errorMsg) errorMsg.textContent = "";
        } catch (error) {
            console.error(error);
            if (errorMsg) errorMsg.textContent = "بيانات الدخول غير صحيحة";
        }
    });
}
// Lawyer Map for Display
const lawyerMap = {
    "mohammed@aljadei-law.com": "محمد غازي الجدعي",
    "hammam@aljadei-law.com": "حمام حكيم",
    "ashraf@aljadei-law.com": "أشرف توفيق",
    "tamer@aljadei-law.com": "تامر",
    "joseph@aljadei-law.com": "جوزيف بطرس",
    "michel@aljadei-law.com": "ميشيل بطرس",
    "general@aljadei-law.com": "عام"
};

// Load Lawyer Dashboard
// Lawyer Dashboard State
let dashboardCases = [];

// Load Lawyer Dashboard
async function loadLawyerDashboard(user) {
    const tableBody = document.getElementById("dashboardTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = "<tr><td colspan='6'>جاري تحميل البيانات...</td></tr>";

    try {
        let q;
        // Hammam Hakim sees all
        if (user.email === "hammam@aljadei-law.com" || user.email === "admin@aljadei-law.com") {
            q = query(collection(db, "cases"));
        } else {
            q = query(collection(db, "cases"), where("assignedLawyer", "==", user.email));
        }

        const querySnapshot = await getDocs(q);

        dashboardCases = [];
        querySnapshot.forEach((doc) => {
            dashboardCases.push({ id: doc.id, ...doc.data() });
        });

        // Initial Stats
        updateDashboardStats(dashboardCases);

        // Initial Render
        filterAndRenderCases();

        // Setup Event Listeners for Filters
        setupFilterListeners();

    } catch (error) {
        console.error("Error loading cases:", error);
        tableBody.innerHTML = "<tr><td colspan='6' style='color: #ef4444;'>حدث خطأ أثناء تحميل البيانات</td></tr>";
    }
}

function updateDashboardStats(cases) {
    const totalEl = document.getElementById("totalCases");
    const activeEl = document.getElementById("activeCases");

    if (totalEl) totalEl.textContent = cases.length;
    if (activeEl) activeEl.textContent = cases.filter(c => c.currentStatus !== 'مكتمل').length;
}

function setupFilterListeners() {
    const searchInput = document.getElementById('filterSearch');
    const statusSelect = document.getElementById('filterStatus');
    const typeSelect = document.getElementById('filterCaseType');

    const handleFilter = () => filterAndRenderCases();

    if (searchInput) searchInput.addEventListener('input', handleFilter);
    if (statusSelect) statusSelect.addEventListener('change', handleFilter);
    if (typeSelect) typeSelect.addEventListener('change', handleFilter);
}

function filterAndRenderCases() {
    const searchInput = document.getElementById('filterSearch');
    const statusSelect = document.getElementById('filterStatus');
    const typeSelect = document.getElementById('filterCaseType');
    const tableBody = document.getElementById("dashboardTableBody");

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusFilter = statusSelect ? statusSelect.value : '';
    const typeFilter = typeSelect ? typeSelect.value : '';

    const filtered = dashboardCases.filter(c => {
        // Search Filter
        const matchesSearch = !searchTerm ||
            (c.caseNumber && c.caseNumber.toLowerCase().includes(searchTerm)) ||
            (c.clientName && c.clientName.toLowerCase().includes(searchTerm)) ||
            (c.clientNationalId && c.clientNationalId.includes(searchTerm));

        // Status Filter
        const matchesStatus = !statusFilter || c.currentStatus === statusFilter;

        // Type Filter
        const matchesType = !typeFilter || c.caseType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    // Render
    tableBody.innerHTML = "";

    if (filtered.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='6' style='text-align: center; padding: 2rem; color: var(--slate-400);'>لا توجد قضايا تطابق بحثك</td></tr>";
        return;
    }

    filtered.forEach(c => {
        const tr = document.createElement("tr");
        const lastUpdate = c.lastUpdate?.toDate ? c.lastUpdate.toDate().toLocaleDateString('ar-EG') : '---';
        const assignedLawyerName = lawyerMap[c.assignedLawyer] || c.assignedLawyer || '---';

        tr.innerHTML = `
            <td style="padding: 1rem;">${c.caseNumber}</td>
            <td style="padding: 1rem;">${c.clientName}</td>
            <td style="padding: 1rem; color: var(--gold-400);">${assignedLawyerName}</td>
            <td style="padding: 1rem;">${c.clientNationalId || '---'}</td>
            <td style="padding: 1rem;"><span class="status-badge" style="background: var(--gold-600); color: white; padding: 0.2rem 0.6rem; border-radius: 4px;">${c.currentStatus}</span></td>
            <td style="padding: 1rem;">${lastUpdate}</td>
            <td style="padding: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                <button class="action-btn" onclick="openEditPortal('${c.id}', 'general')" style="background: var(--gold-500); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; flex: 1; white-space: nowrap;">بيانات القضية</button>
                <button class="action-btn" onclick="openEditPortal('${c.id}', 'internal')" style="background: rgba(255, 255, 255, 0.1); color: var(--gold-400); border: 1px solid var(--gold-500); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; flex: 0; white-space: nowrap;" title="ملاحظات داخلية">🔒</button>

            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Global Edit Portal Logic
window.openEditPortal = async function (docId, tabName = 'general') {
    const caseRef = doc(db, "cases", docId);
    const snap = await getDoc(caseRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const modal = document.getElementById('lawyerUpdateModal');

    // Fill the modal fields
    document.getElementById('editDocId').value = docId;
    document.getElementById('editStatus').value = data.currentStatus || 'قيد المراجعة';
    document.getElementById('editOpponent').value = data.opponent || '';
    document.getElementById('editAutoId').value = data.autoCaseNumber || '';
    document.getElementById('editLawsuitNum').value = data.lawsuitNumber || '';
    document.getElementById('editLawsuitType').value = data.lawsuitType || '';
    document.getElementById('editHearingDate').value = data.hearingDate || '';
    document.getElementById('editNotes').value = data.notes || '';

    // Populate New Fields for Edit
    if (document.getElementById('editClientPhone')) {
        document.getElementById('editClientPhone').value = data.clientPhone || '';
    }
    if (document.getElementById('editCaseType')) {
        document.getElementById('editCaseType').value = data.caseType || '';
    }

    // New Fields
    if (document.getElementById('editInternalNotes')) {
        document.getElementById('editInternalNotes').value = data.internalNotes || '';
    }


    // Show the modal
    modal.style.display = 'flex';

    // Switch to requested tab
    if (typeof switchModalTab === 'function') {
        switchModalTab(tabName);
    }
};

// Handle Lawyer Update Form Submission
const lawyerUpdateForm = document.getElementById('lawyerUpdateForm');
if (lawyerUpdateForm) {
    lawyerUpdateForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const docId = document.getElementById('editDocId').value;
        const submitBtn = lawyerUpdateForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = "جاري الحفظ...";

        try {
            const caseRef = doc(db, "cases", docId);

            const updateData = {
                currentStatus: document.getElementById('editStatus').value,
                opponent: document.getElementById('editOpponent').value,
                autoCaseNumber: document.getElementById('editAutoId').value,
                lawsuitNumber: document.getElementById('editLawsuitNum').value,
                lawsuitType: document.getElementById('editLawsuitType').value,
                hearingDate: document.getElementById('editHearingDate').value,
                notes: document.getElementById('editNotes').value,
                lastUpdate: serverTimestamp()
            };

            if (document.getElementById('editClientPhone')) {
                updateData.clientPhone = document.getElementById('editClientPhone').value;
            }
            if (document.getElementById('editCaseType')) {
                updateData.caseType = document.getElementById('editCaseType').value;
            }

            // Add secure fields if they exist in DOM
            if (document.getElementById('editInternalNotes')) {
                updateData.internalNotes = document.getElementById('editInternalNotes').value;
            }


            await updateDoc(caseRef, updateData);

            alert("تم تحديث كافة بيانات القضية بنجاح");
            document.getElementById('lawyerUpdateModal').style.display = 'none';
            loadLawyerDashboard(auth.currentUser);
        } catch (error) {
            console.error(error);
            alert("فشل التحديث: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "حفظ التعديلات";
        }
    });
}

// ========================================
// Client Form Submission
// ========================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = "جاري الإرسال...";

        const caseData = {
            caseNumber: `LO-2026-${Math.floor(10000 + Math.random() * 90000)}`,
            clientName: document.getElementById('name').value,
            clientPhone: document.getElementById('phone').value,
            clientNationalId: document.getElementById('nationalId').value,
            clientEmail: document.getElementById('email').value,
            assignedLawyer: document.getElementById('assignedLawyer').value || "general@aljadei-law.com",
            serviceType: document.getElementById('serviceType').value,
            caseType: document.getElementById('caseType') ? document.getElementById('caseType').value : '',
            notes: document.getElementById('caseDetails').value,
            currentStatus: "قيد المراجعة",
            createdAt: serverTimestamp(),
            lastUpdate: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "cases"), caseData);

            // Show Success Modal with prominent Case Number
            const modalCaseNum = document.getElementById('modalCaseNumberDisplay');
            const successModal = document.getElementById('successModal');

            console.log("Submission successful. Case ID:", caseData.caseNumber);

            if (modalCaseNum) modalCaseNum.textContent = caseData.caseNumber;
            if (successModal) {
                successModal.style.display = 'flex';
                successModal.style.opacity = '1';
                successModal.style.visibility = 'visible';
            }

            contactForm.reset();
        } catch (error) {
            alert("حدث خطأ أثناء إرسال الطلب: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });
}

// ========================================
// Case Tracking Search
// = ========================================
const caseSearchForm = document.getElementById('caseSearchForm');
const caseResults = document.getElementById('caseResults');
const noResults = document.getElementById('noResults');

if (caseSearchForm) {
    caseSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const caseNum = document.getElementById('caseNumber').value.trim();
        const nationalId = document.getElementById('trackNationalId').value.trim();

        const submitBtn = caseSearchForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const q = query(
                collection(db, "cases"),
                where("caseNumber", "==", caseNum),
                where("clientNationalId", "==", nationalId),
                limit(1)
            );

            const snap = await getDocs(q);

            if (!snap.empty) {
                const data = snap.docs[0].data();

                // Populate Result Grid
                document.getElementById('resSystemCaseNumber').textContent = data.caseNumber || '---';
                document.getElementById('resClientName').textContent = data.clientName || '---';
                document.getElementById('resNationalId').textContent = data.clientNationalId || '---';
                document.getElementById('resOpponent').textContent = data.opponent || '---';
                document.getElementById('resAutoId').textContent = data.autoCaseNumber || '---';
                document.getElementById('resLawsuitNum').textContent = data.lawsuitNumber || '---';
                document.getElementById('resLawsuitType').textContent = data.lawsuitType || '---';
                document.getElementById('resHearingDate').textContent = data.hearingDate || '---';
                document.getElementById('resNotes').textContent = data.notes || '---';

                caseResults.style.display = 'block';
                noResults.style.display = 'none';

                // Scroll to result
                caseResults.scrollIntoView({ behavior: 'smooth' });
            } else {
                caseResults.style.display = 'none';
                noResults.style.display = 'block';
            }
        } catch (error) {
            console.error(error);
            alert("حدث خطأ أثناء البحث");
        } finally {
            submitBtn.disabled = false;
        }
    });
}
