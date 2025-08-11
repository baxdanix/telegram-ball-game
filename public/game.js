document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('finalScore');
    const mainMenu = document.querySelector('.main-menu');
    const gameOverScreen = document.querySelector('.game-over-screen');
    const playBtn = document.querySelector('.play-btn');
    const restartBtn = document.querySelector('.restart-btn');

    // Загружаем изображения
    const playerImg = new Image();
    playerImg.src = 'san.png';
    
    const pillarImg = new Image();
    pillarImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 300"><rect width="100" height="300" fill="%234CAF50"/></svg>';

    // Параметры игры
    const game = {
        player: {
            x: 100,
            y: 300,
            width: 50,
            height: 50,
            velocity: 0,
            gravity: 0.5,
            jumpForce: -10
        },
        pillars: [],
        score: 0,
        gameOver: false,
        started: false,
        pillarTimer: 0,
        animationId: null
    };

    // Настройка canvas
    function resizeCanvas() {
        canvas.width = 400;
        canvas.height = 600;
    }
    resizeCanvas();

    // Создаем столбы
    function createPillar() {
        const gap = 150;
        const topHeight = 100 + Math.random() * 200;
        
        game.pillars.push({
            x: canvas.width,
            y: 0,
            width: 60,
            height: topHeight,
            passed: false
        }, {
            x: canvas.width,
            y: topHeight + gap,
            width: 60,
            height: canvas.height - topHeight - gap,
            passed: false
        });
    }

    // Обработка кликов
    function handleClick() {
        if (!game.started) {
            startGame();
        } else if (!game.gameOver) {
            game.player.velocity = game.player.jumpForce;
        }
    }

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleClick);

    // Запуск игры
    function startGame() {
        mainMenu.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        resetGame();
        game.started = true;
        gameLoop();
    }

    // Перезапуск
    function restartGame() {
        gameOverScreen.classList.add('hidden');
        resetGame();
        game.started = true;
        gameLoop();
    }

    // Сброс игры
    function resetGame() {
        game.pillars = [];
        game.player.y = canvas.height / 2;
        game.player.velocity = 0;
        game.score = 0;
        game.pillarTimer = 0;
        game.gameOver = false;
        scoreElement.textContent = '0';
    }

    // Обновление состояния
    function update() {
        if (!game.started || game.gameOver) return;
        
        // Движение игрока
        game.player.velocity += game.player.gravity;
        game.player.y += game.player.velocity;
        
        // Проверка границ
        if (game.player.y < 0 || game.player.y + game.player.height > canvas.height) {
            gameOver();
            return;
        }
        
        // Генерация столбов
        game.pillarTimer++;
        if (game.pillarTimer > 100) {
            createPillar();
            game.pillarTimer = 0;
        }
        
        // Движение столбов
        for (let i = game.pillars.length - 1; i >= 0; i--) {
            game.pillars[i].x -= 3;
            
            // Проверка столкновений
            if (game.player.x < game.pillars[i].x + game.pillars[i].width &&
                game.player.x + game.player.width > game.pillars[i].x &&
                game.player.y < game.pillars[i].y + game.pillars[i].height &&
                game.player.y + game.player.height > game.pillars[i].y) {
                gameOver();
                return;
            }
            
            // Подсчет очков
            if (!game.pillars[i].passed && game.pillars[i].x + game.pillars[i].width < game.player.x) {
                game.pillars[i].passed = true;
                game.score++;
                scoreElement.textContent = game.score;
            }
            
            // Удаление столбов
            if (game.pillars[i].x + game.pillars[i].width < 0) {
                game.pillars.splice(i, 1);
            }
        }
    }

    // Окончание игры
    function gameOver() {
        game.gameOver = true;
        finalScoreElement.textContent = game.score;
        gameOverScreen.classList.remove('hidden');
    }

    // Отрисовка
    function draw() {
        // Очистка
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Фон
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Столбы
        ctx.fillStyle = '#4CAF50';
        game.pillars.forEach(pillar => {
            ctx.fillRect(pillar.x, pillar.y, pillar.width, pillar.height);
        });
        
        // Игрок
        if (playerImg.complete) {
            ctx.drawImage(playerImg, game.player.x, game.player.y, game.player.width, game.player.height);
        } else {
            ctx.fillStyle = '#FF5722';
            ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
        }
    }

    // Игровой цикл
    function gameLoop() {
        update();
        draw();
        
        if (!game.gameOver) {
            game.animationId = requestAnimationFrame(gameLoop);
        }
    }

    // Кнопки
    playBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
});
