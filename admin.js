import { createClient }
    from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* =====================================================
   SUPABASE CONFIG
===================================================== */

const SUPABASE_URL =
    "https://wkgkczrhgsmnmovyzuss.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E";


const supabase =
    createClient(
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


/* =====================================================
   ADMIN UID
===================================================== */

const ADMIN_UID =
    "540b68b8-044f-4ac5-bbd9-8014e31af801";


/* =====================================================
   HELPERS
===================================================== */

function money(value) {

    return "₹" +
        Number(value || 0)
            .toLocaleString("en-IN", {
                maximumFractionDigits: 2
            });

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* =====================================================
   ADMIN AUTHORIZATION
   IMPORTANT:
   No admin_settings/profile verification.
   Admin access = Supabase Session + Fixed Admin UID.
===================================================== */

async function verifyAdmin() {

    try {

        const {
            data: {
                session
            }
        } = await supabase.auth.getSession();


        if (!session || !session.user) {

            window.location.href =
                "./admin-login.html";

            return false;

        }


        const currentUID =
            session.user.id;


        if (currentUID !== ADMIN_UID) {

            await supabase.auth.signOut();

            alert(
                "This account is not authorized to access the Admin Panel."
            );

            window.location.href =
                "./admin-login.html";

            return false;

        }


        return true;

    } catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        alert(
            "Unable to verify Admin account."
        );

        window.location.href =
            "./admin-login.html";

        return false;

    }

}


/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation() {

    document
        .querySelectorAll(".menu button")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const target =
                        button.dataset.section;


                    document
                        .querySelectorAll(".menu button")
                        .forEach(btn =>
                            btn.classList.remove("active")
                        );


                    button.classList.add("active");


                    document
                        .querySelectorAll(".section")
                        .forEach(section =>
                            section.classList.remove("active")
                        );


                    const section =
                        document.getElementById(target);


                    if (section) {

                        section.classList.add("active");

                    }


                    if (target === "dashboard") {

                        await updateDashboard();

                    }


                    if (target === "bartan") {

                        await renderBartan();

                    }


                    if (target === "decoration") {

                        await renderDecorations();

                    }


                    if (target === "settings") {

                        await loadSettings();

                    }

                }
            );

        });

}


/* =====================================================
   OPEN BOOKINGS
===================================================== */

window.openBookings = function () {

    window.location.href =
        "./booking.html";

};


/* =====================================================
   BARTAN
===================================================== */

async function getBartanItems() {

    const {
        data,
        error
    } = await supabase
        .from("bartan_items")
        .select("*")
        .order("id", {
            ascending: true
        });


    if (error) {

        console.error(
            "Bartan load error:",
            error
        );

        throw error;

    }


    return data || [];

}


/* =====================================================
   RENDER BARTAN
===================================================== */

async function renderBartan() {

    const tbody =
        document.getElementById(
            "bartanAdminList"
        );


    if (!tbody) return;


    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="loading">
                Loading Bartan items...
            </td>
        </tr>
    `;


    try {

        const items =
            await getBartanItems();


        if (!items.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading">
                        No Bartan items found.
                    </td>
                </tr>
            `;

            return;

        }


        tbody.innerHTML = "";


        items.forEach((item, index) => {

            const row =
                document.createElement("tr");


            const rate =
                Number(item.rate || 0);


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(item.name)}
                    </strong>
                </td>

                <td>

                    <input
                        class="rate-input"
                        type="number"
                        min="0"
                        step="1"
                        value="${rate}"
                        data-id="${item.id}"
                    >

                </td>

                <td>

                    <span
                        style="
                            color: ${
                                rate > 0
                                    ? "#087443"
                                    : "#b42318"
                            };
                            font-weight: bold;
                        "
                    >

                        ${
                            rate > 0
                                ? "Rate Added"
                                : "Rate Not Added"
                        }

                    </span>

                </td>

            `;


            tbody.appendChild(row);

        });

    } catch (error) {

        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="loading">
                    Unable to load Bartan items.
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   SAVE BARTAN RATES
===================================================== */

async function saveAllRates() {

    const inputs =
        document.querySelectorAll(
            ".rate-input"
        );


    if (!inputs.length) {

        showToast(
            "No Bartan items available."
        );

        return;

    }


    const button =
        document.getElementById(
            "saveAllRates"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "Saving...";

    }


    try {

        for (const input of inputs) {

            const id =
                Number(input.dataset.id);


            let rate =
                Number(input.value);


            if (
                !Number.isFinite(rate) ||
                rate < 0
            ) {

                rate = 0;

            }


            rate =
                Math.floor(rate);


            const {
                error
            } = await supabase
                .from("bartan_items")
                .update({
                    rate: rate,
                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", id);


            if (error) {

                throw error;

            }

        }


        await renderBartan();

        await updateDashboard();


        showToast(
            "All Bartan rates saved successfully."
        );

    } catch (error) {

        console.error(
            "Rate save error:",
            error
        );

        showToast(
            "Unable to save rates."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "💾 Save All Rates";

        }

    }

}


/* =====================================================
   RESET RATES
===================================================== */

async function resetRates() {

    const ok =
        confirm(
            "Reset all Bartan rates to ₹0?"
        );


    if (!ok) return;


    try {

        const {
            error
        } = await supabase
            .from("bartan_items")
            .update({
                rate: 0,
                updated_at:
                    new Date().toISOString()
            })
            .gt("id", 0);


        if (error) {

            throw error;

        }


        await renderBartan();

        await updateDashboard();


        showToast(
            "All Bartan rates reset successfully."
        );

    } catch (error) {

        console.error(
            "Reset rate error:",
            error
        );

        showToast(
            "Unable to reset rates."
        );

    }

}


/* =====================================================
   DECORATION
===================================================== */

async function getDecorations() {

    const {
        data,
        error
    } = await supabase
        .from("decorations")
        .select("*")
        .order("id", {
            ascending: false
        });


    if (error) {

        console.error(
            "Decoration load error:",
            error
        );

        throw error;

    }


    return data || [];

}


/* =====================================================
   RENDER DECORATIONS
===================================================== */

async function renderDecorations() {

    const container =
        document.getElementById(
            "decorationList"
        );


    if (!container) return;


    container.innerHTML = `
        <div class="loading">
            Loading decoration services...
        </div>
    `;


    try {

        const decorations =
            await getDecorations();


        if (!decorations.length) {

            container.innerHTML = `
                <div class="empty-state">

                    No decoration service added yet.

                    <br><br>

                    Add your first decoration
                    service using the form above.

                </div>
            `;

            return;

        }


        container.innerHTML =
            decorations
                .map(item => {

                    const image =
                        item.image_url ||
                        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80";


                    return `

                        <div class="decoration-card">

                            <img
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(item.name)}"
                                onerror="
                                    this.src='https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80'
                                "
                            >

                            <div class="decoration-info">

                                <h4>
                                    ${escapeHTML(item.name)}
                                </h4>


                                <span
                                    class="
                                        decoration-status
                                        ${
                                            item.is_active
                                                ? "status-active"
                                                : "status-inactive"
                                        }
                                    "
                                >
                                    ${
                                        item.is_active
                                            ? "Active"
                                            : "Inactive"
                                    }
                                </span>


                                <p>
                                    ${escapeHTML(
                                        item.category || ""
                                    )}
                                </p>


                                <div class="decoration-price">

                                    Starting:
                                    ${money(item.rate)}

                                </div>


                                <p>
                                    ${escapeHTML(
                                        item.description || ""
                                    )}
                                </p>


                                <br>


                                <div class="button-row">

                                    <button
                                        class="btn btn-gold"
                                        onclick="
                                            editDecoration(
                                                ${Number(item.id)}
                                            )
                                        "
                                    >
                                        Edit
                                    </button>


                                    <button
                                        class="
                                            btn
                                            ${
                                                item.is_active
                                                    ? "btn-danger"
                                                    : "btn-success"
                                            }
                                        "
                                        onclick="
                                            toggleDecoration(
                                                ${Number(item.id)},
                                                ${item.is_active}
                                            )
                                        "
                                    >

                                        ${
                                            item.is_active
                                                ? "Deactivate"
                                                : "Activate"
                                        }

                                    </button>

                                </div>

                            </div>

                        </div>

                    `;

                })
                .join("");

    } catch (error) {

        console.error(
            "Decoration render error:",
            error
        );

        container.innerHTML = `

            <div class="empty-state">

                Unable to load decoration services.

            </div>

        `;

    }

}


/* =====================================================
   ADD DECORATION
===================================================== */

async function addDecoration(event) {

    event.preventDefault();


    const name =
        document
            .getElementById("decorationName")
            .value
            .trim();


    const rate =
        Number(
            document
                .getElementById("decorationRate")
                .value
        );


    const image =
        document
            .getElementById("decorationImage")
            .value
            .trim();


    const category =
        document
            .getElementById("decorationCategory")
            .value;


    const description =
        document
            .getElementById("decorationDescription")
            .value
            .trim();


    if (!name) {

        alert(
            "Please enter service name."
        );

        return;

    }


    if (
        !Number.isFinite(rate) ||
        rate < 0
    ) {

        alert(
            "Please enter a valid rate."
        );

        return;

    }


    const submitButton =
        event.target.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Adding...";

    }


    try {

        const {
            error
        } = await supabase
            .from("decorations")
            .insert({
                name: name,
                category: category,
                description: description,
                rate: Math.floor(rate),
                image_url:
                    image || null,
                is_active: true
            });


        if (error) {

            throw error;

        }


        event.target.reset();


        await renderDecorations();


        showToast(
            "Decoration service added successfully."
        );

    } catch (error) {

        console.error(
            "Decoration add error:",
            error
        );

        showToast(
            "Unable to add decoration service."
        );

    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "+ Add Decoration Service";

        }

    }

}


/* =====================================================
   EDIT DECORATION
===================================================== */

window.editDecoration =
    async function (id) {

        try {

            const {
                data,
                error
            } = await supabase
                .from("decorations")
                .select("*")
                .eq("id", id)
                .single();


            if (error) {

                throw error;

            }


            const name =
                prompt(
                    "Service Name:",
                    data.name
                );


            if (name === null) return;


            const rateText =
                prompt(
                    "Starting Rate:",
                    data.rate
                );


            if (rateText === null) return;


            const rate =
                Number(rateText);


            if (
                !Number.isFinite(rate) ||
                rate < 0
            ) {

                alert(
                    "Please enter a valid rate."
                );

                return;

            }


            const category =
                prompt(
                    "Category:",
                    data.category || ""
                );


            if (category === null) return;


            const description =
                prompt(
                    "Description:",
                    data.description || ""
                );


            if (description === null) return;


            const image =
                prompt(
                    "Image URL:",
                    data.image_url || ""
                );


            if (image === null) return;


            const {
                error: updateError
            } = await supabase
                .from("decorations")
                .update({
                    name: name.trim(),
                    category: category.trim(),
                    description:
                        description.trim(),
                    rate:
                        Math.floor(rate),
                    image_url:
                        image.trim() || null,
                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", id);


            if (updateError) {

                throw updateError;

            }


            await renderDecorations();


            showToast(
                "Decoration updated successfully."
            );

        } catch (error) {

            console.error(
                "Decoration update error:",
                error
            );

            showToast(
                "Unable to update decoration."
            );

        }

    };


/* =====================================================
   ACTIVATE / DEACTIVATE DECORATION
===================================================== */

window.toggleDecoration =
    async function (id, currentStatus) {

        const action =
            currentStatus
                ? "deactivate"
                : "activate";


        const ok =
            confirm(
                `Do you want to ${action} this decoration service?`
            );


        if (!ok) return;


        try {

            const {
                error
            } = await supabase
                .from("decorations")
                .update({
                    is_active:
                        !currentStatus,
                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", id);


            if (error) {

                throw error;

            }


            await renderDecorations();


            showToast(
                currentStatus
                    ? "Decoration deactivated."
                    : "Decoration activated."
            );

        } catch (error) {

            console.error(
                "Decoration status error:",
                error
            );

            showToast(
                "Unable to update decoration status."
            );

        }

    };


/* =====================================================
   DASHBOARD
===================================================== */

async function updateDashboard() {

    try {

        const [
            bartanResult,
            bookingResult,
            paymentResult
        ] = await Promise.all([

            supabase
                .from("bartan_items")
                .select("id, rate"),

            supabase
                .from("bookings")
                .select("id"),

            supabase
                .from("booking_payments")
                .select("amount")
                .eq("payment_type", "advance")

        ]);


        if (bartanResult.error) {

            throw bartanResult.error;

        }


        if (bookingResult.error) {

            throw bookingResult.error;

        }


        if (paymentResult.error) {

            throw paymentResult.error;

        }


        const items =
            bartanResult.data || [];


        const bookings =
            bookingResult.data || [];


        const payments =
            paymentResult.data || [];


        const rates =
            items.filter(
                item =>
                    Number(item.rate || 0) > 0
            ).length;


        const collection =
            payments.reduce(
                (total, payment) =>
                    total +
                    Number(
                        payment.amount || 0
                    ),
                0
            );


        const dashItems =
            document.getElementById(
                "dashItems"
            );


        const dashRates =
            document.getElementById(
                "dashRates"
            );


        const dashBookings =
            document.getElementById(
                "dashBookings"
            );


        const dashCollection =
            document.getElementById(
                "dashCollection"
            );


        if (dashItems) {

            dashItems.textContent =
                items.length;

        }


        if (dashRates) {

            dashRates.textContent =
                rates;

        }


        if (dashBookings) {

            dashBookings.textContent =
                bookings.length;

        }


        if (dashCollection) {

            dashCollection.textContent =
                money(collection);

        }

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


/* =====================================================
   BUSINESS SETTINGS
===================================================== */

async function loadSettings() {

    try {

        const {
            data,
            error
        } = await supabase
            .from("business_settings")
            .select("*")
            .eq("id", 1)
            .maybeSingle();


        if (error) {

            throw error;

        }


        if (!data) return;


        const name =
            document.getElementById(
                "businessName"
            );


        const mobile =
            document.getElementById(
                "businessMobile"
            );


        const mobile2 =
            document.getElementById(
                "businessMobile2"
            );


        const address =
            document.getElementById(
                "businessAddress"
            );


        if (name) {

            name.value =
                data.business_name || "";

        }


        if (mobile) {

            mobile.value =
                data.mobile_one || "";

        }


        if (mobile2) {

            mobile2.value =
                data.mobile_two || "";

        }


        if (address) {

            address.value =
                data.address || "";

        }

        const phonepe = document.getElementById("phonepeNumber");
        const upi = document.getElementById("upiId");

        if (phonepe) phonepe.value = data.phonepe_number || "6201852300";
        if (upi) upi.value = data.upi_id || "6201852300@ibl";


    } catch (error) {

        console.error(
            "Settings load error:",
            error
        );

    }

}


/* =====================================================
   SAVE BUSINESS SETTINGS
===================================================== */

async function saveSettings() {

    const businessName =
        document
            .getElementById("businessName")
            .value
            .trim();


    const mobile =
        document
            .getElementById("businessMobile")
            .value
            .trim();


    const mobile2 =
        document
            .getElementById("businessMobile2")
            .value
            .trim();


    const address =
        document
            .getElementById("businessAddress")
            .value
            .trim();

    const phonepeNumber =
        document.getElementById("phonepeNumber")?.value.trim() || "";

    const upiId =
        document.getElementById("upiId")?.value.trim() || "";



    if (!businessName) {

        alert(
            "Business name is required."
        );

        return;

    }


    try {

        const {
            error
        } = await supabase
            .from("business_settings")
            .upsert({
                id: 1,
                business_name:
                    businessName,
                mobile_one:
                    mobile,
                mobile_two:
                    mobile2,
                address:
                    address,
                phonepe_number:
                    phonepeNumber,
                upi_id:
                    upiId,
                updated_at:
                    new Date().toISOString()
            });


        if (error) {

            throw error;

        }


        showToast(
            "Business settings saved successfully."
        );

    } catch (error) {

        console.error(
            "Settings save error:",
            error
        );

        showToast(
            `Unable to save settings: ${error?.message || "Unknown error"}`
        );

    }

}


/* =====================================================
   LOGOUT
===================================================== */

async function logoutAdmin() {

    const ok =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!ok) return;


    await supabase.auth.signOut();


    window.location.href =
        "./admin-login.html";

}


/* =====================================================
   EVENT LISTENERS
===================================================== */

function setupEventListeners() {

    const saveRates =
        document.getElementById(
            "saveAllRates"
        );


    if (saveRates) {

        saveRates.addEventListener(
            "click",
            saveAllRates
        );

    }


    const reset =
        document.getElementById(
            "resetRates"
        );


    if (reset) {

        reset.addEventListener(
            "click",
            resetRates
        );

    }


    const decorationForm =
        document.getElementById(
            "decorationForm"
        );


    if (decorationForm) {

        decorationForm.addEventListener(
            "submit",
            addDecoration
        );

    }


    const settingsButton =
        document.getElementById(
            "saveSettings"
        );


    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            saveSettings
        );

    }

}


/* =====================================================
   LOGOUT BUTTON
===================================================== */

function addLogoutButton() {

    const headerActions =
        document.querySelector(
            ".header-actions"
        );


    if (!headerActions) return;


    const logoutButton =
        document.createElement("button");


    logoutButton.className =
        "header-btn";


    logoutButton.type =
        "button";


    logoutButton.textContent =
        "Logout";


    logoutButton.addEventListener(
        "click",
        logoutAdmin
    );


    headerActions.appendChild(
        logoutButton
    );

}


/* =====================================================
   AUTH STATE
===================================================== */

function setupAuthListener() {

    supabase.auth.onAuthStateChange(
        async (event, session) => {

            if (event === "SIGNED_OUT") {

                window.location.href =
                    "./admin-login.html";

                return;

            }


            if (
                session &&
                session.user &&
                session.user.id !== ADMIN_UID
            ) {

                await supabase.auth.signOut();

                window.location.href =
                    "./admin-login.html";

            }

        }
    );

}


/* =====================================================
   INITIALIZATION
===================================================== */

async function initializeAdmin() {

    const authorized =
        await verifyAdmin();


    if (!authorized) return;


    setupNavigation();

    setupEventListeners();

    addLogoutButton();

    setupAuthListener();


    await Promise.all([
        renderBartan(),
        renderDecorations(),
        loadSettings(),
        updateDashboard()
    ]);

}


/* =====================================================
   START ADMIN PANEL
===================================================== */

initializeAdmin();