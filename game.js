const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
    { x: 10, y: 10 }
];
let food = { 
    x: 15, 
    y: 15,
    dx: 0,
    dy: 0,
    moveCounter: 0,
    moveDelay: 5  // Move every 5 game ticks
};
let dx = 0;
let dy = 0;
let score = 0;
let gameLoop;
let gameSpeed = 100;

// Add array of background colors
const backgroundColors = [
    '#f0f0f0', '#FFE6E6', '#E6FFE6', '#E6E6FF', 
    '#FFFCE6', '#FFE6FC', '#E6FCFF', '#FFE6E6',
    '#E6FFE6', '#E6E6FF', '#FFEEE6'
];
let currentColorIndex = 0;

// Particle system
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.alpha = 1;
        this.size = Math.random() * 4 + 2;
        this.color = `hsl(${Math.random() * 60 + 340}, 100%, 50%)`;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha *= 0.92;
        this.size *= 0.95;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let particles = [];

document.addEventListener('keydown', changeDirection);

function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -1;
        dy = 0;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -1;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = 1;
        dy = 0;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = 1;
    }
}

function drawGame() {
    clearCanvas();
    moveSnake();
    moveFood();
    drawSnake();
    drawFood();
    updateParticles();
    updateScore();

    if (checkCollision()) {
        gameOver();
        return;
    }

    if (hasEatenFood()) {
        score += 10;
        createExplosion(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2);
        growSnake();
        generateFood();
        increaseSpeed();
    }

    gameLoop = setTimeout(drawGame, gameSpeed);
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    ctx.fillStyle = '#4CAF50';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function drawFood() {
    ctx.font = `${gridSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const x = food.x * gridSize + gridSize / 2;
    const y = food.y * gridSize + gridSize / 2;
    ctx.fillText('🍎', x, y);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    if (!hasEatenFood()) {
        snake.pop();
    }
}

function moveFood() {
    food.moveCounter++;
    
    // Only move food every few game ticks
    if (food.moveCounter >= food.moveDelay) {
        food.moveCounter = 0;
        
        // Randomly change direction occasionally
        if (Math.random() < 0.1) {
            const directions = [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 }
            ];
            const newDir = directions[Math.floor(Math.random() * directions.length)];
            food.dx = newDir.dx;
            food.dy = newDir.dy;
        }
        
        // Calculate new position
        let newX = food.x + food.dx;
        let newY = food.y + food.dy;
        
        // Bounce off walls
        if (newX < 0 || newX >= tileCount) {
            food.dx *= -1;
            newX = food.x;
        }
        if (newY < 0 || newY >= tileCount) {
            food.dy *= -1;
            newY = food.y;
        }
        
        // Don't move onto snake
        const willCollideWithSnake = snake.some(segment => 
            segment.x === newX && segment.y === newY
        );
        
        if (!willCollideWithSnake) {
            food.x = newX;
            food.y = newY;
        }
    }
}

function hasEatenFood() {
    const eaten = snake[0].x === food.x && snake[0].y === food.y;
    if (eaten) {
        changeBackgroundColor();
    }
    return eaten;
}

function changeBackgroundColor() {
    currentColorIndex = (currentColorIndex + 1) % backgroundColors.length;
    document.body.style.backgroundColor = backgroundColors[currentColorIndex];
}

function generateFood() {
    // Reset food position and give it a random initial direction
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    
    const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
    ];
    const initialDir = directions[Math.floor(Math.random() * directions.length)];
    food.dx = initialDir.dx;
    food.dy = initialDir.dy;
    food.moveCounter = 0;
    
    // Make sure food doesn't spawn on snake
    while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
    }
}

function growSnake() {
    const tail = { ...snake[snake.length - 1] };
    snake.push(tail);
}

function checkCollision() {
    const head = snake[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }
    
    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function increaseSpeed() {
    if (gameSpeed > 50) {
        gameSpeed -= 2;
    }
}

function gameOver() {
    clearTimeout(gameLoop);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15, dx: 0, dy: 0, moveCounter: 0, moveDelay: 5 };
    dx = 0;
    dy = 0;
    score = 0;
    gameSpeed = 100;
    document.getElementById('gameOver').style.display = 'none';
    drawGame();
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        
        if (particles[i].alpha < 0.01) {
            particles.splice(i, 1);
        }
    }
}

function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y));
    }
}

// Start the game
drawGame();
