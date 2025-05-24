// Audio system for Grid Garden
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.volume = 0.3;
        this.enabled = true;
        
        this.initAudioContext();
        this.generateSounds();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
            this.enabled = false;
        }
    }

    // Generate procedural sound effects
    generateSounds() {
        if (!this.enabled) return;

        // Crop placement sound - soft thud
        this.sounds.place = () => this.playTone(220, 0.1, 'sine', 0.3);
        
        // Harvest sound - satisfying chime
        this.sounds.harvest = () => {
            this.playTone(523, 0.15, 'sine', 0.4); // C5
            setTimeout(() => this.playTone(659, 0.15, 'sine', 0.3), 50); // E5
            setTimeout(() => this.playTone(784, 0.2, 'sine', 0.2), 100); // G5
        };
        
        // Turn advance - whoosh
        this.sounds.turn = () => {
            const freq = 150;
            this.playTone(freq, 0.3, 'sawtooth', 0.2, (gain, time) => {
                gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            });
        };
        
        // Button click - soft tick
        this.sounds.click = () => this.playTone(800, 0.05, 'square', 0.1);
        
        // Score gain - positive ding
        this.sounds.score = () => {
            this.playTone(880, 0.1, 'sine', 0.3); // A5
            setTimeout(() => this.playTone(1047, 0.15, 'sine', 0.2), 75); // C6
        };
        
        // Game over - descending notes
        this.sounds.gameOver = () => {
            this.playTone(523, 0.3, 'sine', 0.3); // C5
            setTimeout(() => this.playTone(466, 0.3, 'sine', 0.3), 200); // Bb4
            setTimeout(() => this.playTone(392, 0.4, 'sine', 0.3), 400); // G4
            setTimeout(() => this.playTone(330, 0.5, 'sine', 0.3), 600); // E4
        };
        
        // Growth sound - gentle pop
        this.sounds.grow = () => this.playTone(440, 0.08, 'sine', 0.15);
        
        // Synergy bonus - magical sparkle
        this.sounds.synergy = () => {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.playTone(1320 + (i * 220), 0.1, 'sine', 0.15);
                }, i * 50);
            }
        };
    }

    playTone(frequency, duration, waveType = 'sine', volume = 0.3, customEnvelope = null) {
        if (!this.enabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = waveType;
            
            const now = this.audioContext.currentTime;
            const adjustedVolume = volume * this.volume;
            
            if (customEnvelope) {
                gainNode.gain.setValueAtTime(adjustedVolume, now);
                customEnvelope(gainNode.gain, now);
            } else {
                // Default envelope: quick attack, exponential decay
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(adjustedVolume, now + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            }
            
            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            console.log('Audio playback error:', e);
        }
    }

    // Play specific sounds
    play(soundName, delay = 0) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        if (delay > 0) {
            setTimeout(() => this.sounds[soundName](), delay);
        } else {
            this.sounds[soundName]();
        }
    }

    // Resume audio context (required for user interaction)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Volume control
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // Toggle audio on/off
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // Background ambient sound (optional)
    playAmbient() {
        if (!this.enabled) return;
        
        // Gentle wind sound every 5-8 seconds
        const playWind = () => {
            if (this.enabled && Math.random() < 0.3) {
                this.playTone(80 + Math.random() * 40, 2, 'sawtooth', 0.05, (gain, time) => {
                    gain.linearRampToValueAtTime(0.05 * this.volume, time + 0.5);
                    gain.linearRampToValueAtTime(0.01, time + 1.5);
                });
            }
            setTimeout(playWind, 5000 + Math.random() * 3000);
        };
        
        setTimeout(playWind, 2000);
    }
}

// Global audio manager instance
let audioManager;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    audioManager = new AudioManager();
    
    // Resume audio context on first user interaction
    const resumeAudio = () => {
        audioManager.resume();
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
    };
    
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);
    
    // Start ambient sounds
    setTimeout(() => {
        audioManager.playAmbient();
    }, 3000);
});

// Export for global access
window.audioManager = audioManager; 