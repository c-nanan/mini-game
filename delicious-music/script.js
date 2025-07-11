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
    const playlists =;

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
            if (e.key === 'Enter' |

| e.key === ' ') {
                handleCardClick(e);
            }
        });
        stopBtn.addEventListener('click', stopAllPlayback);

        // ▼▼▼▼▼ 修正箇所 ▼▼▼▼▼
        // ユーザーがシークバーの操作を開始したことを記録
        seekBar.addEventListener('mousedown', () => { isSeeking = true; });
        seekBar.addEventListener('touchstart', () => { isSeeking = true; }, { passive: true });

        // ユーザーがシークバーをドラッグしている間、リアルタイムで再生位置を更新
        seekBar.addEventListener('input', handleSeek);

        // ユーザーが操作を完了したことを記録 ('change'イベントはマウスボタンを離した後に発火)
        seekBar.addEventListener('change', () => { isSeeking = false; });
        
        // シークバーの外でマウスボタンを離した場合のフォールバック
        window.addEventListener('mouseup', () => {
            if (isSeeking) {
                isSeeking = false;
            }
        });
        window.addEventListener('touchend', () => {
            if (isSeeking) {
                isSeeking = false;
            }
        });
        // ▲▲▲▲▲ 修正箇所 ▲▲▲▲▲
    }

    // --- 再生ロジック ---
    async function playTrack(url) {
        if (!url |

| url === currentTrackUrl) return;
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
        if (!currentTrackUrl ||!players) return;
        
        const player = players;
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
        if (currentTrackUrl && players &&!isSeeking) {
            const player = players;
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

    // ▼▼▼▼▼ 修正箇所 ▼▼▼▼▼
    // 元の handleSeekEnd を削除し、新しい handleSeek 関数を定義
    function handleSeek() {
        if (!currentTrackUrl) return;

        const player = players;
        // player と player.buffer が存在することを確認
        if (player && player.buffer) {
            const newTime = player.buffer.duration * (seekBar.value / 100);
            // Tone.Transport.seconds を更新して再生位置を変更
            Tone.Transport.seconds = newTime;
        }
    }
    // ▲▲▲▲▲ 修正箇所 ▲▲▲▲▲

    // --- 描画 & ユーティリティ ---
    function resizeCanvas() {
        const dpr = window.devicePixelRatio |

| 1;
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
            const isActive = (status === 'playing' |

| status === 'loading');
            if (c.dataset.url === url) {
                c.classList.toggle('active', isActive);
            } else {
                c.classList.remove('active');
            }
        });
    }

    initialize();
});