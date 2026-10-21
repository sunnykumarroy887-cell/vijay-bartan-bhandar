import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/*
 * Existing Supabase project configuration.
 * Never put a Supabase service-role or secret key in browser code.
 */
const SUPABASE_URL = "https://wkgkczrhgsmnmovyzuss.supabase.co";
const SUPABASE_KEY = "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

const $ = (id) => document.getElementById(id);

const form = $("accountForm");
const nameInput = $("customerName");
const emailInput = $("email");
const mobileInput = $("mobile");
const passwordInput = $("password");
const confirmInput = $("confirmPassword");

const messageBox = $("notice");
const submitButton = $("submitButton");

const loginTab = $("loginTab");
const signupTab = $("signupTab");
const switchToSignup = $("switchToSignup");

const nameField = $("nameField");
const mobileField = $("mobileField");
const confirmField = $("confirmField");

const formHeading = $("formHeading");
const formDescription = $("formDescription");
const switchText = $("switchText");

let mode = "login";
let busy = false;

/* Show a message to the customer. */

function showMessage(message, type = "info") {
    if (!messageBox) {
        alert(message);
        return;
    }

    messageBox.textContent = message;
    messageBox.hidden = false;
    messageBox.className = `notice ${type}`;
}

function clearMessage() {
    if (!messageBox) return;

    messageBox.textContent = "";
    messageBox.hidden = true;
    messageBox.className = "notice";
}

/* Switch between login and signup. */

function setMode(nextMode) {
    mode = nextMode;

    const signup = mode === "signup";

    clearMessage();

    if (nameField) nameField.hidden = !signup;
    if (mobileField) mobileField.hidden = !signup;
    if (confirmField) confirmField.hidden = !signup;

    if (nameInput) nameInput.required = signup;
    if (mobileInput) mobileInput.required = signup;
    if (confirmInput) confirmInput.required = signup;

    if (mobileInput) {
        mobileInput.pattern = signup ? "[6-9][0-9]{9}" : "";
        mobileInput.setCustomValidity("");
    }

    if (loginTab) {
        loginTab.classList.toggle("active", !signup);
        loginTab.setAttribute("aria-selected", String(!signup));
    }

    if (signupTab) {
        signupTab.classList.toggle("active", signup);
        signupTab.setAttribute("aria-selected", String(signup));
    }

    if (formHeading) {
        formHeading.textContent = signup
            ? "Create your account"
            : "Welcome back!";
    }

    if (formDescription) {
        formDescription.textContent = signup
            ? "Enter your details to register."
            : "Log in to continue to your account.";
    }

    if (submitButton) {
        submitButton.textContent = signup
            ? "Create Account"
            : "Login";
    }

    if (passwordInput) {
        passwordInput.autocomplete = signup
            ? "new-password"
            : "current-password";
    }

    if (confirmInput) {
        confirmInput.autocomplete = "new-password";
    }

    if (switchText) {
        switchText.innerHTML = signup
            ? "Already have an account? "
            : "New to Vijay Bartan Bhandar? ";

        const button = document.createElement("button");

        button.type = "button";
        button.id = "switchModeButton";
        button.textContent = signup
            ? "Login"
            : "Create an account";

        button.addEventListener("click", () => {
            setMode(signup ? "login" : "signup");
        });

        switchText.appendChild(button);
    }
}

loginTab?.addEventListener("click", () => setMode("login"));
signupTab?.addEventListener("click", () => setMode("signup"));

switchToSignup?.addEventListener("click", () => setMode("signup"));

/* Read and validate form values. */

function readDetails() {
    const email = (emailInput?.value || "")
        .trim()
        .toLowerCase();

    const password = passwordInput?.value || "";

    const fullName = (nameInput?.value || "").trim();

    const mobile = (mobileInput?.value || "")
        .replace(/\D/g, "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Sahi email address darj karein.");
    }

    if (password.length < 8) {
        throw new Error(
            "Password kam-se-kam 8 characters ka hona chahiye."
        );
    }

    if (mode === "signup") {
        if (fullName.length < 2) {
            throw new Error("Apna poora naam darj karein.");
        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            throw new Error(
                "Sahi 10-digit Indian mobile number darj karein."
            );
        }

        if (password !== (confirmInput?.value || "")) {
            throw new Error("Dono passwords ek jaise hone chahiye.");
        }
    }

    return {
        email,
        password,
        fullName,
        mobile
    };
}

/* Redirect after successful authentication. */

function openCustomerArea() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

    window.location.assign(
        next === "tracking"
            ? "./customer-tracking.html"
            : "./customer-profile.html"
    );
}

/* Convert Supabase errors into readable messages. */

function readableAuthError(error) {
    const message = String(error?.message || "");
    const lower = message.toLowerCase();

    if (
        lower.includes("already registered") ||
        lower.includes("already been registered") ||
        lower.includes("user already registered")
    ) {
        return "Is email se account pehle se bana hua hai. Login karein.";
    }

    if (lower.includes("email not confirmed")) {
        return "Pehle email mein aaya verification link open karein.";
    }

    if (
        lower.includes("password should be") ||
        lower.includes("password is too")
    ) {
        return "Password ki length ya security requirements poori karein.";
    }

    if (
        lower.includes("invalid api key") ||
        lower.includes("apikey")
    ) {
        return "Supabase API key ya configuration mein problem hai.";
    }

    if (
        lower.includes("failed to fetch") ||
        lower.includes("fetch") ||
        lower.includes("network")
    ) {
        return "Network request fail hui. Internet aur Supabase connection check karein.";
    }

    if (
        lower.includes("database error saving new user")
    ) {
        return "Supabase database ne naya user save nahi kiya. Auth trigger ya database setup check karna hoga.";
    }

    return message || "Request fail hui. Dobara koshish karein.";
}

/*
 * Create/update the customer's own profile.
 * A profile error is logged separately and does not hide
 * a successful Supabase authentication response.
 */

async function ensureProfile(user, details = {}) {
    const fullName =
        details.fullName ||
        user.user_metadata?.full_name ||
        "";

    const mobile =
        details.mobile ||
        user.user_metadata?.mobile ||
        "";

    if (!fullName || !mobile) {
        console.warn(
            "Customer profile skipped: name or mobile is missing."
        );
        return;
    }

    const { error } = await supabase
        .from("customer_profiles")
        .upsert(
            {
                user_id: user.id,
                full_name: fullName,
                mobile
            },
            {
                onConflict: "user_id"
            }
        );

    if (error) {
        console.error(
            "Customer profile could not be saved:",
            error.message
        );
    }
}

/* Signup */

async function signup(details) {
    console.info("Customer signup started.");

    const { data, error } = await supabase.auth.signUp({
        email: details.email,
        password: details.password,
        options: {
            data: {
                full_name: details.fullName,
                mobile: details.mobile
            }
        }
    });

    if (error) {
        console.error("Supabase signup failed:", error);
        throw error;
    }

    if (!data?.user) {
        throw new Error(
            "Supabase ne user details return nahi ki. Signup result check karein."
        );
    }

    console.info("Supabase signup response received.", {
        userId: data.user.id,
        hasSession: Boolean(data.session),
        emailConfirmed: Boolean(data.user.email_confirmed_at)
    });

    if (data.session) {
        await ensureProfile(data.user, details);

        showMessage(
            "Account ban gaya hai. Aapko customer area par bheja ja raha hai.",
            "success"
        );

        setTimeout(openCustomerArea, 900);

        return;
    }

    showMessage(
        "Signup request successful hai. Apne email mein verification link check karein. Verification ke baad login karein.",
        "success"
    );

    form?.reset();

    setMode("login");
}

/* Login */

async function login(details) {
    console.info("Customer login started.");

    const { data, error } =
        await supabase.auth.signInWithPassword({
            email: details.email,
            password: details.password
        });

    if (error) {
        console.error("Supabase login failed:", error);
        throw error;
    }

    if (!data?.user) {
        throw new Error("Login session nahi bani.");
    }

    await ensureProfile(data.user);

    openCustomerArea();
}

/* Submit handler */

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (busy) return;

    clearMessage();

    busy = true;

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Please wait...";
    }

    try {
        const details = readDetails();

        if (mode === "signup") {
            await signup(details);
        } else {
            await login(details);
        }
    } catch (error) {
        console.error("Customer account error:", error);

        showMessage(
            readableAuthError(error),
            "error"
        );
    } finally {
        busy = false;

        if (submitButton) {
            submitButton.disabled = false;

            submitButton.textContent =
                mode === "signup"
                    ? "Create Account"
                    : "Login";
        }
    }
});

/* Do not auto-redirect just because an old session exists.
   This lets a customer enter another account's credentials on the same
   browser/device. A successful sign-in replaces the current Supabase session. */
async function checkSession() {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error("Session check failed:", error);
            return;
        }

        if (data?.session?.user) {
            showMessage(
                "Is browser mein ek account pehle se login hai. Dusre account mein jaane ke liye neeche uska email aur password daal kar Login karein. Ya pehle purane account se Log out karein.",
                "info"
            );
        }
    } catch (error) {
        console.error("Session initialization failed:", error);
    }
}

/* Footer year */

const currentYear = $("currentYear");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

/* Initial page setup */

setMode("login");
checkSession();