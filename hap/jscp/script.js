// ================= НАСТРОЙКИ (РЕДАКТИРУЙ ЗДЕСЬ) =================
const CONFIG = {
    matrixText: "HAPPYBIRTHDAY",
    matrixColor1: "#ff69b4",
    matrixColor2: "#00ffff",
    matrixFontSize: 40,

    sequence: "3|2|1|С ДНЁМ|РОЖДЕНИЯ|АНИТА|❤|#gift|",
    sequenceColor: "#ff69b4", 

    pages: [
        { image: "image/cover.jpg", content: "" }, 
        { image: "image/photo1.jpg", content: "С Днем Рождения! 🎉" }, 
        { image: "image/photo2.jpg", content: "" }, 
        { image: "image/photo3.jpg", content: "Ты самая лучшая! ❤️" }, 
        { image: "image/photo4.jpg", content: "" }, 
        { image: "image/cover.jpg", content: "Будь счастлива! ✨" } 
    ]
};

// ================= ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =================
const matrixCanvas = document.getElementById('matrix-rain');
const matrixCtx = matrixCanvas ? matrixCanvas.getContext('2d') : null;
const mainCanvas = document.querySelector('.canvas');
const book = document.getElementById('book');
const contentDisplay = document.getElementById('contentDisplay');
const contentText = document.getElementById('contentText');
let currentPage = 0;
let isFlipping = false;
let matrixInterval;
let typeWriterInterval;

// ================= ДВИЖОК ЧАСТИЦ =================
var S = {
    init: function () {
        S.Drawing.init('.canvas');
        if (mainCanvas) mainCanvas.style.zIndex = "2"; 
        if (matrixCanvas) matrixCanvas.style.zIndex = "1"; 
        document.body.classList.add('body--ready');
        S.UI.simulate(CONFIG.sequence);
        S.Drawing.loop(function () { S.Shape.render(); });
    }
};

S.Drawing = (function () {
    var canvas, context, renderFn;
    var requestFrame = window.requestAnimationFrame || function (callback) { window.setTimeout(callback, 1000 / 60); };
    return {
        init: function (el) {
            canvas = document.querySelector(el);
            context = canvas.getContext('2d');
            this.adjustCanvas();
            window.addEventListener('resize', () => this.adjustCanvas());
        },
        adjustCanvas: function () { canvas.width = window.innerWidth; canvas.height = window.innerHeight; },
        clearFrame: function () { context.clearRect(0, 0, canvas.width, canvas.height); },
        getArea: function () { return { w: canvas.width, h: canvas.height }; },
        drawCircle: function (p, c) {
            context.fillStyle = c.render();
            context.beginPath();
            context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
            context.fill();
        },
        loop: function (fn) {
            if (typeof fn === 'function') renderFn = fn;
            this.clearFrame();
            if (renderFn) renderFn();
            requestFrame.call(window, () => this.loop());
        }
    };
}());

S.Point = function (args) { this.x = args.x; this.y = args.y; this.z = args.z; this.a = args.a; this.h = args.h; };
S.Color = function (r, g, b, a) { this.r = r; this.g = g; this.b = b; this.a = a; };
S.Color.prototype.render = function () { return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')'; };

S.Dot = function (x, y) {
    this.p = new S.Point({ x: x, y: y, z: 5, a: 1, h: 0 });
    this.e = 0.07; this.s = true;
    const rgb = hexToRgb(CONFIG.sequenceColor);
    this.c = new S.Color(rgb.r, rgb.g, rgb.b, this.p.a);
    this.t = new S.Point({ x: x, y: y, z: 5, a: 1, h: 0 });
    this.q = [];
};

S.Dot.prototype = {
    render: function () { this._update(); this._draw(); },
    _draw: function () { this.c.a = this.p.a; S.Drawing.drawCircle(this.p, this.c); },
    _moveTowards: function (n) {
        var dx = this.p.x - n.x, dy = this.p.y - n.y, d = Math.sqrt(dx * dx + dy * dy), e = this.e * d;
        if (this.p.h === -1) { this.p.x = n.x; this.p.y = n.y; return true; }
        if (d > 1) { this.p.x -= (dx / d) * e; this.p.y -= (dy / d) * e; }
        else { if (this.p.h > 0) this.p.h--; else return true; }
        return false;
    },
    _update: function () {
        if (this._moveTowards(this.t)) {
            var p = this.q.shift();
            if (p) { this.t.x = p.x || this.p.x; this.t.y = p.y || this.p.y; this.t.z = p.z || this.p.z; this.t.a = p.a || this.p.a; this.p.h = p.h || 0; }
            else if (this.s) { this.p.x -= Math.sin(Math.random() * 3.142); this.p.y -= Math.sin(Math.random() * 3.142); }
        }
        this.p.a = Math.max(0.1, this.p.a - (this.p.a - this.t.a) * 0.05);
        this.p.z = Math.max(1, this.p.z - (this.p.z - this.t.z) * 0.05);
    }
};

S.ShapeBuilder = (function () {
    var shapeCanvas = document.createElement('canvas'),
        shapeContext = shapeCanvas.getContext('2d', { willReadFrequently: true });
    function fit() { shapeCanvas.width = Math.floor(window.innerWidth / 10) * 10; shapeCanvas.height = Math.floor(window.innerHeight / 10) * 10; shapeContext.textAlign = 'center'; shapeContext.textBaseline = 'middle'; }
    fit(); window.addEventListener('resize', fit);
    return {
        letter: function (l) {
            var fontSize = 500;
            shapeContext.font = 'bold ' + fontSize + 'px Arial';
            var s = Math.min(fontSize, (shapeCanvas.width / shapeContext.measureText(l).width) * 0.8 * fontSize, (shapeCanvas.height / fontSize) * 0.8 * fontSize);
            shapeContext.font = 'bold ' + s + 'px Arial';
            shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
            shapeContext.fillText(l, shapeCanvas.width / 2, shapeCanvas.height / 2);
            var pixels = shapeContext.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height).data, dots = [], x = 0, y = 0;
            for (var p = 0; p < pixels.length; p += (4 * 10)) { if (pixels[p + 3] > 0) dots.push(new S.Point({ x: x, y: y })); x += 10; if (x >= shapeCanvas.width) { x = 0; y += 10; p += 10 * 4 * shapeCanvas.width; } }
            return { dots: dots, w: shapeCanvas.width, h: shapeCanvas.height };
        }
    };
}());

S.Shape = (function () {
    var dots = [], width = 0, height = 0, cx = 0, cy = 0;
    function compensate() { var a = S.Drawing.getArea(); cx = a.w / 2 - width / 2; cy = a.h / 2 - height / 2; }
    return {
        switchShape: function (n) {
            var a = S.Drawing.getArea(); width = n.w; height = n.h; compensate();
            if (n.dots.length > dots.length) { var size = n.dots.length - dots.length; for (var d = 1; d <= size; d++) dots.push(new S.Dot(a.w / 2, a.h / 2)); }
            var d = 0;
            while (n.dots.length > 0) { var i = Math.floor(Math.random() * n.dots.length); dots[d].e = 0.11; dots[d].s = true; dots[d].t.x = n.dots[i].x + cx; dots[d].t.y = n.dots[i].y + cy; dots[d].t.a = 1; dots[d].t.z = 4; dots[d].p.h = 0; n.dots = n.dots.slice(0, i).concat(n.dots.slice(i + 1)); d++; }
            for (var i = d; i < dots.length; i++) { if (dots[i].s) { dots[i].s = false; dots[i].t.a = 0; dots[i].t.z = 1; } }
        },
        render: function () { for (var d = 0; d < dots.length; d++) dots[d].render(); }
    };
}());

S.UI = (function () {
    var sequence = [];
    function timedAction() {
        if (sequence.length === 0) return;
        var current = sequence.shift();
        if (current === "#gift") { S.Shape.switchShape(S.ShapeBuilder.letter("")); setTimeout(showGiftAndBook, 1000); }
        else { S.Shape.switchShape(S.ShapeBuilder.letter(current)); setTimeout(timedAction, 2500); }
    }
    return { simulate: function (action) { sequence = action.split('|').filter(s => s.length > 0); timedAction(); } };
}());

// ================= ЛОГИКА МАТРИЦЫ И КНИГИ =================

document.addEventListener('DOMContentLoaded', () => {
    initMatrixRain();
    createPages();
    S.init(); 
    document.body.addEventListener('click', () => {
        const audio = document.getElementById('birthdayAudio');
        if (audio && audio.paused) { audio.play(); document.getElementById('musicControl')?.classList.add('playing'); }
    }, { once: true });
});

function initMatrixRain() {
    if (!matrixCanvas || !matrixCtx) return;
    matrixCanvas.width = window.innerWidth; matrixCanvas.height = window.innerHeight;
    const fontSize = CONFIG.matrixFontSize;
    const columns = Math.floor(matrixCanvas.width / fontSize);
    const drops = Array(columns).fill(1);
    matrixInterval = setInterval(() => {
        matrixCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixCtx.font = "bold " + fontSize + "px monospace";
        for (let i = 0; i < drops.length; i++) {
            const text = CONFIG.matrixText[Math.floor(Math.random() * CONFIG.matrixText.length)];
            matrixCtx.fillStyle = (i % 2 === 0) ? CONFIG.matrixColor1 : CONFIG.matrixColor2;
            matrixCtx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }, 50);
}

function showGiftAndBook() {
    if (matrixInterval) clearInterval(matrixInterval);
    if (matrixCanvas) matrixCanvas.style.display = 'none';
    if (mainCanvas) mainCanvas.style.display = 'none';
    const bookCont = document.querySelector('.book-container');
    const bookEl = document.getElementById('book');
    if (bookCont && bookEl) {
        bookCont.style.display = 'block';
        bookEl.style.display = 'block';
        setTimeout(() => { bookCont.classList.add('show'); startCelebration(); showSpreadText(0); }, 100);
    }
}

function createPages() {
    if(!book) return;
    book.innerHTML = '';
    const totalSheets = Math.ceil(CONFIG.pages.length / 2);
    for (let i = 0; i < totalSheets; i++) {
        const page = document.createElement('div');
        page.classList.add('page');
        page.style.zIndex = totalSheets - i;
        const frontIdx = i * 2, backIdx = i * 2 + 1;
        const front = document.createElement('div'); front.classList.add('page-front');
        if (CONFIG.pages[frontIdx]) { const img = document.createElement('img'); img.src = CONFIG.pages[frontIdx].image; front.appendChild(img); }
        const back = document.createElement('div'); back.classList.add('page-back');
        if (CONFIG.pages[backIdx]) { const img = document.createElement('img'); img.src = CONFIG.pages[backIdx].image; back.appendChild(img); }
        page.appendChild(front); page.appendChild(back); book.appendChild(page);
        
        page.addEventListener('click', () => {
            if (isFlipping) return;
            if (currentPage === i) { 
                isFlipping = true; 
                page.classList.add('flipped'); 
                setTimeout(() => { page.style.zIndex = i; isFlipping = false; }, 800); 
                currentPage++; 
                showSpreadText(currentPage);
                // Проверка: если это был последний лист
                if (currentPage === totalSheets) {
                    setTimeout(finalPhotoHeartEffect, 1500);
                }
            }
            else if (currentPage === i + 1) { 
                isFlipping = true; 
                page.classList.remove('flipped'); 
                setTimeout(() => { page.style.zIndex = totalSheets - i; isFlipping = false; }, 800); 
                currentPage--; 
                showSpreadText(currentPage);
            }
        });
    }
}

function showSpreadText(sheetIndex) {
    clearInterval(typeWriterInterval);
    let fullText = "";
    if (sheetIndex === 0) { fullText = CONFIG.pages[0]?.content || ""; } 
    else {
        const leftPageIdx = sheetIndex * 2 - 1;
        const rightPageIdx = sheetIndex * 2;
        const leftText = CONFIG.pages[leftPageIdx]?.content || "";
        const rightText = CONFIG.pages[rightPageIdx]?.content || "";
        fullText = leftText + (leftText && rightText ? "\n" : "") + rightText;
    }

    if (fullText.trim() !== "") {
        contentDisplay.classList.add('show');
        contentText.innerText = "";
        let charIndex = 0;
        typeWriterInterval = setInterval(() => {
            if (charIndex < fullText.length) { contentText.innerText += fullText.charAt(charIndex); charIndex++; }
            else { clearInterval(typeWriterInterval); }
        }, 40);
    } else { contentDisplay.classList.remove('show'); }
}

function startCelebration() { for(let i=0; i<15; i++) setTimeout(spawnHeart, i * 400); }

function spawnHeart() {
    const heart = document.createElement('div');
    heart.className = 'heart'; heart.innerHTML = '❤️';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.bottom = "0px";
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 4000);
}

// ЭФФЕКТ СЕРДЦА ИЗ ФОТО
function finalPhotoHeartEffect() {
    // Прячем книгу и текст
    document.querySelector('.book-container').classList.remove('show');
    contentDisplay.classList.remove('show');
    
    setTimeout(() => {
        document.querySelector('.book-container').style.display = 'none';
        
        // Берем все картинки из конфига (кроме пустых)
        const photoUrls = CONFIG.pages.map(p => p.image).filter(img => img !== "");
        const totalPhotos = 20; // Сколько карточек будет в сердце
        
        for (let i = 0; i < totalPhotos; i++) {
            setTimeout(() => {
                const imgUrl = photoUrls[i % photoUrls.length];
                createHeartPhoto(i, totalPhotos, imgUrl);
            }, i * 150);
        }
        
        // Запускаем фейерверки в фоне
        setInterval(spawnFirework, 2000);
    }, 1000);
}

function createHeartPhoto(idx, total, url) {
    const photo = document.createElement('img');
    photo.src = url;
    photo.className = 'photo';
    document.body.appendChild(photo);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Математическая формула сердца
    const t = (idx / total) * 2 * Math.PI;
    const scale = Math.min(window.innerWidth, window.innerHeight) / 35; // Масштаб сердца
    
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

    // Начальная позиция (центр)
    photo.style.left = centerX + 'px';
    photo.style.top = centerY + 'px';

    // Анимация разлета
    requestAnimationFrame(() => {
        setTimeout(() => {
            photo.style.opacity = '1';
            photo.style.transform = `translate(-50%, -50%) scale(1) rotate(${Math.random() * 10 - 5}deg)`;
            photo.style.left = (centerX + x * scale) + 'px';
            photo.style.top = (centerY + y * scale) + 'px';
        }, 50);
    });
}

function spawnFirework() {
    const container = document.createElement('div');
    container.className = 'firework-container';
    container.style.left = Math.random() * 80 + 10 + 'vw';
    container.style.top = Math.random() * 50 + 10 + 'vh';
    for(let i=0; i<10; i++) {
        const fw = document.createElement('div');
        fw.className = 'firework';
        fw.style.transform = `rotate(${i * 36}deg)`;
        container.appendChild(fw);
    }
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 1000);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 255, g: 105, b: 180 };
}

const musicBtn = document.getElementById('musicControl');
const audio = document.getElementById('birthdayAudio');
if(musicBtn && audio) {
    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) { audio.play(); musicBtn.innerHTML = "⏸"; }
        else { audio.pause(); musicBtn.innerHTML = "▶"; }
    });
}

// --- ЛОГИКА ПРОВЕРКИ ОРИЕНТАЦИИ ---
function checkOrientation() {
    const lockScreen = document.getElementById('orientation-lock');
    // Если ширина меньше высоты (портретный режим)
    if (window.innerHeight > window.innerWidth) {
        lockScreen.style.display = 'flex';
    } else {
        lockScreen.style.display = 'none';
        // Принудительно обновляем размеры канвасов при повороте
        if (typeof initMatrixRain === 'function') initMatrixRain();
    }
}

// Следим за поворотом и изменением размера
window.addEventListener('resize', checkOrientation);
window.addEventListener('load', checkOrientation);

// --- КОРРЕКЦИЯ РАЗМЕРА СЕРДЦА (внутри функции createHeartPhoto) ---
// Найди в своей функции createHeartPhoto строку с переменной scale и замени её на эту:
function createHeartPhoto(idx, total, url) {
    const photo = document.createElement('img');
    photo.src = url;
    photo.className = 'photo';
    document.body.appendChild(photo);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const t = (idx / total) * 2 * Math.PI;
    
    // Адаптивный масштаб сердца
    let scaleBase = Math.min(window.innerWidth, window.innerHeight) / 30;
    if (window.innerHeight < 500) scaleBase = window.innerHeight / 25; // Для телефонов

    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

    photo.style.left = centerX + 'px';
    photo.style.top = centerY + 'px';

    requestAnimationFrame(() => {
        setTimeout(() => {
            photo.style.opacity = '1';
            photo.style.transform = `translate(-50%, -50%) scale(1) rotate(${Math.random() * 10 - 5}deg)`;
            photo.style.left = (centerX + x * scaleBase) + 'px';
            photo.style.top = (centerY + y * scaleBase) + 'px';
        }, 50);
    });
}