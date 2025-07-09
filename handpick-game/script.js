// --- DOM Elements ---
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const startButton = document.getElementById('start-button');
const retryButton = document.getElementById('retry-button');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const sampleCanvas = document.getElementById('sample-canvas');
const sampleCtx = sampleCanvas.getContext('2d');
const sampleTitle = document.getElementById('sample-title');
const stageDisplay = document.getElementById('stage-display');
const scoreDisplay = document.getElementById('score-display');
const timerBar = document.getElementById('timer-bar');
const stageIntro = document.getElementById('stage-intro');
const stageTitle = document.getElementById('stage-title');
const stageDescription = document.getElementById('stage-description');
const stageStartButton = document.getElementById('stage-start-button');
const finalScoreDisplay = document.getElementById('final-score');
const resultVisual = document.getElementById('result-visual');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const bgmRelaxBtn = document.getElementById('bgm-relax');
const bgmSakuBtn = document.getElementById('bgm-saku');
const bgmStopBtn = document.getElementById('bgm-stop');

// --- Game Settings ---
let currentStage = 1;
const totalStages = 3;
const stageDuration = 20000;
let timer;
let gameInterval;
let beans = [];
let particles = [];
let score = 0;
let totalTargets = 0;
let clickedTargets = 0;
let wrongClicks = 0;
let gameActive = false;

// --- Bean Drawing Functions ---
function drawBean(context, x, y, radius, colors, hasDefect = false) {
    const grad = context.createRadialGradient(x - radius * 0.2, y - radius * 0.3, radius * 0.1, x, y, radius * 1.2);
    grad.addColorStop(0, colors.light);
    grad.addColorStop(1, colors.base);
    context.fillStyle = grad;
    context.shadowColor = 'rgba(0,0,0,0.5)';
    context.shadowBlur = 10;
    context.shadowOffsetY = 5;
    context.beginPath();
    context.ellipse(x, y, radius * 0.7, radius, 0, 0, 2 * Math.PI);
    context.fill();
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    context.strokeStyle = 'rgba(0,0,0,0.3)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x, y - radius * 0.9);
    context.quadraticCurveTo(x + radius * 0.1, y, x, y + radius * 0.9);
    context.stroke();
    if (hasDefect) {
        context.fillStyle = 'rgba(0,0,0,0.6)';
        context.beginPath();
        context.arc(x + radius * 0.2, y - radius * 0.3, radius * 0.2, 0, 2 * Math.PI);
        context.fill();
    }
}

const stageConfig = {
    1: {
        title: 'Stage 1: Cherry Picking',
        description: '完熟した、深い赤色のチェリーだけをタップしよう。',
        targetType: 'good',
        sampleTitle: 'お手本 (完熟)',
        beanTypes: {
            good: { type: 'good', draw: (ctx, x, y, r) => drawBean(ctx, x, y, r, { base: '#c0392b', light: '#e74c3c' }) },
            bad1: { type: 'bad', draw: (ctx, x, y, r) => drawBean(ctx, x, y, r, { base: '#27ae60', light: '#2ecc71' }) },
            bad2: { type: 'bad', draw: (ctx, x, y, r) => drawBean(ctx, x, y, r, { base: '#f1c40f', light: '#f39c12' }) },
        }
    },
    2: {
        title: 'Stage 2: Green Bean Sorting',
        description: '欠点豆（黒豆・虫食い豆）をタップして取り除こう。',
        targetType: 'bad',
        sampleTitle: 'お手本 (欠点豆)',
        beanTypes: {
            good: { type: 'good', draw: (ctx, x, y, r) => drawBean(ctx, x, y, r, { base: '#95a5a6', light: '#bdc3c7' }) },
            bad1: { type: 'bad', draw: (ctx, x, y, r) => drawBean(ctx, x, y, r, { base: '#2c3e50', light: '#34495e' }) },
            bad2: { type: 'bad', draw: (ctx, x, y, r) => drawBean(ctx, x, y, r, { base: '#7f8c8d', light: '#95a5a6' }, true) },
        }
    },
    3: {
        title: 'Stage 3: Roasted Bean Sorting',
        description: '焙煎ムラのある豆（浅煎りすぎ・深煎りすぎ）を取り除こう。',
        targetType: 'bad',
        sampleTitle: 'お手本 (欠点豆)',
        beanTypes: {
            good: { type: 'good', draw: (ctx, x, y, r) => drawBean(ctx, x, y, r, { base: '#6F4E37', light: '#8B4513' }) },
            bad1: { type: 'bad', draw: (ctx, x, y, r) => drawBean(ctx, x, y, r, { base: '#D2B48C', light: '#E0C9A6' }) },
            bad2: { type: 'bad', draw: (ctx, x, y, r) => drawBean(ctx, x, y, r, { base: '#3B2F2F', light: '#4A3C3C' }) },
        }
    }
};

// --- Audio ---
const relaxMusicURL = "./mochimochi.mp3"; 
const sakuSakuMusicURL = "./sakusaku.mp3";
let bgmRelax, bgmSaku;
let bgmReady = false;

async function loadAudio() {
    try {
        bgmRelax = new Tone.Player({ loop: true, fadeOut: 0.5 }).toDestination();
        bgmSaku = new Tone.Player({ loop: true, fadeOut: 0.5 }).toDestination();
        await Promise.all([bgmRelax.load(relaxMusicURL), bgmSaku.load(sakuSakuMusicURL)]);
        bgmReady = true;
        [bgmRelaxBtn, bgmSakuBtn, bgmStopBtn].forEach(btn => btn.disabled = false);
    } catch (e) {
        console.error("BGMの読み込みに失敗:", e);
    }
}

function playBGM(type) {
    if (!bgmReady) return;
    if (Tone.context.state !== 'running') Tone.start();
    
    bgmRelaxBtn.classList.remove('active');
    bgmSakuBtn.classList.remove('active');

    if (type === 'relax') {
        if (bgmSaku.state === 'started') bgmSaku.stop();
        if (bgmRelax.state !== 'started') bgmRelax.start();
        bgmRelaxBtn.classList.add('active');
    } else if (type === 'saku') {
        if (bgmRelax.state === 'started') bgmRelax.stop();
        if (bgmSaku.state !== 'started') bgmSaku.start();
        bgmSakuBtn.classList.add('active');
    }
}

function stopBGM() {
    if (bgmRelax && bgmRelax.state === 'started') bgmRelax.stop();
    if (bgmSaku && bgmSaku.state === 'started') bgmSaku.stop();
    bgmRelaxBtn.classList.remove('active');
    bgmSakuBtn.classList.remove('active');
}

bgmRelaxBtn.addEventListener('click', () => playBGM('relax'));
bgmSakuBtn.addEventListener('click', () => playBGM('saku'));
bgmStopBtn.addEventListener('click', stopBGM);

// --- Game Flow & Stage Management ---
function showScreen(screenToShow) {
    [startScreen, gameScreen, resultScreen].forEach(screen => {
        screen.classList.add('hidden');
    });
    screenToShow.classList.remove('hidden');
}

function showStageIntro() {
    gameActive = false;
    const config = stageConfig[currentStage];
    stageTitle.textContent = config.title;
    stageDescription.textContent = config.description;
    stageDisplay.textContent = currentStage;
    const prevAvg = currentStage > 1 ? Math.round(score / (currentStage - 1)) : 0;
    scoreDisplay.textContent = `${prevAvg}`;
    timerBar.style.width = '100%';
    updateSampleDisplay();
    stageIntro.classList.remove('hidden');
}

function startStage() {
    gameActive = true;
    beans = [];
    totalTargets = 0;
    clickedTargets = 0;
    wrongClicks = 0;
    let spawnInterval = 500 - (currentStage * 50);

    for (let i = 0; i < stageDuration / spawnInterval; i++) {
        setTimeout(createBean, i * spawnInterval);
    }
    timerBar.style.transition = `width ${stageDuration / 1000}s linear`;
    requestAnimationFrame(() => { timerBar.style.width = '0%'; });
    timer = setTimeout(endStage, stageDuration);
    gameInterval = requestAnimationFrame(gameLoop);
}

function endStage() {
    gameActive = false;
    // cancelAnimationFrame(gameInterval) は gameLoop 内で処理される
    clearTimeout(timer);
    
    const potentialScore = totalTargets > 0 ? (clickedTargets / totalTargets) * 100 : 100;
    const penalty = totalTargets > 0 ? (wrongClicks / beans.length) * 50 : 0;
    const finalStageScore = Math.max(0, Math.round(potentialScore - penalty));
    score += finalStageScore;

    if (currentStage < totalStages) {
        currentStage++;
        setTimeout(showStageIntro, 1500);
    } else {
        setTimeout(showResult, 1000);
    }
}

function showResult() {
    showScreen(resultScreen);
    stopBGM();
    const finalAverageScore = Math.round(score / totalStages);
    finalScoreDisplay.textContent = finalAverageScore;

    let resultData;
    if (finalAverageScore >= 95) {
        resultData = { title: 'Perfecto!', message: '完璧な選別眼。あなたは真のコーヒーマイスターだ。', image: 'https://placehold.co/200x200/c89c6d/1a1a1a?text=Master' };
    } else if (finalAverageScore >= 80) {
        resultData = { title: 'Excellent', message: '素晴らしい一杯が淹れられた。豊かな香りと風味を楽しもう。', image: 'https://placehold.co/200x200/d4a27d/1a1a1a?text=Excellent' };
    } else if (finalAverageScore >= 60) {
        resultData = { title: 'Good', message: 'まずまずの出来。少し雑味があるが、十分に美味しいコーヒーだ。', image: 'https://placehold.co/200x200/e0c9a6/1a1a1a?text=Good' };
    } else {
        resultData = { title: 'Needs Improvement', message: '残念。多くの欠点豆が残り、コーヒーの風味が損なわれてしまった。', image: 'https://placehold.co/200x200/95a5a6/1a1a1a?text=Poor' };
    }

    resultTitle.textContent = resultData.title;
    resultMessage.textContent = resultData.message;
    resultVisual.innerHTML = `<img src="${resultData.image}" alt="${resultData.title}" class="mx-auto mb-4 rounded-lg w-40 h-40 object-cover">`;
}

// --- Game Loop & Drawing ---
function setupCanvas() {
    const container = document.getElementById('game-area');
    canvas.width = container.clientWidth;
    // ★★★ ここが重要な修正箇所 ★★★
    // CSSで設定されたアスペクト比を維持しつつ、高さを設定
    canvas.height = container.clientWidth * 1.3; 
}

function createBean() {
    if (!gameActive) return;
    const config = stageConfig[currentStage];
    const beanKeys = Object.keys(config.beanTypes);
    const randomKey = beanKeys[Math.floor(Math.random() * beanKeys.length)];
    const beanInfo = config.beanTypes[randomKey];

    const bean = {
        x: Math.random() * (canvas.width - 60) + 30,
        y: -30,
        radius: canvas.width / 18,
        draw: beanInfo.draw,
        type: beanInfo.type,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() * 1.5 + 1.5) * (1 + currentStage * 0.1),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
    };
    
    beans.push(bean);
    if (bean.type === config.targetType) { totalTargets++; }
}

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = beans.length - 1; i >= 0; i--) {
        const bean = beans[i];
        bean.x += bean.vx;
        bean.y += bean.vy;
        bean.rotation += bean.rotationSpeed;
        if (bean.y > canvas.height + bean.radius) {
            beans.splice(i, 1);
            continue;
        }
        ctx.save();
        ctx.translate(bean.x, bean.y);
        ctx.rotate(bean.rotation);
        bean.draw(ctx, 0, 0, bean.radius);
        ctx.restore();
    }
    
    particles.forEach((p, i) => {
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0) particles.splice(i, 1);
    });

    const currentPotentialScore = totalTargets > 0 ? (clickedTargets / totalTargets) * 100 : 0;
    const currentPenalty = totalTargets > 0 ? (wrongClicks / totalTargets) * 50 : 0;
    const currentDisplayScore = Math.max(0, Math.round(currentPotentialScore - currentPenalty));
    scoreDisplay.textContent = `${currentDisplayScore}`;

    requestAnimationFrame(gameLoop);
}

// --- User Input & Effects ---
function handleInteraction(event) {
    if (!gameActive) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const interactions = event.changedTouches ? event.changedTouches : [event];

    for (const interaction of interactions) {
        const x = (interaction.clientX - rect.left) * scaleX;
        const y = (interaction.clientY - rect.top) * scaleY;

        for (let i = beans.length - 1; i >= 0; i--) {
            const bean = beans[i];
            const distance = Math.sqrt((x - bean.x)**2 + (y - bean.y)**2);
            if (distance < bean.radius) {
                const config = stageConfig[currentStage];
                if (bean.type === config.targetType) {
                    clickedTargets++;
                    createParticles(bean.x, bean.y, '#c89c6d', 20);
                } else {
                    wrongClicks++;
                    createParticles(bean.x, bean.y, '#95a5a6', 10);
                }
                beans.splice(i, 1);
                break; 
            }
        }
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color,
            size: Math.random() * 2 + 1,
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.98;
                this.vy *= 0.98;
                this.alpha -= 0.03;
            },
            draw(context) {
                context.globalAlpha = this.alpha;
                context.fillStyle = this.color;
                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fill();
                context.globalAlpha = 1;
            }
        });
    }
}

// --- Initialization ---
function updateSampleDisplay() {
    const config = stageConfig[currentStage];
    sampleTitle.textContent = config.sampleTitle;
    sampleCtx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
    
    const sampleBeans = Object.values(config.beanTypes).filter(b => b.type === config.targetType);
    const radius = 18;
    const y = sampleCanvas.height / 2;
    const totalWidth = sampleBeans.length * (radius * 2 + 10) - 10;
    let startX = (sampleCanvas.width - totalWidth) / 2;

    sampleBeans.forEach(bean => {
        bean.draw(sampleCtx, startX, y, radius);
        startX += radius * 2 + 10;
    });
}

window.addEventListener('resize', setupCanvas);
canvas.addEventListener('mousedown', handleInteraction);
canvas.addEventListener('touchstart', handleInteraction);

startButton.addEventListener('click', () => {
    showScreen(gameScreen);
    currentStage = 1;
    score = 0;
    setupCanvas();
    showStageIntro();
});
retryButton.addEventListener('click', () => {
    showScreen(startScreen);
    stopBGM();
});
stageStartButton.addEventListener('click', () => {
    stageIntro.classList.add('hidden');
    startStage();
});

setupCanvas();
loadAudio();
