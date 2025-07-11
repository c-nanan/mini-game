document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const container = document.querySelector('.dm-container');
    if (!container) {
        console.error('Delicious Musicプレイヤーのコンテナが見つかりません。');
        return; 
    }
    const waveformCanvas = container.querySelector('.dm-waveform');
    const waveformCtx = waveformCanvas.getContext('2d');
    const controlsContainer = container.querySelector('.dm-playlist-controls');
    const playerInfo = container.querySelector('.dm-player-info');
    const nowPlayingEl = container.querySelector('.dm-now-playing');
    const stopBtn = container.querySelector('.dm-stop-button');
    const seekBar = container.querySelector('.dm-seek-bar');

    // --- 設定：プレイリストとShopifyのURL ---
    // ★★★ あなたが提供してくれた正しいURLをここに設定しました ★★★
    const playlists = [
        { 
            title: "Fuwari",
            fileUrl: "https://cdn.shopify.com/s/files/1/0588/5673/4929/files/fuwari.mp3?v=1752148553",
            icon: `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
        },
        { 
            title: "Sable",
            fileUrl: "https://cdn.shopify.com/s/files/1/0588/5673/4929/files/sable.mp3?v=1752148553",
            icon: `<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>`
        },
        { 
            title: "Dorayaki",
            fileUrl: "https://cdn.shopify.com/s/files/1/0588/5673/4929/files/dorayaki.mp3?v=1752148552",
            icon: `<svg viewBox="0 0 24 24"><path d="M5 11 C5 7, 19 7, 19 11 M5 13 C5 17, 19 17, 19 13"/></svg>`
        },
        { 
            title: "Cafe",
            fileUrl: "https://cdn.shopify.com/s/files/1/0588/5673/4929/files/dacquoise.mp3?v=1752149686",
            icon: `<svg viewBox="0 0 24 24"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm-2 10c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V5h10v8zm4-5h-2V5h2v3z"/></svg>`
        }
    ];

    // --- 状態管理 ---
    let players = {}; 
    let waveform;
    let currentTrackUrl = null;
    let isSeeking = false;
    let uiUpdateLoopId = null;

    // --- 初期化処理 ---
    async function initialize() {
        try {
            await Tone.start();
            waveform = new Tone.Waveform().toDestination();
            createPlaylistCards();
            setupEventListeners();
            resizeCanvas();
        } catch (e) {
            console.error("オーディオの初期化に失敗しました。", e);
        }
    }

    // --- UI生成 ---
    function createPlaylistCards() {
        controlsContainer.innerHTML = '';
        playlists.forEach((playlist) => {
            const card = document.createElement('div');
            card.className = 'dm-playlist-card';
            card.dataset.url = playlist.fileUrl;
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.innerHTML = `<div class="dm-card-icon-container">${playlist.icon}</div><h2 class="dm-card-title">${playlist.title}</h2>`;
            controlsContainer.appendChild(card);
        });
    }

    // --- イベントリスナー設定 ---
    function setupEventListeners() {
        window.addEventListener('resize', resizeCanvas);
        controlsContainer.addEventListener('click', handleCardClick);
        controlsContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleCardClick(e);
            }
        });
        stopBtn.addEventListener('click', stopAllPlayback);
        seekBar.addEventListener('mousedown', () => { isSeeking = true; });
        seekBar.addEventListener('touchstart', () => { isSeeking = true; }, { passive: true });
        window.addEventListener('mouseup', handleSeekEnd);
        window.addEventListener('touchend', handleSeekEnd);
    }

    // --- 再生ロジック ---
    async function playTrack(url) {
        if (!url || url === currentTrackUrl) return;
        await stopAllPlayback();

        currentTrackUrl = url;
        const playlistItem = playlists.find(p => p.fileUrl === url);
        updateCardStatus(url, 'playing');

        try {
            if (!players[url]) {
                players[url] = new Tone.Player({ url: url, loop: true, fadeOut: 0.5 }).connect(waveform);
                await Tone.loaded();
            }
            
            const player = players[url];
            Tone.Transport.seconds = 0;
            player.start(0);
            Tone.Transport.start();
            startUiUpdateLoop();

            playerInfo.classList.add('visible');
            seekBar.disabled = false;
            nowPlayingEl.textContent = playlistItem.title;

        } catch (error) {
            console.error(`トラックの読み込み/再生エラー: ${url}`, error);
            updateCardStatus(url, 'error');
            currentTrackUrl = null;
        }
    }

    async function stopAllPlayback() {
        if (!currentTrackUrl || !players[currentTrackUrl]) return;
        
        const player = players[currentTrackUrl];
        Tone.Transport.stop();
        player.stop();
        stopUiUpdateLoop();

        updateCardStatus(currentTrackUrl, 'idle');
        playerInfo.classList.remove('visible');
        seekBar.disabled = true;
        seekBar.value = 0;
        nowPlayingEl.textContent = '';
        currentTrackUrl = null;
        
        requestAnimationFrame(drawWaveform);
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
        if (currentTrackUrl && players[currentTrackUrl] && !isSeeking) {
            const player = players[currentTrackUrl];
            const progress = (Tone.Transport.seconds % player.buffer.duration) / player.buffer.duration * 100;
            if (isFinite(progress)) {
                seekBar.value = progress;
            }
        }
        drawWaveform();
        if (currentTrackUrl) {
            uiUpdateLoopId = requestAnimationFrame(updateUi);
        }
    }

    // --- イベントハンドラ ---
    function handleCardClick(e) {
        const card = e.target.closest('.dm-playlist-card');
        if (card) {
            playTrack(card.dataset.url);
        }
    }

    function handleSeekEnd() {
        if (!isSeeking) return;
        isSeeking = false;
        if (!currentTrackUrl) return;

        const player = players[currentTrackUrl];
        const newTime = player.buffer.duration * (seekBar.value / 100);
        Tone.Transport.seconds = newTime;
        
        const playlistItem = playlists.find(p => p.fileUrl === currentTrackUrl);
        if (playlistItem) {
            nowPlayingEl.textContent = playlistItem.title;
        }
    }

    // --- 描画 & ユーティリティ ---
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = waveformCanvas.getBoundingClientRect();
        waveformCanvas.width = rect.width * dpr;
        waveformCanvas.height = rect.height * dpr;
        waveformCtx.scale(dpr, dpr);
        drawWaveform();
    }

    function drawWaveform() {
        const width = waveformCanvas.clientWidth;
        const height = waveformCanvas.clientHeight;
        waveformCtx.clearRect(0, 0, width, height);

        if (!currentTrackUrl) return;
        
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

    function updateCardStatus(url, status) {
        document.querySelectorAll('.dm-playlist-card').forEach(c => {
            const isActive = (status === 'playing' || status === 'loading');
            if (c.dataset.url === url) {
                c.classList.toggle('active', isActive);
            } else {
                c.classList.remove('active');
            }
        });
    }

    initialize();
});
