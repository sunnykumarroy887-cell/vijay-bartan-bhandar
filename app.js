// ============================================================
// VIJAY BARTAN BHANDAR + DECORATION
// MAIN WEBSITE APP.JS
// ============================================================

import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ============================================================
// SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL =
    "https://wkgkczrhgsmnmovyzuss.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ============================================================
// GLOBAL DATA
// ============================================================

let bartanItems = [];
let selectedItems = [];


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    initializeMobileMenu();

    initializeCustomerSessionMenu();

    initializeYear();

    initializeSmoothScroll();

    initializeFloatingButtons();

    loadBartanItems();

    initializeSelectedItems();

});


// ============================================================
// MOBILE MENU
// ============================================================

function initializeMobileMenu() {

    const menuButton =
        document.querySelector(".menu-btn");

    /*
     * Current index.html uses:
     * .navbar
     *
     * Earlier code was looking for .main-nav,
     * which does not exist in index.html.
     */

    const nav =
        document.querySelector(".navbar");

    if (!menuButton || !nav) {
        return;
    }

    menuButton.addEventListener("click", () => {

        nav.classList.toggle("active");

        const isOpen =
            nav.classList.contains("active");

        menuButton.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

    });


    const navLinks =
        nav.querySelectorAll("a");

    navLinks.forEach(link => {

        link.addEventListener("click", () => {

            nav.classList.remove("active");

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });

}


// ============================================================
// CUSTOMER SESSION MENU (SUPABASE AUTH)
// ============================================================

function initializeCustomerSessionMenu() {
    const host = document.getElementById("customerSessionMenu");
    if (!host) return;

    const renderSignedOut = () => {
        host.classList.remove("open");
        host.innerHTML = `
            <a class="customer-signin-link" href="./customer-account.html">
                👤 Sign In
            </a>`;
    };

    const renderSignedIn = (user) => {
        const metadata = user?.user_metadata || {};
        const name = (metadata.full_name || metadata.name || "").trim();
        const label = name ? `👤 ${escapeMenuText(name)}` : "👤 My Account";
        host.innerHTML = `
            <button class="customer-menu-trigger" type="button"
                aria-expanded="false" aria-haspopup="true">
                ${label} <span aria-hidden="true">▾</span>
            </button>
            <div class="customer-menu-dropdown" role="menu">
                <div class="customer-menu-greeting">Signed in${name ? ` as ${escapeMenuText(name)}` : ""}</div>
                <a role="menuitem" href="./customer-profile.html">👤 My Account</a>
                <a role="menuitem" href="./customer-tracking.html">📋 My Bookings</a>
                <a role="menuitem" href="./customer-tracking.html">📍 Track Booking</a>
                <a role="menuitem" href="./customer-profile.html#details">🧾 My Details</a>
                <button role="menuitem" type="button" data-customer-logout>🚪 Logout</button>
            </div>`;

        const trigger = host.querySelector(".customer-menu-trigger");
        trigger?.addEventListener("click", () => {
            const open = host.classList.toggle("open");
            trigger.setAttribute("aria-expanded", String(open));
        });

        host.querySelector("[data-customer-logout]")?.addEventListener("click", async () => {
            const button = host.querySelector("[data-customer-logout]");
            if (button) button.disabled = true;
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                renderSignedOut();
                host.querySelector(".customer-signin-link")?.focus();
            } catch (error) {
                console.error("Customer logout failed:", error);
                if (button) {
                    button.disabled = false;
                    button.textContent = "Logout failed — try again";
                }
            }
        });
    };

    // Escape user-supplied name before inserting it into the menu.
    function escapeMenuText(value) {
        return String(value).replace(/[&<>"']/g, (char) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            '"': "&quot;", "'": "&#39;"
        })[char]);
    }

    renderSignedOut();

    supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
            console.error("Could not read customer session:", error);
            return;
        }
        if (data?.session?.user) renderSignedIn(data.session.user);
        else renderSignedOut();
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) renderSignedIn(session.user);
        else renderSignedOut();
    });

    document.addEventListener("click", (event) => {
        if (!host.contains(event.target)) {
            host.classList.remove("open");
            host.querySelector(".customer-menu-trigger")?.setAttribute("aria-expanded", "false");
        }
    });
}


// ============================================================
// CURRENT YEAR
// ============================================================

function initializeYear() {

    const yearElements =
        document.querySelectorAll("#year");

    const currentYear =
        new Date().getFullYear();

    yearElements.forEach(element => {

        element.textContent =
            currentYear;

    });

}


// ============================================================
// SMOOTH SCROLL
// ============================================================

function initializeSmoothScroll() {

    const links =
        document.querySelectorAll(
            'a[href^="#"]'
        );

    links.forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const targetId =
                    link.getAttribute("href");

                if (
                    !targetId ||
                    targetId === "#" ||
                    targetId.length <= 1
                ) {
                    return;
                }

                const target =
                    document.querySelector(
                        targetId
                    );

                if (!target) {
                    return;
                }

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    });

}


// ============================================================
// FLOATING BUTTONS
// ============================================================

function initializeFloatingButtons() {

    const callButtons =
        document.querySelectorAll(
            'a[href^="tel:"]'
        );

    callButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {
                // Mobile/browser handles the call.
            }
        );

    });

}


// ============================================================
// LOAD BARTAN ITEMS
// ============================================================

async function loadBartanItems() {

    const container =
        document.getElementById(
            "bartanList"
        );

    if (!container) {
        return;
    }

    showBartanLoading(container);


    try {

        /*
         * IMPORTANT
         *
         * Homepage अब direct stock calculation नहीं करेगा.
         *
         * Public RPC:
         *
         * get_public_bartan_availability()
         *
         * यह:
         *
         * Total Stock
         * - Missing
         * - Damaged
         * - Confirmed Reservation
         * - Issued
         * - Return Pending
         *
         * के आधार पर available quantity देता है.
         */

        const {
            data,
            error
        } = await supabase.rpc(
            "get_public_bartan_availability"
        );


        if (error) {

            console.error(
                "Bartan availability error:",
                error
            );

            showBartanError(container);

            return;
        }


        bartanItems =
            Array.isArray(data)
                ? data
                : [];


        if (bartanItems.length === 0) {

            showBartanEmpty(container);

            return;
        }


        renderBartanItems(container);

    } catch (error) {

        console.error(
            "Unexpected bartan error:",
            error
        );

        showBartanError(container);

    }

}


// ============================================================
// BARTAN LOADING UI
// ============================================================

function showBartanLoading(container) {

    container.innerHTML = `
        <div class="bartan-loading">

            <div class="loading-spinner"></div>

            <p>
                Bartan items load ho rahe hain...
            </p>

        </div>
    `;

}


// ============================================================
// BARTAN ERROR UI
// ============================================================

function showBartanError(container) {

    container.innerHTML = `
        <div class="bartan-empty">

            <i class="fas fa-circle-exclamation"></i>

            <h3>
                Items load nahi ho paaye
            </h3>

            <p>
                Please thodi der baad dobara try karein.
            </p>

        </div>
    `;

}


// ============================================================
// BARTAN EMPTY UI
// ============================================================

function showBartanEmpty(container) {

    container.innerHTML = `
        <div class="bartan-empty">

            <i class="fas fa-box-open"></i>

            <h3>
                Abhi items available nahi hain
            </h3>

            <p>
                Bartan availability ke liye humein contact karein.
            </p>

        </div>
    `;

}


// ============================================================
// RENDER BARTAN ITEMS
// ============================================================

function renderBartanItems(container) {

    container.innerHTML = "";

    bartanItems.forEach(item => {

        const itemCard =
            createBartanCard(item);

        container.appendChild(
            itemCard
        );

    });

}


// ============================================================
// CREATE BARTAN CARD
// ============================================================

function createBartanCard(item) {

    const card =
        document.createElement("div");

    card.className =
        "bartan-card";


    // ========================================================
    // ITEM DATA
    // ========================================================

    const itemId =
        item.id;

    const itemName =
        item.name ||
        "Bartan Item";


    /*
     * RPC directly available quantity देता है.
     *
     * इसलिए यहां:
     *
     * stock - missing - damaged
     *
     * दोबारा calculate नहीं किया जाएगा.
     */

    let availableStock =
        getNumber(
            item.available_quantity
        );


    if (availableStock < 0) {

        availableStock = 0;

    }


    // ========================================================
    // STATUS
    // ========================================================

    const isAvailable =
        availableStock > 0;


    const statusText =
        isAvailable
            ? `Available: ${availableStock}`
            : "Currently unavailable";


    const statusClass =
        isAvailable
            ? "available"
            : "unavailable";


    // ========================================================
    // CARD HTML
    // ========================================================

    card.innerHTML = `
        <div class="bartan-card-icon">

            <i class="fas fa-utensils"></i>

        </div>

        <div class="bartan-card-content">

            <span class="bartan-category">
                Bartan
            </span>

            <h3>
                ${escapeHTML(itemName)}
            </h3>

            <div class="bartan-status ${statusClass}">

                <span class="status-dot"></span>

                ${escapeHTML(statusText)}

            </div>

            <button
                type="button"
                class="bartan-select-btn"
                data-id="${escapeHTML(String(itemId))}"
                ${!isAvailable ? "disabled" : ""}
            >

                ${
                    isAvailable
                        ? '<i class="fas fa-plus"></i> Select Item'
                        : '<i class="fas fa-ban"></i> Not Available'
                }

            </button>

        </div>
    `;


    const selectButton =
        card.querySelector(
            ".bartan-select-btn"
        );


    if (
        selectButton &&
        isAvailable
    ) {

        selectButton.addEventListener(
            "click",
            () => {

                addSelectedItem(item);

            }
        );

    }


    return card;

}


// ============================================================
// ADD SELECTED ITEM
// ============================================================

function addSelectedItem(item) {

    const itemId =
        String(item.id);


    const alreadySelected =
        selectedItems.some(
            selected =>
                String(selected.id) ===
                itemId
        );


    if (alreadySelected) {

        showSmallMessage(
            "Ye item already selected hai."
        );

        return;
    }


    selectedItems.push(item);

    saveSelectedItems();

    renderSelectedItems();

    showSmallMessage(
        `${getItemName(item)} selected.`
    );

}


// ============================================================
// REMOVE SELECTED ITEM
// ============================================================

function removeSelectedItem(itemId) {

    selectedItems =
        selectedItems.filter(
            item =>
                String(item.id) !==
                String(itemId)
        );


    saveSelectedItems();

    renderSelectedItems();

}


// ============================================================
// SELECTED ITEMS INITIALIZATION
// ============================================================

function initializeSelectedItems() {

    loadSelectedItems();

    renderSelectedItems();

}


// ============================================================
// SAVE SELECTED ITEMS
// ============================================================

function saveSelectedItems() {

    try {

        const safeItems =
            selectedItems.map(item => ({

                id:
                    item.id,

                name:
                    item.name ||
                    "Bartan Item",

                category:
                    "Bartan"

            }));


        localStorage.setItem(
            "vijaySelectedBartanItems",
            JSON.stringify(
                safeItems
            )
        );

    } catch (error) {

        console.warn(
            "Selected items save failed:",
            error
        );

    }

}


// ============================================================
// LOAD SELECTED ITEMS
// ============================================================

function loadSelectedItems() {

    try {

        const saved =
            localStorage.getItem(
                "vijaySelectedBartanItems"
            );


        if (!saved) {
            return;
        }


        const parsed =
            JSON.parse(saved);


        if (Array.isArray(parsed)) {

            selectedItems =
                parsed;

        }

    } catch (error) {

        console.warn(
            "Selected items load failed:",
            error
        );

        selectedItems = [];

    }

}


// ============================================================
// RENDER SELECTED ITEMS
// ============================================================

function renderSelectedItems() {

    const container =
        document.getElementById(
            "selectedItems"
        );


    if (!container) {
        return;
    }


    if (
        selectedItems.length === 0
    ) {

        container.innerHTML = `
            <div class="selected-empty">

                <i class="fas fa-basket-shopping"></i>

                <p>
                    Abhi koi bartan select nahi kiya gaya hai.
                </p>

                <span>
                    Upar se required items select karein.
                </span>

            </div>
        `;

        return;

    }


    container.innerHTML = "";


    selectedItems.forEach(item => {

        const itemElement =
            document.createElement(
                "div"
            );


        itemElement.className =
            "selected-item";


        const itemName =
            getItemName(item);


        itemElement.innerHTML = `
            <div class="selected-item-info">

                <div class="selected-item-icon">

                    <i class="fas fa-check"></i>

                </div>

                <div>

                    <strong>
                        ${escapeHTML(itemName)}
                    </strong>

                    <span>
                        Bartan
                    </span>

                </div>

            </div>

            <button
                type="button"
                class="selected-remove-btn"
                data-id="${escapeHTML(String(item.id))}"
                aria-label="Remove ${escapeHTML(itemName)}"
            >

                <i class="fas fa-trash"></i>

            </button>
        `;


        const removeButton =
            itemElement.querySelector(
                ".selected-remove-btn"
            );


        if (removeButton) {

            removeButton.addEventListener(
                "click",
                () => {

                    removeSelectedItem(
                        item.id
                    );

                }
            );

        }


        container.appendChild(
            itemElement
        );

    });

}


// ============================================================
// GET ITEM NAME
// ============================================================

function getItemName(item) {

    return (
        item.name ||
        "Bartan Item"
    );

}


// ============================================================
// NUMBER HELPER
// ============================================================

function getNumber(value) {

    const number =
        Number(value);


    if (
        Number.isFinite(number)
    ) {

        return number;

    }


    return 0;

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    const text =
        String(value ?? "");


    return text
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// ============================================================
// SMALL MESSAGE
// ============================================================

function showSmallMessage(message) {

    let toast =
        document.getElementById(
            "siteToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "siteToast";

        toast.className =
            "site-toast";

        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.siteToastTimer
    );


    window.siteToastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2500);

}


// ============================================================
// CUSTOMER BOOKING HELPER
// ============================================================

function openCustomerBooking() {

    window.location.href =
        "./customer-booking.html";

}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.addSelectedItem =
    addSelectedItem;

window.removeSelectedItem =
    removeSelectedItem;

window.openCustomerBooking =
    openCustomerBooking;


// ============================================================
// END OF APP.JS
// ============================================================