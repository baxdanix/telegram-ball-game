document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('finalScore');
    const mainMenu = document.querySelector('.main-menu');
    const aboutScreen = document.querySelector('.about-screen');
    const gameOverScreen = document.querySelector('.game-over-screen');
    const playBtn = document.querySelector('.play-btn');
    const aboutBtn = document.querySelector('.about-btn');
    const backBtn = document.querySelector('.back-btn');
    const restartBtn = document.querySelector('.restart-btn');
    const menuBtn = document.querySelector('.menu-btn');

    // Настройка canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Загрузка изображений
    const assets = {
        bird: {
            img: new Image(),
            frames: [
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="%2388d3ce" d="M512 256c0-37.7-23.7-69.9-57.1-82.4 14.7-32.9 8.3-70.8-19.5-98.6-27.8-27.8-65.7-34.2-98.6-19.5C325.9 23.7 293.7 0 256 0s-69.9 23.7-82.4 57.1c-32.9-14.7-70.8-8.3-98.6 19.5-27.8 27.8-34.2 65.7-19.5 98.6C23.7 186.1 0 218.3 0 256s23.7 69.9 57.1 82.4c-14.7 32.9-8.3 70.8 19.5 98.6 27.8 27.8 65.7 34.2 98.6 19.5C186.1 488.3 218.3 512 256 512s69.9-23.7 82.4-57.1c32.9 14.7 70.8 8.3 98.6-19.5 27.8-27.8 34.2-65.7 19.5-98.6C488.3 325.9 512 293.7 512 256z"/></svg>',
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="%236e45e2" d="M512 256c0-37.7-23.7-69.9-57.1-82.4 14.7-32.9 8.3-70.8-19.5-98.6-27.8-27.8-65.7-34.2-98.6-19.5C325.9 23.7 293.7 0 256 0s-69.9 23.7-82.4 57.1c-32.9-14.7-70.8-8.3-98.6 19.5-27.8 27.8-34.2 65.7-19.5 98.6C23.7 186.1 0 218.3 0 256s23.7 69.9 57.1 82.4c-14.7 32.9-8.3 70.8 19.5 98.6 27.8 27.8 65.7 34.2 98.6 19.5C186.1 488.3 218.3 512 256 512s69.9-23.7 82.4-57.1c32.9 14.7 70.8 8.3 98.6-19.5 27.8-27.8 34.2-65.7 19.5-98.6C488.3 325.9 512 293.7 512 256z"/></svg>'
            ],
            currentFrame: 0,
            frameCount: 0,
            frameDelay: 5
        },
        lampPost: new Image(),
        background: null
    };

    assets.bird.img.src = assets.bird.frames[0];
    assets.lampPost.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 300"><rect x="20" y="0" width="10" height="250" fill="%23555555"/><rect x="0" y="240" width="50" height="10" fill="%23555555"/><circle cx="25" cy="230" r="20" fill="%23FFD700"/></svg>';

    // Параметры игры
    const game = {
        bird: {
            x: 100,
            y: canvas.height / 2,
            width: 40,
            height: 40,
            velocity: 0,
            gravity: 0.35,
            jumpStrength: -8,
            rotation: 0
        },
        obstacles: [],
        score: 0,
        gameOver: false,
        started: false,
        obstacleTimer: 0,
        animationFrame: null,
        lastTime: 0,
        stars: []
    };

    // Создание звёзд для фона
    function createStars() {
        game.stars = [];
        for (let i = 0; i < 100; i++) {
            game.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 0.2 + 0.1
            });
        }
    }
    createStars();

    // Обработчики кнопок
    playBtn.addEventListener('click', startGame);
    aboutBtn.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        aboutScreen.classList.remove('hidden');
    });
    backBtn.addEventListener('click', () => {
        aboutScreen.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    });
    restartBtn.addEventListener('click', restartGame);
    menuBtn.addEventListener('click', returnToMenu);

    // Обработчики управления
    function handleInput(e) {
        e.preventDefault();
        
        if (!game.started) {
            startGame();
        } else if (game.gameOver) {
            restartGame();
        } else {
            game.bird.velocity = game.bird.jumpStrength;
            // Анимация взмаха крыльев
            assets.bird.frameCount = 0;
            assets.bird.currentFrame = 1;
        }
    }

    canvas.addEventListener('click', handleInput);
    canvas.addEventListener('touchstart', handleInput);

    function startGame() {
        mainMenu.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        game.started = true;
        game.gameOver = false;
        resetGame();
        gameLoop(performance.now());
    }

    function restartGame() {
        gameOverScreen.classList.add('hidden');
        resetGame();
        game.started = true;
        game.gameOver = false;
        gameLoop(performance.now());
    }

    function returnToMenu() {
        gameOverScreen.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        cancelAnimationFrame(game.animationFrame);
    }

    function resetGame() {
        game.obstacles = [];
        game.bird.y = canvas.height / 2;
        game.bird.velocity = 0;
        game.bird.rotation = 0;
        game.score = 0;
        scoreElement.textContent = game.score;
        game.obstacleTimer = 0;
    }

    function createObstacle() {
        const gap = Math.min(canvas.height * 0.35, 220);
        const minHeight = 100;
        const maxHeight = canvas.height - gap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        game.obstacles.push({
            x: canvas.width,
            width: 60,
            topHeight,
            gap,
            passed: false,
            lightOn: Math.random() > 0.3
        });
    }

    function update(deltaTime) {
        if (!game.started || game.gameOver) return;
        
        // Обновление птицы
        game.bird.velocity += game.bird.gravity;
        game.bird.y += game.bird.velocity;
        game.bird.rotation = Math.atan2(game.bird.velocity, 10) * 0.5;
        
        // Анимация крыльев
        assets.bird.frameCount++;
        if (assets.bird.frameCount >= assets.bird.frameDelay) {
            assets.bird.frameCount = 0;
            assets.bird.currentFrame = assets.bird.currentFrame === 0 ? 1 : 0;
            assets.bird.img.src = assets.bird.frames[assets.bird.currentFrame];
        }
        
        // Проверка границ
        if (game.bird.y + game.bird.height > canvas.height || game.bird.y < 0) {
            gameOver();
        }
        
        // Генерация препятствий
        game.obstacleTimer++;
        if (game.obstacleTimer > 150) {
            createObstacle();
            game.obstacleTimer = 0;
        }
        
        // Обновление препятствий
        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            game.obstacles[i].x -= 3;
            
            // Проверка столкновений
            if (checkCollision(game.bird, game.obstacles[i])) {
                gameOver();
            }
            
            // Удаление за пределами экрана
            if (game.obstacles[i].x + game.obstacles[i].width < 0) {
                game.obstacles.splice(i, 1);
            }
            
            // Подсчет очков
            if (!game.obstacles[i].passed && 
                game.obstacles[i].x + game.obstacles[i].width < game.bird.x) {
                game.obstacles[i].passed = true;
                game.score++;
                scoreElement.textContent = game.score;
            }
        }
        
        // Обновление звёзд
        game.stars.forEach(star => {
            star.x -= star.speed;
            if (star.x < -10) {
                star.x = canvas.width + 10;
                star.y = Math.random() * canvas.height;
            }
        });
    }

    function checkCollision(bird, obstacle) {
        const birdRight = bird.x + bird.width * 0.7;
        const birdLeft = bird.x + bird.width * 0.3;
        const birdBottom = bird.y + bird.height * 0.7;
        const birdTop = bird.y + bird.height * 0.3;
        const obstacleRight = obstacle.x + obstacle.width;
        
        // Проверка по горизонтали
        if (birdRight < obstacle.x || birdLeft > obstacleRight) {
            return false;
        }
        
        // Проверка по вертикали
        return birdTop < obstacle.topHeight || 
               birdBottom > obstacle.topHeight + obstacle.gap;
    }

    function gameOver() {
        game.gameOver = true;
        game.started = false;
        finalScoreElement.textContent = game.score;
        gameOverScreen.classList.remove('hidden');
        cancelAnimationFrame(game.animationFrame);
    }

    function drawBackground() {
        // Градиентное небо
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0f0c29');
        gradient.addColorStop(1, '#302b63');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Луна
        ctx.beginPath();
        ctx.arc(canvas.width - 50, 50, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#f5f3ce';
        ctx.fill();
        ctx.shadowColor = 'rgba(245, 243, 206, 0.4)';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Звёзды
        game.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.fill();
        });
        
        // Земля
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    }

    function drawBird() {
        ctx.save();
        ctx.translate(
            game.bird.x + game.bird.width / 2, 
            game.bird.y + game.bird.height / 2
        );
        ctx.rotate(game.bird.rotation);
        ctx.drawImage(
            assets.bird.img, 
            -game.bird.width / 2, 
            -game.bird.height / 2, 
            game.bird.width, 
            game.bird.height
        );
        ctx.restore();
    }

    function drawObstacles() {
        game.obstacles.forEach(obstacle => {
            // Верхний фонарный столб
            ctx.save();
            ctx.translate(obstacle.x + 30, obstacle.topHeight - 50);
            ctx.drawImage(assets.lampPost, 0, 0, 60, 300);
            ctx.restore();
            
            // Нижний фонарный столб (перевёрнутый)
            ctx.save();
            ctx.translate(obstacle.x + 30, obstacle.topHeight + obstacle.gap);
            ctx.scale(1, -1);
            ctx.drawImage(assets.lampPost, 0, 0, 60, 300);
            ctx.restore();
            
            // Свет от фонарей
            if (obstacle.lightOn) {
                // Верхний свет
                const topLightGradient = ctx.createRadialGradient(
                    obstacle.x + 30, obstacle.topHeight - 20, 5,
                    obstacle.x + 30, obstacle.topHeight - 20, 50
                );
                topLightGradient.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
                topLightGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.fillStyle = topLightGradient;
                ctx.beginPath();
                ctx.arc(obstacle.x + 30, obstacle.topHeight - 20, 50, 0, Math.PI * 2);
                ctx.fill();
                
                // Нижний свет
                const bottomLightGradient = ctx.createRadialGradient(
                    obstacle.x + 30, obstacle.topHeight + obstacle.gap + 20, 5,
                    obstacle.x + 30, obstacle.topHeight + obstacle.gap + 20, 50
                );
                bottomLightGradient.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
                bottomLightGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.fillStyle = bottomLightGradient;
                ctx.beginPath();
                ctx.arc(obstacle.x + 30, obstacle.topHeight + obstacle.gap + 20, 50, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function draw() {
        // Очистка экрана
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Отрисовка элементов
        drawBackground();
        drawObstacles();
        drawBird();
    }

    function gameLoop(timestamp) {
        const deltaTime = timestamp - game.lastTime;
        game.lastTime = timestamp;
        
        update(deltaTime);
        draw();
        
        if (!game.gameOver) {
            game.animationFrame = requestAnimationFrame(gameLoop);
        }
    }

    // Интеграция с Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.expand();
        Telegram.WebApp.enableClosingConfirmation();
    }
});
