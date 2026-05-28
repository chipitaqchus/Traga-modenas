/**
 * CYBER JACKPOT 2077 - Core Engine
 */

const SYMBOLS = [
    { icon: '💎', weight: 8, multiplier: 10, name: 'Diamante' },
    { icon: '👑', weight: 12, multiplier: 5, name: 'Corona' },
    { icon: '⚡', weight: 18, multiplier: 3, name: 'Rayo' },
    { icon: '🪙', weight: 25, multiplier: 2, name: 'Moneda' },
    { icon: '🎰', weight: 5, multiplier: 25, name: 'Siete' },
    { icon: '🔋', weight: 32, multiplier: 1.5, name: 'Cel_Energia' }
];

let balance = 10000;
let currentBet = 100;
let playerXP = 0;
let playerLevel = 1;
let isSpinning = false;
let globalJackpot = 1420690;

// Referencias seguras al DOM
const elements = {
    loader: document.getElementById('loader'),
    loadProgress: document.getElementById('load-progress'),
    mainApp: document.getElementById('main-app'),
    balanceDisplay: document.getElementById('balance-display'),
    betDisplay: document.getElementById('bet-display'),
    btnBetUp: document.getElementById('btn-bet-up'),
    btnBetDown: document.getElementById('btn-bet-down'),
    spinButton: document.getElementById('spin-button'),
    statusBanner: document.getElementById('status-banner'),
    jackpotCounter: document.getElementById('jackpot-counter'),
    xpProgress: document.getElementById('xp-progress'),
    xpDisplay: document.getElementById('xp-display'),
    levelDisplay: document.getElementById('level-display'),
    historyList: document.getElementById('history-list'),
    flashScreen: document.getElementById('flash-screen'),
    winOverlay: document.getElementById('win-overlay'),
    winTitle: document.getElementById('win-title'),
    winAmount: document.getElementById('win-amount-display'),
    winMult: document.getElementById('win-multiplier-display'),
    confettiCanvas: document.getElementById('confetti-canvas'),
    particles: document.getElementById('particles')
};

let weightedSymbolPool = [];
SYMBOLS.forEach(sym => {
    for (let i = 0; i < sym.weight; i++) {
        weightedSymbolPool.push(sym);
    }
});

// Sintetizador de Audio Web Nativo (Arregla errores de carga externos)
const AudioEngine = {
    ctx: null,
    init() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
    },
    play(type) {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'spin') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.linearRampToValueAtTime(400, now + 0.2);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now); osc.stop(now + 0.25);
        } else if (type === 'reel-stop') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now); osc.stop(now + 0.08);
        } else if (type === 'win') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.setValueAtTime(880, now + 0.1);
            osc.frequency.setValueAtTime(1174.66, now + 0.2);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'jackpot') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(1500, now + 0.8);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            osc.start(now); osc.stop(now + 0.9);
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    buildAmbientParticles();
    checkDailyReset();
    renderInitialReels();
    simulateLoading();
    setupEventListeners();
    
    setInterval(() => {
        globalJackpot += Math.floor(Math.random() * 5) + 1;
        if (elements.jackpotCounter) {
            elements.jackpotCounter.textContent = globalJackpot.toLocaleString('en-US');
        }
    }, 3000);
});

function checkDailyReset() {
    const todayStr = new Date().toDateString();
    const lastAccessDate = localStorage.getItem('cyber_jackpot_last_date');
    const storedBalance = localStorage.getItem('cyber_jackpot_balance');
    const storedXP = localStorage.getItem('cyber_jackpot_xp');
    const storedLevel = localStorage.getItem('cyber_jackpot_level');

    if (storedXP) playerXP = parseInt(storedXP, 10);
    if (storedLevel) playerLevel = parseInt(storedLevel, 10);
    updateXPBar();

    if (!lastAccessDate || lastAccessDate !== todayStr) {
        balance = 10000;
        localStorage.setItem('cyber_jackpot_last_date', todayStr);
        saveStateToStorage();
        showTickerMessage("⚡ CARGA DIARIA REGENERADA: +10,000 CR");
    } else {
        balance = storedBalance ? parseInt(storedBalance, 10) : 10000;
    }
    updateBalanceUI();
}

function saveStateToStorage() {
    localStorage.setItem('cyber_jackpot_balance', balance.toString());
    localStorage.setItem('cyber_jackpot_xp', playerXP.toString());
    localStorage.setItem('cyber_jackpot_level', playerLevel.toString());
}

function simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 12) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                if (elements.loader && elements.mainApp) {
                    elements.loader.style.opacity = '0';
                    elements.loader.style.visibility = 'hidden';
                    elements.mainApp.classList.remove('hidden');
                }
            }, 400);
        }
        if (elements.loadProgress) elements.loadProgress.style.width = `${progress}%`;
    }, 45);
}

function getRandomSymbol() {
    const rndIdx = Math.floor(Math.random() * weightedSymbolPool.length);
    return weightedSymbolPool[rndIdx];
}

function renderInitialReels() {
    for (let i = 1; i <= 3; i++) {
        const reelNode = document.getElementById(`reel-${i}`);
        if (reelNode) {
            reelNode.innerHTML = '';
            const sym = getRandomSymbol();
            const block = document.createElement('div');
            block.className = 'slot-symbol';
            block.textContent = sym.icon;
            block.setAttribute('data-sym-name', sym.name);
            reelNode.appendChild(block);
        }
    }
}

function setupEventListeners() {
    if (elements.spinButton) elements.spinButton.addEventListener('click', () => triggerSpin());
    if (elements.btnBetUp) elements.btnBetUp.addEventListener('click', () => modifyBet(100));
    if (elements.btnBetDown) elements.btnBetDown.addEventListener('click', () => modifyBet(-100));
}

function modifyBet(amount) {
    AudioEngine.play('click');
    if (isSpinning) return;
    const targetedBet = currentBet + amount;
    if (targetedBet >= 100 && targetedBet <= 2000 && targetedBet <= balance) {
        currentBet = targetedBet;
        if (elements.betDisplay) elements.betDisplay.textContent = currentBet.toString();
    }
}

function updateBalanceUI() {
    if (elements.balanceDisplay) elements.balanceDisplay.textContent = balance.toLocaleString('en-US');
}

function showTickerMessage(msg) {
    if (elements.statusBanner) elements.statusBanner.textContent = msg;
}

function triggerSpin() {
    if (isSpinning || balance < currentBet) {
        if (balance < currentBet) showTickerMessage("❌ CRÉDITOS INSUFICIENTES");
        return;
    }

    isSpinning = true;
    balance -= currentBet;
    updateBalanceUI();
    saveStateToStorage();
    
    if (elements.spinButton) {
        const btn = /** @type {HTMLButtonElement} */ (elements.spinButton);
        btn.disabled = true;
    }
    showTickerMessage("🎰 PROCESANDO APUESTA...");

    const outcomeResult = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
    const executionPromises = [];
    
    for (let i = 1; i <= 3; i++) {
        executionPromises.push(animateReelRoll(i, outcomeResult[i - 1]));
    }

    const soundInterval = setInterval(() => AudioEngine.play('spin'), 150);
    
    Promise.all(executionPromises).then(() => {
        clearInterval(soundInterval);
        isSpinning = false;
        if (elements.spinButton) {
            const btn = /** @type {HTMLButtonElement} */ (elements.spinButton);
            btn.disabled = false;
        }
        evaluateRules(outcomeResult);
    });
}

function animateReelRoll(reelId, targetSymbol) {
    return new Promise(resolve => {
        const reelNode = document.getElementById(`reel-${reelId}`);
        if (!reelNode) { resolve(); return; }
        
        const totalFakeSymbols = 15 + (reelId * 5);
        reelNode.innerHTML = '';
        reelNode.classList.add('reel-blur');

        for (let i = 0; i < totalFakeSymbols; i++) {
            const sym = getRandomSymbol();
            const block = document.createElement('div');
            block.className = 'slot-symbol';
            block.textContent = sym.icon;
            reelNode.appendChild(block);
        }

        const definitiveBlock = document.createElement('div');
        definitiveBlock.className = 'slot-symbol';
        definitiveBlock.textContent = targetSymbol.icon;
        definitiveBlock.setAttribute('data-sym-name', targetSymbol.name);
        reelNode.appendChild(definitiveBlock);

        const singleHeight = 180;
        const targetY = -(totalFakeSymbols * singleHeight);

        reelNode.style.transition = 'none';
        reelNode.style.transform = `translateY(0px)`;

        // Forzar reflow mecánico
        /** @type {number} */
        const reflow = reelNode.offsetHeight; 
        void reflow; 

        reelNode.style.transition = `transform ${1.5 + (reelId * 0.4)}s cubic-bezier(0.25, 1, 0.5, 1.15)`;
        reelNode.style.transform = `translateY(${targetY}px)`;

        setTimeout(() => {
            reelNode.classList.remove('reel-blur');
            AudioEngine.play('reel-stop');
            reelNode.style.transition = 'none';
            reelNode.style.transform = 'translateY(0px)';
            reelNode.innerHTML = '';
            reelNode.appendChild(definitiveBlock);
            resolve();
        }, 1500 + (reelId * 400));
    });
}

function evaluateRules(results) {
    const s1 = results[0], s2 = results[1], s3 = results[2];
    let winAmount = 0;
    let winType = "";
    let multiplier = 0;

    if (s1.icon === s2.icon && s2.icon === s3.icon) {
        multiplier = s1.multiplier;
        if (s1.icon === '🎰') {
            winAmount = currentBet * multiplier + Math.floor(globalJackpot * 0.05);
            winType = "JACKPOT";
        } else if (multiplier >= 5) {
            winAmount = currentBet * multiplier;
            winType = "MEGA WIN";
        } else {
            winAmount = currentBet * multiplier;
            winType = "BIG WIN";
        }
    } else if (s1.icon === s2.icon || s2.icon === s3.icon || s1.icon === s3.icon) {
        const matchingSymbol = (s1.icon === s2.icon || s1.icon === s3.icon) ? s1 : s2;
        multiplier = matchingSymbol.multiplier * 0.5;
        winAmount = Math.floor(currentBet * multiplier);
        winType = "GANANCIA MENOR";
    }

    if (winAmount > 0) {
        executeWinSequence(winAmount, winType, multiplier);
    } else {
        showTickerMessage("SUERTE EN LA PRÓXIMA TIRADA");
        addXP(10);
    }

    if (balance < currentBet && balance >= 100) {
        currentBet = Math.floor(balance / 100) * 100;
        if (currentBet < 100) currentBet = 100;
        if (elements.betDisplay) elements.betDisplay.textContent = currentBet.toString();
    }
}

function executeWinSequence(amount, type, mult) {
    balance += amount;
    updateBalanceUI();
    saveStateToStorage();

    showTickerMessage(`🎉 ${type}: +${amount} CR!`);
    addXP(amount * 0.2);

    document.body.classList.add('shake-active');
    if (elements.flashScreen) elements.flashScreen.classList.add('flash-active');
    
    setTimeout(() => document.body.classList.remove('shake-active'), 400);
    setTimeout(() => {
        if (elements.flashScreen) elements.flashScreen.classList.remove('flash-active');
    }, 400);

    if (["JACKPOT", "MEGA WIN", "BIG WIN"].includes(type)) {
        if (type === "JACKPOT") AudioEngine.play('jackpot');
        else AudioEngine.play('win');

        if (elements.winTitle) elements.winTitle.textContent = type;
        if (elements.winAmount) elements.winAmount.textContent = amount.toLocaleString('en-US');
        if (elements.winMult) elements.winMult.textContent = `MULTIPLICADOR X${mult}`;
        
        if (elements.winOverlay) elements.winOverlay.classList.remove('hidden');
        startConfettiBurst();

        setTimeout(() => {
            if (elements.winOverlay) elements.winOverlay.classList.add('hidden');
            stopConfettiBurst();
        }, 4000);
    } else {
        AudioEngine.play('win');
    }

    pushHistoryLog(type, amount);
}

function addXP(amount) {
    playerXP += Math.floor(amount);
    let xpTarget = playerLevel * 150;
    
    while (playerXP >= xpTarget) {
        playerXP -= xpTarget;
        playerLevel++;
        xpTarget = playerLevel * 150;
        showTickerMessage(`⭐ ¡UPGRADE DE SOFTWARE! NIVEL: ${playerLevel}`);
        AudioEngine.play('jackpot');
    }
    
    updateXPBar();
    saveStateToStorage();
}

function updateXPBar() {
    const xpTarget = playerLevel * 150;
    const percentage = (playerXP / xpTarget) * 100;
    if (elements.xpProgress) elements.xpProgress.style.width = `${percentage}%`;
    if (elements.xpDisplay) elements.xpDisplay.textContent = `${playerXP} / ${xpTarget} XP`;
    if (elements.levelDisplay) elements.levelDisplay.textContent = playerLevel.toString();
}

function pushHistoryLog(type, amount) {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    const logItem = document.createElement('div');
    logItem.className = `log-item ${type === 'JACKPOT' ? 'win-jackpot' : (type.includes('WIN') ? 'win-big' : '')}`;
    
    logItem.innerHTML = `
        <div class="log-details">
            <span class="log-type">${type}</span>
            <span class="log-time">${timeStr}</span>
        </div>
        <div class="log-reward">+${amount}</div>
    `;

    if (elements.historyList) {
        const emptyLog = elements.historyList.querySelector('.empty-log');
        if (emptyLog) emptyLog.remove();
        elements.historyList.insertBefore(logItem, elements.historyList.firstChild);
    }
}

function buildAmbientParticles() {
    if (!elements.particles) return;
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'ambient-particle';
        particle.style.width = `${Math.random() * 4 + 2}px`;
        particle.style.height = particle.style.width;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 8 + 6}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        elements.particles.appendChild(particle);
    }
}

let confettiInterval = null;
let confettiPieces = [];

function startConfettiBurst() {
    const canvas = /** @type {HTMLCanvasElement} */ (elements.confettiCanvas);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    confettiPieces = [];
    
    for (let i = 0; i < 120; i++) {
        confettiPieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * canvas.height,
            color: ["#00f0ff", "#ff007f", "#9d4edd", "#ffb703"][Math.floor(Math.random() * 4)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.02,
            tiltAngle: 0
        });
    }

    confettiInterval = requestAnimationFrame(drawConfettiFrame);
}

function drawConfettiFrame() {
    const canvas = /** @type {HTMLCanvasElement} */ (elements.confettiCanvas);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activePieces = 0;

    confettiPieces.forEach(p => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;

        if (p.y <= canvas.height) activePieces++;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
    });

    if (activePieces > 0 && confettiInterval) {
        confettiInterval = requestAnimationFrame(drawConfettiFrame);
    }
}

function stopConfettiBurst() {
    if (confettiInterval) cancelAnimationFrame(confettiInterval);
    confettiInterval = null;
    const canvas = /** @type {HTMLCanvasElement} */ (elements.confettiCanvas);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

window.addEventListener('resize', () => {
    if (confettiInterval && elements.confettiCanvas) {
        const canvas = /** @type {HTMLCanvasElement} */ (elements.confettiCanvas);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});