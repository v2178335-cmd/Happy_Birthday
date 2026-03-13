window.addEventListener('load', () => {
    const loader = document.getElementById('preloader');
    const bar = document.querySelector('.bar-fill');
    const percentText = document.getElementById('load-percent');
    let width = 0;

    // Имитация загрузки
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loader.style.opacity = '0'; // Плавное исчезновение
                setTimeout(() => {
                    loader.style.display = 'none'; // Полное удаление
                }, 500);
            }, 500);
        } else {
            // Прыгающая загрузка для реалистичности
            width += Math.floor(Math.random() * 10) + 1;
            if (width > 100) width = 100;
            bar.style.width = width + '%';
            percentText.innerText = width + '%';
        }
    }, 100);
});

const chatData = {
    'nomad': {
        contact: "ПАНАМ ПАЛМЕР",
        messages: [
            "Хэй, Михаил! Альдекальдо только что свернули лагерь, но мы нашли время притормозить.",
            "Мич раздобыл ящик настоящего довоенного пойла. Сказал, это для тебя.",
            "С днем рождения. Ты всегда найдешь место в нашей семье. Возвращайся скорее, мы ждем."
        ],
        choice: "Прочитать"
    },
    'street': {
        contact: "ВИКТОР ВЕКТОР",
        messages: [
            "Михаил, загляни ко мне в клинику, когда будет время. У меня тут для тебя подарок.",
            "Проверил твою оптику по базе — всё чисто. Ты в отличной форме для своего возраста.",
            "С днем рождения, чумба. Будь осторожен на улицах, Найт-Сити сегодня не в духе."
        ],
        choice: "Прочитать"
    },
    'corp': {
        contact: "ГОРО ТАКЕМУРА",
        messages: [
            "Михаил. Я нашел место с отличным раменом. Хотя повара здесь... сомнительны.",
            "Честь и долг велят мне поздравить тебя сегодня.",
            "С днем рождения. Желаю тебе силы духа. И... научись уже отвечать на звонки быстрее."
        ],
        choice: "Прочитать"
    }
};

const birthdayMessage = "¡OYE, MANO! СЛЫШИШЬ МЕНЯ? ЭТО ДЖЕКИ. ЗНАЮ, В НАЙТ-СИТИ КАЖДЫЙ ДЕНЬ — КАК ПОСЛЕДНИЙ, НО СЕГОДНЯ ОСОБЕННЫЙ СЛУЧАЙ. ТЫ СТАЛ ЕЩЕ НА ГОД БЛИЖЕ К ВЫСШЕЙ ЛИГЕ, ЧОМБА! МАМА УЭЛЛС УЖЕ ГОТОВИТ ПРАЗДНИЧНЫЙ УЖИН, А Я ЗАБИЛ НАМ СТОЛИК В «ПОСМЕРТИИ». ЖИВИ НА ПОЛНУЮ И НЕ ДАЙ ЭТОМУ ГОРОДУ ТЕБЯ СЛОМАТЬ. С ДНЕМ РОЖДЕНИЯ! МЫ ЕЩЕ ПОКАЖЕМ ИМ ВСЕМ, КТО ТУТ ЛЕГЕНДА! 🤘🔥";

const chatBox = document.getElementById('chat-box');
const messenger = document.getElementById('messenger');
const choicesArea = document.getElementById('choices-area');
const congratsWindow = document.getElementById('congrats-window');
const typewriterElement = document.getElementById('typewriter-text');
const startScreen = document.querySelector('.start-screen');

let charIndex = 0;

// Функция сна
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Логика выбора пути
document.querySelectorAll('.path-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const path = btn.getAttribute('data-path');
        startScreen.classList.add('hidden');
        messenger.classList.remove('hidden');
        document.getElementById('contact-name').innerText = chatData[path].contact;
        startChat(chatData[path]);
    });
});

async function startChat(data) {
    chatBox.innerHTML = '';
    choicesArea.innerHTML = '';
    for (let text of data.messages) {
        await sleep(1500);
        addMessage(text);
    }
    await sleep(1000);
    addChoice(data.choice);
}

function addMessage(text) {
    const div = document.createElement('div');
    div.className = 'msg';
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addChoice(text) {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = text;
    btn.onclick = openCongrats; // Открываем финал
    choicesArea.appendChild(btn);
}

// Финальная печать
function openCongrats() {
    messenger.classList.add('hidden');
    congratsWindow.classList.remove('hidden');
    typeWriter();
}

function typeWriter() {
    if (charIndex < birthdayMessage.length) {
        typewriterElement.innerHTML += birthdayMessage.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 50);
    }
}