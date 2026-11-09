/**
 * Inbuilt Professional Photo Viewer JS
 * Features: Scroll zoom, free panning/dragging, keyboard navigation (Left/Right/Esc),
 * mobile landscape auto-rotation, and crisp pixel optimization.
 */

let currentViewerIndex = 0;
let currentScale = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

// Inject the viewer modal HTML structure dynamically if it doesn't exist
function initPhotoViewerDOM() {
    if (document.getElementById('inbuiltPhotoModal')) return;

    const modalHTML = `
    <div id="inbuiltPhotoModal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; background: rgba(0, 0, 0, 0.95); z-index: 99999; display: none; align-items: center; justify-content: center; overflow: hidden; user-select: none; box-sizing: border-box;">
        <button class="viewer-close-btn" onclick="closeInbuiltModal()" style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 24px; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 20;">&times;</button>
        <div class="viewer-nav-left" onclick="navigateViewer(-1)" style="position: absolute; top: 0; bottom: 0; left: 0; width: 50%; z-index: 10; cursor: pointer;"></div>
        <div class="viewer-nav-right" onclick="navigateViewer(1)" style="position: absolute; top: 0; bottom: 0; right: 0; width: 50%; z-index: 10; cursor: pointer;"></div>
        <div class="viewer-content-wrapper" id="viewerContentWrapper" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; touch-action: none;">
            <img id="viewerImageElement" class="viewer-image" src="" alt="Full View" style="max-width: 100%; max-height: 100%; object-fit: contain; cursor: grab; transform-origin: center center; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; will-change: transform;">
        </div>
        <div id="viewerTitleElement" class="viewer-title-bar" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); padding: 8px 16px; border-radius: 20px; color: #fff; font-size: 0.9rem; z-index: 20; pointer-events: none; max-width: 80%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup Event Listeners after DOM injection
    const viewerImg = document.getElementById('viewerImageElement');
    const wrapper = document.getElementById('viewerContentWrapper');

    // Scroll Zooming (Windows Photo Viewer style)
    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = 1.15;
        const oldScale = currentScale;
        
        if (e.deltaY < 0) {
            currentScale = Math.min(currentScale * zoomFactor, 10);
        } else {
            currentScale = Math.max(currentScale / zoomFactor, 1);
        }

        if (currentScale === 1) {
            panX = 0;
            panY = 0;
        } else {
            const rect = wrapper.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = e.clientY - rect.top - rect.height / 2;
            panX = mouseX - (mouseX - panX) * (currentScale / oldScale);
            panY = mouseY - (mouseY - panY) * (currentScale / oldScale);
        }
        updateImageTransform();
    }, { passive: false });

    // Mouse Dragging / Panning when zoomed
    viewerImg.addEventListener('mousedown', (e) => {
        if (currentScale > 1) {
            isDragging = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            e.stopPropagation();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateImageTransform();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch Support for Mobile Panning
    let touchStartX = 0;
    let touchStartY = 0;
    viewerImg.addEventListener('touchstart', (e) => {
        if (currentScale > 1 && e.touches.length === 1) {
            isDragging = true;
            touchStartX = e.touches[0].clientX - panX;
            touchStartY = e.touches[0].clientY - panY;
        }
    });

    viewerImg.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        panX = e.touches[0].clientX - touchStartX;
        panY = e.touches[0].clientY - touchStartY;
        updateImageTransform();
    });

    viewerImg.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Keyboard Navigation (Arrow Keys & Escape)
    window.addEventListener('keydown', (e) => {
        const modal = document.getElementById('inbuiltPhotoModal');
        if (!modal || !modal.classList.contains('active')) return;

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateViewer(1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateViewer(-1);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeInbuiltModal();
        }
    });
}

function updateImageTransform() {
    const viewerImg = document.getElementById('viewerImageElement');
    if (!viewerImg) return;
    const rot = viewerImg.classList.contains('mobile-landscape-rotate') ? ' rotate(90deg)' : '';
    viewerImg.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})${rot}`;
}

// Global hook to open photo viewer from data inputs
function openPhotoviewer(url, title, index = 0) {
    initPhotoViewerDOM();
    currentViewerIndex = index;
    currentScale = 1;
    panX = 0;
    panY = 0;

    const modal = document.getElementById('inbuiltPhotoModal');
    const viewerImg = document.getElementById('viewerImageElement');
    const viewerTitle = document.getElementById('viewerTitleElement');

    viewerImg.classList.remove('mobile-landscape-rotate');
    viewerImg.style.transform = 'scale(1) translate(0px, 0px)';
    viewerImg.src = url;
    viewerTitle.textContent = title || 'Photo';
    modal.classList.add('active');

    // Auto-rotate landscape images on mobile
    if (window.innerWidth <= 900) {
        const tempImg = new Image();
        tempImg.onload = () => {
            if (tempImg.naturalWidth > tempImg.naturalHeight) {
                viewerImg.classList.add('mobile-landscape-rotate');
            }
        };
        tempImg.src = url;
    }
}

function closeInbuiltModal() {
    const modal = document.getElementById('inbuiltPhotoModal');
    if (modal) modal.classList.remove('active');
    const viewerImg = document.getElementById('viewerImageElement');
    if (viewerImg) viewerImg.src = '';
    currentScale = 1;
    panX = 0;
    panY = 0;
}

function navigateViewer(direction) {
    if (!window.folderImagesList || window.folderImagesList.length === 0) return;
    currentViewerIndex += direction;
    if (currentViewerIndex < 0) {
        currentViewerIndex = window.folderImagesList.length - 1;
    } else if (currentViewerIndex >= window.folderImagesList.length) {
        currentViewerIndex = 0;
    }
    const photo = window.folderImagesList[currentViewerIndex];
    if (photo) {
        const url = photo.thumbnail || photo.url;
        openPhotoviewer(url, photo.title, currentViewerIndex);
    }
}
