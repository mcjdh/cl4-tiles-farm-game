# 🌾 Harvest Tactics - Game Design Document
*Devs That Jam 36-hour Challenge #14 - Farming Theme*

## 🎯 Core Concept
Turn-based grid-based farming puzzle game where players strategically place crop tiles to maximize harvest score within limited turns.

## 🎮 Core Game Systems

### Grid & Placement System
- [x] Create 8x8 farm grid
- [x] Implement tile placement mechanics
- [x] Add placement validation (valid positions, overlaps)
- [x] Grid visual feedback (hover states, valid/invalid indicators)
- [x] Snap-to-grid functionality

### Crop System
- [x] Define crop types (3-5 basic crops to start)
  - [x] Wheat (1x1, fast growth, low yield)
  - [x] Corn (1x2, medium growth, medium yield)
  - [x] Pumpkin (2x2, slow growth, high yield)
  - [x] Carrot (1x1, instant harvest, medium yield)
  - [x] Berry Bush (2x1, permanent, yields every few turns)
- [x] Crop growth stages (planted → growing → mature → harvestable)
- [x] Growth timing system (turns to mature)
- [x] Harvest mechanics and scoring

### Turn System
- [x] Turn counter (start with 20-30 turns)
- [x] End turn button
- [x] Turn progression logic
- [x] Game over condition (no more turns)

### Scoring System
- [ ] Base crop values
- [ ] Bonus scoring for crop synergies
- [ ] Efficiency bonuses (grid utilization)
- [ ] High score tracking (local storage)

## 🎲 Advanced Mechanics (Priority 2)

### Crop Synergies
- [ ] Adjacent crop bonuses
- [ ] Crop type combinations
- [ ] Special pattern bonuses (rows, clusters)

### Special Tiles/Events
- [ ] Fertilizer tiles (growth boost)
- [ ] Weather events (drought, rain)
- [ ] Pest attacks (crop destruction)
- [ ] Seasonal bonuses

### Tile Drawing System
- [ ] Random crop tile generation
- [ ] "Hand" of available tiles (3-5 tiles)
- [ ] Tile rotation mechanics
- [ ] Discard/refresh tile options

## 🎨 Visual Systems

### Core Art
- [ ] Farm grid background
- [ ] Crop sprites (all growth stages)
- [ ] UI elements (buttons, panels, score display)
- [ ] Tile preview graphics
- [ ] Cursor/selection indicators

### Animations & Juice
- [ ] Crop growing animations
- [ ] Harvest particle effects
- [ ] Tile placement feedback
- [ ] Score popup animations
- [ ] Turn transition effects
- [ ] Satisfying "pop" sounds for actions

### UI/UX
- [ ] Main game screen layout
- [ ] Score display
- [ ] Turn counter
- [ ] Next tile preview
- [ ] Game over screen
- [ ] Restart button
- [ ] Instructions/tutorial overlay

## 🔊 Audio Systems

### Sound Effects
- [ ] Tile placement sound
- [ ] Crop growth sound
- [ ] Harvest sound
- [ ] Turn advance sound
- [ ] UI click sounds
- [ ] Success/failure audio feedback

### Music
- [ ] Background farming music (optional, low priority)
- [ ] Menu music (optional)

## 🛠️ Technical Implementation

### Core Architecture
- [x] HTML5 Canvas setup
- [x] Game state management
- [x] Grid data structure
- [x] Crop object system
- [x] Input handling (mouse/touch)

### Game Loop
- [ ] Update game state
- [ ] Render graphics
- [ ] Handle user input
- [ ] Animation frame management

### Data Persistence
- [ ] Save high scores to localStorage
- [ ] Save game state (optional)

## 🎪 Polish & Game Feel

### Essential Polish
- [ ] Smooth tile placement
- [ ] Clear visual feedback for all actions
- [ ] Intuitive controls
- [ ] Readable UI text
- [ ] Consistent art style
- [ ] Responsive design (mobile-friendly)

### Nice-to-Have Polish
- [ ] Screen shake on harvest
- [ ] Color-coded crop types
- [ ] Animated background elements
- [ ] Particle effects
- [ ] Sound volume controls
- [ ] Keyboard shortcuts

## 📱 Jam Requirements

### Submission Requirements
- [ ] Browser-playable version
- [ ] Game incorporates farming theme
- [ ] Under 1GB file size
- [ ] Game description/instructions
- [ ] Screenshots for itch.io page
- [ ] Cover image

### Rating Criteria Focus
- [ ] **Experience**: Fun, engaging gameplay loop
- [ ] **Theme**: Clear farming elements throughout
- [ ] **Functionality**: Intuitive, bug-free mechanics
- [ ] **Visuals**: Cohesive art style, readable UI
- [ ] **Audio**: Satisfying sound effects
- [ ] **Polish**: Complete, finished feel

## 🚀 Development Phases

### Phase 1: Core Prototype (Hours 1-8) ✅ COMPLETE
- [x] Basic grid and placement
- [x] Simple crop system
- [x] Turn mechanics
- [x] Basic scoring

### Phase 2: Full Gameplay (Hours 9-16) 🚧 IN PROGRESS
- [x] All crop types
- [x] Synergy system
- [x] UI implementation
- [x] Game over flow
- [x] Help system and tutorials
- [x] Score breakdown display
- [x] Enhanced crop information
- [x] Visual synergy indicators

### Phase 3: Polish & Submit (Hours 17-24)
- [ ] Art pass
- [ ] Audio implementation
- [ ] Bug fixes
- [ ] Playtesting
- [ ] Itch.io page setup

## 🎯 Success Metrics
- [ ] Game is fun to play repeatedly
- [ ] Farming theme is immediately clear
- [ ] Players understand mechanics without explanation
- [ ] Game runs smoothly in browser
- [ ] Submission is complete and polished

---

**Remember**: Focus on core gameplay first, polish later. Better to have a simple, fun game than a complex, broken one! 