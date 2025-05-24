// Main game state and logic
class HarvestTacticsGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.grid = new Grid(this.canvas);
        
        // Game state
        this.currentTurn = 0;
        this.maxTurns = 25;
        this.score = 0;
        this.gameOver = false;
        
        // Crop queue system
        this.currentCropType = null;
        this.nextCrops = [];
        
        this.init();
    }

    init() {
        // Set up initial crop queue
        this.generateInitialCrops();
        
        // Connect grid callbacks
        this.grid.onCropPlaced = (crop) => this.onCropPlaced(crop);
        
        // Set up UI event listeners
        this.setupUIEventListeners();
        
        // Track scoring for feedback
        this.lastHarvestDetails = [];
        
        // Start game loop
        this.gameLoop();
        
        console.log('🌾 Harvest Tactics initialized!');
    }

    generateInitialCrops() {
        // Generate current crop
        this.currentCropType = CropManager.getRandomCropType();
        this.grid.setSelectedCropType(this.currentCropType);
        
        // Generate next crops queue
        for (let i = 0; i < 3; i++) {
            this.nextCrops.push(CropManager.getRandomCropType());
        }
        
        this.updateCropUI();
    }

    setupUIEventListeners() {
        // End turn button
        document.getElementById('endTurnBtn').addEventListener('click', () => {
            this.endTurn();
        });
        
        // Harvest button
        document.getElementById('harvestBtn').addEventListener('click', () => {
            this.harvestAll();
        });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
        
        // Help button
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelp();
        });
        
        // Close help button
        document.getElementById('closeHelp').addEventListener('click', () => {
            this.hideHelp();
        });
        
        // Click outside modal to close
        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') {
                this.hideHelp();
            }
        });
    }

    onCropPlaced(crop) {
        console.log(`Planted ${crop.type.name}! Moving to next crop.`);
        
        // Move to next crop in queue
        this.advanceCropQueue();
        
        // Update UI
        this.updateCropUI();
        this.updateStatsUI();
        
        // Check if player should auto-advance turn
        if (this.shouldAutoAdvanceTurn()) {
            setTimeout(() => this.endTurn(), 500); // Small delay for better UX
        }
    }

    advanceCropQueue() {
        // Move to next crop
        if (this.nextCrops.length > 0) {
            this.currentCropType = this.nextCrops.shift();
            this.nextCrops.push(CropManager.getRandomCropType());
            this.grid.setSelectedCropType(this.currentCropType);
        }
    }

    shouldAutoAdvanceTurn() {
        // Auto-advance if current crop can't be placed anywhere
        if (!this.currentCropType) return false;
        
        for (let x = 0; x < this.grid.width; x++) {
            for (let y = 0; y < this.grid.height; y++) {
                if (CropManager.canPlaceCrop(this.grid, this.currentCropType, x, y)) {
                    return false; // Can still place somewhere
                }
            }
        }
        
        return true; // No valid placements left
    }

    endTurn() {
        if (this.gameOver) return;
        
        console.log(`Turn ${this.currentTurn + 1} ending...`);
        
        // Advance turn counter
        this.currentTurn++;
        
        // Grow all crops
        this.grid.advanceTurn();
        
        // Auto-harvest ready crops for points
        const harvestDetails = this.grid.harvestAllWithDetails();
        if (harvestDetails.totalScore > 0) {
            this.lastHarvestDetails = harvestDetails.details;
            this.addScore(harvestDetails.totalScore);
            this.updateScoreBreakdown();
            console.log(`Auto-harvested for ${harvestDetails.totalScore} points!`);
        }
        
        // Clean up harvested crops
        this.grid.clearHarvestedCrops();
        
        // Check for game over
        if (this.currentTurn >= this.maxTurns) {
            this.endGame();
        }
        
        // Update UI
        this.updateStatsUI();
        this.updateCropUI();
    }

    harvestAll() {
        const harvestDetails = this.grid.harvestAllWithDetails();
        if (harvestDetails.totalScore > 0) {
            this.lastHarvestDetails = harvestDetails.details;
            this.addScore(harvestDetails.totalScore);
            this.grid.clearHarvestedCrops();
            this.updateStatsUI();
            this.updateScoreBreakdown();
            console.log(`Manual harvest: ${harvestDetails.totalScore} points!`);
        }
    }

    addScore(points) {
        this.score += points;
        
        // Animate score increase (simple version)
        this.animateScoreIncrease(points);
    }

    animateScoreIncrease(points) {
        const scoreElement = document.getElementById('score');
        const originalText = scoreElement.textContent;
        
        // Flash effect
        scoreElement.style.color = '#FFD700';
        scoreElement.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            scoreElement.style.color = '';
            scoreElement.style.transform = '';
        }, 300);
    }

    endGame() {
        this.gameOver = true;
        console.log(`Game Over! Final Score: ${this.score}`);
        
        // Show game over screen
        document.getElementById('finalScore').textContent = this.score;
        this.updateFinalGameStats();
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // Save high score
        this.saveHighScore();
    }

    restart() {
        // Reset game state
        this.currentTurn = 0;
        this.score = 0;
        this.gameOver = false;
        
        // Clear grid
        this.grid.crops = [];
        
        // Generate new crops
        this.generateInitialCrops();
        
        // Hide game over screen
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Update UI
        this.updateStatsUI();
        this.updateCropUI();
        
        console.log('Game restarted!');
    }

    updateStatsUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('turns').textContent = this.maxTurns - this.currentTurn;
    }

    updateCropUI() {
        // Update current crop display
        const currentCropEl = document.getElementById('currentCrop');
        if (this.currentCropType) {
            currentCropEl.querySelector('.crop-icon').textContent = this.currentCropType.icon;
            currentCropEl.querySelector('.crop-name').textContent = this.currentCropType.name;
            currentCropEl.style.borderColor = this.currentCropType.color;
            
            // Update crop stats
            const size = `${this.currentCropType.size.width}×${this.currentCropType.size.height}`;
            const growth = this.currentCropType.growthTime === 0 ? 'Instant' : `${this.currentCropType.growthTime} turns`;
            const value = `${this.currentCropType.baseValue}${this.currentCropType.growthTime > 0 ? '+' + (this.currentCropType.growthTime * 2) : ''} pts`;
            
            document.getElementById('cropSize').textContent = size;
            document.getElementById('cropGrowth').textContent = growth;
            document.getElementById('cropValue').textContent = value;
        }
        
        // Update next crops queue
        const nextCropsEl = document.getElementById('nextCrops');
        nextCropsEl.innerHTML = '';
        
        for (const cropType of this.nextCrops) {
            const cropDiv = document.createElement('div');
            cropDiv.className = 'crop-preview small';
            cropDiv.innerHTML = `<div class="crop-icon">${cropType.icon}</div>`;
            cropDiv.style.borderColor = cropType.color;
            
            // Enhanced tooltip with stats
            const size = `${cropType.size.width}×${cropType.size.height}`;
            const growth = cropType.growthTime === 0 ? 'Instant' : `${cropType.growthTime} turns`;
            const value = `${cropType.baseValue}${cropType.growthTime > 0 ? '+' + (cropType.growthTime * 2) : ''} pts`;
            cropDiv.title = `${cropType.name}\nSize: ${size} | Growth: ${growth} | Value: ${value}`;
            
            nextCropsEl.appendChild(cropDiv);
        }
    }
    
    updateScoreBreakdown() {
        const scoreDetails = document.getElementById('scoreDetails');
        
        if (this.lastHarvestDetails.length === 0) {
            scoreDetails.innerHTML = '<div class="score-line">No recent harvests</div>';
            return;
        }
        
        let html = '';
        for (const detail of this.lastHarvestDetails) {
            html += `<div class="score-line">
                ${detail.crop} <span class="score-value">+${detail.baseScore}</span>
            </div>`;
            
            if (detail.synergies > 0) {
                html += `<div class="score-line synergy-bonus">
                    Synergy bonus <span class="score-value">+${detail.synergies}</span>
                </div>`;
            }
        }
        
        scoreDetails.innerHTML = html;
    }
    
    updateFinalGameStats() {
        const gridStats = this.grid.getStats();
        const cropsPlanted = this.grid.crops.filter(c => !c.isHarvested).length + this.lastHarvestDetails.length;
        
        const statsHTML = `
            <h4>📊 Game Statistics</h4>
            <div class="stat-row">
                <span>Crops Planted:</span>
                <span>${cropsPlanted}</span>
            </div>
            <div class="stat-row">
                <span>Crops Harvested:</span>
                <span>${this.lastHarvestDetails.length}</span>
            </div>
            <div class="stat-row">
                <span>Final Turn:</span>
                <span>${this.currentTurn}/${this.maxTurns}</span>
            </div>
            <div class="stat-row">
                <span>Average Points/Turn:</span>
                <span>${Math.round(this.score / Math.max(this.currentTurn, 1))}</span>
            </div>
            <div class="stat-row">
                <span>High Score:</span>
                <span>${Math.max(this.score, this.getHighScore())}</span>
            </div>
        `;
        
        document.getElementById('gameStats').innerHTML = statsHTML;
    }
    
    showHelp() {
        document.getElementById('helpModal').classList.remove('hidden');
    }
    
    hideHelp() {
        document.getElementById('helpModal').classList.add('hidden');
    }

    saveHighScore() {
        const highScore = localStorage.getItem('harvestTacticsHighScore') || 0;
        if (this.score > parseInt(highScore)) {
            localStorage.setItem('harvestTacticsHighScore', this.score.toString());
            console.log('New high score!');
        }
    }

    getHighScore() {
        return parseInt(localStorage.getItem('harvestTacticsHighScore') || 0);
    }

    // Main game loop
    gameLoop() {
        // Render grid
        this.grid.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    // Get game statistics for debugging
    getGameStats() {
        const gridStats = this.grid.getStats();
        return {
            turn: this.currentTurn,
            maxTurns: this.maxTurns,
            score: this.score,
            gameOver: this.gameOver,
            currentCrop: this.currentCropType?.name,
            gridStats: gridStats,
            highScore: this.getHighScore()
        };
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new HarvestTacticsGame();
    
    // Make game accessible globally for debugging
    window.game = game;
    
    // Debug commands
    window.debugHarvest = () => game.harvestAll();
    window.debugEndTurn = () => game.endTurn();
    window.debugStats = () => console.log(game.getGameStats());
}); 