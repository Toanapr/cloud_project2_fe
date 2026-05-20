const API_BASE_URL = "http://localhost:3000";
const LOCAL_USER_ID = "user-1";

let tasks = [];
let visibleTasks = [];
let currentEditTaskId = null;

const PRIORITY_LABELS = {
    high: "High",
    medium: "Medium",
    low: "Low"
};

const STATUS_LABELS = {
    pending: "Pending",
    done: "Done"
};

document.addEventListener("DOMContentLoaded", async () => {
    if (!localStorage.getItem("userToken")) {
        window.location.href = "login.html";
        return;
    }

    bindFilters();
    await loadTasks();
});

function authHeaders(extraHeaders = {}) {
    return {
        "Authorization": `Bearer ${localStorage.getItem("userToken")}`,
        "X-User-Id": LOCAL_USER_ID,
        ...extraHeaders
    };
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: authHeaders(options.headers || {})
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || "API request failed.");
    }

    return data;
}

async function loadTasks() {
    try {
        const data = await apiRequest(`/tasks?userId=${encodeURIComponent(LOCAL_USER_ID)}`);
        tasks = data.tasks || [];
        applyFilters();
    } catch (error) {
        showError(error.message);
    }
}

function bindFilters() {
    ["filterPriority", "filterStatus", "filterDueDate", "searchTask"].forEach((id) => {
        document.getElementById(id)?.addEventListener("input", applyFilters);
    });
}

function applyFilters() {
    const priority = document.getElementById("filterPriority")?.value || "all";
    const status = document.getElementById("filterStatus")?.value || "all";
    const dueDate = document.getElementById("filterDueDate")?.value || "";
    const searchTerm = (document.getElementById("searchTask")?.value || "").trim().toLowerCase();

    visibleTasks = tasks.filter((task) => {
        const matchesPriority = priority === "all" || task.priority === priority;
        const matchesStatus = status === "all" || task.status === status;
        const matchesDueDate = !dueDate || task.dueDate === dueDate;
        const matchesSearch = !searchTerm ||
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description || "").toLowerCase().includes(searchTerm);

        return matchesPriority && matchesStatus && matchesDueDate && matchesSearch;
    });

    renderTasks(visibleTasks);
    updateStats();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderTasks(taskList) {
    const container = document.getElementById("taskList");
    container.innerHTML = "";

    if (taskList.length === 0) {
        container.innerHTML = '<div class="task-empty"><h4>No tasks found</h4><p>Create a task or adjust your filters.</p></div>';
        return;
    }

    taskList.forEach((task) => {
        const doneClass = task.status === "done" ? "task-completed" : "";
        const priorityLabel = PRIORITY_LABELS[task.priority] || task.priority;
        const statusLabel = STATUS_LABELS[task.status] || task.status;
        const taskHTML = `
            <div class="task-item ${doneClass}">
                <div class="task-info">
                    <h4>${escapeHtml(task.title)}</h4>
                    <p>${escapeHtml(task.description)}</p>
                </div>
                <div class="task-cell" data-label="Priority"><span class="badge ${escapeHtml(task.priority)}">${escapeHtml(priorityLabel)}</span></div>
                <div class="task-cell" data-label="Due Date">${escapeHtml(task.dueDate)}</div>
                <div class="task-cell" data-label="Status"><span class="badge ${escapeHtml(task.status)}">${escapeHtml(statusLabel)}</span></div>
                <div class="task-actions dropdown-container">
                    <button class="btn-dots" aria-label="Open task actions" onclick="toggleDropdown('${escapeHtml(task.taskId)}', event)">...</button>
                    <div id="dropdown-${escapeHtml(task.taskId)}" class="dropdown-menu">
                        <button onclick="editTask('${escapeHtml(task.taskId)}')">Edit</button>
                        <button class="delete-btn" onclick="deleteTask('${escapeHtml(task.taskId)}')">Delete</button>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML("beforeend", taskHTML);
    });
}

function updateStats() {
    document.getElementById("totalTasks").innerText = tasks.length;
    document.getElementById("pendingTasks").innerText = tasks.filter((task) => task.status === "pending").length;
    document.getElementById("doneTasks").innerText = tasks.filter((task) => task.status === "done").length;
}

function showError(message) {
    alert(message);
}

function logout() {
    localStorage.removeItem("userToken");
    window.location.href = "login.html";
}

function openModal() {
    currentEditTaskId = null;
    document.getElementById("modalTitle").innerText = "Add New Task";
    document.getElementById("taskForm").reset();
    document.getElementById("taskModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("taskModal").style.display = "none";
}

document.getElementById("taskForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const payload = {
        title: document.getElementById("taskTitle").value,
        description: document.getElementById("taskDesc").value,
        priority: document.getElementById("taskPriority").value,
        status: document.getElementById("taskStatus").value,
        dueDate: document.getElementById("taskDueDate").value
    };

    try {
        if (currentEditTaskId) {
            const data = await apiRequest(`/tasks/${encodeURIComponent(currentEditTaskId)}?userId=${encodeURIComponent(LOCAL_USER_ID)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            tasks = tasks.map((task) => task.taskId === currentEditTaskId ? data.task : task);
        } else {
            const data = await apiRequest(`/tasks?userId=${encodeURIComponent(LOCAL_USER_ID)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            tasks.unshift(data.task);
        }

        applyFilters();
        closeModal();
    } catch (error) {
        showError(error.message);
    }
});

function toggleDropdown(taskId, event) {
    event.stopPropagation();

    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        if (menu.id !== `dropdown-${taskId}`) {
            menu.classList.remove("show");
        }
    });

    document.getElementById(`dropdown-${taskId}`)?.classList.toggle("show");
}

window.onclick = function(event) {
    if (!event.target.matches(".btn-dots")) {
        document.querySelectorAll(".dropdown-menu").forEach((menu) => {
            menu.classList.remove("show");
        });
    }
};

async function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        await apiRequest(`/tasks/${encodeURIComponent(taskId)}?userId=${encodeURIComponent(LOCAL_USER_ID)}`, {
            method: "DELETE"
        });

        tasks = tasks.filter((task) => task.taskId !== taskId);
        applyFilters();
    } catch (error) {
        showError(error.message);
    }
}

function editTask(taskId) {
    const taskToEdit = tasks.find((task) => task.taskId === taskId);
    if (!taskToEdit) {
        return;
    }

    currentEditTaskId = taskId;
    document.getElementById("taskTitle").value = taskToEdit.title;
    document.getElementById("taskDesc").value = taskToEdit.description || "";
    document.getElementById("taskPriority").value = taskToEdit.priority;
    document.getElementById("taskStatus").value = taskToEdit.status;
    document.getElementById("taskDueDate").value = taskToEdit.dueDate;
    document.getElementById("modalTitle").innerText = "Edit Task";
    document.getElementById("taskModal").style.display = "flex";
}
