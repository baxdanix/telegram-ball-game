document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('finalScore');
    const mainMenu = document.querySelector('.main-menu');
    const gameOverScreen = document.querySelector('.game-over-screen');
    const playBtn = document.querySelector('.play-btn');
    const restartBtn = document.querySelector('.restart-btn');

    // Загрузка изображения игрока
    const playerImg = new Image();
    playerImg.src = 'san.png';

    // Параметры игры
    const game = {
        player: {
            x: 100,
            y: 300,
            width: 50,
            height: 50,
            velocity: 0,
            gravity: 0.5,
            jumpForce: -10,
            rotation: 0
        },
        pillars: [],
        stars: [],
        score: 0,
        gameOver: false,
        started: false,
        pillarTimer: 0,
        animationId: null
    };

    // Настройка canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        game.player.y = canvas.height / 2;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Создание звездного фона
    function createStars() {
        game.stars = [];
        for (let i = 0; i < 200; i++) {
            game.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.5,
                alpha: Math.random() * 0.5 + 0.5
            });
        }
    }
    createStars();

    // Создание столбов
    function createPillarPair() {
        const gap = 200;
        const minHeight = 100;
        const maxHeight = canvas.height - gap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        // Верхний столб
        game.pillars.push({
            x: canvas.width,
            y: 0,
            width: 80,
            height: topHeight,
            passed: false
        });
        
        // Нижний столб
        game.pillars.push({
            x: canvas.width,
            y: topHeight + gap,
            width: 80,
            height: canvas.height - (topHeight + gap),
            passed: false
        });
    }

    // Обработка кликов
    function handleClick(e) {
        e.preventDefault();
        if (!game.started) {
            startGame();
        } else if (!game.gameOver) {
            game.player.velocity = game.player.jumpForce;
            game.player.rotation = -25;
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

    // Перезапуск игры
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
        game.player.rotation = 0;
        game.score = 0;
        game.pillarTimer = 0;
        game.gameOver = false;
        scoreElement.textContent = '0';
        createStars();
    }

    // Обновление игры
    function update() {
        if (!game.started || game.gameOver) return;
        
        // Физика игрока
        game.player.velocity += game.player.gravity;
        game.player.y += game.player.velocity;
        game.player.rotation = Math.min(Math.max(game.player.rotation + game.player.velocity * 0.5, -25), 25);
        
        // Проверка границ
        if (game.player.y < 0 || game.player.y + game.player.height > canvas.height) {
            gameOver();
            return;
        }
        
        // Генерация столбов
        game.pillarTimer++;
        if (game.pillarTimer > 120) {
            createPillarPair();
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
        
        // Обновление звезд
        game.stars.forEach(star => {
            star.x -= star.speed;
            if (star.x < -10) {
                star.x = canvas.width + 10;
                star.y = Math.random() * canvas.height;
            }
        });
    }

    // Окончание игры
    function gameOver() {
        game.gameOver = true;
        finalScoreElement.textContent = game.score;
        gameOverScreen.classList.remove('hidden');
    }

    // Отрисовка игры
    function draw() {
        // Очистка
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Звездный фон
        ctx.fillStyle = 'white';
        game.stars.forEach(star => {
            ctx.globalAlpha = star.alpha;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        ctx.globalAlpha = 1;
        
        // Столбы
        ctx.fillStyle = '#4CAF50';
        game.pillars.forEach(pillar => {
            ctx.fillRect(pillar.x, pillar.y, pillar.width, pillar.height);
        });
        
        // Игрок
        ctx.save();
        ctx.translate(
            game.player.x + game.player.width / 2, 
            game.player.y + game.player.height / 2
        );
        ctx.rotate(game.player.rotation * Math.PI / 180);
        
        if (playerImg.complete) {
            ctx.drawImage(
                playerImg, 
                -game.player.width / 2, 
                -game.player.height / 2, 
                game.player.width, 
                game.player.height
            );
        } else {
            // Fallback если изображение не загрузилось
            ctx.fillStyle = '#FF5722';
            ctx.fillRect(
                -game.player.width / 2, 
                -game.player.height / 2, 
                game.player.width, 
                game.player.height
            );
        }
        
        ctx.restore();
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
