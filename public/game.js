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
    const upBtn = document.querySelector('.up-btn');
    const downBtn = document.querySelector('.down-btn');

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
                width: 0,
                height: 0,
                targetY: canvas.height / 2, // Новая цель по Y
                speedY: 3, // Скорость движения вверх/вниз
                speedX: 2, // Скорость движения вперед (уменьшена)
                isMoving: false // Двигается ли вверх/вниз
            },
            pillars: [],
            score: 0,
            gameOver: false,
            started: false,
            pillarTimer: 0,
            animationId: null,
            lastTime: 0,
            backgroundOffset: 0
        };

        // Размеры игрока после загрузки изображения
        game.player.width = assets.player.width * 0.2; // Увеличено на 20%
        game.player.height = assets.player.height * 0.2; // Увеличено на 20%

        // Создание препятствий
        function createPillarPair() {
            const gap = 300; // Увеличенный промежуток
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
        function handleKeyDown(e) {
            if (!game.started || game.gameOver) return;
            
            if (e.key === 'ArrowUp' || e.key === 'w') {
                moveUp();
            } else if (e.key === 'ArrowDown' || e.key === 's') {
                moveDown();
            }
        }

        function moveUp() {
            if (game.started && !game.gameOver) {
                game.player.targetY = Math.max(100, game.player.y - 150);
                game.player.isMoving = true;
            }
        }

        function moveDown() {
            if (game.started && !game.gameOver) {
                game.player.targetY = Math.min(canvas.height - 100, game.player.y + 150);
                game.player.isMoving = true;
            }
        }

        upBtn.addEventListener('click', moveUp);
        downBtn.addEventListener('click', moveDown);
        document.addEventListener('keydown', handleKeyDown);

        // Запуск игры
        function startGame() {
            console.log('Игра начинается');
            mainMenu.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            resetGame();
            game.started = true;
            game.gameOver = false;
            game.lastTime = performance.now();
            gameLoop();
        }

        // Перезапуск игры
        function restartGame() {
            gameOverScreen.classList.add('hidden');
            resetGame();
            game.started = true;
            game.gameOver = false;
            game.lastTime = performance.now();
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
            game.player.targetY = canvas.height / 2;
            game.player.isMoving = false;
            game.score = 0;
            game.pillarTimer = 0;
            game.backgroundOffset = 0;
            scoreElement.textContent = '0';
        }

        // Обновление игрового состояния
        function update(timestamp) {
            if (!game.started || game.gameOver) return;
            
            const deltaTime = (timestamp - game.lastTime) / 1000;
            game.lastTime = timestamp;
            
            // Плавное движение к цели
            if (Math.abs(game.player.y - game.player.targetY) > 1) {
                game.player.y += (game.player.targetY - game.player.y) * 0.1;
                game.player.isMoving = true;
            } else {
                game.player.isMoving = false;
            }
            
            // Движение фона (параллакс-эффект)
            game.backgroundOffset = (game.backgroundOffset - game.player.speedX * 0.5) % canvas.width;
            
            // Генерация препятствий
            game.pillarTimer++;
            if (game.pillarTimer > 180) { // Реже появляются препятствия
                createPillarPair();
                game.pillarTimer = 0;
            }
            
            // Обновление препятствий
            for (let i = game.pillars.length - 1; i >= 0; i--) {
                game.pillars[i].x -= game.player.speedX * 60 * deltaTime;
                
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
            
            // Фон с параллакс-эффектом
            ctx.drawImage(assets.background, game.backgroundOffset, 0, canvas.width, canvas.height);
            if (game.backgroundOffset < canvas.width) {
                ctx.drawImage(assets.background, game.backgroundOffset + canvas.width, 0, canvas.width, canvas.height);
            }
            
            // Препятствия
            ctx.fillStyle = '#3a2c28';
            game.pillars.forEach(pillar => {
                // Добавляем текстуру столбам
                ctx.fillRect(pillar.x, pillar.y, pillar.width, pillar.height);
                ctx.strokeStyle = '#5a4a45';
                ctx.lineWidth = 3;
                for (let y = 0; y < pillar.height; y += 20) {
                    ctx.beginPath();
                    ctx.moveTo(pillar.x, pillar.y + y);
                    ctx.lineTo(pillar.x + pillar.width, pillar.y + y);
                    ctx.stroke();
                }
            });
            
            // Игрок с тенью
            ctx.shadowColor = 'rgba(79, 195, 247, 0.7)';
            ctx.shadowBlur = 15;
            ctx.drawImage(
                assets.player, 
                game.player.x, 
                game.player.y, 
                game.player.width, 
                game.player.height
            );
            ctx.shadowBlur = 0;
            
            // Эффект двигателя при движении
            if (game.player.isMoving) {
                ctx.fillStyle = `rgba(255, 100, 0, ${0.5 + Math.random() * 0.3})`;
                ctx.beginPath();
                ctx.ellipse(
                    game.player.x - 10, 
                    game.player.y + game.player.height / 2, 
                    15, 
                    8, 
                    0, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            }
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
        menuBtn.addEventListener('click', returnToMenu);
    }
});
