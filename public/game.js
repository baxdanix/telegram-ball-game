document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const menuScreen = document.getElementById('menu');
    const aboutScreen = document.getElementById('about');
    const gameOverScreen = document.getElementById('gameOver');
    const finalScoreElement = document.getElementById('finalScore');
    const startBtn = document.getElementById('startBtn');
    const aboutBtn = document.getElementById('aboutBtn');
    const backBtn = document.getElementById('backBtn');
    const restartBtn = document.getElementById('restartBtn');

    // Настройка canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Изображения
    const birdImg = new Image();
    birdImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZmZmIiBkPSJNNDQ4IDI1NmMwLTEwNi4wMzktODUuOTYxLTE5Mi0xOTItMTkyUzY0IDE0OS45NjEgNjQgMjU2czg1Ljk2MSAxOTIgMTkyIDE5MiAxOTItODUuOTYxIDE5Mi0xOTJ6Ii8+PHBhdGggZmlsbD0iIzZlNDVlMiIgZD0iTTI1NiAzMjBjLTM1LjM0NiAwLTY0LTI4LjY1NC02NC02NHMyOC42NTQtNjQgNjQtNjQgNjQgMjguNjU0IDY0IDY0LTI4LjY1NCA2NC02NCA2NHoiLz48cGF0aCBmaWxsPSIjMzAyYjYzIiBkPSJNMzIwIDE2MGMwLTM1LjM0Ni0yOC42NTQtNjQtNjQtNjRzLTY0IDI4LjY1NC02NCA2NCAyOC42NTQgNjQgNjQgNjQgNjQtMjguNjU0IDY0LTY0eiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0yNTYgMTkyYy0xNy42NzMgMC0zMi0xNC4zMjctMzItMzJzMTQuMzI3LTMyIDMyLTMyIDMyIDE0LjMyNyAzMiAzMi0xNC4zMjcgMzItMzIgMzJ6Ii8+PC9zdmc+';

    const lampPostImg = new Image();
    lampPostImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAwIj48cmVjdCB4PSIyMCIgeT0iMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iIzVCNUI1QiIvPjxyZWN0IHg9IjAiIHk9IjI0MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjNUI1QjVCIi8+PGNpcmNsZSBjeD0iMjUiIGN5PSIyMzAiIHI9IjIwIiBmaWxsPSIjRkZDNTAwIi8+PC9zdmc+';

    // Параметры игры (с замедленной скоростью)
    const game = {
        bird: {
            x: 100,
            y: canvas.height / 2,
            width: 40,
            height: 30,
            velocity: 0,
            gravity: 0.3,       // Уменьшена гравитация (было 0.5)
            jumpStrength: -8    // Уменьшена сила прыжка (было -12)
        },
        obstacles: [],
        score: 0,
        gameOver: false,
        started: false,
        obstacleTimer: 0,
        animationFrame: null
    };

    // Обработчики кнопок
    startBtn.addEventListener('click', startGame);
    aboutBtn.addEventListener('click', showAbout);
    backBtn.addEventListener('click', showMenu);
    restartBtn.addEventListener('click', restartGame);

    // Обработчики управления
    function handleInput(e) {
        e.preventDefault();
        
        if (!game.started) {
            startGame();
        } else if (game.gameOver) {
            restartGame();
        } else {
            game.bird.velocity = game.bird.jumpStrength;
        }
    }

    canvas.addEventListener('click', handleInput);
    canvas.addEventListener('touchstart', handleInput);

    function showAbout() {
        menuScreen.classList.add('hidden');
        aboutScreen.classList.remove('hidden');
    }

    function showMenu() {
        aboutScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        menuScreen.classList.remove('hidden');
    }

    function startGame() {
        menuScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        game.started = true;
        resetGame();
        gameLoop();
    }

    function restartGame() {
        gameOverScreen.classList.add('hidden');
        resetGame();
        game.started = true;
        gameLoop();
    }

    function resetGame() {
        game.obstacles = [];
        game.bird.y = canvas.height / 2;
        game.bird.velocity = 0;
        game.score = 0;
        game.gameOver = false;
        scoreElement.textContent = game.score;
    }

    function createObstacle() {
        const gap = 180; // Увеличенный промежуток
        const minHeight = 80;
        const maxHeight = canvas.height - gap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        game.obstacles.push({
            x: canvas.width,
            width: 60,
            topHeight,
            gap,
            passed: false,
            lightOn: Math.random() > 0.5 // Случайно включенный свет
        });
    }

    function update() {
        if (!game.started || game.gameOver) return;
        
        // Обновление птицы
        game.bird.velocity += game.bird.gravity;
        game.bird.y += game.bird.velocity;
        
        // Проверка границ
        if (game.bird.y + game.bird.height > canvas.height || game.bird.y < 0) {
            gameOver();
        }
        
        // Генерация препятствий
        game.obstacleTimer++;
        if (game.obstacleTimer > 120) { // Реже появляются препятствия
            createObstacle();
            game.obstacleTimer = 0;
        }
        
        // Обновление препятствий
        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            game.obstacles[i].x -= 3; // Медленнее двигаются (было 5)
            
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
    }

    function checkCollision(bird, obstacle) {
        const birdRight = bird.x + bird.width;
        const birdBottom = bird.y + bird.height;
        const obstacleRight = obstacle.x + obstacle.width;
        
        // Проверка по горизонтали
        if (birdRight < obstacle.x || bird.x > obstacleRight) {
            return false;
        }
        
        // Проверка по вертикали
        return bird.y < obstacle.topHeight || 
               birdBottom > obstacle.topHeight + obstacle.gap;
    }

    function gameOver() {
        game.gameOver = true;
        game.started = false;
        finalScoreElement.textContent = game.score;
        gameOverScreen.classList.remove('hidden');
        cancelAnimationFrame(game.animationFrame);
    }

    function draw() {
        // Очистка экрана
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Ночное небо с звёздами
        drawNightSky();
        
        // Земля
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
        
        // Фонарные столбы
        drawObstacles();
        
        // Птица
        drawBird();
        
        // Анимация полёта
        if (game.started && !game.gameOver) {
            game.animationFrame = requestAnimationFrame(gameLoop);
        }
    }

    function drawNightSky() {
        // Градиентное небо
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#0f0c29');
        skyGradient.addColorStop(1, '#24243e');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Звёзды
        ctx.fillStyle = 'white';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.8;
            const size = Math.random() * 1.5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawBird() {
        // Поворот птицы в зависимости от скорости
        const rotation = Math.atan2(game.bird.velocity, 10);
        
        ctx.save();
        ctx.translate(game.bird.x + game.bird.width / 2, game.bird.y + game.bird.height / 2);
        ctx.rotate(rotation);
        ctx.drawImage(
            birdImg, 
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
            ctx.translate(obstacle.x + 25, obstacle.topHeight - 50);
            ctx.drawImage(lampPostImg, 0, 0, 50, 300);
            ctx.restore();
            
            // Нижний фонарный столб (перевёрнутый)
            ctx.save();
            ctx.translate(obstacle.x + 25, obstacle.topHeight + obstacle.gap);
            ctx.scale(1, -1);
            ctx.drawImage(lampPostImg, 0, 0, 50, 300);
            ctx.restore();
            
            // Свет от фонарей
            if (obstacle.lightOn) {
                // Верхний свет
                const topLightGradient = ctx.createRadialGradient(
                    obstacle.x + 25, obstacle.topHeight - 20, 5,
                    obstacle.x + 25, obstacle.topHeight - 20, 40
                );
                topLightGradient.addColorStop(0, 'rgba(255, 197, 0, 0.8)');
                topLightGradient.addColorStop(1, 'rgba(255, 197, 0, 0)');
                ctx.fillStyle = topLightGradient;
                ctx.beginPath();
                ctx.arc(obstacle.x + 25, obstacle.topHeight - 20, 40, 0, Math.PI * 2);
                ctx.fill();
                
                // Нижний свет
                const bottomLightGradient = ctx.createRadialGradient(
                    obstacle.x + 25, obstacle.topHeight + obstacle.gap + 20, 5,
                    obstacle.x + 25, obstacle.topHeight + obstacle.gap + 20, 40
                );
                bottomLightGradient.addColorStop(0, 'rgba(255, 197, 0, 0.8)');
                bottomLightGradient.addColorStop(1, 'rgba(255, 197, 0, 0)');
                ctx.fillStyle = bottomLightGradient;
                ctx.beginPath();
                ctx.arc(obstacle.x + 25, obstacle.topHeight + obstacle.gap + 20, 40, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function gameLoop() {
        update();
        draw();
    }

    // Интеграция с Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.expand();
        Telegram.WebApp.enableClosingConfirmation();
    }
});
