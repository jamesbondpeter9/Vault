const VideoPlayer = {
    init(containerId, stream) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const rawInput = (stream.url || '').trim();
        let embedHtml = `
            <div id="playerLoader" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.9); z-index: 10; transition: opacity 0.4s ease;">
                <div style="width: 45px; height: 45px; border: 3px solid rgba(255,255,255,0.15); border-top-color: #fff; border-radius: 50%; animation: playerSpin 0.8s infinite linear;"></div>
            </div>
            <style>@keyframes playerSpin { to { transform: rotate(360deg); } }</style>`;

        const ytMatch = rawInput.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch && ytMatch[1]) {
            embedHtml += `<iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1" style="width:100%;height:100%;border:0;border-radius:20px;" allow="autoplay; encrypted-media" allowfullscreen onload="document.getElementById('playerLoader').style.display='none';"></iframe>`;
        } else {
            embedHtml += `<iframe src="${rawInput}" style="width:100%;height:100%;border:0;border-radius:20px;" allowfullscreen onload="document.getElementById('playerLoader').style.display='none';"></iframe>`;
        }
        container.innerHTML = `<div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 20px; overflow: hidden;">${embedHtml}</div>`;
    }
};
