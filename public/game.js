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
        ship: new Image(),
        asteroid: new Image(),
        engineFire: new Image()
    };

    assets.ship.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="%234fc3f7" d="M511.6 36.86l-144 384c-4.19 11.2-16.01 17.7-27.2 13.5-5.47-2.05-9.6-6.33-11.2-11.68L304 288H192l-25.2 134.7c-1.6 5.3-5.8 9.6-11.2 11.7-11.2 4.2-23.0-2.3-27.2-13.5l-144-384c-3.95-10.53.21-22.45 10.19-27.01 5.06-2.3 10.86-2.4 16.01-.2l480 192c10.6 4.2 16.7 15.6 13.2 26.7z"/></svg>';
    assets.asteroid.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 300"><path fill="%23795548" d="M50,0 Q60,20 50,40 Q30,60 50,80 Q70,100 50,120 Q30,140 50,160 Q70,180 50,200 Q30,220 50,240 Q70,260 50,280 Q30,300 50,300 L60,300 Q70,280 60,260 Q80,240 60,220 Q40,200 60,180 Q80,160 60,140 Q40,120 60,100 Q80,80 60,60 Q40,40 60,20 Q80,0 60,0 Z"/></svg>';
    assets.engineFire.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><radialGradient id="fireGradient"><stop offset="0%" stop-color="%23ff9100"/><stop offset="100%" stop-color="%23ff5252"/></radialGradient><path fill="url(%23fireGradient)" d="M50,100 Q60,70 50,50 Q30,30 50,10 Q70,30 50,50 Q60,70 50,100 Z"/></svg>';

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
            rotation: 0,
            engineFire: false,
            engineTimer: 0
        },
        pillars: [],
        score: 0,
        gameOver: false,
        started: false,
        pillarTimer: 0,
        animationFrame: null,
        lastTime: 0,
        stars: []
    };

    // Создание звёзд для фона
    function createStars() {
        game.stars = [];
        for (let i = 0; i < 150; i++) {
            game.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 2 + 1
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
            game.ship.velocity = game.ship.boostStrength;
            game.ship.engineFire = true;
            game.ship.engineTimer = 10;
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
        game.pillars = [];
        game.ship.y = canvas.height / 2;
        game.ship.velocity = 0;
        game.ship.rotation = 0;
        game.score = 0;
        scoreElement.textContent = game.score;
        game.pillarTimer = 0;
    }

    function createPillarPair() {
        const gap = Math.min(canvas.height * 0.4, 250);
        const minHeight = 100;
        const maxHeight = canvas.height - gap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        // Верхний столб
        game.pillars.push({
            x: canvas.width,
            y: 0,
            width: 60,
            height: topHeight,
            type: 'top',
            passed: false
        });
        
        // Нижний столб
        game.pillars.push({
            x: canvas.width,
            y: topHeight + gap,
            width: 60,
            height: canvas.height - (topHeight + gap),
            type: 'bottom',
            passed: false
        });
    }

    function update(deltaTime) {
        if (!game.started || game.gameOver) return;
        
        // Обновление корабля
        game.ship.velocity += game.ship.gravity;
        game.ship.y += game.ship.velocity;
        game.ship.rotation = Math.atan2(game.ship.velocity, 20) * 0.5;
        
        // Анимация двигателя
        if (game.ship.engineFire) {
            game.ship.engineTimer--;
            if (game.ship.engineTimer <= 0) {
                game.ship.engineFire = false;
            }
        }
        
        // Проверка границ
        if (game.ship.y + game.ship.height > canvas.height || game.ship.y < 0) {
            gameOver();
        }
        
        // Генерация столбов
        game.pillarTimer++;
        if (game.pillarTimer > 120) {
            createPillarPair();
            game.pillarTimer = 0;
        }
        
        // Обновление столбов
        for (let i = game.pillars.length - 1; i >= 0; i--) {
            game.pillars[i].x -= 4; // Фиксированная скорость
            
            // Проверка столкновений
            if (checkCollision(game.ship, game.pillars[i])) {
                gameOver();
            }
            
            // Удаление за пределами экрана
            if (game.pillars[i].x + game.pillars[i].width < 0) {
                game.pillars.splice(i, 1);
            }
            
            // Подсчет очков
            if (!game.pillars[i].passed && 
                game.pillars[i].x + game.pillars[i].width < game.ship.x) {
                game.pillars[i].passed = true;
                // Считаем только верхние столбы
                if (game.pillars[i].type === 'top') {
                    game.score++;
                    scoreElement.textContent = game.score;
                }
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

    function checkCollision(ship, pillar) {
        const shipRight = ship.x + ship.width * 0.8;
        const shipLeft = ship.x + ship.width * 0.2;
        const shipBottom = ship.y + ship.height * 0.8;
        const shipTop = ship.y + ship.height * 0.2;
        const pillarRight = pillar.x + pillar.width;
        
        // Проверка по горизонтали
        if (shipRight < pillar.x || shipLeft > pillarRight) {
            return false;
        }
        
        // Проверка по вертикали
        return shipTop < pillar.y + pillar.height && 
               shipBottom > pillar.y;
    }

    function gameOver() {
        game.gameOver = true;
        game.started = false;
        finalScoreElement.textContent = game.score;
        gameOverScreen.classList.remove('hidden');
        cancelAnimationFrame(game.animationFrame);
    }

    function drawBackground() {
        // Космический фон
        ctx.fillStyle = '#0b0a20';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Звёзды
        game.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.fill();
        });
        
        // Туманности
        const nebula1 = ctx.createRadialGradient(
            canvas.width * 0.3, canvas.height * 0.2, 0,
            canvas.width * 0.3, canvas.height * 0.2, 200
        );
        nebula1.addColorStop(0, 'rgba(124, 77, 255, 0.1)');
        nebula1.addColorStop(1, 'rgba(124, 77, 255, 0)');
        ctx.fillStyle = nebula1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawShip() {
        ctx.save();
        ctx.translate(
            game.ship.x + game.ship.width / 2, 
            game.ship.y + game.ship.height / 2
        );
        ctx.rotate(game.ship.rotation);
        
        // Отрисовка корабля
        ctx.drawImage(
            assets.ship, 
            -game.ship.width / 2, 
            -game.ship.height / 2, 
            game.ship.width, 
            game.ship.height
        );
        
        // Огонь двигателя
        if (game.ship.engineFire) {
            ctx.save();
            ctx.translate(-game.ship.width * 0.3, game.ship.height * 0.4);
            ctx.scale(0.8, 1.2);
            ctx.globalAlpha = 0.7;
            ctx.drawImage(
                assets.engineFire, 
                -20, 
                0, 
                40, 
                40
            );
            ctx.restore();
        }
        
        ctx.restore();
    }

    function drawPillars() {
        game.pillars.forEach(pillar => {
            ctx.save();
            
            // Столбы
            ctx.drawImage(
                assets.asteroid, 
                pillar.x, 
                pillar.y, 
                pillar.width, 
                pillar.height
            );
            
            // Свечение для верхних столбов
            if (pillar.type === 'top') {
                const glow = ctx.createRadialGradient(
                    pillar.x + pillar.width / 2, 
                    pillar.y + pillar.height, 
                    0,
                    pillar.x + pillar.width / 2, 
                    pillar.y + pillar.height, 
                    50
                );
                glow.addColorStop(0, 'rgba(121, 85, 72, 0.7)');
                glow.addColorStop(1, 'rgba(121, 85, 72, 0)');
                ctx.fillStyle = glow;
                ctx.fillRect(
                    pillar.x - 20, 
                    pillar.y + pillar.height - 30, 
                    pillar.width + 40, 
                    50
                );
            }
            
            ctx.restore();
        });
    }

    function draw() {
        // Очистка экрана
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Отрисовка элементов
        drawBackground();
        drawPillars();
        drawShip();
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
