import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ======================================================
// SUPABASE CONFIG
// ======================================================

const SUPABASE_URL =
    "https://wkgkczrhgsmnmovyzuss.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ======================================================
// BUSINESS
// ======================================================

const BUSINESS_NAME =
    "विजय बर्तन भंडार";

const WHATSAPP_NUMBER =
    "916201852300";


// ======================================================
// DOM - BOOKING
// ======================================================

const form =
    document.getElementById("customerBookingForm");

const customerName =
    document.getElementById("customerName");

const customerMobile =
    document.getElementById("customerMobile");

const customerAddress =
    document.getElementById("customerAddress");

const eventDate =
    document.getElementById("eventDate");

const returnDate =
    document.getElementById("returnDate");

const specialRequirement =
    document.getElementById("specialRequirement");

// SERVICE TYPE CHOOSER
let selectedServiceType = "";
const serviceChooser = document.getElementById("serviceTypeChooser");
const serviceChoiceHint = document.getElementById("serviceChoiceHint");
const bartanServiceSection = document.getElementById("bartanServiceSection");
const decorationServiceSection = document.getElementById("decorationServiceSection");
function applyServiceType(type) {
    if (!["bartan", "decoration", "both"].includes(type)) return;
    selectedServiceType = type;
    serviceChooser?.querySelectorAll("[data-service-choice]").forEach(card => {
        const active = card.dataset.serviceChoice === type;
        card.classList.toggle("selected", active);
        card.setAttribute("aria-pressed", String(active));
    });
    if (bartanServiceSection) bartanServiceSection.hidden = type === "decoration";
    if (decorationServiceSection) decorationServiceSection.hidden = type === "bartan";
    if (decorationRequired) {
        decorationRequired.checked = type !== "bartan";
        decorationRequired.disabled = type !== "both";
        decorationRequired.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (serviceChoiceHint) serviceChoiceHint.textContent = ({
        bartan: "आपने केवल Bartan Service चुनी है। केवल बर्तनों का चयन करें।",
        decoration: "आपने केवल Decoration Service चुनी है। सजावट का चयन करें।",
        both: "आपने दोनों सेवाएँ चुनी हैं। बर्तन और सजावट दोनों चुनें।"
    })[type];
    form?.scrollIntoView({behavior:"smooth", block:"start"});
}
serviceChooser?.querySelectorAll("[data-service-choice]").forEach(card => {
    card.addEventListener("click", () => applyServiceType(card.dataset.serviceChoice));
});

const decorationRequired =
    document.getElementById("decorationRequired");

const decorationArea =
    document.getElementById("decorationArea");

const bartanList =
    document.getElementById("bartanList");

const decorationList =
    document.getElementById("decorationList");

const bartanEmpty =
    document.getElementById("bartanEmpty");

const submitButton =
    document.getElementById("submitBooking");

const successSection =
    document.getElementById("successSection");

const bookingNumberElement =
    document.getElementById("bookingNumber");

const whatsappConfirm =
    document.getElementById("whatsappConfirm");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const toastIcon =
    document.getElementById("toastIcon");

const characterCount =
    document.getElementById("characterCount");


// ======================================================
// DOM - TRACKING
// ======================================================

const trackingSection =
    document.getElementById("trackingSection");

const trackingForm =
    document.getElementById("trackingForm");

const trackingBookingNumber =
    document.getElementById("trackingBookingNumber");

const trackingMobile =
    document.getElementById("trackingMobile");

const trackBookingButton =
    document.getElementById("trackBookingButton");

const trackingLoading =
    document.getElementById("trackingLoading");

const trackingError =
    document.getElementById("trackingError");

const trackingErrorMessage =
    document.getElementById("trackingErrorMessage");

const trackingResult =
    document.getElementById("trackingResult");

const trackingResultBookingNumber =
    document.getElementById("trackingResultBookingNumber");

const trackingStatusBadge =
    document.getElementById("trackingStatusBadge");

const trackingCustomerName =
    document.getElementById("trackingCustomerName");

const trackingCustomerMobile =
    document.getElementById("trackingCustomerMobile");

const trackingCreatedDate =
    document.getElementById("trackingCreatedDate");

const trackingEventDate =
    document.getElementById("trackingEventDate");

const trackingReturnDate =
    document.getElementById("trackingReturnDate");

const trackingCustomerAddress =
    document.getElementById("trackingCustomerAddress");

const trackingBartanList =
    document.getElementById("trackingBartanList");

const trackingDecorationSection =
    document.getElementById("trackingDecorationSection");

const trackingDecorationList =
    document.getElementById("trackingDecorationList");

const trackingNotesSection =
    document.getElementById("trackingNotesSection");

const trackingNotes =
    document.getElementById("trackingNotes");

const refreshTrackingButton =
    document.getElementById("refreshTrackingButton");


// ======================================================
// STATE
// ======================================================

let bartanData = [];

let decorationData = [];

const selectedBartan =
    new Map();

const selectedDecorations =
    new Set();

let lastTrackingRequest = null;


// ======================================================
// INITIALIZATION
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setMinimumDates();

        setupEvents();

        setupTrackingEvents();

        await Promise.all([
            loadBartan(),
            loadDecorations()
        ]);

    }
);


// ======================================================
// EVENTS
// ======================================================

function setupEvents() {

    // ==================================================
    // DECORATION TOGGLE
    // ==================================================

    if (decorationRequired) {

        decorationRequired.addEventListener(
            "change",
            () => {

                if (decorationArea) {

                    decorationArea.classList.toggle(
                        "hidden",
                        !decorationRequired.checked
                    );

                }


                if (!decorationRequired.checked) {

                    selectedDecorations.clear();

                    renderDecorations();

                }

            }
        );

    }


    // ==================================================
    // SPECIAL REQUIREMENT CHARACTER COUNT
    // ==================================================

    if (
        specialRequirement &&
        characterCount
    ) {

        characterCount.textContent =
            specialRequirement.value.length;


        specialRequirement.addEventListener(
            "input",
            () => {

                characterCount.textContent =
                    specialRequirement.value.length;

            }
        );

    }


    // ==================================================
    // CUSTOMER MOBILE
    // ==================================================

    if (customerMobile) {

        customerMobile.addEventListener(
            "input",
            () => {

                customerMobile.value =
                    customerMobile.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

            }
        );

    }


    // ==================================================
    // EVENT DATE
    // ==================================================

    if (eventDate) {

        eventDate.addEventListener(
            "change",
            async () => {

                if (returnDate) {

                    returnDate.min =
                        eventDate.value;


                    if (
                        returnDate.value &&
                        returnDate.value <
                        eventDate.value
                    ) {

                        returnDate.value = "";

                    }

                }


                selectedBartan.clear();

                await loadBartan();

            }
        );

    }


    // ==================================================
    // RETURN DATE
    // ==================================================

    if (returnDate) {

        returnDate.addEventListener(
            "change",
            async () => {

                if (
                    eventDate &&
                    returnDate.value &&
                    returnDate.value <
                    eventDate.value
                ) {

                    returnDate.value = "";

                    selectedBartan.clear();

                    showToast(
                        "Return date event date से पहले नहीं हो सकती।",
                        "error"
                    );

                    await loadBartan();

                    return;

                }


                selectedBartan.clear();

                await loadBartan();

            }
        );

    }


    // ==================================================
    // BOOKING SUBMIT
    // ==================================================

    if (form) {

        form.addEventListener(
            "submit",
            handleSubmit
        );

    }

}


// ======================================================
// TRACKING EVENTS
// ======================================================

function setupTrackingEvents() {

    if (!trackingForm) {
        return;
    }


    // ==================================================
    // TRACKING MOBILE INPUT
    // ==================================================

    if (trackingMobile) {

        trackingMobile.addEventListener(
            "input",
            () => {

                trackingMobile.value =
                    trackingMobile.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

            }
        );

    }


    // ==================================================
    // TRACKING FORM SUBMIT
    // ==================================================

    trackingForm.addEventListener(
        "submit",
        handleTrackingSubmit
    );


    // ==================================================
    // REFRESH
    // ==================================================

    if (refreshTrackingButton) {

        refreshTrackingButton.addEventListener(
            "click",
            () => {

                if (
                    lastTrackingRequest &&
                    lastTrackingRequest.bookingNumber &&
                    lastTrackingRequest.mobile
                ) {

                    loadTrackedBooking(
                        lastTrackingRequest.bookingNumber,
                        lastTrackingRequest.mobile
                    );

                } else {

                    if (trackingForm) {

                        trackingForm.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                    }

                    if (trackingBookingNumber) {
                        trackingBookingNumber.focus();
                    }

                }

            }
        );

    }

}


// ======================================================
// DATE
// ======================================================

function setMinimumDates() {

    const today =
        new Date();


    const localDate =
        new Date(
            today.getTime() -
            today.getTimezoneOffset() * 60000
        )
            .toISOString()
            .split("T")[0];


    if (eventDate) {

        eventDate.min =
            localDate;

    }


    if (returnDate) {

        returnDate.min =
            localDate;

    }

}


// ======================================================
// LOAD BARTAN
// ======================================================

async function loadBartan() {

    if (!bartanList) {
        return;
    }


    bartanList.innerHTML = `
        <div class="catalog-loading">
            <div class="loading-spinner"></div>
            <span>Checking availability...</span>
        </div>
    `;


    try {

        const {
            data: items,
            error: itemsError
        } = await supabase
            .from("bartan_items")
            .select(
                "id,name,is_active"
            )
            .eq(
                "is_active",
                true
            )
            .order(
                "name"
            );


        if (itemsError) {

            throw itemsError;

        }


        const activeItems =
            Array.isArray(items)
                ? items
                : [];


        const selectedEventDate =
            eventDate?.value || null;


        const selectedReturnDate =
            returnDate?.value || null;


        if (!selectedEventDate) {

            bartanData =
                activeItems.map(item => ({

                    id:
                        item.id,

                    name:
                        item.name,

                    is_active:
                        true,

                    available_quantity:
                        0,

                    availability_status:
                        "date_required"

                }));


            selectedBartan.clear();

            renderBartan();

            return;

        }


        if (
            selectedReturnDate &&
            selectedReturnDate <
            selectedEventDate
        ) {

            selectedBartan.clear();

            showToast(
                "Return date event date से पहले नहीं हो सकती।",
                "error"
            );

            bartanData =
                activeItems.map(item => ({

                    id:
                        item.id,

                    name:
                        item.name,

                    is_active:
                        true,

                    available_quantity:
                        0,

                    availability_status:
                        "invalid_date"

                }));


            renderBartan();

            return;

        }


        const {
            data: availabilityData,
            error: availabilityError
        } = await supabase.rpc(
            "get_customer_bartan_availability",
            {
                p_event_date:
                    selectedEventDate,

                p_return_date:
                    selectedReturnDate || null
            }
        );


        if (availabilityError) {

            throw availabilityError;

        }


        const availabilityRows =
            Array.isArray(availabilityData)
                ? availabilityData
                : [];


        const availabilityMap =
            new Map();


        availabilityRows.forEach(
            item => {

                const id =
                    String(item.id);


                const quantity =
                    Math.max(
                        0,
                        Number(
                            item.available_quantity ?? 0
                        )
                    );


                availabilityMap.set(
                    id,
                    {
                        available:
                            quantity > 0,

                        available_quantity:
                            quantity
                    }
                );

            }
        );


        bartanData =
            activeItems.map(item => {

                const id =
                    String(item.id);


                const availability =
                    availabilityMap.get(id);


                const availableQuantity =
                    Math.max(
                        0,
                        Number(
                            availability?.available_quantity ??
                            0
                        )
                    );


                return {

                    id:
                        item.id,

                    name:
                        item.name,

                    is_active:
                        true,

                    available_quantity:
                        availableQuantity,

                    availability_status:
                        availableQuantity > 0
                            ? "available"
                            : "unavailable"

                };

            });


        for (
            const [
                id,
                quantity
            ]
            of selectedBartan
        ) {

            const item =
                bartanData.find(
                    bartan =>
                        String(bartan.id) ===
                        String(id)
                );


            const availableQuantity =
                Number(
                    item?.available_quantity ?? 0
                );


            if (
                !item ||
                availableQuantity <= 0
            ) {

                selectedBartan.delete(id);

                continue;

            }


            if (
                quantity >
                availableQuantity
            ) {

                selectedBartan.set(
                    id,
                    availableQuantity
                );

            }

        }


        renderBartan();


    } catch (error) {

        console.error(
            "Bartan availability loading error:",
            error
        );


        bartanData = [];

        selectedBartan.clear();


        if (bartanEmpty) {

            bartanEmpty.classList.remove(
                "hidden"
            );

        }


        bartanList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h4>
                    बर्तन availability load नहीं हो सकी
                </h4>

                <p>
                    कृपया थोड़ी देर बाद page refresh करें।
                </p>

            </div>
        `;

    }

}


// ======================================================
// RENDER BARTAN
// ======================================================

function renderBartan() {

    if (!bartanList) {
        return;
    }


    if (!bartanData.length) {

        bartanList.innerHTML = "";


        if (bartanEmpty) {

            bartanEmpty.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (bartanEmpty) {

        bartanEmpty.classList.add(
            "hidden"
        );

    }


    bartanList.innerHTML =
        bartanData
            .map(item => {

                const id =
                    String(item.id);


                const availableQuantity =
                    Math.max(
                        0,
                        Number(
                            item.available_quantity ?? 0
                        )
                    );


                let quantity =
                    Number(
                        selectedBartan.get(id) || 0
                    );


                if (
                    quantity >
                    availableQuantity
                ) {

                    quantity =
                        availableQuantity;

                }


                if (quantity <= 0) {

                    selectedBartan.delete(id);

                    quantity = 0;

                } else {

                    selectedBartan.set(
                        id,
                        quantity
                    );

                }


                const hasDate =
                    Boolean(
                        eventDate?.value
                    );


                const available =
                    hasDate &&
                    availableQuantity > 0;


                const selected =
                    quantity > 0;


                let statusText;


                if (!hasDate) {

                    statusText =
                        "Event Date चुनें";

                } else if (available) {

                    statusText =
                        "Available";

                } else {

                    statusText =
                        "Unavailable";

                }


                let availabilityText;


                if (!hasDate) {

                    availabilityText =
                        "Event Date चुनने के बाद availability दिखाई जाएगी";

                } else if (available) {

                    availabilityText =
                        `${availableQuantity} available`;

                } else {

                    availabilityText =
                        "अभी उपलब्ध नहीं है";

                }


                return `
                    <div
                        class="catalog-item ${
                            selected
                                ? "is-selected"
                                : ""
                        } ${
                            !available
                                ? "is-unavailable"
                                : ""
                        }"
                        data-bartan-id="${escapeHtml(id)}"
                    >

                        <div class="catalog-item-top">

                            <strong class="catalog-item-name">
                                ${escapeHtml(item.name)}
                            </strong>

                            <span
                                class="catalog-status ${
                                    available
                                        ? ""
                                        : "status-unavailable"
                                }"
                            >
                                ${statusText}
                            </span>

                        </div>


                        <div class="quantity-row">

                            <span class="quantity-label">
                                Quantity
                            </span>


                            <div class="quantity-control">

                                <button
                                    type="button"
                                    class="quantity-btn"
                                    data-action="minus"
                                    data-id="${escapeHtml(id)}"
                                    aria-label="Decrease quantity"
                                    ${
                                        !available ||
                                        quantity <= 0
                                            ? "disabled"
                                            : ""
                                    }
                                >
                                    −
                                </button>


                                <span
                                    class="quantity-value"
                                    id="qty-${escapeHtml(id)}"
                                >
                                    ${quantity}
                                </span>


                                <button
                                    type="button"
                                    class="quantity-btn"
                                    data-action="plus"
                                    data-id="${escapeHtml(id)}"
                                    aria-label="Increase quantity"
                                    ${
                                        !available ||
                                        quantity >= availableQuantity
                                            ? "disabled"
                                            : ""
                                    }
                                >
                                    +
                                </button>

                            </div>

                        </div>


                        <small
                            class="availability-text ${
                                !available
                                    ? "unavailable-text"
                                    : ""
                            }"
                        >
                            ${availabilityText}
                        </small>

                    </div>
                `;

            })
            .join("");


    bartanList
        .querySelectorAll(
            ".quantity-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        button.disabled
                    ) {

                        return;

                    }


                    updateBartanQuantity(
                        button.dataset.id,
                        button.dataset.action
                    );

                }
            );

        });

}


// ======================================================
// BARTAN QUANTITY
// ======================================================

function updateBartanQuantity(
    id,
    action
) {

    if (
        !eventDate ||
        !eventDate.value
    ) {

        showToast(
            "पहले Event Date चुनें।",
            "error"
        );

        return;

    }


    const item =
        bartanData.find(
            bartan =>
                String(bartan.id) ===
                String(id)
        );


    if (!item) {
        return;
    }


    const maximumQuantity =
        Math.max(
            0,
            Number(
                item.available_quantity ?? 0
            )
        );


    if (
        maximumQuantity <= 0
    ) {

        selectedBartan.delete(id);

        renderBartan();

        return;

    }


    let quantity =
        Number(
            selectedBartan.get(id) || 0
        );


    if (action === "plus") {

        if (
            quantity <
            maximumQuantity
        ) {

            quantity += 1;

        }

    } else if (
        action === "minus"
    ) {

        quantity -= 1;

    }


    quantity =
        Math.max(
            0,
            Math.min(
                quantity,
                maximumQuantity
            )
        );


    if (quantity === 0) {

        selectedBartan.delete(id);

    } else {

        selectedBartan.set(
            id,
            quantity
        );

    }


    renderBartan();

}


// ======================================================
// LOAD DECORATIONS
// ======================================================

async function loadDecorations() {

    if (!decorationList) {
        return;
    }


    decorationList.innerHTML = `
        <div class="catalog-loading">
            <div class="loading-spinner"></div>
            <span>Loading decoration...</span>
        </div>
    `;


    try {

        const {
            data,
            error
        } = await supabase
            .from("decorations")
            .select(
                "id,name,category,description,image_url,is_active,display_order"
            )
            .eq(
                "is_active",
                true
            )
            .order(
                "display_order"
            )
            .order(
                "name"
            );


        if (error) {
            throw error;
        }


        decorationData =
            Array.isArray(data)
                ? data
                : [];


        renderDecorations();


    } catch (error) {

        console.error(
            "Decoration loading error:",
            error
        );


        decorationData = [];


        decorationList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🌸
                </div>

                <h4>
                    Decoration catalogue unavailable
                </h4>

                <p>
                    आप Special Requirement में
                    decoration की अपनी जरूरत लिख सकते हैं।
                </p>

            </div>
        `;

    }

}


// ======================================================
// RENDER DECORATIONS
// ======================================================

function renderDecorations() {

    if (!decorationList) {
        return;
    }


    if (!decorationData.length) {

        decorationList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🌸
                </div>

                <h4>
                    अभी Decoration उपलब्ध नहीं है
                </h4>

                <p>
                    अपनी decoration requirement
                    नीचे message में लिख सकते हैं।
                </p>

            </div>
        `;

        return;

    }


    decorationList.innerHTML =
        decorationData
            .map(item => {

                const id =
                    String(item.id);


                const selected =
                    selectedDecorations.has(id);


                const description =
                    item.description ||
                    item.category ||
                    "Decoration service available";


                return `
                    <div
                        class="catalog-item decoration-item ${
                            selected
                                ? "is-selected"
                                : ""
                        }"
                        data-decoration-id="${escapeHtml(id)}"
                    >

                        <div>

                            <div class="catalog-item-top">

                                <strong
                                    class="catalog-item-name"
                                >
                                    ${escapeHtml(item.name)}
                                </strong>


                                <span
                                    class="decoration-check"
                                >
                                    ${
                                        selected
                                            ? "✓"
                                            : ""
                                    }
                                </span>

                            </div>


                            <p class="decoration-description">
                                ${escapeHtml(description)}
                            </p>

                        </div>


                        <span class="catalog-status">
                            ${
                                selected
                                    ? "Selected"
                                    : "Select"
                            }
                        </span>

                    </div>
                `;

            })
            .join("");


    decorationList
        .querySelectorAll(
            ".decoration-item"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    toggleDecoration(
                        card.dataset.decorationId
                    );

                }
            );

        });

}


// ======================================================
// TOGGLE DECORATION
// ======================================================

function toggleDecoration(id) {

    if (selectedDecorations.has(id)) {

        selectedDecorations.delete(id);

    } else {

        selectedDecorations.add(id);

    }


    renderDecorations();

}


// ======================================================
// BOOKING SUBMIT
// ======================================================

async function handleSubmit(event) {

    event.preventDefault();

    clearErrors();


    if (!selectedServiceType) {
        showToast("कृपया पहले Bartan, Decoration या दोनों में से एक सेवा चुनें।", "error");
        serviceChooser?.scrollIntoView({behavior:"smooth",block:"center"});
        return;
    }

    const validation =
        validateForm();


    if (!validation.valid) {

        showToast(
            validation.message,
            "error"
        );


        if (validation.firstField) {

            validation.firstField.focus();

        }

        return;

    }


    if (!submitButton) {

        showToast(
            "Booking form सही तरह से load नहीं हुआ। कृपया page refresh करें।",
            "error"
        );

        return;

    }


    const originalText =
        submitButton.innerHTML;


    submitButton.disabled = true;


    submitButton.innerHTML = `
        <span class="submit-text">
            Booking भेजी जा रही है...
        </span>

        <span class="submit-arrow">
            ⏳
        </span>
    `;


    try {

        const selectedItems =
            getSelectedBartan();


        const selectedDecorationItems =
            getSelectedDecorations();


        if (
            (selectedServiceType === "bartan" && selectedItems.length === 0) ||
            (selectedServiceType === "decoration" && selectedDecorationItems.length === 0) ||
            (selectedServiceType === "both" && (selectedItems.length === 0 || selectedDecorationItems.length === 0))
        ) {

            throw new Error(
                selectedServiceType === "bartan"
                    ? "कृपया कम से कम एक Bartan item चुनें।"
                    : selectedServiceType === "decoration"
                        ? "कृपया कम से कम एक Decoration service चुनें।"
                        : "कृपया Bartan और Decoration दोनों में से items चुनें।"
            );

        }


        for (
            const item
            of selectedItems
        ) {

            const source =
                bartanData.find(
                    bartan =>
                        String(bartan.id) ===
                        String(item.id)
                );


            const maximum =
                Math.max(
                    0,
                    Number(
                        source?.available_quantity ?? 0
                    )
                );


            if (
                Number(item.quantity) >
                maximum
            ) {

                throw new Error(
                    `Insufficient stock for bartan item: ${item.name}`
                );

            }

        }


        const bartanPayload =
            (selectedServiceType === "decoration" ? [] : selectedItems).map(item => ({

                id:
                    Number(item.id),

                quantity:
                    Number(item.quantity)

            }));


        const decorationIds =
            selectedServiceType === "bartan"
                ? []
                : selectedDecorationItems.map(
                    item => Number(item.id)
                );


        const notes =
            specialRequirement &&
            typeof specialRequirement.value ===
                "string"
                ? (
                    specialRequirement.value.trim() ||
                    null
                )
                : null;


        const {
            data,
            error
        } = await supabase.rpc(
            "create_customer_booking_full",
            {
                p_customer_name:
                    customerName.value.trim(),

                p_customer_mobile:
                    customerMobile.value.trim(),

                p_customer_address:
                    customerAddress.value.trim(),

                p_event_date:
                    eventDate.value,

                p_return_date:
                    returnDate &&
                    returnDate.value
                        ? returnDate.value
                        : null,

                p_bartan_items:
                    bartanPayload,

                p_decoration_ids:
                    decorationIds,

                p_notes:
                    notes
            }
        );


        if (error) {

            console.error(
                "Supabase RPC error:",
                error
            );

            throw error;

        }


        const booking =
            Array.isArray(data)
                ? data[0]
                : data;


        if (!booking) {

            throw new Error(
                "Booking created but confirmation number was not returned."
            );

        }


        const bookingNumber =
            booking.booking_number ||
            booking.booking_no ||
            booking.number ||
            booking.id;


        if (!bookingNumber) {

            throw new Error(
                "Booking number was not returned."
            );

        }


        showSuccess(
            bookingNumber
        );


    } catch (error) {

        console.error(
            "Booking submission error:",
            error
        );


        showToast(
            getFriendlyError(error),
            "error"
        );


    } finally {

        submitButton.disabled = false;

        submitButton.innerHTML =
            originalText;

    }

}


// ======================================================
// VALIDATION
// ======================================================

function validateForm() {

    let valid = true;

    let firstField = null;

    const message =
        "कृपया सभी जरूरी जानकारी सही भरें।";


    const name =
        customerName
            ? customerName.value.trim()
            : "";


    const mobile =
        customerMobile
            ? customerMobile.value.trim()
            : "";


    const address =
        customerAddress
            ? customerAddress.value.trim()
            : "";


    const selectedEvent =
        eventDate
            ? eventDate.value
            : "";


    if (name.length < 2) {

        setError(
            "customerName",
            "कृपया अपना नाम दर्ज करें।"
        );

        valid = false;

        firstField ||=
            customerName;

    }


    if (
        !/^[6-9]\d{9}$/.test(
            mobile
        )
    ) {

        setError(
            "customerMobile",
            "कृपया valid 10 digit mobile number दें।"
        );

        valid = false;

        firstField ||=
            customerMobile;

    }


    if (
        !address ||
        address.length < 5
    ) {

        setError(
            "customerAddress",
            "कृपया पूरा address दर्ज करें।"
        );

        valid = false;

        firstField ||=
            customerAddress;

    }


    if (!selectedEvent) {

        setError(
            "eventDate",
            "Event date चुनें।"
        );

        valid = false;

        firstField ||=
            eventDate;

    }


    if (
        selectedEvent &&
        returnDate &&
        returnDate.value &&
        returnDate.value < selectedEvent
    ) {

        setError(
            "returnDate",
            "Return date event date से पहले नहीं हो सकती।"
        );

        valid = false;

        firstField ||=
            returnDate;

    }


    return {
        valid,
        message,
        firstField
    };

}


// ======================================================
// SELECTED BARTAN
// ======================================================

function getSelectedBartan() {

    return bartanData
        .filter(item =>
            selectedBartan.has(
                String(item.id)
            )
        )
        .map(item => ({

            id:
                item.id,

            name:
                item.name,

            quantity:
                Math.min(
                    Number(
                        selectedBartan.get(
                            String(item.id)
                        ) || 0
                    ),
                    Math.max(
                        0,
                        Number(
                            item.available_quantity ?? 0
                        )
                    )
                )

        }))
        .filter(item =>
            item.quantity > 0
        );

}


// ======================================================
// SELECTED DECORATIONS
// ======================================================

function getSelectedDecorations() {

    return decorationData
        .filter(item =>
            selectedDecorations.has(
                String(item.id)
            )
        )
        .map(item => ({

            id:
                item.id,

            name:
                item.name

        }));

}


// ======================================================
// SUCCESS
// ======================================================

function showSuccess(
    bookingNumber
) {

    if (bookingNumberElement) {

        bookingNumberElement.textContent =
            String(bookingNumber);

    }


    const whatsappText = [

        `नमस्ते ${BUSINESS_NAME},`,

        "",

        "मैंने Booking Enquiry भेजी है।",

        "",

        `Booking Number: ${bookingNumber}`,

        `Name: ${
            customerName
                ? customerName.value.trim()
                : ""
        }`,

        `Mobile: ${
            customerMobile
                ? customerMobile.value.trim()
                : ""
        }`,

        `Event Date: ${
            eventDate
                ? eventDate.value
                : ""
        }`,

        returnDate &&
        returnDate.value
            ? `Expected Return Date: ${returnDate.value}`
            : "",

        "",

        "कृपया मेरी booking की availability confirm करें।"

    ]
        .filter(Boolean)
        .join("\n");


    if (whatsappConfirm) {

        whatsappConfirm.href =
            `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                whatsappText
            )}`;

    }


    // Automatically fill tracking details.

    if (trackingBookingNumber) {

        trackingBookingNumber.value =
            String(bookingNumber);

    }


    if (
        trackingMobile &&
        customerMobile
    ) {

        trackingMobile.value =
            customerMobile.value.trim();

    }


    if (form) {

        form.classList.add(
            "hidden"
        );

    }


    const bookingSection =
        document.querySelector(
            ".booking-section"
        );


    if (bookingSection) {

        bookingSection.classList.add(
            "hidden"
        );

    }


    const bookingHero =
        document.querySelector(
            ".booking-hero"
        );


    if (bookingHero) {

        bookingHero.classList.add(
            "hidden"
        );

    }


    if (successSection) {

        successSection.classList.remove(
            "hidden"
        );

    }


    if (trackingSection) {

        trackingSection.classList.remove(
            "hidden"
        );

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ======================================================
// TRACKING SUBMIT
// ======================================================

async function handleTrackingSubmit(event) {

    event.preventDefault();


    const bookingNumber =
        trackingBookingNumber
            ? trackingBookingNumber.value.trim()
            : "";


    const mobile =
        trackingMobile
            ? trackingMobile.value
                .replace(/\D/g, "")
                .trim()
            : "";


    clearTrackingState();


    if (!bookingNumber) {

        showTrackingError(
            "कृपया Booking Number दर्ज करें।"
        );

        if (trackingBookingNumber) {
            trackingBookingNumber.focus();
        }

        return;

    }


    if (
        !/^[6-9]\d{9}$/.test(
            mobile
        )
    ) {

        showTrackingError(
            "कृपया registered 10 digit mobile number दर्ज करें।"
        );

        if (trackingMobile) {
            trackingMobile.focus();
        }

        return;

    }


    await loadTrackedBooking(
        bookingNumber,
        mobile
    );

}


// ======================================================
// LOAD TRACKED BOOKING
// ======================================================

async function loadTrackedBooking(
    bookingNumber,
    mobile
) {

    if (
        !trackingResult ||
        !trackingBookingNumber ||
        !trackingMobile
    ) {

        return;

    }


    lastTrackingRequest = {

        bookingNumber:
            bookingNumber,

        mobile:
            mobile

    };


    setTrackingLoading(true);


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

            throw error;

        }


        /*
         * RPC response can be an object or
         * a one-row array depending on return type.
         */

        const response =
            Array.isArray(data)
                ? data[0]
                : data;


        if (
            !response ||
            response.success !== true ||
            !response.booking
        ) {

            showTrackingError(
                "Booking नहीं मिली। Booking Number और registered mobile number check करें।"
            );

            return;

        }


        renderTrackingBooking(
            response.booking
        );


    } catch (error) {

        console.error(
            "Booking tracking error:",
            error
        );


        showTrackingError(
            getTrackingError(error)
        );

    } finally {

        setTrackingLoading(false);

    }

}


// ======================================================
// TRACKING LOADING
// ======================================================

function setTrackingLoading(
    loading
) {

    if (trackingLoading) {

        trackingLoading.classList.toggle(
            "hidden",
            !loading
        );

    }


    if (trackBookingButton) {

        trackBookingButton.disabled =
            loading;


        trackBookingButton.classList.toggle(
            "loading",
            loading
        );

    }

}


// ======================================================
// CLEAR TRACKING STATE
// ======================================================

function clearTrackingState() {

    if (trackingError) {

        trackingError.classList.add(
            "hidden"
        );

    }


    if (trackingErrorMessage) {

        trackingErrorMessage.textContent =
            "";

    }


    if (trackingResult) {

        trackingResult.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// TRACKING ERROR
// ======================================================

function showTrackingError(
    message
) {

    if (trackingErrorMessage) {

        trackingErrorMessage.textContent =
            message;

    }


    if (trackingError) {

        trackingError.classList.remove(
            "hidden"
        );

    }


    if (trackingResult) {

        trackingResult.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// RENDER TRACKING BOOKING
// ======================================================

function renderTrackingBooking(
    booking
) {

    if (!trackingResult) {
        return;
    }


    const status =
        normalizeStatus(
            booking.status
        );


    // ==================================================
    // BASIC DETAILS
    // ==================================================

    setText(
        trackingResultBookingNumber,
        booking.booking_number || "—"
    );


    if (trackingStatusBadge) {

        trackingStatusBadge.textContent =
            status.label;

        trackingStatusBadge.className =
            `tracking-status-badge ${status.cssClass}`;

    }


    setText(
        trackingCustomerName,
        booking.customer_name || "—"
    );


    setText(
        trackingCustomerMobile,
        booking.customer_mobile || "—"
    );


    setText(
        trackingCreatedDate,
        formatDateTime(
            booking.created_at
        )
    );


    setText(
        trackingEventDate,
        formatDate(
            booking.event_date
        )
    );


    setText(
        trackingReturnDate,
        booking.return_date
            ? formatDate(
                booking.return_date
            )
            : "Not specified"
    );


    setText(
        trackingCustomerAddress,
        booking.customer_address ||
        "Not available"
    );


    // ==================================================
    // TIMELINE
    // ==================================================

    updateTrackingTimeline(
        status.key
    );


    // ==================================================
    // BARTAN
    // ==================================================

    renderTrackingBartan(
        booking.bartan_items
    );


    // ==================================================
    // DECORATION
    // ==================================================

    renderTrackingDecorations(
        booking.decorations
    );


    // ==================================================
    // NOTES
    // ==================================================

    const notes =
        String(
            booking.notes || ""
        ).trim();


    if (
        trackingNotesSection &&
        trackingNotes
    ) {

        if (notes) {

            trackingNotes.textContent =
                notes;

            trackingNotesSection.classList.remove(
                "hidden"
            );

        } else {

            trackingNotes.textContent =
                "";

            trackingNotesSection.classList.add(
                "hidden"
            );

        }

    }


    // ==================================================
    // SHOW RESULT
    // ==================================================

    trackingResult.classList.remove(
        "hidden"
    );


    trackingResult.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ======================================================
// RENDER TRACKING BARTAN
// ======================================================

function renderTrackingBartan(
    items
) {

    if (!trackingBartanList) {
        return;
    }


    const bartanItems =
        Array.isArray(items)
            ? items
            : [];


    if (!bartanItems.length) {

        trackingBartanList.innerHTML = `
            <div class="tracking-empty">
                इस booking में bartan selected नहीं हैं।
            </div>
        `;

        return;

    }


    trackingBartanList.innerHTML =
        bartanItems
            .map(item => {

                const name =
                    escapeHtml(
                        item?.name ||
                        "Bartan"
                    );


                const quantity =
                    Math.max(
                        0,
                        Number(
                            item?.quantity || 0
                        )
                    );


                return `
                    <div class="tracking-item-row">

                        <span>
                            ${name}
                        </span>

                        <strong>
                            Qty: ${quantity}
                        </strong>

                    </div>
                `;

            })
            .join("");

}


// ======================================================
// RENDER TRACKING DECORATIONS
// ======================================================

function renderTrackingDecorations(
    decorations
) {

    if (
        !trackingDecorationSection ||
        !trackingDecorationList
    ) {

        return;

    }


    const decorationItems =
        Array.isArray(decorations)
            ? decorations
            : [];


    if (!decorationItems.length) {

        trackingDecorationList.innerHTML =
            "";

        trackingDecorationSection.classList.add(
            "hidden"
        );

        return;

    }


    trackingDecorationList.innerHTML =
        decorationItems
            .map(item => {

                return `
                    <div class="tracking-item-row">

                        <span>
                            ${escapeHtml(
                                item?.name ||
                                "Decoration"
                            )}
                        </span>

                        <strong>
                            Selected
                        </strong>

                    </div>
                `;

            })
            .join("");


    trackingDecorationSection.classList.remove(
        "hidden"
    );

}


// ======================================================
// UPDATE TIMELINE
// ======================================================

function updateTrackingTimeline(
    currentStatus
) {

    if (!trackingResult) {
        return;
    }


    const steps = [

        {
            key:
                "pending",

            rank:
                0
        },

        {
            key:
                "confirmed",

            rank:
                1
        },

        {
            key:
                "issued",

            rank:
                2
        },

        {
            key:
                "return_pending",

            rank:
                3
        },

        {
            key:
                "completed",

            rank:
                4
        }

    ];


    const current =
        steps.find(
            step =>
                step.key ===
                currentStatus
        );


    const currentRank =
        current
            ? current.rank
            : 0;


    trackingResult
        .querySelectorAll(
            "[data-status-step]"
        )
        .forEach(stepElement => {

            const stepKey =
                stepElement.dataset.statusStep;


            const step =
                steps.find(
                    item =>
                        item.key ===
                        stepKey
                );


            if (!step) {
                return;
            }


            stepElement.classList.remove(
                "is-completed",
                "is-current",
                "is-active",
                "is-cancelled"
            );


            if (
                currentStatus ===
                "cancelled"
            ) {

                stepElement.classList.add(
                    "is-cancelled"
                );

                return;

            }


            if (
                currentRank >
                step.rank
            ) {

                stepElement.classList.add(
                    "is-completed"
                );

            }


            if (
                currentRank ===
                step.rank
            ) {

                stepElement.classList.add(
                    "is-current"
                );

                stepElement.classList.add(
                    "is-active"
                );

            }

        });

}


// ======================================================
// STATUS NORMALIZATION
// ======================================================

function normalizeStatus(
    status
) {

    const value =
        String(
            status || "pending"
        )
            .trim()
            .toLowerCase()
            .replace(/[-\s]+/g, "_");


    const map = {

        pending: {
            key:
                "pending",

            label:
                "Pending",

            cssClass:
                "status-pending"
        },

        confirmed: {
            key:
                "confirmed",

            label:
                "Confirmed",

            cssClass:
                "status-confirmed"
        },

        issued: {
            key:
                "issued",

            label:
                "Items Issued",

            cssClass:
                "status-issued"
        },

        return_pending: {
            key:
                "return_pending",

            label:
                "Return Pending",

            cssClass:
                "status-return-pending"
        },

        completed: {
            key:
                "completed",

            label:
                "Completed",

            cssClass:
                "status-completed"
        },

        cancelled: {
            key:
                "cancelled",

            label:
                "Cancelled",

            cssClass:
                "status-cancelled"
        },

        canceled: {
            key:
                "cancelled",

            label:
                "Cancelled",

            cssClass:
                "status-cancelled"
        }

    };


    return (
        map[value] ||
        map.pending
    );

}


// ======================================================
// RENTAL DAYS
// ======================================================

function calculateRentalDays(
    eventDateValue,
    returnDateValue
) {

    if (
        !eventDateValue ||
        !returnDateValue
    ) {

        return 1;

    }


    const start =
        parseDateOnly(
            eventDateValue
        );


    const end =
        parseDateOnly(
            returnDateValue
        );


    if (
        !start ||
        !end
    ) {

        return 1;

    }


    const difference =
        Math.round(
            (
                end.getTime() -
                start.getTime()
            ) /
            86400000
        );


    return Math.max(
        1,
        difference + 1
    );

}


// ======================================================
// DATE PARSER
// ======================================================

function parseDateOnly(
    value
) {

    if (!value) {
        return null;
    }


    const parts =
        String(value)
            .split("-")
            .map(Number);


    if (
        parts.length !== 3 ||
        parts.some(
            Number.isNaN
        )
    ) {

        return null;

    }


    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
    value
) {

    if (!value) {

        return "Not available";

    }


    const date =
        parseDateOnly(
            value
        );


    if (!date) {

        return escapeHtml(
            value
        );

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    );

}


// ======================================================
// FORMAT DATE + TIME
// ======================================================

function formatDateTime(
    value
) {

    if (!value) {

        return "Not available";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHtml(
            value
        );

    }


    return date.toLocaleString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}


// ======================================================
// TRACKING ERROR MESSAGE
// ======================================================

function getTrackingError(
    error
) {

    const message =
        String(
            error?.message ||
            error?.details ||
            error?.hint ||
            error ||
            ""
        )
            .toLowerCase();


    if (
        message.includes(
            "get_customer_booking_tracking"
        ) ||
        message.includes(
            "function"
        )
    ) {

        return "Booking tracking service में समस्या है। कृपया थोड़ी देर बाद फिर प्रयास करें।";

    }


    if (
        message.includes(
            "permission"
        ) ||
        message.includes(
            "rls"
        )
    ) {

        return "Tracking permission में समस्या है। कृपया थोड़ी देर बाद फिर प्रयास करें।";

    }


    if (
        message.includes(
            "network"
        ) ||
        message.includes(
            "fetch"
        ) ||
        message.includes(
            "failed to fetch"
        )
    ) {

        return "Internet connection check करके दोबारा प्रयास करें।";

    }


    return "Booking track नहीं हो सकी। कृपया Booking Number और mobile number check करें।";

}


// ======================================================
// SET TEXT SAFELY
// ======================================================

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }


    element.textContent =
        String(
            value ?? ""
        );

}


// ======================================================
// INPUT ERROR
// ======================================================

function setError(
    fieldId,
    message
) {

    const field =
        document.getElementById(
            fieldId
        );


    if (!field) {
        return;
    }


    field.classList.add(
        "input-error"
    );


    const errorElement =
        document.getElementById(
            `${fieldId}Error`
        );


    if (errorElement) {

        errorElement.textContent =
            message;

    }

}


// ======================================================
// CLEAR ERRORS
// ======================================================

function clearErrors() {

    document
        .querySelectorAll(
            ".input-error"
        )
        .forEach(element => {

            element.classList.remove(
                "input-error"
            );

        });


    document
        .querySelectorAll(
            ".field-error"
        )
        .forEach(element => {

            element.textContent =
                "";

        });

}


// ======================================================
// TOAST
// ======================================================

function showToast(
    message,
    type = "error"
) {

    if (
        !toast ||
        !toastMessage
    ) {

        return;

    }


    toastMessage.textContent =
        message;


    if (toastIcon) {

        toastIcon.textContent =
            type === "success"
                ? "✓"
                : "!";

    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            5000
        );

}


// ======================================================
// FRIENDLY BOOKING ERROR
// ======================================================

function getFriendlyError(
    error
) {

    const message =
        String(
            error?.message ||
            error?.details ||
            error?.hint ||
            error ||
            ""
        );


    const lowerMessage =
        message.toLowerCase();


    console.error(
        "Actual booking error:",
        {
            message:
                error?.message,

            details:
                error?.details,

            hint:
                error?.hint,

            code:
                error?.code
        }
    );


    if (
        lowerMessage.includes(
            "insufficient stock"
        )
    ) {

        return "चयन किए गए बर्तन की requested quantity अभी उपलब्ध नहीं है। कृपया quantity कम करके दोबारा प्रयास करें।";

    }


    if (
        lowerMessage.includes(
            "selected bartan item is not available"
        )
    ) {

        return "चयन किया गया बर्तन अभी उपलब्ध नहीं है। कृपया page refresh करके दोबारा प्रयास करें।";

    }


    if (
        lowerMessage.includes(
            "invalid bartan item"
        )
    ) {

        return "चयन किए गए बर्तन की जानकारी सही नहीं है। कृपया page refresh करके दोबारा प्रयास करें।";

    }


    if (
        lowerMessage.includes(
            "invalid quantity"
        )
    ) {

        return "बर्तन की quantity सही नहीं है। कृपया quantity दोबारा चुनें।";

    }


    if (
        lowerMessage.includes(
            "selected decoration is not available"
        )
    ) {

        return "चयन किया गया decoration अभी उपलब्ध नहीं है। कृपया page refresh करके दोबारा प्रयास करें।";

    }


    if (
        lowerMessage.includes(
            "please select at least one"
        )
    ) {

        return "कृपया कम से कम एक बर्तन या decoration चुनें।";

    }


    if (
        lowerMessage.includes(
            "customer name is required"
        )
    ) {

        return "कृपया अपना नाम दर्ज करें।";

    }


    if (
        lowerMessage.includes(
            "mobile number is required"
        )
    ) {

        return "कृपया अपना mobile number दर्ज करें।";

    }


    if (
        lowerMessage.includes(
            "address is required"
        )
    ) {

        return "कृपया पूरा address दर्ज करें।";

    }


    if (
        lowerMessage.includes(
            "mobile"
        )
    ) {

        return "कृपया valid mobile number दर्ज करें।";

    }


    if (
        lowerMessage.includes(
            "return date"
        )
    ) {

        return "Return date सही दर्ज करें।";

    }


    if (
        lowerMessage.includes(
            "permission denied"
        ) ||
        lowerMessage.includes(
            "permission"
        ) ||
        lowerMessage.includes(
            "row-level security"
        ) ||
        lowerMessage.includes(
            "rls"
        )
    ) {

        return "Booking permission की समस्या है। कृपया WhatsApp से संपर्क करें।";

    }


    if (
        lowerMessage.includes(
            "create_customer_booking_full"
        ) ||
        lowerMessage.includes(
            "function"
        )
    ) {

        return "Booking service में समस्या आ रही है। कृपया थोड़ी देर बाद दोबारा प्रयास करें।";

    }


    if (
        lowerMessage.includes(
            "network"
        ) ||
        lowerMessage.includes(
            "fetch"
        ) ||
        lowerMessage.includes(
            "failed to fetch"
        )
    ) {

        return "Internet connection check करके दोबारा प्रयास करें।";

    }


    if (
        lowerMessage.includes(
            "date"
        ) &&
        (
            lowerMessage.includes(
                "invalid"
            ) ||
            lowerMessage.includes(
                "required"
            )
        )
    ) {

        return "कृपया Event Date और Return Date सही दर्ज करें।";

    }


    return "Booking submit नहीं हो सकी। कृपया दोबारा प्रयास करें या WhatsApp से संपर्क करें।";

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(
    value
) {

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