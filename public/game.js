document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('finalScore');
    const mainMenu = document.querySelector('.main-menu');
    const gameOverScreen = document.querySelector('.game-over-screen');
    const playBtn = document.querySelector('.play-btn');
    const restartBtn = document.querySelector('.restart-btn');

    // Загрузка изображений
    const assets = {
        player: new Image(),
        pillar: new Image(),
        loaded: false
    };

    assets.player.src = 'san.png';
    assets.pillar.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 300"><rect width="100" height="300" fill="%234CAF50"/></svg>';

    // Ожидание загрузки изображений
    let imagesLoaded = 0;
    function imageLoaded() {
        imagesLoaded++;
        if (imagesLoaded === 2) {
            assets.loaded = true;
            initGame();
        }
    }

    assets.player.onload = imageLoaded;
    assets.pillar.onload = imageLoaded;

    function initGame() {
        // Настройка canvas
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Параметры игры
        const game = {
            player: {
                x: 150,
                y: canvas.height / 2,
                width: 50,
                height: 50,
                velocity: 0,
                gravity: 0.5,
                jumpForce: -10,
                rotation: 0
            },
            pillars: [],
            score: 0,
            gameOver: false,
            started: false,
            pillarTimer: 0,
            animationId: null,
            lastTime: 0
        };

        // Размеры игрока после загрузки изображения
        if (assets.player.complete) {
            game.player.width = assets.player.width * 0.15;
            game.player.height = assets.player.height * 0.15;
        }

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

        // Обработка ввода
        function handleInput(e) {
            e.preventDefault();
            if (!game.started) {
                startGame();
            } else if (game.gameOver) {
                restartGame();
            } else {
                game.player.velocity = game.player.jumpForce;
            }
        }

        canvas.addEventListener('click', handleInput);
        canvas.addEventListener('touchstart', handleInput);

        // Запуск игры
        function startGame() {
            mainMenu.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            resetGame();
            game.started = true;
            game.lastTime = performance.now();
            gameLoop();
        }

        // Перезапуск игры
        function restartGame() {
            gameOverScreen.classList.add('hidden');
            resetGame();
            game.started = true;
            game.lastTime = performance.now();
            gameLoop();
        }

        // Сброс состояния игры
        function resetGame() {
            game.pillars = [];
            game.player.y = canvas.height / 2;
            game.player.velocity = 0;
            game.player.rotation = 0;
            game.score = 0;
            game.pillarTimer = 0;
            game.gameOver = false;
            scoreElement.textContent = '0';
        }

        // Обновление игрового состояния
        function update(timestamp) {
            if (!game.started || game.gameOver) return;
            
            const deltaTime = (timestamp - game.lastTime) / 1000;
            game.lastTime = timestamp;
            
            // Физика игрока
            game.player.velocity += game.player.gravity;
            game.player.y += game.player.velocity;
            game.player.rotation = Math.min(Math.max(game.player.velocity * 5, -25), 25);
            
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
            
            // Обновление столбов
            for (let i = game.pillars.length - 1; i >= 0; i--) {
                game.pillars[i].x -= 3;
                
                // Проверка столкновений
                if (checkCollision(game.player, game.pillars[i])) {
                    gameOver();
                    return;
                }
                
                // Подсчет очков
                if (!game.pillars[i].passed && game.pillars[i].x + game.pillars[i].width < game.player.x) {
                    game.pillars[i].passed = true;
                    game.score++;
                    scoreElement.textContent = game.score;
                }
                
                // Удаление за пределами экрана
                if (game.pillars[i].x + game.pillars[i].width < 0) {
                    game.pillars.splice(i, 1);
                }
            }
        }

        // Проверка столкновений
        function checkCollision(player, pillar) {
            return player.x < pillar.x + pillar.width &&
                   player.x + player.width > pillar.x &&
                   player.y < pillar.y + pillar.height &&
                   player.y + player.height > pillar.y;
        }

        // Завершение игры
        function gameOver() {
            game.gameOver = true;
            game.started = false;
            finalScoreElement.textContent = game.score;
            gameOverScreen.classList.remove('hidden');
            cancelAnimationFrame(game.animationId);
        }

        // Отрисовка игры
        function draw() {
            if (!assets.loaded) return;
            
            // Очистка экрана
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Фон
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Земля
            ctx.fillStyle = '#8BC34A';
            ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
            
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
            ctx.drawImage(
                assets.player, 
                -game.player.width / 2, 
                -game.player.height / 2, 
                game.player.width, 
                game.player.height
            );
            ctx.restore();
        }

        // Игровой цикл
        function gameLoop(timestamp) {
            update(timestamp);
            draw();
            
            if (!game.gameOver) {
                game.animationId = requestAnimationFrame(gameLoop);
            }
        }

        // Назначение обработчиков кнопок
        playBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', restartGame);
    }
});
