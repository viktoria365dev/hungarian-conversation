// ===== Utility =====
const byId = (elementId) => document.getElementById(elementId);

const shuffle = (array) =>
  array
    .map((value) => [Math.random(), value]) // attach random number
    .sort((aPair, bPair) => aPair[0] - bPair[0]) // sort by random number
    .map((pair) => pair[1]); // extract original values

// ===== State =====
let questions = [];
let questionOrder = [];
let currentIndex = 0;

// ===== Load Questions =====
async function loadQuestions() {
  try {
    const response = await fetch("questions.json");
    if (!response.ok) throw new Error("HTTP error " + response.status);
    questions = await response.json();
    resetDeck();
  } catch (error) {
    console.error("Loading error:", error);
    const questionTextElement = byId("questionText");
    if (questionTextElement) {
      questionTextElement.textContent = "Failed to load questions.";
    }
  }
}

// ===== Deck Handling =====
function resetDeck() {
  if (questions.length === 0) return;
  questionOrder = shuffle([...Array(questions.length).keys()]);
  currentIndex = 0;
  renderCurrent();
}

function nextQuestion() {
  if (currentIndex < questionOrder.length - 1) {
    currentIndex++;
    renderCurrent();
  } else {
    resetDeck();
  }
}

// ===== Render =====
function renderCurrent() {
  if (questions.length === 0) return;
  const currentQuestion = questions[questionOrder[currentIndex]];
  // Hungarian
  byId("questionText").textContent = currentQuestion.hu;

  // English
  const englishElement = byId("questionEnglish");
  if (englishElement) englishElement.textContent = currentQuestion.en;

  // starters
  const starterListElement = byId("starterList");
  starterListElement.innerHTML = "";
  currentQuestion.starters.forEach((starterText) => {
    const listItem = document.createElement("li");
    listItem.textContent = starterText;
    starterListElement.appendChild(listItem);
  });

  byId("starters").style.display = byId("toggleStarters").checked
    ? "block"
    : "none";

  // counter + progress
  byId("counter").textContent = `${currentIndex + 1}/${questionOrder.length}`;
  const percentComplete = Math.round(
    ((currentIndex + 1) / questionOrder.length) * 100
  );
  const progressBar = byId("progressBar");
  progressBar.style.width = percentComplete + "%";
  progressBar.setAttribute("aria-valuenow", percentComplete);
}

// ===== Favourites =====
function addToFavourites(question) {
  let favourites = JSON.parse(localStorage.getItem("favourites")) || [];
  if (!favourites.find((fav) => fav.id === question.id)) {
    favourites.push(question);
    localStorage.setItem("favourites", JSON.stringify(favourites));
    showFavFeedback("✔ Added to favorites!");
  } else {
    showFavFeedback("★ Already in favorites!");
  }
}

function showFavFeedback(message) {
  const favButton = byId("favBtn");
  const originalContent = favButton.innerHTML;
  favButton.innerHTML = message;
  setTimeout(() => (favButton.innerHTML = originalContent), 1500);
}

// ===== Favourites Page Logic =====
if (byId("favouritesList")) {
  function getFavourites() {
    return JSON.parse(localStorage.getItem("favourites")) || [];
  }

  function saveFavourites(favourites) {
    localStorage.setItem("favourites", JSON.stringify(favourites));
  }

  function deleteFavourite(favouriteId) {
    let favourites = getFavourites();
    favourites = favourites.filter((fav) => fav.id !== favouriteId);
    saveFavourites(favourites);
    renderFavourites();
  }

  function renderFavourites() {
    const favourites = getFavourites();
    const container = byId("favouritesList");
    container.innerHTML = "";

    if (favourites.length === 0) {
      container.innerHTML =
        '<p class="text-center text-muted">No favourites saved.</p>';
      return;
    }

    favourites.forEach((favouriteQuestion) => {
      const column = document.createElement("div");
      column.className = "col-12 col-md-6";
      column.setAttribute("role", "listitem");
      column.innerHTML = `
  <div class="card h-100 shadow-sm">
    <div class="card-body">
      <h5 class="card-title">${favouriteQuestion.hu}</h5>
      <div class="question-translation">${favouriteQuestion.en || ""}</div>
      <ul class="starter-list">
        ${favouriteQuestion.starters
          .map((starterText) => `<li>${starterText}</li>`)
          .join("")}
      </ul>
      <button class="btn btn-sm btn-outline-danger mt-2 delete-btn">
        <i class="bi bi-trash"></i> Delete
      </button>
    </div>
  </div>
`;

      // attach delete handler
      column.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("Delete this favourite?")) {
          deleteFavourite(favouriteQuestion.id);
        }
      });

      container.appendChild(column);
    });
  }

  byId("clearFavs").addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all your favourites?")) {
      localStorage.removeItem("favourites");
      renderFavourites();
    }
  });

  renderFavourites();
}

// ===== Events =====
byId("toggleStarters")?.addEventListener("change", renderCurrent);
byId("nextBtn")?.addEventListener("click", nextQuestion);
byId("resetBtn")?.addEventListener("click", resetDeck);

byId("favBtn")?.addEventListener("click", (event) => {
  event.stopPropagation(); // prevent card click handler from firing
  if (questions.length > 0) {
    const currentQuestion = questions[questionOrder[currentIndex]];
    addToFavourites(currentQuestion);
  }
});

// ===== Prevent card click from hijacking controls =====
["resetBtn", "nextBtn", "toggleStarters"].forEach((id) => {
  const el = byId(id);
  if (el) {
    el.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }
});

// Also stop bubbling when clicking the label for the toggle
const toggleLabel = document.querySelector("label[for='toggleStarters']");
if (toggleLabel) {
  toggleLabel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

// ===== Init =====
if (byId("questionText")) {
  loadQuestions();
}

// ===== Card Click / Tap / Keyboard =====
const questionCard = document.querySelector(".question-card");

if (questionCard) {
  // Mouse + touch (click covers both)
  questionCard.addEventListener("click", () => {
    nextQuestion();
  });

  // Keyboard support (Enter + Space)
  questionCard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      nextQuestion();
    }
  });
}
