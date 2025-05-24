// Particle effects system for Grid Garden
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        
        this.initParticleTypes();
    }

    initParticleTypes() {
        this.particleTypes = {
            harvest: {
                count: 8,
                lifetime: 1000,
                speed: 2,
                gravity: 0.1,
                colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32'],
                size: 3,
                sparkle: true
            },
            score: {
                count: 3,
                lifetime: 1500,
                speed: 1,
                gravity: -0.05,
                colors: ['#00FF00', '#32CD32'],
                size: 4,
                text: true
            },
            placement: {
                count: 5,
                lifetime: 600,
                speed: 1.5,
                gravity: 0.05,
                colors: ['#90EE90', '#98FB98'],
                size: 2,
                sparkle: false
            },
            synergy: {
                count: 12,
                lifetime: 1200,
                speed: 2.5,
                gravity: 0,
                colors: ['#FF1493', '#FF69B4', '#FFB6C1', '#DDA0DD'],
                size: 4,
                sparkle: true,
                spiral: true
            }
        };
    }

    createParticles(type, x, y, data = {}) {
        const config = this.particleTypes[type];
        if (!config) return;

        for (let i = 0; i < config.count; i++) {
            const angle = (Math.PI * 2 * i) / config.count + Math.random() * 0.5;
            const velocity = config.speed * (0.5 + Math.random() * 0.5);
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: config.lifetime,
                maxLife: config.lifetime,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                size: config.size * (0.8 + Math.random() * 0.4),
                type: type,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                ...data
            };

            // Special properties based on type
            if (config.spiral) {
                particle.spiralAngle = angle;
                particle.spiralRadius = 0;
            }

            if (config.text && data.text) {
                particle.text = data.text;
                particle.fontSize = 16;
            }

            this.particles.push(particle);
        }
    }

    update(deltaTime) {
        // Update screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            const progress = this.screenShake.duration / this.screenShake.intensity;
            this.screenShake.x = (Math.random() - 0.5) * progress * 8;
            this.screenShake.y = (Math.random() - 0.5) * progress * 8;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const config = this.particleTypes[particle.type];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Apply gravity
            particle.vy += config.gravity;
            
            // Special movement patterns
            if (config.spiral) {
                particle.spiralAngle += 0.1;
                particle.spiralRadius += 0.5;
                particle.x += Math.cos(particle.spiralAngle) * particle.spiralRadius * 0.02;
                particle.y += Math.sin(particle.spiralAngle) * particle.spiralRadius * 0.02;
            }
            
            // Update rotation
            particle.rotation += particle.rotationSpeed;
            
            // Update life
            particle.life -= deltaTime;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        this.ctx.save();
        
        // Apply screen shake
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        for (const particle of this.particles) {
            const config = this.particleTypes[particle.type];
            const alpha = particle.life / particle.maxLife;
            
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            this.ctx.globalAlpha = alpha;
            
            if (particle.text) {
                // Render text particle
                this.ctx.fillStyle = particle.color;
                this.ctx.font = `bold ${particle.fontSize}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(particle.text, 0, 0);
                
                // Add outline for better visibility
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText(particle.text, 0, 0);
            } else {
                // Render regular particle
                this.ctx.fillStyle = particle.color;
                
                if (config.sparkle) {
                    // Star shape for sparkle effect
                    this.drawStar(0, 0, particle.size, particle.size * 0.4, 5);
                } else {
                    // Circle
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }

    drawStar(x, y, outerRadius, innerRadius, points) {
        this.ctx.beginPath();
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }

    // Public methods for creating effects
    harvestEffect(x, y) {
        this.createParticles('harvest', x, y);
        this.screenShake.intensity = 200;
        this.screenShake.duration = 200;
    }

    scoreEffect(x, y, points) {
        this.createParticles('score', x, y, { text: `+${points}` });
    }

    placementEffect(x, y) {
        this.createParticles('placement', x, y);
    }

    synergyEffect(x, y) {
        this.createParticles('synergy', x, y);
    }

    clear() {
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    }
}

// Enhanced UI animations
class UIAnimations {
    static animateElement(element, animation, duration = 300) {
        element.style.animation = `${animation} ${duration}ms ease-out`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    static pulseButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            this.animateElement(button, 'pulse');
        }
    }

    static flashScore(score) {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.style.color = '#FFD700';
            scoreElement.style.transform = 'scale(1.3)';
            scoreElement.style.textShadow = '0 0 10px #FFD700';
            
            setTimeout(() => {
                scoreElement.style.color = '';
                scoreElement.style.transform = '';
                scoreElement.style.textShadow = '';
            }, 400);
        }
    }

    static slideInElement(element, direction = 'right') {
        element.style.animation = `slideIn${direction.charAt(0).toUpperCase() + direction.slice(1)} 0.3s ease-out`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, 300);
    }

    static floatingText(text, x, y, color = '#FFD700') {
        const floatingDiv = document.createElement('div');
        floatingDiv.textContent = text;
        floatingDiv.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-weight: bold;
            font-size: 1.5rem;
            pointer-events: none;
            z-index: 1000;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            animation: floatUp 1.5s ease-out forwards;
        `;
        
        document.body.appendChild(floatingDiv);
        
        setTimeout(() => {
            if (floatingDiv.parentNode) {
                floatingDiv.parentNode.removeChild(floatingDiv);
            }
        }, 1500);
    }
}

// Global particle system (will be initialized with game)
let particleSystem; 