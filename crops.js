// Crop definitions and management system
class CropType {
    constructor(name, icon, size, growthTime, baseValue, color) {
        this.name = name;
        this.icon = icon;
        this.size = size; // {width, height} in grid cells
        this.growthTime = growthTime; // turns to mature
        this.baseValue = baseValue; // base score when harvested
        this.color = color; // background color for display
    }
}

// Define the 5 crop types from our design
const CROP_TYPES = {
    WHEAT: new CropType('Wheat', '🌾', {width: 1, height: 1}, 2, 10, '#F5DEB3'),
    CORN: new CropType('Corn', '🌽', {width: 1, height: 2}, 3, 25, '#FFD700'),
    PUMPKIN: new CropType('Pumpkin', '🎃', {width: 2, height: 2}, 4, 50, '#FF7F50'),
    CARROT: new CropType('Carrot', '🥕', {width: 1, height: 1}, 0, 15, '#FFA500'), // instant harvest
    BERRY: new CropType('Berry Bush', '🫐', {width: 2, height: 1}, 3, 30, '#8A2BE2')
};

// Growth stages for visual representation
const GROWTH_STAGES = {
    PLANTED: { icon: '🌱', name: 'Planted' },
    GROWING: { icon: '🌿', name: 'Growing' },
    MATURE: { icon: '✨', name: 'Mature' },
    HARVESTABLE: { icon: '🌟', name: 'Ready!' }
};

class Crop {
    constructor(type, x, y, turn) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.plantedTurn = turn;
        this.currentAge = 0;
        this.isHarvested = false;
        this.id = Math.random().toString(36).substr(2, 9); // unique id
    }

    // Update crop growth each turn
    grow() {
        if (!this.isHarvested && this.currentAge < this.type.growthTime) {
            this.currentAge++;
        }
    }

    // Check if crop is ready to harvest
    isReady() {
        return this.currentAge >= this.type.growthTime && !this.isHarvested;
    }

    // Get current growth stage for visual display
    getGrowthStage() {
        if (this.isHarvested) {
            return null; // Don't display harvested crops
        }
        
        if (this.type.growthTime === 0) {
            return GROWTH_STAGES.HARVESTABLE; // Instant crops like carrots
        }
        
        const progress = this.currentAge / this.type.growthTime;
        
        if (progress >= 1) {
            return GROWTH_STAGES.HARVESTABLE;
        } else if (progress >= 0.75) {
            return GROWTH_STAGES.MATURE;
        } else if (progress >= 0.25) {
            return GROWTH_STAGES.GROWING;
        } else {
            return GROWTH_STAGES.PLANTED;
        }
    }

    // Get display icon based on growth stage
    getDisplayIcon() {
        if (this.isReady()) {
            return this.type.icon; // Show final crop when ready
        }
        
        const stage = this.getGrowthStage();
        return stage ? stage.icon : this.type.icon;
    }

    // Harvest the crop and return score
    harvest() {
        if (this.isReady()) {
            this.isHarvested = true;
            return this.calculateScore();
        }
        return 0;
    }

    // Calculate score including any bonuses
    calculateScore() {
        let score = this.type.baseValue;
        
        // Add age bonus for crops that took longer to grow
        if (this.type.growthTime > 0) {
            score += this.type.growthTime * 2;
        }
        
        return score;
    }

    // Check if crop occupies a specific grid position
    occupiesPosition(x, y) {
        return x >= this.x && 
               x < this.x + this.type.size.width && 
               y >= this.y && 
               y < this.y + this.type.size.height;
    }

    // Get all positions this crop occupies
    getOccupiedPositions() {
        const positions = [];
        for (let dx = 0; dx < this.type.size.width; dx++) {
            for (let dy = 0; dy < this.type.size.height; dy++) {
                positions.push({x: this.x + dx, y: this.y + dy});
            }
        }
        return positions;
    }
}

// Crop management utility functions
const CropManager = {
    // Get random crop type for tile drawing
    getRandomCropType() {
        const types = Object.values(CROP_TYPES);
        return types[Math.floor(Math.random() * types.length)];
    },

    // Check if a crop can be placed at the given position
    canPlaceCrop(grid, cropType, x, y) {
        // Check bounds
        if (x + cropType.size.width > grid.width || 
            y + cropType.size.height > grid.height) {
            return false;
        }

        // Check for overlaps with existing crops
        for (let dx = 0; dx < cropType.size.width; dx++) {
            for (let dy = 0; dy < cropType.size.height; dy++) {
                if (grid.getCropAt(x + dx, y + dy)) {
                    return false;
                }
            }
        }

        return true;
    },

    // Calculate synergy bonuses for adjacent crops
    calculateSynergies(crops, targetCrop) {
        let synergies = 0;
        const targetPositions = targetCrop.getOccupiedPositions();
        
        for (const crop of crops) {
            if (crop.id === targetCrop.id || crop.isHarvested) continue;
            
            const cropPositions = crop.getOccupiedPositions();
            
            // Check for adjacent positions
            for (const targetPos of targetPositions) {
                for (const cropPos of cropPositions) {
                    const distance = Math.abs(targetPos.x - cropPos.x) + Math.abs(targetPos.y - cropPos.y);
                    if (distance === 1) {
                        // Adjacent bonus
                        synergies += this.getSynergyBonus(targetCrop.type, crop.type);
                    }
                }
            }
        }
        
        return synergies;
    },

    // Define synergy bonuses between crop types
    getSynergyBonus(type1, type2) {
        // Same type bonus
        if (type1.name === type2.name) {
            return 5;
        }
        
        // Specific combinations
        const synergies = {
            'Wheat-Corn': 3,
            'Carrot-Berry Bush': 4,
            'Pumpkin-Wheat': 2
        };
        
        const key1 = `${type1.name}-${type2.name}`;
        const key2 = `${type2.name}-${type1.name}`;
        
        return synergies[key1] || synergies[key2] || 1; // Default small bonus
    }
}; 