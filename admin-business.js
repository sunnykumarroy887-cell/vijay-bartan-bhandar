import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const db = createClient("https://wkgkczrhgsmnmovyzuss.supabase.co", "sb_publishable_3Yr8kc5vFc_dn3atjWJTWA_brY4Kl6E");
const ADMIN_ID = "540b68b8-044f-4ac5-bbd9-8014e31af801";
const $ = id => document.getElementById(id);
const notice = $("notice");
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:2});
const today = new Date();
const dateISO = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const monthISO = d => dateISO(d).slice(0,7);
const setNotice = (msg, bad=false) => { notice.textContent=msg; notice.classList.toggle("error",bad); };
document.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click",()=>{
 document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("selected",b===btn));
 document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id==="p-"+btn.dataset.tab));
}));
$("month").value=monthISO(today);
$("reportFrom").value=monthISO(today)+"-01";
$("reportTo").value=dateISO(today);
const {data:{session}} = await db.auth.getSession();
if(!session || session.user.id!==ADMIN_ID){setNotice("Admin access required.",true);throw new Error("Unauthorized admin access");}
setNotice("Loading business data…");
const [bookingRes,cancelRes,couponRes,decorRes,paymentRes] = await Promise.all([
 db.from("bookings").select("id,booking_number,customer_name,customer_mobile,event_date,return_date,decoration_required,final_total,advance,remaining,status,created_at,decoration_charge,bartan_total").order("event_date"),
 db.from("booking_cancellation_requests").select("*").order("requested_at",{ascending:false}),
 db.from("discount_coupons").select("*").order("created_at",{ascending:false}),
 db.from("decorations").select("id,name,category,description,rate,image_url,is_active,display_order").order("display_order"),
 db.from("booking_payments").select("booking_id,amount,payment_type,payment_method,verification_status,created_at")
]);
if(bookingRes.error) throw bookingRes.error;
const bookings=bookingRes.data||[], cancellations=cancelRes.data||[], coupons=couponRes.data||[], decorations=decorRes.data||[], payments=paymentRes.data||[];
if(paymentRes.error) console.warn("Payment report data unavailable:",paymentRes.error.message);
const paymentTotals=new Map();
payments.forEach(p=>{
 const key=String(p.booking_id), method=String(p.payment_method||"").toLowerCase(), status=String(p.verification_status||"pending").toLowerCase();
 if(method!=="cash" && !["verified","not_required"].includes(status)) return;
 const amount=Number(p.amount||0)*(String(p.payment_type||"").toLowerCase()==="refund"?-1:1);
 paymentTotals.set(key,(paymentTotals.get(key)||0)+amount);
});
function serviceMatch(b,type){return type==="all"||(type==="decoration"?!!b.decoration_required:!b.decoration_required);}
function statusMatch(b,status){return status==="all"||String(b.status||"").toLowerCase()===status;}
function bookingLabel(b){return b.booking_number||("Booking #"+b.id);}
function statCards(target,items){$(target).innerHTML=items.map(([label,value])=>'<article class="item"><span class="meta">'+esc(label)+'</span><h2>'+esc(value)+'</h2></article>').join("");}

function bookingCard(b){
 const got=paymentTotals.get(String(b.id))||0;
 return '<article class="selected-booking"><h4>'+esc(bookingLabel(b))+' · '+esc(b.status||"—")+'</h4><p><strong>Customer:</strong> '+esc(b.customer_name||"—")+'</p><p><strong>Mobile:</strong> '+esc(b.customer_mobile||"—")+'</p><p><strong>Service:</strong> '+(b.decoration_required?"Decoration + Bartan":"Bartan")+'</p><p><strong>Event:</strong> '+esc(b.event_date||"—")+' &nbsp; <strong>Return:</strong> '+esc(b.return_date||"—")+'</p><p><strong>Total:</strong> '+money(b.final_total)+' &nbsp; <strong>Received:</strong> '+money(got)+' &nbsp; <strong>Balance:</strong> '+money(Math.max(0,Number(b.final_total||0)-got))+'</p></article>';
}
function showCalendarDate(iso){
 const type=$("calendarType").value,status=$("calendarStatus").value;
 const rows=bookings.filter(b=>b.event_date===iso&&serviceMatch(b,type)&&statusMatch(b,status));
 const panel=$("calendarDayDetails");
 panel.hidden=false;
 panel.innerHTML='<h3>Bookings on '+esc(iso)+' ('+rows.length+')</h3><button type="button" class="btn2" id="closeCalendarDay">Close</button>'+(rows.map(bookingCard).join("")||'<p>No bookings match the current filters for this date.</p>');
 $("closeCalendarDay").onclick=()=>{panel.hidden=true;};
 panel.scrollIntoView({behavior:"smooth",block:"start"});
}
function renderCalendar(){
 const month=$("month").value;if(!month)return;
 const type=$("calendarType").value,status=$("calendarStatus").value;
 const [year,mo]=month.split("-").map(Number),first=new Date(year,mo-1,1),days=new Date(year,mo,0).getDate();
 const rows=bookings.filter(b=>(b.event_date||"").startsWith(month)&&serviceMatch(b,type)&&statusMatch(b,status));
 const byDay=new Map();rows.forEach(b=>{const day=Number(String(b.event_date).slice(8,10));if(!byDay.has(day))byDay.set(day,[]);byDay.get(day).push(b);});
 statCards("stats",[["Bookings this month",rows.length],["Decoration bookings",rows.filter(b=>b.decoration_required).length],["Active bookings",rows.filter(b=>["confirmed","issued","return_pending"].includes(b.status)).length],["Cancelled",rows.filter(b=>b.status==="cancelled").length]]);
 const names=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];let out=names.map(x=>'<div class="calendar-weekday">'+x+'</div>').join("");
 for(let i=0;i<first.getDay();i++)out+='<div class="calendar-day blank"></div>';
 for(let d=1;d<=days;d++){
  const list=byDay.get(d)||[],iso=year+"-"+String(mo).padStart(2,"0")+"-"+String(d).padStart(2,"0");
  out+='<div class="calendar-day '+(iso===dateISO(today)?"today ":"")+(list.length?"has-bookings":"")+'" '+(list.length?'role="button" tabindex="0" data-calendar-date="'+iso+'" aria-label="Show '+list.length+' bookings on '+iso+'"':'')+'><button type="button" class="calendar-day-button" '+(list.length?'data-calendar-date="'+iso+'"':'disabled')+'><div class="calendar-day-number">'+d+'</div>'+(list.length?'<div class="calendar-count">'+list.length+' booking'+(list.length===1?"":"s")+'</div>':'')+(list.slice(0,2).map(b=>'<div class="calendar-dot-list">'+esc(b.customer_name||bookingLabel(b))+'</div>').join(""))+(list.length>2?'<div class="calendar-dot-list">+'+(list.length-2)+' more</div>':"")+'</button></div>';
 }
 $("calendar").innerHTML=out;
 $("calendar").querySelectorAll("[data-calendar-date]").forEach(el=>{
  const activate=()=>showCalendarDate(el.dataset.calendarDate);
  el.addEventListener("click",activate);
  if(el.tagName!=="BUTTON")el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate();}});
 });
 $("calendarList").innerHTML='<table class="table"><thead><tr><th>Event date</th><th>Booking</th><th>Customer</th><th>Service</th><th>Return</th><th>Status</th></tr></thead><tbody>'+(rows.map(b=>'<tr><td>'+esc(b.event_date||"—")+'</td><td>'+esc(bookingLabel(b))+'</td><td>'+esc(b.customer_name)+'<br>'+esc(b.customer_mobile)+'</td><td>'+(b.decoration_required?"Decoration + Bartan":"Bartan")+'</td><td>'+esc(b.return_date||"—")+'</td><td><span class="badge '+(b.status==="cancelled"?"off":"")+'">'+esc(b.status)+'</span></td></tr>').join("")||'<tr><td colspan="6">No bookings match these filters.</td></tr>')+'</tbody></table>';
}

["month","calendarType","calendarStatus"].forEach(id=>$(id).addEventListener("change",renderCalendar));renderCalendar();

function renderCancellations(){
 const box=$("cancellations");
 if(cancelRes.error){box.textContent="Could not load cancellation requests: "+cancelRes.error.message;return;}
 box.innerHTML=cancellations.map(c=>'<article class="item"><h3>Booking #'+esc(c.booking_id)+' · '+esc(c.status)+'</h3><p>'+esc(c.reason||"No reason supplied")+'</p>'+(c.status==="pending"?'<button class="btn2" data-cancel="'+esc(c.id)+'" data-status="approved">Approve</button> <button class="btn2" data-cancel="'+esc(c.id)+'" data-status="rejected">Reject</button>':'<p>'+esc(c.admin_note||"")+'</p>')+'</article>').join("")||"No cancellation requests.";
 box.querySelectorAll("[data-cancel]").forEach(btn=>btn.onclick=async()=>{
  const c=cancellations.find(x=>String(x.id)===btn.dataset.cancel);if(!c)return;
  const note=prompt("Optional note for customer")||"";
  btn.disabled=true;
  const u=await db.from("booking_cancellation_requests").update({status:btn.dataset.status,admin_note:note,reviewed_at:new Date().toISOString(),reviewed_by:session.user.id}).eq("id",c.id).eq("status","pending");
  if(u.error){alert(u.error.message);btn.disabled=false;return;}
  if(btn.dataset.status==="approved"){
   const z=await db.from("bookings").update({status:"cancelled"}).eq("id",c.booking_id).in("status",["pending","confirmed"]);
   if(z.error){alert("Request reviewed, but booking status was not changed: "+z.error.message);}
  }
  location.reload();
 });
}
renderCancellations();

function renderCoupons(){
 const box=$("coupons");
 if(couponRes.error){box.textContent="Could not load coupons: "+couponRes.error.message;return;}
 box.innerHTML=coupons.map(c=>'<article class="item"><strong>'+esc(c.code)+'</strong> · <span class="badge '+(!c.is_active?"off":"")+'">'+(c.is_active?"Active":"Inactive")+'</span><p>'+esc(c.description||"")+' · '+(c.discount_type==="percent"?esc(c.discount_value)+"%":money(c.discount_value))+' discount</p><button class="btn2" data-toggle="'+esc(c.id)+'">Toggle status</button> <button class="btn2" data-delete="'+esc(c.id)+'">Delete</button></article>').join("")||"No coupons created yet.";
 box.querySelectorAll("[data-toggle]").forEach(btn=>btn.onclick=async()=>{const c=coupons.find(x=>String(x.id)===btn.dataset.toggle);const z=await db.from("discount_coupons").update({is_active:!c.is_active}).eq("id",c.id);if(z.error)alert(z.error.message);else location.reload();});
 box.querySelectorAll("[data-delete]").forEach(btn=>btn.onclick=async()=>{if(!confirm("Delete this coupon?"))return;const z=await db.from("discount_coupons").delete().eq("id",btn.dataset.delete);if(z.error)alert(z.error.message);else location.reload();});
}
renderCoupons();
$("couponForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const ex=$("expiry").value,val=Number($("value").value),type=$("type").value;
 if(!Number.isFinite(val)||val<=0||(type==="percent"&&val>100)){alert("Enter a valid discount value. Percent must be 1–100.");return;}
 const payload={code:$("code").value.trim().toUpperCase(),description:$("desc").value.trim(),discount_type:type,discount_value:val,minimum_amount:Number($("minimum").value||0),max_discount:$("maxdiscount").value?Number($("maxdiscount").value):null,expires_at:ex?new Date(ex+"T23:59:59").toISOString():null,max_uses:$("maxuses").value?Number($("maxuses").value):null,per_customer_limit:Number($("perlimit").value||1),is_active:$("active").checked};
 const btn=e.submitter;if(btn){btn.disabled=true;btn.textContent="Saving…";}
 const z=await db.from("discount_coupons").insert(payload);
 if(z.error){alert("Coupon was not saved: "+z.error.message);if(btn){btn.disabled=false;btn.textContent="Save Coupon";}}
 else location.reload();
});

function reportRows(){
 const from=$("reportFrom").value,to=$("reportTo").value,type=$("reportType").value,status=$("reportStatus").value;
 return bookings.filter(b=>(!from||String(b.event_date||"")>=from)&&(!to||String(b.event_date||"")<=to)&&serviceMatch(b,type)&&statusMatch(b,status));
}
function renderReport(){
 const rows=reportRows(),sum=k=>rows.reduce((n,b)=>n+Number(b[k]||0),0);
 const received=rows.reduce((n,b)=>n+(paymentTotals.get(String(b.id))||0),0);
 const pendingOnline=rows.reduce((n,b)=>n+payments.filter(p=>String(p.booking_id)===String(b.id)&&String(p.payment_method||"").toLowerCase()!=="cash"&&String(p.verification_status||"pending").toLowerCase()==="pending"&&String(p.payment_type||"").toLowerCase()!=="refund").reduce((s,p)=>s+Number(p.amount||0),0),0);
 statCards("reportStats",[["Bookings",rows.length],["Booking value",money(sum("final_total"))],["Received / verified",money(received)],["Remaining balance",money(rows.reduce((n,b)=>n+Math.max(0,Number(b.final_total||0)-(paymentTotals.get(String(b.id))||0)),0))],["Pending online claims",money(pendingOnline)],["Decoration bookings",rows.filter(b=>b.decoration_required).length]]);
 $("reportRows").innerHTML='<table class="table report-table"><thead><tr><th>Event date</th><th>Booking</th><th>Customer</th><th>Service</th><th>Status</th><th>Total</th><th>Received</th><th>Balance</th></tr></thead><tbody>'+(rows.map(b=>{const got=paymentTotals.get(String(b.id))||0;return '<tr><td>'+esc(b.event_date||"—")+'</td><td>'+esc(bookingLabel(b))+'</td><td>'+esc(b.customer_name||"")+'</td><td>'+(b.decoration_required?"Decoration + Bartan":"Bartan")+'</td><td>'+esc(b.status||"—")+'</td><td>'+money(b.final_total)+'</td><td>'+money(got)+'</td><td>'+money(Math.max(0,Number(b.final_total||0)-got))+'</td></tr>';}).join("")||'<tr><td colspan="8">No bookings match this report.</td></tr>')+'</tbody></table>';
}
["reportFrom","reportTo","reportType","reportStatus"].forEach(id=>$(id).addEventListener("change",renderReport));renderReport();
$("print").onclick=()=>window.print();
$("exportCsv").onclick=()=>{
 const rows=reportRows(),head=["Event date","Booking","Customer","Mobile","Service","Status","Total","Received","Balance"];
 const data=[head,...rows.map(b=>{const got=paymentTotals.get(String(b.id))||0;return [b.event_date,bookingLabel(b),b.customer_name,b.customer_mobile,b.decoration_required?"Decoration + Bartan":"Bartan",b.status,b.final_total,got,Math.max(0,Number(b.final_total||0)-got)];})];
 const csv=data.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"})),a=document.createElement("a");a.href=url;a.download="business-report-"+dateISO(today)+".csv";a.click();URL.revokeObjectURL(url);
};

function renderDecorationMonthly(){
 const month=$("decorationReportMonth").value;
 if(!month)return;
 const status=$("decorationReportStatus").value;
 const rows=bookings.filter(b=>!!b.decoration_required&&(b.event_date||"").startsWith(month)&&statusMatch(b,status));
 const [year,mo]=month.split("-").map(Number),first=new Date(year,mo-1,1),days=new Date(year,mo,0).getDate();
 const byDay=new Map();rows.forEach(b=>{const day=Number(String(b.event_date).slice(8,10));if(!byDay.has(day))byDay.set(day,[]);byDay.get(day).push(b);});
 statCards("decorationReportStats",[["Decoration bookings",rows.length],["Active",rows.filter(b=>["confirmed","issued","return_pending"].includes(b.status)).length],["Completed",rows.filter(b=>b.status==="completed").length],["Cancelled",rows.filter(b=>b.status==="cancelled").length],["Decoration booking total",money(rows.reduce((n,b)=>n+Number(b.decoration_charge||0),0))]]);
 let out=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>'<div class="calendar-weekday">'+x+'</div>').join("");
 for(let i=0;i<first.getDay();i++)out+='<div class="calendar-day blank"></div>';
 for(let d=1;d<=days;d++){
  const iso=year+"-"+String(mo).padStart(2,"0")+"-"+String(d).padStart(2,"0"),list=byDay.get(d)||[];
  out+='<div class="calendar-day '+(iso===dateISO(today)?"today ":"")+(list.length?"has-bookings":"")+'" '+(list.length?'role="button" tabindex="0" data-decoration-date="'+iso+'" aria-label="Show '+list.length+' decoration bookings on '+iso+'"':'')+'><button class="calendar-day-button" type="button" '+(list.length?'data-decoration-date="'+iso+'"':'disabled')+'><div class="calendar-day-number">'+d+'</div>'+(list.length?'<div class="calendar-count">'+list.length+' booking'+(list.length===1?"":"s")+'</div>':'')+(list.slice(0,2).map(b=>'<div class="calendar-dot-list">'+esc(b.customer_name||bookingLabel(b))+'</div>').join(""))+(list.length>2?'<div class="calendar-dot-list">+'+(list.length-2)+' more</div>':"")+'</button></div>';
 }
 $("decorationCalendar").innerHTML=out;
 const panel=$("decorationDayDetails");
 const showDate=iso=>{
  const selected=bookings.filter(b=>!!b.decoration_required&&b.event_date===iso&&statusMatch(b,status));
  panel.hidden=false;
  panel.innerHTML='<h3>Decoration bookings on '+esc(iso)+' ('+selected.length+')</h3><button type="button" class="btn2" id="closeDecorationDay">Close</button>'+(selected.map(bookingCard).join("")||'<p>No decoration bookings match this date and status.</p>');
  $("closeDecorationDay").onclick=()=>panel.hidden=true;
  panel.scrollIntoView({behavior:"smooth",block:"start"});
 };
 $("decorationCalendar").querySelectorAll("[data-decoration-date]").forEach(el=>{
  const activate=()=>showDate(el.dataset.decorationDate);
  el.addEventListener("click",activate);
  if(el.tagName!=="BUTTON")el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate();}});
 });
 $("decorationReportCsv").onclick=()=>{
  const head=["Event date","Booking","Customer","Mobile","Return date","Status","Booking total","Decoration charge","Received","Balance"];
  const data=[head,...rows.map(b=>{const got=paymentTotals.get(String(b.id))||0;return [b.event_date,bookingLabel(b),b.customer_name,b.customer_mobile,b.return_date,b.status,b.final_total,b.decoration_charge,got,Math.max(0,Number(b.final_total||0)-got)];})];
  const csv=data.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\\r\\n");
  const url=URL.createObjectURL(new Blob(["\\ufeff"+csv],{type:"text/csv;charset=utf-8;"})),a=document.createElement("a");a.href=url;a.download="decoration-monthly-report-"+month+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
}
$("decorationReportMonth").value=monthISO(today);
$("decorationReportMonth").addEventListener("change",renderDecorationMonthly);
$("decorationReportStatus").addEventListener("change",renderDecorationMonthly);
$("decorationReportPrint").addEventListener("click",()=>window.print());

function renderPackages(){
 const box=$("packages");
 if(decorRes.error){box.textContent="Could not load packages: "+decorRes.error.message;return;}
 const active=decorations.filter(d=>d.is_active).length;
 statCards("packageStats",[["Total packages",decorations.length],["Active packages",active],["Inactive packages",decorations.length-active]]);
 box.innerHTML=decorations.map(d=>'<article class="package-card">'+(d.image_url?'<img src="'+esc(d.image_url)+'" alt="'+esc(d.name)+'" loading="lazy">':'<div class="package-placeholder">🌸</div>')+'<div class="package-card-body"><span class="badge '+(!d.is_active?"off":"")+'">'+(d.is_active?"Active":"Inactive")+'</span><h3>'+esc(d.name)+'</h3><p class="meta">'+esc(d.category||"Decoration")+'</p><p>'+esc(d.description||"No description added.")+'</p><div class="package-price">'+money(d.rate)+'</div><p class="meta">Display order: '+esc(d.display_order??0)+'</p></div></article>').join("")||"No decoration packages found.";
}
renderPackages();
renderDecorationMonthly();
setNotice("Business tools loaded. Reports use event dates; only verified/cash payments count as received.");
