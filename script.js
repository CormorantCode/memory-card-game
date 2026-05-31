const gameBoard =
    document.getElementById(
        "game-board"
    );

const moveCounter =
    document.getElementById(
        "move-counter"
    );

const timerElement =
    document.getElementById(
        "timer"
    );

const restartButton =
    document.getElementById(
        "restart-button"
    );

const difficultyButtons =
    document.querySelectorAll(
        ".difficulty-button"
    );

const winMessage =
    document.getElementById(
        "win-message"
    );

const winModal =
    document.getElementById(
        "win-modal"
    );

const modalStats =
    document.getElementById(
        "modal-stats"
    );

const closeModalButton =
    document.getElementById(
        "close-modal"
    );


// --------------------
// GAME SETTINGS
// --------------------

let currentTheme = "origami";

const imageFolder = () =>
    `images/${currentTheme}/`;

const cardBack = () =>
    `${imageFolder()}${currentTheme}-00-cardback.png`;

const boardConfigs = {
    "3x4": { cols: 3, rows: 4, className: "board-3x4", previewDuration: 2500 },
    "4x4": { cols: 4, rows: 4, className: "board-4x4", previewDuration: 3000 },
    "4x5": { cols: 4, rows: 5, className: "board-4x5", previewDuration: 3500 },
    "4x6": { cols: 4, rows: 6, className: "board-4x6", previewDuration: 4000 },
};

// --------------------
// GAME STATE
// --------------------

let currentDifficulty =
    "3x4";

let firstCard = null;
let secondCard = null;
let lockBoard = false;

let moves = 0;
let matchesFound = 0;
let totalPairs = 0;

let timer = 0;
let timerInterval = null;
let gameStarted = false;


// --------------------
// TIMER
// --------------------

function startTimer() {

    if (timerInterval) return;

    timerInterval =
        setInterval(() => {

            timer++;

            updateTimerDisplay();

        }, 1000);
}

function stopTimer() {

    clearInterval(
        timerInterval
    );

    timerInterval = null;
}

function updateTimerDisplay() {

    const minutes =
        Math.floor(timer / 60);

    const seconds =
        timer % 60;

    timerElement.textContent =
        `${String(minutes)
            .padStart(2, "0")}:${String(seconds)
            .padStart(2, "0")}`;
}


// --------------------
// GAME SETUP
// --------------------

function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];
    }

    return array;
}

function previewCards() {
    lockBoard = true;

    // Flip all cards face-up
    document.querySelectorAll(".card").forEach(card => {
        card.classList.add("flipped");
    });

    const duration = boardConfigs[currentDifficulty].previewDuration;

    setTimeout(() => {
        // Flip them all back
        document.querySelectorAll(".card").forEach(card => {
            card.classList.remove("flipped");
        });

        // Short delay after flip-back animation before unlocking
        setTimeout(() => {
            lockBoard = false;
        }, 500);
    }, duration);
}

function startGame() {

    stopTimer();

    gameStarted = false;
    timer = 0;

    updateTimerDisplay();

    moves = 0;
    matchesFound = 0;

    moveCounter.textContent =
        moves;

    firstCard = null;
    secondCard = null;

    winModal.classList.add(
        "hidden"
    );

    gameBoard.innerHTML = "";

    const allImages = [];
        for (let i = 1; i <= 15; i++) {
            allImages.push(
                `${imageFolder()}${currentTheme}-${String(i).padStart(2, "0")}.png`
            );
        }

    gameBoard.className =
        "game-board";

    const config =
        boardConfigs[
            currentDifficulty
        ];

    gameBoard.classList.add(
        config.className
    );

    gameBoard.style.gridTemplateColumns =
        `repeat(${config.cols}, auto)`;

    const totalCards =
        config.cols *
        config.rows;

    totalPairs =
        totalCards / 2;

    const selectedImages =
        allImages.slice(
            0,
            totalPairs
        );

    const cardImages =
        shuffle([
            ...selectedImages,
            ...selectedImages
        ]);

    cardImages.forEach(
        imagePath => {

            const card =
                document.createElement(
                    "div"
                );

            card.classList.add(
                "card"
            );

            card.dataset.image =
                imagePath;

            card.innerHTML =
                `
                <div class="card-inner">

                    <div class="card-front">
                    </div>

                    <div class="card-back">
                        <img
                            src="${imagePath}"
                            alt="Card">
                    </div>

                </div>
                `;

            card.addEventListener(
                "click",
                flipCard
            );

            gameBoard.appendChild(
                card
            );
        }
    );

    // Apply current theme to card backs
    document.querySelectorAll(
        ".card-front"
    ).forEach(front => {
        front.style.backgroundImage =
            `url("${cardBack()}")`;
    });

    previewCards();
}


// --------------------
// GAME LOGIC
// --------------------

function flipCard() {

    if (
        lockBoard ||
        this === firstCard ||
        this.classList.contains(
            "matched"
        )
    ) {
        return;
    }

    if (!gameStarted) {

        gameStarted = true;
        startTimer();
    }

    this.classList.add(
        "flipped"
    );

    if (!firstCard) {

        firstCard = this;
        return;
    }

    secondCard = this;

    moves++;

    moveCounter.textContent =
        moves;

    checkForMatch();
}

function checkForMatch() {

    const isMatch =
        firstCard.dataset.image ===
        secondCard.dataset.image;

    if (isMatch) {

        firstCard.classList.add(
            "matched"
        );

        secondCard.classList.add(
            "matched"
        );

        matchesFound++;

        resetTurn();

        checkForWin();

    } else {

        lockBoard = true;

        setTimeout(() => {

            firstCard.classList.remove(
                "flipped"
            );

            secondCard.classList.remove(
                "flipped"
            );

            resetTurn();

        }, 900);
    }
}

function resetTurn() {

    [
        firstCard,
        secondCard,
        lockBoard
    ] = [
        null,
        null,
        false
    ];
}

function checkForWin() {

    if (
        matchesFound ===
        totalPairs
    ) {

        stopTimer();

        setTimeout(() => {

            modalStats.textContent =
                `You finished in ${moves} moves — ${timerElement.textContent}`;

            winModal.classList.remove(
                "hidden"
            );

        }, 700);
    }
}


// --------------------
// EVENTS
// --------------------

restartButton
    .addEventListener(
        "click",
        startGame
    );

difficultyButtons
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentDifficulty =
                    button.dataset
                        .size;

                startGame();
            }
        );
    });

closeModalButton
    .addEventListener(
        "click",
        () => {

            winModal.classList.add(
                "hidden"
            );
        }
    );

const themeSelect =
    document.getElementById(
        "theme-select"
    );

themeSelect.addEventListener(
    "change",
    () => {
        currentTheme =
            themeSelect.value;

        // Swap card fronts
        document.querySelectorAll(
            ".card"
        ).forEach(card => {
            const index =
                card.dataset.image
                    .match(/\d+(?=\.png)/)[0];

            const newImage =
                `${imageFolder()}${currentTheme}-${index}.png`;

            card.dataset.image =
                newImage;

            card.querySelector(
                ".card-back img"
            ).src = newImage;
        });

        // Swap card backs
        document.querySelectorAll(
            ".card-front"
        ).forEach(front => {
            front.style.backgroundImage =
                `url("${cardBack()}")`;
        });
    }
);

// --------------------
// START GAME
// --------------------

startGame();