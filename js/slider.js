// ============================================================
//  SLIDER / AUTO SCROLL
// ============================================================

let sliderIntervals = [];

function initSliders() {
    const tracks = document.querySelectorAll('.product-track');
    tracks.forEach((track, index) => {
        const speed = index === 0 ? 0.5 : 0.8; // Special offers slower
        startAutoScroll(track, speed);
    });
}

function startAutoScroll(track, speed = 0.8) {
    if (!track || track.children.length < 2) return;

    let scrollAmount = 0;
    const step = 1;
    const maxScroll = track.scrollWidth - track.parentElement.clientWidth;

    function scroll() {
        if (maxScroll <= 0) return;
        scrollAmount += step;
        if (scrollAmount >= maxScroll) {
            scrollAmount = 0;
            track.style.transition = 'none';
            track.style.transform = 'translateX(0)';
            setTimeout(() => {
                track.style.transition = 'transform 0.5s ease';
            }, 50);
        } else {
            track.style.transform = `translateX(${-scrollAmount}px)`;
        }
    }

    const interval = setInterval(scroll, 30 / speed);
    sliderIntervals.push(interval);

    // Stop on hover
    track.parentElement.addEventListener('mouseenter', () => {
        clearInterval(interval);
    });
    track.parentElement.addEventListener('mouseleave', () => {
        const newInterval = setInterval(scroll, 30 / speed);
        sliderIntervals.push(newInterval);
    });

    // Reset on click
    track.parentElement.addEventListener('click', () => {
        scrollAmount = 0;
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        setTimeout(() => {
            track.style.transition = 'transform 0.5s ease';
        }, 50);
    });
}

// Initialize sliders when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSliders, 500);
});

// Stop all sliders (cleanup)
function stopAllSliders() {
    sliderIntervals.forEach(interval => clearInterval(interval));
    sliderIntervals = [];
}
