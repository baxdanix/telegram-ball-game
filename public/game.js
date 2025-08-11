document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('finalScore');
    const mainMenu = document.querySelector('.main-menu');
    const gameOverScreen = document.querySelector('.game-over-screen');

    // Загрузка изображений
    const assets = {
        background: new Image(),
        player: new Image(),
        loaded: false
    };

    assets.background.src = 'fon.jpg';
    assets.player.src = 'sam.png';

    // Ожидание загрузки изображений
    let imagesLoaded = 0;
    const totalImages = Object.keys(assets).length - 1; // минус флаг loaded

    function imageLoaded() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            assets.loaded = true;
            initGame();
        }
    }

    assets.background.onload = imageLoaded;
    assets.player.onload = imageLoaded;

    function initGame() {
        resizeCanvas();
        
        const game = {
            player: {
                x: 150,
                y: canvas.height / 2,
                width: 80,
                height: 60,
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

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Масштабируем размер игрока, если canvas изменился
            if (game) {
                game.player.width = assets.player.width * 0.15;
                game.player.height = assets.player.height * 0.15;
            }
        }
        window.addEventListener('resize', resizeCanvas);

        function createPillarPair() {
            const gap = 250;
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

        function handleInput(e) {
            e.preventDefault();
            if (!game.started) startGame();
            else if (game.gameOver) restartGame();
            else game.player.velocity = game.player.jumpForce;
        }

        canvas.addEventListener('click', handleInput);
        canvas.addEventListener('touchstart', handleInput);

        function startGame() {
            mainMenu.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            resetGame();
            game.started = true;
            gameLoop();
        }

        function restartGame() {
            gameOverScreen.classList.add('hidden');
            resetGame();
            game.started = true;
            gameLoop();
        }

        function resetGame() {
            game.pillars = [];
            game.player.y = canvas.height / 2;
            game.player.velocity = 0;
            game.score = 0;
            game.pillarTimer = 0;
            game.gameOver = false;
            scoreElement.textContent = '0';
        }

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
            if (game.pillarTimer > 120) {
                createPillarPair();
                game.pillarTimer = 0;
            }
            
            // Обновление столбов
            for (let i = game.pillars.length - 1; i >= 0; i--) {
                game.pillars[i].x -= 4;
                
                // Проверка столкновений
                if (checkCollision(game.player, game.pillars[i])) {
                    gameOver();
                    return;
                }
                
                // Подсчёт очков
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

        function checkCollision(player, pillar) {
            return player.x < pillar.x + pillar.width &&
                   player.x + player.width > pillar.x &&
                   player.y < pillar.y + pillar.height &&
                   player.y + player.height > pillar.y;
        }

        function gameOver() {
            game.gameOver = true;
            game.started = false;
            finalScoreElement.textContent = game.score;
            gameOverScreen.classList.remove('hidden');
            cancelAnimationFrame(game.animationId);
        }

        function draw() {
            if (!assets.loaded) return;
            
            // Фон
            ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
            
            // Столбы
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

        function gameLoop() {
            update();
            draw();
            
            if (!game.gameOver) {
                game.animationId = requestAnimationFrame(gameLoop);
            }
        }

        // Кнопки меню
        document.querySelector('.play-btn').addEventListener('click', startGame);
        document.querySelector('.restart-btn').addEventListener('click', restartGame);
    }
});
