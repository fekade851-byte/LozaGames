class VideoOptimizer {
  constructor() {
    this.videoConfig = {
      red: { 
        webm: '/videos/red.webm',
        mp4: '/videos/red_optimized.mp4',
        poster: '/videos/red-poster.jpg' 
      },
      blue: { 
        webm: '/videos/blue.webm',
        mp4: '/videos/blue_optimized.mp4',
        poster: '/videos/blue-poster.jpg' 
      },
      green: { 
        webm: '/videos/green.webm',
        mp4: '/videos/green_optimized.mp4',
        poster: '/videos/green-poster.jpg' 
      },
      yellow: { 
        webm: '/videos/yellow.webm',
        mp4: '/videos/yellow_optimized.mp4',
        poster: '/videos/yellow-poster.jpg' 
      },
      pink: { 
        webm: '/videos/pink.webm',
        mp4: '/videos/pink_optimized.mp4',
        poster: '/videos/pink-poster.jpg' 
      },
      purple: { 
        webm: '/videos/purple.webm',
        mp4: '/videos/purple_optimized.mp4',
        poster: '/videos/purple-poster.jpg' 
      },
      white: { 
        webm: '/videos/white.webm',
        mp4: '/videos/white_optimized.mp4',
        poster: '/videos/white-poster.jpg' 
      },
      black: { 
        webm: '/videos/black.webm',
        mp4: '/videos/black_optimized.mp4',
        poster: '/videos/black-poster.jpg' 
      }
    };
    
    // Initialize video element if it doesn't exist
    this.videoElement = document.getElementById('video-player');
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.videoElement.id = 'video-player';
      this.videoElement.playsInline = true;
      this.videoElement.muted = true; // Start muted for autoplay
      this.videoElement.preload = 'auto';
      document.body.appendChild(this.videoElement);
    }
    
    this.isPlaying = false;
    this.currentColor = null;
    this.hasUserInteracted = false;
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.checkConnection();
    
    // Set up video element with default settings
    this.videoElement.controls = false;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true; // Start muted for autoplay
    
    // Set up error handling
    this.videoElement.addEventListener('error', (e) => {
      console.error('Video error:', this.videoElement.error);
      this.handleVideoError();
    });
    
    // Set up play/pause handling
    this.videoElement.addEventListener('play', () => {
      this.isPlaying = true;
    });
    
    this.videoElement.addEventListener('pause', () => {
      this.isPlaying = false;
    });
    
    // Set up ended event
    this.videoElement.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.onVideoEnd) {
        this.onVideoEnd();
      }
    });
    
    // Show the first video by default
    const firstColor = Object.keys(this.videoConfig)[0];
    if (firstColor) {
      this.loadVideo(firstColor);
    }
  }
  
  setupEventListeners() {
    // Handle user interaction for audio
    const handleUserInteraction = () => {
      if (!this.hasUserInteracted) {
        this.hasUserInteracted = true;
        // Try to unmute after user interaction
        this.videoElement.muted = false;
        // Try to play again with sound
        this.playCurrentVideo().catch(console.error);
      }
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    // Play button click handler
    if (this.playButton) {
      this.playButton.addEventListener('click', () => this.togglePlay());
    }
    
    // Video click handler for toggling play/pause
    if (this.videoElement) {
      this.videoElement.addEventListener('click', () => this.togglePlay());
      this.videoElement.addEventListener('play', () => this.onVideoPlay());
      this.videoElement.addEventListener('pause', () => this.onVideoPause());
      this.videoElement.addEventListener('ended', () => this.onVideoEnded());
      this.videoElement.addEventListener('waiting', () => this.onVideoBuffering());
      this.videoElement.addEventListener('playing', () => this.onVideoPlaying());
    }
    
    // Handle color selection
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const color = e.currentTarget.dataset.color;
        if (color) {
          this.loadVideo(color);
        }
      });
    });
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onPageHidden();
      } else {
        this.onPageVisible();
      }
    });
  }
  
  checkConnection() {
    // Check connection type and adjust video quality
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      if (connection) {
        const saveData = connection.saveData;
        const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g', etc.
        
        console.log(`Connection type: ${effectiveType}, Save data: ${saveData}`);
        
        // Adjust video quality based on connection
        this.adjustVideoQuality(effectiveType, saveData);
        
        // Listen for changes in connection
        connection.addEventListener('change', () => {
          this.adjustVideoQuality(connection.effectiveType, connection.saveData);
        });
      }
    }
  }
  
  adjustVideoQuality(effectiveType, saveData) {
    if (!this.videoElement) return;
    
    // If save data is enabled, use lower quality
    if (saveData) {
      this.videoElement.src = this.getVideoSource('low');
      return;
    }
    
    // Adjust quality based on connection type
    switch (effectiveType) {
      case '4g':
        this.videoElement.src = this.getVideoSource('high');
        break;
      case '3g':
      case '2g':
      case 'slow-2g':
        this.videoElement.src = this.getVideoSource('medium');
        break;
      default:
        this.videoElement.src = this.getVideoSource('low');
    }
    
    // Load the new source
    this.videoElement.load();
  }
  
  getVideoSource(quality) {
    // This is a simplified example. In a real app, you would have different
    // quality versions of each video and return the appropriate one.
    const currentSrc = this.videoElement?.currentSrc || '';
    const baseUrl = currentSrc.split('/').slice(0, -1).join('/');
    const currentFile = currentSrc.split('/').pop() || '';
    
    // Example: video.mp4 -> video-480p.mp4, video-720p.mp4, etc.
    if (quality === 'high') {
      return currentFile.replace(/(\.[\w\d]+)$/, '-720p$1');
    } else if (quality === 'medium') {
      return currentFile.replace(/(\.[\w\d]+)$/, '-480p$1');
    } else {
      return currentFile.replace(/(\.[\w\d]+)$/, '-360p$1');
    }
  }
  
  lazyLoadVideos() {
    // Use Intersection Observer to lazy load videos
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          const source = video.querySelector('source[data-src]');
          
          if (source) {
            source.src = source.dataset.src;
            video.load();
            observer.unobserve(video);
          }
        }
      });
    }, {
      rootMargin: '200px',
      threshold: 0.1
    });
    
    // Observe all video elements with data-src attribute
    document.querySelectorAll('video[data-src]').forEach(video => {
      observer.observe(video);
    });
  }
  
  loadVideo(color) {
    if (!this.videoElement || !this.videoConfig[color]) return;
    
    const { video, poster } = this.videoConfig[color];
    const videoPath = `/videos/${video}`;
    const posterPath = `/videos/${poster}`;
    
    // Show loading state
    this.showLoading();
    
    // Preload the video
    this.preloadVideo(videoPath)
      .then(() => {
        // Update video source
        this.videoElement.src = videoPath;
        this.videoElement.poster = posterPath;
        
        // Hide loading state
        this.hideLoading();
        
        // Show poster and play button
        this.showPoster();
      })
      .catch(error => {
        console.error('Error loading video:', error);
        this.hideLoading();
        this.showError('Failed to load video. Please try again.');
      });
  }
  
  async preloadVideo(url) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve();
      };
      
      video.onerror = () => {
        reject(new Error(`Failed to load video: ${url}`));
      };
      
      video.src = url;
    });
  }
  
  togglePlay() {
    if (!this.videoElement) return;
    
    if (this.videoElement.paused) {
      this.videoElement.play().catch(error => {
        console.error('Error playing video:', error);
      });
    } else {
      this.videoElement.pause();
    }
  }
  
  showLoading() {
    // Show loading spinner or animation
    this.videoContainer?.classList.add('loading');
  }
  
  hideLoading() {
    // Hide loading spinner or animation
    this.videoContainer?.classList.remove('loading');
  }
  
  showPoster() {
    this.posterElement?.classList.remove('hidden');
    this.playButton?.classList.remove('hidden');
  }
  
  hidePoster() {
    this.posterElement?.classList.add('hidden');
    this.playButton?.classList.add('hidden');
  }
  
  showError(message) {
    // Show error message to the user
    console.error(message);
    // You can implement a proper error UI here
  }
  
  onVideoPlay() {
    this.hidePoster();
    this.playButton?.classList.add('playing');
  }
  
  onVideoPause() {
    if (!this.videoElement.ended) {
      this.showPoster();
    }
    this.playButton?.classList.remove('playing');
  }
  
  onVideoEnded() {
    this.showPoster();
    this.playButton?.classList.remove('playing');
  }
  
  onVideoBuffering() {
    this.showLoading();
  }
  
  onVideoPlaying() {
    this.hideLoading();
  }
  
  onPageHidden() {
    // Pause video when page is hidden
    if (this.videoElement && !this.videoElement.paused) {
      this.videoElement.pause();
    }
  }
  
  onPageVisible() {
    // Resume video if it was playing
    if (this.videoElement && this.videoElement.paused && this.videoElement.currentTime > 0) {
      this.videoElement.play().catch(error => {
        console.error('Error resuming video:', error);
      });
    }
  }
}

// Initialize the video optimizer when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if service worker is supported
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                this.showUpdateNotification();
              }
            });
          });
        })
        .catch(error => {
          console.error('ServiceWorker registration failed: ', error);
        });
    });
  }
  
  // Initialize video optimizer
  window.videoOptimizer = new VideoOptimizer();
});

// Show update notification
function showUpdateNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('Update Available', {
      body: 'A new version of Loza Games is available. Click to update.',
      icon: '/icon/icon-192x192.png',
      tag: 'update-available'
    });
    
    notification.onclick = () => {
      window.location.reload();
    };
  } else if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // Fallback to a custom notification
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
      <div class="update-content">
        <p>A new version is available!</p>
        <button id="update-button">Update Now</button>
      </div>
    `;
    
    document.body.appendChild(updateBanner);
    
    document.getElementById('update-button').addEventListener('click', () => {
      const worker = navigator.serviceWorker.controller;
      if (worker) {
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });
  }
}

// Listen for messages from service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'SW_UPDATED') {
      console.log('Service Worker updated:', event.data.version);
      showUpdateNotification();
    }
  });
}
