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
async function uploadDecorationImage(file) {
 if (!file) return "";
 const allowed = ["image/jpeg","image/png","image/webp","image/gif"];
 if (!allowed.includes(file.type)) throw new Error("Choose a JPG, PNG, WEBP or GIF image.");
 if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller.");
 const { data: { session } } = await supabase.auth.getSession();
 if (!session || session.user.id !== ADMIN_UID) throw new Error("Admin session expired. Please sign in again.");
 const ext = ({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"})[file.type];
 const path = "admin/" + Date.now() + "-" + crypto.randomUUID() + "." + ext;
 const { error } = await supabase.storage.from("decoration-images").upload(path,file,{contentType:file.type,upsert:false,cacheControl:"3600"});
 if (error) throw error;
 return supabase.storage.from("decoration-images").getPublicUrl(path).data.publicUrl;
}
function bindImagePreview(inputId,previewId) {
 const input=document.getElementById(inputId), preview=document.getElementById(previewId); if(!input||!preview)return;
 input.addEventListener("change",()=>{const file=input.files&&input.files[0];if(!file){preview.src="";preview.classList.add("hidden");return;}
 if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)||file.size>5*1024*1024){input.value="";preview.src="";preview.classList.add("hidden");showError("Choose a JPG, PNG, WEBP or GIF image up to 5 MB.");return;}
 preview.src=URL.createObjectURL(file);preview.classList.remove("hidden");});
}
bindImagePreview("imageUpload","imagePreview");
bindImagePreview("editImageUpload","editImagePreview");

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


        let imageUrl = document.getElementById("imageUrl").value.trim();
        const selectedImage = document.getElementById("imageUpload").files[0];


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


        try { if (selectedImage) imageUrl = await uploadDecorationImage(selectedImage); } catch (uploadError) { submitButton.disabled=false; submitButton.textContent="+ Add Decoration"; showError(uploadError.message||"Image upload failed."); return; }

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


        let imageUrl = document.getElementById("editImageUrl").value.trim();
        const selectedImage = document.getElementById("editImageUpload").files[0];


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


        try { if (selectedImage) imageUrl = await uploadDecorationImage(selectedImage); } catch (uploadError) { submitButton.disabled=false; submitButton.textContent="Save Changes"; showError(uploadError.message||"Image upload failed."); return; }

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



async function loadDecorationQuoteRequests() {
 const root=document.getElementById("decorationQuotesList");
 const note=document.getElementById("decorationQuotesNotice");
 if(!root||!note)return;
 root.textContent="Loading…"; note.textContent="";
 const { data: { session }, error: sessionError } = await supabase.auth.getSession();
 if (sessionError || !session || session.user.id !== ADMIN_UID) {
  root.textContent = "Admin session not detected. Please log in again, then reopen Decoration Management.";
  return;
 }
 const {data:events,error}=await supabase.from("booking_events")
  .select("id,booking_id,event_name,event_date,event_time,venue_address,decoration_details,design_name,reference_image_urls,quoted_amount,delivery_charge,discount,status")
  .order("event_date",{ascending:false});
 if(error){root.textContent="Could not load decoration events: "+error.message+" (code: "+(error.code||"n/a")+")";return;}
 const ids=[...new Set((events||[]).map(e=>e.booking_id))];
 if(!ids.length){root.textContent="No decoration event records found in booking_events. Please verify the customer submission saved event rows.";return;}
 const {data:bookings,error:be}=await supabase.from("bookings").select("id,booking_number,customer_name,customer_mobile,customer_address,customer_user_id,booking_type,decoration_required").in("id",ids);
 if(be){root.textContent="Could not load related bookings: "+be.message+" (code: "+(be.code||"n/a")+")";return;}
 const pending=(events||[]).filter(e=>["pending","under_review","quotation_sent","awaiting_approval"].includes(String(e.status||"").toLowerCase()));
 if(!pending.length){root.textContent="Event rows found, but no pending quotations. Existing event status: "+[...new Set((events||[]).map(e=>e.status))].join(", ");return;}
 const bm=new Map((bookings||[]).map(b=>[String(b.id),b]));
 root.replaceChildren();
 pending.forEach(e=>{
  const b=bm.get(String(e.booking_id)); if(!b)return;
  const card=document.createElement("article");
  card.style.cssText="border:1px solid #d9e5dc;border-radius:16px;padding:18px;margin:14px 0;background:#fff;box-shadow:0 4px 14px rgba(15,50,35,.06)";
  const title=document.createElement("h3");
  title.style.cssText="font-size:1.15rem;margin:0 0 12px;color:#174b36";
  title.textContent=(b.booking_number||("Booking #"+b.id))+" · "+(e.event_name||"Decoration event");
  card.append(title);
  const badge=document.createElement("span");
  badge.textContent=String(e.status||"pending").replaceAll("_"," ").toUpperCase();
  badge.style.cssText="display:inline-block;background:#fff4d6;color:#775400;border-radius:20px;padding:5px 10px;font-size:.78rem;font-weight:700;margin-bottom:14px";
  card.append(badge);
  const customerBox=document.createElement("section");
  customerBox.style.cssText="background:#f6faf7;border-radius:12px;padding:12px;margin:8px 0";
  const customerTitle=document.createElement("h4"); customerTitle.textContent="Customer details"; customerTitle.style.margin="0 0 8px"; customerBox.append(customerTitle);
  [[ "Customer name",b.customer_name ],["Mobile number",b.customer_mobile],["Full address",b.customer_address],["Booking type",b.booking_type||"decoration"]].forEach(([label,value])=>{
   const p=document.createElement("p");p.style.cssText="margin:5px 0;overflow-wrap:anywhere";const strong=document.createElement("strong");strong.textContent=label+": ";p.append(strong,document.createTextNode(value||"—"));customerBox.append(p);
  });
  card.append(customerBox);
  const eventBox=document.createElement("section"); eventBox.style.cssText="padding:10px 0";
  const eventTitle=document.createElement("h4");eventTitle.textContent="Event details";eventTitle.style.margin="0 0 8px";eventBox.append(eventTitle);
  [["Selected design / package",e.design_name||"Not selected"],["Event date",e.event_date||"—"],["Event time",e.event_time||"Not specified"],["Venue",e.venue_address||"—"],["Decoration requirements",e.decoration_details||"—"]].forEach(([label,value])=>{
   const p=document.createElement("p");p.style.cssText="margin:6px 0;line-height:1.45;overflow-wrap:anywhere";const strong=document.createElement("strong");strong.textContent=label+": ";p.append(strong,document.createTextNode(value));eventBox.append(p);
  });
  const images=Array.isArray(e.reference_image_urls)?e.reference_image_urls:[];
  if(images.length){const gallery=document.createElement("div");gallery.style.cssText="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0";images.forEach((url,i)=>{const link=document.createElement("a");link.href=url;link.target="_blank";link.rel="noopener noreferrer";const img=document.createElement("img");img.src=url;img.alt="Reference image "+(i+1);img.loading="lazy";img.style.cssText="width:100px;height:100px;object-fit:cover;border-radius:10px;border:1px solid #ddd";link.append(img);gallery.append(link)});eventBox.append(gallery)}
  else {const p=document.createElement("p");p.textContent="No reference images attached.";p.style.color="#666";eventBox.append(p)}
  card.append(eventBox);
  const form=document.createElement("form"); form.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:12px";
  const fields=[];
  [["Quotation amount",e.quoted_amount],["Delivery charge",e.delivery_charge],["Discount",e.discount]].forEach(([label,val])=>{const wrap=document.createElement("label");wrap.textContent=label;const input=document.createElement("input");input.type="number";input.min="0";input.step="0.01";input.required=label==="Quotation amount";input.value=Number(val||0);input.style.cssText="display:block;width:100%;padding:8px;box-sizing:border-box";wrap.append(input);form.append(wrap);fields.push(input);});
  const msg=document.createElement("input");msg.type="text";msg.maxLength=1000;msg.placeholder="Quotation note / terms";msg.style.cssText="padding:8px";form.append(msg);
  const btn=document.createElement("button");btn.type="submit";btn.className="primary-btn";btn.textContent=String(e.status)==="quotation_sent"?"Resend quotation":"Send quotation";form.append(btn);
  form.addEventListener("submit",async ev=>{ev.preventDefault();btn.disabled=true;btn.textContent="Sending…";try{const {error}=await supabase.rpc("admin_set_decoration_quotation",{p_event_id:e.id,p_quoted_amount:Number(fields[0].value),p_delivery_charge:Number(fields[1].value),p_discount:Number(fields[2].value),p_message:msg.value.trim()});if(error)throw error;note.textContent="Quotation sent for "+(b.booking_number||b.id)+". Customer can review it in their profile.";await loadDecorationQuoteRequests();}catch(err){note.textContent="Quotation failed: "+(err.message||"Unknown error");}finally{btn.disabled=false;btn.textContent="Send quotation";}});
  card.append(form);root.append(card);
 });
}
document.getElementById("refreshQuotesBtn")?.addEventListener("click",loadDecorationQuoteRequests);

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
    await loadDecorationQuoteRequests();
}


init();