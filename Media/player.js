class StreamPlayer {
    static renderPlayer(containerId, url) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let embedHtml = '';

        if (!url) {
            container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">No video source provided</div>`;
            return;
        }

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let ytId = '';
            if (url.includes('embed/')) ytId = url.split('embed/')[1].split('?')[0];
            else if (url.includes('watch?v=')) ytId = url.split('watch?v=')[1].split('&')[0];
            else if (url.includes('youtu.be/')) ytId = url.split('youtu.be/')[1].split('?')[0];

            if (ytId) {
                embedHtml = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>`;
            }
        } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
            embedHtml = `<video src="${url}" controls autoplay style="width:100%;height:100%;object-fit:contain;"></video>`;
        } else {
            embedHtml = `<iframe src="${url}" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>`;
        }

        container.innerHTML = embedHtml;
    }
}
