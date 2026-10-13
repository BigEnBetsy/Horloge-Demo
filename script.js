/**
 * Scroll-linked image sequence on a canvas.
 * Frames live in images/frame_001.webp ... frame_070.webp
 */

const canvas = document.getElementById('watchCanvas');
const ctx = canvas.getContext('2d');
const scrollContainer = document.getElementById('scrollContainer');
const chapters = [...document.querySelectorAll('.chapter')];
const navbar = document.getElementById('navbar');
const scrollHint = document.getElementById('scrollHint');
const progressFill = document.getElementById('progressFill');
const progressNow = document.getElementById('progressNow');
const preloader = document.getElementById('preloader');
const preloaderBar = document.getElementById('preloaderBar');
const preloaderCount = document.getElementById('preloaderCount');

// Configuration
const totalFrames = 70;
const imageFolder = 'images/';
const imagePrefix = 'frame_';
const imageExtension = '.webp';
const lerpFactor = 0.1; // 0.05 = floaty, 0.2 = snappy

// State
const images = new Array(totalFrames);
let currentFrame = 0;
let targetFrame = 0;
let lastDrawn = -1;
let isLoaded = false;

function framePath(i) {
    return `${imageFolder}${imagePrefix}${String(i).padStart(3, '0')}${imageExtension}`;
}

function preloadImages() {
    let done = 0;
    const finish = () => {
        done++;
        const pct = Math.round((done / totalFrames) * 100);
        preloaderBar.style.width = pct + '%';
        preloaderCount.textContent = pct + '%';
        if (done === totalFrames) start();
    };
    for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        img.onload = () => { images[i - 1] = img; finish(); };
        img.onerror = () => { console.warn('Missing frame:', img.src); finish(); };
        img.src = framePath(i);
    }
}

function start() {
    isLoaded = true;
    // Use the nearest loaded frame if any are missing
    for (let i = 0; i < totalFrames; i++) {
        if (!images[i]) images[i] = images[i - 1] || images.find(Boolean);
    }
    resizeCanvas();
    onScroll();
    currentFrame = targetFrame;
    requestAnimationFrame(render);
    setTimeout(() => {
        preloader.classList.add('done');
        document.body.classList.remove('is-loading');
    }, 350);
}

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    lastDrawn = -1;
}

function drawFrame(index) {
    const img = images[index];
    if (!img) return;

    ctx.fillStyle = '#0c0d0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    let w, h;

    // Landscape screens: fill (cover). Portrait screens: fit the width so the watch isn't cropped.
    if (canvasAspect >= imgAspect) {
        w = canvas.width; h = w / imgAspect;
    } else {
        w = canvas.width * 1.15; h = w / imgAspect; // slight zoom keeps the watch large on phones
    }
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}

function getProgress() {
    const rect = scrollContainer.getBoundingClientRect();
    const range = scrollContainer.offsetHeight - window.innerHeight;
    return Math.max(0, Math.min(1, -rect.top / range));
}

function onScroll() {
    const p = getProgress();
    targetFrame = p * (totalFrames - 1);

    // Chapters
    chapters.forEach((el) => {
        const s = parseFloat(el.dataset.start);
        const e = parseFloat(el.dataset.end);
        el.classList.toggle('is-active', p >= s && p <= e);
    });

    scrollHint.style.opacity = p < 0.03 ? 1 : 0;
    progressFill.style.transform = `scaleX(${p})`;
    navbar.classList.toggle('scrolled', window.scrollY > 40);
}

function render() {
    currentFrame += (targetFrame - currentFrame) * lerpFactor;
    if (Math.abs(targetFrame - currentFrame) < 0.01) currentFrame = targetFrame;

    const idx = Math.max(0, Math.min(totalFrames - 1, Math.round(currentFrame)));
    if (idx !== lastDrawn) {
        drawFrame(idx);
        lastDrawn = idx;
        progressNow.textContent = String(idx + 1).padStart(2, '0');
    }
    requestAnimationFrame(render);
}

window.addEventListener('resize', () => { resizeCanvas(); onScroll(); });
window.addEventListener('scroll', onScroll, { passive: true });

preloadImages();
onScroll();
