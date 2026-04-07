const text = document.getElementById("text");
const character = document.getElementById("character");
const clickSound = document.getElementById("clickSound");
const bgMusic = document.getElementById("bgMusic");
const muteBtn = document.getElementById("muteBtn");

const BASE_VOLUME = 0.4;
const LOOP_END = 16;       // punto donde empieza el fade
const FADE_DURATION = 0.5; // segundos de fade
let isFading = false;

let isMuted = false;
let isTyping = false;
let lookTimeout = null;
let discovered = new Set();

const TOTAL_OBJECTS = 6;

/*  cORTE DEL LOOP */

const dialogues = {
    pc: "This is where I spend most of my time...\nI love learning new things and building ideas from scratch ",

    coffee: "Fun fact: I only drink decaf coffee… but I still can't work without it ",

    poster: "Since I was a kid, Japan has always been a dream of mine. I love its culture, anime and video games :) ",

    snes: "I also like to disconnect by playing games from time to time. I always come back to the classics ",

    window: "I love sunsets… there's something about them that makes everything slow down for a moment ",

    bed: "I'm not a big fan of sleeping too much… it feels like there's always something to do "
};

/* TEXTO */
function typeText(message) {
    if (isTyping) return;

    isTyping = true;
    let i = 0;
    text.innerHTML = "";

    character.classList.add("talking");

    const interval = setInterval(() => {
        text.innerHTML += message.charAt(i) === " " ? "&nbsp;" : message.charAt(i);
        i++;

        if (i >= message.length) {
            clearInterval(interval);
            isTyping = false;
            character.classList.remove("talking");
        }
    }, 25);
}

/* FUNCION PARA QUE MIRE */
function lookAt(direction) {
    const base = "translateX(-50%) scale(4)";
    character.style.transform =
        direction === "right"
            ? `${base} scaleX(1)`
            : `${base} scaleX(-1)`;
}

/* DIRECCIÓN */
function getDirection(element) {
    const rect = element.getBoundingClientRect();
    const charRect = character.getBoundingClientRect();
    return rect.left > charRect.left ? "right" : "left";
}

/* INTERACCIÓN */
function interact(element, dialogue, id) {
    const dir = getDirection(element);

    lookAt(dir);
    typeText(dialogue);

    // sonido (RESPETA MUTE)
    if (!isMuted && clickSound) {
        clickSound.currentTime = 0;
        clickSound.volume = 0.5;
        clickSound.play().catch(() => { });
    }

    // rogreso
    discovered.add(id);

    if (discovered.size === TOTAL_OBJECTS) {
        setTimeout(() => {
            typeText("You've discovered everything! Thanks for playing.");
        }, 2000);
    }

    // reset mirada
    if (lookTimeout) clearTimeout(lookTimeout);

    lookTimeout = setTimeout(() => {
        lookAt("right");
    }, 2000);
}

function fadeLoop() {
    if (!bgMusic || isFading) return;

    isFading = true;

    const fadeSteps = 20;
    const stepTime = (FADE_DURATION * 1000) / fadeSteps;

    let currentStep = 0;

    const fadeOut = setInterval(() => {
        if (currentStep >= fadeSteps) {
            clearInterval(fadeOut);

            // reiniciar canción
            bgMusic.currentTime = 0;

            // resetear volumen a 0 antes de subir
            bgMusic.volume = 0;

            // fade in 
            let fadeInStep = 0;
            const volumeStep = BASE_VOLUME / fadeSteps;

            const fadeIn = setInterval(() => {
                if (fadeInStep >= fadeSteps) {
                    clearInterval(fadeIn);
                    bgMusic.volume = BASE_VOLUME;
                    isFading = false;
                    return;
                }

                bgMusic.volume += volumeStep;
                fadeInStep++;
            }, stepTime);

            return;
        }

        // bajamos hacia 0 
        bgMusic.volume = Math.max(
            0,
            bgMusic.volume - (BASE_VOLUME / fadeSteps)
        );

        currentStep++;
    }, stepTime);
}

/* EVENTOS */
["pc", "coffee", "poster", "snes", "window", "bed"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener("click", (e) => {
            interact(e.target, dialogues[id], id);
        });
    }
});

/* ANIMACIÓN IDLE */
const frames = [
    "assets/idle_1.png",
    "assets/idle_2.png",
    "assets/idle_3.png",
    "assets/idle_4.png"
];

let frameIndex = 0;

setInterval(() => {
    character.src = frames[frameIndex];
    frameIndex = (frameIndex + 1) % frames.length;
}, 200);

/* INICIAR MÚSICA */
document.addEventListener("click", () => {
    if (bgMusic && bgMusic.paused) {
        bgMusic.volume = 0.4; // 🔥 mejor nivel
        bgMusic.play().catch(() => { });
    }
}, { once: true });

/* LOOP  */
if (bgMusic) {
    bgMusic.addEventListener("timeupdate", () => {
        if (bgMusic.currentTime >= LOOP_END && !isFading) {
            fadeLoop();
        }
    });
}

/* MUTE */
if (muteBtn) {
    muteBtn.addEventListener("click", () => {
        isMuted = !isMuted;

        if (bgMusic) bgMusic.muted = isMuted;

        muteBtn.textContent = isMuted ? "🔇" : "🔊";
    });
}