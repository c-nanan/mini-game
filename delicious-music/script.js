document.addEventListener('DOMContentLoaded', () => {
    
    // --- 設定 ---
    const AUDIO_BASE = './music/';
    
    // ★★★ ここに、ご要望通りの4曲のプレイリストを新しい順番とアイコンで作成しました ★★★
    const playlists = [
        { 
            title: "Fuwari",
            file: "fuwari.mp3",
            ready: true,
            icon: `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>` // ハートのアイコン
        },
        { 
            title: "Sable",
            file: "sable.mp3",
            ready: true,
            icon: `<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>` // 正方形のアイコン
        },
        { 
            title: "Dorayaki",
            file: "dorayaki.mp3",
            ready: true,
            icon: `<svg viewBox="0 0 24 24"><path d="M5 11 C5 7, 19 7, 19 11 M5 13 C5 17, 19 17, 19 13"/></svg>` // どら焼きのアイコン
        },
        { 
            title: "Cafe", // dacquoise.mp3 のタイトルを Cafe に変更
            file: "dacquoise.mp3",
            ready: true,
            icon: `<svg viewBox="0 0 24 24"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm-2 10c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V5h10v8zm4-5h-2V5h2v3z"/></svg>` // コーヒーカップのアイコン
        }
    ];

    // --- DOM要素 ---
    const waveformCanvas = document.getElementById('waveform');
    const waveformCtx = waveformCanvas.getContext('2d');
    const controlsContainer = document.getElementById('playlist-controls');
    const playerInfo = document.getElementById('player-info');
    const nowPlayingEl = document.getElementById('now-playing');
    const stopBtn = document.getElementById('stop-button');
    const seekBar = document.getElementById('seek-bar');

    // --- 状態変数 ---
    let players = {}; 
    let waveform = null;
    let currentTrackFile = null;
    let isSeeking = false;
    let uiUpdateLoopId = null;

    // --- 初期化 ---
    function initialize() {
        createPlaylistCards();
        setupEventListeners();
        initWaveform();
        resizeCanvas();
    }

    // --- UI生成 ---
    function createPlaylistCards() {
        controlsContainer.innerHTML = '';
        playlists.forEach((playlist) => {
            const card = document.createElement('div');
            card.className = 'playlist-card';
            card.dataset.file = playlist.file;
            if (!playlist.ready) card.classList.add('disabled');
            card.innerHTML = `<div class="card-icon-container">${playlist.icon}</div><span class="status-badge coming-soon">Coming Soon</span><span class="status-badge loading" style="display: none;">Loading...</span><span class="status-badge error" style="display: none;">Load Error</span><h2 class="card-title">${playlist.title}</h2>`;
            controlsContainer.appendChild(card);
        });
    }

    // --- イベントリスナー ---
    function setupEventListeners() {
        window.addEventListener('resize', resizeCanvas);
        controlsContainer.addEventListener('click', handleCardClick);
        stopBtn.addEventListener('click', stopAllPlayback);
        seekBar.addEventListener('mousedown', () => { isSeeking = true; });
        seekBar.addEventListener('touchstart', () => { isSeeking = true; });
        window.addEventListener('mouseup', handleSeekEnd);
        window.addEventListener('touchend', handleSeekEnd);
        seekBar.addEventListener('input', handleSeeking);
    }

    // --- 音声処理の初期化 ---
    function initWaveform() {
        waveform = new Tone.Waveform();
        Tone.Destination.connect(waveform);
    }

    // --- 再生ロジック ---
    async function playTrack(file) {
        if (!file || file === currentTrackFile) return;
        await stopAllPlayback();

        currentTrackFile = file;
        const playlistItem = playlists.find(p => p.file === file);
        updateCardStatus(file, 'loading');

        try {
            if (!players[file]) {
                players[file] = new Tone.Player({
                    url: `${AUDIO_BASE}${file}`,
                    loop: true,
                }).toDestination();
                await Tone.loaded();
            }
            
            const player = players[file];
            player.start();
            startUiUpdateLoop();

            updateCardStatus(file, 'playing');
            playerInfo.classList.remove('opacity-0');
            seekBar.disabled = false;
            nowPlayingEl.textContent = playlistItem.title;

        } catch (error) {
            console.error(`Error playing track ${file}:`, error);
            updateCardStatus(file, 'error');
            currentTrackFile = null;
        }
    }

    async function stopAllPlayback() {
        if (!currentTrackFile || !players[currentTrackFile]) return;
        
        const player = players[currentTrackFile];
        player.stop();
        stopUiUpdateLoop();

        updateCardStatus(currentTrackFile, 'idle');
        playerInfo.classList.add('opacity-0');
        seekBar.disabled = true;
        seekBar.value = 0;
        currentTrackFile = null;
    }

    // --- UI更新ループ ---
    function startUiUpdateLoop() {
        stopUiUpdateLoop();
        uiUpdateLoopId = requestAnimationFrame(updateUi);
    }

    function stopUiUpdateLoop() {
        if (uiUpdateLoopId) {
            cancelAnimationFrame(uiUpdateLoopId);
            uiUpdateLoopId = null;
        }
    }

    function updateUi() {
        if (currentTrackFile && players[currentTrackFile] && !isSeeking) {
            const player = players[currentTrackFile];
            const progress = (player.position / player.buffer.duration) * 100;
            if (isFinite(progress)) {
                seekBar.value = progress;
            }
        }
        drawWaveform();
        uiUpdateLoopId = requestAnimationFrame(updateUi);
    }

    // --- イベントハンドラ ---
    function handleCardClick(e) {
        const card = e.target.closest('.playlist-card:not(.disabled)');
        if (card) {
            playTrack(card.dataset.file);
        }
    }

    function handleSeekEnd() {
        if (!isSeeking) return;
        isSeeking = false;
        if (!currentTrackFile) return;

        const player = players[currentTrackFile];
        const newTime = player.buffer.duration * (seekBar.value / 100);
        player.seek(newTime);
    }

    function handleSeeking() {
        if (!currentTrackFile) return;
        const player = players[currentTrackFile];
        const newTime = player.buffer.duration * (seekBar.value / 100);
        nowPlayingEl.textContent = `Seeking: ${formatTime(newTime)}`;
    }

    // --- 描画 & ユーティリティ ---
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = waveformCanvas.getBoundingClientRect();
        waveformCanvas.width = rect.width * dpr;
        waveformCanvas.height = rect.height * dpr;
        waveformCtx.scale(dpr, dpr);
    }

    function drawWaveform() {
        const width = waveformCanvas.clientWidth;
        const height = waveformCanvas.clientHeight;
        waveformCtx.clearRect(0, 0, width, height);
        if (!waveform) return;
        
        const values = waveform.getValue();
        if (values.length === 0) return;

        const grad = waveformCtx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, 'rgba(212, 175, 55, 0)');
        grad.addColorStop(0.3, 'rgba(212, 175, 55, 0.7)');
        grad.addColorStop(0.7, 'rgba(212, 175, 55, 0.7)');
        grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
        waveformCtx.strokeStyle = grad;
        waveformCtx.lineWidth = 2;
        waveformCtx.beginPath();
        waveformCtx.moveTo(0, height / 2);
        for (let i = 0; i < values.length; i++) {
            const x = (i / values.length) * width;
            const y = (values[i] * 0.5 + 0.5) * height;
            waveformCtx.lineTo(x, y);
        }
        waveformCtx.stroke();
    }

    function updateCardStatus(file, status) {
        document.querySelectorAll('.playlist-card').forEach(c => {
            if (c.dataset.file === file) {
                c.classList.toggle('active', status === 'playing');
                c.querySelector('.loading').style.display = status === 'loading' ? 'block' : 'none';
                c.querySelector('.error').style.display = status === 'error' ? 'block' : 'none';
            } else {
                c.classList.remove('active');
            }
        });
    }

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    }

    initialize();
});
