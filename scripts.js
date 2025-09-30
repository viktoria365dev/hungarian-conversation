// ===== Utility =====
const byId = (id) => document.getElementById(id);
const shuffle = (arr) =>
  arr
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map((v) => v[1]);

// ===== State =====
let questions = [];
let order = [];
let index = 0;

// ===== Load Questions =====
async function loadQuestions() {
  try {
    const res = await fetch("questions.json");
    if (!res.ok) throw new Error("HTTP error " + res.status);
    questions = await res.json();
    resetDeck();
  } catch (err) {
    console.error("Loading error:", err);
    byId("questionText").textContent = "Failed to load questions.";
  }
}

// ===== Deck Handling =====
function resetDeck() {
  if (questions.length === 0) return;
  order = shuffle([...Array(questions.length).keys()]);
  index = 0;
  renderCurrent();
}

function nextQuestion() {
  if (index < order.length - 1) {
    index++;
    renderCurrent();
  } else {
    resetDeck();
  }
}

// ===== Render =====
function renderCurrent() {
  if (questions.length === 0) return;
  const q = questions[order[index]];
  byId("questionText").textContent = q.hu;

  // starters
  const starterList = byId("starterList");
  starterList.innerHTML = "";
  q.starters.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    starterList.appendChild(li);
  });
  byId("starters").style.display = byId("toggleStarters").checked
    ? "block"
    : "none";

  // counter + progress
  byId("counter").textContent = `${index + 1}/${order.length}`;
  const pct = Math.round(((index + 1) / order.length) * 100);
  byId("progressBar").style.width = pct + "%";
  byId("progressBar").setAttribute("aria-valuenow", pct);
}

// ===== Favourites =====
function addToFavourites(question) {
  let favs = JSON.parse(localStorage.getItem("favourites")) || [];
  if (!favs.find((f) => f.id === question.id)) {
    favs.push(question);
    localStorage.setItem("favourites", JSON.stringify(favs));
    showFavFeedback("✔ Added to favorites!");
  } else {
    showFavFeedback("★ Already in favorites!");
  }
}

function showFavFeedback(msg) {
  const btn = byId("favBtn");
  const original = btn.innerHTML;
  btn.innerHTML = msg;
  setTimeout(() => (btn.innerHTML = original), 1500);
}

// ===== Favourites Page Logic =====
if (document.getElementById("favouritesList")) {
  function getFavourites() {
    return JSON.parse(localStorage.getItem("favourites")) || [];
  }

  function saveFavourites(favs) {
    localStorage.setItem("favourites", JSON.stringify(favs));
  }

  function deleteFavourite(id) {
    let favs = getFavourites();
    favs = favs.filter((f) => f.id !== id);
    saveFavourites(favs);
    renderFavourites();
  }

  function renderFavourites() {
    const favs = getFavourites();
    const container = document.getElementById("favouritesList");
    container.innerHTML = "";

    if (favs.length === 0) {
      container.innerHTML =
        '<p class="text-center text-muted">No favourites saved.</p>';
      return;
    }

    favs.forEach((q) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6";
      col.innerHTML = `
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${q.hu}</h5>
            <ul class="starter-list">
              ${q.starters.map((s) => `<li>${s}</li>`).join("")}
            </ul>
            <button class="btn btn-sm btn-outline-danger mt-2 delete-btn">
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
        </div>
      `;

      // attach delete handler
      col.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("Delete this favourite?")) {
          deleteFavourite(q.id);
        }
      });

      container.appendChild(col);
    });
  }

  document.getElementById("clearFavs").addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all your favourites?")) {
      localStorage.removeItem("favourites");
      renderFavourites();
    }
  });

  renderFavourites();
}

// ===== Events =====
byId("toggleStarters").addEventListener("change", renderCurrent);
byId("nextBtn").addEventListener("click", nextQuestion);
byId("resetBtn").addEventListener("click", resetDeck);

byId("favBtn").addEventListener("click", () => {
  if (questions.length > 0) {
    const q = questions[order[index]];
    addToFavourites(q);
  }
});

// keyboard shortcuts: Enter = next, S = toggle starters
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    nextQuestion();
  }
  if (e.key.toLowerCase() === "s") {
    const t = byId("toggleStarters");
    t.checked = !t.checked;
    renderCurrent();
  }
});

// ===== Init =====
loadQuestions();
