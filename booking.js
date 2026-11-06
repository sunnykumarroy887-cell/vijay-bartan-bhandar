import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// =========================================================
// SUPABASE CONFIG
// =========================================================

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


// =========================================================
// GLOBAL DATA
// =========================================================

let bartanItems = [];
let decorations = [];
let bookings = [];
let selectedBookingId = null;


// =========================================================
// DOM HELPER
// =========================================================

const $ = (id) =>
    document.getElementById(id);


// =========================================================
// MONEY
// =========================================================

function money(value) {

    const number =
        Number(value) || 0;

    return "₹" +
        number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


// =========================================================
// HTML SECURITY
// =========================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =========================================================
// TOAST
// =========================================================

function showToast(message) {

    const toast = $("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        window.__toastTimer
    );

    window.__toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3000);
}


// =========================================================
// ADMIN AUTHORIZATION
//
// IMPORTANT:
// No admin_settings verification.
// Admin = Supabase Auth session + fixed UID.
// =========================================================

async function verifyAdmin() {

    try {

        const {
            data,
            error
        } =
            await supabase.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            window.location.replace(
                "./admin-login.html"
            );

            return false;
        }


        const session =
            data?.session;


        const user =
            session?.user;


        if (!user) {

            window.location.replace(
                "./admin-login.html"
            );

            return false;
        }


        if (
            user.id !==
            ADMIN_UID
        ) {

            console.error(
                "Unauthorized UID:",
                user.id
            );

            await supabase.auth.signOut();

            alert(
                "This account is not authorized to access Booking Management."
            );

            window.location.replace(
                "./admin-login.html"
            );

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

        window.location.replace(
            "./admin-login.html"
        );

        return false;
    }
}


// =========================================================
// LOAD BARTAN ITEMS
//
// IMPORTANT:
// We intentionally fetch ALL rows first.
// is_active is checked in JavaScript.
// This makes the loading more reliable and also
// lets us detect database/API problems clearly.
// =========================================================

async function loadBartanItems() {

    const container =
        $("bartanSelection");


    if (container) {

        container.innerHTML = `
            <div class="loading">
                Loading Bartan items...
            </div>
        `;

    }


    try {

        // Make sure a valid admin session exists
        // before making the database request.

        const authorized =
            await verifyAdmin();


        if (!authorized) {
            return;
        }


        const {
            data,
            error
        } =
            await supabase
                .from("bartan_items")
                .select(
                    "id,name,rate,stock_quantity,is_active"
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Bartan database error:",
                error
            );

            bartanItems = [];


            if (container) {

                container.innerHTML = `
                    <div class="empty-state">
                        <strong>
                            Unable to load Bartan items.
                        </strong>

                        <br><br>

                        ${escapeHTML(
                            error.message ||
                            "Database request failed."
                        )}
                    </div>
                `;

            }

            return;
        }


        console.log(
            "Bartan data received:",
            data
        );


        // Only active items are used.
        // The database data itself is not modified.

        bartanItems =
            (data || [])
                .filter(
                    item =>
                        item.is_active === true
                );


        console.log(
            "Active Bartan items:",
            bartanItems
        );


        if (!bartanItems.length) {

            if (container) {

                container.innerHTML = `
                    <div class="empty-state">

                        <strong>
                            No Bartan items are currently active.
                        </strong>

                        <br><br>

                        Please activate Bartan items
                        from Admin Panel.

                    </div>
                `;

            }

            return;
        }


        renderBartanRows();

    } catch (error) {

        console.error(
            "Bartan loading exception:",
            error
        );

        bartanItems = [];


        if (container) {

            container.innerHTML = `
                <div class="empty-state">

                    <strong>
                        Bartan loading failed.
                    </strong>

                    <br><br>

                    ${escapeHTML(
                        error.message ||
                        "Unknown error"
                    )}

                </div>
            `;

        }

    }

}


// =========================================================
// LOAD DECORATIONS
// =========================================================

async function loadDecorations() {

    try {

        const {
            data,
            error
        } =
            await supabase
                .from("decorations")
                .select(
                    "id,name,category,description,rate,is_active"
                )
                .eq(
                    "is_active",
                    true
                )
                .order("id");


        if (error) {

            console.error(
                "Decoration load error:",
                error
            );

            decorations = [];

            showToast(
                "Unable to load decorations."
            );

            return;
        }


        decorations =
            data || [];


        renderDecorationOptions();

    } catch (error) {

        console.error(
            "Decoration exception:",
            error
        );

    }

}


// =========================================================
// CREATE BARTAN ROW
// =========================================================

function createBartanRow() {

    const row =
        document.createElement("div");

    row.className =
        "bartan-row";


    const select =
        document.createElement("select");

    select.className =
        "item-select";


    select.innerHTML = `
        <option value="">
            Select Bartan Item
        </option>
    `;


    bartanItems.forEach(item => {

        const option =
            document.createElement("option");


        option.value =
            item.id;


        option.dataset.rate =
            item.rate;


        option.textContent =
            item.name +
            " — " +
            money(item.rate) +
            "/day";


        select.appendChild(
            option
        );

    });


    const quantity =
        document.createElement("input");


    quantity.type =
        "number";


    quantity.className =
        "quantity-input";


    quantity.min =
        "1";


    quantity.step =
        "1";


    quantity.value =
        "1";


    quantity.placeholder =
        "Qty";


    const rate =
        document.createElement("div");


    rate.className =
        "rate-display";


    rate.textContent =
        "Rate: ₹0.00";


    const amount =
        document.createElement("div");


    amount.className =
        "amount-display";


    amount.textContent =
        "₹0.00";


    const remove =
        document.createElement("button");


    remove.type =
        "button";


    remove.className =
        "remove-bartan";


    remove.textContent =
        "×";


    remove.title =
        "Remove";


    select.addEventListener(
        "change",
        () => {

            updateBartanRow(
                row,
                select,
                quantity,
                rate,
                amount
            );

        }
    );


    quantity.addEventListener(
        "input",
        () => {

            updateBartanRow(
                row,
                select,
                quantity,
                rate,
                amount
            );

        }
    );


    remove.addEventListener(
        "click",
        () => {

            row.remove();

            calculateTotals();

        }
    );


    row.appendChild(select);
    row.appendChild(quantity);
    row.appendChild(rate);
    row.appendChild(amount);
    row.appendChild(remove);


    return row;
}


// =========================================================
// UPDATE BARTAN ROW
// =========================================================

function updateBartanRow(
    row,
    select,
    quantity,
    rateElement,
    amountElement
) {

    const itemId =
        Number(select.value);


    const item =
        bartanItems.find(
            x =>
                Number(x.id) ===
                itemId
        );


    if (!item) {

        rateElement.textContent =
            "Rate: ₹0.00";


        amountElement.textContent =
            "₹0.00";


        calculateTotals();

        return;
    }


    const rate =
        Number(item.rate) || 0;


    const qty =
        Math.max(
            0,
            Number(quantity.value) || 0
        );


    const amount =
        rate * qty;


    rateElement.textContent =
        "Rate: " +
        money(rate) +
        "/day";


    amountElement.textContent =
        money(amount);


    calculateTotals();
}


// =========================================================
// RENDER BARTAN
// =========================================================

function renderBartanRows() {

    const container =
        $("bartanSelection");


    if (!container) {

        console.error(
            "bartanSelection element not found in booking.html"
        );

        return;
    }


    container.innerHTML = "";


    if (!bartanItems.length) {

        container.innerHTML = `
            <div class="empty-state">
                No active Bartan items available.
            </div>
        `;

        return;
    }


    container.appendChild(
        createBartanRow()
    );


    calculateTotals();
}


// =========================================================
// ADD BARTAN
// =========================================================

const addBartanButton =
    $("addBartanBtn");


if (addBartanButton) {

    addBartanButton.addEventListener(
        "click",
        () => {

            if (!bartanItems.length) {

                showToast(
                    "No Bartan items available."
                );

                return;
            }


            const container =
                $("bartanSelection");


            if (container) {

                container.appendChild(
                    createBartanRow()
                );

            }

        }
    );

}


// =========================================================
// COLLECT BARTAN ITEMS
// =========================================================

function collectBartanItems() {

    const rows =
        document.querySelectorAll(
            ".bartan-row"
        );


    const result = [];

    const duplicateCheck =
        new Set();


    for (const row of rows) {

        const select =
            row.querySelector(
                ".item-select"
            );


        const quantityInput =
            row.querySelector(
                ".quantity-input"
            );


        if (
            !select ||
            !quantityInput
        ) {

            continue;
        }


        const itemId =
            Number(select.value);


        const quantity =
            Number(quantityInput.value);


        if (!itemId) {

            continue;
        }


        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            throw new Error(
                "Bartan quantity must be greater than zero."
            );
        }


        if (
            duplicateCheck.has(itemId)
        ) {

            throw new Error(
                "Same Bartan item cannot be added twice."
            );
        }


        duplicateCheck.add(
            itemId
        );


        const item =
            bartanItems.find(
                x =>
                    Number(x.id) ===
                    itemId
            );


        if (!item) {

            throw new Error(
                "Selected Bartan item is no longer available."
            );
        }


        // =================================================
        // RATE LOCK
        // =================================================

        const lockedRate =
            Number(item.rate) || 0;


        result.push({

            bartan_item_id:
                item.id,

            item_name:
                item.name,

            quantity:
                quantity,

            locked_rate:
                lockedRate,

            amount:
                quantity *
                lockedRate

        });

    }


    return result;
}


// =========================================================
// DECORATION OPTIONS
// =========================================================

function renderDecorationOptions() {

    const select =
        $("decorationSelect");


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Select Decoration
        </option>
    `;


    decorations.forEach(item => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            item.id;


        option.dataset.rate =
            item.rate;


        option.textContent =
            item.name +
            " — " +
            money(item.rate);


        select.appendChild(
            option
        );

    });

}


// =========================================================
// DECORATION TOGGLE
// =========================================================

const decorationRequired =
    $("decorationRequired");


if (decorationRequired) {

    decorationRequired.addEventListener(
        "change",
        () => {

            const enabled =
                decorationRequired.checked;


            if ($("decorationBox")) {

                $("decorationBox")
                    .hidden =
                    !enabled;

            }


            if (!enabled) {

                if ($("decorationSelect")) {

                    $("decorationSelect")
                        .value = "";

                }


                if ($("decorationCharge")) {

                    $("decorationCharge")
                        .value = "0";

                }

            }


            calculateTotals();

        }
    );

}


// =========================================================
// DECORATION RATE
// =========================================================

const decorationSelect =
    $("decorationSelect");


if (decorationSelect) {

    decorationSelect.addEventListener(
        "change",
        () => {

            const option =
                decorationSelect
                    .selectedOptions[0];


            if (
                option &&
                option.value
            ) {

                $("decorationCharge")
                    .value =
                    Number(
                        option.dataset.rate ||
                        0
                    );

            } else {

                $("decorationCharge")
                    .value =
                    "0";

            }


            calculateTotals();

        }
    );

}


// =========================================================
// CALCULATION INPUTS
// =========================================================

[
    "decorationCharge",
    "deliveryCharge",
    "discount",
    "advance"
].forEach(id => {

    const input =
        $(id);


    if (input) {

        input.addEventListener(
            "input",
            calculateTotals
        );

    }

});


// =========================================================
// CALCULATE TOTALS
// =========================================================

function calculateTotals() {

    let bartanTotal = 0;


    document
        .querySelectorAll(
            ".bartan-row"
        )
        .forEach(row => {

            const select =
                row.querySelector(
                    ".item-select"
                );


            const quantityInput =
                row.querySelector(
                    ".quantity-input"
                );


            if (
                !select ||
                !quantityInput
            ) {

                return;
            }


            const item =
                bartanItems.find(
                    x =>
                        Number(x.id) ===
                        Number(select.value)
                );


            if (!item) {

                return;
            }


            const quantity =
                Number(
                    quantityInput.value
                ) || 0;


            bartanTotal +=
                Number(item.rate || 0) *
                quantity;

        });


    const decoration =
        $("decorationRequired") &&
        $("decorationRequired").checked
            ? Number(
                $("decorationCharge")?.value
            ) || 0
            : 0;


    const delivery =
        Number(
            $("deliveryCharge")?.value
        ) || 0;


    const discount =
        Number(
            $("discount")?.value
        ) || 0;


    const advance =
        Number(
            $("advance")?.value
        ) || 0;


    const finalTotal =
        Math.max(
            0,
            bartanTotal +
            decoration +
            delivery -
            discount
        );


    const remaining =
        Math.max(
            0,
            finalTotal -
            advance
        );


    if ($("bartanTotal")) {

        $("bartanTotal")
            .textContent =
            money(bartanTotal);

    }


    if ($("summaryBartan")) {

        $("summaryBartan")
            .textContent =
            money(bartanTotal);

    }


    if ($("summaryDecoration")) {

        $("summaryDecoration")
            .textContent =
            money(decoration);

    }


    if ($("summaryDelivery")) {

        $("summaryDelivery")
            .textContent =
            money(delivery);

    }


    if ($("summaryDiscount")) {

        $("summaryDiscount")
            .textContent =
            "- " +
            money(discount);

    }


    if ($("finalTotal")) {

        $("finalTotal")
            .textContent =
            money(finalTotal);

    }


    if ($("remainingAmount")) {

        $("remainingAmount")
            .textContent =
            money(remaining);

    }

}


// =========================================================
// DATE VALIDATION
// =========================================================

const eventDateInput =
    $("eventDate");


const returnDateInput =
    $("returnDate");


if (eventDateInput) {

    eventDateInput.addEventListener(
        "change",
        validateDates
    );

}


if (returnDateInput) {

    returnDateInput.addEventListener(
        "change",
        validateDates
    );

}


function validateDates() {

    const eventDate =
        $("eventDate")?.value;


    const returnDate =
        $("returnDate")?.value;


    if (
        eventDate &&
        returnDate &&
        returnDate < eventDate
    ) {

        $("returnDate")
            .setCustomValidity(
                "Return date cannot be before event date."
            );

    } else {

        $("returnDate")
            .setCustomValidity("");

    }

}


// =========================================================
// BOOKING NUMBER
// =========================================================

function generateBookingNumber() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    return (
        "VBB-" +
        year +
        month +
        day +
        "-" +
        random
    );
}


// =========================================================
// SAVE BOOKING
// =========================================================

const bookingForm =
    $("bookingForm");


if (bookingForm) {

    bookingForm.addEventListener(
        "submit",
        saveBooking
    );

}


async function saveBooking(event) {

    event.preventDefault();


    const saveButton =
        $("saveBookingBtn");


    if (
        !event.target.checkValidity()
    ) {

        event.target.reportValidity();

        return;
    }


    validateDates();


    if (
        !event.target.checkValidity()
    ) {

        event.target.reportValidity();

        return;
    }


    let selectedItems;


    try {

        selectedItems =
            collectBartanItems();

    } catch (error) {

        showToast(
            error.message
        );

        return;
    }


    if (!selectedItems.length) {

        showToast(
            "At least one Bartan item is required."
        );

        return;
    }


    const customerName =
        $("customerName")
            .value
            .trim();


    const customerMobile =
        $("customerMobile")
            .value
            .trim();


    const customerAddress =
        $("customerAddress")
            .value
            .trim();


    const eventDate =
        $("eventDate")
            .value;


    const returnDate =
        $("returnDate")
            .value ||
        null;


    const decorationRequired =
        $("decorationRequired")
            .checked;


    const decorationCharge =
        decorationRequired
            ? Number(
                $("decorationCharge")
                    .value
            ) || 0
            : 0;


    const deliveryCharge =
        Number(
            $("deliveryCharge")
                .value
        ) || 0;


    const discount =
        Number(
            $("discount")
                .value
        ) || 0;


    const advance =
        Number(
            $("advance")
                .value
        ) || 0;


    const bartanTotal =
        selectedItems.reduce(
            (
                total,
                item
            ) =>
                total +
                item.amount,
            0
        );


    const finalTotal =
        Math.max(
            0,
            bartanTotal +
            decorationCharge +
            deliveryCharge -
            discount
        );


    if (advance < 0) {

        showToast(
            "Advance cannot be negative."
        );

        return;
    }


    if (
        advance >
        finalTotal
    ) {

        showToast(
            "Advance cannot be greater than final total."
        );

        return;
    }


    const remaining =
        finalTotal -
        advance;


    const notes =
        $("bookingNotes")
            .value
            .trim() ||
        null;


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";

    }


    try {

        // =================================================
        // AUTH
        // =================================================

        const authorized =
            await verifyAdmin();


        if (!authorized) {
            return;
        }


        // =================================================
        // UNIQUE BOOKING NUMBER
        // =================================================

        let bookingNumber =
            generateBookingNumber();


        let existingBooking =
            null;


        for (
            let attempt = 0;
            attempt < 5;
            attempt++
        ) {

            const {
                data,
                error
            } =
                await supabase
                    .from("bookings")
                    .select("id")
                    .eq(
                        "booking_number",
                        bookingNumber
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            existingBooking =
                data;


            if (!existingBooking) {
                break;
            }


            bookingNumber =
                generateBookingNumber();

        }


        if (existingBooking) {

            throw new Error(
                "Could not generate a unique booking number."
            );
        }


        // =================================================
        // INSERT BOOKING
        // =================================================

        const {
            data: booking,
            error: bookingError
        } =
            await supabase
                .from("bookings")
                .insert({

                    booking_number:
                        bookingNumber,

                    customer_name:
                        customerName,

                    customer_mobile:
                        customerMobile,

                    customer_address:
                        customerAddress,

                    event_date:
                        eventDate,

                    return_date:
                        returnDate,

                    decoration_required:
                        decorationRequired,

                    decoration_charge:
                        decorationCharge,

                    delivery_charge:
                        deliveryCharge,

                    discount:
                        discount,

                    bartan_total:
                        bartanTotal,

                    final_total:
                        finalTotal,

                    advance:
                        advance,

                    remaining:
                        remaining,

                    status:
                        "pending",

                    notes:
                        notes

                })
                .select()
                .single();


        if (bookingError) {
            throw bookingError;
        }


        // =================================================
        // INSERT BARTAN ITEMS
        // =================================================

        const bookingItems =
            selectedItems.map(
                item => ({

                    booking_id:
                        booking.id,

                    bartan_item_id:
                        item.bartan_item_id,

                    item_name:
                        item.item_name,

                    quantity:
                        item.quantity,

                    locked_rate:
                        item.locked_rate,

                    amount:
                        item.amount

                })
            );


        const {
            error: itemError
        } =
            await supabase
                .from("booking_items")
                .insert(
                    bookingItems
                );


        if (itemError) {

            await supabase
                .from("bookings")
                .delete()
                .eq(
                    "id",
                    booking.id
                );

            throw itemError;
        }


        // =================================================
        // ADVANCE PAYMENT
        // =================================================

        if (advance > 0) {

            const {
                error: paymentError
            } =
                await supabase
                    .from("booking_payments")
                    .insert({

                        booking_id:
                            booking.id,

                        amount:
                            advance,

                        payment_type:
                            "advance",

                        payment_method:
                            "cash",

                        payment_note:
                            "Initial advance"

                    });


            if (paymentError) {

                console.error(
                    "Payment record error:",
                    paymentError
                );

                showToast(
                    "Booking saved, but advance record failed."
                );

            }

        }


        showToast(
            "Booking " +
            bookingNumber +
            " created successfully."
        );


        resetBookingForm();


        await loadBookings();


        setTimeout(
            () => {

                const bookingToOpen =
                    bookings.find(
                        x =>
                            x.id ===
                            booking.id
                    );


                if (bookingToOpen) {

                    openBookingModal(
                        bookingToOpen
                    );

                }

            },
            400
        );


    } catch (error) {

        console.error(
            "Booking save error:",
            error
        );


        showToast(
            error.message ||
            "Unable to save booking."
        );

    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "💾 Save Booking";

        }

    }

}


// =========================================================
// RESET FORM
// =========================================================

function resetBookingForm() {

    if (!$("bookingForm")) {
        return;
    }


    $("bookingForm").reset();


    if ($("decorationBox")) {

        $("decorationBox")
            .hidden = true;

    }


    if ($("decorationCharge")) {

        $("decorationCharge")
            .value = "0";

    }


    if ($("deliveryCharge")) {

        $("deliveryCharge")
            .value = "0";

    }


    if ($("discount")) {

        $("discount")
            .value = "0";

    }


    if ($("advance")) {

        $("advance")
            .value = "0";

    }


    if ($("bartanSelection")) {

        $("bartanSelection")
            .innerHTML = "";


        if (bartanItems.length) {

            $("bartanSelection")
                .appendChild(
                    createBartanRow()
                );

        }

    }


    calculateTotals();
}


// =========================================================
// NEW BOOKING
// =========================================================

const newBookingButton =
    $("newBookingBtn");


if (newBookingButton) {

    newBookingButton.addEventListener(
        "click",
        () => {

            resetBookingForm();


            if ($("bookingFormCard")) {

                $("bookingFormCard")
                    .scrollIntoView({
                        behavior:
                            "smooth"
                    });

            }

        }
    );

}


// =========================================================
// CANCEL
// =========================================================

const cancelFormButton =
    $("cancelFormBtn");


if (cancelFormButton) {

    cancelFormButton.addEventListener(
        "click",
        () => {

            resetBookingForm();


            window.scrollTo({
                top: 0,
                behavior:
                    "smooth"
            });

        }
    );

}


// =========================================================
// LOAD BOOKINGS
// =========================================================

async function loadBookings() {

    try {

        const {
            data,
            error
        } =
            await supabase
                .from("bookings")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Booking load error:",
                error
            );


            if ($("bookingList")) {

                $("bookingList")
                    .innerHTML = `
                        <tr>
                            <td
                                colspan="8"
                                class="loading"
                            >
                                Unable to load bookings.
                                <br>
                                ${escapeHTML(
                                    error.message
                                )}
                            </td>
                        </tr>
                    `;

            }

            return;
        }


        bookings =
            data || [];


        renderBookings();

    } catch (error) {

        console.error(
            "Booking exception:",
            error
        );

    }

}


// =========================================================
// RENDER BOOKINGS
// =========================================================

function renderBookings() {

    const tbody =
        $("bookingList");


    if (!tbody) {
        return;
    }


    const search =
        $("searchBooking")
            ? $("searchBooking")
                .value
                .trim()
                .toLowerCase()
            : "";


    const status =
        $("statusFilter")
            ? $("statusFilter")
                .value
            : "all";


    const filtered =
        bookings.filter(
            booking => {

                const searchMatch =
                    !search ||

                    String(
                        booking.booking_number
                    )
                        .toLowerCase()
                        .includes(search) ||

                    String(
                        booking.customer_name
                    )
                        .toLowerCase()
                        .includes(search) ||

                    String(
                        booking.customer_mobile
                    )
                        .toLowerCase()
                        .includes(search);


                const statusMatch =
                    status === "all" ||
                    booking.status ===
                        status;


                return (
                    searchMatch &&
                    statusMatch
                );

            }
        );


    if (!filtered.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-state"
                >
                    No bookings found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filtered
            .map(
                booking => {

                    const statusClass =
                        "status-" +
                        escapeHTML(
                            booking.status
                        );


                    return `
                        <tr>

                            <td>
                                <span
                                    class="booking-number"
                                >
                                    ${escapeHTML(
                                        booking.booking_number
                                    )}
                                </span>
                            </td>

                            <td>
                                <span
                                    class="customer-name"
                                >
                                    ${escapeHTML(
                                        booking.customer_name
                                    )}
                                </span>

                                <br>

                                <small>
                                    ${escapeHTML(
                                        booking.customer_mobile
                                    )}
                                </small>
                            </td>

                            <td>
                                ${formatDate(
                                    booking.event_date
                                )}
                            </td>

                            <td class="money">
                                ${money(
                                    booking.final_total
                                )}
                            </td>

                            <td class="money">
                                ${money(
                                    booking.advance
                                )}
                            </td>

                            <td class="money">
                                ${money(
                                    booking.remaining
                                )}
                            </td>

                            <td>
                                <span
                                    class="
                                        status
                                        ${statusClass}
                                    "
                                >
                                    ${escapeHTML(
                                        booking.status
                                    )}
                                </span>
                            </td>

                            <td>
                                <button
                                    type="button"
                                    class="action-btn"
                                    data-booking-id="${booking.id}"
                                >
                                    View
                                </button>
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");


    tbody
        .querySelectorAll(
            "[data-booking-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset
                                .bookingId
                        );


                    const booking =
                        bookings.find(
                            x =>
                                Number(x.id) ===
                                id
                        );


                    if (booking) {

                        openBookingModal(
                            booking
                        );

                    }

                }
            );

        });

}


// =========================================================
// DATE FORMAT
// =========================================================

function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }


    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =========================================================
// SEARCH
// =========================================================

const searchBooking =
    $("searchBooking");


if (searchBooking) {

    searchBooking.addEventListener(
        "input",
        renderBookings
    );

}


// =========================================================
// STATUS FILTER
// =========================================================

const statusFilter =
    $("statusFilter");


if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        renderBookings
    );

}


// =========================================================
// OPEN BOOKING MODAL
// =========================================================

async function openBookingModal(
    booking
) {

    selectedBookingId =
        booking.id;


    if ($("modalBookingNumber")) {

        $("modalBookingNumber")
            .textContent =
            booking.booking_number;

    }


    if ($("modalStatus")) {

        $("modalStatus")
            .value =
            booking.status;

    }


    const {
        data: items,
        error
    } =
        await supabase
            .from("booking_items")
            .select(
                "item_name,quantity,locked_rate,amount"
            )
            .eq(
                "booking_id",
                booking.id
            )
            .order("id");


    if (error) {

        console.error(
            "Booking items error:",
            error
        );

        showToast(
            "Unable to load booking items."
        );

        return;
    }


    const itemHTML =
        items &&
        items.length
            ? items.map(
                item => `
                    <div class="item-line">

                        <span>

                            ${escapeHTML(
                                item.item_name
                            )}

                            ×
                            ${item.quantity}

                            <small>
                                (
                                ${money(
                                    item.locked_rate
                                )}
                                /day
                                )
                            </small>

                        </span>

                        <strong>
                            ${money(
                                item.amount
                            )}
                        </strong>

                    </div>
                `
            ).join("")
            : `
                <div class="empty-state">
                    No Bartan items found.
                </div>
            `;


    if ($("bookingDetails")) {

        $("bookingDetails")
            .innerHTML = `

            <div class="detail-grid">

                <div class="detail-box">

                    <span>
                        Customer
                    </span>

                    <strong>
                        ${escapeHTML(
                            booking.customer_name
                        )}
                    </strong>

                </div>

                <div class="detail-box">

                    <span>
                        Mobile
                    </span>

                    <strong>
                        ${escapeHTML(
                            booking.customer_mobile
                        )}
                    </strong>

                </div>

                <div class="detail-box full">

                    <span>
                        Address
                    </span>

                    <strong>
                        ${escapeHTML(
                            booking.customer_address
                        )}
                    </strong>

                </div>

                <div class="detail-box">

                    <span>
                        Event Date
                    </span>

                    <strong>
                        ${formatDate(
                            booking.event_date
                        )}
                    </strong>

                </div>

                <div class="detail-box">

                    <span>
                        Return Date
                    </span>

                    <strong>
                        ${formatDate(
                            booking.return_date
                        )}
                    </strong>

                </div>

                <div class="detail-box">

                    <span>
                        Bartan Total
                    </span>

                    <strong>
                        ${money(
                            booking.bartan_total
                        )}
                    </strong>

                </div>

                <div class="detail-box">

                    <span>
                        Decoration
                    </span>

                    <strong>
                        ${money(
                            booking.decoration_charge
                        )}
                    </strong>

                </div>

                <div class="detail-box">

                    <span>
                        Delivery
                    </span>

                    <strong>
                        ${money(
                            booking.delivery_charge
                        )}
                    </strong>

                </div>

                <div class="detail-box">

                    <span>
                        Discount
                    </span>

                    <strong>
                        ${money(
                            booking.discount
                        )}
                    </strong>

                </div>

                <div class="detail-box">

                    <span>
                        Final Total
                    </span>

                    <strong>
                        ${money(
                            booking.final_total
                        )}
                    </strong>

                </div>

                <div class="detail-box">

                    <span>
                        Advance
                    </span>

                    <strong>
                        ${money(
                            booking.advance
                        )}
                    </strong>

                </div>

                <div class="detail-box">

                    <span>
                        Remaining
                    </span>

                    <strong>
                        ${money(
                            booking.remaining
                        )}
                    </strong>

                </div>

            </div>


            <div class="item-list">

                <h4>
                    🍽️ Bartan Items
                </h4>

                ${itemHTML}

            </div>


            ${
                booking.notes
                    ? `
                        <div class="item-list">

                            <h4>
                                📝 Notes
                            </h4>

                            <p>
                                ${escapeHTML(
                                    booking.notes
                                )}
                            </p>

                        </div>
                    `
                    : ""
            }

        `;

    }


    if ($("bookingModal")) {

        $("bookingModal")
            .hidden = false;

    }


    document.body.style.overflow =
        "hidden";

}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeModal() {

    if ($("bookingModal")) {

        $("bookingModal")
            .hidden = true;

    }


    document.body.style.overflow =
        "";


    selectedBookingId =
        null;
}


const closeModalButton =
    $("closeModalBtn");


if (closeModalButton) {

    closeModalButton.addEventListener(
        "click",
        closeModal
    );

}


const modalOverlay =
    document.querySelector(
        ".modal-overlay"
    );


if (modalOverlay) {

    modalOverlay.addEventListener(
        "click",
        closeModal
    );

}


// =========================================================
// UPDATE STATUS
// =========================================================

const updateStatusButton =
    $("updateStatusBtn");


if (updateStatusButton) {

    updateStatusButton.addEventListener(
        "click",
        updateBookingStatus
    );

}


async function updateBookingStatus() {

    if (!selectedBookingId) {
        return;
    }


    const newStatus =
        $("modalStatus")
            .value;


    try {

        const authorized =
            await verifyAdmin();


        if (!authorized) {
            return;
        }


        const {
            error
        } =
            await supabase
                .from("bookings")
                .update({

                    status:
                        newStatus,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    selectedBookingId
                );


        if (error) {
            throw error;
        }


        showToast(
            "Booking status updated."
        );


        closeModal();


        await loadBookings();

    } catch (error) {

        console.error(
            "Status update error:",
            error
        );

        showToast(
            error.message ||
            "Unable to update booking status."
        );

    }

}


// =========================================================
// LOGOUT
// =========================================================

const logoutButton =
    $("logoutBtn");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            await supabase.auth.signOut();

            window.location.replace(
                "./admin-login.html"
            );

        }
    );

}


// =========================================================
// AUTH STATE
// =========================================================

supabase.auth.onAuthStateChange(
    (event, session) => {

        if (
            event ===
            "SIGNED_OUT"
        ) {

            window.location.replace(
                "./admin-login.html"
            );

            return;
        }


        if (
            session?.user &&
            session.user.id !==
                ADMIN_UID
        ) {

            supabase.auth.signOut();

            return;
        }

    }
);


// =========================================================
// INITIALIZATION
// =========================================================

async function initialize() {

    const authorized =
        await verifyAdmin();


    if (!authorized) {
        return;
    }


    // Bartan first so the booking form gets its items.
    await loadBartanItems();


    // Other data can load afterwards.
    await Promise.all([
        loadDecorations(),
        loadBookings()
    ]);


    calculateTotals();

}


initialize();