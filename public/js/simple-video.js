// Simple Video Player with autoplay handling
class SimpleVideoPlayer {
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
      },
      intro: {
        webm: '/videos/intro.webm',
        mp4: '/videos/intro_optimized.mp4',
        poster: '/videos/intro-poster.jpg'
      },
      closing: {
        webm: '/videos/closing.webm',
        mp4: '/videos/closing_optimized.mp4',
        poster: '/videos/closing-poster.jpg'
      }
    };
    
    this.videoElement = null;
    this.currentVideo = null;
    this.isPlaying = false;
    this.hasUserInteracted = false;
    
    this.initialize();
  }
  
  initialize() {
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.id = 'video-player';
    this.videoElement.playsInline = true;
    this.videoElement.muted = true; // Start muted for autoplay
    this.videoElement.preload = 'auto';
    this.videoElement.style.display = 'none';
    document.body.appendChild(this.videoElement);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Handle user interaction for audio
    const handleUserInteraction = () => {
      if (!this.hasUserInteracted) {
        this.hasUserInteracted = true;
        // Try to unmute after user interaction
        this.videoElement.muted = false;
      }
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    // Video error handling
    this.videoElement.addEventListener('error', (e) => {
      console.error('Video error:', this.videoElement.error);
      this.handleVideoError();
    });
    
    // Video end handling
    this.videoElement.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.onVideoEnd) {
        this.onVideoEnd();
      }
    });
  }
  
  async playVideo(color) {
    if (!this.videoElement || !this.videoConfig[color]) return false;
    
    const videoInfo = this.videoConfig[color];
    
    try {
      // Pause current video if playing
      if (this.isPlaying) {
        this.videoElement.pause();
      }
      
      // Clear current sources
      while (this.videoElement.firstChild) {
        this.videoElement.removeChild(this.videoElement.firstChild);
      }
      
      // Add WebM source (preferred)
      const webmSource = document.createElement('source');
      webmSource.src = videoInfo.webm;
      webmSource.type = 'video/webm';
      this.videoElement.appendChild(webmSource);
      
      // Add MP4 fallback
      const mp4Source = document.createElement('source');
      mp4Source.src = videoInfo.mp4;
      mp4Source.type = 'video/mp4';
      this.videoElement.appendChild(mp4Source);
      
      // Set poster if available
      if (videoInfo.poster) {
        this.videoElement.poster = videoInfo.poster;
      }
      
      // Show the video
      this.videoElement.style.display = 'block';
      
      // Load the video
      await this.videoElement.load();
      
      // Try to play the video
      try {
        await this.videoElement.play();
        this.isPlaying = true;
        this.currentVideo = color;
        return true;
      } catch (playError) {
        console.warn('Autoplay failed, trying muted:', playError);
        
        // If autoplay failed, try muted
        try {
          this.videoElement.muted = true;
          await this.videoElement.play();
          this.isPlaying = true;
          this.currentVideo = color;
          return true;
        } catch (mutedError) {
          console.error('Muted autoplay also failed:', mutedError);
          throw mutedError;
        }
      }
    } catch (error) {
      console.error(`Error playing video ${color}:`, error);
      this.handleVideoError();
      return false;
    }
  }
  
  pauseVideo() {
    if (this.videoElement && this.isPlaying) {
      this.videoElement.pause();
      this.isPlaying = false;
    }
  }
  
  stopVideo() {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.currentTime = 0;
      this.isPlaying = false;
      this.videoElement.style.display = 'none';
    }
  }
  
  handleVideoError() {
    console.error('Video playback error');
    this.stopVideo();
    
    // Try to play the next available video
    const colors = Object.keys(this.videoConfig);
    const currentIndex = colors.indexOf(this.currentVideo);
    const nextIndex = (currentIndex + 1) % colors.length;
    
    if (colors[nextIndex]) {
      console.log(`Trying to play next video: ${colors[nextIndex]}`);
      this.playVideo(colors[nextIndex]).catch(console.error);
    }
  }
}

// Initialize the video player
document.videoPlayer = new SimpleVideoPlayer();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = document.videoPlayer;
}
