const COGNITO_USER_POOL_ID = "us-east-1_zuo5aJas6";
const COGNITO_CLIENT_ID = "4d09kp0ug5r43e56lp671rcd8v";

// ================= COGNITO CONFIGURATION =================
Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: COGNITO_USER_POOL_ID,
            userPoolClientId: COGNITO_CLIENT_ID,
            region: "us-east-1"
        }
    }
});

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

// ================= SIGN UP FORM (COGNITO) =================
document.getElementById('signUpForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError('signUpError'); 
    
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const confirm = document.getElementById('reg-confirm').value.trim();

    // Validation
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
        const { userId, nextStep } = await Amplify.Auth.signUp({
            username: email,
            password: password,
            options: {
                userAttributes: {
                    email: email
                }
            }
        });

        alert("🎉 Registration successful! Please check your email to confirm your account.");
        document.getElementById('showSignIn').click(); 
    } catch (error) {
        showError('signUpError', error.message || "Sign up failed. Please try again.");
    }
});

// ================= SIGN IN FORM (COGNITO) =================
document.getElementById('authForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError('signInError'); 

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validation
    if (!email || !password) {
        showError('signInError', "Please enter both Email and Password!");
        return;
    }
    if (!isValidEmail(email)) {
        showError('signInError', "Invalid email format!");
        return;
    }
    if (password.length < 8) {
        showError('signInError', "Password must be at least 8 characters long!");
        return;
    }

    try {
        const { isSignedIn, nextStep } = await Amplify.Auth.signIn({ 
            username: email, 
            password: password 
        });

        if (isSignedIn) {
            const session = await Amplify.Auth.fetchAuthSession();
            const idToken = session?.tokens?.idToken?.toString();
            localStorage.setItem('userToken', idToken || 'cognito-token');
            window.location.href = "index.html";
        } else {
            showError('signInError', "Sign in failed. Please try again.");
        }
    } catch (error) {
        showError('signInError', error.message || "Sign in failed. Invalid credentials or user not confirmed.");
    }
});

function logout() {
    Amplify.Auth.signOut().then(() => {
        localStorage.removeItem('userToken');
        window.location.href = "login.html";
    }).catch(err => {
        localStorage.removeItem('userToken');
        window.location.href = "login.html";
    });
}



