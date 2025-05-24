// Crop definitions and management system
class CropType {
    constructor(name, icon, size, growthTime, baseValue, color, rarity = 1.0) {
        this.name = name;
        this.icon = icon;
        this.size = size; // {width, height} in grid cells
        this.growthTime = growthTime; // turns to mature
        this.baseValue = baseValue; // base score when harvested
        this.color = color; // background color for display
        this.rarity = rarity; // spawn frequency (0.1 = 10% chance, 1.0 = 100% base chance)
    }
}

// Define the 5 crop types from our design
// Balanced for value per space per turn efficiency with strategic rarity
const CROP_TYPES = {
    WHEAT: new CropType('Wheat', '🌾', {width: 1, height: 1}, 2, 8, '#F5DEB3', 1.2),     // Common, reliable
    CORN: new CropType('Corn', '🌽', {width: 1, height: 2}, 3, 20, '#FFD700', 0.8),      // Uncommon, efficient
    PUMPKIN: new CropType('Pumpkin', '🎃', {width: 2, height: 2}, 4, 60, '#FF7F50', 0.4), // Rare, high value
    CARROT: new CropType('Carrot', '🥕', {width: 1, height: 1}, 0, 12, '#FFA500', 1.0),  // Standard instant gratification
    BERRY: new CropType('Berry Bush', '🫐', {width: 2, height: 1}, 3, 28, '#8A2BE2', 0.6) // Somewhat rare, good synergies
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
        
        // Add age bonus for crops that took longer to grow (patience reward)
        if (this.type.growthTime > 0) {
            score += Math.floor(this.type.growthTime * 1.5); // Reduced from 2 to balance
        }
        
        // Early harvest penalty (optional - encourages timing strategy)
        if (this.currentAge < this.type.growthTime && this.type.growthTime > 0) {
            score = Math.floor(score * 0.7); // 30% penalty for early harvest
        }
        
        return Math.max(1, score); // Minimum 1 point
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
    // Get random crop type for tile drawing (weighted by rarity)
    getRandomCropType() {
        const types = Object.values(CROP_TYPES);
        
        // Create weighted pool based on rarity values
        const weightedPool = [];
        for (const type of types) {
            const weight = Math.max(1, Math.floor(type.rarity * 10)); // Convert to integer weights
            for (let i = 0; i < weight; i++) {
                weightedPool.push(type);
            }
        }
        
        return weightedPool[Math.floor(Math.random() * weightedPool.length)];
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
        // Same type clustering bonus (diminishing returns)
        if (type1.name === type2.name) {
            return 3; // Reduced from 5 to encourage diversity
        }
        
        // Strategic crop combinations with thematic logic
        const synergies = {
            // Complementary growth cycles
            'Wheat-Corn': 4,      // Traditional companion planting
            'Carrot-Berry Bush': 6, // Root vegetables with perennials
            'Pumpkin-Corn': 5,    // Three Sisters farming technique
            
            // Soil improvement combinations
            'Wheat-Carrot': 3,   // Grain + root crop rotation
            'Berry Bush-Wheat': 4, // Perennial + annual balance
            
            // Size-based efficiency
            'Corn-Berry Bush': 2, // Both tall crops work well together
            'Carrot-Wheat': 2,   // Both quick-growing small crops
            
            // Strategic timing
            'Pumpkin-Carrot': 3  // Long-term + instant harvest balance
        };
        
        const key1 = `${type1.name}-${type2.name}`;
        const key2 = `${type2.name}-${type1.name}`;
        
        return synergies[key1] || synergies[key2] || 1; // Minimum 1 point bonus for any adjacency
    }
}; 