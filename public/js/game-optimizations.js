// Game optimizations and fixes

// 1. Fix setAvailableColors error
if (typeof setAvailableColors === 'undefined') {
  let availableColors = [];
  
  // Create a proxy to track changes to availableColors
  const availableColorsHandler = {
    set: function(target, property, value) {
      target[property] = value;
      // Trigger any necessary updates when colors change
      if (typeof onColorsUpdated === 'function') {
        onColorsUpdated(target);
      }
      return true;
    }
  };
  
  // Create the proxy
  window.availableColors = new Proxy(availableColors, availableColorsHandler);
  
  // Define setter function
  window.setAvailableColors = function(colors) {
    if (Array.isArray(colors)) {
      window.availableColors.length = 0;
      window.availableColors.push(...colors);
    }
  };
}

// 2. Video playback and color switching
let videoElement = null;
let currentVideoSrc = '';
let isPlaying = false;

function initializeVideoPlayer() {
  // Find or create video element
  videoElement = document.querySelector('video');
  
  if (!videoElement) {
    videoElement = document.createElement('video');
    videoElement.playsInline = true;
    videoElement.preload = 'auto';
    videoElement.controls = false;
    videoElement.style.display = 'none';
    document.body.appendChild(videoElement);
  }
  
  // Set initial attributes
  videoElement.setAttribute('playsinline', '');
  videoElement.muted = false;
  videoElement.autoplay = true;
  
  // Handle video end event
  videoElement.onended = handleVideoEnd;
  
  // Handle video errors
  videoElement.onerror = function() {
    console.error('Video playback error:', videoElement.error);
    // Try to recover by loading the next color
    setTimeout(handleVideoEnd, 1000);
  };
  
  return videoElement;
}

// 3. Handle video end event
function handleVideoEnd() {
  if (typeof gameState === 'undefined' || gameState !== 'playing') return;
  
  // Always play GREEN after every color
  playColor('green');

  setTimeout(() => {
    const otherColors = COLORS ? 
      COLORS.filter(c => c !== 'green') : 
      ['red', 'blue', 'yellow', 'pink', 'purple', 'white', 'black'];
    
    if (otherColors.length > 0) {
      const next = otherColors[Math.floor(Math.random() * otherColors.length)];
      playColor(next);
    }
  }, 2000);
}

// 4. Play color with video optimization
async function playColor(color) {
  if (!videoElement) {
    videoElement = initializeVideoPlayer();
  }

  const videoBase = `/videos/${color}`;
  const videoSrcs = [
    { src: `${videoBase}.webm`, type: 'video/webm' },
    { src: `${videoBase}_optimized.mp4`, type: 'video/mp4' }
  ];

  // Skip if already playing this video
  const newVideoSrc = videoSrcs[0].src;
  if (currentVideoSrc === newVideoSrc && isPlaying) {
    return;
  }

  try {
    // Clean up previous video
    if (videoElement.src) {
      videoElement.pause();
      videoElement.removeAttribute('src');
      videoElement.load();
      await new Promise(resolve => videoElement.onemptied = resolve);
    }

    // Clear existing sources
    while (videoElement.firstChild) {
      videoElement.removeChild(videoElement.firstChild);
    }

    // Add video sources
    videoSrcs.forEach(({ src, type }) => {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      videoElement.appendChild(source);
    });

    currentVideoSrc = newVideoSrc;
    isPlaying = false;

    // Load the video
    await videoElement.load();

    // Try to play with sound
    try {
      videoElement.muted = false;
      await videoElement.play();
      isPlaying = true;
    } catch (error) {
      console.warn('Autoplay with sound failed, trying muted:', error);
      // If autoplay with sound fails, try muted
      videoElement.muted = true;
      await videoElement.play();
      isPlaying = true;
    }

    // Add error handling
    videoElement.onerror = () => {
      console.error('Video playback error:', videoElement.error);
      // Try to recover by loading the next color
      setTimeout(handleVideoEnd, 1000);
    };

    // Notify the game that the color has changed
    if (typeof onColorChanged === 'function') {
      onColorChanged(color);
    }
  } catch (error) {
    console.error('Error playing video:', error);
    // If all else fails, try the next color
    setTimeout(handleVideoEnd, 1000);
  }
}

// 5. Timer implementation
let timerInterval = null;
let endTime = 0;

function startTimer(durationInMinutes, onTick, onEnd) {
  // Clear any existing timer
  stopTimer();
  
  const durationInSeconds = durationInMinutes * 60;
  endTime = Date.now() + (durationInSeconds * 1000);
  
  // Update immediately
  updateTimer(onTick, onEnd);
  
  // Update every second
  timerInterval = setInterval(() => updateTimer(onTick, onEnd), 1000);
}

function updateTimer(onTick, onEnd) {
  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
  
  if (onTick) {
    onTick(remaining);
  }
  
  if (remaining <= 0) {
    stopTimer();
    if (onEnd) onEnd();
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// 6. Performance optimizations
function applyPerformanceOptimizations() {
  // Force hardware acceleration
  const style = document.createElement('style');
  style.textContent = `
    video { 
      will-change: transform; 
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
      -moz-transform: translateZ(0);
      -ms-transform: translateZ(0);
      -o-transform: translateZ(0);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      -webkit-perspective: 1000;
      -webkit-transform: translate3d(0,0,0);
      -webkit-transform-style: preserve-3d;
    }
    
    /* Disable animations when tab is not active */
    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
  
  document.head.appendChild(style);
  
  // Disable console logs in production
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.log = function() {};
    console.warn = function() {};
    console.debug = function() {};
  }
}

// 7. Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Apply performance optimizations
  applyPerformanceOptimizations();
  
  // Initialize video player
  initializeVideoPlayer();
  
  // Expose functions to global scope
  window.playColor = playColor;
  window.startTimer = startTimer;
  window.stopTimer = stopTimer;
  
  console.log('Game optimizations applied');
});
