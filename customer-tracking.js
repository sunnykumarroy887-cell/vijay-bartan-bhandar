// =========================================================
// CUSTOMER BOOKING TRACKING
// VIJAY BARTAN BHANDAR
// FINAL VERSION
// =========================================================

import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// =========================================================
// SUPABASE CONFIG
// =========================================================

const SUPABASE_URL =
    "https://wkgkczrhgsmnmovyzuss.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// =========================================================
// DOM ELEMENTS
// =========================================================

const trackingForm =
    document.getElementById("trackingForm");

const bookingNumberInput =
    document.getElementById("bookingNumber");

const mobileNumberInput =
    document.getElementById("mobileNumber");

const trackBtn =
    document.getElementById("trackBtn");

const trackBtnText =
    document.getElementById("trackBtnText");

const trackLoader =
    document.getElementById("trackLoader");

const errorBox =
    document.getElementById("errorBox");

const bookingResult =
    document.getElementById("bookingResult");

const refreshBtn =
    document.getElementById("refreshBtn");


// =========================================================
// RESULT ELEMENTS
// =========================================================

const resultBookingNumber =
    document.getElementById("resultBookingNumber");

const statusBadge =
    document.getElementById("statusBadge");

const bookingDate =
    document.getElementById("bookingDate");

const eventDate =
    document.getElementById("eventDate");

const returnDate =
    document.getElementById("returnDate");

const rentalDuration =
    document.getElementById("rentalDuration");

const customerName =
    document.getElementById("customerName");

const customerMobile =
    document.getElementById("customerMobile");

const customerAddress =
    document.getElementById("customerAddress");

const bartanList =
    document.getElementById("bartanList");

const decorationCard =
    document.getElementById("decorationCard");

const decorationList =
    document.getElementById("decorationList");

const notesCard =
    document.getElementById("notesCard");

const bookingNotes =
    document.getElementById("bookingNotes");


// =========================================================
// CURRENT SEARCH
// =========================================================

let currentBookingNumber = "";
let currentMobileNumber = "";


// =========================================================
// STATUS ORDER
// =========================================================

const STATUS_ORDER = [
    "pending",
    "confirmed",
    "issued",
    "return_pending",
    "completed"
];


// =========================================================
// STATUS LABELS
// =========================================================

const STATUS_LABELS = {

    pending:
        "Pending",

    confirmed:
        "Confirmed",

    issued:
        "Bartan Issued",

    return_pending:
        "Return Pending",

    completed:
        "Completed",

    cancelled:
        "Cancelled"

};


// =========================================================
// INITIAL LOAD
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupForm();

        setupUrlParameters();

    }
);


// =========================================================
// FORM SETUP
// =========================================================

function setupForm() {

    if (trackingForm) {

        trackingForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const bookingNumber =
                    bookingNumberInput.value.trim();

                const mobile =
                    mobileNumberInput.value
                        .replace(/\D/g, "")
                        .trim();


                if (!bookingNumber) {

                    showError(
                        "Please enter your booking number."
                    );

                    return;
                }


                if (!isValidMobile(mobile)) {

                    showError(
                        "Please enter a valid 10-digit mobile number."
                    );

                    return;
                }


                await trackBooking(
                    bookingNumber,
                    mobile
                );

            }
        );

    }


    // =====================================================
    // REFRESH
    // =====================================================

    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            async () => {

                if (
                    currentBookingNumber &&
                    currentMobileNumber
                ) {

                    await trackBooking(
                        currentBookingNumber,
                        currentMobileNumber
                    );

                }

            }
        );

    }


    // =====================================================
    // MOBILE INPUT
    // =====================================================

    if (mobileNumberInput) {

        mobileNumberInput.addEventListener(
            "input",
            () => {

                mobileNumberInput.value =
                    mobileNumberInput.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

            }
        );

    }

}


// =========================================================
// URL PARAMETERS
// =========================================================

function setupUrlParameters() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const booking =
        params.get("booking");

    const mobile =
        params.get("mobile");


    if (booking && bookingNumberInput) {

        bookingNumberInput.value =
            booking.trim();

    }


    if (mobile && mobileNumberInput) {

        mobileNumberInput.value =
            mobile
                .replace(/\D/g, "")
                .slice(0, 10);

    }


    if (booking && mobile) {

        const cleanMobile =
            mobile
                .replace(/\D/g, "")
                .slice(0, 10);

        if (isValidMobile(cleanMobile)) {

            trackBooking(
                booking.trim(),
                cleanMobile
            );

        }

    }

}


// =========================================================
// TRACK BOOKING
// =========================================================

async function trackBooking(
    bookingNumber,
    mobile
) {

    hideError();

    hideResult();

    setLoading(true);


    try {

        const {
            data,
            error
        } = await supabase.rpc(
            "get_customer_booking_tracking",
            {
                p_booking_number:
                    bookingNumber,

                p_mobile:
                    mobile
            }
        );


        if (error) {

            console.error(
                "Tracking RPC error:",
                error
            );

            throw new Error(
                "Unable to load booking details."
            );

        }


        // =================================================
        // RPC MAY RETURN OBJECT OR ARRAY
        // =================================================

        const response =
            Array.isArray(data)
                ? data[0]
                : data;


        if (
            !response ||
            response.success !== true
        ) {

            throw new Error(
                "Booking not found. Please check your booking number and mobile number."
            );

        }


        if (!response.booking) {

            throw new Error(
                "Booking details are not available."
            );

        }


        currentBookingNumber =
            String(
                response.booking.booking_number ||
                bookingNumber
            );

        currentMobileNumber =
            mobile;


        renderBooking(
            response.booking
        );


    } catch (error) {

        console.error(
            "Booking tracking error:",
            error
        );

        showError(
            error.message ||
            "Unable to track booking."
        );

    } finally {

        setLoading(false);

    }

}


// =========================================================
// RENDER BOOKING
// =========================================================

function renderBooking(
    booking
) {

    if (!bookingResult) {
        return;
    }


    bookingResult.classList.remove(
        "hidden"
    );


    // =====================================================
    // BOOKING NUMBER
    // =====================================================

    if (resultBookingNumber) {

        resultBookingNumber.textContent =
            booking.booking_number || "-";

    }


    // =====================================================
    // STATUS
    // IMPORTANT:
    // DATABASE STATUS IS USED DIRECTLY.
    // =====================================================

    const status =
        normalizeStatus(
            booking.status
        );


    renderStatus(
        status
    );


    // =====================================================
    // DATES
    // =====================================================

    if (bookingDate) {

        bookingDate.textContent =
            formatDateTime(
                booking.created_at
            );

    }


    if (eventDate) {

        eventDate.textContent =
            formatDate(
                booking.event_date
            );

    }


    if (returnDate) {

        returnDate.textContent =
            formatDate(
                booking.return_date
            );

    }


    // =====================================================
    // RENTAL DURATION
    // =====================================================

    if (rentalDuration) {

        rentalDuration.textContent =
            calculateRentalDuration(
                booking.event_date,
                booking.return_date
            );

    }


    // =====================================================
    // CUSTOMER
    // =====================================================

    if (customerName) {

        customerName.textContent =
            booking.customer_name || "-";

    }


    if (customerMobile) {

        customerMobile.textContent =
            maskMobile(
                booking.customer_mobile
            );

    }


    if (customerAddress) {

        customerAddress.textContent =
            booking.customer_address || "-";

    }


    // =====================================================
    // BARTAN
    // =====================================================

    renderBartan(
        booking.bartan_items
    );


    // =====================================================
    // DECORATIONS
    // =====================================================

    renderDecorations(
        booking.decorations
    );


    // =====================================================
    // NOTES
    // =====================================================

    renderNotes(
        booking.notes
    );


    // =====================================================
    // SCROLL
    // =====================================================

    setTimeout(
        () => {

            bookingResult.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        },
        100
    );

}


// =========================================================
// RENDER STATUS
// =========================================================

function renderStatus(
    status
) {

    // =====================================================
    // ALWAYS NORMALIZE FIRST
    // =====================================================

    const normalizedStatus =
        normalizeStatus(
            status
        );


    // =====================================================
    // STATUS BADGE
    // =====================================================

    if (statusBadge) {

        statusBadge.textContent =
            STATUS_LABELS[
                normalizedStatus
            ] || "Pending";


        // Remove possible old status classes

        statusBadge.classList.remove(
            "pending",
            "confirmed",
            "issued",
            "return_pending",
            "completed",
            "cancelled",
            "status-pending",
            "status-confirmed",
            "status-issued",
            "status-return_pending",
            "status-completed",
            "status-cancelled"
        );


        // Add current status class

        statusBadge.classList.add(
            `status-${normalizedStatus}`
        );

    }


    // =====================================================
    // CANCELLED
    // =====================================================

    if (
        normalizedStatus === "cancelled"
    ) {

        updateTimeline(
            "cancelled"
        );

        return;

    }


    // =====================================================
    // NORMAL STATUS
    // =====================================================

    updateTimeline(
        normalizedStatus
    );

}


// =========================================================
// UPDATE TIMELINE
// =========================================================

function updateTimeline(
    status
) {

    const normalizedStatus =
        normalizeStatus(
            status
        );


    // =====================================================
    // GET ALL TIMELINE ITEMS
    //
    // Supports:
    // data-status="pending"
    // data-status-step="pending"
    // =====================================================

    const timelineItems =
        document.querySelectorAll(
            ".timeline-item, [data-status-step]"
        );


    // =====================================================
    // RESET ALL STATES
    // =====================================================

    timelineItems.forEach(
        (item) => {

            item.classList.remove(
                "active",
                "completed",
                "current",
                "is-completed",
                "is-current",
                "is-cancelled"
            );

        }
    );


    // =====================================================
    // CANCELLED
    // =====================================================

    if (
        normalizedStatus === "cancelled"
    ) {

        timelineItems.forEach(
            (item) => {

                item.classList.add(
                    "is-cancelled"
                );

            }
        );

        return;

    }


    // =====================================================
    // CURRENT STATUS INDEX
    // =====================================================

    const currentIndex =
        STATUS_ORDER.indexOf(
            normalizedStatus
        );


    // =====================================================
    // UNKNOWN STATUS
    //
    // SAFETY:
    // UNKNOWN = PENDING
    // NEVER CONFIRMED
    // =====================================================

    const safeIndex =
        currentIndex >= 0
            ? currentIndex
            : 0;


    // =====================================================
    // UPDATE TIMELINE
    // =====================================================

    timelineItems.forEach(
        (item) => {

            let itemStatus =
                item.dataset.status ||
                item.dataset.statusStep ||
                "";


            itemStatus =
                normalizeStatus(
                    itemStatus
                );


            const itemIndex =
                STATUS_ORDER.indexOf(
                    itemStatus
                );


            if (itemIndex < 0) {

                return;

            }


            // =================================================
            // PREVIOUS STEPS
            // =================================================

            if (
                itemIndex < safeIndex
            ) {

                item.classList.add(
                    "active",
                    "completed",
                    "is-completed"
                );

            }


            // =================================================
            // CURRENT STEP
            // =================================================

            else if (
                itemIndex === safeIndex
            ) {

                item.classList.add(
                    "active",
                    "current",
                    "is-current"
                );

            }

        }
    );

}


// =========================================================
// BARTAN
// =========================================================

function renderBartan(
    items
) {

    if (!bartanList) {
        return;
    }


    bartanList.innerHTML =
        "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "bartan-row";


        const name =
            document.createElement(
                "span"
            );

        name.className =
            "bartan-name";

        name.textContent =
            "No bartan information available.";


        row.appendChild(
            name
        );

        bartanList.appendChild(
            row
        );

        return;

    }


    items.forEach(
        (item) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "bartan-row";


            const name =
                document.createElement(
                    "span"
                );

            name.className =
                "bartan-name";

            name.textContent =
                item?.name ||
                "Bartan";


            const quantity =
                document.createElement(
                    "span"
                );

            quantity.className =
                "bartan-quantity";

            quantity.textContent =
                `Quantity: ${Number(
                    item?.quantity || 0
                )}`;


            row.appendChild(
                name
            );

            row.appendChild(
                quantity
            );


            bartanList.appendChild(
                row
            );

        }
    );

}


// =========================================================
// DECORATIONS
// =========================================================

function renderDecorations(
    decorations
) {

    if (
        !decorationCard ||
        !decorationList
    ) {

        return;

    }


    decorationList.innerHTML =
        "";


    if (
        !Array.isArray(decorations) ||
        decorations.length === 0
    ) {

        decorationCard.classList.add(
            "hidden"
        );

        return;

    }


    decorationCard.classList.remove(
        "hidden"
    );


    decorations.forEach(
        (decoration) => {

            const tag =
                document.createElement(
                    "span"
                );

            tag.className =
                "decoration-tag";

            tag.textContent =
                decoration?.name ||
                "Decoration";


            decorationList.appendChild(
                tag
            );

        }
    );

}


// =========================================================
// NOTES
// =========================================================

function renderNotes(
    notes
) {

    if (
        !notesCard ||
        !bookingNotes
    ) {

        return;

    }


    if (
        !notes ||
        !String(notes).trim()
    ) {

        notesCard.classList.add(
            "hidden"
        );

        bookingNotes.textContent =
            "";

        return;

    }


    notesCard.classList.remove(
        "hidden"
    );


    bookingNotes.textContent =
        String(notes);

}


// =========================================================
// RENTAL DURATION
// =========================================================

function calculateRentalDuration(
    eventDateValue,
    returnDateValue
) {

    if (!eventDateValue) {

        return "-";

    }


    const start =
        new Date(
            `${eventDateValue}T00:00:00`
        );


    const end =
        returnDateValue
            ? new Date(
                `${returnDateValue}T00:00:00`
            )
            : start;


    if (
        Number.isNaN(
            start.getTime()
        ) ||
        Number.isNaN(
            end.getTime()
        )
    ) {

        return "-";

    }


    const difference =
        end.getTime() -
        start.getTime();


    const days =
        Math.floor(
            difference /
            (1000 * 60 * 60 * 24)
        ) + 1;


    if (days <= 1) {

        return "1 Day";

    }


    return `${days} Days`;

}


// =========================================================
// DATE FORMAT
// =========================================================

function formatDate(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

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


// =========================================================
// DATE + TIME
// =========================================================

function formatDateTime(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );

}


// =========================================================
// MOBILE VALIDATION
// =========================================================

function isValidMobile(
    mobile
) {

    const digits =
        String(mobile || "")
            .replace(/\D/g, "");


    return /^[6-9]\d{9}$/.test(
        digits
    );

}


// =========================================================
// MOBILE MASK
// =========================================================

function maskMobile(
    mobile
) {

    if (!mobile) {

        return "-";

    }


    const digits =
        String(mobile)
            .replace(/\D/g, "");


    if (digits.length < 10) {

        return String(mobile);

    }


    return (
        digits.slice(0, 2) +
        "******" +
        digits.slice(-2)
    );

}


// =========================================================
// STATUS NORMALIZATION
// IMPORTANT:
// NEVER CONVERT PENDING TO CONFIRMED
// =========================================================

function normalizeStatus(
    status
) {

    const value =
        String(
            status ?? ""
        )
        .trim()
        .toLowerCase()
        .replace(
            /[\s-]+/g,
            "_"
        );


    switch (value) {

        case "pending":
            return "pending";


        case "confirmed":
            return "confirmed";


        case "issued":
            return "issued";


        case "return_pending":
            return "return_pending";


        case "returnpending":
            return "return_pending";


        case "completed":
            return "completed";


        case "cancelled":
            return "cancelled";


        case "canceled":
            return "cancelled";


        // =================================================
        // SAFETY RULE
        //
        // Unknown/empty status MUST NOT become confirmed.
        // =================================================

        default:
            return "pending";

    }

}


// =========================================================
// LOADING
// =========================================================

function setLoading(
    loading
) {

    if (trackBtn) {

        trackBtn.disabled =
            loading;

    }


    if (trackBtnText) {

        trackBtnText.textContent =
            loading
                ? "Checking..."
                : "Track Booking";

    }


    if (trackLoader) {

        if (loading) {

            trackLoader.classList.remove(
                "hidden"
            );

        } else {

            trackLoader.classList.add(
                "hidden"
            );

        }

    }

}


// =========================================================
// ERROR
// =========================================================

function showError(
    message
) {

    if (!errorBox) {
        return;
    }


    errorBox.textContent =
        message;


    errorBox.classList.remove(
        "hidden"
    );

}


function hideError() {

    if (!errorBox) {
        return;
    }


    errorBox.classList.add(
        "hidden"
    );


    errorBox.textContent =
        "";

}


// =========================================================
// HIDE RESULT
// =========================================================

function hideResult() {

    if (!bookingResult) {
        return;
    }


    bookingResult.classList.add(
        "hidden"
    );

}