class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Game settings
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Animation settings
        this.animationProgress = 0;
        this.animationSpeed = 0.1;
        this.lastUpdateTime = 0;
        this.previousSnake = [{ x: 6, y: 14 }, { x: 5, y: 14 }, { x: 4, y: 14 }];
        
        // Growth animation properties
        this.growingSegment = null;
        this.growthProgress = 0;
        this.isGrowing = false;
        
        // Game state
        this.snake = [
            { x: 6, y: 14 },
            { x: 5, y: 14 },
            { x: 4, y: 14 }
        ];
        this.food = { x: 18, y: 14 };
        this.dx = 1;
        this.dy = 0;
        this.isInitialState = true;
        this.score = 0;
        this.gameRunning = false;
        this.gameOver = false;
        
        // Visual elements
        this.grassPattern = this.generateGrassPattern();
        
        this.init();
    }
    
    init() {
        this.generateFood();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    generateGrassPattern() {
        const patterns = [];
        for (let y = 0; y < this.tileCount; y++) {
            patterns[y] = [];
            for (let x = 0; x < this.tileCount; x++) {
                // Create variation in grass color
                const variation = Math.random() * 0.3;
                const grassType = Math.floor(Math.random() * 3);
                patterns[y][x] = { variation, grassType };
            }
        }
        return patterns;
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                // Allow restart with Space or Enter when game is over
                if (e.code === 'Space' || e.code === 'Enter') {
                    this.restartGame();
                }
                return;
            }
            
            if (!this.gameRunning) {
                // Start game with any arrow key or Space/Enter
                if (e.code === 'Space' || e.code === 'Enter' || 
                    e.code === 'ArrowLeft' || e.code === 'ArrowUp' || 
                    e.code === 'ArrowRight' || e.code === 'ArrowDown') {
                    this.startGame();
                    if (e.code.startsWith('Arrow')) {
                        this.changeDirection(e);
                    }
                }
                return;
            }
            
            this.changeDirection(e);
        });
        
        // Restart button
        this.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
        
        // Start game on first interaction
        document.addEventListener('keydown', () => {
            if (!this.gameRunning && !this.gameOver) {
                this.startGame();
            }
        }, { once: true });
    }
    
    changeDirection(e) {
        const goingUp = this.dy === -1;
        const goingDown = this.dy === 1;
        const goingRight = this.dx === 1;
        const goingLeft = this.dx === -1;
        
        switch (e.code) {
            case 'ArrowLeft':
                if (!goingRight) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'ArrowUp':
                if (!goingDown) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'ArrowRight':
                if (!goingLeft) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
            case 'ArrowDown':
                if (!goingUp) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameOver = false;
        this.gameOverScreen.classList.add('hidden');
        
        // Start moving right
        if (this.dx === 0 && this.dy === 0) {
            this.dx = 1;
            this.dy = 0;
        }
    }
    
    restartGame() {
        // Complete state reset
        this.snake = [{ x: 6, y: 14 }, { x: 5, y: 14 }, { x: 4, y: 14 }];
        this.previousSnake = [{ x: 6, y: 14 }, { x: 5, y: 14 }, { x: 4, y: 14 }];
        this.dx = 1;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.isInitialState = true;
        
        // Reset animation states
        this.animationProgress = 0;
        this.lastUpdateTime = 0;
        
        // Reset growth animation states
        this.isGrowing = false;
        this.growthProgress = 0;
        this.growingSegment = null;
        
        // Regenerate grass pattern for variety
        this.grassPattern = this.generateGrassPattern();
        
        // Update UI elements
        this.updateScore();
        this.finalScoreElement.textContent = '0';
        this.gameOverScreen.classList.add('hidden');
        
        // Generate new food position
        this.generateFood();
        
        // Clear and redraw canvas
        this.clearCanvas();
        this.draw();
        
        // Focus back to the game for immediate keyboard input
        this.canvas.focus();
    }
    
    generateFood() {
        if (this.isInitialState) {
            this.food = { x: 18, y: 14 };
            this.isInitialState = false;
        } else {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            
            // Make sure food doesn't spawn on snake
            for (let segment of this.snake) {
                if (segment.x === this.food.x && segment.y === this.food.y) {
                    this.generateFood();
                    return;
                }
            }
        }
    }
    
    update() {
        if (!this.gameRunning || this.gameOver) return;
        
        // Store previous snake position for smooth animation
        this.previousSnake = this.snake.map(segment => ({ ...segment }));
        
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.endGame();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.endGame();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.generateFood();
            
            // Start growing animation
            this.isGrowing = true;
            this.growthProgress = 0;
            this.growingSegment = { ...this.snake[this.snake.length - 1] };
        } else if (!this.isGrowing) {
            this.snake.pop();
        }
        
        // Reset animation progress for smooth movement
        this.animationProgress = 0;
    }
    
    endGame() {
        // Stop the game immediately
        this.gameOver = true;
        this.gameRunning = false;
        
        // Reset movement to prevent any residual movement
        this.dx = 0;
        this.dy = 0;
        
        // Update final score display
        this.finalScoreElement.textContent = this.score;
        
        // Show game over screen with a slight delay for better UX
        setTimeout(() => {
            this.gameOverScreen.classList.remove('hidden');
            // Focus the restart button for accessibility
            this.restartBtn.focus();
        }, 100);
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawGrassBackground() {
        // Fill with base green color
        this.ctx.fillStyle = '#9ACD32';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw subtle grid pattern
        this.ctx.strokeStyle = '#8FBC8F';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= this.tileCount; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.tileCount; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.canvas.width, y * this.gridSize);
            this.ctx.stroke();
        }
        
        // Add subtle alternating pattern for depth
        for (let y = 0; y < this.tileCount; y++) {
            for (let x = 0; x < this.tileCount; x++) {
                if ((x + y) % 2 === 0) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    this.ctx.fillRect(
                        x * this.gridSize, 
                        y * this.gridSize, 
                        this.gridSize, 
                        this.gridSize
                    );
                }
            }
        }
    }
    
    drawCartoonSnake() {
        if (this.snake.length === 0) return;
        
        // Calculate interpolated positions for smooth movement
        const interpolatedSnake = this.snake.map((segment, index) => {
            if (this.previousSnake[index]) {
                return {
                    x: this.previousSnake[index].x + (segment.x - this.previousSnake[index].x) * this.animationProgress,
                    y: this.previousSnake[index].y + (segment.y - this.previousSnake[index].y) * this.animationProgress
                };
            }
            return segment;
        });
        
        // Add growing segment if applicable
        let allSegments = [...interpolatedSnake];
        if (this.isGrowing && this.growingSegment) {
            const growingPos = {
                x: this.growingSegment.x,
                y: this.growingSegment.y
            };
            allSegments.push(growingPos);
        }
        
        // Draw connections between segments first (behind the segments)
        this.drawSegmentConnections(allSegments);
        
        // Draw snake body segments with size variation
        for (let i = allSegments.length - 1; i >= 0; i--) {
            const segment = allSegments[i];
            const x = segment.x * this.gridSize + this.gridSize / 2;
            const y = segment.y * this.gridSize + this.gridSize / 2;
            
            // Calculate segment size based on position (head largest, tail smallest)
            let baseRadius;
            let segmentColor;
            let highlightColor;
            
            if (i === 0) {
                // Head
                baseRadius = this.gridSize * 0.45;
                segmentColor = '#3b82f6';
                highlightColor = '#60a5fa';
            } else {
                // Body segments with tapering
                const taperFactor = Math.max(0.6, 1 - (i - 1) * 0.05);
                baseRadius = this.gridSize * 0.4 * taperFactor;
                segmentColor = '#60a5fa';
                highlightColor = '#93c5fd';
            }
            
            // Handle growing segment
            if (i === allSegments.length - 1 && this.isGrowing) {
                baseRadius *= this.growthProgress;
                const alpha = this.growthProgress;
                segmentColor = `rgba(96, 165, 250, ${alpha})`;
                highlightColor = `rgba(147, 197, 253, ${alpha})`;
            }
            
            // Draw segment shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(x + 2, y + 2, baseRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw main segment
            this.ctx.fillStyle = segmentColor;
            this.ctx.beginPath();
            this.ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw highlight
            this.ctx.fillStyle = highlightColor;
            this.ctx.beginPath();
            this.ctx.arc(x - baseRadius * 0.3, y - baseRadius * 0.3, baseRadius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw eyes only on head
            if (i === 0) {
                this.drawSnakeEyes(x, y, baseRadius);
            }
        }
    }
    
    drawSegmentConnections(segments) {
        if (segments.length < 2) return;
        
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = this.gridSize * 0.6;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw shadow for connections
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.beginPath();
        for (let i = 0; i < segments.length - 1; i++) {
            const current = segments[i];
            const next = segments[i + 1];
            
            const currentX = current.x * this.gridSize + this.gridSize / 2 + 1;
            const currentY = current.y * this.gridSize + this.gridSize / 2 + 1;
            const nextX = next.x * this.gridSize + this.gridSize / 2 + 1;
            const nextY = next.y * this.gridSize + this.gridSize / 2 + 1;
            
            if (i === 0) {
                this.ctx.moveTo(currentX, currentY);
            }
            this.ctx.lineTo(nextX, nextY);
        }
        this.ctx.stroke();
        
        // Draw main connections
        this.ctx.strokeStyle = '#4ade80';
        this.ctx.beginPath();
        for (let i = 0; i < segments.length - 1; i++) {
            const current = segments[i];
            const next = segments[i + 1];
            
            const currentX = current.x * this.gridSize + this.gridSize / 2;
            const currentY = current.y * this.gridSize + this.gridSize / 2;
            const nextX = next.x * this.gridSize + this.gridSize / 2;
            const nextY = next.y * this.gridSize + this.gridSize / 2;
            
            // Adjust line width for growing segment
            if (i === segments.length - 2 && this.isGrowing) {
                this.ctx.lineWidth = this.gridSize * 0.6 * this.growthProgress;
            }
            
            if (i === 0) {
                this.ctx.moveTo(currentX, currentY);
            }
            this.ctx.lineTo(nextX, nextY);
        }
        this.ctx.stroke();
    }
    
    drawSnakeEyes(headX, headY, headRadius) {
        const eyeOffset = headRadius * 0.3;
        const eyeSize = headRadius * 0.15;
        
        // Eye whites
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(headX - eyeOffset, headY - eyeOffset, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(headX + eyeOffset, headY - eyeOffset, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye pupils
        this.ctx.fillStyle = '#1f2937';
        this.ctx.beginPath();
        this.ctx.arc(headX - eyeOffset, headY - eyeOffset, eyeSize * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(headX + eyeOffset, headY - eyeOffset, eyeSize * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye shine
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(headX - eyeOffset + eyeSize * 0.2, headY - eyeOffset - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(headX + eyeOffset + eyeSize * 0.2, headY - eyeOffset - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawCartoonFood() {
        const x = this.food.x * this.gridSize + this.gridSize / 2;
        const y = this.food.y * this.gridSize + this.gridSize / 2;
        const radius = this.gridSize * 0.4;
        
        // Food shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Apple body
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Apple highlight
        this.ctx.fillStyle = '#f87171';
        this.ctx.beginPath();
        this.ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Apple stem
        this.ctx.fillStyle = '#65a30d';
        this.ctx.fillRect(x - 1, y - radius - 3, 2, 6);
        
        // Apple leaf
        this.ctx.fillStyle = '#84cc16';
        this.ctx.beginPath();
        this.ctx.ellipse(x + 3, y - radius, 3, 2, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    draw() {
        this.clearCanvas();
        this.drawGrassBackground();
        this.drawCartoonFood();
        this.drawCartoonSnake();
        
        // Draw start message
        if (!this.gameRunning && !this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Press any arrow key to start!', this.canvas.width / 2, this.canvas.height / 2 - 10);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Or press SPACE/ENTER', this.canvas.width / 2, this.canvas.height / 2 + 15);
            this.ctx.textAlign = 'left';
        }
    }
    
    gameLoop() {
        const currentTime = Date.now();
        
        // Update animation progress
        if (this.gameRunning && !this.gameOver) {
            this.animationProgress += this.animationSpeed;
            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
            }
            
            // Update growth animation
            if (this.isGrowing) {
                this.growthProgress += this.animationSpeed * 2; // Faster growth animation
                if (this.growthProgress >= 1) {
                    this.growthProgress = 1;
                    this.isGrowing = false;
                    this.growingSegment = null;
                }
            }
        }
        
        // Update game logic at fixed intervals
        if (currentTime - this.lastUpdateTime > 150) {
            this.update();
            this.lastUpdateTime = currentTime;
        }
        
        this.draw();
        
        // Continue the game loop
        requestAnimationFrame(() => {
            this.gameLoop();
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});