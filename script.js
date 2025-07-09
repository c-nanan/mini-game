// DOMの読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', () => {

    const cards = document.querySelectorAll('.game-card');

    // --- 3Dホバーエフェクト ---
    cards.forEach(card => {
        // マウスがカードに乗った時の処理
        card.addEventListener('mousemove', (e) => {
            // カードの寸法とマウスの位置を取得
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // カードの中心を基準としたマウスの相対位置を計算 (-1から1の範囲)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -7; // Y軸の傾き（最大7度）
            const rotateY = (x - centerX) / centerX * 7;  // X軸の傾き（最大7度）

            // CSSのカスタムプロパティ（--x, --y）を更新して、光のグラデーションの位置を制御
            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);

            // カードを傾ける
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        // マウスがカードから離れた時の処理
        card.addEventListener('mouseleave', () => {
            // カードの傾きをリセット
            card.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
    });


    // --- 読み込み時のカード表示アニメーション ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // 10%見えたらアニメーション開始
    });

    cards.forEach((card, index) => {
        // 各カードに少しずつ遅延を設定
        card.style.animationDelay = `${index * 100}ms`;
        // アニメーションを一時停止状態で設定
        card.style.animationPlayState = 'paused';
        // 監視対象に追加
        observer.observe(card);
    });

});
