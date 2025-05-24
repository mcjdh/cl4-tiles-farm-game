// Grid system for the farming game
class Grid {
    constructor(canvas, width = 8, height = 8) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width; // grid cells
        this.height = height; // grid cells
        this.cellSize = canvas.width / width; // pixels per cell
        this.crops = []; // array of placed crops
        this.hoveredCell = null; // {x, y} of currently hovered cell
        this.selectedCropType = null; // currently selected crop type for placement
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse move for hover effects
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const gridX = Math.floor(x / this.cellSize);
            const gridY = Math.floor(y / this.cellSize);
            
            if (gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height) {
                this.hoveredCell = {x: gridX, y: gridY};
            } else {
                this.hoveredCell = null;
            }
        });

        // Mouse leave to clear hover
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredCell = null;
        });

        // Click to place crops
        this.canvas.addEventListener('click', (e) => {
            if (!this.selectedCropType || !this.hoveredCell) return;
            
            this.attemptPlaceCrop(this.selectedCropType, this.hoveredCell.x, this.hoveredCell.y);
        });
    }

    // Set the currently selected crop type
    setSelectedCropType(cropType) {
        this.selectedCropType = cropType;
    }

    // Attempt to place a crop at the specified position
    attemptPlaceCrop(cropType, x, y) {
        if (CropManager.canPlaceCrop(this, cropType, x, y)) {
            const crop = new Crop(cropType, x, y, window.game ? window.game.currentTurn : 0);
            this.crops.push(crop);
            
            // Trigger placement sound or effect
            this.onCropPlaced(crop);
            
            return true;
        }
        return false;
    }

    // Callback for when a crop is placed (can be overridden)
    onCropPlaced(crop) {
        // This will be connected to the main game later
        console.log(`Placed ${crop.type.name} at (${crop.x}, ${crop.y})`);
    }

    // Get crop at specific grid position
    getCropAt(x, y) {
        return this.crops.find(crop => 
            !crop.isHarvested && crop.occupiesPosition(x, y)
        );
    }

    // Get all crops that are ready to harvest
    getHarvestablecrops() {
        return this.crops.filter(crop => crop.isReady());
    }

    // Harvest all ready crops and return total score
    harvestAll() {
        let totalScore = 0;
        const harvestable = this.getHarvestablecrops();
        
        for (const crop of harvestable) {
            totalScore += crop.harvest();
            
            // Calculate synergy bonuses
            const synergies = CropManager.calculateSynergies(this.crops, crop);
            totalScore += synergies;
        }
        
        return totalScore;
    }
    
    // Harvest all ready crops and return detailed score breakdown
    harvestAllWithDetails() {
        const details = [];
        let totalScore = 0;
        const harvestable = this.getHarvestablecrops();
        
        for (const crop of harvestable) {
            const baseScore = crop.harvest();
            const synergies = CropManager.calculateSynergies(this.crops, crop);
            
            // Create harvest particle effects
            if (window.particleSystem) {
                const x = (crop.x + crop.type.size.width/2) * this.cellSize;
                const y = (crop.y + crop.type.size.height/2) * this.cellSize;
                window.particleSystem.harvestEffect(x, y);
                
                if (synergies > 0) {
                    window.particleSystem.synergyEffect(x, y);
                }
            }
            
            details.push({
                crop: crop.type.name,
                baseScore: baseScore,
                synergies: synergies,
                position: `(${crop.x},${crop.y})`
            });
            
            totalScore += baseScore + synergies;
        }
        
        return {
            totalScore: totalScore,
            details: details
        };
    }

    // Advance all crops by one turn
    advanceTurn() {
        for (const crop of this.crops) {
            crop.grow();
        }
    }

    // Clear harvested crops from the grid
    clearHarvestedCrops() {
        this.crops = this.crops.filter(crop => !crop.isHarvested);
    }

    // Render the entire grid
    render() {
        this.clearCanvas();
        this.drawGridLines();
        this.drawHoverHighlight();
        this.drawPlacementPreview();
        this.drawCrops();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw farm background
        this.ctx.fillStyle = '#9ACD32';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGridLines() {
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
    }

    drawHoverHighlight() {
        if (!this.hoveredCell) return;
        
        const x = this.hoveredCell.x * this.cellSize;
        const y = this.hoveredCell.y * this.cellSize;
        
        // Light highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
        
        // Border highlight
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
    }

    drawPlacementPreview() {
        if (!this.selectedCropType || !this.hoveredCell) return;
        
        const cropType = this.selectedCropType;
        const canPlace = CropManager.canPlaceCrop(this, cropType, this.hoveredCell.x, this.hoveredCell.y);
        
        // Preview area
        const x = this.hoveredCell.x * this.cellSize;
        const y = this.hoveredCell.y * this.cellSize;
        const width = cropType.size.width * this.cellSize;
        const height = cropType.size.height * this.cellSize;
        
        // Color based on whether placement is valid
        this.ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(x, y, width, height);
        
        // Preview border
        this.ctx.strokeStyle = canPlace ? '#00FF00' : '#FF0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Preview icon
        if (canPlace) {
            this.drawCropIcon(cropType.icon, this.hoveredCell.x, this.hoveredCell.y, cropType.size, true);
        }
    }

    drawCrops() {
        for (const crop of this.crops) {
            if (crop.isHarvested) continue;
            
            this.drawCrop(crop);
        }
    }

    drawCrop(crop) {
        // Background for crop area
        const x = crop.x * this.cellSize;
        const y = crop.y * this.cellSize;
        const width = crop.type.size.width * this.cellSize;
        const height = crop.type.size.height * this.cellSize;
        
        // Check for synergies to add visual indicator
        const synergies = CropManager.calculateSynergies(this.crops, crop);
        let bgColor = crop.type.color;
        
        if (synergies > 0) {
            // Add a subtle glow for crops with synergies
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(x, y, width, height);
            bgColor = this.blendColors(crop.type.color, '#FFD700', 0.3);
        }
        
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
        
        // Crop icon
        const icon = crop.getDisplayIcon();
        this.drawCropIcon(icon, crop.x, crop.y, crop.type.size);
        
        // Ready indicator
        if (crop.isReady()) {
            this.drawReadyIndicator(crop.x, crop.y, crop.type.size);
        }
        
        // Synergy indicator
        if (synergies > 0) {
            this.drawSynergyIndicator(crop.x, crop.y, crop.type.size, synergies);
        }
    }

    drawCropIcon(icon, gridX, gridY, size, isPreview = false) {
        const x = gridX * this.cellSize;
        const y = gridY * this.cellSize;
        const width = size.width * this.cellSize;
        const height = size.height * this.cellSize;
        
        this.ctx.font = `${Math.min(width, height) * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        if (isPreview) {
            this.ctx.globalAlpha = 0.7;
        }
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(icon, x + width/2, y + height/2);
        
        if (isPreview) {
            this.ctx.globalAlpha = 1.0;
        }
    }

    drawReadyIndicator(gridX, gridY, size) {
        const x = gridX * this.cellSize;
        const y = gridY * this.cellSize;
        const width = size.width * this.cellSize;
        
        // Sparkle effect for ready crops
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = `${this.cellSize * 0.3}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('✨', x + width - 10, y + 15);
    }
    
    drawSynergyIndicator(gridX, gridY, size, synergyValue) {
        const x = gridX * this.cellSize;
        const y = gridY * this.cellSize;
        const height = size.height * this.cellSize;
        
        // Small synergy indicator in corner
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.font = `${this.cellSize * 0.25}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚡', x + 12, y + height - 8);
    }
    
    // Helper function to blend colors
    blendColors(color1, color2, ratio) {
        // Simple color blending - in a real implementation you'd convert hex to RGB
        return color1; // For now, just return the original color
    }

    // Get grid statistics
    getStats() {
        const total = this.crops.length;
        const ready = this.getHarvestablecrops().length;
        const growing = this.crops.filter(crop => !crop.isReady() && !crop.isHarvested).length;
        
        return { total, ready, growing };
    }
} 