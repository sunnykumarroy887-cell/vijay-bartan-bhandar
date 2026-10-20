import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ======================================================
// SUPABASE CONFIG
// ======================================================

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


// ======================================================
// DOM
// ======================================================

const decorationForm =
    document.getElementById("decorationForm");

const editDecorationForm =
    document.getElementById("editDecorationForm");

const decorationGrid =
    document.getElementById("decorationGrid");

const loadingState =
    document.getElementById("loadingState");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const categoryFilter =
    document.getElementById("categoryFilter");

const refreshBtn =
    document.getElementById("refreshBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const editModal =
    document.getElementById("editModal");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const resetFormBtn =
    document.getElementById("resetFormBtn");


// ======================================================
// STATE
// ======================================================

let decorations = [];


// ======================================================
// HELPERS
// ======================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showError(message) {

    alert(`Error: ${message}`);
}


function showSuccess(message) {

    alert(message);
}


function formatRate(value) {

    const number =
        Number(value || 0);

    return `₹${number.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}


function getImageHtml(item) {

    const url =
        String(item.image_url || "").trim();

    if (!url) {

        return `
            <div class="no-image">
                🌸
            </div>
        `;
    }

    return `
        <img
            class="decoration-image"
            src="${escapeHtml(url)}"
            alt="${escapeHtml(item.name)}"
            loading="lazy"
            onerror="this.outerHTML='<div class=&quot;no-image&quot;>🌸</div>'"
        >
    `;
}


// ======================================================
// ADMIN SECURITY
// ======================================================

async function verifyAdmin() {

    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {

        console.error(error);

        window.location.replace(
            "./admin-login.html"
        );

        return false;
    }


    const session = data.session;

    if (!session) {

        window.location.replace(
            "./admin-login.html"
        );

        return false;
    }


    if (session.user.id !== ADMIN_UID) {

        await supabase.auth.signOut();

        window.location.replace(
            "./admin-login.html"
        );

        return false;
    }


    return true;
}


// ======================================================
// LOAD DECORATIONS
// ======================================================

async function loadDecorations() {

    loadingState.classList.remove("hidden");

    emptyState.classList.add("hidden");

    decorationGrid.innerHTML = "";


    const {
        data,
        error
    } = await supabase
        .from("decorations")
        .select(`
            id,
            name,
            category,
            description,
            rate,
            image_url,
            display_order,
            is_active,
            created_at,
            updated_at
        `)
        .order("display_order", {
            ascending: true
        })
        .order("id", {
            ascending: true
        });


    loadingState.classList.add("hidden");


    if (error) {

        console.error(
            "Decoration load error:",
            error
        );

        showError(error.message);

        return;
    }


    decorations = data || [];

    updateSummary();

    populateCategoryFilter();

    renderDecorations();
}


// ======================================================
// SUMMARY
// ======================================================

function updateSummary() {

    const total =
        decorations.length;

    const active =
        decorations.filter(
            item => item.is_active === true
        ).length;

    const inactive =
        total - active;


    document.getElementById(
        "totalDecorations"
    ).textContent = total;


    document.getElementById(
        "activeDecorations"
    ).textContent = active;


    document.getElementById(
        "inactiveDecorations"
    ).textContent = inactive;
}


// ======================================================
// CATEGORY FILTER
// ======================================================

function populateCategoryFilter() {

    const current =
        categoryFilter.value;

    const categories =
        [
            ...new Set(
                decorations
                    .map(item =>
                        item.category
                    )
                    .filter(Boolean)
            )
        ]
        .sort();


    categoryFilter.innerHTML = `
        <option value="all">
            All Categories
        </option>
    `;


    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        categoryFilter.appendChild(option);

    });


    if (
        categories.includes(current)
    ) {

        categoryFilter.value =
            current;

    }

}


// ======================================================
// FILTER
// ======================================================

function getFilteredDecorations() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const status =
        statusFilter.value;

    const category =
        categoryFilter.value;


    return decorations.filter(item => {

        const matchesSearch =
            !search ||
            item.name
                ?.toLowerCase()
                .includes(search) ||
            item.category
                ?.toLowerCase()
                .includes(search) ||
            item.description
                ?.toLowerCase()
                .includes(search);


        const matchesStatus =
            status === "all" ||
            (
                status === "active" &&
                item.is_active === true
            ) ||
            (
                status === "inactive" &&
                item.is_active === false
            );


        const matchesCategory =
            category === "all" ||
            item.category === category;


        return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory
        );
    });
}


// ======================================================
// RENDER
// ======================================================

function renderDecorations() {

    const filtered =
        getFilteredDecorations();


    decorationGrid.innerHTML = "";


    if (filtered.length === 0) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    emptyState.classList.add(
        "hidden"
    );


    filtered.forEach(item => {

        const card =
            document.createElement("article");

        card.className =
            "decoration-card";


        const statusClass =
            item.is_active
                ? "status-active"
                : "status-inactive";


        const statusText =
            item.is_active
                ? "Active"
                : "Inactive";


        const description =
            item.description ||
            "No description added.";


        card.innerHTML = `

            ${getImageHtml(item)}

            <div class="decoration-content">

                <div class="decoration-title-row">

                    <div class="decoration-title">
                        ${escapeHtml(item.name)}
                    </div>

                    <span
                        class="status-badge ${statusClass}"
                    >
                        ${statusText}
                    </span>

                </div>


                ${
                    item.category
                    ? `
                        <span class="category">
                            ${escapeHtml(item.category)}
                        </span>
                    `
                    : ""
                }


                <p class="description">
                    ${escapeHtml(description)}
                </p>


                <div class="internal-rate">

                    Internal Rate:
                    <strong>
                        ${formatRate(item.rate)}
                    </strong>

                </div>


                <div class="card-actions">

                    <button
                        type="button"
                        class="secondary-btn edit-btn"
                        data-id="${item.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="danger-btn remove-btn"
                        data-id="${item.id}"
                    >
                        Remove
                    </button>

                </div>

            </div>
        `;


        decorationGrid.appendChild(card);

    });


    document
        .querySelectorAll(".edit-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    openEditModal(id);
                }
            );

        });


    document
        .querySelectorAll(".remove-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    removeDecoration(id);
                }
            );

        });
}


// ======================================================
// ADD DECORATION
// ======================================================

decorationForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            document
                .getElementById(
                    "decorationName"
                )
                .value
                .trim();


        const category =
            document
                .getElementById(
                    "decorationCategory"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "description"
                )
                .value
                .trim();


        const rate =
            Number(
                document
                    .getElementById(
                        "decorationRate"
                    )
                    .value || 0
            );


        const imageUrl =
            document
                .getElementById(
                    "imageUrl"
                )
                .value
                .trim();


        const displayOrder =
            Number(
                document
                    .getElementById(
                        "displayOrder"
                    )
                    .value || 0
            );


        if (!name) {

            showError(
                "Decoration name is required."
            );

            return;
        }


        if (rate < 0) {

            showError(
                "Rate cannot be negative."
            );

            return;
        }


        if (displayOrder < 0) {

            showError(
                "Display order cannot be negative."
            );

            return;
        }


        const submitButton =
            decorationForm.querySelector(
                'button[type="submit"]'
            );


        submitButton.disabled = true;

        submitButton.textContent =
            "Adding...";


        const {
            error
        } = await supabase.rpc(
            "admin_add_decoration",
            {
                p_name: name,
                p_category: category,
                p_description: description,
                p_rate: rate,
                p_image_url: imageUrl,
                p_display_order:
                    displayOrder
            }
        );


        submitButton.disabled = false;

        submitButton.textContent =
            "+ Add Decoration";


        if (error) {

            console.error(error);

            showError(error.message);

            return;
        }


        decorationForm.reset();

        document.getElementById(
            "decorationRate"
        ).value = "0";

        document.getElementById(
            "displayOrder"
        ).value = "0";


        showSuccess(
            "Decoration added successfully."
        );


        await loadDecorations();

    }
);


// ======================================================
// OPEN EDIT MODAL
// ======================================================

function openEditModal(id) {

    const item =
        decorations.find(
            decoration =>
                Number(decoration.id) === id
        );


    if (!item) {

        showError(
            "Decoration not found."
        );

        return;
    }


    document.getElementById(
        "editId"
    ).value = item.id;


    document.getElementById(
        "editName"
    ).value = item.name || "";


    document.getElementById(
        "editCategory"
    ).value = item.category || "";


    document.getElementById(
        "editRate"
    ).value = item.rate ?? 0;


    document.getElementById(
        "editDisplayOrder"
    ).value =
        item.display_order ?? 0;


    document.getElementById(
        "editImageUrl"
    ).value =
        item.image_url || "";


    document.getElementById(
        "editDescription"
    ).value =
        item.description || "";


    document.getElementById(
        "editActive"
    ).checked =
        item.is_active === true;


    editModal.classList.remove(
        "hidden"
    );
}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeEditModal() {

    editModal.classList.add(
        "hidden"
    );

    editDecorationForm.reset();
}


closeModalBtn.addEventListener(
    "click",
    closeEditModal
);


cancelEditBtn.addEventListener(
    "click",
    closeEditModal
);


editModal.addEventListener(
    "click",
    event => {

        if (
            event.target === editModal
        ) {

            closeEditModal();

        }

    }
);


// ======================================================
// UPDATE DECORATION
// ======================================================

editDecorationForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const id =
            Number(
                document
                    .getElementById(
                        "editId"
                    )
                    .value
            );


        const name =
            document
                .getElementById(
                    "editName"
                )
                .value
                .trim();


        const category =
            document
                .getElementById(
                    "editCategory"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "editDescription"
                )
                .value
                .trim();


        const rate =
            Number(
                document
                    .getElementById(
                        "editRate"
                    )
                    .value || 0
            );


        const imageUrl =
            document
                .getElementById(
                    "editImageUrl"
                )
                .value
                .trim();


        const displayOrder =
            Number(
                document
                    .getElementById(
                        "editDisplayOrder"
                    )
                    .value || 0
            );


        const isActive =
            document
                .getElementById(
                    "editActive"
                )
                .checked;


        if (!name) {

            showError(
                "Decoration name is required."
            );

            return;
        }


        const submitButton =
            editDecorationForm.querySelector(
                'button[type="submit"]'
            );


        submitButton.disabled = true;

        submitButton.textContent =
            "Saving...";


        const {
            error
        } = await supabase.rpc(
            "admin_update_decoration",
            {
                p_id: id,
                p_name: name,
                p_category: category,
                p_description: description,
                p_rate: rate,
                p_image_url: imageUrl,
                p_display_order:
                    displayOrder,
                p_is_active: isActive
            }
        );


        submitButton.disabled = false;

        submitButton.textContent =
            "Save Changes";


        if (error) {

            console.error(error);

            showError(error.message);

            return;
        }


        closeEditModal();

        showSuccess(
            "Decoration updated successfully."
        );


        await loadDecorations();

    }
);


// ======================================================
// REMOVE DECORATION
// ======================================================

async function removeDecoration(id) {

    const item =
        decorations.find(
            decoration =>
                Number(decoration.id) === id
        );


    if (!item) {

        showError(
            "Decoration not found."
        );

        return;
    }


    const confirmed =
        confirm(
            `Remove "${item.name}"?\n\n` +
            `If this decoration is already used ` +
            `in a booking, it will be made ` +
            `Inactive instead of being permanently deleted.`
        );


    if (!confirmed) {
        return;
    }


    const {
        data,
        error
    } = await supabase.rpc(
        "admin_remove_decoration",
        {
            p_id: id
        }
    );


    if (error) {

        console.error(error);

        showError(error.message);

        return;
    }


    if (data === "inactive") {

        showSuccess(
            "Decoration is now inactive because it is already used in a booking."
        );

    } else {

        showSuccess(
            "Decoration removed successfully."
        );

    }


    await loadDecorations();
}


// ======================================================
// SEARCH / FILTER EVENTS
// ======================================================

searchInput.addEventListener(
    "input",
    renderDecorations
);


statusFilter.addEventListener(
    "change",
    renderDecorations
);


categoryFilter.addEventListener(
    "change",
    renderDecorations
);


// ======================================================
// REFRESH
// ======================================================

refreshBtn.addEventListener(
    "click",
    async () => {

        refreshBtn.disabled = true;

        refreshBtn.textContent =
            "Refreshing...";

        await loadDecorations();

        refreshBtn.disabled = false;

        refreshBtn.textContent =
            "↻ Refresh";
    }
);


// ======================================================
// RESET FORM
// ======================================================

resetFormBtn.addEventListener(
    "click",
    () => {

        setTimeout(() => {

            document.getElementById(
                "decorationRate"
            ).value = "0";

            document.getElementById(
                "displayOrder"
            ).value = "0";

        }, 0);

    }
);


// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        const confirmed =
            confirm(
                "Do you want to logout?"
            );


        if (!confirmed) {
            return;
        }


        await supabase.auth.signOut();

        window.location.replace(
            "./admin-login.html"
        );
    }
);


// ======================================================
// INITIALIZATION
// ======================================================

async function init() {

    const isAdmin =
        await verifyAdmin();


    if (!isAdmin) {
        return;
    }


    await loadDecorations();
}


init();