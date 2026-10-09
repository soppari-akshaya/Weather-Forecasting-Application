if (typeof firebase === "undefined") {
    console.error("Firebase SDK is not loaded.");
}
if (typeof auth === "undefined") {
    console.error(
        "Firebase auth is not initialized. Check firebase-config.js."
    );
}
function showMessage(message, type = "info") {
    const messageElement = document.getElementById("loginMessage");

    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = "login-message " + type;
        messageElement.setAttribute("role", "status");
    }
}
function setButtonLoading(button, loading, loadingText, normalText) {
    if (!button) return;

    button.disabled = loading;
    button.textContent = loading ? loadingText : normalText;
}
function getAuthErrorMessage(error, action) {
    console.error(action + " error:", error);

    switch (error.code) {
        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
            return "Incorrect email or password.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/email-already-in-use":
            return "An account already exists with this email.";

        case "auth/weak-password":
            return "Password must contain at least 6 characters.";

        case "auth/popup-closed-by-user":
            return "Google sign-in was cancelled.";

        case "auth/popup-blocked":
            return "The sign-in popup was blocked. Please allow popups.";

        case "auth/unauthorized-domain":
            return "This domain is not authorized in Firebase.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/operation-not-allowed":
            return "This sign-in method is not enabled in Firebase.";

        default:
            return action + " failed. Please try again.";
    }
}
const loginButton = document.getElementById("loginButton");
if (loginButton) {
    loginButton.addEventListener("click", async function () {
        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        if (!email || !password) {
            showMessage("Please enter your email and password.", "error");
            return;
        }

        if (typeof auth === "undefined") {
            showMessage(
                "Authentication is unavailable. Please check Firebase configuration.",
                "error"
            );
            return;
        }

        setButtonLoading(
            loginButton,
            true,
            "Logging in...",
            "Login"
        );

        showMessage("Logging in...", "info");

        try {
            await auth.signInWithEmailAndPassword(email, password);

            showMessage("Login successful. Opening dashboard...", "success");

            window.location.href = "index.html";
        } catch (error) {
            showMessage(getAuthErrorMessage(error, "Login"), "error");
        } finally {
            setButtonLoading(loginButton, false, "Logging in...", "Login");
        }
    });
}

const registerButton = document.getElementById("registerButton");
if (registerButton) {
    registerButton.addEventListener("click", async function () {
        const nameInput = document.getElementById("registerName");
        const emailInput = document.getElementById("registerEmail");
        const passwordInput = document.getElementById("registerPassword");
        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        if (!name || !email || !password) {
            showMessage("Please fill in all fields.", "error");
            return;
        }

        if (password.length < 6) {
            showMessage(
                "Password must contain at least 6 characters.",
                "error"
            );
            return;
        }

        if (typeof auth === "undefined") {
            showMessage(
                "Authentication is unavailable. Please check Firebase configuration.",
                "error"
            );
            return;
        }

        setButtonLoading(
            registerButton,
            true,
            "Creating account...",
            "Create Account"
        );

        showMessage("Creating your account...", "info");

        try {
            const result = await auth.createUserWithEmailAndPassword(
                email,
                password
            );

            await result.user.updateProfile({
                displayName: name
            });

            showMessage(
                "Account created successfully. Opening dashboard...",
                "success"
            );

            window.location.href = "index.html";
        } catch (error) {
            showMessage(
                getAuthErrorMessage(error, "Registration"),
                "error"
            );
        } finally {
            setButtonLoading(
                registerButton,
                false,
                "Creating account...",
                "Create Account"
            );
        }
    });
}
const googleLoginButton = document.getElementById("googleLogin");
if (googleLoginButton) {
    googleLoginButton.addEventListener("click", async function () {
        if (
            typeof firebase === "undefined" ||
            typeof auth === "undefined"
        ) {
            showMessage(
                "Firebase is not configured correctly.",
                "error"
            );
            return;
        }
        setButtonLoading(
            googleLoginButton,
            true,
            "Opening Google...",
            "Continue with Google"
        );

        showMessage("Opening Google sign-in...", "info");

        try {
            const provider = new firebase.auth.GoogleAuthProvider();

            const result = await auth.signInWithPopup(provider);

            console.log("Google sign-in successful.");
            console.log("Name:", result.user.displayName);
            console.log("Email:", result.user.email);

            showMessage(
                "Google sign-in successful. Opening dashboard...",
                "success"
            );

            window.location.href = "index.html";
        } catch (error) {
            showMessage(
                getAuthErrorMessage(error, "Google sign-in"),
                "error"
            );
        } finally {
            setButtonLoading(
                googleLoginButton,
                false,
                "Opening Google...",
                "Continue with Google"
            );
        }
    });
}
const forgotPasswordButton = document.getElementById("forgotPassword");
if (forgotPasswordButton) {
    forgotPasswordButton.addEventListener("click", async function () {
        const emailInput = document.getElementById("loginEmail");
        let email = emailInput ? emailInput.value.trim() : "";
        if (!email) {
            email = prompt("Enter your registered email address:");

            if (!email || !email.trim()) {
                return;
            }

            email = email.trim();

            if (emailInput) {
                emailInput.value = email;
            }
        }

        if (typeof auth === "undefined") {
            showMessage(
                "Authentication is unavailable. Please check Firebase configuration.",
                "error"
            );
            return;
        }

        forgotPasswordButton.disabled = true;
        showMessage("Sending password reset email...", "info");

        try {
            await auth.sendPasswordResetEmail(email);

            showMessage(
                "Password reset instructions have been sent to your email.",
                "success"
            );
        } catch (error) {
            showMessage(
                getAuthErrorMessage(error, "Password reset"),
                "error"
            );
        } finally {
            forgotPasswordButton.disabled = false;
        }
    });
}

const showRegisterButton = document.getElementById("showRegister");

if (showRegisterButton) {
    showRegisterButton.addEventListener("click", function (event) {
        event.preventDefault();

        const loginForm = document.getElementById("loginForm");
        const registerForm = document.getElementById("registerForm");

        if (loginForm) {
            loginForm.style.display = "none";
        }

        if (registerForm) {
            registerForm.style.display = "block";
        }

        showMessage("", "info");
    });
}
const showLoginButton = document.getElementById("showLogin");

if (showLoginButton) {
    showLoginButton.addEventListener("click", function (event) {
        event.preventDefault();

        const loginForm = document.getElementById("loginForm");
        const registerForm = document.getElementById("registerForm");

        if (registerForm) {
            registerForm.style.display = "none";
        }

        if (loginForm) {
            loginForm.style.display = "block";
        }

        showMessage("", "info");
    });
}
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (loginButton && !loginButton.disabled) {
            loginButton.click();
        }
    });
}

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (registerButton && !registerButton.disabled) {
            registerButton.click();
        }
    });
}

