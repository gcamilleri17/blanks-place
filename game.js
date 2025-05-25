// Get the canvas element and its 2D context
const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Game objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    velocityX: 5,
    velocityY: 5,
    speed: 7,
    color: 'white'
};

const player = {
    x: 0, // left side of canvas
    y: (canvas.height - 100) / 2, // -100 is the height of the paddle
    width: 10,
    height: 100,
    score: 0,
    color: 'white'
};

const computer = {
    x: canvas.width - 10, // right side of canvas
    y: (canvas.height - 100) / 2, // -100 is the height of the paddle
    width: 10,
    height: 100,
    score: 0,
    color: 'white'
};

// Game state
let gameRunning = false;
const winScore = 10; // Score needed to win the game

// Timers
let speedIncreaseTimer = 0;
let paddleRotationTimer = 0;
const speedIncreaseInterval = 10000; // 10 seconds
const paddleRotationInterval = 10000; // 10 seconds

// Background flash
let isFlashing = false;
let flashTimer = 0;
const flashDuration = 500; // 0.5 seconds
let backgroundColor = '#000';

// Paddle rotation
let playerRotation = 0;
let computerRotation = 0;
let isRotating = false;
let rotationProgress = 0;
const rotationDuration = 1000; // 1 second for full rotation

const net = {
    x: (canvas.width - 2) / 2,
    y: 0,
    width: 2,
    height: 10,
    color: 'white'
};

// Flowers
const flowers = [];
let flowerSpawnTimer = 0;
const flowerSpawnInterval = 5000; // 5 seconds

// Draw functions
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
}

function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

function drawText(text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = '45px Arial';
    ctx.fillText(text, x, y);
}

// Update score display
function updateScore() {
    document.getElementById('player-score').innerText = player.score;
    document.getElementById('computer-score').innerText = computer.score;
}

// Render the game
function render() {
    // Clear the canvas
    drawRect(0, 0, canvas.width, canvas.height, backgroundColor);

    // Draw the net
    drawNet();

    // Draw scores
    // drawText(player.score, canvas.width / 4, canvas.height / 5, 'white');
    // drawText(computer.score, 3 * canvas.width / 4, canvas.height / 5, 'white');

    // Draw flowers
    flowers.forEach(flower => {
        if (flower.active) {
            drawCircle(flower.x, flower.y, flower.radius, flower.color);
        }
    });

    // Draw paddles with rotation
    drawRotatedPaddle(player, playerRotation);
    drawRotatedPaddle(computer, computerRotation);

    // Draw ball
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

// Draw a rotated paddle
function drawRotatedPaddle(paddle, rotation) {
    ctx.save(); // Save the current state
    
    // Translate to the center of the paddle
    ctx.translate(paddle.x + paddle.width / 2, paddle.y + paddle.height / 2);
    
    // Rotate
    ctx.rotate(rotation * Math.PI / 180);
    
    // Draw the paddle centered at the origin
    drawRect(-paddle.width / 2, -paddle.height / 2, paddle.width, paddle.height, paddle.color);
    
    ctx.restore(); // Restore the state
}

// Collision detection
function collision(b, p) {
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

// Reset the ball
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 7;
}

// Mouse control for player paddle
canvas.addEventListener('mousemove', movePaddle);

function movePaddle(e) {
    let rect = canvas.getBoundingClientRect();
    let mouseY = e.clientY - rect.top - player.height / 2;
    
    // Make sure the paddle stays within the canvas
    if (mouseY < 0) {
        mouseY = 0;
    } else if (mouseY + player.height > canvas.height) {
        mouseY = canvas.height - player.height;
    }
    
    player.y = mouseY;
}

// Computer AI
function computerAI() {
    let computerLevel = 0.1; // 0 is easiest, 1 is hardest
    
    // Make the computer more responsive when the ball is moving towards it
    if (ball.velocityX > 0) {
        // Ball is moving towards computer
        computerLevel = 0.15; // Increase difficulty when ball is moving towards computer
    }
    
    let targetY = ball.y - (computer.height / 2);
    
    // Make sure the paddle stays within the canvas
    if (targetY < 0) {
        targetY = 0;
    } else if (targetY + computer.height > canvas.height) {
        targetY = canvas.height - computer.height;
    }
    
    computer.y += (targetY - computer.y) * computerLevel;
}

// Start paddle rotation animation
function startPaddleRotation() {
    isRotating = true;
    rotationProgress = 0;
}

// Start background flash
function flashBackground() {
    isFlashing = true;
    flashTimer = 0;
    backgroundColor = '#FFFF00'; // Yellow
}

// Update game state
function update() {
    // Spawn flowers
    if (gameRunning) {
        flowerSpawnTimer += 16; // Approximately 16ms per frame at 60fps
        
        if (flowerSpawnTimer >= flowerSpawnInterval) {
            spawnFlower();
            flowerSpawnTimer = 0;
        }
        
        // Ball speed increase every 10 seconds
        speedIncreaseTimer += 16;
        if (speedIncreaseTimer >= speedIncreaseInterval) {
            ball.speed += 0.5;
            speedIncreaseTimer = 0;
        }
        
        // Paddle rotation every 10 seconds
        paddleRotationTimer += 16;
        if (paddleRotationTimer >= paddleRotationInterval) {
            startPaddleRotation();
            paddleRotationTimer = 0;
        }
        
        // Handle paddle rotation animation
        if (isRotating) {
            rotationProgress += 16;
            const rotationPercentage = rotationProgress / rotationDuration;
            
            if (rotationPercentage >= 1) {
                // Rotation complete
                playerRotation = 0;
                computerRotation = 0;
                isRotating = false;
                rotationProgress = 0;
            } else {
                // Calculate rotation angle based on progress
                const angle = 360 * rotationPercentage;
                playerRotation = angle;
                computerRotation = angle;
            }
        }
        
        // Handle background flash
        if (isFlashing) {
            flashTimer += 16;
            if (flashTimer >= flashDuration) {
                backgroundColor = '#000'; // Reset to black
                isFlashing = false;
            }
        }
    }

    // Update scores
    if (ball.x - ball.radius < 0) {
        computer.score++;
        updateScore();
        flashBackground(); // Flash background when player loses
        checkGameOver();
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        updateScore();
        flashBackground(); // Flash background when computer loses
        checkGameOver();
        resetBall();
    }

    // Move the ball
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Simple AI to control the computer paddle
    computerAI();

    // Wall collision (top and bottom)
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
    }

    // Determine which paddle is being hit by the ball and handle collision
    let paddle = (ball.x + ball.radius < canvas.width / 2) ? player : computer;

    if (collision(ball, paddle)) {
        // Where the ball hit the paddle
        let collidePoint = (ball.y - (paddle.y + paddle.height / 2));
        
        // Normalization
        collidePoint = collidePoint / (paddle.height / 2);
        
        // Calculate angle in radians
        let angleRad = (Math.PI / 4) * collidePoint;
        
        // Direction of the ball when it's hit
        let direction = (ball.x + ball.radius < canvas.width / 2) ? 1 : -1;
        
        // Change velocity X and Y
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        
        // Increase ball speed with each hit
        ball.speed += 0.1;
    }
    
    // Check collision with flowers
    flowers.forEach(flower => {
        if (flower.active && checkFlowerCollision(ball, flower)) {
            // Change ball color when hitting a flower
            ball.color = flower.color;
            flower.active = false;
        }
    });
}

// Create and spawn a flower at random position
function spawnFlower() {
    // Create a new flower at a random position on the canvas
    // Avoid spawning too close to edges or paddles
    const margin = 50;
    const flowerRadius = 10;
    
    const flower = {
        x: Math.random() * (canvas.width - 2 * margin) + margin,
        y: Math.random() * (canvas.height - 2 * margin) + margin,
        radius: flowerRadius,
        color: getRandomColor(),
        active: true
    };
    
    flowers.push(flower);
    
    // Limit the number of flowers on screen to prevent performance issues
    if (flowers.length > 5) {
        flowers.shift(); // Remove the oldest flower
    }
}

// Check collision between ball and flower
function checkFlowerCollision(ball, flower) {
    const dx = ball.x - flower.x;
    const dy = ball.y - flower.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < ball.radius + flower.radius;
}

// Generate random color for flowers
function getRandomColor() {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Check if game is over
function checkGameOver() {
    if (player.score >= winScore || computer.score >= winScore) {
        gameRunning = false;
        
        // Show game over screen
        const gameOverScreen = document.getElementById('game-over');
        const winnerText = document.getElementById('winner-text');
        
        if (player.score >= winScore) {
            winnerText.innerText = "Player wins!";
        } else {
            winnerText.innerText = "Computer wins!";
        }
        
        gameOverScreen.style.display = 'block';
    }
}

// Game initialization
function gameLoop() {
    if (gameRunning) {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
}

// Start button functionality
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

function startGame() {
    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';
    
    // Reset scores
    player.score = 0;
    computer.score = 0;
    updateScore();
    
    // Reset ball
    resetBall();
    
    // Reset timers and state
    speedIncreaseTimer = 0;
    paddleRotationTimer = 0;
    flowerSpawnTimer = 0;
    backgroundColor = '#000';
    isFlashing = false;
    isRotating = false;
    playerRotation = 0;
    computerRotation = 0;
    
    // Clear flowers
    flowers.length = 0;
    
    // Reset game state
    gameRunning = true;
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener('keydown', function(e) {
    const paddleSpeed = 20;
    
    if (e.key === 'ArrowUp') {
        let newPosition = player.y - paddleSpeed;
        if (newPosition >= 0) {
            player.y = newPosition;
        } else {
            player.y = 0;
        }
    } else if (e.key === 'ArrowDown') {
        let newPosition = player.y + paddleSpeed;
        if (newPosition + player.height <= canvas.height) {
            player.y = newPosition;
        } else {
            player.y = canvas.height - player.height;
        }
    } else if (e.key === ' ' || e.key === 'Spacebar') {
        // Start game when pressing spacebar
        startGame();
    }
});

// Initial render
render();