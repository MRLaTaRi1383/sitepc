// ============================================================
//  SLIDER - AUTO SCROLL
// ============================================================

let sliderIntervals = [];

function initSliders() {
    const tracks = document.querySelectorAll('.product-track');
    tracks.forEach((track) => {
        if (track.children.length < 2) return;
        startAutoScroll(track);
    });
}

function startAutoScroll(track) {
    let scrollAmount = 0;
    const step = 1;
    const maxScroll = track.scrollWidth - track.parentElement.clientWidth;
    
    if (maxScroll <= 0) return;

    function scroll() {
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

    const interval = setInterval(scroll, 40);
    sliderIntervals.push(interval);

    track.parentElement.addEventListener('mouseenter', () => {
        clearInterval(interval);
    });
    track.parentElement.addEventListener('mouseleave', () => {
        const newInterval = setInterval(scroll, 40);
        sliderIntervals.push(newInterval);
    });
}

function stopAllSliders() {
    sliderIntervals.forEach(interval => clearInterval(interval));
    sliderIntervals = [];
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSliders, 500);
});