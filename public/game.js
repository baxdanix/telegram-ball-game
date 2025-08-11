document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('finalScore');
    const speedElement = document.getElementById('speed');
    const mainMenu = document.querySelector('.main-menu');
    const gameOverScreen = document.querySelector('.game-over-screen');
    const playBtn = document.querySelector('.play-btn');
    const restartBtn = document.querySelector('.restart-btn');
    const menuBtn = document.querySelector('.menu-btn');
    const joystickContainer = document.querySelector('.joystick-container');
    const joystick = document.querySelector('.joystick');

    // Параметры игры
    const game = {
        player: {
            x: 150,
            y: 0,
            width: 60,
            height: 60,
            speed: 3,
            maxSpeed: 6,
            minSpeed: 1
        },
        pillars: [],
        stars: [],
        score: 0,
        gameOver: false,
        started: false,
        pillarTimer: 0,
        animationId: null,
        lastTime: 0,
        difficultyTimer: 0,
        difficulty: 1,
        joystick: {
            active: false,
            x: 0,
            y: 0,
            startX: 0,
            startY: 0,
            maxDistance: 50
        }
    };

    // Настройка canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 120; // Учитываем место для джойстика
        game.player.y = canvas.height / 2;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Создание звёзд для фона
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

    // Создание препятствий
    function createPillarPair() {
        const gap = 250 + Math.random() * 50; // Случайный промежуток
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

    // Управление джойстиком
    function handleJoystickStart(e) {
        e.preventDefault();
        game.joystick.active = true;
        const rect = joystickContainer.getBoundingClientRect();
        game.joystick.startX = rect.left + rect.width / 2;
        game.joystick.startY = rect.top + rect.height / 2;
        updateJoystickPosition(e);
    }

    function handleJoystickMove(e) {
        if (!game.joystick.active) return;
        e.preventDefault();
        updateJoystickPosition(e);
    }

    function handleJoystickEnd() {
        game.joystick.active = false;
        joystick.style.transform = 'translate(0, 0)';
        game.player.speed = 3; // Возвращаем среднюю скорость
        speedElement.textContent = '1x';
    }

    function updateJoystickPosition(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // Позиция относительно центра джойстика
        const deltaX = clientX - game.joystick.startX;
        const deltaY = clientY - game.joystick.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);
        
        // Ограничение расстояния
        const limitedDistance = Math.min(distance, game.joystick.maxDistance);
        const limitedX = Math.cos(angle) * limitedDistance;
        const limitedY = Math.sin(angle) * limitedDistance;
        
        // Обновление позиции джойстика
        joystick.style.transform = `translate(${limitedX}px, ${limitedY}px)`;
        
        // Управление скоростью (влево/вправо)
        if (deltaX < -10) { // Влево - замедление
            game.player.speed = Math.max(game.minSpeed, 3 + deltaX / 30);
            speedElement.textContent = (game.player.speed / 3).toFixed(1) + 'x';
        } else if (deltaX > 10) { // Вправо - ускорение
            game.player.speed = Math.min(game.maxSpeed, 3 + deltaX / 30);
            speedElement.textContent = (game.player.speed / 3).toFixed(1) + 'x';
        } else {
            game.player.speed = 3;
            speedElement.textContent = '1x';
        }
        
        // Управление высотой (вверх/вниз)
        if (deltaY < -10) { // Вверх
            game.player.y = Math.max(50, game.player.y - 5);
        } else if (deltaY > 10) { // Вниз
            game.player.y = Math.min(canvas.height - 50, game.player.y + 5);
        }
    }

    // Настройка обработчиков джойстика
    joystickContainer.addEventListener('mousedown', handleJoystickStart);
    joystickContainer.addEventListener('touchstart', handleJoystickStart);
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('touchmove', handleJoystickMove);
    document.addEventListener('mouseup', handleJoystickEnd);
    document.addEventListener('touchend', handleJoystickEnd);

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
        game.player.speed = 3;
        game.score = 0;
        game.pillarTimer = 0;
        game.difficultyTimer = 0;
        game.difficulty = 1;
        scoreElement.textContent = '0';
        speedElement.textContent = '1x';
        createStars();
    }

    // Обновление игрового состояния
    function update(timestamp) {
        if (!game.started || game.gameOver) return;
        
        const deltaTime = (timestamp - game.lastTime) / 1000;
        game.lastTime = timestamp;
        
        // Увеличение сложности каждые 2-3 минуты
        game.difficultyTimer += deltaTime;
        if (game.difficultyTimer > 10) { // 10 секунд для теста (вместо 120-180)
            game.difficultyTimer = 0;
            game.difficulty += 0.1;
            console.log('Увеличение сложности: ' + game.difficulty.toFixed(1));
        }
        
        // Генерация препятствий (частота зависит от сложности)
        game.pillarTimer++;
        if (game.pillarTimer > 120 / game.difficulty) {
            createPillarPair();
            game.pillarTimer = 0;
        }
        
        // Обновление препятствий
        for (let i = game.pillars.length - 1; i >= 0; i--) {
            game.pillars[i].x -= game.player.speed * 60 * deltaTime;
            
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
        // Очистка экрана
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем звёздный фон
        ctx.fillStyle = 'white';
        game.stars.forEach(star => {
            ctx.globalAlpha = star.alpha;
            ctx.fillRect(star.x, star.y, star.size, star.size);
            star.x -= star.speed * game.player.speed;
            if (star.x < -5) {
                star.x = canvas.width + 5;
                star.y = Math.random() * canvas.height;
            }
        });
        ctx.globalAlpha = 1;
        
        // Рисуем туманности
        drawNebula(100, 100, 300, 0.1, '#4a148c');
        drawNebula(canvas.width - 200, 300, 400, 0.08, '#01579b');
        
        // Рисуем препятствия
        ctx.fillStyle = '#3a2c28';
        game.pillars.forEach(pillar => {
            // Градиент для столбов
            const gradient = ctx.createLinearGradient(pillar.x, 0, pillar.x + pillar.width, 0);
            gradient.addColorStop(0, '#2c1e18');
            gradient.addColorStop(1, '#4a3a34');
            ctx.fillStyle = gradient;
            
            ctx.fillRect(pillar.x, pillar.y, pillar.width, pillar.height);
            
            // Текстура столбов
            ctx.strokeStyle = '#5a4a45';
            ctx.lineWidth = 3;
            for (let y = 0; y < pillar.height; y += 20) {
                ctx.beginPath();
                ctx.moveTo(pillar.x, pillar.y + y);
                ctx.lineTo(pillar.x + pillar.width, pillar.y + y);
                ctx.stroke();
            }
        });
        
        // Рисуем игрока
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.moveTo(game.player.x, game.player.y + game.player.height / 2);
        ctx.lineTo(game.player.x + game.player.width, game.player.y);
        ctx.lineTo(game.player.x + game.player.width, game.player.y + game.player.height);
        ctx.closePath();
        ctx.fill();
        
        // Эффект двигателя
        if (game.joystick.active) {
            ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, 0.7)`;
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

    // Рисуем туманность
    function drawNebula(x, y, size, alpha, color) {
        ctx.globalAlpha = alpha;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
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
});
