const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');

// Game State
let GAME_STATE = 'MENU'; // MENU, PLAYING, GAMEOVER
let score = 0;
let bestScore = localStorage.getItem('neonCoreBestScore') || 0;
let animationId;
let gameTime = 0;

// Dimensions
let width, height, centerX, centerY;

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    centerX = width / 2;
    centerY = height / 2;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Entities
const CORE_RADIUS = 30;
const SHIELD_RADIUS = 80;
const SHIELD_ANGLE_SIZE = Math.PI * 0.5; // 90 degrees

let core = {
    radius: CORE_RADIUS,
    pulseOffset: 0
};

let shield = {
    angle: 0,
    targetAngle: 0,
    radius: SHIELD_RADIUS,
    thickness: 8
};

let enemies = [];
let particles = [];

// Input Handling
let keys = { left: false, right: false };
let isDragging = false;
let lastTouchAngle = 0;

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

function handlePointerDown(e) {
    if (GAME_STATE !== 'PLAYING') return;
    isDragging = true;
    updateShieldAngleFromPointer(e.clientX || (e.touches && e.touches[0].clientX), e.clientY || (e.touches && e.touches[0].clientY));
}

function handlePointerMove(e) {
    if (!isDragging || GAME_STATE !== 'PLAYING') return;
    updateShieldAngleFromPointer(e.clientX || (e.touches && e.touches[0].clientX), e.clientY || (e.touches && e.touches[0].clientY));
}

function handlePointerUp() {
    isDragging = false;
}

function updateShieldAngleFromPointer(px, py) {
    if (px === undefined || py === undefined) return;
    const dx = px - centerX;
    const dy = py - centerY;
    shield.targetAngle = Math.atan2(dy, dx);
}

canvas.addEventListener('mousedown', handlePointerDown);
window.addEventListener('mousemove', handlePointerMove);
window.addEventListener('mouseup', handlePointerUp);
canvas.addEventListener('touchstart', handlePointerDown, {passive: false});
window.addEventListener('touchmove', handlePointerMove, {passive: false});
window.addEventListener('touchend', handlePointerUp);

// Game Mechanics
function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(width, height) / 2 + 50;
    
    // Difficulty scaling
    const baseSpeed = 2;
    const speedMultiplier = 1 + (gameTime / 1000); // Speed increases over time
    const speed = baseSpeed * speedMultiplier * (0.8 + Math.random() * 0.4);
    
    const size = 10 + Math.random() * 8;
    const isWavy = Math.random() > 0.7; // Some enemies wobble
    const waveOffset = Math.random() * Math.PI * 2;

    enemies.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        angle: angle,
        speed: speed,
        size: size,
        isWavy: isWavy,
        waveOffset: waveOffset,
        distance: distance
    });
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        const size = 1 + Math.random() * 4;
        const life = 30 + Math.random() * 30;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            size: size,
            life: life,
            maxLife: life
        });
    }
}

// Update Loop
function update() {
    if (GAME_STATE !== 'PLAYING') return;

    gameTime++;

    // Update Score
    if (gameTime % 60 === 0) { // +1 point every second
        score++;
        scoreDisplay.textContent = score;
    }

    // Shield Keyboard Control
    if (keys.left) shield.targetAngle -= 0.1;
    if (keys.right) shield.targetAngle += 0.1;

    // Smooth shield rotation
    let angleDiff = shield.targetAngle - shield.angle;
    // Normalize angle diff
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    shield.angle += angleDiff * 0.2; // Lerp factor

    // Core Pulse
    core.pulseOffset = Math.sin(gameTime * 0.1) * 5;

    // Spawn Enemies
    const spawnRate = Math.max(20, 60 - Math.floor(gameTime / 60)); // Spawns faster over time
    if (gameTime % spawnRate === 0) {
        spawnEnemy();
    }

    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        
        e.distance -= e.speed;
        
        // Wavy movement
        let currentAngle = e.angle;
        if (e.isWavy) {
            currentAngle += Math.sin(gameTime * 0.1 + e.waveOffset) * 0.1;
        }

        e.x = centerX + Math.cos(currentAngle) * e.distance;
        e.y = centerY + Math.sin(currentAngle) * e.distance;

        // Collision with Shield
        if (e.distance <= shield.radius + e.size + shield.thickness/2 && e.distance >= shield.radius - e.size - shield.thickness/2) {
            // Check if enemy angle is within shield arc
            let enemyAngleToCenter = Math.atan2(e.y - centerY, e.x - centerX);
            let normalizedEnemyAngle = enemyAngleToCenter < 0 ? enemyAngleToCenter + Math.PI * 2 : enemyAngleToCenter;
            let normalizedShieldAngle = shield.angle < 0 ? (shield.angle % (Math.PI*2)) + Math.PI * 2 : shield.angle % (Math.PI*2);
            
            let diff = Math.abs(normalizedEnemyAngle - normalizedShieldAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;

            if (diff <= SHIELD_ANGLE_SIZE / 2 + 0.2) { // 0.2 margin of error
                // Blocked!
                createParticles(e.x, e.y, '#ff00ff', 15);
                score += 5; // Bonus points for blocking
                scoreDisplay.textContent = score;
                
                // Screen shake effect (optional, keep it small)
                ctx.translate(Math.random()*4-2, Math.random()*4-2);
                setTimeout(() => ctx.setTransform(1, 0, 0, 1, 0, 0), 50);

                enemies.splice(i, 1);
                continue;
            }
        }

        // Collision with Core
        if (e.distance <= core.radius + e.size) {
            gameOver();
            break;
        }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.size *= 0.95; // Shrink
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// Draw Loop
function draw() {
    // Clear with trail effect
    ctx.fillStyle = 'rgba(5, 5, 8, 0.3)';
    ctx.fillRect(0, 0, width, height);

    if (GAME_STATE !== 'PLAYING' && GAME_STATE !== 'GAMEOVER') return;

    // Draw Shield
    ctx.beginPath();
    ctx.arc(centerX, centerY, shield.radius, shield.angle - SHIELD_ANGLE_SIZE/2, shield.angle + SHIELD_ANGLE_SIZE/2);
    ctx.lineWidth = shield.thickness;
    ctx.strokeStyle = '#ff00ff';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.stroke();

    // Draw Core
    ctx.beginPath();
    ctx.arc(centerX, centerY, core.radius + core.pulseOffset, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 20 + core.pulseOffset * 2;
    ctx.shadowColor = '#00ffff';
    ctx.fill();

    // Draw Enemies
    enemies.forEach(e => {
        ctx.beginPath();
        // Polygon shape for enemies
        const sides = 4;
        for (let i = 0; i < sides; i++) {
            const a = e.angle + (i * Math.PI * 2) / sides + gameTime * 0.05;
            const px = e.x + Math.cos(a) * e.size;
            const py = e.y + Math.sin(a) * e.size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#ff0055';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0055';
        ctx.fill();
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Reset shadow
    ctx.shadowBlur = 0;
}

function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Game Flow Control
function startGame() {
    score = 0;
    gameTime = 0;
    enemies = [];
    particles = [];
    shield.angle = 0;
    shield.targetAngle = 0;
    scoreDisplay.textContent = '0';
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    GAME_STATE = 'PLAYING';
}

function gameOver() {
    GAME_STATE = 'GAMEOVER';
    
    // Core explosion particles
    createParticles(centerX, centerY, '#00ffff', 50);
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('neonCoreBestScore', bestScore);
    }
    
    finalScoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 1000); // Wait 1s before showing UI
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start Animation
bestScoreEl.textContent = bestScore;
requestAnimationFrame(gameLoop);
