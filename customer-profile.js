import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://wkgkczrhgsmnmovyzuss.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (id) => document.getElementById(id);
const notice = $("pageNotice");

function showNotice(message, isError = false) {
  if (!notice) return;
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.hidden = false;
}

function displayProfile(user, profile = {}) {
  const metadata = user.user_metadata || {};
  const name = profile.full_name || metadata.full_name || metadata.name || "Customer";
  const mobile = profile.mobile || metadata.mobile || "Not added";
  $("profileName").textContent = name;
  $("profileEmail").textContent = user.email || "Email not available";
  $("avatar").textContent = (name.trim().charAt(0) || "V").toUpperCase();
  $("detailName").textContent = name;
  $("detailEmail").textContent = user.email || "—";
  $("detailMobile").textContent = mobile;
  $("detailStatus").textContent = user.email_confirmed_at ? "Active · Email verified" : "Active";
}

const money = (value) => "₹" + Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function getRentalDays(startValue, endValue) {
  if (!startValue || !endValue) return 1;
  const start = new Date(String(startValue).slice(0, 10) + "T00:00:00Z");
  const end = new Date(String(endValue).slice(0, 10) + "T00:00:00Z");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
}

function makeText(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

async function loadBusinessPaymentSettings() {
  // Read only the public payment fields through a narrowly scoped Supabase RPC.
  // This avoids exposing the whole business_settings row to customer accounts.
  const { data, error } = await supabase.rpc("get_public_payment_settings");
  if (error) {
    console.error("Payment settings RPC failed:", error.message, error.code || "");
    return { business_name: "Vijay Bartan Bhandar", phonepe_number: "", upi_id: "" };
  }
  const settings = Array.isArray(data) ? data[0] : data;
  if (!settings) {
    console.error("Payment settings RPC returned no settings row.");
    return { business_name: "Vijay Bartan Bhandar", phonepe_number: "", upi_id: "" };
  }
  return {
    business_name: settings.business_name || "Vijay Bartan Bhandar",
    phonepe_number: settings.phonepe_number || "",
    upi_id: settings.upi_id || ""
  };
}

function appendPaymentPanel(card, booking, settings) {
  const remaining = Math.max(0, Number(booking.remaining ?? 0));
  const panel = makeText("section", "phonepe-payment-panel", "");
  panel.append(makeText("h4", "", "Pay remaining amount"));

  if (remaining <= 0) {
    panel.append(makeText("p", "phonepe-paid-note", "No balance due for this booking."));
    card.append(panel);
    return;
  }

  const upiId = String(settings.upi_id || "").trim();
  if (!upiId || !upiId.includes("@")) {
    panel.append(makeText("p", "phonepe-payment-note", "Online payment is not configured yet. Please contact Vijay Bartan Bhandar."));
    card.append(panel);
    return;
  }

  const businessName = String(settings.business_name || "Vijay Bartan Bhandar").trim();
  const bookingRef = String(booking.booking_number || `Booking-${booking.id}`);
  const params = new URLSearchParams({
    pa: upiId,
    pn: businessName,
    am: remaining.toFixed(2),
    cu: "INR",
    tn: `Payment for ${bookingRef}`
  });
  const upiUri = `upi://pay?${params.toString()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiUri)}`;

  panel.append(makeText("p", "phonepe-payment-amount", `Amount due: ${money(remaining)}`));
  const qr = document.createElement("img");
  qr.className = "phonepe-qr";
  qr.src = qrUrl;
  qr.alt = `UPI payment QR for ${bookingRef}, amount ${money(remaining)}`;
  qr.loading = "lazy";
  qr.referrerPolicy = "no-referrer";
  panel.append(qr);
  panel.append(makeText("p", "phonepe-payment-note", `Scan with PhonePe or another UPI app. UPI ID: ${upiId}`));

  const payLink = document.createElement("a");
  payLink.className = "phonepe-pay-button";
  payLink.href = upiUri;
  payLink.textContent = "Pay with PhonePe / UPI";
  payLink.setAttribute("aria-label", `Pay ${money(remaining)} for ${bookingRef} with UPI`);
  panel.append(payLink);
  panel.append(makeText("p", "phonepe-verification-note", "PhonePe se payment karne ke baad neeche Transaction ID/UTR ya screenshot/PDF submit karein. Admin verify karne ke baad hi payment received count hoga."));
  const form = document.createElement("form");
  form.className = "customer-payment-submit";
  form.dataset.bookingId = String(booking.id);
  const amountLabel = makeText("label", "", "Payment amount (₹)");
  const amountInput = document.createElement("input");
  amountInput.type = "number"; amountInput.min = "1"; amountInput.max = remaining.toFixed(2);
  amountInput.step = "0.01"; amountInput.required = true; amountInput.value = remaining.toFixed(2);
  amountInput.setAttribute("aria-label", "Enter full or custom payment amount");
  const referenceLabel = makeText("label", "", "Transaction ID / UTR");
  const referenceInput = document.createElement("input");
  referenceInput.type = "text"; referenceInput.maxLength = 120;
  referenceInput.placeholder = "PhonePe transaction ID / UTR";
  const proofLabel = makeText("label", "", "Upload payment screenshot or PDF (max 2 MB)");
  const proofInput = document.createElement("input");
  proofInput.type = "file"; proofInput.accept = "image/jpeg,image/png,image/webp,application/pdf";
  const hint = makeText("small", "payment-submit-hint", "Agar screenshot/PDF upload karenge to Transaction ID optional hai. File upload nahi karenge to Transaction ID/UTR zaroor bharein.");
  const submit = document.createElement("button");
  submit.type = "submit"; submit.className = "phonepe-pay-button"; submit.textContent = "Submit payment for verification";
  form.append(amountLabel, amountInput, referenceLabel, referenceInput, proofLabel, proofInput, hint, submit);

  // Keep the QR and UPI deep link in sync with the amount the customer chooses.
  function updateCustomPaymentAmount() {
    const customAmount = Number(amountInput.value);
    const validAmount = Number.isFinite(customAmount) && customAmount > 0 && customAmount <= remaining;
    amountInput.setCustomValidity(validAmount ? "" : `Enter an amount between ₹1 and ${money(remaining)}.`);
    if (!validAmount) return;
    const customParams = new URLSearchParams({
      pa: upiId,
      pn: businessName,
      am: customAmount.toFixed(2),
      cu: "INR",
      tn: `Payment for ${bookingRef}`
    });
    const customUri = `upi://pay?${customParams.toString()}`;
    qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(customUri)}`;
    qr.alt = `UPI payment QR for ${bookingRef}, amount ${money(customAmount)}`;
    payLink.href = customUri;
    payLink.textContent = `Pay ${money(customAmount)} with PhonePe / UPI`;
    payLink.setAttribute("aria-label", `Pay ${money(customAmount)} for ${bookingRef} with UPI`);
  }
  function updateProofRequirementHint() {
    hint.textContent = proofInput.files?.length
      ? "Screenshot/PDF selected — Transaction ID/UTR optional hai."
      : "Screenshot/PDF upload nahi kiya hai, isliye Transaction ID/UTR bharna zaroori hai.";
  }
  amountInput.addEventListener("input", updateCustomPaymentAmount);
  proofInput.addEventListener("change", updateProofRequirementHint);
  updateCustomPaymentAmount();
  updateProofRequirementHint();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) { showNotice("Please sign in again to submit payment.", true); return; }
    const file = proofInput.files?.[0] || null;
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!referenceInput.value.trim() && !file) { showNotice("Transaction ID/UTR ya screenshot/PDF upload karein.", true); return; }
    if (file && (!allowed.includes(file.type) || file.size > 2 * 1024 * 1024)) { showNotice("Sirf JPG, PNG, WEBP ya PDF file 2 MB tak upload karein.", true); return; }
    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining) { showNotice("Amount remaining balance se zyada nahi ho sakta.", true); return; }
    submit.disabled = true; submit.textContent = "Submitting…";
    let uploadedPath = null;
    try {
      let fileMeta = { name: null, mime: null };
      if (file) {
        const ext = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
        uploadedPath = user.id + "/" + booking.id + "/" + Date.now() + "-" + crypto.randomUUID() + "." + ext;
        const up = await supabase.storage.from("payment-proofs").upload(uploadedPath, file, { contentType: file.type, upsert: false });
        if (up.error) throw up.error;
        fileMeta = { name: file.name.slice(0,255), mime: file.type };
      }
      const { error } = await supabase.rpc("customer_submit_online_payment", {
        p_booking_id: Number(booking.id), p_amount: amount,
        p_payment_reference: referenceInput.value.trim() || null,
        p_payment_proof_path: uploadedPath,
        p_payment_proof_name: fileMeta.name,
        p_payment_proof_mime_type: fileMeta.mime
      });
      if (error) throw error;
      showNotice("Payment details submitted. Admin verification pending hai; payment automatically received nahi maana gaya.");
      await loadProfile();
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("payment-proofs").remove([uploadedPath]).catch(() => {});
      console.error("Customer payment submission failed:", error);
      showNotice(error.message || "Payment details submit nahi ho paaye. Please try again.", true);
      submit.disabled = false; submit.textContent = "Submit payment for verification";
    }
  });
  panel.append(form);
  card.append(panel);
}

async function loadBookingHistory(user) {
  const list = $("bookingHistoryList");
  const message = $("bookingHistoryNotice");
  if (!list || !message) return;
  list.replaceChildren();
  message.hidden = false;
  message.classList.remove("error");
  message.textContent = "Loading your bookings…";

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, booking_number, event_date, return_date, final_total, advance, remaining, status, created_at, decoration_required, booking_type")
    .eq("customer_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Booking history query failed:", error);
    message.textContent = "Booking history could not be loaded. Please try again later.";
    message.classList.add("error");
    return;
  }
  if (!bookings?.length) {
    message.textContent = "No bookings are linked to this account yet. Guest bookings and older unlinked bookings are not shown here.";
    return;
  }

  const bookingIds = bookings.map((booking) => booking.id);
  const [{ data: allItems, error: itemsError }, { data: allDecorations, error: decorationsError }, { data: allPayments, error: paymentsError }, { data: allEvents, error: eventsError }, settings] = await Promise.all([
    supabase.from("booking_items")
      .select("booking_id, item_name, quantity, locked_rate, amount")
      .in("booking_id", bookingIds),
    supabase.from("booking_decorations")
      .select("booking_id, decoration_name, locked_rate, amount")
      .in("booking_id", bookingIds),
    supabase.from("booking_payments")
      .select("id, booking_id, amount, payment_type, payment_method, payment_note, payment_reference, created_at, verification_status, verified_at")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false }),
    supabase.from("booking_events")
      .select("id, booking_id, event_name, event_date, event_time, venue_address, decoration_details, design_name, reference_image_urls, quoted_amount, delivery_charge, discount, status")
      .in("booking_id", bookingIds)
      .order("event_date", { ascending: true }),
    loadBusinessPaymentSettings()
  ]);
  if (itemsError) console.error("Booking items query failed:", itemsError);
  if (paymentsError) console.error("Customer payment history query failed:", paymentsError);

  const decorationsByBooking = new Map();
  for (const decoration of allDecorations || []) {
    const key = String(decoration.booking_id);
    if (!decorationsByBooking.has(key)) decorationsByBooking.set(key, []);
    decorationsByBooking.get(key).push(decoration);
  }

  const eventsByBooking = new Map();
  for (const event of allEvents || []) {
    const key = String(event.booking_id);
    if (!eventsByBooking.has(key)) eventsByBooking.set(key, []);
    eventsByBooking.get(key).push(event);
  }

  const paymentsByBooking = new Map();
  for (const payment of allPayments || []) {
    const key = String(payment.booking_id);
    if (!paymentsByBooking.has(key)) paymentsByBooking.set(key, []);
    paymentsByBooking.get(key).push(payment);
  }

  const itemsByBooking = new Map();
  for (const item of allItems || []) {
    const key = String(item.booking_id);
    if (!itemsByBooking.has(key)) itemsByBooking.set(key, []);
    itemsByBooking.get(key).push(item);
  }

  for (const booking of bookings) {
    const card = document.createElement("article");
    card.className = "booking-history-item";
    const top = document.createElement("div");
    top.className = "booking-history-top";
    const info = document.createElement("div");
    info.append(
      makeText("div", "booking-history-number", booking.booking_number || `Booking #${booking.id}`),
      makeText("div", "booking-history-date", `Event: ${formatDate(booking.event_date)} · Return: ${formatDate(booking.return_date)}`)
    );
    const statusText = String(booking.status || "unknown").toLowerCase().replaceAll("_", " ");
    const status = makeText("span", "booking-history-status", statusText);
    if (["pending", "cancelled", "rejected"].includes(statusText)) status.classList.add(statusText);
    top.append(info, status);
    card.append(top);

    const itemSection = document.createElement("section");
    itemSection.className = "booking-history-bartan";
    itemSection.append(makeText("h4", "", "Bartan Details"));
    const bookingItems = itemsByBooking.get(String(booking.id)) || [];
    if (itemsError) {
      itemSection.append(makeText("p", "", "Bartan details could not be loaded."));
    } else if (!bookingItems.length) {
      itemSection.append(makeText("p", "", "No bartan items found for this booking."));
    } else {
      const table = document.createElement("div");
      table.className = "booking-bartan-table";
      const header = document.createElement("div");
      header.className = "booking-bartan-row booking-bartan-header";
      const rentalDays = getRentalDays(booking.event_date, booking.return_date);
      ["Bartan", "Qty", "Days", "Rate/Day", "Total"].forEach((label) => header.append(makeText("span", "", label)));
      table.append(header);
      bookingItems.forEach((item) => {
        const row = document.createElement("div");
        row.className = "booking-bartan-row";
        const itemTotal = Number(item.amount ?? 0) * rentalDays;
        row.append(
          makeText("span", "booking-bartan-name", item.item_name || "Bartan item"),
          makeText("span", "", String(item.quantity ?? 0)),
          makeText("span", "", String(rentalDays)),
          makeText("span", "", money(item.locked_rate)),
          makeText("span", "", money(itemTotal))
        );
        table.append(row);
      });
      itemSection.append(table);
    }
    card.append(itemSection);

    const decorationSection = document.createElement("section");
    decorationSection.className = "booking-history-bartan";
    decorationSection.append(makeText("h4", "", "Decoration Details"));
    const bookingDecorations = decorationsByBooking.get(String(booking.id)) || [];
    if (decorationsError) {
      decorationSection.append(makeText("p", "", "Decoration details could not be loaded."));
    } else if (!bookingDecorations.length) {
      decorationSection.append(makeText("p", "", booking.decoration_required ? "Decoration was selected, but item details are unavailable." : "No decoration service in this booking."));
    } else {
      const table = document.createElement("div");
      table.className = "booking-bartan-table";
      const header = document.createElement("div");
      header.className = "booking-bartan-row booking-decoration-row booking-bartan-header";
      ["Decoration Service", "Rate", "Amount"].forEach(label => header.append(makeText("span", "", label)));
      table.append(header);
      bookingDecorations.forEach(decoration => {
        const row = document.createElement("div");
        row.className = "booking-bartan-row booking-decoration-row";
        row.append(makeText("span", "booking-bartan-name", decoration.decoration_name || "Decoration service"), makeText("span", "", money(decoration.locked_rate)), makeText("span", "", money(decoration.amount)));
        table.append(row);
      });
      decorationSection.append(table);
    }
    card.append(decorationSection);

    const eventSection = document.createElement("section");
    eventSection.className = "booking-history-bartan";
    eventSection.append(makeText("h4", "", "Decoration Events & Reference Images"));
    const bookingEvents = eventsByBooking.get(String(booking.id)) || [];
    if (eventsError) {
      eventSection.append(makeText("p", "", "Event details could not be loaded right now."));
    } else if (!bookingEvents.length) {
      if (booking.booking_type === "decoration" || booking.decoration_required) {
        eventSection.append(makeText("p", "", "No event details are attached to this booking yet."));
      } else {
        eventSection.append(makeText("p", "", "No separate decoration events."));
      }
    } else {
      bookingEvents.forEach((event) => {
        const eventCard = document.createElement("div");
        eventCard.className = "booking-event-history";
        eventCard.append(
          makeText("h5", "", event.event_name || "Decoration event"),
          makeText("p", "", `Date: ${formatDate(event.event_date)}${event.event_time ? " · Time: " + event.event_time.slice(0,5) : ""}`),
          makeText("p", "", "Venue: " + (event.venue_address || "—")),
          makeText("p", "", "Requirements: " + (event.decoration_details || "—")),
          makeText("p", "", "Design: " + (event.design_name || "Custom / not selected")),
          makeText("p", "", "Status: " + String(event.status || "pending").replaceAll("_", " ")),
          makeText("p", "", "Quotation: " + money(Number(event.quoted_amount || 0) + Number(event.delivery_charge || 0) - Number(event.discount || 0)))
        );
        const urls = Array.isArray(event.reference_image_urls) ? event.reference_image_urls : [];
        if (urls.length) {
          const gallery = document.createElement("div");
          gallery.className = "booking-event-image-gallery";
          urls.forEach((url, index) => {
            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            const image = document.createElement("img");
            image.src = url;
            image.alt = `Reference image ${index + 1} for ${event.event_name || "decoration event"}`;
            image.loading = "lazy";
            image.style.maxWidth = "150px";
            image.style.maxHeight = "150px";
            image.style.objectFit = "cover";
            link.append(image);
            gallery.append(link);
          });
          eventCard.append(gallery);
        } else {
          eventCard.append(makeText("p", "", "No reference images uploaded."));
        }
        eventSection.append(eventCard);
      });
    }
    card.append(eventSection);

    const bookingPayments = paymentsByBooking.get(String(booking.id)) || [];
    const collected = bookingPayments.reduce((sum, payment) => {
      const method = String(payment.payment_method || "").toLowerCase();
      const status = String(payment.verification_status || "pending").toLowerCase();
      const eligible = method === "cash" || status === "verified" || status === "not_required";
      if (!eligible) return sum;
      const amount = Number(payment.amount || 0);
      return sum + (String(payment.payment_type || "").toLowerCase() === "refund" ? -amount : amount);
    }, 0);
    const verifiedOnline = bookingPayments.filter(payment => String(payment.payment_method || "").toLowerCase() !== "cash" && String(payment.verification_status || "").toLowerCase() === "verified").reduce((sum, payment) => sum + (String(payment.payment_type || "").toLowerCase() === "refund" ? -Number(payment.amount || 0) : Number(payment.amount || 0)), 0);
    const pendingOnline = bookingPayments.filter(payment => String(payment.payment_method || "").toLowerCase() !== "cash" && String(payment.verification_status || "pending").toLowerCase() === "pending").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const remainingDue = Math.max(0, Number(booking.final_total || 0) - collected);

    const amounts = document.createElement("div");
    amounts.className = "booking-history-amounts";
    [["Total", money(booking.final_total)], ["Received", money(collected)], ["Verified online", money(verifiedOnline)], ["Online pending", money(pendingOnline)], ["Remaining", money(remainingDue)]].forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "booking-history-amount";
      item.append(makeText("span", "", label), makeText("strong", "", value));
      amounts.append(item);
    });
    card.append(amounts);

    const paymentSection = document.createElement("section");
    paymentSection.className = "customer-payment-history";
    paymentSection.append(makeText("h4", "", "Payment History"));
    if (paymentsError) {
      paymentSection.append(makeText("p", "", "Payment history is temporarily unavailable."));
    } else if (!bookingPayments.length) {
      paymentSection.append(makeText("p", "", "No payments have been recorded for this booking."));
    } else {
      bookingPayments.forEach(payment => {
        const method = String(payment.payment_method || "").toLowerCase();
        const status = method === "cash" ? "Cash · verification not required" : String(payment.verification_status || "pending").replaceAll("_", " ");
        const line = document.createElement("div");
        line.className = "customer-payment-history-row";
        line.append(
          makeText("span", "", `${formatDate(payment.created_at)} · ${method.toUpperCase()} · ${String(payment.payment_type || "payment").replaceAll("_", " ")}`),
          makeText("strong", "", money(payment.amount)),
          makeText("span", "payment-status", status),
          makeText("small", "", payment.payment_reference ? `Reference: ${payment.payment_reference}` : (payment.payment_note || ""))
        );
        paymentSection.append(line);
      });
    }
    card.append(paymentSection);

    // The QR amount is based on the balance calculated from received payments, not pending online claims.
    appendPaymentPanel(card, { ...booking, remaining: remainingDue }, settings);

    const track = document.createElement("a");
    track.className = "history-track-link";
    track.href = "./customer-tracking.html";
    track.textContent = "Track this booking →";
    track.style.display = "inline-block";
    track.style.marginTop = "14px";
    card.append(track);
    list.append(card);
  }
  message.hidden = true;
}

async function loadProfile() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = data?.session?.user;
  if (!user) {
    window.location.replace("./customer-account.html?next=profile");
    return;
  }
  let profile = {};
  const result = await supabase.from("customer_profiles")
    .select("user_id, full_name, mobile")
    .eq("user_id", user.id)
    .maybeSingle();
  if (result.error) {
    console.warn("Customer profile query:", result.error.message);
    showNotice("You are signed in, but saved profile details could not be loaded. Showing available account information.");
  } else if (result.data) {
    profile = result.data;
  } else {
    showNotice("Your account is ready. Some saved profile details may not be available yet.");
  }
  displayProfile(user, profile);
  await loadBookingHistory(user);
}

$("logoutButton")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Logging out…";
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.replace("./customer-account.html");
  } catch (error) {
    console.error("Logout failed:", error);
    showNotice("Could not log out. Please try again.", true);
    button.disabled = false;
    button.textContent = "Log out";
  }
});

if ($("currentYear")) $("currentYear").textContent = new Date().getFullYear();
loadProfile().catch((error) => {
  console.error("Profile page load failed:", error);
  showNotice("Could not load your account right now. Please sign in again.", true);
});
