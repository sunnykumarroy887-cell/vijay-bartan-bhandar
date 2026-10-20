import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
    "https://wkgkczrhgsmnmovyzuss.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E";

const ADMIN_UID =
    "540b68b8-044f-4ac5-bbd9-8014e31af801";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);


// ======================================================
// ELEMENTS
// ======================================================

const loginForm = document.getElementById("loginForm");
const resetForm = document.getElementById("resetForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const newPasswordInput =
    document.getElementById("newPassword");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const loginButton =
    document.getElementById("loginButton");

const loginButtonText =
    document.getElementById("loginButtonText");

const loginLoader =
    document.getElementById("loginLoader");

const forgotPassword =
    document.getElementById("forgotPassword");

const togglePassword =
    document.getElementById("togglePassword");

const updatePasswordButton =
    document.getElementById("updatePasswordButton");

const messageBox =
    document.getElementById("message");


// ======================================================
// MESSAGE
// ======================================================

function showMessage(message, type = "error") {

    if (!messageBox) return;

    messageBox.textContent = message;

    messageBox.className =
        `message ${type}`;

    messageBox.classList.remove("hidden");
}


function hideMessage() {

    if (!messageBox) return;

    messageBox.textContent = "";

    messageBox.className =
        "message hidden";
}


// ======================================================
// LOADING
// ======================================================

function setLoginLoading(loading) {

    if (loginButton) {
        loginButton.disabled = loading;
    }

    if (loginButtonText) {
        loginButtonText.classList.toggle(
            "hidden",
            loading
        );
    }

    if (loginLoader) {
        loginLoader.classList.toggle(
            "hidden",
            !loading
        );
    }
}


// ======================================================
// ERROR
// ======================================================

function friendlyError(error) {

    if (!error) {
        return "Something went wrong.";
    }

    const message =
        String(error.message || "").toLowerCase();

    if (
        message.includes("invalid login credentials")
    ) {
        return "Email or password is incorrect.";
    }

    if (
        message.includes("email not confirmed")
    ) {
        return "Please confirm your email before logging in.";
    }

    if (
        message.includes("too many requests")
    ) {
        return "Too many login attempts. Please wait and try again.";
    }

    return error.message ||
        "Unable to login.";
}


// ======================================================
// ADMIN CHECK
// ======================================================

function isAdminUser(user) {

    if (!user) {
        return false;
    }

    return user.id === ADMIN_UID;
}


// ======================================================
// OPEN ADMIN PANEL
// ======================================================
function openDashboard() {
    window.location.replace("./admin.html");
}

// ======================================================
// CHECK EXISTING LOGIN
// ======================================================

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } = await supabase.auth.getSession();

        if (error) {
            console.error(error);
            return;
        }

        const session = data?.session;

        if (!session?.user) {
            return;
        }

        if (isAdminUser(session.user)) {

            openDashboard();

            return;
        }

        await supabase.auth.signOut();

        showMessage(
            "This account is not authorized for Admin access."
        );

    } catch (error) {

        console.error(
            "Session check error:",
            error
        );

    }
}


// ======================================================
// LOGIN
// ======================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideMessage();

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;

            if (!email || !password) {

                showMessage(
                    "Please enter email and password."
                );

                return;
            }

            setLoginLoading(true);

            try {

                const {
                    data,
                    error
                } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    throw error;
                }

                const user =
                    data?.user;

                if (!user) {

                    throw new Error(
                        "Login failed. User account was not found."
                    );

                }

                // ONLY ADMIN UID CAN ENTER
                if (!isAdminUser(user)) {

                    await supabase.auth.signOut();

                    throw new Error(
                        "This account is not authorized for Admin access."
                    );
                }

                showMessage(
                    "Login successful. Opening Admin Panel...",
                    "success"
                );

                setTimeout(
                    openDashboard,
                    400
                );

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                showMessage(
                    friendlyError(error)
                );

            } finally {

                setLoginLoading(false);

            }

        }
    );

}


// ======================================================
// PASSWORD SHOW / HIDE
// ======================================================

if (togglePassword && passwordInput) {

    togglePassword.addEventListener(
        "click",
        () => {

            const show =
                passwordInput.type === "password";

            passwordInput.type =
                show ? "text" : "password";

            togglePassword.textContent =
                show ? "🙈" : "👁";

        }
    );

}


// ======================================================
// FORGOT PASSWORD
// ======================================================

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async () => {

            hideMessage();

            const email =
                emailInput.value.trim();

            if (!email) {

                showMessage(
                    "First enter your Admin email."
                );

                emailInput?.focus();

                return;
            }

            if (!email.includes("@")) {

                showMessage(
                    "Please enter a valid email address."
                );

                return;
            }

            try {

                const {
                    error
                } =
                    await supabase.auth.resetPasswordForEmail(
                        email,
                        {
                            redirectTo:
                                `${window.location.origin}${window.location.pathname}`
                        }
                    );

                if (error) {
                    throw error;
                }

                showMessage(
                    "Password reset link has been sent to your email.",
                    "success"
                );

            } catch (error) {

                console.error(error);

                showMessage(
                    friendlyError(error)
                );

            }

        }
    );

}


// ======================================================
// PASSWORD UPDATE
// ======================================================

if (resetForm) {

    resetForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideMessage();

            const newPassword =
                newPasswordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;

            if (newPassword.length < 8) {

                showMessage(
                    "Password must contain at least 8 characters."
                );

                return;
            }

            if (
                newPassword !==
                confirmPassword
            ) {

                showMessage(
                    "Passwords do not match."
                );

                return;
            }

            updatePasswordButton.disabled =
                true;

            try {

                const {
                    error
                } =
                    await supabase.auth.updateUser({
                        password: newPassword
                    });

                if (error) {
                    throw error;
                }

                await supabase.auth.signOut();

                resetForm.classList.add(
                    "hidden"
                );

                loginForm.classList.remove(
                    "hidden"
                );

                showMessage(
                    "Password updated successfully. Please login again.",
                    "success"
                );

            } catch (error) {

                console.error(error);

                showMessage(
                    friendlyError(error)
                );

            } finally {

                updatePasswordButton.disabled =
                    false;
            }

        }
    );

}


// ======================================================
// AUTH STATE
// ======================================================

supabase.auth.onAuthStateChange(
    (event, session) => {

        if (
            event === "PASSWORD_RECOVERY"
        ) {

            loginForm?.classList.add(
                "hidden"
            );

            forgotPassword?.classList.add(
                "hidden"
            );

            resetForm?.classList.remove(
                "hidden"
            );

            return;
        }

    }
);


// ======================================================
// START
// ======================================================

checkExistingSession();