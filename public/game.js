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
    const menuBtn = document.querySelector('.menu-btn');

    // Загрузка изображений
    const assets = {
        background: new Image(),
        player: new Image(),
        loaded: false,
        loadCount: 0
    };

    assets.background.src = 'fon.jpg';
    assets.player.src = 'sam.png';

    // Проверка загрузки изображений
    function checkAssetsLoaded() {
        assets.loadCount++;
        if (assets.loadCount === 2) {
            assets.loaded = true;
            console.log('Все изображения загружены');
            initGame();
        }
    }

    assets.background.onload = checkAssetsLoaded;
    assets.player.onload = checkAssetsLoaded;
    assets.background.onerror = () => console.error('Ошибка загрузки фона');
    assets.player.onerror = () => console.error('Ошибка загрузки изображения игрока');

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
                width: assets.player.width * 0.15,
                height: assets.player.height * 0.15,
                velocity: 0,
                gravity: 0.5,
                jumpForce: -12
            },
            pillars: [],
            score: 0,
            gameOver: false,
            started: false,
            pillarTimer: 0,
            animationId: null
        };

        // Создание препятствий
        function createPillarPair() {
            const gap = 250; // Пространство между столбами
            const minHeight = 150;
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
            if (!game.started && !game.gameOver) {
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
            console.log('Игра начинается');
            mainMenu.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            resetGame();
            game.started = true;
            game.gameOver = false;
            gameLoop();
        }

        // Перезапуск игры
        function restartGame() {
            gameOverScreen.classList.add('hidden');
            resetGame();
            game.started = true;
            game.gameOver = false;
            gameLoop();
        }

        // Возврат в меню
        function returnToMenu() {
            cancelAnimationFrame(game.animationId);
            gameOverScreen.classList.add('hidden');
            mainMenu.classList.remove('hidden');
            game.started = false;
        }

        // Сброс состояния игры
        function resetGame() {
            game.pillars = [];
            game.player.y = canvas.height / 2;
            game.player.velocity = 0;
            game.score = 0;
            game.pillarTimer = 0;
            scoreElement.textContent = '0';
        }

        // Обновление игрового состояния
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
            
            // Генерация препятствий
            game.pillarTimer++;
            if (game.pillarTimer > 120) {
                createPillarPair();
                game.pillarTimer = 0;
            }
            
            // Обновление препятствий
            for (let i = game.pillars.length - 1; i >= 0; i--) {
                game.pillars[i].x -= 4;
                
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
            ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
            
            // Препятствия
            ctx.fillStyle = '#795548';
            game.pillars.forEach(pillar => {
                ctx.fillRect(pillar.x, pillar.y, pillar.width, pillar.height);
            });
            
            // Игрок
            ctx.drawImage(
                assets.player, 
                game.player.x, 
                game.player.y, 
                game.player.width, 
                game.player.height
            );
        }

        // Игровой цикл
        function gameLoop() {
            update();
            draw();
            
            if (!game.gameOver) {
                game.animationId = requestAnimationFrame(gameLoop);
            }
        }

        // Назначение обработчиков кнопок
        playBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', restartGame);
        menuBtn.addEventListener('click', returnToMenu);
    }
});
