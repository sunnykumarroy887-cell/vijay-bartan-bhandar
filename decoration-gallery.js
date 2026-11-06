import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const db = createClient(
  "https://wkgkczrhgsmnmovyzuss.supabase.co",
  "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E"
);

const gallery = document.getElementById("packages");
const notice = document.getElementById("notice");
const esc = (value) => String(value ?? "").replace(/[&<>"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
}[char]));

async function loadGallery() {
  notice.textContent = "Loading…";
  try {
    const { data, error } = await db
      .from("decorations")
      .select("name,category,description,image_url")
      .eq("is_active", true)
      .order("display_order");

    if (error) throw error;
    const items = data || [];
    notice.textContent = items.length + " active package(s)";

    if (!items.length) {
      gallery.innerHTML = '<p>Decoration designs are being updated. Please contact us for a quotation.</p>';
      return;
    }

    gallery.innerHTML = items.map((item) => {
      const image = item.image_url
        ? '<img src="' + esc(item.image_url) + '" alt="' + esc(item.name) + '" loading="lazy">'
        : '<div class="package-placeholder" aria-hidden="true">🌸</div>';
      const category = esc(item.category || "Decoration");
      const name = esc(item.name);
      const description = esc(item.description || "Contact us for details.");
      const design = encodeURIComponent(item.name || "");
      const cat = encodeURIComponent(item.category || "Decoration");

      return '<article class="item package">' +
        image +
        '<span class="eyebrow">' + category + '</span>' +
        '<h2>' + name + '</h2>' +
        '<p>' + description + '</p>' +
        '<p><a href="./decoration-events.html?design=' + design + '&category=' + cat + '">Request this design →</a></p>' +
        '<p><a href="./customer-booking.html">Bartan / Combined Booking →</a></p>' +
        '</article>';
    }).join("");
  } catch (error) {
    console.error("Decoration gallery failed to load:", error);
    notice.textContent = "Decoration designs could not load. Please refresh or contact us.";
    gallery.innerHTML = "";
  }
}

loadGallery();
