// HTMLの読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 設定: 曲リストや設定 ---
    const AUDIO_BASE = './music/';
    const playlists = [
        { 
            title: "Tokyo Fuwari – Organic Matcha", 
            file: "matcha.mp3", 
            ready: true,
            icon: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9 12l2 2 4-4" fill="currentColor" stroke="none"/></svg>`
        },
        { 
            title: "Dacquoise", 
            file: "dacquoise.mp3", 
            ready: true, 
            icon: `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
        },
        { 
            title: "Tokyo Fuwari – Tanada Yuzu", 
            file: "yuzu.mp3", 
            ready: false,
            icon: `<svg viewBox="0 0 24 24"><path d="M5 11 C5 7, 19 7, 19 11 M5 13 C5 17, 19 17, 19 13"/></svg>`
        },
        { 
            title: "Anko is a Star", 
            file: "anko.mp3", 
            ready: false,
            icon: `<svg viewBox="0 0 24 24"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm-2 10c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V5h10v8zm4-5h-2V5h2v3z"/></svg>`
        }
    ];

    // --- DOM要素取得 ---
    const waveformCanvas = document.getElementById('waveform');
    const waveformCtx = waveformCanvas.getContext('2d');
    const controlsContainer = document.getElementById('playlist-controls');
    const playerInfo = document.getElementById('player-info');
    const nowPlayingEl = document.getElementById('now-playing');
    const stopBtn = document.getElementById('stop-button');
    const seekBar = document.getElementById('seek-bar');

    // --- 状態管理変数 ---
    let players = new Array(playlists.length).fill(null);
    let waveform = null;
    let currentTrackIndex = -1;
    let isSeeking = false;
    let transportUpdateId = null; // ★修正点: シークバー更新イベントのIDを管理する変数を追加

    // --- 初期化処理 ---
    function initialize() {
        createPlaylistCards();
        setupEventListeners();
        initWaveform();
        resizeCanvas();
        animationLoop(); // 波形描画はこれまで通り毎フレーム行う
    }

    // --- UI生成 ---
    function createPlaylistCards() {
        controlsContainer.innerHTML = '';
        playlists.forEach((playlist, index) => {
            const card = document.createElement('div');
            card.className = 'playlist-card';
            card.dataset.track = index;
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            if (!playlist.ready) card.classList.add('disabled');
            card.innerHTML = `
                <div class="card-icon-container">${playlist.icon}</div>
                <span class="status-badge coming-soon">Coming Soon</span>
                <span class="status-badge loading" style="display: none;">Loading...</span>
                <span class="status-badge error" style="display: none;">Load Error</span>
                <h2 class="card-title">${playlist.title}</h2>
            `;
            controlsContainer.appendChild(card);
        });
    }

    // --- イベントリスナー設定 ---
    function setupEventListeners() {
        window.addEventListener('resize', resizeCanvas);
        controlsContainer.addEventListener('click', handleCardClick);
        controlsContainer.addEventListener('keydown', handleCardKeydown);
        stopBtn.addEventListener('click', stopAllPlayback);
        ['mousedown', 'touchstart'].forEach(evt => seekBar.addEventListener(evt, () => { isSeeking = true; }));
        ['mouseup', 'touchend'].forEach(evt => seekBar.addEventListener(evt, handleSeekEnd));
        seekBar.addEventListener('input', handleSeeking);
    }

    // --- 音声処理 ---
    function initWaveform() {
        waveform = new Tone.Waveform();
        Tone.Destination.connect(waveform);
    }

    // --- アニメーションとUI更新 ---
    function animationLoop() {
        requestAnimationFrame(animationLoop);
        drawWaveform(); // ★修正点: 波形描画だけを行う
    }
    
    // ★修正点: Tone.Transportと同期してシークバーを更新する新しい関数
    function updateSeekBar() {
        const player = players[currentTrackIndex];
        if (player && player.loaded && player.state === 'started' && !isSeeking) {
            const progress = (player.position / player.buffer.duration) * 100;
            if (isFinite(progress)) {
                seekBar.value = progress;
            }
        }
    }
    
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
        if (!waveform || currentTrackIndex === -1 || !players[currentTrackIndex]?.loaded) {
            return;
        }
        const values = waveform.getValue();
        const grad = waveformCtx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, 'rgba(212,175,55,0)');
        grad.addColorStop(0.3, 'rgba(212,175,55,0.7)');
        grad.addColorStop(0.7, 'rgba(212,175,55,0.7)');
        grad.addColorStop(1, 'rgba(212,175,55,0)');
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
    
    function updateCardStatus(index, status) {
        document.querySelectorAll('.playlist-card').forEach((c, i) => {
            c.classList.remove('active');
            c.querySelector('.loading').style.display = 'none';
            c.querySelector('.error').style.display = 'none';
            if(index === i) {
                if (status === 'playing') c.classList.add('active');
                if (status === 'loading') c.querySelector('.loading').style.display = 'block';
                if (status === 'error') {
                    c.querySelector('.error').style.display = 'block';
                    c.classList.add('disabled');
                }
            }
        });
    }

    function updateNowPlayingText() {
        if(currentTrackIndex === -1) return;
        nowPlayingEl.textContent = `NOW PLAYING: ${playlists[currentTrackIndex].title}`;
    }

    // --- イベントハンドラ ---
    function handleCardClick(e) {
        const card = e.target.closest('.playlist-card');
        if (card && !card.classList.contains('disabled')) {
            playTrack(+card.dataset.track);
        }
    }

    function handleCardKeydown(e) {
        const card = e.target.closest('.playlist-card');
        if (card && !card.classList.contains('disabled') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            playTrack(+card.dataset.track);
        }
    }

    function handleSeeking() {
        if (!players[currentTrackIndex]?.loaded) return;
        const player = players[currentTrackIndex];
        const newTime = player.buffer.duration * (seekBar.value / 100);
        nowPlayingEl.textContent = `SEEKING: ${formatTime(newTime)} / ${formatTime(player.buffer.duration)}`;
    }

    function handleSeekEnd() {
        if (!isSeeking) return;
        isSeeking = false;
        if (currentTrackIndex === -1 || !players[currentTrackIndex]?.loaded) return;
        
        const player = players[currentTrackIndex];
        const newTime = player.buffer.duration * (seekBar.value / 100);
        
        player.seek(newTime);
        
        if(player.state !== 'started') {
            player.start();
        }

        updateNowPlayingText();
    }

    // --- 再生ロジック (★ここから下が全面的に修正されています) ---
    async function playTrack(index) {
        if (!playlists[index].ready || index === currentTrackIndex) return;

        await Tone.start();
        
        if (currentTrackIndex !== -1 && players[currentTrackIndex]) {
            players[currentTrackIndex].stop();
            updateCardStatus(currentTrackIndex, 'idle');
        }

        // 古いタイマーが残っていればクリア
        if (transportUpdateId) {
            Tone.Transport.clear(transportUpdateId);
            transportUpdateId = null;
        }
        
        const oldTrackIndex = currentTrackIndex;
        currentTrackIndex = index;

        if (players[index] && players[index].loaded) {
            startPlayback(index);
        } else {
            updateCardStatus(index, 'loading');
            try {
                const player = players[index] || new Tone.Player({ loop: true, fadeOut: 0.5 }).toDestination();
                if (!players[index]) players[index] = player;
                
                await player.load(`${AUDIO_BASE}${playlists[index].file}`);
                
                if (currentTrackIndex === index) {
                    startPlayback(index);
                }
            } catch (error) {
                console.error(`Failed to load track ${index}:`, error);
                if (currentTrackIndex === index) {
                    updateCardStatus(index, 'error');
                    currentTrackIndex = oldTrackIndex;
                }
            }
        }
    }

    function startPlayback(index) {
        const player = players[index];
        if (player.state !== 'started') {
            player.start();
        }
        
        // Tone.jsの全体タイマーを開始
        Tone.Transport.start();

        // 古いタイマーをクリア
        if (transportUpdateId) {
            Tone.Transport.clear(transportUpdateId);
        }

        // 0.1秒ごとにupdateSeekBar関数を実行するようスケジュール
        transportUpdateId = Tone.Transport.scheduleRepeat(updateSeekBar, "0.1");

        updateCardStatus(index, 'playing');
        playerInfo.classList.remove('opacity-0');
        seekBar.disabled = false;
        updateNowPlayingText();
    }

    function stopAllPlayback() {
        if (currentTrackIndex !== -1 && players[currentTrackIndex]) {
            players[currentTrackIndex].stop();
            
            // 全体タイマーを停止し、スケジュールをクリア
            Tone.Transport.stop();
            if (transportUpdateId) {
                Tone.Transport.clear(transportUpdateId);
                transportUpdateId = null;
            }

            updateCardStatus(currentTrackIndex, 'idle');
            currentTrackIndex = -1;
            playerInfo.classList.add('opacity-0');
            seekBar.disabled = true;
            seekBar.value = 0;
        }
    }
    
    // --- ユーティリティ ---
    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    }

    // --- アプリケーション実行 ---
    initialize();
});
