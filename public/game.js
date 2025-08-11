document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOver');
    
    // Настройка canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Параметры игры
    const game = {
        ball: {
            x: 100,
            y: canvas.height / 2,
            radius: 20,
            velocity: 0,
            gravity: 0.5,
            jumpStrength: -12
        },
        obstacles: [],
        score: 0,
        gameOver: false,
        started: false,
        obstacleTimer: 0
    };
    
    // Обработчики управления
    function handleInput(e) {
        e.preventDefault();
        
        if (!game.started) {
            startGame();
        } else if (game.gameOver) {
            resetGame();
        } else {
            game.ball.velocity = game.ball.jumpStrength;
        }
    }
    
    canvas.addEventListener('click', handleInput);
    canvas.addEventListener('touchstart', handleInput);
    
    function startGame() {
        game.started = true;
        startScreen.style.display = 'none';
        resetGame();
    }
    
    function resetGame() {
        game.obstacles = [];
        game.ball.y = canvas.height / 2;
        game.ball.velocity = 0;
        game.score = 0;
        game.gameOver = false;
        gameOverScreen.style.display = 'none';
        scoreElement.textContent = `Score: ${game.score}`;
    }
    
    function createObstacle() {
        const gap = 150;
        const minHeight = 50;
        const maxHeight = canvas.height - gap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        game.obstacles.push({
            x: canvas.width,
            width: 50,
            topHeight,
            gap,
            passed: false
        });
    }
    
    function update() {
        if (!game.started || game.gameOver) return;
        
        // Обновление мяча
        game.ball.velocity += game.ball.gravity;
        game.ball.y += game.ball.velocity;
        
        // Проверка границ
        if (game.ball.y + game.ball.radius > canvas.height) {
            gameOver();
        }
        
        if (game.ball.y - game.ball.radius < 0) {
            game.ball.y = game.ball.radius;
            game.ball.velocity = 0;
        }
        
        // Генерация препятствий
        game.obstacleTimer++;
        if (game.obstacleTimer > 100) {
            createObstacle();
            game.obstacleTimer = 0;
        }
        
        // Обновление препятствий
        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            game.obstacles[i].x -= 5;
            
            // Проверка столкновений
            if (checkCollision(game.ball, game.obstacles[i])) {
                gameOver();
            }
            
            // Удаление за пределами экрана
            if (game.obstacles[i].x + game.obstacles[i].width < 0) {
                game.obstacles.splice(i, 1);
            }
            
            // Подсчет очков
            if (!game.obstacles[i].passed && 
                game.obstacles[i].x + game.obstacles[i].width < game.ball.x) {
                game.obstacles[i].passed = true;
                game.score++;
                scoreElement.textContent = `Score: ${game.score}`;
            }
        }
    }
    
    function checkCollision(ball, obstacle) {
        const inHorizontalRange = 
            ball.x + ball.radius > obstacle.x && 
            ball.x - ball.radius < obstacle.x + obstacle.width;
        
        const inVerticalGap = 
            ball.y - ball.radius > obstacle.topHeight && 
            ball.y + ball.radius < obstacle.topHeight + obstacle.gap;
        
        return inHorizontalRange && !inVerticalGap;
    }
    
    function gameOver() {
        game.gameOver = true;
        gameOverScreen.style.display = 'block';
    }
    
    function draw() {
        // Очистка экрана
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Фон
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Земля
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        
        // Мяч
        ctx.beginPath();
        ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        
        // Препятствия
        ctx.fillStyle = '#2E8B57';
        game.obstacles.forEach(obs => {
            // Верхнее препятствие
            ctx.fillRect(obs.x, 0, obs.width, obs.topHeight);
            // Нижнее препятствие
            ctx.fillRect(
                obs.x, 
                obs.topHeight + obs.gap, 
                obs.width, 
                canvas.height - obs.topHeight - obs.gap
            );
        });
    }
    
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    // Интеграция с Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.expand();
        Telegram.WebApp.enableClosingConfirmation();
        
        // Можно получить данные пользователя
        const user = Telegram.WebApp.initDataUnsafe.user;
        if (user) {
            console.log(`Hello, ${user.first_name}!`);
        }
    }
    
    gameLoop();
});