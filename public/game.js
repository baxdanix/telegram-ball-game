document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('finalScore');
    const mainMenu = document.querySelector('.main-menu');
    const gameOverScreen = document.querySelector('.game-over-screen');

    // Настройка canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Изображения
    const shipImg = new Image();
    shipImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="%234fc3f7" d="M511.6 36.86l-144 384c-4.19 11.2-16.01 17.7-27.2 13.5-5.47-2.05-9.6-6.33-11.2-11.68L304 288H192l-25.2 134.7c-1.6 5.3-5.8 9.6-11.2 11.7-11.2 4.2-23.0-2.3-27.2-13.5l-144-384c-3.95-10.53.21-22.45 10.19-27.01 5.06-2.3 10.86-2.4 16.01-.2l480 192c10.6 4.2 16.7 15.6 13.2 26.7z"/></svg>';

    const pillarImg = new Image();
    pillarImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 300"><path fill="%23795548" d="M30,0 Q40,20 30,40 Q10,60 30,80 Q50,100 30,120 Q10,140 30,160 Q50,180 30,200 Q10,220 30,240 Q50,260 30,280 Q10,300 30,300 L40,300 Q50,280 40,260 Q60,240 40,220 Q20,200 40,180 Q60,160 40,140 Q20,120 40,100 Q60,80 40,60 Q20,40 40,20 Q60,0 40,0 Z"/></svg>';

    // Параметры игры
    const game = {
        ship: {
            x: 150,
            y: canvas.height / 2,
            width: 50,
            height: 70,
            velocity: 0,
            gravity: 0.4,
            boostStrength: -10,
            rotation: 0
        },
        pillars: [],
        score: 0,
        gameOver: false,
        started: false,
        pillarTimer: 0,
        lastTime: 0,
        animationId: null
    };

    // Создание пары столбов
    function createPillarPair() {
        const gap = 250; // Фиксированный промежуток
        const topHeight = Math.random() * (canvas.height - gap - 200) + 100;
        
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
        if (!game.started) startGame();
        else if (game.gameOver) restartGame();
        else game.ship.velocity = game.ship.boostStrength;
    }

    canvas.addEventListener('click', handleInput);
    canvas.addEventListener('touchstart', handleInput);

    function startGame() {
        mainMenu.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        resetGame();
        game.started = true;
        game.lastTime = performance.now();
        gameLoop();
    }

    function restartGame() {
        gameOverScreen.classList.add('hidden');
        resetGame();
        game.started = true;
        game.lastTime = performance.now();
        gameLoop();
    }

    function resetGame() {
        game.pillars = [];
        game.ship.y = canvas.height / 2;
        game.ship.velocity = 0;
        game.ship.rotation = 0;
        game.score = 0;
        game.pillarTimer = 0;
        game.gameOver = false;
        scoreElement.textContent = '0';
    }

    function update(timestamp) {
        const deltaTime = (timestamp - game.lastTime) / 1000;
        game.lastTime = timestamp;

        // Обновление корабля
        game.ship.velocity += game.ship.gravity;
        game.ship.y += game.ship.velocity * 60 * deltaTime;
        game.ship.rotation = Math.atan2(game.ship.velocity, 20) * 0.5;

        // Проверка границ
        if (game.ship.y < 0 || game.ship.y + game.ship.height > canvas.height) {
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
            game.pillars[i].x -= 4 * 60 * deltaTime;

            // Проверка столкновений
            if (checkCollision(game.ship, game.pillars[i])) {
                gameOver();
                return;
            }

            // Подсчет очков
            if (!game.pillars[i].passed && game.pillars[i].x + game.pillars[i].width < game.ship.x) {
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

    function checkCollision(ship, pillar) {
        return ship.x < pillar.x + pillar.width &&
               ship.x + ship.width > pillar.x &&
               ship.y < pillar.y + pillar.height &&
               ship.y + ship.height > pillar.y;
    }

    function gameOver() {
        game.gameOver = true;
        game.started = false;
        finalScoreElement.textContent = game.score;
        gameOverScreen.classList.remove('hidden');
        cancelAnimationFrame(game.animationId);
    }

    function draw() {
        // Очистка экрана
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Космический фон
        ctx.fillStyle = '#0b0a20';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Столбы
        ctx.fillStyle = '#795548';
        game.pillars.forEach(pillar => {
            ctx.drawImage(pillarImg, pillar.x, pillar.y, pillar.width, pillar.height);
        });

        // Корабль
        ctx.save();
        ctx.translate(game.ship.x + game.ship.width / 2, game.ship.y + game.ship.height / 2);
        ctx.rotate(game.ship.rotation);
        ctx.drawImage(shipImg, -game.ship.width / 2, -game.ship.height / 2, game.ship.width, game.ship.height);
        ctx.restore();
    }

    function gameLoop() {
        if (game.gameOver) return;
        
        update(performance.now());
        draw();
        
        game.animationId = requestAnimationFrame(gameLoop);
    }

    // Кнопки меню
    document.querySelector('.play-btn').addEventListener('click', startGame);
    document.querySelector('.restart-btn').addEventListener('click', restartGame);
    document.querySelector('.menu-btn').addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        cancelAnimationFrame(game.animationId);
    });
});
