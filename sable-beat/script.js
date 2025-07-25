document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const comboEl = document.getElementById('combo');
    const comboWrapper = document.getElementById('combo-wrapper');
    const uiLayer = document.getElementById('ui-layer');
    const mainView = document.getElementById('main-view');
    const feedbackText = document.getElementById('feedback-text');
    
    canvas.width = 400;
    canvas.height = 600;

    const LANES = 5;
    const LANE_WIDTH = canvas.width / LANES;
    const NOTE_HEIGHT = 25;
    const JUDGEMENT_LINE_Y = canvas.height - 150;

    const masterBeatmaps = {
        // ▼▼▼ ここからが追加部分 ▼▼▼
    "sable_game": [ // ファイル名と同じ名前
    { time: 10.344, lane: 1, type: 1 },
    { time: 11.02, lane: 4, type: 1 },
    { time: 11.752, lane: 3, type: 2 },
    { time: 12.368, lane: 4, type: 2 },
    { time: 13.164, lane: 0, type: 2 },
    { time: 13.509, lane: 1, type: 2 },
    { time: 13.918, lane: 2, type: 1 },
    { time: 14.579, lane: 4, type: 2 },
    { time: 15.228, lane: 3, type: 1 },
    { time: 15.951, lane: 1, type: 1 },
    { time: 16.295, lane: 3, type: 2 },
    { time: 16.62, lane: 0, type: 0 },
    { time: 17.045, lane: 4, type: 2 },
    { time: 17.725, lane: 3, type: 1 },
    { time: 17.988, lane: 4, type: 1 },
    { time: 18.342, lane: 4, type: 2 },
    { time: 18.418, lane: 1, type: 2 },
    { time: 18.76, lane: 3, type: 2 },
    { time: 19.517, lane: 3, type: 0 },
    { time: 19.876, lane: 4, type: 2 },
    { time: 20.099, lane: 3, type: 2 },
    { time: 20.598, lane: 1, type: 1 },
    { time: 20.969, lane: 0, type: 0 },
    { time: 21.626, lane: 3, type: 0 },
    { time: 22.399, lane: 4, type: 1 },
    { time: 23.009, lane: 3, type: 2 },
    { time: 23.017, lane: 2, type: 2 },
    { time: 23.018, lane: 4, type: 0 },
    { time: 24.48, lane: 0, type: 0 },
    { time: 25.112, lane: 1, type: 1 },
    { time: 25.425, lane: 2, type: 1 },
    { time: 25.793, lane: 3, type: 1 },
    { time: 26.183, lane: 4, type: 2 },
    { time: 26.536, lane: 3, type: 2 },
    { time: 26.935, lane: 2, type: 1 },
    { time: 27.617, lane: 4, type: 2 },
    { time: 28.38, lane: 3, type: 2 },
    { time: 29.07, lane: 0, type: 1 },
    { time: 29.422, lane: 1, type: 2 },
    { time: 29.736, lane: 2, type: 1 },
    { time: 30.024, lane: 3, type: 2 },
    { time: 30.506, lane: 4, type: 1 },
    { time: 30.843, lane: 3, type: 2 },
    { time: 31.227, lane: 4, type: 2 },
    { time: 31.534, lane: 3, type: 1 },
    { time: 32.612, lane: 0, type: 2 },
    { time: 32.935, lane: 1, type: 2 },
    { time: 32.949, lane: 3, type: 1 },
    { time: 32.952, lane: 4, type: 1 },
    { time: 32.972, lane: 2, type: 2 },
    ],
        fuwari_game: [
    { time: 16.565, lane: 4, type: 2 },
    { time: 17.289, lane: 1, type: 0 },
    { time: 17.738, lane: 3, type: 2 },
    { time: 18.514, lane: 0, type: 2 },
    { time: 18.981, lane: 3, type: 1 },
    { time: 19.747, lane: 4, type: 1 },
    { time: 20.512, lane: 1, type: 0 },
    { time: 20.899, lane: 2, type: 0 },
    { time: 21.485, lane: 4, type: 1 },
    { time: 21.923, lane: 3, type: 2 },
    { time: 22.413, lane: 1, type: 0 },
    { time: 25.899, lane: 1, type: 0 },
    { time: 26.413, lane: 2, type: 0 },
    { time: 27.413, lane: 3, type: 1 },
    { time: 27.828, lane: 4, type: 1 },
    { time: 28.343, lane: 0, type: 0 },
    { time: 28.936, lane: 1, type: 1 },
    { time: 29.459, lane: 2, type: 2 },
    { time: 30.397, lane: 4, type: 2 },
    { time: 32.391, lane: 0, type: 0 },
    { time: 33.398, lane: 2, type: 0 },
    { time: 34.368, lane: 3, type: 2 },
    { time: 34.945, lane: 4, type: 0 },
    { time: 35.448, lane: 3, type: 0 },
    { time: 36.175, lane: 1, type: 1 },
    { time: 36.669, lane: 2, type: 0 },
    { time: 37.107, lane: 3, type: 2 },
    { time: 37.954, lane: 4, type: 2 },
    { time: 38.695, lane: 3, type: 0 },
    { time: 39.197, lane: 2, type: 2 },
    { time: 39.689, lane: 3, type: 1 },
    { time: 39.954, lane: 1, type: 1 },
    { time: 40.165, lane: 4, type: 0 },
    { time: 40.449, lane: 0, type: 0 },
    { time: 40.893, lane: 3, type: 0 },
    { time: 41.389, lane: 4, type: 0 },
    { time: 41.758, lane: 3, type: 0 },
    { time: 42.386, lane: 1, type: 0 },
    { time: 42.884, lane: 2, type: 0 },
    { time: 44.111, lane: 4, type: 0 },
    { time: 44.405, lane: 3, type: 0 },
    { time: 45.184, lane: 2, type: 0 },
    { time: 45.927, lane: 1, type: 0 },
    { time: 46.422, lane: 4, type: 1 },
    { time: 46.779, lane: 3, type: 1 },
    { time: 47.137, lane: 2, type: 2 },
    { time: 47.454, lane: 4, type: 0 },
    { time: 47.771, lane: 3, type: 0 },
    { time: 48.584, lane: 1, type: 1 },
    { time: 49.085, lane: 2, type: 0 },
    { time: 49.933, lane: 3, type: 2 },
    { time: 50.265, lane: 4, type: 0 },
    { time: 50.57, lane: 3, type: 0 },
    { time: 50.985, lane: 4, type: 1 },
    { time: 51.228, lane: 3, type: 2 },
    { time: 52.735, lane: 1, type: 2 },
    { time: 53.204, lane: 2, type: 0 },
    { time: 53.467, lane: 4, type: 0 },
    { time: 53.846, lane: 3, type: 1 },
    { time: 54.252, lane: 2, type: 2 },
    { time: 54.86, lane: 1, type: 0 },
    { time: 55.234, lane: 2, type: 2 },
    { time: 56.244, lane: 3, type: 2 },
    { time: 56.497, lane: 3, type: 1 },
    { time: 58.499, lane: 4, type: 1 },
    { time: 59.197, lane: 3, type: 0 },
    { time: 60.004, lane: 2, type: 0 },
    { time: 60.471, lane: 3, type: 2 },
    { time: 61.168, lane: 3, type: 2 },
    { time: 61.885, lane: 1, type: 0 },
    { time: 62.247, lane: 3, type: 2 },
    { time: 62.495, lane: 2, type: 0 },
    { time: 63.445, lane: 4, type: 1 },
    { time: 63.961, lane: 3, type: 1 },
    { time: 65.489, lane: 3, type: 1 },
],
        mochimochi: [ { time: 7.174, lane: 1, type: 0 }, { time: 7.679, lane: 4, type: 2 }, { time: 7.914, lane: 4, type: 2 }, { time: 8.098, lane: 4, type: 2 }, { time: 8.331, lane: 4, type: 0 }, { time: 8.571, lane: 4, type: 0 }, { time: 8.812, lane: 3, type: 1 }, { time: 9.061, lane: 1, type: 0 }, { time: 9.293, lane: 3, type: 0 }, { time: 10.032, lane: 0, type: 1 }, { time: 10.982, lane: 3, type: 0 }, { time: 11.508, lane: 1, type: 2 }, { time: 11.739, lane: 1, type: 0 }, { time: 11.947, lane: 1, type: 2 }, { time: 12.182, lane: 1, type: 0 }, { time: 12.414, lane: 1, type: 2 }, { time: 12.667, lane: 4, type: 0 }, { time: 12.921, lane: 3, type: 2 }, { time: 13.122, lane: 1, type: 0 }, { time: 13.893, lane: 3, type: 2 }, { time: 14.38, lane: 1, type: 1 }, { time: 14.825, lane: 4, type: 2 }, { time: 15.328, lane: 3, type: 1 }, { time: 15.561, lane: 3, type: 0 }, { time: 15.789, lane: 3, type: 2 }, { time: 16.017, lane: 3, type: 2 }, { time: 16.249, lane: 3, type: 0 }, { time: 16.743, lane: 2, type: 1 }, { time: 16.978, lane: 4, type: 2 }, { time: 17.7, lane: 4, type: 0 }, { time: 17.956, lane: 1, type: 2 }, { time: 18.172, lane: 3, type: 1 }, { time: 18.419, lane: 2, type: 1 }, { time: 18.867, lane: 0, type: 1 }, { time: 19.392, lane: 4, type: 2 }, { time: 19.862, lane: 2, type: 1 }, { time: 20.077, lane: 3, type: 0 }, { time: 20.317, lane: 1, type: 2 }, { time: 20.541, lane: 4, type: 0 }, { time: 20.835, lane: 3, type: 1 }, { time: 21.04, lane: 2, type: 2 }, { time: 21.514, lane: 4, type: 0 }, { time: 21.992, lane: 1, type: 2 }, { time: 22.028, lane: 4, type: 2 }, { time: 22.237, lane: 4, type: 2 }, { time: 22.249, lane: 1, type: 0 }, { time: 22.605, lane: 3, type: 0 }, { time: 23.445, lane: 4, type: 1 }, { time: 23.68, lane: 1, type: 2 }, { time: 23.891, lane: 3, type: 1 }, { time: 24.128, lane: 2, type: 0 }, { time: 24.384, lane: 3, type: 1 }, { time: 24.654, lane: 1, type: 0 }, { time: 25.315, lane: 4, type: 0 }, { time: 25.827, lane: 3, type: 1 }, { time: 26.312, lane: 1, type: 0 }, { time: 26.798, lane: 1, type: 0 }, { time: 26.8, lane: 4, type: 1 }, { time: 27.273, lane: 4, type: 0 }, { time: 27.757, lane: 4, type: 2 }, { time: 27.994, lane: 4, type: 0 }, { time: 28.418, lane: 1, type: 2 }, { time: 29.084, lane: 3, type: 2 }, { time: 29.666, lane: 1, type: 1 }, { time: 30.165, lane: 4, type: 0 }, { time: 30.654, lane: 2, type: 0 }, { time: 30.876, lane: 2, type: 1 }, { time: 31.093, lane: 2, type: 2 }, { time: 31.311, lane: 2, type: 2 }, { time: 31.573, lane: 2, type: 1 }, { time: 31.808, lane: 3, type: 1 }, { time: 31.812, lane: 1, type: 0 }, { time: 32.342, lane: 4, type: 2 }, { time: 32.999, lane: 3, type: 0 }, { time: 33.004, lane: 1, type: 1 }, { time: 33.949, lane: 3, type: 2 }, { time: 33.954, lane: 2, type: 1 }, { time: 34.433, lane: 4, type: 0 }, { time: 34.452, lane: 1, type: 0 }, { time: 35.404, lane: 4, type: 2 }, { time: 35.404, lane: 1, type: 1 }, { time: 35.404, lane: 2, type: 2 }, { time: 35.404, lane: 3, type: 0 }, { time: 36.094, lane: 3, type: 2 }, { time: 36.096, lane: 4, type: 2 }, { time: 36.097, lane: 0, type: 2 }, { time: 36.098, lane: 2, type: 1 }, { time: 36.113, lane: 1, type: 1 }, { time: 36.613, lane: 1, type: 2 }, { time: 36.703, lane: 1, type: 2 }, { time: 36.784, lane: 1, type: 2 }, ]
    };
    
    const keyMaps = {
        left: { 'a': 0, 's': 1, 'd': 2, 'f': 3, ' ': 4 },
        right: { ' ': 0, 'j': 1, 'k': 2, 'l': 3, ';': 4 }
    };
    let currentKeyMap = null, keyMapDisplay = {};
    let audio, beatmap;
    let notes = [], score = 0, combo = 0, particles = [];
    let laneFlashes = [0, 0, 0, 0, 0];
    let isGameRunning = false;
    const noteSpeed = 3;
    let currentSong, currentStage = 0, currentPlayStyle;

    const SABLE_COLORS = {
        base: ['#00aaff', '#ff00ff', '#f1c40f'],
        light: ['#87cefa', '#ff77ff', '#f8e5ab'],
        shadow: ['#0077cc', '#cc00cc', '#c7a340']
    };
    
    function generateDifficulty(baseBeatmap, stage) {
        if (stage >= 2) return baseBeatmap;
        const ratio = stage === 1 ? 0.75 : 0.5;
        const step = Math.round(1 / ratio);
        return baseBeatmap.filter((_, index) => index % step === 0);
    }

    function showView(view) {
        mainView.innerHTML = view;
        uiLayer.classList.remove('hidden');
        attachButtonListeners();
    }

    function showSongSelect() {
        currentStage = 0;
        const view = `<p>プレイする曲を選んでください</p><button class="ui-button" data-action="select-song" data-song="sable_game">サブレing</button><button class="ui-button" data-action="select-song" data-song="fuwari_game">Fwari</button><button class="ui-button" data-action="select-song" data-song="mochimochi">Cafe 9</button>`;
        showView(view);
    }

    function showStyleSelect() {
        const view = `<p>プレイスタイルを選んでください</p><button class="ui-button" data-action="select-style" data-style="left">PC(左手)</button><button class="ui-button" data-action="select-style" data-style="right">PC(右手)</button><button class="ui-button" data-action="select-style" data-style="tap">タップでプレイ</button><button class="ui-button" data-action="back-to-song-select">曲選択に戻る</button>`;
        showView(view);
    }

    function attachButtonListeners() {
        document.querySelectorAll('[data-action]').forEach(button => {
            button.onclick = (e) => {
                const { action, song, style } = e.target.dataset;
                switch (action) {
                    case 'select-song': currentSong = song; showStyleSelect(); break;
                    case 'select-style': currentPlayStyle = style; prepareGame(); break;
                    case 'retry': prepareGame(); break;
                    case 'back-to-song-select': showSongSelect(); break;
                }
            };
        });
    }
    
    function prepareGame() {
        if (currentPlayStyle === 'left' || currentPlayStyle === 'right') {
            currentKeyMap = keyMaps[currentPlayStyle];
            keyMapDisplay = {};
            for(const key in currentKeyMap) { keyMapDisplay[currentKeyMap[key]] = (key === ' ' ? 'SPACE' : key.toUpperCase()); }
        } else {
            currentKeyMap = null; keyMapDisplay = {};
        }
        
        beatmap = generateDifficulty(masterBeatmaps[currentSong], currentStage);
        audio = new Audio(`./${currentSong}.mp3`);
        audio.preload = "auto";
        showView(`<p>STAGE ${currentStage + 1}<br>読み込み中...</p>`);

        const onCanPlay = () => {
            audio.removeEventListener('canplaythrough', onCanPlay);
            startGame();
        };

        if (audio.readyState >= 4) { onCanPlay(); } 
        else { audio.addEventListener('canplaythrough', onCanPlay, { once: true }); }
        audio.load();
    }

    function startGame() {
        score = 0; combo = 0; notes = [];
        isGameRunning = true;
        uiLayer.classList.add('hidden');
        beatmap.forEach(createNote);
        
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Audio play failed:", e));
        gameLoop();
    }

    function createNote(noteData) {
        notes.push({ ...noteData, y: -NOTE_HEIGHT, time: noteData.time, isHit: false });
    }

    function gameLoop() {
        if (!isGameRunning) return;

        if (audio.duration > 0 && audio.currentTime >= audio.duration - 0.05) {
            isGameRunning = false;
            setTimeout(finishStage, 1000);
            return;
        }

        const currentTime = audio.currentTime;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawLanes();
        drawJudgementLine();
        
        notes.forEach(note => {
            if (!note.isHit) {
                const timeUntilHit = note.time - currentTime;
                note.y = JUDGEMENT_LINE_Y - (timeUntilHit * 60 * noteSpeed);
                drawNote(note);
                if (timeUntilHit < -0.2) { note.isHit = true; showFeedback('MISS'); resetCombo(); }
            }
        });

        notes = notes.filter(note => !note.isHit || note.y <= canvas.height);
        particles.forEach((p, i) => { p.update(); p.draw(); if (p.alpha <= 0) particles.splice(i, 1); });
        
        requestAnimationFrame(gameLoop);
    }
    
    function finishStage() {
        audio.pause();

        const clearThreshold = beatmap.length * 300 * 0.7; 
        const isClear = score >= clearThreshold;

        if (isClear) {
            if (currentStage < 2) {
                currentStage++;
                showView(`<div><p>STAGE CLEAR!</p><p>次のステージに進みます...</p></div>`);
                setTimeout(prepareGame, 2500);
            } else { showEndScreen(true); }
        } else { showEndScreen(false); }
    }
    
    function showEndScreen(isTourClear) {
         const message = isTourClear ? "TOUR CLEAR! <br> 全ステージ制覇おめでとう！" : "STAGE FAILED...";
         const view = `<div><p>${message}</p><p>SCORE: ${score}</p><button class="ui-button" data-action="retry">もう一度挑戦</button><button class="ui-button" data-action="back-to-song-select">曲選択に戻る</button></div>`;
        showView(view);
    }

    function drawLanes() {
        for (let i = 0; i < LANES; i++) {
            ctx.fillStyle = (i % 2 === 0) ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)';
            ctx.fillRect(i * LANE_WIDTH, 0, LANE_WIDTH, canvas.height);
            if (laneFlashes[i] > 0) {
                ctx.fillStyle = `rgba(0, 170, 255, ${laneFlashes[i]})`; // Flash color
                ctx.fillRect(i * LANE_WIDTH, 0, LANE_WIDTH, canvas.height);
                laneFlashes[i] -= 0.05;
            }
        }
    }

    function drawJudgementLine() {
        ctx.fillStyle = 'rgba(0, 170, 255, 0.8)';
        ctx.fillRect(0, JUDGEMENT_LINE_Y, canvas.width, 3);
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0, 170, 255, 0.8)';
        ctx.fillRect(0, JUDGEMENT_LINE_Y, canvas.width, 3);
        ctx.shadowBlur = 0;
        
        if (currentKeyMap) {
            ctx.font = 'bold 20px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            for (let i = 0; i < LANES; i++) {
                const key = keyMapDisplay[i] || '';
                ctx.fillText(key, i * LANE_WIDTH + LANE_WIDTH / 2, JUDGEMENT_LINE_Y + 30);
            }
        }
    }

    function drawNote(note) {
        const x = note.lane * LANE_WIDTH + 5;
        const w = LANE_WIDTH - 10;
        const h = NOTE_HEIGHT;
        const y = note.y;
        
        ctx.fillStyle = SABLE_COLORS.base[note.type];
        ctx.shadowColor = SABLE_COLORS.base[note.type];
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(x + 5, y);
        ctx.lineTo(x + w - 5, y);
        ctx.lineTo(x + w, y + h/2);
        ctx.lineTo(x + w - 5, y + h);
        ctx.lineTo(x + 5, y + h);
        ctx.lineTo(x, y + h/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    function handleInput(lane) {
        if (!isGameRunning) return;
        const targetTime = audio.currentTime;
        let bestNoteIndex = -1, minDiff = Infinity;
        notes.forEach((note, index) => {
            if (note.lane === lane && !note.isHit) {
                const diff = Math.abs(note.time - targetTime);
                if (diff < minDiff) { minDiff = diff; bestNoteIndex = index; }
            }
        });
        laneFlashes[lane] = 0.8;
        if (bestNoteIndex !== -1 && minDiff < 0.2) {
            const note = notes[bestNoteIndex];
            note.isHit = true;
            if (minDiff < 0.08) { score += 300 + combo; combo++; showFeedback('PERFECT'); }
            else if (minDiff < 0.15) { score += 100; combo++; showFeedback('GOOD'); }
            else { resetCombo(); showFeedback('BAD'); }
            createParticles(lane * LANE_WIDTH + LANE_WIDTH / 2, JUDGEMENT_LINE_Y, SABLE_COLORS.base[note.type]);
        }
        updateUI();
    }
    
    function resetCombo() { combo = 0; updateUI(); }
    function updateUI() {
        scoreEl.textContent = score;
        comboEl.textContent = combo;
        if (combo >= 10) {
            comboWrapper.classList.add('glowing');
        } else {
            comboWrapper.classList.remove('glowing');
        }
    }

    function showFeedback(text) {
        feedbackText.textContent = text;
        feedbackText.dataset.type = text;
        feedbackText.className = 'show';
        setTimeout(() => feedbackText.classList.remove('show'), 400);
    }
    
    function createParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                alpha: 1,
                color: color,
                size: Math.random() * 3 + 1,
                update() { this.x += this.vx; this.y += this.vy; this.alpha -= 0.03; },
                draw() {
                    ctx.globalAlpha = this.alpha;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            });
        }
    }

    document.addEventListener('keydown', (e) => {
        if (currentKeyMap) {
            const key = e.key === ' ' ? ' ' : e.key.toLowerCase();
            if (currentKeyMap[key] !== undefined) handleInput(currentKeyMap[key]);
        }
    });

    function processTouches(touches) {
        if (currentKeyMap) return;
        const rect = canvas.getBoundingClientRect();
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const touchX = touch.clientX - rect.left;
            const lane = Math.floor(touchX / (rect.width / LANES));
            
            if (lane >= 0 && lane < LANES) {
                handleInput(lane);
            }
        }
    }
    
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        processTouches(event.touches);
    }, { passive: false });

    canvas.addEventListener('mousedown', (event) => {
        event.preventDefault();
        if (currentKeyMap) return;
        const rect = canvas.getBoundingClientRect();
        const touchX = event.clientX - rect.left;
        const lane = Math.floor(touchX / (rect.width / LANES));
        if (lane >= 0 && lane < LANES) {
            handleInput(lane);
        }
    });
    
    showSongSelect();
});
