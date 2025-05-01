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
    let obstacleCount = 0; // Contador para controlar padrão de zig-zag
    let playerMovementSpeed = 60; // AUMENTADO SIGNIFICATIVAMENTE para melhor resposta em touchscreen
    let obstaclesPerGroup = 1; // Número de obstáculos que aparecem juntos
    let gameTime = 0; // Tempo de jogo em segundos
    let difficultyProgressionRate = 0.25; // Reduzido para progressão mais lenta (era 0.5)
    let lastTouchTime = 0; // Para detectar toques rápidos

    // Controles de teclado para movimento mais rápido
    document.addEventListener('keydown', handleKeyDown);

    // Obstáculos possíveis (emojis)
    const obstacles = ['🚧', '🪨', '🌵', '🚶', '🛢️', '🦝', '🐕'];

    // Iniciar jogo
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);

    // Controles de toque aprimorados
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

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
        obstacleCount = 0;
        obstaclesPerGroup = 1;
        gameTime = 0;
        updateScore();
        
        // Iniciar música de fundo
        backgroundMusic.play().catch(e => console.log('Erro ao reproduzir música:', e));
        
        // Iniciar geração de elementos
        obstacleInterval = setInterval(createObstacleGroup, 1500);
        roadLineInterval = setInterval(createRoadLine, 300);
        scoreInterval = setInterval(() => {
            score += 1;
            updateScore();
        }, 100);
        
        // Aumentar dificuldade com o tempo - MODIFICADO para progressão mais lenta
        difficultyInterval = setInterval(() => {
            gameTime++;
            
            // Aumentar velocidade mais lentamente
            if (gameSpeed < 20 && gameTime % 4 === 0) { // A cada 4 segundos em vez de a cada segundo
                gameSpeed += difficultyProgressionRate;
                
                // Reduzir o intervalo de criação de obstáculos à medida que a velocidade aumenta
                clearInterval(obstacleInterval);
                // Intervalo mais longo para dar mais tempo ao jogador
                const newInterval = Math.max(800, 2000 - (gameSpeed - 5) * 80);
                obstacleInterval = setInterval(createObstacleGroup, newInterval);
            }
            
            // Aumentar o número de obstáculos por grupo a cada 30 segundos (era 20)
            if (gameTime % 30 === 0 && obstaclesPerGroup < 4) {
                obstaclesPerGroup++;
                console.log(`Aumentando obstáculos por grupo para: ${obstaclesPerGroup}`);
            }
        }, 1000);
        
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

    // Nova função para criar grupos de obstáculos
    function createObstacleGroup() {
        if (!isGameRunning) return;
        
        // Criar vários obstáculos com base no nível de dificuldade atual
        for (let i = 0; i < obstaclesPerGroup; i++) {
            // Pequeno atraso entre cada obstáculo no grupo para criar padrões
            setTimeout(() => {
                createObstacle(i);
            }, i * 200); // 200ms de atraso entre cada obstáculo no grupo
        }
    }

    function createObstacle(groupIndex = 0) {
        if (!isGameRunning) return;
        
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        
        // Escolher um emoji aleatório
        const randomEmoji = obstacles[Math.floor(Math.random() * obstacles.length)];
        obstacle.textContent = randomEmoji;
        
        // Posicionar na estrada
        const roadWidth = 80; // Largura da estrada (%)
        const roadStart = 10; // Início da estrada (%)
        
        // Determinar se este obstáculo fará parte de um padrão zig-zag
        const isZigZag = Math.random() < 0.4; // 40% de chance de ser zig-zag
        
        let obstaclePosition;
        
        // Posicionamento especial para grupos de obstáculos
        if (obstaclesPerGroup > 1) {
            if (groupIndex === 0) {
                // Primeiro obstáculo do grupo - posição aleatória
                obstaclePosition = roadStart + Math.random() * roadWidth;
            } else {
                // Obstáculos subsequentes - criar padrões baseados no índice
                // Dividir a estrada em seções para criar formações
                const sectionWidth = roadWidth / (obstaclesPerGroup + 1);
                
                if (Math.random() < 0.5) {
                    // Padrão em linha
                    obstaclePosition = roadStart + (groupIndex + 1) * sectionWidth;
                } else {
                    // Padrão diagonal ou disperso
                    obstaclePosition = roadStart + Math.random() * roadWidth;
                    
                    // Garantir distância mínima entre obstáculos
                    const minDistance = 15; // % mínimo de distância
                    const existingObstacles = document.querySelectorAll('.obstacle');
                    let tooClose = false;
                    
                    existingObstacles.forEach(existing => {
                        const existingPos = parseFloat(existing.style.left);
                        if (Math.abs(existingPos - obstaclePosition) < minDistance) {
                            tooClose = true;
                        }
                    });
                    
                    // Se estiver muito próximo, reposicionar
                    if (tooClose) {
                        obstaclePosition = roadStart + Math.random() * roadWidth;
                    }
                }
            }
        } else if (isZigZag) {
            // Armazenar informação de zig-zag no elemento
            obstacle.dataset.zigzag = 'true';
            obstacle.dataset.zigzagDirection = Math.random() < 0.5 ? 'left' : 'right';
            
            // Posição inicial para padrão zig-zag
            if (obstacle.dataset.zigzagDirection === 'left') {
                obstaclePosition = roadStart + roadWidth * 0.7; // Começa mais à direita
            } else {
                obstaclePosition = roadStart + roadWidth * 0.3; // Começa mais à esquerda
            }
        } else {
            // Posição aleatória para obstáculos normais
            obstaclePosition = roadStart + Math.random() * roadWidth;
        }
        
        obstacle.style.left = `${obstaclePosition}%`;
        obstacle.style.top = '-50px';
        
        obstaclesContainer.appendChild(obstacle);
        
        // Animar o obstáculo descendo
        moveObstacle(obstacle);
        
        obstacleCount++;
    }

    function moveObstacle(obstacle) {
        let posY = -50;
        let posX = parseFloat(obstacle.style.left);
        const isZigZag = obstacle.dataset.zigzag === 'true';
        let zigzagDirection = obstacle.dataset.zigzagDirection;
        let zigzagAmplitude = 0.5; // Amplitude do movimento lateral
        
        const moveInterval = setInterval(() => {
            if (!isGameRunning) {
                clearInterval(moveInterval);
                return;
            }
            
            posY += gameSpeed;
            
            // Movimento em zig-zag para obstáculos especiais
            if (isZigZag) {
                // Aumentar amplitude com base na velocidade do jogo
                const amplitudeFactor = Math.min(2, gameSpeed / 5);
                
                if (zigzagDirection === 'left') {
                    posX -= zigzagAmplitude * amplitudeFactor;
                    if (posX < 10) { // Limite esquerdo da estrada
                        zigzagDirection = 'right';
                        obstacle.dataset.zigzagDirection = 'right';
                    }
                } else {
                    posX += zigzagAmplitude * amplitudeFactor;
                    if (posX > 90) { // Limite direito da estrada
                        zigzagDirection = 'left';
                        obstacle.dataset.zigzagDirection = 'left';
                    }
                }
                
                obstacle.style.left = `${posX}%`;
            }
            
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
    
    // Função para lidar com eventos de teclado
    function handleKeyDown(e) {
        if (!isGameRunning) return;
        
        const roadWidth = 80; // Largura da estrada (%)
        const roadStart = 10; // Início da estrada (%)
        const roadEnd = roadStart + roadWidth;
        const playerWidth = 10; // Largura aproximada do jogador em %
        const moveStep = 8; // AUMENTADO para movimento mais rápido com teclado (era 5)
        
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            playerPosition = Math.max(roadStart + playerWidth/2, playerPosition - moveStep);
            updatePlayerPosition();
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            playerPosition = Math.min(roadEnd - playerWidth/2, playerPosition + moveStep);
            updatePlayerPosition();
        }
    }
    
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        lastTouchTime = Date.now();
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
        
        // MELHORADO: Movimento mais responsivo em touchscreen
        // Usar um multiplicador maior para movimentos pequenos para melhor resposta
        const touchSensitivity = Math.abs(diffX) < 20 ? 1.5 : 1.0;
        
        // Ajustar a posição do jogador com base no movimento - AUMENTADO SIGNIFICATIVAMENTE
        playerPosition += (diffX / window.innerWidth) * playerMovementSpeed * touchSensitivity;
        
        // Limitar o jogador à estrada
        playerPosition = Math.max(roadStart + playerWidth/2, Math.min(roadEnd - playerWidth/2, playerPosition));
        
        // Atualizar posição com transição mais rápida para touchscreen
        updatePlayerPositionTouch();
        
        // Atualizar posição inicial para o próximo movimento
        touchStartX = touchX;
    }
    
    // Nova função para lidar com o fim do toque
    function handleTouchEnd(e) {
        // Detectar toques rápidos (tap) para movimentos mais precisos
        const touchDuration = Date.now() - lastTouchTime;
        
        // Se foi um toque rápido (menos de 300ms), considerar como um tap
        if (touchDuration < 300) {
            // Verificar se há múltiplos toques para determinar a direção
            const touches = e.changedTouches;
            if (touches.length > 0) {
                const touchX = touches[0].clientX;
                const screenCenter = window.innerWidth / 2;
                
                // Mover para a esquerda ou direita com base na posição do toque
                if (touchX < screenCenter) {
                    // Tap no lado esquerdo da tela - mover para a esquerda
                    playerPosition -= 10; // Movimento rápido
                } else {
                    // Tap no lado direito da tela - mover para a direita
                    playerPosition += 10; // Movimento rápido
                }
                
                // Limitar o jogador à estrada
                const roadWidth = 80;
                const roadStart = 10;
                const roadEnd = roadStart + roadWidth;
                const playerWidth = 10;
                playerPosition = Math.max(roadStart + playerWidth/2, Math.min(roadEnd - playerWidth/2, playerPosition));
                
                // Atualizar posição
                updatePlayerPosition();
            }
        }
        
        touchStartX = 0;
    }
    
    function updatePlayerPosition() {
        // Transição suave para o movimento do jogador
        player.style.transition = 'left 0.1s ease-out';
        player.style.left = `${playerPosition}%`;
    }
    
    // Nova função para atualização mais rápida em touchscreen
    function updatePlayerPositionTouch() {
        // Transição mais rápida para touchscreen
        player.style.transition = 'left 0.05s linear';
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
    
    // Adicionar indicador de nível de dificuldade
    function updateDifficultyIndicator() {
        // Se você quiser adicionar um indicador visual de dificuldade
        // Pode criar um elemento HTML para isso e atualizá-lo aqui
        const difficultyLevel = Math.min(4, Math.floor(gameSpeed / 5) + 1);
        console.log(`Dificuldade atual: ${difficultyLevel}, Obstáculos por grupo: ${obstaclesPerGroup}`);
    }
    
    // Adicionar suporte para pausar o jogo (opcional)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            // Implementar lógica de pausa aqui se desejar
        }
    });
});
