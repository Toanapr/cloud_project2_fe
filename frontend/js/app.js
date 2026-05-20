// MOCK DATA
let mockTasks = [
    {
        taskId: "t1-uuid",
        userId: "user-1",
        title: "Hoàn thiện Backend API",
        description: "Viết 4 hàm Lambda (Get, Create, Update, Delete) cho NodeJS.",
        priority: "high",
        dueDate: "2026-05-20",
        status: "pending",
        createdAt: "2026-05-18T08:00:00Z"
    },
    {
        taskId: "t2-uuid",
        userId: "user-1",
        title: "Cấu hình S3 Private",
        description: "Bật Block Public Access và gắn OAC cho CloudFront.",
        priority: "medium",
        dueDate: "2026-05-22",
        status: "done",
        createdAt: "2026-05-17T14:30:00Z"
    }
];

// Hàm khởi tạo khi load trang
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra token (nếu chưa login thì đá về trang login)
    if (!localStorage.getItem('userToken')) {
        window.location.href = "login.html";
        return;
    }
    renderTasks(mockTasks);
    updateStats();
});

// Hàm Render HTML ra giao diện
function renderTasks(tasks) {
    const container = document.getElementById('taskList');
    container.innerHTML = ''; // Xóa sạch HTML cũ

    tasks.forEach(task => {
        // KIỂM TRA TRẠNG THÁI: Nếu done thì thêm class 'task-completed', nếu không thì để trống
        const doneClass = (task.status === 'done') ? 'task-completed' : '';

        // Tạo chuỗi HTML cho từng Card công việc, chèn thêm class nếu đã hoàn thành
        const taskHTML = `
            <div class="task-item ${doneClass}">
                <div class="task-info">
                    <h4>${task.title}</h4>
                    <p>${task.description}</p>
                </div>
                <div><span class="badge ${task.priority}">${task.priority}</span></div>
                <div>${task.dueDate}</div>
                <div><span class="badge ${task.status}">${task.status}</span></div>
                <div class="task-actions dropdown-container">
                    <button class="btn-dots" onclick="toggleDropdown('${task.taskId}', event)">...</button>
                    <div id="dropdown-${task.taskId}" class="dropdown-menu">
                        <button onclick="editTask('${task.taskId}')">Chỉnh sửa</button>
                        <button class="delete-btn" onclick="deleteTask('${task.taskId}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
        // Gắn vào giao diện
        container.insertAdjacentHTML('beforeend', taskHTML);
    });
}

// Cập nhật con số trên Dashboard
function updateStats() {
    document.getElementById('totalTasks').innerText = mockTasks.length;
    document.getElementById('pendingTasks').innerText = mockTasks.filter(t => t.status === 'pending').length;
    document.getElementById('doneTasks').innerText = mockTasks.filter(t => t.status === 'done').length;
}

// ================= MODAL & FORM LOGIC =================
function openModal() {
    currentEditTaskId = null; // Đặt lại cờ hiệu là null (Chế độ Thêm mới)
    document.getElementById('modalTitle').innerText = 'Thêm công việc mới'; // Trả lại tiêu đề gốc
    document.getElementById('taskForm').reset(); // Xóa sạch dữ liệu trong form
    document.getElementById('taskModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
}

// Bắt sự kiện Submit Form (Tạo mới)
// Bắt sự kiện Submit Form (Dùng chung cho cả Tạo mới và Sửa)
document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (currentEditTaskId) {
        // TRẠNG THÁI 1: ĐANG SỬA (UPDATE)
        const taskIndex = mockTasks.findIndex(t => t.taskId === currentEditTaskId);
        if (taskIndex !== -1) {
            // Cập nhật lại dữ liệu mới từ form vào mảng
            mockTasks[taskIndex].title = document.getElementById('taskTitle').value;
            mockTasks[taskIndex].description = document.getElementById('taskDesc').value;
            mockTasks[taskIndex].priority = document.getElementById('taskPriority').value;
            mockTasks[taskIndex].status = document.getElementById('taskStatus').value;
            mockTasks[taskIndex].dueDate = document.getElementById('taskDueDate').value;
        }
    } else {
        // TRẠNG THÁI 2: THÊM MỚI (CREATE)
        const newTask = {
            taskId: "t-" + Date.now(), // Tạo ID giả
            userId: "user-1",
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDesc').value,
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            dueDate: document.getElementById('taskDueDate').value,
            createdAt: new Date().toISOString()
        };
        // Đẩy công việc mới vào cuối mảng
        mockTasks.push(newTask);
    }

    // Sau khi xử lý xong (dù thêm hay sửa) thì vẽ lại giao diện
    renderTasks(mockTasks);
    updateStats();
    closeModal();
});

// Hàm Bật/Tắt Dropdown
function toggleDropdown(taskId, event) {
    event.stopPropagation(); // Ngăn sự kiện click lan ra ngoài
    
    // Đóng tất cả các menu đang mở khác trước khi mở menu mới
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== `dropdown-${taskId}`) {
            menu.classList.remove('show');
        }
    });

    // Mở menu của task hiện tại
    const dropdown = document.getElementById(`dropdown-${taskId}`);
    dropdown.classList.toggle('show');
}

// Bắt sự kiện click ra ngoài để tự động đóng menu
window.onclick = function(event) {
    if (!event.target.matches('.btn-dots')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            if (menu.classList.contains('show')) {
                menu.classList.remove('show');
            }
        });
    }
}

// Hàm Xóa công việc giả lập
function deleteTask(taskId) {
    // Hỏi xác nhận trước khi xóa
    if(confirm('Are you sure you want to delete this job?')) {
        // Lọc bỏ task có ID tương ứng ra khỏi mảng mockTasks
        mockTasks = mockTasks.filter(t => t.taskId !== taskId);
        
        // Vẽ lại giao diện và cập nhật số liệu
        renderTasks(mockTasks);
        updateStats();
    }
}

// Biến toàn cục để theo dõi xem người dùng đang sửa Task nào.
// Nếu là null, nghĩa là đang ở chế độ "Thêm mới".
let currentEditTaskId = null; 

// Hàm xử lý khi Chỉnh sửa
function editTask(taskId) {
    // 1. Tìm công việc cần sửa trong mockTasks
    const taskToEdit = mockTasks.find(t => t.taskId === taskId);
    if (!taskToEdit) return;

    // 2. Bật cờ hiệu ghi nhớ ID của công việc đang sửa
    currentEditTaskId = taskId;

    // 3. Đổ dữ liệu cũ vào các ô nhập liệu của Form
    document.getElementById('taskTitle').value = taskToEdit.title;
    document.getElementById('taskDesc').value = taskToEdit.description;
    document.getElementById('taskPriority').value = taskToEdit.priority;
    document.getElementById('taskStatus').value = taskToEdit.status;
    document.getElementById('taskDueDate').value = taskToEdit.dueDate;

    // 4. Đổi tiêu đề Popup cho phù hợp và hiển thị nó lên
    document.getElementById('modalTitle').innerText = 'Chỉnh sửa công việc';
    document.getElementById('taskModal').style.display = 'flex';
}