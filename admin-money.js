import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://wkgkczrhgsmnmovyzuss.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E";

const ADMIN_UID =
    "540b68b8-044f-4ac5-bbd9-8014e31af801";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ============================================================
// STATE
// ============================================================

let collectionData = [];
let filteredCollectionData = [];
let expenseData = [];

let currentPaymentBooking = null;
let currentHistoryBookingId = null;
let editingExpenseId = null;


// ============================================================
// DOM HELPER
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// DOM
// ============================================================

const refreshBtn = $("refreshBtn");
const logoutBtn = $("logoutBtn");

const totalBookingAmount = $("totalBookingAmount");
const totalCollectedAmount = $("totalCollectedAmount");
const totalAdvanceAmount = $("totalAdvanceAmount");
const totalRemainingAmount = $("totalRemainingAmount");
const fullyPaidBookings = $("fullyPaidBookings");
const totalExpenseAmount = $("totalExpenseAmount");
const netBalanceAmount = $("netBalanceAmount");

const searchInput = $("searchInput");
const paymentStatusFilter = $("paymentStatusFilter");
const paymentTypeFilter = $("paymentTypeFilter");
const clearFiltersBtn = $("clearFiltersBtn");

const fromDate = $("fromDate");
const toDate = $("toDate");
const applyDateFilterBtn = $("applyDateFilterBtn");

const collectionTableBody = $("collectionTableBody");
const emptyState = $("emptyState");

const addPaymentBtn = $("addPaymentBtn");

const addExpenseBtn = $("addExpenseBtn");
const expenseTableBody = $("expenseTableBody");

const paymentHistorySection = $("paymentHistorySection");
const historyCustomerName = $("historyCustomerName");
const historyBookingNumber = $("historyBookingNumber");
const closeHistoryBtn = $("closeHistoryBtn");

const historyTotalAmount = $("historyTotalAmount");
const historyAdvanceAmount = $("historyAdvanceAmount");
const historyPaidAmount = $("historyPaidAmount");
const historyRemainingAmount = $("historyRemainingAmount");
const paymentHistoryBody = $("paymentHistoryBody");

const paymentModal = $("paymentModal");
const closePaymentModalBtn = $("closePaymentModalBtn");
const cancelPaymentBtn = $("cancelPaymentBtn");
const paymentForm = $("paymentForm");

const paymentBookingSelect = $("paymentBookingSelect");
const paymentCustomerPreview = $("paymentCustomerPreview");
const paymentTotalPreview = $("paymentTotalPreview");
const paymentPaidPreview = $("paymentPaidPreview");
const paymentRemainingPreview = $("paymentRemainingPreview");

const paymentAmount = $("paymentAmount");
const paymentType = $("paymentType");
const paymentDate = $("paymentDate");
const paymentMethod = $("paymentMethod");
const paymentNote = $("paymentNote");
const paymentReference = $("paymentReference");
const savePaymentBtn = $("savePaymentBtn");

const expenseModal = $("expenseModal");
const expenseModalTitle = $("expenseModalTitle");
const closeExpenseModalBtn = $("closeExpenseModalBtn");
const cancelExpenseBtn = $("cancelExpenseBtn");
const expenseForm = $("expenseForm");

const expenseId = $("expenseId");
const expenseName = $("expenseName");
const expenseAmount = $("expenseAmount");
const expenseDate = $("expenseDate");
const expensePaymentMethod = $("expensePaymentMethod");
const expenseDescription = $("expenseDescription");
const saveExpenseBtn = $("saveExpenseBtn");

const toast = $("toast");
const toastIcon = $("toastIcon");
const toastMessage = $("toastMessage");

const pageLoader = $("pageLoader");


// ============================================================
// BASIC FUNCTIONS
// ============================================================

function money(value) {
    return "₹" + Number(value || 0).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
        return "—";
    }

    return d.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
        return "—";
    }

    return d.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function today() {

    const d = new Date();

    const year = d.getFullYear();
    const month = String(
        d.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        d.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function showLoader(show) {

    if (!pageLoader) {
        return;
    }

    pageLoader.hidden = !show;

    pageLoader.classList.toggle(
        "active",
        show
    );
}


function toastMessageShow(
    message,
    type = "success"
) {

    if (!toast) {
        return;
    }

    toastMessage.textContent = message;

    toast.classList.remove(
        "success",
        "error",
        "warning",
        "show"
    );

    toast.classList.add(type);

    if (toastIcon) {

        if (type === "error") {
            toastIcon.innerHTML =
                '<i class="fa-solid fa-circle-xmark"></i>';
        }
        else if (type === "warning") {
            toastIcon.innerHTML =
                '<i class="fa-solid fa-triangle-exclamation"></i>';
        }
        else {
            toastIcon.innerHTML =
                '<i class="fa-solid fa-circle-check"></i>';
        }
    }

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    clearTimeout(
        toastMessageShow.timer
    );

    toastMessageShow.timer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3500);
}


function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }

    if (loading) {

        button.disabled = true;

        button.dataset.oldText =
            button.innerHTML;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    }
    else {

        button.disabled = false;

        button.innerHTML =
            button.dataset.oldText ||
            text;
    }
}


// ============================================================
// AUTH
// ============================================================

async function checkAdmin() {

    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    const session = data.session;

    if (!session || !session.user) {

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
// LOAD COLLECTION
// ============================================================

async function loadCollection() {

    const {
        data,
        error
    } = await supabase.rpc(
        "admin_get_amount_collection_summary_v2"
    );

    if (error) {
        throw error;
    }

    collectionData =
        Array.isArray(data)
            ? data
            : [];

    filteredCollectionData =
        [...collectionData];

    populatePaymentBookings();

    applyFilters();
}


// ============================================================
// LOAD EXPENSES
// ============================================================

async function loadExpenses() {

    const {
        data,
        error
    } = await supabase.rpc(
        "admin_get_expenses"
    );

    if (error) {
        throw error;
    }

    expenseData =
        Array.isArray(data)
            ? data
            : [];

    renderExpenses();

    updateSummary();
}


// ============================================================
// LOAD EVERYTHING
// ============================================================

async function loadEverything() {

    showLoader(true);

    try {

        await loadCollection();
        await loadExpenses();

        updateSummary();

    }
    catch (error) {

        console.error(
            "Amount Collection load error:",
            error
        );

        toastMessageShow(
            error.message ||
            "Data load failed.",
            "error"
        );

    }
    finally {

        showLoader(false);
    }
}


// ============================================================
// SUMMARY
// ============================================================

function updateSummary() {

    let total = 0;
    let collected = 0;
    let advance = 0;
    let remaining = 0;
    let paidCount = 0;

    collectionData.forEach(item => {

        total += Number(
            item.final_total || 0
        );

        collected += Number(
            item.total_paid || 0
        );

        advance += Number(
            item.advance_paid || 0
        );

        remaining += Number(
            item.remaining_amount || 0
        );

        if (
            String(
                item.payment_status || ""
            ).toLowerCase() === "paid"
        ) {
            paidCount++;
        }
    });


    const expenses =
        expenseData.reduce(
            (sum, item) =>
                sum + Number(
                    item.amount || 0
                ),
            0
        );


    const net =
        collected - expenses;


    totalBookingAmount.textContent =
        money(total);

    totalCollectedAmount.textContent =
        money(collected);

    totalAdvanceAmount.textContent =
        money(advance);

    totalRemainingAmount.textContent =
        money(remaining);

    fullyPaidBookings.textContent =
        paidCount.toLocaleString("en-IN");

    totalExpenseAmount.textContent =
        money(expenses);

    netBalanceAmount.textContent =
        money(net);
}


// ============================================================
// FILTERS
// ============================================================

function applyFilters() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const status =
        paymentStatusFilter.value;

    const type =
        paymentTypeFilter.value;

    const from =
        fromDate.value;

    const to =
        toDate.value;


    filteredCollectionData =
        collectionData.filter(item => {

            // Search
            if (search) {

                const text = [
                    item.customer_name,
                    item.customer_mobile,
                    item.booking_number
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                if (!text.includes(search)) {
                    return false;
                }
            }


            // Status
            if (
                status !== "all" &&
                String(
                    item.payment_status
                ).toLowerCase() !== status
            ) {
                return false;
            }


            // Payment type
            const advance =
                Number(
                    item.advance_paid || 0
                );

            const paid =
                Number(
                    item.total_paid || 0
                );

            if (
                type === "advance" &&
                advance <= 0
            ) {
                return false;
            }

            if (
                type === "remaining" &&
                paid <= advance
            ) {
                return false;
            }


            // Date
            if (from) {

                const bookingDate =
                    new Date(
                        item.booking_date
                    );

                const fromDateObj =
                    new Date(
                        `${from}T00:00:00`
                    );

                if (
                    bookingDate <
                    fromDateObj
                ) {
                    return false;
                }
            }


            if (to) {

                const bookingDate =
                    new Date(
                        item.booking_date
                    );

                const toDateObj =
                    new Date(
                        `${to}T23:59:59`
                    );

                if (
                    bookingDate >
                    toDateObj
                ) {
                    return false;
                }
            }


            return true;
        });


    renderCollection();
}


// ============================================================
// COLLECTION TABLE
// ============================================================

function renderCollection() {

    collectionTableBody.innerHTML = "";

    if (
        filteredCollectionData.length === 0
    ) {

        emptyState.hidden = false;

        return;
    }

    emptyState.hidden = true;


    filteredCollectionData.forEach(item => {

        const total =
            Number(item.final_total || 0);

        const advance =
            Number(item.advance_paid || 0);

        const paid =
            Number(item.total_paid || 0);

        const remaining =
            Number(
                item.remaining_amount || 0
            );

        const status =
            String(
                item.payment_status ||
                "pending"
            ).toLowerCase();


        let statusText = "Pending";

        if (status === "partial") {
            statusText = "Partial";
        }

        if (status === "paid") {
            statusText = "Paid";
        }


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHTML(
                        item.customer_name ||
                        "Unknown"
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        item.customer_mobile ||
                        ""
                    )}
                </small>
            </td>

            <td>
                ${escapeHTML(
                    item.booking_number ||
                    "—"
                )}
            </td>

            <td>
                ${formatDate(
                    item.booking_date
                )}
            </td>

            <td>
                <strong>
                    ${money(total)}
                </strong>
            </td>

            <td>
                ${money(advance)}
            </td>

            <td>
                ${money(paid)}
            </td>

            <td>
                <strong>
                    ${money(remaining)}
                </strong>
            </td>

            <td>
                <span
                    class="payment-status ${status}"
                >
                    ${statusText}
                </span>
            </td>

            <td>

                <div class="money-actions">

                    <button
                        type="button"
                        class="history-btn"
                        data-id="${item.booking_id}"
                        title="Payment History"
                    >
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>

                    ${
                        status !== "paid"
                            ? `
                            <button
                                type="button"
                                class="payment-btn"
                                data-id="${item.booking_id}"
                                title="Add Payment"
                            >
                                <i class="fa-solid fa-plus"></i>
                            </button>
                            `
                            : ""
                    }

                </div>

            </td>
        `;


        collectionTableBody.appendChild(
            row
        );
    });
}


// ============================================================
// PAYMENT BOOKING OPTIONS
// ============================================================

function populatePaymentBookings() {

    paymentBookingSelect.innerHTML = `
        <option value="">
            Select Booking
        </option>
    `;


    collectionData
        .filter(
            item =>
                Number(
                    item.remaining_amount || 0
                ) > 0
        )
        .forEach(item => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item.booking_id;

            option.textContent =
                `${item.booking_number} — ${item.customer_name} — Remaining ${money(item.remaining_amount)}`;

            paymentBookingSelect.appendChild(
                option
            );
        });
}


// ============================================================
// PAYMENT PREVIEW
// ============================================================

function updatePaymentPreview() {

    const bookingId =
        Number(
            paymentBookingSelect.value
        );


    currentPaymentBooking =
        collectionData.find(
            item =>
                Number(
                    item.booking_id
                ) === bookingId
        ) || null;


    if (!currentPaymentBooking) {

        paymentCustomerPreview.textContent =
            "—";

        paymentTotalPreview.textContent =
            "₹0";

        paymentPaidPreview.textContent =
            "₹0";

        paymentRemainingPreview.textContent =
            "₹0";

        paymentAmount.value = "";

        return;
    }


    paymentCustomerPreview.textContent =
        currentPaymentBooking.customer_name ||
        "—";

    paymentTotalPreview.textContent =
        money(
            currentPaymentBooking.final_total
        );

    paymentPaidPreview.textContent =
        money(
            currentPaymentBooking.total_paid
        );

    paymentRemainingPreview.textContent =
        money(
            currentPaymentBooking.remaining_amount
        );


    paymentAmount.max =
        Number(
            currentPaymentBooking.remaining_amount ||
            0
        );


    // Automatic payment type
    if (
        Number(
            currentPaymentBooking.total_paid || 0
        ) <= 0
    ) {
        paymentType.value = "advance";
    }
    else {
        paymentType.value = "additional";
    }
}


// ============================================================
// OPEN PAYMENT MODAL
// ============================================================

function openPaymentModal(
    bookingId = null
) {

    paymentForm.reset();

    currentPaymentBooking = null;

    paymentDate.value = today();

    paymentMethod.value = "cash";

    paymentType.value = "additional";


    paymentBookingSelect.value =
        bookingId
            ? String(bookingId)
            : "";


    updatePaymentPreview();


    paymentModal.hidden = false;

    paymentModal.classList.add(
        "active"
    );

    document.body.classList.add(
        "modal-open"
    );
}


// ============================================================
// CLOSE PAYMENT MODAL
// ============================================================

function closePaymentModal() {

    paymentModal.hidden = true;

    paymentModal.classList.remove(
        "active"
    );

    document.body.classList.remove(
        "modal-open"
    );

    currentPaymentBooking = null;
}


// ============================================================
// SAVE PAYMENT
// ============================================================

async function savePayment(
    event
) {

    event.preventDefault();


    if (!currentPaymentBooking) {

        toastMessageShow(
            "Please select a booking.",
            "warning"
        );

        return;
    }


    const amount =
        Number(
            paymentAmount.value
        );


    const remaining =
        Number(
            currentPaymentBooking.remaining_amount ||
            0
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        toastMessageShow(
            "Please enter a valid amount.",
            "warning"
        );

        paymentAmount.focus();

        return;
    }


    const selectedMethod = String(paymentMethod.value || "cash").toLowerCase();
    const transactionReference = paymentReference?.value.trim() || "";
    const proofFile = $("paymentProof")?.files?.[0] || null;
    const allowedProofTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (["upi", "bank", "other"].includes(selectedMethod) && !transactionReference && !proofFile) {
        toastMessageShow("Enter transaction reference / UTR or attach screenshot/PDF.", "warning");
        paymentReference?.focus();
        return;
    }
    if (proofFile && (!allowedProofTypes.includes(proofFile.type) || proofFile.size > 2 * 1024 * 1024)) {
        toastMessageShow("Only JPG, PNG, WEBP or PDF files up to 2 MB are allowed.", "warning");
        return;
    }

    if (amount > remaining) {

        toastMessageShow(
            `Maximum payment is ${money(remaining)}.`,
            "warning"
        );

        return;
    }


    setButtonLoading(
        savePaymentBtn,
        true,
        "Save Payment"
    );


    let uploadedProofPath = null;
    try {
        if (proofFile) {
            const ext = proofFile.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
            uploadedProofPath = "admin-booking/" + currentPaymentBooking.booking_id + "/" + Date.now() + "-" + crypto.randomUUID() + "." + ext;
            const uploadResult = await supabase.storage.from("payment-proofs").upload(uploadedProofPath, proofFile, { contentType: proofFile.type, upsert: false });
            if (uploadResult.error) throw uploadResult.error;
        }
        const { data: paymentResult, error } = await supabase.rpc("admin_add_booking_payment_v2", {
            p_booking_id: Number(currentPaymentBooking.booking_id),
            p_amount: amount,
            p_payment_type: paymentType.value,
            p_payment_method: paymentMethod.value,
            p_payment_note: paymentNote.value.trim() || null,
            p_payment_reference: paymentReference?.value.trim() || null,
            p_payment_date: paymentDate.value || today()
        });
        if (error) throw error;
        if (uploadedProofPath) {
            const paymentId = paymentResult?.payment_id;
            if (!paymentId) throw new Error("Payment was saved but the proof could not be linked. Please contact support.");
            const { error: proofError } = await supabase.from("booking_payments").update({
                payment_proof_path: uploadedProofPath,
                payment_proof_name: proofFile.name.slice(0, 255),
                payment_proof_mime_type: proofFile.type
            }).eq("id", paymentId);
            if (proofError) throw proofError;
        }
        closePaymentModal();


        toastMessageShow(
            "Payment added successfully.",
            "success"
        );


        await loadEverything();

    }
    catch (error) {
        if (uploadedProofPath) {
            await supabase.storage.from("payment-proofs").remove([uploadedProofPath]).catch(() => {});
        }

        console.error(
            "Payment save error:",
            error
        );

        toastMessageShow(
            error.message ||
            "Payment save failed.",
            "error"
        );
    }
    finally {

        setButtonLoading(
            savePaymentBtn,
            false,
            "Save Payment"
        );
    }
}


// ============================================================
// PAYMENT HISTORY
// ============================================================

async function openPaymentHistory(
    bookingId
) {

    currentHistoryBookingId = Number(bookingId);
    const booking =
        collectionData.find(
            item =>
                Number(
                    item.booking_id
                ) === Number(bookingId)
        );


    if (!booking) {

        toastMessageShow(
            "Booking not found.",
            "error"
        );

        return;
    }


    historyCustomerName.textContent =
        booking.customer_name || "—";

    historyBookingNumber.textContent =
        booking.booking_number || "—";

    historyTotalAmount.textContent =
        money(
            booking.final_total
        );

    historyAdvanceAmount.textContent =
        money(
            booking.advance_paid
        );

    historyPaidAmount.textContent =
        money(
            booking.total_paid
        );

    historyRemainingAmount.textContent =
        money(
            booking.remaining_amount
        );


    paymentHistoryBody.innerHTML = `
        <tr>
            <td colspan="6">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading history...
            </td>
        </tr>
    `;


    paymentHistorySection.hidden = false;

    paymentHistorySection.classList.add(
        "active"
    );


    try {

        const {
            data,
            error
        } = await supabase.rpc(
            "admin_get_payment_history_v2",
            {
                p_booking_id:
                    Number(bookingId)
            }
        );


        if (error) {
            throw error;
        }


        renderPaymentHistory(
            Array.isArray(data)
                ? data
                : []
        );


        paymentHistorySection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
    catch (error) {

        console.error(
            "History error:",
            error
        );

        paymentHistoryBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load payment history.
                </td>
            </tr>
        `;

        toastMessageShow(
            error.message ||
            "Payment history failed.",
            "error"
        );
    }
}


// ============================================================
// RENDER PAYMENT HISTORY
// ============================================================

function renderPaymentHistory(
    history
) {

    paymentHistoryBody.innerHTML = "";


    if (!history.length) {

        paymentHistoryBody.innerHTML = `
            <tr>
                <td colspan="6">
                    No payment history found.
                </td>
            </tr>
        `;

        return;
    }


    history.forEach(payment => {

        const type =
            String(
                payment.payment_type ||
                ""
            ).toLowerCase();


        const method =
            String(
                payment.payment_method ||
                ""
            ).toLowerCase();


        const typeText =
            type === "advance"
                ? "Advance"
                : "Remaining";


        const methodText =
            method === "upi"
                ? "UPI"
                : method === "bank"
                    ? "Bank Transfer"
                    : method === "other"
                        ? "Other"
                        : "Cash";


        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>
                ${formatDateTime(
                    payment.payment_date
                )}
            </td>

            <td>
                <strong>
                    ${money(
                        payment.amount
                    )}
                </strong>
            </td>

            <td>
                ${typeText}
            </td>

            <td>
                ${methodText}
            </td>

            <td>
                <div>${escapeHTML(payment.payment_reference || "No reference")}</div>
                <small>${escapeHTML(payment.payment_note || "")}</small>
            </td>
            <td>
                ${payment.payment_method === "cash" ? "Cash · Verification not required" : `<strong>${escapeHTML(payment.verification_status || "pending")}</strong>`}
                ${payment.payment_proof_path ? `<div class="payment-proof-link" data-proof-path="${escapeHTML(payment.payment_proof_path)}"><button type="button" class="view-payment-proof-btn">View proof</button></div>` : ""}
                ${["upi", "bank", "other"].includes(String(payment.payment_method || "").toLowerCase()) && String(payment.verification_status || "pending").toLowerCase() === "pending" ? `<div class="payment-verification-actions"><button type="button" class="verify-payment-btn" data-payment-id="${payment.payment_id}" data-action="verify">Verify</button><button type="button" class="reject-payment-btn" data-payment-id="${payment.payment_id}" data-action="reject">Reject</button></div>` : ""}
                ${payment.verified_at ? `<small>Checked ${escapeHTML(formatDateTime(payment.verified_at))}</small>` : ""}
            </td>

        `;


        paymentHistoryBody.appendChild(
            row
        );
    });
}


// ============================================================
// EXPENSE TABLE
// ============================================================

function renderExpenses() {

    expenseTableBody.innerHTML = "";


    if (!expenseData.length) {

        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    No expenses recorded yet.
                </td>
            </tr>
        `;

        return;
    }


    expenseData.forEach(expense => {

        const method =
            String(
                expense.payment_method ||
                "cash"
            ).toLowerCase();


        const methodText =
            method === "upi"
                ? "UPI"
                : method === "bank"
                    ? "Bank Transfer"
                    : method === "other"
                        ? "Other"
                        : "Cash";


        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>
                ${formatDate(
                    expense.expense_date
                )}
            </td>

            <td>
                <strong>
                    ${escapeHTML(
                        expense.expense_name
                    )}
                </strong>
            </td>

            <td>
                ${escapeHTML(
                    expense.description ||
                    "—"
                )}
            </td>

            <td>
                ${methodText}
            </td>

            <td>
                <strong>
                    ${money(
                        expense.amount
                    )}
                </strong>
            </td>

            <td>

                <div class="money-actions">

                    <button
                        type="button"
                        class="edit-expense-btn"
                        data-id="${expense.expense_id}"
                        title="Edit Expense"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        type="button"
                        class="delete-expense-btn"
                        data-id="${expense.expense_id}"
                        title="Delete Expense"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            </td>

        `;


        expenseTableBody.appendChild(
            row
        );
    });
}


// ============================================================
// OPEN EXPENSE MODAL
// ============================================================

function openExpenseModal(
    expense = null
) {

    expenseForm.reset();


    editingExpenseId =
        expense
            ? Number(
                expense.expense_id
            )
            : null;


    expenseModalTitle.textContent =
        expense
            ? "Edit Expense"
            : "Add Expense";


    expenseId.value =
        expense
            ? expense.expense_id
            : "";


    expenseName.value =
        expense
            ? expense.expense_name || ""
            : "";


    expenseAmount.value =
        expense
            ? expense.amount
            : "";


    expenseDate.value =
        expense
            ? expense.expense_date
            : today();


    expensePaymentMethod.value =
        expense
            ? expense.payment_method || "cash"
            : "cash";


    expenseDescription.value =
        expense
            ? expense.description || ""
            : "";


    expenseModal.hidden = false;

    expenseModal.classList.add(
        "active"
    );

    document.body.classList.add(
        "modal-open"
    );
}


// ============================================================
// CLOSE EXPENSE MODAL
// ============================================================

function closeExpenseModal() {

    expenseModal.hidden = true;

    expenseModal.classList.remove(
        "active"
    );

    document.body.classList.remove(
        "modal-open"
    );

    editingExpenseId = null;
}


// ============================================================
// SAVE EXPENSE
// ============================================================

async function saveExpense(
    event
) {

    event.preventDefault();


    const name =
        expenseName.value.trim();

    const amount =
        Number(
            expenseAmount.value
        );

    const date =
        expenseDate.value ||
        today();

    const method =
        expensePaymentMethod.value;

    const description =
        expenseDescription.value.trim();


    if (!name) {

        toastMessageShow(
            "Please enter expense name.",
            "warning"
        );

        expenseName.focus();

        return;
    }


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        toastMessageShow(
            "Please enter a valid expense amount.",
            "warning"
        );

        expenseAmount.focus();

        return;
    }


    setButtonLoading(
        saveExpenseBtn,
        true,
        "Save Expense"
    );


    try {

        let error;


        if (editingExpenseId) {

            ({
                error
            } = await supabase.rpc(
                "admin_update_expense",
                {
                    p_expense_id:
                        editingExpenseId,

                    p_expense_name:
                        name,

                    p_amount:
                        amount,

                    p_expense_date:
                        date,

                    p_payment_method:
                        method,

                    p_description:
                        description ||
                        null
                }
            ));

        }
        else {

            ({
                error
            } = await supabase.rpc(
                "admin_add_expense",
                {
                    p_expense_name:
                        name,

                    p_amount:
                        amount,

                    p_expense_date:
                        date,

                    p_payment_method:
                        method,

                    p_description:
                        description ||
                        null
                }
            ));
        }


        if (error) {
            throw error;
        }


        closeExpenseModal();


        toastMessageShow(
            editingExpenseId
                ? "Expense updated successfully."
                : "Expense added successfully.",
            "success"
        );


        await loadExpenses();

    }
    catch (error) {

        console.error(
            "Expense save error:",
            error
        );

        toastMessageShow(
            error.message ||
            "Expense save failed.",
            "error"
        );
    }
    finally {

        setButtonLoading(
            saveExpenseBtn,
            false,
            "Save Expense"
        );
    }
}


// ============================================================
// DELETE EXPENSE
// ============================================================

async function deleteExpense(
    id
) {

    const expense =
        expenseData.find(
            item =>
                Number(
                    item.expense_id
                ) === Number(id)
        );


    if (!expense) {
        return;
    }


    const ok =
        confirm(
            `Delete "${expense.expense_name}" expense of ${money(expense.amount)}?`
        );


    if (!ok) {
        return;
    }


    try {

        showLoader(true);


        const {
            error
        } = await supabase.rpc(
            "admin_delete_expense",
            {
                p_expense_id:
                    Number(id)
            }
        );


        if (error) {
            throw error;
        }


        toastMessageShow(
            "Expense deleted successfully.",
            "success"
        );


        await loadExpenses();

    }
    catch (error) {

        console.error(
            "Expense delete error:",
            error
        );

        toastMessageShow(
            error.message ||
            "Expense delete failed.",
            "error"
        );
    }
    finally {

        showLoader(false);
    }
}


// ============================================================
// CLEAR FILTERS
// ============================================================

function clearFilters() {

    searchInput.value = "";
    paymentStatusFilter.value = "all";
    paymentTypeFilter.value = "all";
    fromDate.value = "";
    toDate.value = "";

    applyFilters();
}


// ============================================================
// EVENT LISTENERS
// ============================================================

// Refresh
refreshBtn.addEventListener(
    "click",
    loadEverything
);


// Logout
logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await supabase.auth.signOut();

        }
        catch (error) {

            console.error(
                error
            );
        }

        window.location.href =
            "./admin-login.html";
    }
);


// Search
searchInput.addEventListener(
    "input",
    applyFilters
);


// Status
paymentStatusFilter.addEventListener(
    "change",
    applyFilters
);


// Payment type
paymentTypeFilter.addEventListener(
    "change",
    applyFilters
);


// Clear
clearFiltersBtn.addEventListener(
    "click",
    clearFilters
);


// Date apply
applyDateFilterBtn.addEventListener(
    "click",
    applyFilters
);


// Add payment
addPaymentBtn.addEventListener(
    "click",
    () => openPaymentModal()
);


// Booking select
paymentBookingSelect.addEventListener(
    "change",
    updatePaymentPreview
);


// Payment form
paymentForm.addEventListener(
    "submit",
    savePayment
);


// Cancel payment
cancelPaymentBtn.addEventListener(
    "click",
    closePaymentModal
);


// Close payment
closePaymentModalBtn.addEventListener(
    "click",
    closePaymentModal
);


// Add expense
addExpenseBtn.addEventListener(
    "click",
    () => openExpenseModal()
);


// Expense form
expenseForm.addEventListener(
    "submit",
    saveExpense
);


// Cancel expense
cancelExpenseBtn.addEventListener(
    "click",
    closeExpenseModal
);


// Close expense
closeExpenseModalBtn.addEventListener(
    "click",
    closeExpenseModal
);


// View private proof with a short-lived signed URL.
document.addEventListener("click", async (event) => {
    const button = event.target.closest(".view-payment-proof-btn");
    if (!button) return;
    const wrapper = button.closest(".payment-proof-link");
    const path = wrapper?.dataset.proofPath;
    if (!path) return;
    button.disabled = true;
    try {
        const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 300);
        if (error) throw error;
        if (!data?.signedUrl) throw new Error("Secure link could not be created.");
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
        toastMessageShow(error.message || "Could not open payment proof.", "error");
    } finally {
        button.disabled = false;
    }
});
// Online payment verification: status is changed only through admin-only RPCs.
document.addEventListener("click", async (event) => {
    const button = event.target.closest(".verify-payment-btn, .reject-payment-btn");
    if (!button) return;
    const paymentId = Number(button.dataset.paymentId);
    const action = button.dataset.action;
    if (!Number.isSafeInteger(paymentId) || paymentId <= 0) return;
    let note = null;
    if (action === "reject") {
        note = window.prompt("Reason for rejecting this online payment:");
        if (note === null) return;
        if (!note.trim()) { toastMessageShow("Please enter a rejection reason.", "warning"); return; }
    } else if (!window.confirm("Verify this online payment? Check the actual bank/UPI statement first.")) { return; }
    button.disabled = true;
    try {
        const { error } = await supabase.rpc(action === "verify" ? "admin_verify_online_payment" : "admin_reject_online_payment", { p_payment_id: paymentId, p_note: note });
        if (error) throw error;
        toastMessageShow(action === "verify" ? "Online payment verified." : "Online payment rejected.", "success");
        await loadEverything();
        if (currentHistoryBookingId) await openPaymentHistory(currentHistoryBookingId);
    } catch (error) {
        console.error("Payment verification failed:", error);
        toastMessageShow(error.message || "Could not update payment status.", "error");
        button.disabled = false;
    }
});

// Close history
closeHistoryBtn.addEventListener(
    "click",
    () => {

        paymentHistorySection.hidden =
            true;

        paymentHistorySection.classList.remove(
            "active"
        );
    }
);


// Collection table actions
collectionTableBody.addEventListener(
    "click",
    event => {

        const historyBtn =
            event.target.closest(
                ".history-btn"
            );


        if (historyBtn) {

            openPaymentHistory(
                historyBtn.dataset.id
            );

            return;
        }


        const paymentBtn =
            event.target.closest(
                ".payment-btn"
            );


        if (paymentBtn) {

            openPaymentModal(
                paymentBtn.dataset.id
            );
        }
    }
);


// Expense actions
expenseTableBody.addEventListener(
    "click",
    event => {

        const editBtn =
            event.target.closest(
                ".edit-expense-btn"
            );


        if (editBtn) {

            const expense =
                expenseData.find(
                    item =>
                        Number(
                            item.expense_id
                        ) ===
                        Number(
                            editBtn.dataset.id
                        )
                );


            if (expense) {
                openExpenseModal(
                    expense
                );
            }

            return;
        }


        const deleteBtn =
            event.target.closest(
                ".delete-expense-btn"
            );


        if (deleteBtn) {

            deleteExpense(
                deleteBtn.dataset.id
            );
        }
    }
);


// Payment modal overlay
paymentModal
    .querySelector(".modal-overlay")
    ?.addEventListener(
        "click",
        closePaymentModal
    );


// Expense modal overlay
expenseModal
    .querySelector(".modal-overlay")
    ?.addEventListener(
        "click",
        closeExpenseModal
    );


// ============================================================
// ESC KEY
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        closePaymentModal();
        closeExpenseModal();
    }
);


// ============================================================
// AUTH STATE
// ============================================================

supabase.auth.onAuthStateChange(
    (event, session) => {

        if (
            event === "SIGNED_OUT" ||
            !session
        ) {

            window.location.href =
                "./admin-login.html";
        }
    }
);


// ============================================================
// INITIALIZE
// ============================================================

async function initialize() {

    showLoader(true);

    try {

        const allowed =
            await checkAdmin();

        if (!allowed) {
            return;
        }

        await loadEverything();

    }
    catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        toastMessageShow(
            error.message ||
            "Amount Collection could not be loaded.",
            "error"
        );

    }
    finally {

        showLoader(false);
    }
}


initialize();