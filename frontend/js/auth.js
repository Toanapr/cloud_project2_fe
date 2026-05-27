// ================= HÀM HỖ TRỢ HIỂN THỊ LỖI & KIỂM TRA EMAIL =================
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.innerText = message;
    errorDiv.style.display = 'block';
}

function hideError(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

// Hàm kiểm tra định dạng Email chuẩn chung
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ================= LOGIC CHUYỂN ĐỔI FORM (UI) =================
const signInContainer = document.getElementById('signInContainer');
const signUpContainer = document.getElementById('signUpContainer');

document.getElementById('showSignUp').addEventListener('click', function(e) {
    e.preventDefault();
    hideError('signInError'); 
    document.getElementById('authForm').reset();
    signInContainer.style.display = 'none';
    signUpContainer.style.display = 'block';
});

document.getElementById('showSignIn').addEventListener('click', function(e) {
    e.preventDefault();
    hideError('signUpError');
    document.getElementById('signUpForm').reset();
    signUpContainer.style.display = 'none';
    signInContainer.style.display = 'block';
});

// ================= LOGIC ĐĂNG KÝ (VALIDATION + API) =================
document.getElementById('signUpForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError('signUpError'); 
    
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const confirm = document.getElementById('reg-confirm').value.trim();

    // 1. Kiểm tra bỏ trống
    if (!email || !password || !confirm) {
        showError('signUpError', "Please enter complete information!");
        return;
    }
    // 2. Kiểm tra ĐÚNG định dạng Email 
    if (!isValidEmail(email)) {
        showError('signUpError', "Invalid email format!");
        return;
    }
    // 3. Kiểm tra độ dài mật khẩu
    if (password.length < 8) {
        showError('signUpError', "Password must be at least 8 characters long!");
        return;
    }
    // 4. Kiểm tra khớp mật khẩu
    if (password !== confirm) {
        showError('signUpError', "Confirm password does not match!");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("🎉 Registration successful! Please proceed to login.");
            document.getElementById('showSignIn').click(); 
        } else {
            showError('signUpError', "Server Error: " + data.error);
        }
    } catch (error) {
        showError('signUpError', "Unable to connect to the server. Please check the Backend.");
    }
});

// ================= LOGIC ĐĂNG NHẬP (VALIDATION + MOCK) =================
document.getElementById('authForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    hideError('signInError'); 

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // 1. Kiểm tra bỏ trống
    if (!email || !password) {
        showError('signInError', "Please enter both Email and Password!");
        return;
    }
    // 2. Kiểm tra ĐÚNG định dạng Email
    if (!isValidEmail(email)) {
        showError('signInError', "Invalid email format!");
        return;
    }
    // 3. Kiểm tra độ dài mật khẩu
    if (password.length < 8) {
        showError('signInError', "Password must be at least 8 characters long!");
        return;
    }

    localStorage.setItem('userToken', 'local-token'); 
    window.location.href = "index.html";
});

function logout() {
    localStorage.removeItem('userToken');
    window.location.href = "login.html";
}

// // ================= LOGIC CHUYỂN ĐỔI FORM (UI) =================
// const signInContainer = document.getElementById('signInContainer');
// const signUpContainer = document.getElementById('signUpContainer');

// document.getElementById('showSignUp').addEventListener('click', function(e) {
//     e.preventDefault();
//     // Hiệu ứng mờ dần Form Đăng nhập và hiện Form Đăng ký
//     signInContainer.style.display = 'none';
//     signUpContainer.style.display = 'block';
// });

// document.getElementById('showSignIn').addEventListener('click', function(e) {
//     e.preventDefault();
//     signUpContainer.style.display = 'none';
//     signInContainer.style.display = 'block';
// });

// // ================= LOGIC ĐĂNG KÝ (Gọi API Backend) =================
// document.getElementById('signUpForm')?.addEventListener('submit', async function(e) {
//     e.preventDefault();
    
//     const email = document.getElementById('reg-email').value;
//     const password = document.getElementById('reg-password').value;
//     const confirm = document.getElementById('reg-confirm').value;

//     if (password !== confirm) {
//         alert("Mật khẩu xác nhận không khớp!");
//         return;
//     }

//     try {
//         const response = await fetch('http://localhost:3000/signup', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ email: email, password: password })
//         });

//         const data = await response.json();

//         if (response.ok) {
//             alert("Đăng ký thành công! Hãy tiến hành đăng nhập.");
//             document.getElementById('showSignIn').click();
//         } else {
//             alert("Lỗi: " + data.error);
//         }
//     } catch (error) {
//         alert("Không thể kết nối đến server Backend.");
//     }
// });

// // ================= LOGIC ĐĂNG NHẬP GIẢ LẬP =================
// document.getElementById('authForm')?.addEventListener('submit', function(e) {
//     e.preventDefault();
//     localStorage.setItem('userToken', 'local-token'); 
//     window.location.href = "index.html";
// });

// function logout() {
//     localStorage.removeItem('userToken');
//     window.location.href = "login.html";
// }



// document.getElementById('authForm')?.addEventListener('submit', function(e) {
//     e.preventDefault(); // Prevent the page from reloading.
    
//     // MOCK DATA: This simulates a Cognito token for local development.
//     const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5c..."; 
//     localStorage.setItem('userToken', fakeToken);
    
//     // Redirect to the workspace.
//     window.location.href = "index.html";
// });

// function logout() {
//     localStorage.removeItem('userToken');
//     window.location.href = "login.html";
// }


