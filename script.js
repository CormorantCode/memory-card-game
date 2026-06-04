const gameBoard =
    document.getElementById("game-board");

const moveCounter =
    document.getElementById("move-counter");

const timerElement =
    document.getElementById("timer");

const newGameButton =
    document.getElementById("new-game-button");

const winModal =
    document.getElementById("win-modal");

const modalStats =
    document.getElementById("modal-stats");

const closeModalButton =
    document.getElementById("close-modal");


// --------------------
// GAME SETTINGS
// --------------------

let currentTheme = "origami";
let currentDifficulty = "4x4";

const imageFolder = () =>
    `images/${currentTheme}/`;

const cardBack = (theme = currentTheme) =>
    `images/${theme}/${theme}-00-cardback.png`;

const boardConfigs = {
    "4x4": { cols: 4, rows: 4, className: "board-4x4", previewDuration: 1200 },
    "4x5": { cols: 4, rows: 5, className: "board-4x5", previewDuration: 1800 },
    "4x6": { cols: 4, rows: 6, className: "board-4x6", previewDuration: 2400 },
    "5x6": { cols: 5, rows: 6, className: "board-5x6", previewDuration: 2800 },
};

const themeLabels = {
    origami: "Origami",
    flowers: "Flowers",
    shapes: "Shapes",
};

const sizeLabels = {
    "4x4": "4×4",
    "4x5": "4×5",
    "4x6": "4×6",
    "5x6": "5×6",
};


// --------------------
// BUTTON LABEL STATE
// --------------------

// "start"  = settings changed, board showing preview, awaiting confirmation
// "newgame" = game in progress or just finished, same settings

let buttonMode = "start"; // initial load

function setButtonMode(mode) {
    buttonMode = mode;
    newGameButton.textContent =
        mode === "start" ? "Start Game" : "New Game";
}


// --------------------
// GAME STATE
// --------------------

let firstCard = null;
let secondCard = null;
let lockBoard = false;

let moves = 0;
let matchesFound = 0;
let totalPairs = 0;

let timer = 0;
let timerInterval = null;
let gameStarted = false;
let gameHasBeenStarted = false; // tracks if a game has ever started this session


// --------------------
// TIMER
// --------------------

function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        timer++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function updateTimerDisplay() {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    timerElement.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


// --------------------
// GAME SETUP
// --------------------

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function previewCards() {
    lockBoard = true;

    document.querySelectorAll(".card").forEach(card => {
        card.classList.add("flipped");
    });

    const duration = boardConfigs[currentDifficulty].previewDuration;

    setTimeout(() => {
        document.querySelectorAll(".card").forEach(card => {
            card.classList.remove("flipped");
        });
        setTimeout(() => {
            lockBoard = false;
        }, 500);
    }, duration);
}

// Draws the board with card backs only — no shuffle, no game reset.
// Used when settings change so the user can see a preview before starting.
function drawBoardPreview() {
    stopTimer();
    gameStarted = false;
    timer = 0;
    updateTimerDisplay();
    moves = 0;
    matchesFound = 0;
    moveCounter.textContent = moves;
    firstCard = null;
    secondCard = null;
    lockBoard = true; // board is not playable in preview state

    winModal.classList.add("hidden");
    gameBoard.innerHTML = "";

    const config = boardConfigs[currentDifficulty];
    gameBoard.className = "game-board";
    gameBoard.classList.add(config.className);
    gameBoard.style.gridTemplateColumns = `repeat(${config.cols}, auto)`;

    const totalCards = config.cols * config.rows;

    for (let i = 0; i < totalCards; i++) {
        const card = document.createElement("div");
        card.classList.add("card", "preview-card");
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front"></div>
                <div class="card-back"></div>
            </div>`;
        gameBoard.appendChild(card);
    }

    applyCardBacks(currentTheme);
}

function applyCardBacks(theme) {
    document.querySelectorAll(".card-front").forEach(front => {
        front.style.backgroundImage = `url("${cardBack(theme)}")`;
    });
}

function startGame() {
    stopTimer();
    gameStarted = false;
    gameHasBeenStarted = true;
    timer = 0;
    updateTimerDisplay();
    moves = 0;
    matchesFound = 0;
    moveCounter.textContent = moves;
    firstCard = null;
    secondCard = null;
    lockBoard = false;

    winModal.classList.add("hidden");
    gameBoard.innerHTML = "";

    const allImages = [];
    for (let i = 1; i <= 15; i++) {
        allImages.push(
            `${imageFolder()}${currentTheme}-${String(i).padStart(2, "0")}.png`
        );
    }

    const config = boardConfigs[currentDifficulty];
    gameBoard.className = "game-board";
    gameBoard.classList.add(config.className);
    gameBoard.style.gridTemplateColumns = `repeat(${config.cols}, auto)`;

    const totalCards = config.cols * config.rows;
    totalPairs = totalCards / 2;

    const selectedImages = allImages.slice(0, totalPairs);
    const cardImages = shuffle([...selectedImages, ...selectedImages]);

    cardImages.forEach(imagePath => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.dataset.image = imagePath;
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front"></div>
                <div class="card-back">
                    <img src="${imagePath}" alt="Card">
                </div>
            </div>`;
        card.addEventListener("click", flipCard);
        gameBoard.appendChild(card);
    });

    applyCardBacks(currentTheme);
    previewCards();

    // After startGame, button becomes "New Game"
    setButtonMode("newgame");
}


// --------------------
// GAME LOGIC
// --------------------

function flipCard() {
    if (
        lockBoard ||
        this === firstCard ||
        this.classList.contains("matched") ||
        this.classList.contains("preview-card")
    ) return;

    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    this.classList.add("flipped");

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    moves++;
    moveCounter.textContent = moves;
    checkForMatch();
}

function checkForMatch() {
    const isMatch =
        firstCard.dataset.image === secondCard.dataset.image;

    if (isMatch) {
        firstCard.classList.add("matched");
        secondCard.classList.add("matched");
        matchesFound++;
        resetTurn();
        checkForWin();
    } else {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");
            resetTurn();
        }, 900);
    }
}

function resetTurn() {
    [firstCard, secondCard, lockBoard] = [null, null, false];
}

function checkForWin() {
    if (matchesFound === totalPairs) {
        stopTimer();
        setTimeout(() => {
            modalStats.textContent =
                `You finished in ${moves} moves — ${timerElement.textContent}`;
            winModal.classList.remove("hidden");
            // After win, button stays "New Game"
            setButtonMode("newgame");
        }, 700);
    }
}


// --------------------
// CUSTOM PICKERS
// --------------------

// --- Size Picker ---

const sizeTrigger = document.getElementById("size-trigger");
const sizePanel = document.getElementById("size-panel");
const sizeOptions = document.querySelectorAll(".size-option");
const dotGridPreview = document.getElementById("dot-grid-preview");

sizeTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    sizePanel.classList.toggle("hidden");
    themePanel.classList.add("hidden");
    if (!sizePanel.classList.contains("hidden")) {
        renderDotGrid(currentDifficulty);
    }
});

sizeOptions.forEach(btn => {
    btn.addEventListener("mouseenter", () => {
        renderDotGrid(btn.dataset.size);
    });
    btn.addEventListener("mouseleave", () => {
        renderDotGrid(currentDifficulty);
    });
    btn.addEventListener("click", () => {
        const newSize = btn.dataset.size;
        if (newSize !== currentDifficulty) {
            currentDifficulty = newSize;
            sizeOptions.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            sizeTrigger.textContent = `Grid: ${sizeLabels[newSize]} ▾`;
            drawBoardPreview();
            setButtonMode("start");
        }
        sizePanel.classList.add("hidden");
    });
});

function renderDotGrid(size) {
    const config = boardConfigs[size];
    dotGridPreview.innerHTML = "";
    dotGridPreview.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
    const total = config.cols * config.rows;
    for (let i = 0; i < total; i++) {
        const dot = document.createElement("div");
        dot.classList.add("dot-cell");
        dotGridPreview.appendChild(dot);
    }
}

// --- Theme Picker ---

const themeTrigger = document.getElementById("theme-trigger");
const themePanel = document.getElementById("theme-panel");
const themeSwatches = document.querySelectorAll(".theme-swatch");

themeTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    themePanel.classList.toggle("hidden");
    sizePanel.classList.add("hidden");
});

themeSwatches.forEach(swatch => {
    swatch.addEventListener("mouseenter", () => {
        // Preview card backs on hover
        applyCardBacks(swatch.dataset.theme);
    });
    swatch.addEventListener("mouseleave", () => {
        // Restore current theme's card backs
        applyCardBacks(currentTheme);
    });
    swatch.addEventListener("click", () => {
        const newTheme = swatch.dataset.theme;
        if (newTheme !== currentTheme) {
            currentTheme = newTheme;
            themeSwatches.forEach(s => s.classList.remove("selected"));
            swatch.classList.add("selected");
            themeTrigger.textContent = `Deck: ${themeLabels[newTheme]} ▾`;
            drawBoardPreview();
            setButtonMode("start");
        }
        themePanel.classList.add("hidden");
    });
});

// Close panels when clicking outside
document.addEventListener("click", () => {
    sizePanel.classList.add("hidden");
    themePanel.classList.add("hidden");
});


// --------------------
// EVENTS
// --------------------

newGameButton.addEventListener("click", () => {
    startGame();
});

closeModalButton.addEventListener("click", () => {
    winModal.classList.add("hidden");
});


// --------------------
// START
// --------------------

// Initial load: draw preview board, button says "Start Game"
drawBoardPreview();
setButtonMode("start");
renderDotGrid(currentDifficulty);