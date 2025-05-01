document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const introScreen = document.getElementById('intro-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('final-score');
    const player = document.getElementById('player');
    const road = document.getElementById('road');
    const obstaclesContainer = document.getElementById('obstacles-container');
    const streetLightsContainer = document.getElementById('street-lights-container');
    const backgroundMusic = document.getElementById('background-music');

    // Variáveis do jogo
    let score = 0;
    let gameSpeed = 5;
    let isGameRunning = false;
    let obstacleInterval;
    let roadLineInterval;
    let scoreInterval;
    let difficultyInterval;
    let playerPosition = 50; // Posição horizontal do jogador (%)
    let touchStartX = 0;

    // Obstáculos possíveis (emojis)
    const obstacles = ['🚧', '🪨', '🌵', '🚶', '🛢️', '🦝', '🐕'];

    // Iniciar jogo
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);

    // Controles de toque
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    // Criar linhas da estrada iniciais
    createInitialRoadLines();
    createInitialStreetLights();

    // Funções do jogo
    function startGame() {
        introScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        isGameRunning = true;
        score = 0;
        gameSpeed = 5;
        updateScore();
        
        // Iniciar música de fundo
        backgroundMusic.play().catch(e => console.log('Erro ao reproduzir música:', e));
        
        // Iniciar geração de elementos
        obstacleInterval = setInterval(createObstacle, 1500);
        roadLineInterval = setInterval(createRoadLine, 300);
        scoreInterval = setInterval(() => {
            score += 1;
            updateScore();
        }, 100);
        
        // Aumentar dificuldade com o tempo
        difficultyInterval = setInterval(() => {
            if (gameSpeed < 15) {
                gameSpeed += 0.5;
            }
        }, 5000);
        
        // Posicionar jogador no centro
        playerPosition = 50;
        updatePlayerPosition();
    }

    function gameOver() {
        isGameRunning = false;
        clearInterval(obstacleInterval);
        clearInterval(roadLineInterval);
        clearInterval(scoreInterval);
        clearInterval(difficultyInterval);
        
        // Parar música
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        
        // Mostrar tela de game over
        finalScoreElement.textContent = `SCORE: ${score}`;
        gameOverScreen.style.display = 'flex';
    }

    function restartGame() {
        gameOverScreen.style.display = 'none';
        
        // Limpar obstáculos
        obstaclesContainer.innerHTML = '';
        
        // Reiniciar jogo
        startGame();
    }

    function updateScore() {
        scoreElement.textContent = `SCORE: ${score}`;
    }

    function createObstacle() {
        if (!isGameRunning) return;
        
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        
        // Escolher um emoji aleatório
        const randomEmoji = obstacles[Math.floor(Math.random() * obstacles.length)];
        obstacle.textContent = randomEmoji;
        
        // Posicionar aleatoriamente na estrada
        const roadWidth = 80; // Largura da estrada (%)
        const roadStart = 10; // Início da estrada (%)
        const obstaclePosition = roadStart + Math.random() * roadWidth;
        
        obstacle.style.left = `${obstaclePosition}%`;
        obstacle.style.top = '-50px';
        
        obstaclesContainer.appendChild(obstacle);
        
        // Animar o obstáculo descendo
        moveObstacle(obstacle);
    }

    function moveObstacle(obstacle) {
        let posY = -50;
        const moveInterval = setInterval(() => {
            if (!isGameRunning) {
                clearInterval(moveInterval);
                return;
            }
            
            posY += gameSpeed;
            obstacle.style.top = `${posY}px`;
            
            // Verificar colisão
            if (isColliding(player, obstacle)) {
                gameOver();
                clearInterval(moveInterval);
                return;
            }
            
            // Remover obstáculo quando sair da tela
            if (posY > window.innerHeight) {
                clearInterval(moveInterval);
                obstacle.remove();
            }
        }, 20);
    }

    function createRoadLine() {
        if (!isGameRunning) return;
        
        const roadLine = document.createElement('div');
        roadLine.className = 'road-line';
        road.appendChild(roadLine);
        
        // Animar a linha descendo
        moveRoadLine(roadLine);
    }

    function moveRoadLine(roadLine) {
        let posY = -50;
        const moveInterval = setInterval(() => {
            if (!isGameRunning) {
                clearInterval(moveInterval);
                return;
            }
            
            posY += gameSpeed;
            roadLine.style.top = `${posY}px`;
            
            // Remover linha quando sair da tela
            if (posY > window.innerHeight) {
                clearInterval(moveInterval);
                roadLine.remove();
            }
        }, 20);
    }

    function createInitialRoadLines() {
        const roadHeight = window.innerHeight;
        const lineSpacing = 100; // Espaçamento entre as linhas
        const numLines = Math.ceil(roadHeight / lineSpacing);
        
        for (let i = 0; i < numLines; i++) {
            const roadLine = document.createElement('div');
            roadLine.className = 'road-line';
            roadLine.style.top = `${i * lineSpacing}px`;
            road.appendChild(roadLine);
        }
    }

    function createInitialStreetLights() {
        // Criar postes de luz nos dois lados da estrada
        const roadHeight = window.innerHeight;
        const lightSpacing = 200; // Espaçamento entre os postes
        const numLights = Math.ceil(roadHeight / lightSpacing) + 1;
        
        for (let i = 0; i < numLights; i++) {
            // Poste do lado esquerdo
            const leftLight = document.createElement('div');
            leftLight.className = 'street-light';
            leftLight.style.left = '5%';
            leftLight.style.top = `${i * lightSpacing}px`;
            streetLightsContainer.appendChild(leftLight);
            
            // Poste do lado direito
            const rightLight = document.createElement('div');
            rightLight.className = 'street-light';
            rightLight.style.right = '5%';
            rightLight.style.top = `${i * lightSpacing}px`;
            streetLightsContainer.appendChild(rightLight);
            
            // Animar os postes
            moveStreetLight(leftLight);
            moveStreetLight(rightLight);
        }
    }
    
    function createStreetLight() {
        if (!isGameRunning) return;
        
        // Criar um novo poste à esquerda
        const leftLight = document.createElement('div');
        leftLight.className = 'street-light';
        leftLight.style.left = '5%';
        leftLight.style.top = '-40px';
        streetLightsContainer.appendChild(leftLight);
        
        // Criar um novo poste à direita
        const rightLight = document.createElement('div');
        rightLight.className = 'street-light';
        rightLight.style.right = '5%';
        rightLight.style.top = '-40px';
        streetLightsContainer.appendChild(rightLight);
        
        // Animar os postes
        moveStreetLight(leftLight);
        moveStreetLight(rightLight);
    }
    
    function moveStreetLight(light) {
        let posY = parseInt(light.style.top) || -40;
        const moveInterval = setInterval(() => {
            if (!isGameRunning) {
                clearInterval(moveInterval);
                return;
            }
            
            posY += gameSpeed;
            light.style.top = `${posY}px`;
            
            // Remover poste quando sair da tela
            if (posY > window.innerHeight) {
                clearInterval(moveInterval);
                light.remove();
            }
        }, 20);
    }
    
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
    }
    
    function handleTouchMove(e) {
        if (!isGameRunning || !touchStartX) return;
        
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const diffX = touchX - touchStartX;
        
        // Calcular nova posição com base no movimento do dedo
        const roadWidth = 80; // Largura da estrada (%)
        const roadStart = 10; // Início da estrada (%)
        const roadEnd = roadStart + roadWidth;
        const playerWidth = 10; // Largura aproximada do jogador em %
        
        // Ajustar a posição do jogador com base no movimento
        playerPosition += (diffX / window.innerWidth) * 15;
        
        // Limitar o jogador à estrada
        playerPosition = Math.max(roadStart + playerWidth/2, Math.min(roadEnd - playerWidth/2, playerPosition));
        
        // Atualizar posição
        updatePlayerPosition();
        
        // Atualizar posição inicial para o próximo movimento
        touchStartX = touchX;
    }
    
    function updatePlayerPosition() {
        player.style.left = `${playerPosition}%`;
    }
    
    function isColliding(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
        
        // Ajustar a área de colisão para ser menor que o elemento visual
        // para tornar a colisão mais precisa e justa
        const collisionMargin = 10;
        
        return !(
            rect1.right - collisionMargin < rect2.left + collisionMargin || 
            rect1.left + collisionMargin > rect2.right - collisionMargin || 
            rect1.bottom - collisionMargin < rect2.top + collisionMargin || 
            rect1.top + collisionMargin > rect2.bottom - collisionMargin
        );
    }
    
    // Adicionar evento para criar postes de luz periodicamente
    setInterval(() => {
        if (isGameRunning) {
            createStreetLight();
        }
    }, 1000);
    
    // Função para ajustar elementos quando a janela é redimensionada
    window.addEventListener('resize', () => {
        // Limpar e recriar linhas da estrada
        const roadLines = document.querySelectorAll('.road-line');
        roadLines.forEach(line => line.remove());
        createInitialRoadLines();
        
        // Limpar e recriar postes de luz
        const streetLights = document.querySelectorAll('.street-light');
        streetLights.forEach(light => light.remove());
        createInitialStreetLights();
        
        // Reposicionar o jogador
        updatePlayerPosition();
    });
    
    // Adicionar animação de piscar para elementos retrô
    setInterval(() => {
        const scoreColor = Math.random() > 0.9 ? '#0ff' : '#0f0';
        scoreElement.style.color = scoreColor;
        scoreElement.style.textShadow = `0 0 5px ${scoreColor}`;
    }, 500);
});
