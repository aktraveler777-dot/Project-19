
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", () => {
  const welcome = document.querySelector(".welcome");

  welcome.innerHTML = `
    <div class="sparkle">✧ ˚ · .</div>

    <p class="eyebrow">YOUR LITTLE CHALLENGE</p>

    <h1>Take your aim!</h1>

    <p class="intro">
      A little arrow, a little target,
      and a lovely surprise waiting for you.
    </p>

    <div class="target">🎯</div>

    <div class="game-preview">
      <div class="bow">🏹</div>
      <p>Ready, steady, shoot!</p>
    </div>

    <p class="footer">You've got this! ♡</p>
  `;

  welcome.classList.add("game-screen");
});

