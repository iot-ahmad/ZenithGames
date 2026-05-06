const computer = document.querySelector(".computer img");
const player = document.querySelector(".player img");
const computerPoints = document.querySelector(".computerPoints");
const playerPoints = document.querySelector(".playerPoints");
const options = document.querySelectorAll(".options button");
const iconMap = {
  STONE: "✊",
  PAPER: "✋",
  SCISSORS: "✌"
};

function makeChoiceImage(choice, color, mirrored) {
  const hand = iconMap[choice];
  const scaleX = mirrored ? -1 : 1;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="340" height="220" viewBox="0 0 340 220">
      <rect width="340" height="220" rx="18" fill="${color}" />
      <circle cx="170" cy="110" r="78" fill="rgba(255,255,255,0.12)" />
      <g transform="translate(170,120) scale(${scaleX},1) translate(-170,-120)">
        <text x="170" y="142" text-anchor="middle" font-size="96">${hand}</text>
      </g>
    </svg>
  `;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function setHands(playerChoice, computerChoice) {
  player.src = makeChoiceImage(playerChoice, "#0d3f8a", false);
  computer.src = makeChoiceImage(computerChoice, "#6b2ea5", true);
}

options.forEach((option) => {
  option.addEventListener("click", () => {
    computer.classList.add("shakeComputer");
    player.classList.add("shakePlayer");

    setTimeout(() => {
      computer.classList.remove("shakeComputer");
      player.classList.remove("shakePlayer");

      const choice = ["STONE", "PAPER", "SCISSORS"];
      let arrayNo = Math.floor(Math.random() * 3);
      let computerChoice = choice[arrayNo];
      setHands(option.innerHTML, computerChoice);

      let cPoints = parseInt(computerPoints.innerHTML);
      let pPoints = parseInt(playerPoints.innerHTML);

      if (option.innerHTML === "STONE") {
        if (computerChoice === "PAPER")
          computerPoints.innerHTML = cPoints + 1;
        else if (computerChoice === "SCISSORS")
          playerPoints.innerHTML = pPoints + 1;
      } else if (option.innerHTML === "PAPER") {
        if (computerChoice === "SCISSORS")
          computerPoints.innerHTML = cPoints + 1;
        else if (computerChoice === "STONE")
          playerPoints.innerHTML = pPoints + 1;
      } else {
        if (computerChoice === "STONE")
          computerPoints.innerHTML = cPoints + 1;
        else if (computerChoice === "PAPER")
          playerPoints.innerHTML = pPoints + 1;
      }
    }, 900);
  });
});

setHands("STONE", "STONE");