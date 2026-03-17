const CONFIG = {
    matrixText: "HAPPYBIRTHDAY",
    matrixColor1: "#ff69b4",
    matrixColor2: "#00ffff",
    matrixFontSize: 30,
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

const matrixCanvas = document.getElementById('matrix-rain');
const matrixCtx = matrixCanvas ? matrixCanvas.getContext('2d') : null;
const book = document.getElementById('book');
const contentDisplay = document.getElementById('contentDisplay');
const contentText = document.getElementById('contentText');
let currentPage = 0, isFlipping = false, matrixInterval, typeWriterInterval;

// --- ДВИЖОК ЧАСТИЦ ---
var S = {
    init: function () {
        S.Drawing.init('.canvas');
        document.body.classList.add('body--ready');
        S.UI.simulate(CONFIG.sequence);
        S.Drawing.loop(function () { S.Shape.render(); });
    }
};

S.Drawing = (function () {
    var canvas, context, renderFn;
    var requestFrame = window.requestAnimationFrame || function (callback) { window.setTimeout(callback, 1000 / 60); };
    return {
        init: function (el) { canvas = document.querySelector(el); context = canvas.getContext('2d'); this.adjustCanvas(); window.addEventListener('resize', () => this.adjustCanvas()); },
        adjustCanvas: function () { canvas.width = window.innerWidth; canvas.height = window.innerHeight; },
        clearFrame: function () { context.clearRect(0, 0, canvas.width, canvas.height); },
        getArea: function () { return { w: canvas.width, h: canvas.height }; },
        drawCircle: function (p, c) { 
            context.fillStyle = c.render(); 
            context.beginPath(); 
            // Добавляем эффект легкого свечения
            context.shadowBlur = 4;
            context.shadowColor = c.render();
            context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true); 
            context.fill(); 
            context.shadowBlur = 0; },
        loop: function (fn) { if (typeof fn === 'function') renderFn = fn; this.clearFrame(); if (renderFn) renderFn(); requestFrame.call(window, () => this.loop()); }
    };
}());

S.Point = function (args) { this.x = args.x; this.y = args.y; this.z = args.z; this.a = args.a; this.h = args.h; };
S.Color = function (r, g, b, a) { this.r = r; this.g = g; this.b = b; this.a = a; };
S.Color.prototype.render = function () { return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')'; };

S.Dot = function (x, y) {
    // Измени z здесь (это начальный размер)
    this.p = new S.Point({ x: x, y: y, z: 5, a: 1, h: 0 }); 
    
    const rgb = hexToRgb(CONFIG.sequenceColor);
    this.c = new S.Color(rgb.r, rgb.g, rgb.b, 1);
    
    // И измени z здесь (это размер, к которому точка стремится)
    this.t = new S.Point({ x: x, y: y, z: 5, a: 1, h: 0 }); 
    
    this.q = []; this.e = 0.11; this.s = true;
};

S.Dot.prototype = {
    render: function () { this._update(); this._draw(); },
    _draw: function () { this.c.a = this.p.a; S.Drawing.drawCircle(this.p, this.c); },
    _moveTowards: function (n) {
        var dx = this.p.x - n.x, dy = this.p.y - n.y, d = Math.sqrt(dx * dx + dy * dy), e = this.e * d;
        if (d > 1) { this.p.x -= (dx / d) * e; this.p.y -= (dy / d) * e; return false; }
        return true;
    },
    _update: function () {
        if (this._moveTowards(this.t)) { if (this.s) { this.p.x -= Math.sin(Math.random() * 3.142); this.p.y -= Math.sin(Math.random() * 3.142); } }
        this.p.a = Math.max(0.1, this.p.a - (this.p.a - this.t.a) * 0.05);
        this.p.z = Math.max(1, this.p.z - (this.p.z - this.t.z) * 0.05);
    }
};

S.ShapeBuilder = (function () {
    var shapeCanvas = document.createElement('canvas'),
        shapeContext = shapeCanvas.getContext('2d', { willReadFrequently: true });

    return {
        letter: function (l) {
            // Шаг сетки (чем больше число, тем реже точки)
            var gap = 10; 
            var width = Math.floor(window.innerWidth / gap) * gap;
            var height = Math.floor(window.innerHeight / gap) * gap;

            shapeCanvas.width = width;
            shapeCanvas.height = height;

            var fontSize = 500;
            shapeContext.font = 'bold ' + fontSize + 'px Arial';
            var s = Math.min(fontSize, (width / shapeContext.measureText(l).width) * 0.8 * fontSize, (height / fontSize) * 0.8 * fontSize);
            shapeContext.font = 'bold ' + s + 'px Arial';
            shapeContext.textAlign = 'center';
            shapeContext.textBaseline = 'middle';
            
            shapeContext.clearRect(0, 0, width, height);
            shapeContext.fillText(l, width / 2, height / 2);

            var pixels = shapeContext.getImageData(0, 0, width, height).data;
            var dots = [];

            // ДВОЙНОЙ ЦИКЛ для создания сетки точек
            for (var y = 0; y < height; y += gap) {
                for (var x = 0; x < width; x += gap) {
                    var index = (x + y * width) * 4;
                    if (pixels[index + 3] > 0) {
                        dots.push(new S.Point({ x: x, y: y }));
                    }
                }
            }
            return { dots: dots };
        }
    };
}());

S.Shape = (function () {
    var dots = [], width = 0, height = 0;
    return {
        switchShape: function (n) {
            var a = S.Drawing.getArea();
            if (n.dots.length > dots.length) { for (var d = dots.length; d < n.dots.length; d++) dots.push(new S.Dot(a.w / 2, a.h / 2)); }
            for (var d = 0; d < n.dots.length; d++) { dots[d].s = true; dots[d].t.x = n.dots[d].x; dots[d].t.y = n.dots[d].y; dots[d].t.a = 1; }
            for (var d = n.dots.length; d < dots.length; d++) { dots[d].s = false; dots[d].t.a = 0; }
        },
        render: function () { for (var d = 0; d < dots.length; d++) dots[d].render(); }
    };
}());

S.UI = (function () {
    var sequence = [];
    function timedAction() {
        if (sequence.length === 0) return;
        var current = sequence.shift();
        if (current === "#gift") { S.Shape.switchShape({ dots: [] }); setTimeout(showGiftAndBook, 1000); }
        else { S.Shape.switchShape(S.ShapeBuilder.letter(current)); setTimeout(timedAction, 2500); }
    }
    return { simulate: function (action) { sequence = action.split('|').filter(s => s.length > 0); timedAction(); } };
}());

// --- МАТРИЦА, КНИГА, СЕРДЦЕ ---
function initMatrixRain() {
    if (!matrixCanvas) return;
    matrixCanvas.width = window.innerWidth; matrixCanvas.height = window.innerHeight;
    const fontSize = CONFIG.matrixFontSize; const columns = Math.floor(matrixCanvas.width / fontSize); const drops = Array(columns).fill(1);
    if (matrixInterval) clearInterval(matrixInterval);
    matrixInterval = setInterval(() => {
        matrixCtx.fillStyle = "rgba(0, 0, 0, 0.05)"; matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixCtx.font = fontSize + "px monospace";
        for (let i = 0; i < drops.length; i++) {
            const text = CONFIG.matrixText[Math.floor(Math.random() * CONFIG.matrixText.length)];
            matrixCtx.fillStyle = (i % 2 === 0) ? CONFIG.matrixColor1 : CONFIG.matrixColor2;
            matrixCtx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0; drops[i]++;
        }
    }, 50);
}

function showGiftAndBook() {
    if (matrixCanvas) matrixCanvas.style.display = 'none';
    if (document.querySelector('.canvas')) document.querySelector('.canvas').style.display = 'none';
    const bookCont = document.querySelector('.book-container');
    if (bookCont) {
        bookCont.style.display = 'block'; document.getElementById('book').style.display = 'block';
        setTimeout(() => { bookCont.classList.add('show'); showSpreadText(0); }, 100);
    }
}

function createPages() {
    if (!book) return; book.innerHTML = '';
    const totalSheets = Math.ceil(CONFIG.pages.length / 2);
    for (let i = 0; i < totalSheets; i++) {
        const page = document.createElement('div'); page.classList.add('page'); page.style.zIndex = totalSheets - i;
        const frontIdx = i * 2, backIdx = i * 2 + 1;
        const front = document.createElement('div'); front.classList.add('page-front');
        if (CONFIG.pages[frontIdx]) { const img = document.createElement('img'); img.src = CONFIG.pages[frontIdx].image; front.appendChild(img); }
        const back = document.createElement('div'); back.classList.add('page-back');
        if (CONFIG.pages[backIdx]) { const img = document.createElement('img'); img.src = CONFIG.pages[backIdx].image; back.appendChild(img); }
        page.appendChild(front); page.appendChild(back); book.appendChild(page);
        page.addEventListener('click', () => {
            if (isFlipping) return;
            if (currentPage === i) { isFlipping = true; page.classList.add('flipped'); setTimeout(() => { page.style.zIndex = i; isFlipping = false; }, 800); currentPage++; showSpreadText(currentPage); if (currentPage === totalSheets) setTimeout(finalPhotoHeartEffect, 2000); }
            else if (currentPage === i + 1) { isFlipping = true; page.classList.remove('flipped'); setTimeout(() => { page.style.zIndex = totalSheets - i; isFlipping = false; }, 800); currentPage--; showSpreadText(currentPage); }
        });
    }
}

function showSpreadText(sheetIndex) {
    clearInterval(typeWriterInterval);
    const leftText = CONFIG.pages[sheetIndex * 2 - 1]?.content || "";
    const rightText = CONFIG.pages[sheetIndex * 2]?.content || "";
    const fullText = (sheetIndex === 0) ? (CONFIG.pages[0].content || "") : (leftText + (leftText && rightText ? "\n" : "") + rightText);

    if (fullText.trim() !== "") {
        contentDisplay.classList.add('show'); contentText.innerText = ""; let charIndex = 0;
        typeWriterInterval = setInterval(() => { if (charIndex < fullText.length) { contentText.innerText += fullText.charAt(charIndex); charIndex++; } else clearInterval(typeWriterInterval); }, 50);
    } else contentDisplay.classList.remove('show');
}

function finalPhotoHeartEffect() {
    document.querySelector('.book-container').classList.remove('show'); contentDisplay.classList.remove('show');
    setTimeout(() => {
        document.querySelector('.book-container').style.display = 'none';
        const photoUrls = CONFIG.pages.map(p => p.image).filter(img => img !== "");
        const total = 18;
        for (let i = 0; i < total; i++) setTimeout(() => createHeartPhoto(i, total, photoUrls[i % photoUrls.length]), i * 150);
    }, 1000);
}

function createHeartPhoto(idx, total, url) {
    const photo = document.createElement('img'); photo.src = url; photo.className = 'photo'; document.body.appendChild(photo);
    const t = (idx / total) * 2 * Math.PI;
    const isMobile = window.innerHeight < 200;
    let scale = Math.min(window.innerWidth, window.innerHeight) / 30;
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    
    if (isMobile) { y *= 0.8; scale = window.innerHeight / 35; } // Сплющиваем для мобилок

    photo.style.left = '50%'; photo.style.top = '50%';
    requestAnimationFrame(() => setTimeout(() => {
        photo.style.opacity = '1'; photo.style.transform = `translate(-50%, -50%) scale(1) rotate(${Math.random()*10-5}deg)`;
        photo.style.left = (window.innerWidth/2 + x * scale) + 'px';
        photo.style.top = (window.innerHeight/2 + y * scale + (isMobile ? 20 : 0)) + 'px';
    }, 50));
}

function checkOrientation() {
    const lock = document.getElementById('orientation-lock');
    if (window.innerHeight > window.innerWidth) { lock.style.display = 'flex'; } 
    else { lock.style.display = 'none'; initMatrixRain(); }
}

function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

document.addEventListener('DOMContentLoaded', () => { initMatrixRain(); createPages(); S.init(); checkOrientation(); });
window.addEventListener('resize', checkOrientation);

const musicBtn = document.getElementById('musicControl');
const audio = document.getElementById('birthdayAudio');
musicBtn.addEventListener('click', () => { if (audio.paused) { audio.play(); musicBtn.innerText = "⏸"; } else { audio.pause(); musicBtn.innerText = "▶"; } });