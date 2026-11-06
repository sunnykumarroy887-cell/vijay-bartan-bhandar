// ============================================================
// ADMIN BARTAN MANAGEMENT
// Vijay Bartan Bhandar
// FINAL - CONNECTED WITH CURRENT admin-bartan.html
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// ============================================================
// SUPABASE CONFIG
// ============================================================

const SUPABASE_URL =
    "https://wkgkczrhgsmnmovyzuss.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E";

const ADMIN_UID =
    "540b68b8-044f-4ac5-bbd9-8014e31af801";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ============================================================
// DOM HELPER
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// DOM ELEMENTS
// ============================================================

const refreshButton = $("refreshButton");
const logoutButton = $("logoutButton");
const messageBox = $("message");
const searchInput = $("searchInput");


// Summary
const totalItems = $("totalItems");
const totalStock = $("totalStock");
const totalIssued = $("totalIssued");
const totalAvailable = $("totalAvailable");
const totalMissing = $("totalMissing");
const totalDamaged = $("totalDamaged");


// Forms
const addBartanForm = $("addBartanForm");
const editBartanForm = $("editBartanForm");
const stockForm = $("stockForm");


// Tables
const bartanTableBody = $("bartanTableBody");
const movementTableBody = $("movementTableBody");


// Modals
const editModal = $("editModal");
const stockModal = $("stockModal");


// ============================================================
// STATE
// ============================================================

let bartanItems = [];
let currentSearch = "";


// ============================================================
// MESSAGE
// ============================================================

function showMessage(text, type = "success") {

    if (!messageBox) {
        alert(text);
        return;
    }

    messageBox.textContent = text;
    messageBox.className = `message ${type}`;

    clearTimeout(showMessage.timer);

    showMessage.timer = setTimeout(() => {

        messageBox.textContent = "";
        messageBox.className = "message hidden";

    }, 4000);
}


// ============================================================
// ADMIN AUTHENTICATION
// ============================================================

async function verifyAdmin() {

    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {

        console.error(error);

        throw new Error(
            "Unable to verify login."
        );
    }

    const session = data?.session;

    if (!session?.user) {

        window.location.href =
            "./admin-login.html";

        return false;
    }


    if (session.user.id !== ADMIN_UID) {

        await supabase.auth.signOut();

        window.location.href =
            "./admin-login.html";

        return false;
    }

    return true;
}


// ============================================================
// LOAD BARTAN
// ============================================================

async function loadBartanItems() {

    const {
        data,
        error
    } = await supabase
        .from("admin_bartan_stock_view")
        .select(`
            id,
            name,
            rate,
            total_stock,
            available,
            missing,
            damaged,
            is_active,
            created_at,
            updated_at
        `)
        .order("id", {
            ascending: true
        });


    if (error) {

        console.error(
            "Bartan load error:",
            error
        );

        throw new Error(
            error.message ||
            "Unable to load bartan inventory."
        );
    }


    bartanItems = data || [];

    renderSummary();
    renderBartanTable();
}


// ============================================================
// SUMMARY
// ============================================================

function renderSummary() {

    let stock = 0;
    let available = 0;
    let missing = 0;
    let damaged = 0;


    for (const item of bartanItems) {

        stock += Number(
            item.total_stock || 0
        );

        available += Math.max(
            Number(item.available || 0),
            0
        );

        missing += Math.max(
            Number(item.missing || 0),
            0
        );

        damaged += Math.max(
            Number(item.damaged || 0),
            0
        );
    }


    const issued =
        Math.max(
            stock
            - available
            - missing
            - damaged,
            0
        );


    if (totalItems) {
        totalItems.textContent =
            bartanItems.length;
    }

    if (totalStock) {
        totalStock.textContent =
            stock;
    }

    if (totalIssued) {
        totalIssued.textContent =
            issued;
    }

    if (totalAvailable) {
        totalAvailable.textContent =
            available;
    }

    if (totalMissing) {
        totalMissing.textContent =
            missing;
    }

    if (totalDamaged) {
        totalDamaged.textContent =
            damaged;
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// FILTER
// ============================================================

function getFilteredItems() {

    const query =
        currentSearch
            .trim()
            .toLowerCase();


    if (!query) {
        return bartanItems;
    }


    return bartanItems.filter(item => {

        return String(item.name || "")
            .toLowerCase()
            .includes(query);

    });
}


// ============================================================
// RENDER TABLE
// ============================================================

function renderBartanTable() {

    if (!bartanTableBody) {
        return;
    }


    const items =
        getFilteredItems();


    if (!items.length) {

        bartanTableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    No bartan items found.
                </td>
            </tr>
        `;

        return;
    }


    bartanTableBody.innerHTML =
        items.map(item => {

            const total =
                Number(item.total_stock || 0);

            const available =
                Math.max(
                    Number(item.available || 0),
                    0
                );

            const missing =
                Math.max(
                    Number(item.missing || 0),
                    0
                );

            const damaged =
                Math.max(
                    Number(item.damaged || 0),
                    0
                );


            const issued =
                Math.max(
                    total
                    - available
                    - missing
                    - damaged,
                    0
                );


            const status =
                item.is_active
                    ? "Active"
                    : "Inactive";


            return `
                <tr>

                    <td>
                        ${escapeHTML(item.name)}
                    </td>

                    <td>
                        ₹${Number(
                            item.rate || 0
                        ).toFixed(2)}
                    </td>

                    <td>
                        ${total}
                    </td>

                    <td>
                        ${issued}
                    </td>

                    <td>
                        ${available}
                    </td>

                    <td>
                        ${missing}
                    </td>

                    <td>
                        ${damaged}
                    </td>

                    <td>

                        <span class="status ${
                            item.is_active
                                ? "active"
                                : "inactive"
                        }">

                            ${status}

                        </span>

                    </td>

                    <td>

                        <button
                            type="button"
                            class="edit-btn"
                            data-edit-id="${item.id}">
                            Edit
                        </button>

                        <button
                            type="button"
                            class="stock-btn"
                            data-stock-id="${item.id}">
                            Stock
                        </button>

                    </td>

                </tr>
            `;

        }).join("");
}


// ============================================================
// ADD BARTAN
// ============================================================

async function addBartan(event) {

    event.preventDefault();


    const name =
        String(
            $("newName")?.value || ""
        ).trim();


    const rate =
        Number(
            $("newRate")?.value || 0
        );


    const stock =
        Number(
            $("newStock")?.value || 0
        );


    if (!name) {

        showMessage(
            "Bartan name is required.",
            "error"
        );

        return;
    }


    if (
        !Number.isFinite(rate) ||
        rate < 0
    ) {

        showMessage(
            "Enter a valid rate.",
            "error"
        );

        return;
    }


    if (
        !Number.isInteger(stock) ||
        stock < 0
    ) {

        showMessage(
            "Enter a valid stock quantity.",
            "error"
        );

        return;
    }


    try {

        const {
            error
        } = await supabase.rpc(
            "admin_add_bartan",
            {
                p_name: name,
                p_rate: rate,
                p_stock_quantity: stock
            }
        );


        if (error) {
            throw error;
        }


        showMessage(
            "Bartan added successfully."
        );


        addBartanForm.reset();


        await loadBartanItems();
        await loadMovementHistory();


    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to add bartan.",
            "error"
        );
    }
}


// ============================================================
// OPEN EDIT MODAL
// ============================================================

function openEditModal(id) {

    const item =
        bartanItems.find(
            x =>
                Number(x.id) ===
                Number(id)
        );


    if (!item) {

        showMessage(
            "Bartan item not found.",
            "error"
        );

        return;
    }


    // IMPORTANT:
    // These IDs exactly match current HTML.

    const idField =
        $("editId");

    const nameField =
        $("editName");

    const rateField =
        $("editRate");

    const activeField =
        $("editActive");


    if (idField) {
        idField.value = item.id;
    }

    if (nameField) {
        nameField.value =
            item.name || "";
    }

    if (rateField) {
        rateField.value =
            item.rate ?? 0;
    }

    if (activeField) {
        activeField.checked =
            Boolean(item.is_active);
    }


    showModal(editModal);
}


// ============================================================
// UPDATE BARTAN
// ============================================================

async function updateBartan(event) {

    event.preventDefault();


    const id =
        Number(
            $("editId")?.value
        );


    const name =
        String(
            $("editName")?.value || ""
        ).trim();


    const rate =
        Number(
            $("editRate")?.value || 0
        );


    const isActive =
        Boolean(
            $("editActive")?.checked
        );


    if (!id) {

        showMessage(
            "Invalid bartan item.",
            "error"
        );

        return;
    }


    if (!name) {

        showMessage(
            "Bartan name is required.",
            "error"
        );

        return;
    }


    if (
        !Number.isFinite(rate) ||
        rate < 0
    ) {

        showMessage(
            "Enter a valid rate.",
            "error"
        );

        return;
    }


    try {

        const {
            error
        } = await supabase.rpc(
            "admin_update_bartan",
            {
                p_id: id,
                p_name: name,
                p_rate: rate,
                p_is_active: isActive
            }
        );


        if (error) {
            throw error;
        }


        showMessage(
            "Bartan updated successfully."
        );


        closeEditModal();


        await loadBartanItems();


    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to update bartan.",
            "error"
        );
    }
}


// ============================================================
// OPEN STOCK MODAL
// ============================================================

function openStockModal(id) {

    const item =
        bartanItems.find(
            x =>
                Number(x.id) ===
                Number(id)
        );


    if (!item) {

        showMessage(
            "Bartan item not found.",
            "error"
        );

        return;
    }


    // IMPORTANT:
    // IDs exactly match current HTML.

    const idField =
        $("stockId");

    const nameField =
        $("stockItemName");

    const changeField =
        $("stockChange");

    const actionField =
        $("stockAction");

    const noteField =
        $("stockNote");


    if (idField) {
        idField.value = item.id;
    }

    if (nameField) {
        nameField.textContent =
            item.name || "-";
    }

    if (changeField) {
        changeField.value = "";
    }

    if (actionField) {
        actionField.value = "add";
    }

    if (noteField) {
        noteField.value = "";
    }


    showModal(stockModal);
}


// ============================================================
// STOCK ADJUSTMENT
// ============================================================

async function adjustStock(event) {

    event.preventDefault();


    const id =
        Number(
            $("stockId")?.value
        );


    const quantity =
        Number(
            $("stockChange")?.value
        );


    const action =
        String(
            $("stockAction")?.value ||
            "add"
        );


    const note =
        String(
            $("stockNote")?.value || ""
        ).trim();


    if (!id) {

        showMessage(
            "Invalid bartan item.",
            "error"
        );

        return;
    }


    if (
        !Number.isInteger(quantity) ||
        quantity <= 0
    ) {

        showMessage(
            "Enter a valid whole-number quantity.",
            "error"
        );

        return;
    }


    if (!note) {

        showMessage(
            "Please enter a note.",
            "error"
        );

        return;
    }


    let change = quantity;
    let movementType = "stock_added";


    if (action === "remove") {

        change = -quantity;
        movementType = "stock_removed";

    }


    try {

        const {
            data,
            error
        } = await supabase.rpc(
            "admin_adjust_bartan_stock",
            {
                p_id: id,
                p_change: change,
                p_movement_type: movementType,
                p_note: note
            }
        );


        if (error) {
            throw error;
        }


        showMessage(
            `Stock updated successfully. New physical stock: ${data}`
        );


        closeStockModal();


        await loadBartanItems();
        await loadMovementHistory();


    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to update stock.",
            "error"
        );
    }
}


// ============================================================
// LOAD MOVEMENT HISTORY
// ============================================================

async function loadMovementHistory() {

    if (!movementTableBody) {
        return;
    }


    const {
        data,
        error
    } = await supabase
        .from("bartan_stock_movements")
        .select(`
            id,
            bartan_item_id,
            movement_type,
            quantity,
            note,
            created_at
        `)
        .order("created_at", {
            ascending: false
        })
        .limit(100);


    if (error) {

        console.error(
            "Movement history error:",
            error
        );


        movementTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load movement history.
                </td>
            </tr>
        `;


        return;
    }


    if (!data?.length) {

        movementTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    No stock movements found.
                </td>
            </tr>
        `;


        return;
    }


    movementTableBody.innerHTML =
        data.map(movement => {

            const item =
                bartanItems.find(
                    x =>
                        Number(x.id) ===
                        Number(
                            movement.bartan_item_id
                        )
                );


            const date =
                movement.created_at
                    ? new Date(
                        movement.created_at
                    ).toLocaleString(
                        "en-IN"
                    )
                    : "-";


            return `
                <tr>

                    <td>
                        ${date}
                    </td>

                    <td>
                        ${escapeHTML(
                            item?.name ||
                            `Item #${movement.bartan_item_id}`
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            movement.movement_type
                        )}
                    </td>

                    <td>
                        ${Number(
                            movement.quantity || 0
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            movement.note || "-"
                        )}
                    </td>

                </tr>
            `;

        }).join("");
}


// ============================================================
// MODAL HELPERS
// ============================================================

function showModal(modal) {

    if (!modal) {
        return;
    }


    // Current HTML uses "hidden".
    modal.classList.remove("hidden");

    // Also support CSS that uses "show".
    modal.classList.add("show");
}


function hideModal(modal) {

    if (!modal) {
        return;
    }


    modal.classList.remove("show");
    modal.classList.add("hidden");
}


// ============================================================
// CLOSE EDIT
// ============================================================

function closeEditModal() {

    hideModal(editModal);
}


// ============================================================
// CLOSE STOCK
// ============================================================

function closeStockModal() {

    hideModal(stockModal);
}


// ============================================================
// TABLE BUTTONS
// ============================================================

function handleBartanTableClick(event) {


    const editButton =
        event.target.closest(
            "[data-edit-id]"
        );


    if (editButton) {

        openEditModal(
            editButton.dataset.editId
        );

        return;
    }


    const stockButton =
        event.target.closest(
            "[data-stock-id]"
        );


    if (stockButton) {

        openStockModal(
            stockButton.dataset.stockId
        );

        return;
    }
}


// ============================================================
// SEARCH
// ============================================================

function handleSearch(event) {

    currentSearch =
        String(
            event.target.value || ""
        );


    renderBartanTable();
}


// ============================================================
// REFRESH
// ============================================================

async function refreshAll() {

    try {

        if (refreshButton) {
            refreshButton.disabled = true;
        }


        await loadBartanItems();
        await loadMovementHistory();


        showMessage(
            "Bartan data refreshed."
        );


    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to refresh data.",
            "error"
        );


    } finally {

        if (refreshButton) {
            refreshButton.disabled = false;
        }
    }
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    try {

        await supabase.auth.signOut();

    } catch (error) {

        console.error(error);

    } finally {

        window.location.href =
            "./admin-login.html";
    }
}


// ============================================================
// MODAL EVENTS
// ============================================================

function setupModalEvents() {


    // Edit modal background
    editModal?.addEventListener(
        "click",
        event => {

            if (
                event.target === editModal
            ) {

                closeEditModal();
            }
        }
    );


    // Stock modal background
    stockModal?.addEventListener(
        "click",
        event => {

            if (
                event.target === stockModal
            ) {

                closeStockModal();
            }
        }
    );


    // Escape key
    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


            closeEditModal();
            closeStockModal();

        }
    );
}


// ============================================================
// EVENTS
// ============================================================

function setupEvents() {


    refreshButton?.addEventListener(
        "click",
        refreshAll
    );


    logoutButton?.addEventListener(
        "click",
        logout
    );


    addBartanForm?.addEventListener(
        "submit",
        addBartan
    );


    editBartanForm?.addEventListener(
        "submit",
        updateBartan
    );


    stockForm?.addEventListener(
        "submit",
        adjustStock
    );


    bartanTableBody?.addEventListener(
        "click",
        handleBartanTableClick
    );


    searchInput?.addEventListener(
        "input",
        handleSearch
    );


    // Edit close button
    $("closeEditModal")?.addEventListener(
        "click",
        closeEditModal
    );


    // Edit cancel button
    $("cancelEdit")?.addEventListener(
        "click",
        closeEditModal
    );


    // Stock close button
    $("closeStockModal")?.addEventListener(
        "click",
        closeStockModal
    );


    // Stock cancel button
    $("cancelStock")?.addEventListener(
        "click",
        closeStockModal
    );


    setupModalEvents();
}


// ============================================================
// INITIALIZATION
// ============================================================

async function init() {

    try {

        const verified =
            await verifyAdmin();


        if (!verified) {
            return;
        }


        setupEvents();


        await loadBartanItems();

        await loadMovementHistory();


    } catch (error) {

        console.error(
            "Admin bartan initialization error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to load admin bartan panel.",
            "error"
        );
    }
}


// ============================================================
// START
// ============================================================

init();