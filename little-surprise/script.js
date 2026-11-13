
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", startGame);

function startGame() {
  const welcome = document.querySelector(".welcome");

  welcome.innerHTML = `
    <div class="sparkle">✧ ˚ · .</div>
    <p class="eyebrow">YOUR LITTLE CHALLENGE</p>
    <h1>Take your aim!</h1>
    <p class="game-instruction">
      Drag from the bow towards the target and release!
    </p>

    <div class="game-area">
      <canvas id="archeryCanvas" width="640" height="390"></canvas>
    </div>

    <p class="game-status" id="gameStatus">
      Ready, little archer? ♡
    </p>

    <button class="game-again" id="resetBtn">Try again ♡</button>
    <p class="footer">A little surprise awaits you!</p>
  `;

  welcome.classList.add("game-screen");
  setupArchery();
}

function setupArchery() {
  const canvas = document.getElementById("archeryCanvas");
  const ctx = canvas.getContext("2d");
  const status = document.getElementById("gameStatus");
  const resetBtn = document.getElementById("resetBtn");

  const W = canvas.width;
  const H = canvas.height;

  const bow = { x: 105, y: 220 };
  const target = { x: 525, y: 175, r: 55 };

  let aiming = false;
  let pointer = { x: 250, y: 220 };
  let shooting = false;
  let shot = null;
  let won = false;

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

    for (let i = 0; i < 30; i++) {
      const x = (i * 97 + 25) % W;
      const y = (i * 61 + 20) % H;
      ctx.fillStyle = "rgba(190,145,190,0.45)";
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#d9b6d2";
    ctx.font = "22px serif";
    ctx.fillText("♡", 28, 45);
    ctx.fillText("✧", 570, 55);
    ctx.fillText("♡", 575, 345);
  }

  function drawTarget() {
    ctx.save();

    ctx.shadowColor = "rgba(174,120,170,0.3)";
    ctx.shadowBlur = 15;

    const colors = ["#d99dbb", "#fff0f5", "#d99dbb", "#fff0f5", "#e5b85e"];

    colors.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.r - i * 10, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "22px serif";
    ctx.textAlign = "center";
    ctx.fillText("♡", target.x, target.y + 8);

    ctx.restore();
  }

  function drawBow() {
    ctx.save();
    ctx.strokeStyle = "#a8799b";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(bow.x, bow.y, 48, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    ctx.strokeStyle = "#d2a9c8";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(bow.x, bow.y - 48);
    ctx.lineTo(bow.x, bow.y + 48);
    ctx.stroke();

    ctx.restore();
  }

  function drawArrow(x, y) {
    const dx = x - bow.x;
    const dy = y - bow.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.strokeStyle = "#986d8c";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-45, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.fillStyle = "#cba0be";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-13, -8);
    ctx.lineTo(-13, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function draw() {
    drawBackground();
    drawTarget();
    drawBow();

    if (aiming) {
      drawArrow(pointer.x, pointer.y);
    } else if (shooting && shot) {
      drawArrow(shot.x, shot.y);
    } else if (!won) {
      drawArrow(bow.x + 75, bow.y);
    }
  }

  function frame() {
    draw();
    if (shooting) requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (shooting || won) return;

    aiming = true;
    pointer = position(event);
    canvas.setPointerCapture(event.pointerId);
    draw();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!aiming) return;

    pointer = position(event);
    draw();
  });

  canvas.addEventListener("pointerup", () => {
    if (!aiming) return;

    aiming = false;

    const distance = Math.hypot(
      pointer.x - target.x,
      pointer.y - target.y
    );

    const hit = distance <= target.r;

    const dx = target.x - bow.x;
    const dy = target.y - bow.y;
    const length = Math.hypot(dx, dy);

    shot = {
      x: bow.x,
      y: bow.y,
      endX: bow.x + dx / length * length,
      endY: bow.y + dy / length * length
    };

    shooting = true;

    const start = performance.now();
    const duration = 500;

    function animate(now) {
      const progress = Math.min((now - start) / duration, 1);

      shot.x = bow.x + (shot.endX - bow.x) * progress;
      shot.y = bow.y + (shot.endY - bow.y) * progress;

      draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        shooting = false;

        if (hit) {
          won = true;
          status.textContent = "BULLSEYE! You're amazing! ♡";
          status.style.color = "#b77a9e";
          celebrate();
        } else {
          status.textContent = "Almost! Give it another try ♡";
        }

        draw();
      }
    }

    requestAnimationFrame(animate);
  });

  function celebrate() {
    const original = status.textContent;
    status.textContent = "✨ " + original + " ✨";
  }

  resetBtn.addEventListener("click", () => {
    aiming = false;
    shooting = false;
    shot = null;
    won = false;
    status.textContent = "Ready, little archer? ♡";
    draw();
  });

  draw();
}
