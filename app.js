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
    const menuButton = document.getElementById("menuBtn");
    const nav = document.getElementById("mainNavigation");
    const header = document.querySelector(".header");

    if (!menuButton || !nav) return;

    const closeMenu = () => {
        nav.classList.remove("active");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open Menu");
        menuButton.textContent = "☰";
    };

    const openMenu = () => {
        nav.classList.add("active");
        menuButton.setAttribute("aria-expanded", "true");
        menuButton.setAttribute("aria-label", "Close Menu");
        menuButton.textContent = "✕";
    };

    // One click handler only: avoids opening and immediately closing the menu.
    menuButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        nav.classList.contains("active") ? closeMenu() : openMenu();
    });

    nav.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", (event) => {
        if (header && !header.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
    });

    // Compact the sticky title bar as the visitor scrolls.
    const updateHeader = () => {
        if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
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
        const name = (metadata.full_name || metadata.name || "My Account").trim();
        const initial = (name.charAt(0) || "V").toUpperCase();
        const safeName = escapeMenuText(name);
        host.innerHTML = `
            <section class="customer-menu-welcome" aria-label="Customer account">
                <div class="customer-menu-welcome-art" aria-hidden="true">✦</div>
                <div class="customer-menu-profile-head">
                    <span class="customer-menu-avatar">${initial}</span>
                    <span class="customer-menu-identity">
                        <strong>${safeName}</strong>
                        <small>Welcome back · Vijay family</small>
                    </span>
                    <span class="customer-menu-verified" aria-label="Signed in">✓</span>
                </div>
                <div class="customer-menu-member-note"><span>●</span> Your account is securely signed in</div>
            </section>
            <button class="customer-menu-trigger" type="button"
                aria-expanded="false" aria-haspopup="true">
                <span class="customer-trigger-icon" aria-hidden="true">▦</span>
                <span class="customer-trigger-copy"><strong>My Account</strong><small>Bookings, profile & services</small></span>
                <span class="customer-trigger-chevron" aria-hidden="true">⌄</span>
            </button>
            <div class="customer-menu-dropdown" role="menu">
                <div class="customer-menu-group-label"><span>YOUR SERVICES</span><i>ACCOUNT</i></div>
                <a class="customer-menu-item" role="menuitem" href="./customer-profile.html">
                    <span class="menu-item-icon">♙</span><span class="customer-menu-item-copy"><strong>My Profile</strong><small>Personal details and account</small></span><b>›</b>
                </a>
                <a class="customer-menu-item" role="menuitem" href="./customer-profile.html#bookingHistory">
                    <span class="menu-item-icon">▤</span><span class="customer-menu-item-copy"><strong>My Bookings</strong><small>History, invoices and payments</small></span><b>›</b>
                </a>
                <a class="customer-menu-item" role="menuitem" href="./customer-tracking.html">
                    <span class="menu-item-icon">⌕</span><span class="customer-menu-item-copy"><strong>Track Booking</strong><small>Live booking status and updates</small></span><b>›</b>
                </a>
                <a class="customer-menu-item customer-menu-new" role="menuitem" href="./booking-options.html">
                    <span class="menu-item-icon">＋</span><span class="customer-menu-item-copy"><strong>New Booking</strong><small>Bartan, decoration or both</small></span><b>›</b>
                </a>
                <div class="customer-menu-group-label customer-menu-settings-label"><span>PROFILE & SECURITY</span><i>SETTINGS</i></div>
                <a class="customer-menu-item" role="menuitem" href="./customer-profile.html#details">
                    <span class="menu-item-icon">⚙</span><span class="customer-menu-item-copy"><strong>My Details</strong><small>View your saved information</small></span><b>›</b>
                </a>
                <button class="customer-menu-item customer-menu-logout" role="menuitem" type="button" data-customer-logout>
                    <span class="menu-item-icon">↪</span><span class="customer-menu-item-copy"><strong>Logout</strong><small>Sign out of your account</small></span><b>›</b>
                </button>
                <div class="customer-menu-footer"><span>श्री गणेशाय नमः</span><small>Vijay Bartan Bhandar · Customer Care</small></div>
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
                    button.querySelector("strong").textContent = "Logout failed — try again";
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



/* ============================================================
   ITEM-SPECIFIC BARTAN ICONS — INLINE SVG, NO EXTERNAL DEPENDENCY
============================================================ */
function getBartanPhotoMeta(itemName) {
    const name = String(itemName || "").toLocaleLowerCase("hi");
    const photos = [
        { match: /टोपिया|topiya/, position: "0% 0%" },
        { match: /नादी|nadi|नांदी/, position: "50% 0%" },
        { match: /लोहिया|lohiya/, position: "100% 0%" },
        { match: /कठौता|kathauta/, position: "0% 100%" },
        { match: /झांझ|झांझ|jhanjh|jhanj/, position: "50% 100%" },
        { match: /कलछुल|कलछू|kalchhu|kalchul|ladle/, position: "100% 100%" }
    ];
    return photos.find(photo => photo.match.test(name)) || null;
}

function getBartanIcon(itemName) {
    const name = String(itemName || "").toLocaleLowerCase("hi");
    const icons = [
        { match: /टोपिया|topiya|cooking pot|stock pot/, label: "Cooking pot", path: '<path d="M5 9h14l-1.2 10H6.2L5 9Z"/><path d="M8 9V6h8v3M3 11h2m14 0h2M9 5V3h6v2"/>' },
        { match: /नादी|nadi|नांदी|basin|tub/, label: "Basin", path: '<path d="M3 10h18l-2 8H5l-2-8Z"/><path d="M6 10V7h12v3M8 18v2m8-2v2"/>' },
        { match: /लोहिया|lohiya|कड़ाही|karahi|wok/, label: "Cooking kadai", path: '<path d="M4 10c0 5 3.5 8 8 8s8-3 8-8H4Z"/><path d="M4 10H2m18 0h2M8 7c1-2 7-2 8 0"/>' },
        { match: /ट्रे|tray/, label: "Serving tray", path: '<rect x="3" y="7" width="18" height="11" rx="2"/><path d="M7 7V5h10v2M8 18v2m8-2v2"/>' },
        { match: /चूल्हा|chulha|stove|burner/, label: "Stove", path: '<rect x="4" y="9" width="16" height="10" rx="2"/><path d="M8 9V6h8v3M9 14h6M12 3c2 2 2 3 0 5-2-2-2-3 0-5Z"/>' },
        { match: /बाल्टी.*स्टील|steel bucket|steel pail/, label: "Steel bucket", path: '<path d="M5 8h14l-1.5 12h-11L5 8Z"/><path d="M7 8a5 5 0 0 1 10 0M8 11h8"/>' },
        { match: /बाल्टी.*प्लास्टिक|plastic bucket|plastic pail/, label: "Plastic bucket", path: '<path d="M5 8h14l-1.5 12h-11L5 8Z"/><path d="M7 8a5 5 0 0 1 10 0M8 11h8"/><path d="M7 14h10"/>' },
        { match: /कलछुल.*छोटा|छोटा.*कलछुल|small ladle/, label: "Small ladle", path: '<path d="M8 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"/><path d="m13 8 5 12"/>' },
        { match: /कलछुल.*बड़ा|बड़ा.*कलछुल|large ladle/, label: "Large ladle", path: '<path d="M6 7a6 6 0 1 0 12 0 6 6 0 0 0-12 0Z"/><path d="m13 12 5 8"/>' },
        { match: /कठौता|kathauta|कठौता|basin bowl/, label: "Large bowl", path: '<path d="M3 9c0 6 4 10 9 10s9-4 9-10H3Z"/><path d="M5 9c1-3 13-3 14 0M8 19v2m8-2v2"/>' },
        { match: /जग|jug|pitcher/, label: "Water jug", path: '<path d="M7 5h8v15H7z"/><path d="M15 8h3l2 3v6h-5M9 5V3h4v2M9 9h4"/>' },
        { match: /छोलनी|छलनी|छलनी|strainer|sieve/, label: "Strainer", path: '<path d="M4 7h16l-2 7H6L4 7Z"/><path d="M8 14v6m4-6v6m4-6v6M7 10h.1m3 .0h.1m3 0h.1m3 0h.1"/>' },
        { match: /पंजा|panja|serving fork|fork/, label: "Serving fork", path: '<path d="M8 3v7m3-7v7m3-7v7M7 10h8c0 3-1 4-4 4v7"/>' },
        { match: /झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांझ|झांঝ|ঝাঁঝ|cymbal|metal plate/, label: "Metal cymbals", path: '<ellipse cx="8" cy="12" rx="5" ry="8"/><ellipse cx="16" cy="12" rx="5" ry="8"/><path d="M8 4v16m8-16v16"/>' },
        { match: /दरी|dari|rug|mat/, label: "Floor mat", path: '<rect x="4" y="5" width="16" height="14" rx="1"/><path d="M7 5v14m3-14v14m3-14v14m3-14v14M4 8h16m-16 4h16m-16 4h16"/>' },
        { match: /ड्रम|drum|barrel/, label: "Storage drum", path: '<path d="M5 5c0-2 14-2 14 0v14c0 2-14 2-14 0V5Z"/><path d="M5 9c0 2 14 2 14 0M5 15c0 2 14 2 14 0M8 3v18m8-18v18"/>' }
    ];
    const found = icons.find(icon => icon.match.test(name));
    const fallback = '<path d="M4 8h16l-2 11H6L4 8Z"/><path d="M8 8V5h8v3M9 12h6"/>';
    const path = found?.path || fallback;
    const label = found?.label || "Bartan item";
    return `<svg class="bartan-item-svg" viewBox="0 0 24 24" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</g></svg>`;
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

    const photoMeta = getBartanPhotoMeta(itemName);
    const photoMarkup = photoMeta ? `
        <div class="bartan-card-photo"
             role="img"
             aria-label="${escapeHTML(itemName)} की फोटो"
             style="--bartan-photo-position:${photoMeta.position}">
            <span class="bartan-photo-logo">${getBartanIcon(itemName)}</span>
            <span class="bartan-photo-caption">भोज के बर्तन</span>
        </div>
    ` : `
        <div class="bartan-card-icon">${getBartanIcon(itemName)}</div>
    `;

    card.innerHTML = `
        ${photoMarkup}

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

                    ${getBartanIcon(itemName)}

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

// PROGRESSIVE WEB APP INSTALL
let deferredInstallPrompt = null;
function initializePwaInstall() {
    const button = document.getElementById("installAppBtn");
    if (!button) return;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (standalone) { button.hidden = true; return; }
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        button.hidden = false;
    });
    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        button.hidden = true;
        button.textContent = "✓ App Installed";
    });
    button.addEventListener("click", async () => {
        if (!deferredInstallPrompt) {
            alert("Chrome ke ⋮ menu me 'Install app' ya 'Add to Home screen' option select karein.");
            return;
        }
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        button.hidden = true;
    });
}
if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js")
            .catch((error) => console.warn("PWA service worker registration failed:", error));
    });
}
document.addEventListener("DOMContentLoaded", initializePwaInstall);
