
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", startGame);

function startGame() {
  const welcome = document.querySelector(".welcome");

  welcome.innerHTML = `
    <div class="sparkle">✧ ˚ · .</div>

    <div class="game-header">
      <p class="eyebrow">A LITTLE CHALLENGE FOR YOU</p>
      <div class="love-banner" id="loveBanner">You've got this! ♡</div>
      <div class="score-board">
        <span>♡</span>
        <span id="score">0</span>
        <span>/ 19</span>
      </div>
    </div>

    <p class="game-instruction">
      Hold the bow, pull back to aim, and release to shoot.
      Hit the target 19 times!
    </p>

    <div class="game-area">
      <canvas id="archeryCanvas" width="640" height="390"></canvas>
    </div>

    <p class="game-status" id="gameStatus">
      Hold and pull back to load your arrow ♡
    </p>

    <button class="game-again" id="resetBtn">Start over ♡</button>
    <p class="footer">A little surprise awaits you!</p>
  `;

  welcome.classList.add("game-screen");
  setupArchery();
}

function setupArchery() {
  const canvas = document.getElementById("archeryCanvas");
  const ctx = canvas.getContext("2d");
  const status = document.getElementById("gameStatus");
  const scoreText = document.getElementById("score");
  const banner = document.getElementById("loveBanner");
  const resetBtn = document.getElementById("resetBtn");

  const W = canvas.width;
  const H = canvas.height;

  const bow = { x: 105, y: 245, radius: 48 };
  const target = { x: 535, y: 170, radius: 49 };

  let score = 0;
  let aiming = false;
  let pointer = { x: bow.x - 70, y: bow.y };
  let arrow = null;
  let shooting = false;
  let animationId = null;
  let lastTime = 0;
  let gameOver = false;
  let particles = [];

  const gravity = 440;
  const powerMultiplier = 5.1;

  function position(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * W / rect.width,
      y: (event.clientY - rect.top) * H / rect.height
    };
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, "#fff5fa");
    gradient.addColorStop(1, "#eae5ff");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Soft clouds
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let i = 0; i < 5; i++) {
      const x = 60 + i * 135;
      const y = 55 + (i % 2) * 30;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.arc(x + 23, y - 7, 27, 0, Math.PI * 2);
      ctx.arc(x + 47, y, 21, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    ctx.fillStyle = "#e7d5e5";
    ctx.fillRect(0, 350, W, 40);

    // Flowers
    ctx.font = "23px serif";
    ctx.fillText("✿", 28, 340);
    ctx.fillText("✿", 220, 340);
    ctx.fillText("✿", 400, 340);
    ctx.fillText("✿", 590, 340);

    ctx.fillStyle = "#bd91b3";
    ctx.font = "19px serif";
    ctx.fillText("✧", 280, 115);
    ctx.fillText("♡", 465, 75);
    ctx.fillText("✧", 600, 260);
  }

  function drawTarget() {
    ctx.save();

    ctx.shadowColor = "rgba(174,120,170,0.3)";
    ctx.shadowBlur = 14;

    const colors = [
      "#d99dbb",
      "#fff0f5",
      "#d99dbb",
      "#fff0f5",
      "#e5b85e"
    ];

    colors.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(
        target.x,
        target.y,
        target.radius - i * 9,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = color;
      ctx.fill();
    });

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "21px serif";
    ctx.textAlign = "center";
    ctx.fillText("♡", target.x, target.y + 7);

    ctx.restore();
  }

  function drawBow() {
    ctx.save();

    ctx.strokeStyle = "#a8799b";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(
      bow.x,
      bow.y,
      bow.radius,
      -Math.PI / 2,
      Math.PI / 2
    );
    ctx.stroke();

    // Bow string
    const stringX = aiming ? pointer.x : bow.x;

    ctx.strokeStyle = "#d2a9c8";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(bow.x, bow.y - bow.radius);
    ctx.lineTo(stringX, aiming ? pointer.y : bow.y);
    ctx.lineTo(bow.x, bow.y + bow.radius);
    ctx.stroke();

    ctx.restore();
  }

  function drawArrow(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.strokeStyle = "#986d8c";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    // Arrowhead
    ctx.fillStyle = "#cba0be";
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(7, -8);
    ctx.lineTo(7, 8);
    ctx.closePath();
    ctx.fill();

    // Feathers
    ctx.strokeStyle = "#d99dbb";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-29, 0);
    ctx.lineTo(-37, -9);
    ctx.moveTo(-29, 0);
    ctx.lineTo(-37, 9);
    ctx.stroke();

    ctx.restore();
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.font = "19px serif";
      ctx.fillText(p.symbol, p.x, p.y);
    });
    ctx.globalAlpha = 1;
  }

  function drawAimLine() {
    if (!aiming) return;

    const dx = bow.x - pointer.x;
    const dy = bow.y - pointer.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = "rgba(175,120,165,0.5)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(bow.x, bow.y);
    ctx.lineTo(
      bow.x + Math.cos(angle) * 130,
      bow.y - Math.sin(angle) * 130
    );
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    drawBackground();
    drawTarget();
    drawBow();
    drawAimLine();

    if (aiming) {
      const dx = bow.x - pointer.x;
      const dy = bow.y - pointer.y;
      const angle = Math.atan2(dy, dx);
      drawArrow(bow.x, bow.y, angle);
    } else if (shooting && arrow) {
      drawArrow(arrow.x, arrow.y, arrow.angle);
    } else if (!gameOver) {
      drawArrow(bow.x + 55, bow.y, 0);
    }

    drawParticles();
  }

  function createCelebration() {
    const symbols = ["♡", "✧", "✿", "✨"];

    for (let i = 0; i < 22; i++) {
      particles.push({
        x: target.x + (Math.random() - 0.5) * 100,
        y: target.y + (Math.random() - 0.5) * 70,
        vx: (Math.random() - 0.5) * 130,
        vy: -Math.random() * 130 - 30,
        life: 1,
        symbol: symbols[i % symbols.length],
        color: i % 2 ? "#d99dbb" : "#d4ae60"
      });
    }
  }

  function updateParticles(dt) {
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 100 * dt;
      p.life -= dt * 0.8;
    });

    particles = particles.filter(p => p.life > 0);
  }

  function launchArrow() {
    const dx = bow.x - pointer.x;
    const dy = bow.y - pointer.y;
    const pull = Math.min(Math.hypot(dx, dy), 105);

    if (pull < 12) {
      aiming = false;
      status.textContent = "Pull a little further to shoot ♡";
      draw();
      return;
    }

    const angle = Math.atan2(dy, dx);
    const power = pull * powerMultiplier;

    arrow = {
      x: bow.x,
      y: bow.y,
      vx: Math.cos(angle) * power,
      vy: -Math.sin(angle) * power,
      angle
    };

    aiming = false;
    shooting = true;
    lastTime = 0;
    status.textContent = "There it goes! ✨";

    animationId = requestAnimationFrame(animate);
  }

  function animate(time) {
    if (!shooting || gameOver) return;

    if (!lastTime) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.025);
    lastTime = time;

    arrow.x += arrow.vx * dt;
    arrow.y += arrow.vy * dt;

    arrow.vy += gravity * dt;
    arrow.angle = Math.atan2(-arrow.vy, arrow.vx);

    updateParticles(dt);

    const distance = Math.hypot(
      arrow.x - target.x,
      arrow.y - target.y
    );

    if (distance <= target.radius) {
      registerHit();
      return;
    }

    if (
      arrow.x > W + 30 ||
      arrow.y > H + 30 ||
      arrow.x < -30 ||
      arrow.y < -30
    ) {
      shooting = false;
      arrow = null;
      status.textContent = "Not quite! Try another shot ♡";
      draw();
      return;
    }

    draw();
    animationId = requestAnimationFrame(animate);
  }

  function registerHit() {
    shooting = false;
    arrow = null;
    score++;

    scoreText.textContent = score;
    banner.textContent = "LOVE YOU ♡";
    banner.classList.remove("pop");
    void banner.offsetWidth;
    banner.classList.add("pop");

    createCelebration();
    draw();

    if (score >= 19) {
      gameOver = true;
      status.textContent = "19 perfect hits! You did it! ♡";
      setTimeout(showSurprise, 1200);
      return;
    }

    status.textContent = "BULLSEYE! Another one! ♡";

    const celebrationStart = performance.now();

    function celebrationFrame(now) {
      if (gameOver) return;

      const elapsed = (now - celebrationStart) / 1000;
      updateParticles(0.016);
      draw();

      if (elapsed < 0.8) {
        requestAnimationFrame(celebrationFrame);
      } else {
        particles = [];
        draw();
      }
    }

    requestAnimationFrame(celebrationFrame);
  }

  function showSurprise() {
    const welcome = document.querySelector(".welcome");

    welcome.innerHTML = `
      <div class="sparkle">✧ ˚ · .</div>
      <div class="surprise-screen">
        <p class="eyebrow">YOU DID IT!</p>
        <h1>19 out of 19! ♡</h1>
        <div class="surprise-heart">💗</div>
        <h2>Every arrow found its way.</h2>
        <p class="intro">
          And now, your little surprise is waiting...
        </p>
        <div class="surprise-note">
          The photograph and your letter will be revealed here.
          <br><br>
          <strong>Made just for you ♡</strong>
        </div>
      </div>
    `;

    welcome.classList.add("game-screen");
  }

  function resetGame() {
    if (animationId) cancelAnimationFrame(animationId);

    score = 0;
    aiming = false;
    shooting = false;
    arrow = null;
    gameOver = false;
    particles = [];
    lastTime = 0;

    scoreText.textContent = "0";
    banner.textContent = "You've got this! ♡";
    status.textContent = "Hold the bow, pull back, and release ♡";

    draw();
  }

  canvas.addEventListener("pointerdown", event => {
    if (shooting || gameOver) return;

    const p = position(event);
    const distance = Math.hypot(p.x - bow.x, p.y - bow.y);

    if (distance > 90) return;

    aiming = true;
    pointer = p;
    canvas.setPointerCapture(event.pointerId);
    status.textContent = "Keep holding and aim! ♡";
    draw();
  });

  canvas.addEventListener("pointermove", event => {
    if (!aiming) return;

    pointer = position(event);
    draw();
  });

  canvas.addEventListener("pointerup", () => {
    if (!aiming) return;
    launchArrow();
  });

  canvas.addEventListener("pointercancel", () => {
    if (!aiming) return;
    aiming = false;
    draw();
  });

  resetBtn.addEventListener("click", resetGame);

  draw();
}
