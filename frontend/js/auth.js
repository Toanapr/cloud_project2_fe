// ================= COGNITO CONFIGURATION =================
const COGNITO_REGION = "us-east-1";
const COGNITO_CLIENT_ID = "4d09kp0ug5r43e56lp671rcd8v";
const COGNITO_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

// ================= HELPER FUNCTIONS =================
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.innerText = message;
    errorDiv.style.display = 'block';
}

function hideError(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

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

// ================= SIGN UP FORM (FETCH API) =================
document.getElementById('signUpForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError('signUpError'); 
    
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const confirm = document.getElementById('reg-confirm').value.trim();

    if (!email || !password || !confirm) {
        showError('signUpError', "Please enter complete information!");
        return;
    }
    if (!isValidEmail(email)) {
        showError('signUpError', "Invalid email format!");
        return;
    }
    if (password.length < 8) {
        showError('signUpError', "Password must be at least 8 characters long!");
        return;
    }
    if (password !== confirm) {
        showError('signUpError', "Confirm password does not match!");
        return;
    }

    try {
        // Gắn HTTP Request bắn thẳng sang AWS Cognito
        const response = await fetch(COGNITO_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-amz-json-1.1',
                'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp'
            },
            body: JSON.stringify({
                ClientId: COGNITO_CLIENT_ID,
                Username: email,
                Password: password,
                UserAttributes: [
                    { Name: "email", Value: email }
                ]
            })
        });

        const data = await response.json();

        // Bắt lỗi từ Cognito (như trùng email, pass yếu...)
        if (!response.ok) {
            throw new Error(data.message || "Sign up failed.");
        }

        alert("🎉 Registration successful! Please check your email to confirm your account.");
        document.getElementById('showSignIn').click(); 
    } catch (error) {
        showError('signUpError', error.message);
    }
});

// ================= SIGN IN FORM (FETCH API) =================
document.getElementById('authForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError('signInError'); 

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        showError('signInError', "Please enter both Email and Password!");
        return;
    }

    try {
        // Gọi Auth Flow của Cognito
        const response = await fetch(COGNITO_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-amz-json-1.1',
                'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
            },
            body: JSON.stringify({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: COGNITO_CLIENT_ID,
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Sign in failed.");
        }

        if (data.AuthenticationResult) {
            // Lấy ID Token và nhét vào ví
            localStorage.setItem('userToken', data.AuthenticationResult.IdToken);
            window.location.href = "index.html";
        } else {
            throw new Error("Sign in failed. Check if your account is confirmed.");
        }
    } catch (error) {
        showError('signInError', error.message);
    }
});

function logout() {
    localStorage.removeItem('userToken');
    window.location.href = "login.html";
}