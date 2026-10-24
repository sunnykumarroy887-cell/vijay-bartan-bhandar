import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const db = createClient(
  "https://wkgkczrhgsmnmovyzuss.supabase.co",
  "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E"
);
const $ = (id) => document.getElementById(id);
const form = $("eventBookingForm");
const events = $("events");
const template = $("eventTemplate");
const notice = $("notice");
const submit = $("submitButton");
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES_PER_EVENT = 3;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
const minDate = today.toISOString().slice(0, 10);

function message(text, error = false) {
  notice.textContent = text;
  notice.className = "notice show" + (error ? " error" : "");
  notice.scrollIntoView({ behavior: "smooth", block: "center" });
}
function renumber() {
  [...events.children].forEach((card, i) => {
    card.querySelector(".event-title").textContent = "Event " + (i + 1);
  });
}
function addEvent() {
  if (events.children.length >= 10) {
    message("Ek booking mein maximum 10 events add kar sakte hain.", true);
    return;
  }
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".event-card");
  card.querySelector(".event-date").min = minDate;
  const eventSelect = card.querySelector(".event-name");
  const customWrap = card.querySelector(".custom-event-wrap");
  const customName = card.querySelector(".event-custom-name");
  eventSelect.addEventListener("change", () => {
    const isCustom = eventSelect.value === "Other (Custom)";
    customWrap.hidden = !isCustom;
    customName.required = isCustom;
    if (!isCustom) customName.value = "";
  });
  card.querySelector(".remove").addEventListener("click", () => {
    if (events.children.length === 1) {
      message("Kam se kam ek event zaroori hai.", true);
      return;
    }
    card.remove();
    renumber();
  });
  const imageInput = card.querySelector(".event-image");
  const preview = card.querySelector(".image-preview");
  imageInput.addEventListener("change", () => {
    preview.replaceChildren();
    const files = [...(imageInput.files || [])];
    if (files.length > MAX_IMAGES_PER_EVENT) {
      imageInput.value = "";
      message("Har event ke liye maximum 3 reference images select karein.", true);
      return;
    }
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        imageInput.value = "";
        preview.replaceChildren();
        message("Sirf JPG, PNG, WEBP ya GIF image upload karein.", true);
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        imageInput.value = "";
        preview.replaceChildren();
        message("Har image 2 MB se chhoti honi chahiye.", true);
        return;
      }
    }
    for (const file of files) {
      const item = document.createElement("div");
      item.className = "preview-item";
      const img = document.createElement("img");
      img.alt = "Selected reference image: " + file.name;
      img.src = URL.createObjectURL(file);
      const name = document.createElement("small");
      name.textContent = file.name;
      item.append(img, name);
      preview.append(item);
    }
  });
  events.append(fragment);
  renumber();
}
$("addEvent").addEventListener("click", addEvent);
addEvent();

(async () => {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return;
  const { data } = await db.from("profiles").select("full_name, mobile").eq("id", user.id).maybeSingle();
  if (data?.full_name && !$("customerName").value) $("customerName").value = data.full_name;
  if (data?.mobile && !$("customerMobile").value) $("customerMobile").value = data.mobile;
})();

async function uploadReferenceImages(userId, bookingId, eventIndex, files) {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" })[file.type];
    const path = userId + "/booking-" + bookingId + "/event-" + (eventIndex + 1) + "-" + crypto.randomUUID() + "." + extension;
    const { error } = await db.storage.from("decoration-images").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });
    if (error) throw new Error("Reference image upload nahi ho saki: " + error.message);
    const { data } = db.storage.from("decoration-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  notice.className = "notice";
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) {
    message("Booking submit karne ke liye pehle customer account mein login karein.", true);
    return;
  }
  const cards = [...events.children];
  const eventRows = cards.map((card) => {
    const selected = card.querySelector(".event-name").value;
    const custom = card.querySelector(".event-custom-name").value.trim();
    const input = card.querySelector(".event-image");
    const files = [...(input.files || [])];
    return {
      card,
      event_name: selected === "Other (Custom)" ? custom : selected,
      event_date: card.querySelector(".event-date").value,
      event_time: card.querySelector(".event-time").value || null,
      venue_address: card.querySelector(".event-venue").value.trim(),
      decoration_details: card.querySelector(".event-details").value.trim(),
      design_name: card.querySelector(".event-design").value.trim() || null,
      files
    };
  });
  if (eventRows.some(v => !v.event_name || !v.event_date || !v.venue_address || !v.decoration_details)) {
    message("Har event ka type/name, date, venue aur decoration requirement bharein.", true);
    return;
  }
  if (eventRows.some(v => v.event_date < minDate)) {
    message("Past date select nahi kar sakte.", true);
    return;
  }
  if (eventRows.some(v => v.files.length > MAX_IMAGES_PER_EVENT || v.files.some(f => !ALLOWED_IMAGE_TYPES.has(f.type) || f.size > MAX_IMAGE_BYTES))) {
    message("Har event mein maximum 3 image, har ek 2 MB max (JPG/PNG/WEBP/GIF) upload karein.", true);
    return;
  }

  submit.disabled = true;
  submit.textContent = "Submitting…";
  let bookingNumber = "";
  try {
    const notes = [
      "Decoration multi-event request",
      $("extraNotes").value.trim(),
      ...eventRows.map((v, i) => `Event ${i + 1}: ${v.event_name}, ${v.event_date}, ${v.event_time || "time not set"}, Venue: ${v.venue_address}, Design: ${v.design_name || "not selected"}, Needs: ${v.decoration_details}`)
    ].filter(Boolean).join("\n");

    const { data, error } = await db.rpc("create_customer_decoration_booking", {
      p_customer_name: $("customerName").value.trim(),
      p_customer_mobile: $("customerMobile").value.trim(),
      p_customer_address: $("customerAddress").value.trim(),
      p_event_date: eventRows.map(v => v.event_date).sort()[0],
      p_notes: notes
    });
    if (error) throw error;
    const booking = Array.isArray(data) ? data[0] : data;
    const createdBookingId = booking?.booking_id ?? booking?.id;
    if (!createdBookingId) throw new Error("Booking create hui ya nahi confirm nahi ho saka. Account ke bookings section mein check karein.");
    booking.id = createdBookingId;
    bookingNumber = String(booking.booking_number || booking.id);

    const rows = [];
    for (let i = 0; i < eventRows.length; i++) {
      const event = eventRows[i];
      const urls = event.files.length ? await uploadReferenceImages(user.id, booking.id, i, event.files) : [];
      rows.push({
        booking_id: booking.id,
        event_name: event.event_name,
        event_date: event.event_date,
        event_time: event.event_time,
        venue_address: event.venue_address,
        decoration_details: event.decoration_details,
        design_name: event.design_name,
        reference_image_urls: urls
      });
    }
    const { error: eventError } = await db.from("booking_events").insert(rows);
    if (eventError) throw new Error("Booking #" + bookingNumber + " create hui, lekin event/image details save nahi ho sakin. Admin ko booking number batayein. " + eventError.message);

    message("Decoration request submit ho gayi! Booking #" + bookingNumber + ". Images aur event details save ho gayi hain. Yeh abhi confirmed nahi hai; availability aur quotation ka wait karein.");
    form.reset();
    events.replaceChildren();
    addEvent();
  } catch (err) {
    console.error(err);
    message((bookingNumber ? "Booking #" + bookingNumber + ": " : "") + (err.message || "Request submit nahi ho saki. Login aur internet check karke dobara try karein."), true);
  } finally {
    submit.disabled = false;
    submit.textContent = "Decoration Request Submit karein";
  }
});
