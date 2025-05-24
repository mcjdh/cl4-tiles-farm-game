// Main game state and logic
class GridGardenGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.grid = new Grid(this.canvas);
        
        // Game state
        this.currentTurn = 0;
        this.maxTurns = 20; // Reduced from 25 to 20 for tighter, more strategic gameplay
        this.score = 0;
        this.gameOver = false;
        
        // Crop queue system
        this.currentCropType = null;
        this.nextCrops = [];
        
        // Action-based turn system
        this.cropsPlacedThisTurn = 0;
        this.maxCropsPerTurn = 3; // Players can place up to 3 crops per turn
        
        // Dynamic difficulty scaling
        this.baseMaxCropsPerTurn = 3;
        
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
        
        // Initialize particle system
        this.particleSystem = new ParticleSystem(this.canvas);
        window.particleSystem = this.particleSystem;
        
        // Track time for particle updates
        this.lastTime = performance.now();
        
        // Start game loop
        this.gameLoop();
        
        console.log('🌿 Grid Garden initialized!');
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
        
        // Audio toggle button
        document.getElementById('audioBtn').addEventListener('click', () => {
            this.toggleAudio();
        });
    }

    onCropPlaced(crop) {
        console.log(`Planted ${crop.type.name}! (${this.cropsPlacedThisTurn + 1}/${this.maxCropsPerTurn} this turn)`);
        
        // Play placement sound
        if (window.audioManager) {
            window.audioManager.play('place');
        }
        
        // Create placement particles
        if (this.particleSystem) {
            const x = (crop.x + crop.type.size.width/2) * this.grid.cellSize;
            const y = (crop.y + crop.type.size.height/2) * this.grid.cellSize;
            this.particleSystem.placementEffect(x, y);
        }
        
        // Track crops placed this turn
        this.cropsPlacedThisTurn++;
        
        // Move to next crop in queue
        this.advanceCropQueue();
        
        // Update UI
        this.updateCropUI();
        this.updateStatsUI();
        
        // Check if turn should advance
        this.checkTurnAdvancement();
    }

    advanceCropQueue() {
        // Move to next crop
        if (this.nextCrops.length > 0) {
            this.currentCropType = this.nextCrops.shift();
            this.nextCrops.push(CropManager.getRandomCropType());
            this.grid.setSelectedCropType(this.currentCropType);
        }
    }

    checkTurnAdvancement() {
        // Check various conditions for turn advancement
        const canPlaceCurrentCrop = this.canPlaceCurrentCrop();
        const reachedCropLimit = this.cropsPlacedThisTurn >= this.maxCropsPerTurn;
        
        if (!canPlaceCurrentCrop || reachedCropLimit) {
            // Auto-advance turn when forced (no valid placements or hit action limit)
            this.showTurnAdvanceHint();
            setTimeout(() => this.endTurn(), 500); // Brief delay for visual feedback
        } else {
            // Player can continue - hide any hints
            this.hideTurnAdvanceHint();
        }
    }
    
    showTurnAdvanceHint() {
        const turnHint = document.getElementById('turnHint');
        if (!turnHint) return;
        
        const canPlace = this.canPlaceCurrentCrop();
        const reachedLimit = this.cropsPlacedThisTurn >= this.maxCropsPerTurn;
        
        if (!canPlace) {
            turnHint.textContent = 'No valid placements - advancing turn...';
            turnHint.className = 'turn-hint forced';
        } else if (reachedLimit) {
            turnHint.textContent = `All ${this.maxCropsPerTurn} actions used - advancing turn...`;
            turnHint.className = 'turn-hint forced';
        }
        
        turnHint.style.display = 'block';
    }
    
    hideTurnAdvanceHint() {
        const turnHint = document.getElementById('turnHint');
        if (turnHint) {
            turnHint.style.display = 'none';
        }
    }
    
    canPlaceCurrentCrop() {
        if (!this.currentCropType) return false;
        
        for (let x = 0; x < this.grid.width; x++) {
            for (let y = 0; y < this.grid.height; y++) {
                if (CropManager.canPlaceCrop(this.grid, this.currentCropType, x, y)) {
                    return true;
                }
            }
        }
        return false;
    }

    endTurn() {
        if (this.gameOver) return;
        
        console.log(`Turn ${this.currentTurn + 1} ending... (${this.cropsPlacedThisTurn} crops placed)`);
        
        // Play turn sound
        if (window.audioManager) {
            window.audioManager.play('turn');
        }
        
        // Advance turn counter
        this.currentTurn++;
        
        // Reset crops placed counter for new turn
        this.cropsPlacedThisTurn = 0;
        
        // Dynamic turn scaling - more actions in final turns for excitement
        const turnsRemaining = this.maxTurns - this.currentTurn;
        if (turnsRemaining <= 5) {
            this.maxCropsPerTurn = this.baseMaxCropsPerTurn + 1; // Extra action in final stretch
        } else {
            this.maxCropsPerTurn = this.baseMaxCropsPerTurn;
        }
        
        // Grow all crops
        this.grid.advanceTurn();
        
        // Auto-harvest ready crops for points
        const harvestDetails = this.grid.harvestAllWithDetails();
        if (harvestDetails.totalScore > 0) {
            this.lastHarvestDetails = harvestDetails.details;
            this.addScore(harvestDetails.totalScore);
            this.updateScoreBreakdown();
            
            // Play harvest sounds
            if (window.audioManager) {
                window.audioManager.play('harvest');
                
                // Play synergy sound if there are synergy bonuses
                const hasSynergies = harvestDetails.details.some(d => d.synergies > 0);
                if (hasSynergies) {
                    window.audioManager.play('synergy', 300);
                }
            }
            
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
        // Apply end-game multiplier for final turns excitement
        let finalPoints = points;
        const turnsRemaining = this.maxTurns - this.currentTurn;
        
        if (turnsRemaining <= 3) {
            // Increasing multiplier in final turns
            const multiplier = turnsRemaining === 0 ? 2.0 : 
                              turnsRemaining === 1 ? 1.8 : 
                              turnsRemaining === 2 ? 1.5 : 1.2;
            finalPoints = Math.floor(points * multiplier);
            
            if (finalPoints > points) {
                console.log(`Final turns bonus: ${points} → ${finalPoints} (${multiplier}x)`);
            }
        }
        
        this.score += finalPoints;
        
        // Play score sound
        if (window.audioManager && finalPoints > 0) {
            window.audioManager.play('score');
        }
        
        // Enhanced score animation
        UIAnimations.flashScore(this.score);
        
        // Create floating score text
        const scoreElement = document.getElementById('score');
        const rect = scoreElement.getBoundingClientRect();
        const displayText = finalPoints > points ? `+${finalPoints} (${points}×${(finalPoints/points).toFixed(1)})` : `+${finalPoints}`;
        UIAnimations.floatingText(displayText, rect.right + 10, rect.top);
        
        // Animate score increase (simple version)
        this.animateScoreIncrease(finalPoints);
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
        
        // Calculate final efficiency bonuses
        const efficiencyBonus = this.calculateFinalEfficiencyBonus();
        if (efficiencyBonus > 0) {
            this.score += efficiencyBonus;
            console.log(`Efficiency bonus: +${efficiencyBonus} points!`);
        }
        
        console.log(`Game Over! Final Score: ${this.score}`);
        
        // Play game over sound
        if (window.audioManager) {
            window.audioManager.play('gameOver');
        }
        
        // Show game over screen
        document.getElementById('finalScore').textContent = this.score;
        this.updateFinalGameStats();
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // Save high score
        this.saveHighScore();
    }

    calculateFinalEfficiencyBonus() {
        const gridSize = this.grid.width * this.grid.height;
        let occupiedSpaces = 0;
        
        // Count all spaces that have been used for crops
        for (const crop of this.grid.crops) {
            if (!crop.isHarvested) {
                occupiedSpaces += crop.type.size.width * crop.type.size.height;
            }
        }
        
        const utilization = occupiedSpaces / gridSize;
        let bonus = 0;
        
        // Efficiency tier bonuses
        if (utilization >= 0.9) {
            bonus = 100; // Master Farmer: 90%+ utilization
        } else if (utilization >= 0.75) {
            bonus = 60;  // Expert Farmer: 75%+ utilization
        } else if (utilization >= 0.6) {
            bonus = 30;  // Good Farmer: 60%+ utilization
        } else if (utilization >= 0.45) {
            bonus = 10;  // Decent Farmer: 45%+ utilization
        }
        
        return bonus;
    }

    restart() {
        // Reset game state
        this.currentTurn = 0;
        this.score = 0;
        this.gameOver = false;
        this.cropsPlacedThisTurn = 0;
        
        // Clear grid
        this.grid.crops = [];
        
        // Generate new crops
        this.generateInitialCrops();
        
        // Hide game over screen
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Hide turn hint
        const turnHint = document.getElementById('turnHint');
        if (turnHint) turnHint.style.display = 'none';
        
        // Update UI
        this.updateStatsUI();
        this.updateCropUI();
        
        console.log('Game restarted!');
    }

    updateStatsUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('turns').textContent = this.maxTurns - this.currentTurn;
        
        // Update turn progress indicator
        const turnProgress = document.getElementById('turnProgress');
        if (turnProgress) {
            const remaining = this.maxCropsPerTurn - this.cropsPlacedThisTurn;
            turnProgress.textContent = `${remaining} actions left`;
            turnProgress.className = remaining === 0 ? 'turn-progress depleted' : 'turn-progress';
        }
        
        // Update end turn button state
        const endTurnBtn = document.getElementById('endTurnBtn');
        if (endTurnBtn) {
            const actionsLeft = this.maxCropsPerTurn - this.cropsPlacedThisTurn;
            if (actionsLeft > 0) {
                endTurnBtn.textContent = `End Turn (${actionsLeft} actions left)`;
                endTurnBtn.classList.remove('skip-mode');
            } else {
                endTurnBtn.textContent = 'End Turn';
                endTurnBtn.classList.remove('skip-mode');
            }
        }
    }

    updateCropUI() {
        // Update current crop display
        const currentCropEl = document.getElementById('currentCrop');
        if (this.currentCropType) {
            currentCropEl.querySelector('.crop-icon').textContent = this.currentCropType.icon;
            
            // Add rarity indicator to crop name
            const rarity = this.currentCropType.rarity;
            let rarityIndicator = '';
            if (rarity <= 0.4) rarityIndicator = ' ⭐⭐⭐'; // Legendary
            else if (rarity <= 0.6) rarityIndicator = ' ⭐⭐';   // Rare
            else if (rarity <= 0.8) rarityIndicator = ' ⭐';     // Uncommon
            
            currentCropEl.querySelector('.crop-name').textContent = this.currentCropType.name + rarityIndicator;
            currentCropEl.style.borderColor = this.currentCropType.color;
            
            // Add glow effect for rare crops
            if (rarity <= 0.6) {
                currentCropEl.style.boxShadow = `0 0 10px ${this.currentCropType.color}`;
            } else {
                currentCropEl.style.boxShadow = '';
            }
            
            // Update crop stats
            const size = `${this.currentCropType.size.width}×${this.currentCropType.size.height}`;
            const growth = this.currentCropType.growthTime === 0 ? 'Instant' : `${this.currentCropType.growthTime} turns`;
            const value = `${this.currentCropType.baseValue}${this.currentCropType.growthTime > 0 ? '+' + Math.floor(this.currentCropType.growthTime * 1.5) : ''} pts`;
            
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
            
            // Add visual rarity indicators
            const rarity = cropType.rarity;
            if (rarity <= 0.6) {
                cropDiv.style.boxShadow = `0 0 5px ${cropType.color}`;
                cropDiv.style.borderWidth = '2px';
            }
            
            // Enhanced tooltip with stats and rarity
            const size = `${cropType.size.width}×${cropType.size.height}`;
            const growth = cropType.growthTime === 0 ? 'Instant' : `${cropType.growthTime} turns`;
            const value = `${cropType.baseValue}${cropType.growthTime > 0 ? '+' + Math.floor(cropType.growthTime * 1.5) : ''} pts`;
            const rarityText = rarity <= 0.4 ? ' (Legendary)' : rarity <= 0.6 ? ' (Rare)' : rarity <= 0.8 ? ' (Uncommon)' : '';
            cropDiv.title = `${cropType.name}${rarityText}\nSize: ${size} | Growth: ${growth} | Value: ${value}`;
            
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
    
    toggleAudio() {
        if (window.audioManager) {
            const enabled = window.audioManager.toggle();
            const audioBtn = document.getElementById('audioBtn');
            
            if (enabled) {
                audioBtn.textContent = '🔊 Audio';
                audioBtn.classList.remove('muted');
                window.audioManager.play('click');
            } else {
                audioBtn.textContent = '🔇 Muted';
                audioBtn.classList.add('muted');
            }
        }
    }

    saveHighScore() {
        const highScore = localStorage.getItem('gridGardenHighScore') || 0;
        if (this.score > parseInt(highScore)) {
            localStorage.setItem('gridGardenHighScore', this.score.toString());
            console.log('New high score!');
        }
    }

    getHighScore() {
        return parseInt(localStorage.getItem('gridGardenHighScore') || 0);
    }

    // Main game loop
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update particles
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }
        
        // Render grid
        this.grid.render();
        
        // Render particles on top
        if (this.particleSystem) {
            this.particleSystem.render();
        }
        
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
    game = new GridGardenGame();
    
    // Make game accessible globally for debugging
    window.game = game;
    
    // Debug commands
    window.debugHarvest = () => game.harvestAll();
    window.debugEndTurn = () => game.endTurn();
    window.debugStats = () => console.log(game.getGameStats());
}); 