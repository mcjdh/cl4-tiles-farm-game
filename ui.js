// UI utility functions and enhancements
class UIManager {
    constructor() {
        this.setupTooltips();
        this.setupKeyboardShortcuts();
        this.setupResponsiveCanvas();
    }

    setupTooltips() {
        // Add helpful tooltips to UI elements
        this.addTooltip('endTurnBtn', 'Advance to next turn and grow crops');
        this.addTooltip('harvestBtn', 'Harvest all ready crops for points');
        this.addTooltip('gameCanvas', 'Click to place crops on your farm');
    }

    addTooltip(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.title = text;
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!window.game || window.game.gameOver) return;
            
            switch(e.key.toLowerCase()) {
                case ' ':
                case 'enter':
                    e.preventDefault();
                    window.game.endTurn();
                    break;
                case 'h':
                    e.preventDefault();
                    window.game.harvestAll();
                    break;
                case 'r':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        window.game.restart();
                    }
                    break;
            }
        });
    }

    setupResponsiveCanvas() {
        // Handle window resize for responsive design
        window.addEventListener('resize', () => {
            this.adjustCanvasSize();
        });
        
        this.adjustCanvasSize();
    }

    adjustCanvasSize() {
        const canvas = document.getElementById('gameCanvas');
        const container = document.querySelector('.game-area');
        
        if (canvas && container) {
            const containerWidth = container.clientWidth;
            const maxSize = Math.min(containerWidth - 20, 640); // 20px padding
            
            canvas.width = maxSize;
            canvas.height = maxSize;
            canvas.style.width = maxSize + 'px';
            canvas.style.height = maxSize + 'px';
            
            // Update grid cell size if game is initialized
            if (window.game && window.game.grid) {
                window.game.grid.cellSize = maxSize / window.game.grid.width;
            }
        }
    }

    // Animate UI elements
    static pulseElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.animation = 'pulse 0.3s ease-in-out';
            setTimeout(() => {
                element.style.animation = '';
            }, 300);
        }
    }

    static flashElement(elementId, color = '#FFD700') {
        const element = document.getElementById(elementId);
        if (element) {
            const originalColor = element.style.backgroundColor;
            element.style.backgroundColor = color;
            element.style.transition = 'background-color 0.3s';
            
            setTimeout(() => {
                element.style.backgroundColor = originalColor;
            }, 300);
        }
    }

    // Show floating score animation
    static showFloatingScore(points, x = 0, y = 0) {
        const floatingDiv = document.createElement('div');
        floatingDiv.textContent = `+${points}`;
        floatingDiv.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            color: #FFD700;
            font-weight: bold;
            font-size: 1.5rem;
            pointer-events: none;
            z-index: 1000;
            animation: floatUp 1s ease-out forwards;
        `;
        
        document.body.appendChild(floatingDiv);
        
        // Remove after animation
        setTimeout(() => {
            if (floatingDiv.parentNode) {
                floatingDiv.parentNode.removeChild(floatingDiv);
            }
        }, 1000);
    }

    // Display helpful tips
    static showTip(message, duration = 3000) {
        const tipDiv = document.createElement('div');
        tipDiv.textContent = message;
        tipDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(139, 69, 19, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(tipDiv);
        
        setTimeout(() => {
            tipDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (tipDiv.parentNode) {
                    tipDiv.parentNode.removeChild(tipDiv);
                }
            }, 300);
        }, duration);
    }

    // Update the design document checklist
    static updateDesignProgress() {
        const completedItems = [
            '✅ HTML5 Canvas setup',
            '✅ Game state management', 
            '✅ Grid data structure',
            '✅ Crop object system',
            '✅ Input handling (mouse/touch)',
            '✅ Basic grid and placement',
            '✅ Simple crop system',
            '✅ Turn mechanics',
            '✅ Basic scoring'
        ];
        
        console.log('🎯 Phase 1 Progress:');
        completedItems.forEach(item => console.log(item));
        console.log('\n📋 Ready for Phase 2: Full Gameplay!');
    }
}

// CSS animations (will be injected into the page)
const CSS_ANIMATIONS = `
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

@keyframes floatUp {
    0% {
        opacity: 1;
        transform: translateY(0);
    }
    100% {
        opacity: 0;
        transform: translateY(-50px);
    }
}

@keyframes slideInRight {
    0% {
        transform: translateX(100%);
        opacity: 0;
    }
    100% {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    0% {
        transform: translateX(0);
        opacity: 1;
    }
    100% {
        transform: translateX(100%);
        opacity: 0;
    }
}

/* Button hover effects enhancement */
.btn-primary:active, .btn-secondary:active {
    transform: translateY(0) !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
}

/* Ready crop glow effect */
@keyframes cropGlow {
    0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
    50% { box-shadow: 0 0 15px rgba(255, 215, 0, 0.6); }
}

.crop-ready {
    animation: cropGlow 2s ease-in-out infinite;
}
`;

// Inject CSS animations
function injectAnimationCSS() {
    const style = document.createElement('style');
    style.textContent = CSS_ANIMATIONS;
    document.head.appendChild(style);
}

// Initialize UI manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    injectAnimationCSS();
    const uiManager = new UIManager();
    
    // Show initial tip or help for new players
    setTimeout(() => {
        const hasPlayedBefore = localStorage.getItem('harvestTacticsPlayed');
        if (!hasPlayedBefore) {
            // First time player - show help modal
            setTimeout(() => {
                if (window.game) {
                    window.game.showHelp();
                    localStorage.setItem('harvestTacticsPlayed', 'true');
                }
            }, 2000);
        } else {
            // Returning player - show quick tip
            UIManager.showTip('Click the ❓ Help button if you need a refresher!', 4000);
        }
    }, 1000);
    
    // Update design progress
    setTimeout(() => {
        UIManager.updateDesignProgress();
    }, 2000);
}); 