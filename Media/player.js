const VideoPlayer = {
    init(containerId, stream) {
        const container = document.getElementById(containerId);
        if (!container) return;
        let rawInput = (stream.url || '').trim();

        // Robustly parse and extract src if a full iframe embed code snippet was pasted
        if (rawInput.toLowerCase().includes('<iframe') && rawInput.includes('src=')) {
            const srcMatch = rawInput.match(/src=["']([^"']+)["']/i);
            if (srcMatch && srcMatch[1]) {
                rawInput = srcMatch[1].trim();
            }
        }

        let embedHtml = `
            <div id="playerLoader" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.9); z-index: 10; transition: opacity 0.4s ease; transform: translateZ(0);">
                <div style="width: 45px; height: 45px; border: 3px solid rgba(255,255,255,0.15); border-top-color: #fff; border-radius: 50%; animation: playerSpin 0.8s infinite linear;"></div>
            </div>
            <style>@keyframes playerSpin { to { transform: rotate(360deg); } }</style>`;

        const ytMatch = rawInput.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        
        if (ytMatch && ytMatch[1]) {
            embedHtml += `<iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&playsinline=1" style="width:100%;height:100%;border:0;border-radius:20px;transform:translateZ(0);will-change:transform;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen onload="document.getElementById('playerLoader').style.display='none';"></iframe>`;
        } else if (rawInput.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || rawInput.includes('.m3u8')) {
            // Robust direct video stream & HLS player with full mobile support & hardware acceleration
            embedHtml += `<video src="${rawInput}" controls autoplay playsinline webkit-playsinline muted style="width:100%;height:100%;border-radius:20px;object-fit:contain;touch-action:manipulation;transform:translateZ(0);will-change:transform;" onloadeddata="document.getElementById('playerLoader').style.display='none';"></video>`;
        } else {
            embedHtml += `<iframe src="${rawInput}" style="width:100%;height:100%;border:0;border-radius:20px;transform:translateZ(0);will-change:transform;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen onload="document.getElementById('playerLoader').style.display='none';"></iframe>`;
        }
        
        container.innerHTML = `<div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 20px; overflow: hidden; -webkit-overflow-scrolling: touch; transform: translateZ(0);">${embedHtml}</div>`;
    }
};
