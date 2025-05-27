// Get the canvas element and its 2D context
const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Sound effects
const paddleHitSound = new Audio('https://assets.codepen.io/21542/Clay_Brick_On_Clay_Brick.mp3');
const wallHitSound = new Audio('https://assets.codepen.io/21542/Bounce_Wooden.mp3');
const flowerHitSound = new Audio('https://assets.codepen.io/21542/Bounce_Metallic.mp3');
const scoreSound = new Audio('https://assets.codepen.io/21542/Score.mp3');

// Net object declaration moved here to fix initialization order
const net = {
    x: 0, // Will be set in setCanvasDimensions()
    y: 0,
    width: 2,
    height: 10,
    color: 'white'
};

// Game objects
const ball = {
    x: 0,
    y: 0,
    radius: 10,
    velocityX: 5,
    velocityY: 5,
    speed: 7,
    color: 'white'
};

// Array to hold all balls in play
let balls = [];

const player = {
    x: 0, // left side of canvas
    y: 0, // will be set in resetPositions()
    width: 10,
    height: 100,
    score: 0,
    color: 'white'
};

const computer = {
    x: 0, // will be set in resetPositions()
    y: 0, // will be set in resetPositions()
    width: 10,
    height: 100,
    score: 0,
    color: 'white'
};

// Set canvas dimensions
function setCanvasDimensions() {
    const container = document.querySelector('.game-container');
    const maxWidth = 800;
    const width = Math.min(container.clientWidth, maxWidth);
    const height = width / 2; // Maintain 2:1 aspect ratio

    canvas.width = width;
    canvas.height = height;

    // Update net position
    net.x = (canvas.width - 2) / 2;

    // Update computer paddle position
    computer.x = canvas.width - 10;
}

// Initialize canvas dimensions
setCanvasDimensions();

// Handle window resize
window.addEventListener('resize', function () {
    setCanvasDimensions();
    resetBall();
    render();
});

// Function to reset positions based on current canvas size
function resetPositions() {
    // Set ball position to center of the canvas
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    
    // Set player position
    player.x = 0; // left side
    player.y = (canvas.height - player.height) / 2;
    
    // Set computer position
    computer.x = canvas.width - computer.width; // right side
    computer.y = (canvas.height - computer.height) / 2;
    
    // Adjust paddle height based on canvas height
    const paddleHeight = Math.min(100, canvas.height / 4);
    player.height = paddleHeight;
    computer.height = paddleHeight;
    
    // Adjust ball radius based on canvas width
    ball.radius = Math.max(5, Math.min(10, canvas.width / 80));
    
    // Set center flower position
    centerFlower.x = canvas.width / 2;
    centerFlower.y = canvas.height / 2;
    centerFlower.radius = Math.max(15, Math.min(20, canvas.width / 30));
    centerFlower.petals = centerFlower.maxPetals;
    centerFlower.active = true;
}

// Initialize positions
resetPositions();

// Game state
let gameRunning = false;
const winScore = 10; // Score needed to win the game
let gameDifficulty = 'easy'; // Default difficulty

// Timers
let speedIncreaseTimer = 0;
let paddleRotationTimer = 0;
let ballMultiplyTimer = 0;
const speedIncreaseInterval = 10000; // 10 seconds
const paddleRotationInterval = 10000; // 10 seconds
const ballMultiplyInterval = 10000; // 10 seconds

// Background flash
let isFlashing = false;
let flashTimer = 0;
const flashDuration = 500; // 0.5 seconds
let backgroundColor = '#2196F3'; // Light blue background like classic Pong

// Paddle rotation
let playerRotation = 0;
let computerRotation = 0;
let isRotating = false;
let rotationProgress = 0;
const rotationDuration = 1000; // 1 second for full rotation

// Flowers
const flowers = [];
let flowerSpawnTimer = 0;
const flowerSpawnInterval = 5000; // 5 seconds

// Center flower
const centerFlower = {
    x: 0, // Will be set in resetPositions()
    y: 0, // Will be set in resetPositions()
    radius: 20,
    petals: 8, // Number of "health" points
    maxPetals: 8,
    color: '#FF5733',
    active: true
};

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
    // Adjust net segment spacing based on canvas height
    const spacing = Math.max(10, canvas.height / 30);
    
    for (let i = 0; i <= canvas.height; i += spacing) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

function drawText(text, x, y, color) {
    ctx.fillStyle = color;
    const fontSize = Math.max(25, Math.min(45, canvas.width / 15));
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
}

// Update score display
function updateScore() {
    // We don't need to update DOM elements anymore as scores are drawn directly on canvas
    // Just ensure render is called to update the canvas
}

// Render the game
function render() {
    // Clear the canvas
    drawRect(0, 0, canvas.width, canvas.height, backgroundColor);

    // Draw the net
    drawNet();

    // Draw scores in the center top like the classic Pong style
    const yOffset = Math.max(30, canvas.height / 8);
    drawText(player.score + " : " + computer.score, canvas.width / 2, yOffset, 'white');

    // Draw center flower
    if (centerFlower.active) {
        drawCenterFlower();
    }

    // Draw flowers
    flowers.forEach(flower => {
        if (flower.active) {
            drawCircle(flower.x, flower.y, flower.radius, flower.color);
        }
    });

    // Draw paddles with rotation
    drawRotatedPaddle(player, playerRotation);
    drawRotatedPaddle(computer, computerRotation);

    // Draw all balls
    balls.forEach(ball => {
        drawCircle(ball.x, ball.y, ball.radius, ball.color);
    });
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

// Draw the center flower
function drawCenterFlower() {
    if (!centerFlower.active) return;
    
    const x = centerFlower.x;
    const y = centerFlower.y;
    const radius = centerFlower.radius;
    
    // Draw center circle
    ctx.fillStyle = centerFlower.color;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
    
    // Calculate how many petals to draw based on current health
    const petalCount = centerFlower.petals;
    const fullAngle = Math.PI * 2;
    const angleStep = fullAngle / centerFlower.maxPetals;
    
    // Draw petals
    for (let i = 0; i < petalCount; i++) {
        const angle = i * angleStep;
        const petalX = x + radius * Math.cos(angle);
        const petalY = y + radius * Math.sin(angle);
        
        ctx.fillStyle = centerFlower.color;
        ctx.beginPath();
        ctx.arc(petalX, petalY, radius * 0.4, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
    }
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
    // Clear existing balls
    balls = [];
    
    // Create initial ball
    const newBall = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: Math.max(5, Math.min(10, canvas.width / 80)),
        velocityX: -ball.velocityX,
        velocityY: ball.velocityY,
        speed: 7 * (canvas.width / 800), // Scale ball speed based on canvas width
        color: 'white'
    };
    
    balls.push(newBall);
}

// Create a new ball (for multiplying)
function createNewBall() {
    if (balls.length === 0) return;
    
    // Clone the properties of the first ball
    const baseBall = balls[0];
    const angle = Math.random() * Math.PI * 2; // Random angle
    
    const newBall = {
        x: baseBall.x,
        y: baseBall.y,
        radius: baseBall.radius,
        velocityX: baseBall.speed * Math.cos(angle),
        velocityY: baseBall.speed * Math.sin(angle),
        speed: baseBall.speed,
        color: baseBall.color
    };
    
    balls.push(newBall);
}

// Mouse control for player paddle
canvas.addEventListener('mousemove', movePaddle);

// Touch control for player paddle (for mobile devices)
canvas.addEventListener('touchmove', function(e) {
    e.preventDefault(); // Prevent scrolling when touching the canvas
    if (e.touches.length > 0) {
        const touchY = e.touches[0].clientY;
        const rect = canvas.getBoundingClientRect();
        let paddlePos = touchY - rect.top - player.height / 2;
        
        // Make sure the paddle stays within the canvas
        if (paddlePos < 0) {
            paddlePos = 0;
        } else if (paddlePos + player.height > canvas.height) {
            paddlePos = canvas.height - player.height;
        }
        
        player.y = paddlePos;
    }
});

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
    let computerLevel;
    
    // Set computer AI level based on difficulty
    switch(gameDifficulty) {
        case 'easy':
            computerLevel = 0.05;
            break;
        case 'medium':
            computerLevel = 0.1;
            break;
        case 'hard':
            computerLevel = 0.2;
            break;
        default:
            computerLevel = 0.1;
    }
    
    // Find the nearest ball that is moving toward the computer
    let nearestBall = null;
    let minDistance = Infinity;
    
    for (const b of balls) {
        if (b.velocityX > 0) { // Ball moving toward computer
            const distance = canvas.width - b.x;
            if (distance < minDistance) {
                minDistance = distance;
                nearestBall = b;
            }
        }
    }
    
    // If no balls are moving toward computer, find the nearest ball
    if (!nearestBall && balls.length > 0) {
        for (const b of balls) {
            const distance = Math.abs(canvas.width - b.x);
            if (distance < minDistance) {
                minDistance = distance;
                nearestBall = b;
            }
        }
    }
    
    // If we have a ball to track, move the paddle toward it
    if (nearestBall) {
        // Make the computer more responsive when the ball is moving towards it
        if (nearestBall.velocityX > 0) {
            // Ball is moving towards computer
            computerLevel *= 1.5; // Increase difficulty when ball is moving towards computer
        }
        
        let targetY = nearestBall.y - (computer.height / 2);
        
        // Make sure the paddle stays within the canvas
        if (targetY < 0) {
            targetY = 0;
        } else if (targetY + computer.height > canvas.height) {
            targetY = canvas.height - computer.height;
        }
        
        computer.y += (targetY - computer.y) * computerLevel;
    }
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
            // Increase all balls' speed
            balls.forEach(b => {
                b.speed += 0.5;
            });
            speedIncreaseTimer = 0;
        }
        
        // Ball multiplication every 10 seconds
        ballMultiplyTimer += 16;
        if (ballMultiplyTimer >= ballMultiplyInterval) {
            // Double the number of balls (up to a reasonable limit)
            const currentCount = balls.length;
            if (currentCount < 4) { // Limit to maximum 4 balls to avoid chaos
                for (let i = 0; i < currentCount; i++) {
                    createNewBall();
                }
            }
            ballMultiplyTimer = 0;
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
                backgroundColor = '#2196F3'; // Reset to blue
                isFlashing = false;
            }
        }
    }

    // Process each ball
    let scoreUpdated = false;
    
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        
        // Update scores and handle ball going out of bounds
        if (ball.x - ball.radius < 0) {
            computer.score++;
            scoreUpdated = true;
            scoreSound.play();
            // Remove this ball
            balls.splice(i, 1);
            continue;
        } else if (ball.x + ball.radius > canvas.width) {
            player.score++;
            scoreUpdated = true;
            scoreSound.play();
            // Remove this ball
            balls.splice(i, 1);
            continue;
        }

        // Move the ball
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        // Wall collision (top and bottom)
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
            ball.velocityY = -ball.velocityY;
            wallHitSound.play();
        }

        // Determine which paddle is being hit by the ball and handle collision
        let paddle = (ball.x + ball.radius < canvas.width / 2) ? player : computer;

        if (collision(ball, paddle)) {
            paddleHitSound.play();
            
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
                flowerHitSound.play();
            }
        });
        
        // Check collision with center flower
        if (centerFlower.active && checkCenterFlowerCollision(ball)) {
            // Change ball color when hitting the center flower
            ball.color = centerFlower.color;
            flowerHitSound.play();
            
            // Reduce petals (health) of center flower
            centerFlower.petals--;
            
            // If all petals are gone, deactivate the center flower
            if (centerFlower.petals <= 0) {
                centerFlower.active = false;
            }
        }
    }
    
    // Handle score updates
    if (scoreUpdated) {
        updateScore();
        flashBackground(); // Flash background when a point is scored
        
        // Check if game is over
        if (checkGameOver()) {
            return; // Exit if game is over
        }
        
        // If all balls are gone, reset
        if (balls.length === 0) {
            resetBall();
        }
    }
    
    // Simple AI to control the computer paddle
    computerAI();
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

// Check collision between ball and center flower
function checkCenterFlowerCollision(ball) {
    if (!centerFlower.active) return false;
    
    const dx = ball.x - centerFlower.x;
    const dy = ball.y - centerFlower.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < ball.radius + centerFlower.radius;
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
        return true;
    }
    return false;
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

// Difficulty button functionality
document.getElementById('easy-btn').addEventListener('click', () => setDifficulty('easy'));
document.getElementById('medium-btn').addEventListener('click', () => setDifficulty('medium'));
document.getElementById('hard-btn').addEventListener('click', () => setDifficulty('hard'));

// Function to set difficulty
function setDifficulty(difficulty) {
    gameDifficulty = difficulty;
    
    // Update active button styling
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${difficulty}-btn`).classList.add('active');
}

// Add canvas tap to start on mobile
canvas.addEventListener('touchstart', function(e) {
    if (!gameRunning) {
        e.preventDefault();
        startGame();
    }
});

function startGame() {
    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';
    
    // Reset scores
    player.score = 0;
    computer.score = 0;
    updateScore();
    
    // Reset positions for all game objects
    resetPositions();
    
    // Reset balls
    resetBall();
    
    // Reset timers and state
    speedIncreaseTimer = 0;
    paddleRotationTimer = 0;
    ballMultiplyTimer = 0;
    flowerSpawnTimer = 0;
    backgroundColor = '#2196F3'; // Reset to blue
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

// Initial setup
setCanvasDimensions();
resetPositions();
render();