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

const net = {
    x: (canvas.width - 2) / 2,
    y: 0,
    width: 2,
    height: 10,
    color: 'white'
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
    drawRect(0, 0, canvas.width, canvas.height, '#000');

    // Draw the net
    drawNet();

    // Draw scores
    // drawText(player.score, canvas.width / 4, canvas.height / 5, 'white');
    // drawText(computer.score, 3 * canvas.width / 4, canvas.height / 5, 'white');

    // Draw paddles
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(computer.x, computer.y, computer.width, computer.height, computer.color);

    // Draw ball
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
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
    player.y = e.clientY - rect.top - player.height / 2;
}

// Computer AI
function computerAI() {
    let computerLevel = 0.1; // 0 is easiest, 1 is hardest
    computer.y += (ball.y - (computer.y + computer.height / 2)) * computerLevel;
}

// Update game state
function update() {
    // Update scores
    if (ball.x - ball.radius < 0) {
        computer.score++;
        updateScore();
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        updateScore();
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
}

// Game initialization
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start button functionality
document.getElementById('start-btn').addEventListener('click', function() {
    // Reset scores
    player.score = 0;
    computer.score = 0;
    updateScore();
    
    // Reset ball
    resetBall();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
});

// Initial render
render();