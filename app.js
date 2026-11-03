// =====================================================
//  분리척척 첫 화면 동작
//  1) 검색창에 이름을 쓰면 쓰레기 목록이 걸러져요.
//  2) 분리수거함 버튼을 누르면 그 통에 들어가는 것만 보여요.
//  3) 쓰레기를 누르면 "어디에, 어떻게 버리는지" 창이 열려요.
// =====================================================

let searchText = "";   // 검색창에 쓴 글자
let currentBin = "all"; // 고른 분리수거함 ("all"이면 전체)

const $ = (id) => document.getElementById(id);
const findItem = (id) => ITEMS.find((it) => it.id === id);

// 띄어쓰기를 없애고 소문자로 바꿔서 비교해요 (예: "과자 봉지" = "과자봉지")
const normalize = (text) => text.replace(/\s+/g, "").toLowerCase();

// ---------- 검색 + 분리수거함 조건에 맞는 쓰레기 찾기 ----------
function filteredItems() {
  const q = normalize(searchText);
  return ITEMS.filter((it) => {
    const binOk = currentBin === "all" || it.bin === currentBin;
    if (!binOk) return false;
    if (!q) return true;
    const words = [it.name, ...it.keywords, BINS[it.bin].name].map(normalize);
    return words.some((w) => w.includes(q));
  });
}

// ---------- 분리수거함 버튼 그리기 ----------
function renderBinFilters() {
  const counts = {};
  ITEMS.forEach((it) => { counts[it.bin] = (counts[it.bin] || 0) + 1; });

  const chips = [`<button class="bin-chip" data-bin="all" aria-pressed="${currentBin === "all"}">전체</button>`];
  Object.entries(BINS).forEach(([key, bin]) => {
    chips.push(`
      <button class="bin-chip" data-bin="${key}" aria-pressed="${currentBin === key}" style="--chip-color:${bin.color}">
        <span class="chip-dot" style="background:${bin.color}"></span>${bin.name}
      </button>`);
  });
  $("binFilters").innerHTML = chips.join("");

  document.querySelectorAll(".bin-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentBin = btn.dataset.bin;
      renderBinFilters();
      renderItems();
    });
  });
}

// ---------- 쓰레기 카드 그리기 ----------
function renderItems() {
  const list = filteredItems();
  $("resultCount").textContent = `${list.length}개를 찾았어요`;

  if (list.length === 0) {
    $("itemGrid").innerHTML = `
      <div class="empty">
        <strong>🤔 "${escapeHtml(searchText)}"은(는) 아직 사전에 없어요</strong>
        다른 이름으로 찾아보거나, 헷갈리면 선생님께 물어보세요.
      </div>`;
    return;
  }

  $("itemGrid").innerHTML = list.map((it) => {
    const bin = BINS[it.bin];
    return `
      <button class="item" data-item="${it.id}" style="--bin-color:${bin.color}">
        <span class="item-icon">${it.icon}</span>
        <span class="item-name">${it.name}</span>
        <span class="item-bin">${bin.icon} ${bin.name}</span>
      </button>`;
  }).join("");

  document.querySelectorAll(".item").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.item));
  });
}

// 검색어에 <, > 같은 기호가 있어도 화면이 깨지지 않게 해요
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- "제일 많이 헷갈리는 것" 버튼 ----------
function renderQuick() {
  $("quickList").innerHTML = QUICK_IDS.map((id) => {
    const it = findItem(id);
    return `<button class="quick-btn" data-item="${it.id}">${it.icon} ${it.name}</button>`;
  }).join("");
  document.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.item));
  });
}

// ---------- 버리는 법 창 ----------
let lastFocus = null;

function openModal(itemId) {
  const it = findItem(itemId);
  const bin = BINS[it.bin];
  lastFocus = document.activeElement;

  $("modalIcon").textContent = it.icon;
  $("modalTitle").textContent = it.name;
  $("modalBin").style.background = bin.color;
  $("modalBin").innerHTML = `
    <span class="bin-big-icon">${bin.icon}</span>
    <div><small>여기에 버려요</small><strong>${bin.name}</strong></div>`;
  $("modalSteps").innerHTML = it.steps.map((s) => `<li>${s}</li>`).join("");
  $("modalWarn").innerHTML = `<b>⚠️ 이것만은 꼭!</b>${it.warn}`;

  $("modal").hidden = false;
  document.body.style.overflow = "hidden";
  $("modalClose").focus();
}

function closeModal() {
  $("modal").hidden = true;
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}

// ---------- 시작 ----------
$("statItems").textContent = ITEMS.length;
$("statBins").textContent = Object.keys(BINS).length;

$("searchInput").addEventListener("input", (e) => {
  searchText = e.target.value;
  $("searchClear").hidden = searchText === "";
  renderItems();
});
$("searchClear").addEventListener("click", () => {
  searchText = "";
  $("searchInput").value = "";
  $("searchClear").hidden = true;
  $("searchInput").focus();
  renderItems();
});

$("modalClose").addEventListener("click", closeModal);
$("modalOk").addEventListener("click", closeModal);
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("modal").hidden) closeModal(); });

renderQuick();
renderBinFilters();
renderItems();
