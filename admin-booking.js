import { createClient } from
    "https://esm.sh/@supabase/supabase-js@2";


// ======================================================
// SUPABASE
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
// STATE
// ======================================================

let allBookings = [];
let currentBooking = null;


// ======================================================
// DOM
// ======================================================

const $ = (id) =>
    document.getElementById(id);


// ======================================================
// INITIALIZATION
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        bindEvents();

        await verifyAdmin();

    }
);


// ======================================================
// ADMIN SECURITY
// ======================================================

async function verifyAdmin() {

    try {

        const {
            data: {
                session
            },
            error
        } = await supabase.auth.getSession();


        if (error) {
            throw error;
        }


        if (!session?.user) {

            window.location.replace(
                "./admin-login.html"
            );

            return;
        }


        if (
            session.user.id !== ADMIN_UID
        ) {

            await supabase.auth.signOut();

            window.location.replace(
                "./admin-login.html"
            );

            return;
        }


        await loadBookings();

    } catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        showToast(
            "Admin verification failed.",
            "error"
        );

        setTimeout(
            () => {

                window.location.replace(
                    "./admin-login.html"
                );

            },
            1200
        );

    }

}


// ======================================================
// EVENTS
// ======================================================

function bindEvents() {

    $("refreshBtn")?.addEventListener(
        "click",
        loadBookings
    );


    $("dashboardBtn")?.addEventListener(
        "click",
        () => {

            window.location.replace(
                "./admin.html"
            );

        }
    );


    $("logoutBtn")?.addEventListener(
        "click",
        logout
    );


    $("searchInput")?.addEventListener(
        "input",
        renderBookings
    );


    $("statusFilter")?.addEventListener(
        "change",
        renderBookings
    );
    $("bookingTypeFilter")?.addEventListener("change", renderBookings);


    $("closeModalBtn")?.addEventListener(
        "click",
        closeDetailsModal
    );


    $("closePaymentBtn")?.addEventListener(
        "click",
        closePaymentModal
    );


    $("confirmBtn")?.addEventListener(
        "click",
        confirmCurrentBooking
    );


    $("issueBtn")?.addEventListener(
        "click",
        issueCurrentBooking
    );


    $("returnPendingBtn")?.addEventListener(
        "click",
        markReturnPending
    );


    $("cancelBtn")?.addEventListener(
        "click",
        cancelCurrentBooking
    );


    $("paymentBtn")?.addEventListener(
        "click",
        openPaymentModal
    );

    $("downloadBillBtn")?.addEventListener("click", printBookingBill);
    $("whatsappBillBtn")?.addEventListener("click", shareBookingBillWhatsApp);



    $("savePaymentBtn")?.addEventListener(
        "click",
        savePayment
    );


    $("paymentType")?.addEventListener(
        "change",
        updatePaymentHint
    );


    $("detailsModal")?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("detailsModal")
            ) {

                closeDetailsModal();

            }

        }
    );


    $("paymentModal")?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("paymentModal")
            ) {

                closePaymentModal();

            }

        }
    );

}


// ======================================================
// LOAD BOOKINGS
// ======================================================

async function loadBookings() {

    if (!$("bookingTableBody")) {
        return;
    }


    $("bookingTableBody").innerHTML = `
        <tr>
            <td colspan="7" class="empty">
                Loading bookings...
            </td>
        </tr>
    `;


    try {

        /*
         * IMPORTANT:
         * Bookings are loaded through the secure
         * admin_get_bookings RPC instead of direct
         * table SELECT.
         */

        const {
            data,
            error
        } = await supabase.rpc(
            "admin_get_bookings"
        );


        if (error) {
            throw error;
        }


        allBookings =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "Admin bookings loaded:",
            allBookings
        );


        updateSummary();

        renderBookings();


    } catch (error) {

        console.error(
            "Booking loading error:",
            error
        );


        allBookings = [];

        updateSummary();


        $("bookingTableBody").innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    Unable to load bookings.
                </td>
            </tr>
        `;


        if ($("bookingCountText")) {

            $("bookingCountText")
                .textContent =
                "0 bookings";

        }


        showToast(
            "Unable to load bookings: " +
            (error.message || "Unknown error"),
            "error"
        );

    }

}


// ======================================================
// SUMMARY
// ======================================================

function updateSummary() {

    const count = status =>
        allBookings.filter(
            booking =>
                booking.status === status
        ).length;


    if ($("pendingCount")) {

        $("pendingCount")
            .textContent =
            count("pending");

    }


    if ($("confirmedCount")) {

        $("confirmedCount")
            .textContent =
            count("confirmed");

    }


    if ($("issuedCount")) {

        $("issuedCount")
            .textContent =
            count("issued");

    }


    if ($("returnPendingCount")) {

        $("returnPendingCount")
            .textContent =
            count("return_pending");

    }


    if ($("completedCount")) {

        $("completedCount")
            .textContent =
            count("completed");

    }

}


// ======================================================
// RENDER BOOKINGS
// ======================================================

function renderBookings() {

    if (!$("bookingTableBody")) {
        return;
    }


    const search =
        $("searchInput")
            ?.value
            ?.trim()
            ?.toLowerCase() || "";


    const status =
        $("statusFilter")
            ?.value || "all";
    const bookingType = $("bookingTypeFilter")?.value || "all";


    const filtered =
        allBookings.filter(
            booking => {

                const bookingNumber =
                    String(
                        booking.booking_number || ""
                    ).toLowerCase();


                const customerName =
                    String(
                        booking.customer_name || ""
                    ).toLowerCase();


                const mobile =
                    String(
                        booking.customer_mobile || ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    bookingNumber.includes(search) ||
                    customerName.includes(search) ||
                    mobile.includes(search);


                const matchesStatus = status === "all" || booking.status === status;
                const hasDecoration = booking.decoration_required === true || Number(booking.decoration_charge || 0) > 0 || Number(booking.decoration_count || 0) > 0;
                const matchesType = bookingType === "all" || (bookingType === "decoration" ? hasDecoration : !hasDecoration);
                return matchesSearch && matchesStatus && matchesType;

            }
        );


    if ($("bookingCountText")) {

        $("bookingCountText")
            .textContent =
            `${filtered.length} booking${
                filtered.length === 1
                    ? ""
                    : "s"
            }`;

    }


    if (!filtered.length) {

        $("bookingTableBody").innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    No bookings found.
                </td>
            </tr>
        `;

        return;
    }


    $("bookingTableBody").innerHTML =
        filtered
            .map(
                booking =>
                    createBookingRow(
                        booking
                    )
            )
            .join("");


    document
        .querySelectorAll(
            "[data-booking-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset.bookingId
                        );

                    openBookingDetails(id);

                }
            );

        });

}


// ======================================================
// BOOKING ROW
// ======================================================

function createBookingRow(
    booking
) {

    return `
        <tr>

            <td>
                <strong>
                    ${escapeHtml(
                        booking.booking_number
                    )}
                </strong>
            </td>


            <td>

                <strong>
                    ${escapeHtml(
                        booking.customer_name
                    )}
                </strong>

                <div
                    style="
                        color:#6b7280;
                        font-size:12px;
                        margin-top:3px
                    "
                >
                    ${escapeHtml(
                        booking.customer_mobile
                    )}
                </div>

            </td>


            <td>
                ${formatDate(
                    booking.event_date
                )}
            </td>


            <td>
                ${formatDate(
                    booking.return_date
                )}
            </td>


            <td>
                ${statusBadge(
                    booking.status
                )}
            </td>


            <td>
                ₹${formatMoney(
                    booking.final_total
                )}
            </td>


            <td>

                <div class="action-buttons">

                    <button
                        class="btn primary"
                        data-booking-id="${
                            booking.id
                        }"
                    >
                        View
                    </button>

                </div>

            </td>

        </tr>
    `;

}


// ======================================================
// OPEN BOOKING DETAILS
// ======================================================

async function openBookingDetails(
    bookingId
) {

    const booking =
        allBookings.find(
            item =>
                Number(item.id) ===
                Number(bookingId)
        );


    if (!booking) {

        showToast(
            "Booking not found.",
            "error"
        );

        return;
    }


    currentBooking = booking;


    $("modalBookingNumber")
        .textContent =
        booking.booking_number || "-";


    $("detailBookingNumber")
        .textContent =
        booking.booking_number || "-";


    $("detailCustomerName")
        .textContent =
        booking.customer_name || "-";


    $("detailCustomerMobile")
        .textContent =
        booking.customer_mobile || "-";


    $("detailCustomerAddress")
        .textContent =
        booking.customer_address || "-";


    $("detailEventDate")
        .textContent =
        formatDate(
            booking.event_date
        );


    $("detailReturnDate")
        .textContent =
        formatDate(
            booking.return_date
        );


    $("detailStatus").innerHTML =
        statusBadge(
            booking.status
        );


    $("detailFinalTotal")
        .textContent =
        "₹" +
        formatMoney(
            booking.final_total
        );


    $("detailPaid")
        .textContent =
        "₹" +
        formatMoney(
            booking.advance
        );


    $("detailRemaining")
        .textContent =
        "₹" +
        formatMoney(
            booking.remaining
        );


    $("detailNotes")
        .textContent =
        booking.notes ||
        "No notes";


    await loadBookingItems(
        booking.id
    );


    await loadBookingDecorations(
        booking.id
    );


    updateActionButtons();


    $("detailsModal")
        .classList
        .remove("hidden");

}


// ======================================================
// LOAD BARTAN ITEMS
// ======================================================

async function loadBookingItems(
    bookingId
) {

    const {
        data,
        error
    } = await supabase
        .from("booking_items")
        .select(`
            id,
            bartan_item_id,
            item_name,
            quantity,
            locked_rate,
            amount,
            issued_quantity,
            returned_quantity,
            missing_quantity,
            damaged_quantity,
            return_note
        `)
        .eq(
            "booking_id",
            bookingId
        )
        .order("id");


    if (error) {

        console.error(
            "Booking items error:",
            error
        );


        $("bartanDetails").innerHTML = `
            <div class="notes-box">
                Unable to load bartan items.
            </div>
        `;

        $("returnSection")
            .classList
            .add("hidden");

        return;
    }


    if (!data?.length) {

        $("bartanDetails").innerHTML = `
            <div class="notes-box">
                No bartan items selected.
            </div>
        `;

        $("returnSection")
            .classList
            .add("hidden");

        return;
    }


    $("bartanDetails").innerHTML =
        data.map(
            item => {

                return `
                    <div class="item-row">

                        <div>

                            <div class="item-name">
                                ${escapeHtml(
                                    item.item_name
                                )}
                            </div>

                            <div class="item-meta">
                                Requested:
                                ${Number(
                                    item.quantity || 0
                                )}

                                &nbsp; | &nbsp;

                                Issued:
                                ${Number(
                                    item.issued_quantity || 0
                                )}

                                &nbsp; | &nbsp;

                                Returned:
                                ${Number(
                                    item.returned_quantity || 0
                                )}

                                &nbsp; | &nbsp;

                                Missing:
                                ${Number(
                                    item.missing_quantity || 0
                                )}

                                &nbsp; | &nbsp;

                                Damaged:
                                ${Number(
                                    item.damaged_quantity || 0
                                )}
                            </div>

                        </div>


                        <div>
                            × ${Number(
                                item.quantity || 0
                            )}
                        </div>

                    </div>
                `;

            }
        )
        .join("");


    renderReturnItems(data);

}


// ======================================================
// LOAD DECORATIONS
// ======================================================

async function loadBookingDecorations(
    bookingId
) {

    const {
        data,
        error
    } = await supabase
        .from("booking_decorations")
        .select(`
            id,
            decoration_id,
            decoration_name,
            locked_rate,
            amount
        `)
        .eq(
            "booking_id",
            bookingId
        )
        .order("id");


    if (error) {

        console.error(
            "Decoration error:",
            error
        );


        $("decorationDetails").innerHTML = `
            <div class="notes-box">
                Decoration information unavailable.
            </div>
        `;

        return;
    }


    if (!data?.length) {

        $("decorationDetails").innerHTML = `
            <div class="notes-box">
                No decoration selected.
            </div>
        `;

        return;
    }


    $("decorationDetails").innerHTML =
        data.map(
            item => {

                return `
                    <div class="item-row">

                        <div>

                            <div class="item-name">
                                ${escapeHtml(
                                    item.decoration_name
                                )}
                            </div>

                        </div>

                        <div>
                            Selected
                        </div>

                    </div>
                `;

            }
        )
        .join("");

}


// ======================================================
// RETURN ITEMS
// ======================================================

function renderReturnItems(
    items
) {

    /*
     * Return entry should only be available
     * for Return Pending bookings.
     */

    if (
        !currentBooking ||
        currentBooking.status !==
            "return_pending"
    ) {

        $("returnSection")
            .classList
            .add("hidden");

        return;
    }


    const eligible =
        items.filter(
            item =>
                Number(
                    item.issued_quantity || 0
                ) > 0
        );


    if (!eligible.length) {

        $("returnSection")
            .classList
            .add("hidden");

        return;
    }


    $("returnSection")
        .classList
        .remove("hidden");


    $("returnItems").innerHTML =
        eligible
            .map(
                item => {

                    const issued =
                        Number(
                            item.issued_quantity || 0
                        );


                    const returned =
                        Number(
                            item.returned_quantity || 0
                        );


                    const missing =
                        Number(
                            item.missing_quantity || 0
                        );


                    const damaged =
                        Number(
                            item.damaged_quantity || 0
                        );


                    const accounted =
                        returned +
                        missing +
                        damaged;


                    const remaining =
                        Math.max(
                            issued -
                            accounted,
                            0
                        );


                    return `
                        <div class="return-item">

                            <div
                                class="return-item-title"
                            >
                                ${escapeHtml(
                                    item.item_name
                                )}

                                — Issued:
                                ${issued}
                            </div>


                            <div
                                class="item-meta"
                                style="margin:6px 0 10px"
                            >
                                Already Returned:
                                ${returned}

                                &nbsp; | &nbsp;

                                Already Missing:
                                ${missing}

                                &nbsp; | &nbsp;

                                Already Damaged:
                                ${damaged}

                                &nbsp; | &nbsp;

                                Remaining:
                                <strong>
                                    ${remaining}
                                </strong>
                            </div>


                            <div class="return-fields">

                                <div class="field">

                                    <label>
                                        Returned Now
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        max="${remaining}"
                                        value="0"
                                        id="returned-${item.id}"
                                    >

                                </div>


                                <div class="field">

                                    <label>
                                        Missing Now
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        max="${remaining}"
                                        value="0"
                                        id="missing-${item.id}"
                                    >

                                </div>


                                <div class="field">

                                    <label>
                                        Damaged Now
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        max="${remaining}"
                                        value="0"
                                        id="damaged-${item.id}"
                                    >

                                </div>

                            </div>


                            <div
                                class="field"
                                style="margin-top:10px"
                            >

                                <label>
                                    Return Note
                                </label>

                                <textarea
                                    id="return-note-${item.id}"
                                    rows="2"
                                    placeholder="Optional note"
                                >${escapeHtml(
                                    item.return_note || ""
                                )}</textarea>

                            </div>


                            <div
                                class="item-meta"
                                id="return-total-${item.id}"
                                style="margin-top:8px"
                            >
                                Entered: 0 / ${remaining}
                            </div>


                            <button
                                class="btn primary return-save"
                                data-return-item="${item.id}"
                            >
                                Save Return
                            </button>

                        </div>
                    `;

                }
            )
            .join("");


    eligible.forEach(
        item => {

            const returnedInput =
                $(
                    `returned-${item.id}`
                );

            const missingInput =
                $(
                    `missing-${item.id}`
                );

            const damagedInput =
                $(
                    `damaged-${item.id}`
                );


            const updatePreview =
                () => {

                    const returned =
                        readNumber(
                            `returned-${item.id}`
                        );

                    const missing =
                        readNumber(
                            `missing-${item.id}`
                        );

                    const damaged =
                        readNumber(
                            `damaged-${item.id}`
                        );


                    const total =
                        returned +
                        missing +
                        damaged;


                    const issued =
                        Number(
                            item.issued_quantity || 0
                        );


                    const already =
                        Number(
                            item.returned_quantity || 0
                        ) +
                        Number(
                            item.missing_quantity || 0
                        ) +
                        Number(
                            item.damaged_quantity || 0
                        );


                    const remaining =
                        Math.max(
                            issued -
                            already,
                            0
                        );


                    const preview =
                        $(
                            `return-total-${item.id}`
                        );


                    if (!preview) {
                        return;
                    }


                    preview.textContent =
                        `Entered: ${total} / ${remaining}`;


                    preview.style.color =
                        total > remaining
                            ? "#dc2626"
                            : "";

                };


            returnedInput?.addEventListener(
                "input",
                updatePreview
            );


            missingInput?.addEventListener(
                "input",
                updatePreview
            );


            damagedInput?.addEventListener(
                "input",
                updatePreview
            );

        }
    );


    document
        .querySelectorAll(
            "[data-return-item]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        saveReturnItem(
                            Number(
                                button.dataset
                                    .returnItem
                            )
                        );

                    }
                );

            }
        );

}


// ======================================================
// ACTION BUTTON VISIBILITY
// ======================================================


function updateActionButtons() {
    if (!currentBooking) {
        $("downloadBillBtn")?.classList.add("hidden");
        $("whatsappBillBtn")?.classList.add("hidden");
        return;
    }

    const status = currentBooking.status;

    $("confirmBtn")?.classList.toggle("hidden", status !== "pending");
    $("issueBtn")?.classList.toggle("hidden", status !== "confirmed");
    $("returnPendingBtn")?.classList.toggle("hidden", status !== "issued");

    $("cancelBtn")?.classList.toggle(
        "hidden",
        !(status === "pending" || status === "confirmed")
    );

    $("paymentBtn")?.classList.toggle("hidden", status === "cancelled");

    const billAvailable = [
        "confirmed", "issued", "return_pending", "returned", "completed"
    ].includes(status);

    $("downloadBillBtn")?.classList.toggle("hidden", !billAvailable);
    $("whatsappBillBtn")?.classList.toggle("hidden", !billAvailable);
}



// ======================================================
// CONFIRM
// ======================================================

async function confirmCurrentBooking() {

    if (!currentBooking) {
        return;
    }


    if (
        !confirm(
            "Confirm this booking?"
        )
    ) {
        return;
    }


    const {
        error
    } = await supabase.rpc(
        "admin_confirm_booking",
        {
            p_booking_id:
                currentBooking.id
        }
    );


    if (error) {

        showToast(
            error.message,
            "error"
        );

        return;
    }


    showToast(
        "Booking confirmed.",
        "success"
    );


    await refreshAfterAction();

}


// ======================================================
// ISSUE
// ======================================================

async function issueCurrentBooking() {

    if (!currentBooking) {
        return;
    }


    if (
        !confirm(
            "Issue all requested bartan for this booking?"
        )
    ) {
        return;
    }


    const {
        error
    } = await supabase.rpc(
        "admin_issue_booking",
        {
            p_booking_id:
                currentBooking.id
        }
    );


    if (error) {

        showToast(
            error.message,
            "error"
        );

        return;
    }


    showToast(
        "Bartan issued successfully.",
        "success"
    );


    await refreshAfterAction();

}


// ======================================================
// RETURN PENDING
// ======================================================

async function markReturnPending() {

    if (!currentBooking) {
        return;
    }


    if (
        !confirm(
            "Mark this booking as Return Pending?"
        )
    ) {
        return;
    }


    const {
        error
    } = await supabase.rpc(
        "admin_mark_return_pending",
        {
            p_booking_id:
                currentBooking.id
        }
    );


    if (error) {

        showToast(
            error.message,
            "error"
        );

        return;
    }


    showToast(
        "Booking marked Return Pending.",
        "success"
    );


    await refreshAfterAction();

}


// ======================================================
// CANCEL
// ======================================================

async function cancelCurrentBooking() {

    if (!currentBooking) {
        return;
    }


    const reason =
        prompt(
            "Enter cancellation reason (optional):"
        );


    if (reason === null) {
        return;
    }


    const {
        error
    } = await supabase.rpc(
        "admin_cancel_booking",
        {
            p_booking_id:
                currentBooking.id,

            p_reason:
                reason.trim() || null
        }
    );


    if (error) {

        showToast(
            error.message,
            "error"
        );

        return;
    }


    showToast(
        "Booking cancelled.",
        "success"
    );


    await refreshAfterAction();

}


// ======================================================
// SAVE RETURN
// ======================================================

async function saveReturnItem(
    bookingItemId
) {

    if (
        !currentBooking ||
        currentBooking.status !==
            "return_pending"
    ) {

        showToast(
            "Return entry is allowed only for Return Pending bookings.",
            "error"
        );

        return;
    }


    /*
     * Re-read the database values before saving.
     * This prevents double counting if an admin
     * opens the same booking again.
     */

    const {
        data: item,
        error: itemError
    } = await supabase
        .from("booking_items")
        .select(`
            id,
            item_name,
            issued_quantity,
            returned_quantity,
            missing_quantity,
            damaged_quantity
        `)
        .eq(
            "id",
            bookingItemId
        )
        .single();


    if (itemError) {

        showToast(
            itemError.message,
            "error"
        );

        return;
    }


    const issued =
        Number(
            item.issued_quantity || 0
        );


    const alreadyReturned =
        Number(
            item.returned_quantity || 0
        );


    const alreadyMissing =
        Number(
            item.missing_quantity || 0
        );


    const alreadyDamaged =
        Number(
            item.damaged_quantity || 0
        );


    const alreadyAccounted =
        alreadyReturned +
        alreadyMissing +
        alreadyDamaged;


    const remaining =
        Math.max(
            issued -
            alreadyAccounted,
            0
        );


    const returned =
        readNumber(
            `returned-${bookingItemId}`
        );


    const missing =
        readNumber(
            `missing-${bookingItemId}`
        );


    const damaged =
        readNumber(
            `damaged-${bookingItemId}`
        );


    const enteredTotal =
        returned +
        missing +
        damaged;


    const note =
        $(
            `return-note-${bookingItemId}`
        )
        ?.value
        .trim() || null;


    if (remaining <= 0) {

        showToast(
            "This item is already fully accounted for.",
            "error"
        );

        return;
    }


    if (enteredTotal <= 0) {

        showToast(
            "Enter Returned, Missing or Damaged quantity.",
            "error"
        );

        return;
    }


    if (
        enteredTotal >
        remaining
    ) {

        showToast(
            `Quantity cannot exceed remaining ${remaining}.`,
            "error"
        );

        return;
    }


    const {
        error
    } = await supabase.rpc(
        "admin_record_booking_item_return",
        {
            p_booking_item_id:
                bookingItemId,

            p_returned_quantity:
                returned,

            p_missing_quantity:
                missing,

            p_damaged_quantity:
                damaged,

            p_return_note:
                note
        }
    );


    if (error) {

        showToast(
            error.message,
            "error"
        );

        return;
    }


    showToast(
        "Return information saved.",
        "success"
    );


    await refreshAfterAction();

}


// ======================================================
// PAYMENT MODAL
// ======================================================

function openPaymentModal() {

    if (!currentBooking) {
        return;
    }


    $("paymentAmount").value = "";

    $("paymentNote").value = "";

    $("paymentType").value =
        "advance";

    $("paymentMethod").value =
        "cash";


    $("paymentModal")
        .classList
        .remove("hidden");

}


function closePaymentModal() {

    $("paymentModal")
        .classList
        .add("hidden");

}


// ======================================================
// PAYMENT
// ======================================================

async function savePayment() {
    if (!currentBooking) return;

    const amount = Number($("paymentAmount").value);
    const paymentType = $("paymentType").value;
    const paymentMethod = $("paymentMethod").value;
    const note = $("paymentNote").value.trim() || null;
    const reference = $("paymentReference").value.trim() || null;
    const file = $("paymentProof").files?.[0] || null;
    const maxBytes = 2 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    if (!Number.isFinite(amount) || amount <= 0) {
        showToast("Enter a valid payment amount.", "error");
        return;
    }

    if (["upi", "bank", "other"].includes(paymentMethod) && !reference) {
        showToast("Transaction ID / UTR is required for UPI, Bank and Other payments.", "error");
        $("paymentReference").focus();
        return;
    }

    if (file) {
        if (file.size > maxBytes) {
            showToast("File size must be 2 MB or less.", "error");
            $("paymentProof").value = "";
            return;
        }
        if (!allowedTypes.includes(file.type)) {
            showToast("Only JPG, PNG, WEBP or PDF files are allowed.", "error");
            $("paymentProof").value = "";
            return;
        }
    }

    const saveButton = $("savePaymentBtn");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    let uploadedPath = null;

    try {
        if (file) {
            const extByType = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp",
                "application/pdf": "pdf"
            };
            const safeName = String(file.name || "proof")
                .replace(/[^a-zA-Z0-9._-]/g, "_")
                .slice(-100);
            uploadedPath = `admin-booking/${currentBooking.id}/${Date.now()}-${crypto.randomUUID()}.${extByType[file.type]}`;

            const upload = await supabase.storage
                .from("payment-proofs")
                .upload(uploadedPath, file, {
                    contentType: file.type,
                    upsert: false
                });
            if (upload.error) throw upload.error;
        }

        const localDate = (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        })();

        const { data, error } = await supabase.rpc("admin_add_booking_payment_v2", {
            p_booking_id: currentBooking.id,
            p_amount: amount,
            p_payment_type: paymentType,
            p_payment_method: paymentMethod,
            p_payment_note: note,
            p_payment_reference: reference,
            p_payment_date: localDate
        });

        if (error) throw error;
        const result = Array.isArray(data) ? data[0] : data;
        const paymentId = result?.payment_id;

        if (!paymentId) {
            throw new Error("Payment was recorded, but the database did not return its payment ID. Please check Payment History before retrying.");
        }

        if (uploadedPath) {
            const { error: proofError } = await supabase
                .from("booking_payments")
                .update({
                    payment_proof_path: uploadedPath,
                    payment_proof_name: file.name,
                    payment_proof_mime_type: file.type
                })
                .eq("id", paymentId);

            if (proofError) {
                console.error("Payment saved, proof metadata update failed:", proofError);
                closePaymentModal();
                showToast("Payment saved, but proof could not be linked. Check Storage/Payment History before retrying.", "error");
                await refreshAfterAction();
                return;
            }
        }

        closePaymentModal();
        showToast("Payment saved successfully.", "success");
        await refreshAfterAction();
    } catch (error) {
        if (uploadedPath) {
            const cleanup = await supabase.storage.from("payment-proofs").remove([uploadedPath]);
            if (cleanup.error) console.warn("Could not remove unused payment proof:", cleanup.error);
        }
        console.error("Save payment failed:", error);
        showToast(error.message || "Could not save payment.", "error");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Payment";
    }
}


// ======================================================
// REFRESH AFTER ACTION
// ======================================================

async function refreshAfterAction() {

    const currentId =
        currentBooking?.id;


    await loadBookings();


    if (!currentId) {
        return;
    }


    const updated =
        allBookings.find(
            booking =>
                Number(booking.id) ===
                Number(currentId)
        );


    if (updated) {

        currentBooking =
            updated;

        await openBookingDetails(
            updated.id
        );

    } else {

        closeDetailsModal();

    }

}


// ======================================================
// CLOSE DETAILS
// ======================================================

function closeDetailsModal() {

    $("detailsModal")
        .classList
        .add("hidden");

    currentBooking = null;

}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

    await supabase.auth.signOut();

    window.location.replace(
        "./admin-login.html"
    );

}


// ======================================================
// HELPERS
// ======================================================

function readNumber(id) {

    const value =
        Number(
            $(id)?.value
        );


    if (
        !Number.isFinite(value) ||
        value < 0
    ) {

        return 0;

    }


    return Math.floor(value);

}


function formatMoney(value) {

    const number =
        Number(value || 0);


    return number.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(
            value + "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function statusBadge(status) {

    const labels = {

        pending:
            "Pending",

        confirmed:
            "Confirmed",

        issued:
            "Issued",

        return_pending:
            "Return Pending",

        completed:
            "Completed",

        cancelled:
            "Cancelled"

    };


    return `
        <span class="status ${escapeHtml(status)}">
            ${escapeHtml(
                labels[status] || status
            )}
        </span>
    `;

}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
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


function showToast(
    message,
    type = "success"
) {

    const toast =
        $("toast");


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.className =
        `toast show ${type}`;


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            () => {

                toast.className =
                    "toast";

            },
            3000
        );

}


function updatePaymentHint() {

    // Reserved for future payment UI enhancements.

}

// ======================================================
// BOOKING BILL: PRINT / SAVE PDF / WHATSAPP
// ======================================================

function billEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[c]);
}

function billMoney(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function billDate(value) {
    if (!value) return "—";
    const p = String(value).slice(0, 10).split("-");
    return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : String(value);
}

async function getBookingBillData() {
    if (!currentBooking) throw new Error("Pehle booking select karein.");

    const id = currentBooking.id;
    const [ir, dr] = await Promise.all([
        supabase.from("booking_items")
            .select("item_name, quantity, locked_rate, amount")
            .eq("booking_id", id).order("id", { ascending: true }),
        supabase.from("booking_decorations")
            .select("decoration_name, locked_rate, amount")
            .eq("booking_id", id).order("id", { ascending: true })
    ]);

    if (ir.error) throw ir.error;
    if (dr.error) throw dr.error;

    return { booking: { ...currentBooking }, items: ir.data || [], decorations: dr.data || [] };
}

function buildBookingBillHTML(data) {
    const b = data.booking;

    const items = data.items.length ? data.items.map((x, i) => `
        <tr><td>${i + 1}</td><td>${billEscape(x.item_name)}</td>
        <td>${billEscape(x.quantity)}</td><td>${billMoney(x.locked_rate)}</td>
        <td>${billMoney(x.amount)}</td></tr>`).join("") :
        '<tr><td colspan="5">No bartan items</td></tr>';

    const decorations = data.decorations.length ? data.decorations.map((x, i) => `
        <tr><td>${i + 1}</td><td>${billEscape(x.decoration_name)}</td>
        <td>${billMoney(x.locked_rate)}</td><td>${billMoney(x.amount)}</td></tr>`).join("") :
        '<tr><td colspan="4">No decoration items</td></tr>';

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Booking Bill ${billEscape(b.booking_number || b.id)}</title>
<style>
body{font-family:Arial,sans-serif;color:#222;margin:24px}
main{max-width:850px;margin:auto}header{text-align:center;border-bottom:3px solid #26734d;padding-bottom:12px}
h1{color:#26734d;margin-bottom:6px}h2{margin-top:24px;font-size:18px}
.info{display:grid;grid-template-columns:1fr 1fr;gap:8px}
table{border-collapse:collapse;width:100%;margin:10px 0 20px}
th,td{border:1px solid #ccc;padding:8px;text-align:left}
th{background:#edf5ef}.totals{max-width:400px;margin-left:auto}
.grand{font-weight:bold;background:#edf5ef}
button{padding:10px 18px;margin-bottom:18px}
@media print{button{display:none}body{margin:0}}
@media(max-width:550px){body{margin:10px}.info{grid-template-columns:1fr}th,td{padding:5px;font-size:12px}}
</style></head><body><main>
<button onclick="window.print()">Print / Save as PDF</button>
<header><h1>VIJAY BARTAN BHANDAR</h1>
<p>श्री गणेशाय नमः</p>
<p>Nayagaon Shiromani Tola, Parbatta, Khagaria, Bihar</p>
<h2>BOOKING BILL</h2>
<p><b>Booking No:</b> ${billEscape(b.booking_number || b.id)}</p></header>
<section class="info">
<p><b>Customer:</b> ${billEscape(b.customer_name)}</p>
<p><b>Mobile:</b> ${billEscape(b.customer_mobile)}</p>
<p><b>Address:</b> ${billEscape(b.customer_address || "—")}</p>
<p><b>Event Date:</b> ${billDate(b.event_date)}</p>
<p><b>Return Date:</b> ${billDate(b.return_date)}</p>
<p><b>Bill Date:</b> ${billDate(new Date().toISOString())}</p>
</section>
<h2>Bartan Items</h2><table><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${items}</tbody></table>
<h2>Decoration Items</h2><table><thead><tr><th>#</th><th>Decoration</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${decorations}</tbody></table>
<table class="totals"><tbody>
<tr><td>Bartan Total</td><td>${billMoney(b.bartan_total)}</td></tr>
<tr><td>Decoration Charge</td><td>${billMoney(b.decoration_charge)}</td></tr>
<tr><td>Delivery Charge</td><td>${billMoney(b.delivery_charge)}</td></tr>
<tr><td>Discount</td><td>−${billMoney(b.discount)}</td></tr>
<tr class="grand"><td>Final Total</td><td>${billMoney(b.final_total)}</td></tr>
<tr><td>Advance / Paid</td><td>${billMoney(b.advance)}</td></tr>
<tr class="grand"><td>Remaining Balance</td><td>${billMoney(b.remaining)}</td></tr>
</tbody></table>
${b.notes ? `<p><b>Notes:</b> ${billEscape(b.notes)}</p>` : ""}
<p>Customer Signature: ____________________</p>
<p>Authorized Signature: ____________________</p>
</main></body></html>`;
}

async function printBookingBill() {
    if (!currentBooking) return showToast("Pehle booking select karein.", "error");

    const win = window.open("", "_blank");
    if (!win) return showToast("Popup blocked hai. Browser mein popup allow karein.", "error");

    try {
        win.document.write("<title>Loading bill</title><p>Bill load ho raha hai...</p>");
        win.document.close();

        const data = await getBookingBillData();
        win.document.open();
        win.document.write(buildBookingBillHTML(data));
        win.document.close();
        win.focus();

        setTimeout(() => {
            if (!win.closed) win.print();
        }, 500);

        showToast("Print dialog se Save as PDF choose karein.", "success");
    } catch (e) {
        win.close();
        console.error(e);
        showToast(e.message || "Bill load nahi hua.", "error");
    }
}

async function shareBookingBillWhatsApp() {
    if (!currentBooking) return showToast("Pehle booking select karein.", "error");

    try {
        const data = await getBookingBillData();
        const b = data.booking;
        let phone = String(b.customer_mobile || "").replace(/\D/g, "");

        if (phone.startsWith("0") && phone.length === 11) phone = phone.slice(1);
        if (phone.length === 10) phone = "91" + phone;

        if (phone.length < 10) {
            return showToast("Customer mobile number check karein.", "error");
        }

        const lines = [
            "VIJAY BARTAN BHANDAR - BOOKING BILL",
            "Booking No: " + (b.booking_number || b.id),
            "Customer: " + (b.customer_name || "—"),
            "Event Date: " + (b.event_date || "—"),
            "Return Date: " + (b.return_date || "—"),
            "",
            "Bartan Items:",
            ...data.items.map(x => `${x.item_name} x ${x.quantity} = ${billMoney(x.amount)}`),
            "",
            "Decoration:",
            ...(data.decorations.length
                ? data.decorations.map(x => `${x.decoration_name} = ${billMoney(x.amount)}`)
                : ["None"]),
            "",
            "Bartan Total: " + billMoney(b.bartan_total),
            "Decoration Charge: " + billMoney(b.decoration_charge),
            "Delivery Charge: " + billMoney(b.delivery_charge),
            "Discount: " + billMoney(b.discount),
            "Final Total: " + billMoney(b.final_total),
            "Advance / Paid: " + billMoney(b.advance),
            "Remaining Balance: " + billMoney(b.remaining),
            "",
            "Saved PDF ko WhatsApp mein manually attach karein."
        ];

        window.open(
            "https://wa.me/" + phone + "?text=" + encodeURIComponent(lines.join("\n")),
            "_blank"
        );
    } catch (e) {
        console.error(e);
        showToast(e.message || "WhatsApp message ready nahi hua.", "error");
    }
}
