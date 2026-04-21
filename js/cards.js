const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

gsap.registerPlugin(CustomEase, CustomWiggle, Physics2DPlugin);

function resizeCanvas() {
  // Set the internal canvas rendering size to match the browser window dimensions
  canvas.width = window.innerWidth;
  console.log("canvas.width: " + canvas.width);
  canvas.height = window.innerHeight;
  console.log("canvas.height: " + canvas.height);

  // Note: Resizing the canvas clears its content.
  // Your drawing code must be called after this to display correctly.
}

// Initial call to set the canvas size when the page loads
resizeCanvas();

// video to watch to implement drag & drop: https://www.youtube.com/watch?v=7PYvx8u_9Sk

// sounds
const wrongSound = new Audio("assets/sounds/572936__bloodpixelhero__error.wav");
wrongSound.playbackRate = 2;
const correctSound = new Audio("assets/sounds/soft-dreamy-beep.ogg");
correctSound.playbackRate = 2;

// global variables
const screenWidth = canvas.width;
const screenHeight = canvas.height;
const gameTitle = "Canvas Cards";
const startingCardAmt = 3;
const maxHearts = 3;
const countInit = 6;
const grav = 1800;
let bestScore = 0;
if (document.cookie.length > 0) {
  bestScore = document.cookie.split("=")[1];
}
let decks = 1;
let stageNum = 1;
let newDeck = await genDeck(decks);
let cardAmt = startingCardAmt;
let hearts = maxHearts;
let countVal = countInit;
let heartArr = [];
let brokenHeart = [];
let cardArr = [];
let artCards = [];
let cardBack = "https://deckofcardsapi.com/static/img/back.png";
let heartContImg = "assets/images/fullContainer.png";
let canDrag = false;
let is_dragging = false;
//let gameOver = false;
let gameOn = false;
let currentCard = null;
let cardIndex = null;
let guessCard = null;
let guessArea = null;
let arrMut = false;
let countDown;
let guessInd;
let startX;
let startY;

canvas.onmousedown = mouse_down;
canvas.onmouseup = mouse_up;
canvas.onmousemove = mouse_move;
canvas.onmouseout = mouse_out;

// keyboard debugging thing

document.addEventListener("keydown", (event) => {
  console.log("event key: " + event.key);
  if (event.key === "p") {
    console.log(randRotInRads());
    jumpingCard(5, 1);
    rainCard(5);
  }
});

let title = document.getElementById("titleCard");
let scoreCard = document.getElementById("scoreCard");
let tutButt = document.getElementById("tut");
let tutPicDiv = document.getElementById("tutPic");
tutButt.addEventListener("click", () => {
  tutButt.style.pointerEvents = "none";
  tutButt.style.userSelect = "none";
  mainText.style.pointerEvents = "none";
  mainText.style.userSelect = "none";
  heartContainers(screenWidth / 2, 0);
  selectGuess();
  guessAreaInit();
  gsap.to(tutButt, {
    opacity: 0,
    duration: 1,
  });
  gsap.to(mainText, {
    opacity: 0,
    duration: 1,
  });
  gsap.to(title, {
    opacity: 0,
    duration: 1,
  });
});
if (document.cookie.length < 1) {
  scoreCard.innerText = "BEST: 0";
} else {
  let x = document.cookie.split("=")[1];
  console.log(x);
  scoreCard.innerText = "BEST: " + x;
}
let mainText = document.getElementById("startButton");
mainText.textContent = "START";
mainText.addEventListener(
  "click",
  () => {
    console.log("Yep");
    mainText.style.pointerEvents = "none";
    mainText.style.userSelect = "none";
    tutButt.style.pointerEvents = "none";
    tutButt.style.userSelect = "none";
    heartContainers(screenWidth / 2, 0);
    selectGuess();
    guessAreaInit();
    gsap.to(mainText, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        mainText.style.display = "none";
        let pElement = document.createElement("p");
        pElement.id = mainText.id;
        mainText.replaceWith(pElement);
        mainText = pElement;
        mainText.style.pointerEvents = "none";
        mainText.style.userSelect = "none";
        canDrag = true;
        throwCards(cardAmt);
      },
    });
    gsap.to(title, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        title.style.opacity = 1;
        title.innerText = "STAGE " + stageNum;
      },
    });
    gsap.to(tutButt, {
      opacity: 0,
      duration: 1,
    });
  },
  { once: true },
);

// mouse events
function mouse_down(event) {
  event.preventDefault();
  startX = event.clientX;
  startY = event.clientY;
  if (hearts > 0) {
    for (let i = cardArr.length - 1; i > -1; i--) {
      if (inRotatedRect(event.clientX, event.clientY, cardArr[i])) {
        console.log("Yes!");
        console.log(cardArr[i].valObj.cardVal);
        currentCard = cardArr[i];
        cardIndex = i;
        if (canDrag) {
          is_dragging = true;
          currentCard.valObj.savedX = currentCard.valObj.xVal;
          currentCard.valObj.savedY = currentCard.valObj.yVal;
          console.log("Is dragging now true");
          unRot(currentCard);
          console.log("guessVal:" + guessCard);
          break;
        } else {
          console.log("No!");
        }
      }
    }
  }
}

function unRot(card) {
  let oldRot = Math.abs(card.valObj.rotVal);
  let newRot = 0;
  if (oldRot > 1.571 && oldRot <= 4.712) {
    newRot = 3.142;
  }
  if (oldRot > 4.712 && oldRot <= 6.283) {
    newRot = 6.283;
  }
  if (currentCard.valObj.rotVal < 0) {
    newRot = -newRot;
  }
  gsap.to(card.valObj, {
    duration: 0.25,
    rotVal: newRot,
  });
}

function mouse_up(event) {
  if (!is_dragging) {
    return;
  }
  event.preventDefault();
  is_dragging = false;
  console.log("stopped dragging");
  if (
    gameOn &&
    inRotatedRect(
      currentCard.valObj.xVal,
      currentCard.valObj.yVal,
      guessArea,
    ) &&
    guessCard.valObj.flipping === false
  ) {
    console.log("card is located inside of guess area");
    console.log(guessCard.valObj);
    evaluator();
  }
}

function mouse_move(event) {
  if (is_dragging) {
    event.preventDefault();

    let mouseX = event.clientX;
    let mouseY = event.clientY;

    let dx = mouseX - startX;
    let dy = mouseY - startY;

    currentCard.valObj.xVal += dx;
    currentCard.valObj.yVal += dy;

    startX = mouseX;
    startY = mouseY;
  } else {
    return;
  }
}

function mouse_out(event) {
  if (!is_dragging) {
    return;
  }
  event.preventDefault();
  is_dragging = false;
}

function inRotatedRect(mouseX, mouseY, rect) {
  const translatedX = mouseX - rect.valObj.xVal;
  const translatedY = mouseY - rect.valObj.yVal;

  const unrotatedX =
    translatedX * Math.cos(-rect.valObj.rotVal) -
    translatedY * Math.sin(-rect.valObj.rotVal);
  const unrotatedY =
    translatedX * Math.sin(-rect.valObj.rotVal) +
    translatedY * Math.cos(-rect.valObj.rotVal);

  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;

  return (
    unrotatedX >= -halfWidth &&
    unrotatedX <= halfWidth &&
    unrotatedY >= -halfHeight &&
    unrotatedY <= halfHeight
  );
}

// animation functions
function randRotInRads() {
  if (Math.random() >= 0.5) {
    return (Math.floor(Math.random() * 360) * Math.PI) / 180;
  } else {
    return -(Math.floor(Math.random() * 360) * Math.PI) / 180;
  }
}

function randOffset(offset) {
  if (Math.random() > 0.5) {
    return Math.floor(Math.random() * offset);
  } else {
    return -Math.floor(Math.random() * offset);
  }
}

function cardFlip(card) {
  let time = 0.25;
  if (card.valObj.flipping === false && card.valObj.flippable === true) {
    card.valObj.flippable = false;
    card.valObj.flipping = true;
    gsap.to(card.valObj, {
      xScale: 0,
      duration: time,
      onComplete: () => {
        if (card.src === card.valObj.cardImg) {
          card.src = cardBack;
          gsap.to(card.valObj, {
            xScale: 1,
            duration: time,
            flipping: false,
          });
        } else if (card === guessCard && card.src === cardBack) {
          // trigger switch here, write function to handle logic of assigning new card after mutating array and execute it in update loop
          arrMut = true;
        } else {
          card.src = card.valObj.cardImg;
          gsap.to(card.valObj, {
            xScale: 1,
            duration: time,
            flipping: false,
          });
        }
      },
    });
  } else {
    console.log("flip failed");
  }
}

function cardWiggle(card) {
  gsap.to(card.valObj, {
    duration: 0.5,
    ease: CustomWiggle.create("myWig", {
      wiggles: 5,
      type: "easeOut",
    }),
    xVal: card.valObj.xVal - 20,
  });
}

function heartBreaker(heart) {
  let heartL = new Image();
  heartL.onload = function () {
    heartL.valObj = {
      xVal: heart.valObj.xVal,
      yVal: heart.valObj.yVal,
      rotVal: 0,
    };
    gsap.to(heartL.valObj, {
      duration: 1,
      xVal: heartL.valObj.xVal - heartL.width * 2,
      yVal: screenHeight + heartL.height,
      rotVal: -(90 * Math.PI) / 180,
      ease: "power4.outin",
    });
    brokenHeart.push(heartL);
  };
  heartL.src = "assets/images/bHeartL.png";

  let heartR = new Image();
  heartR.onload = function () {
    heartR.valObj = {
      xVal: heart.valObj.xVal,
      yVal: heart.valObj.yVal,
      rotVal: 0,
    };
    gsap.to(heartR.valObj, {
      duration: 1,
      xVal: heartR.valObj.xVal + heartR.width * 2,
      yVal: screenHeight + heartR.height,
      rotVal: (90 * Math.PI) / 180,
      ease: "power4.outin",
    });
    brokenHeart.push(heartR);
  };
  heartR.src = "assets/images/bHeartR.png";
}

// Running this function as a generator is fine but re-running it seems to introduce conflicts
function heartContainers(x, y) {
  for (let i = 0; i < hearts; i++) {
    let newHeart = new Image();
    // initializing the valObj oustide of the load event prevents it from being re-written when changing the image source
    newHeart.valObj = {
      xVal: 0,
      yVal: 0,
      image: newHeart.src,
      full: true,
      opacity: 0,
    };
    (newHeart.addEventListener("load", () => {
      let newX = x - newHeart.width * (maxHearts / 2);
      newHeart.valObj.xVal = newX + i * (newHeart.width * (maxHearts / 2));
      newHeart.valObj.yVal = y + newHeart.height;
      gsap.to(newHeart.valObj, {
        duration: 1,
        opacity: 1,
      });
    }),
      { once: true });
    heartArr[i] = newHeart;
    newHeart.src = heartContImg;
  }
}

// deck creation, access, card population and depopulation
async function cardMaker(deck, x, y) {
  let newCard = new Image();
  let cardData = await drawCards(deck);
  newCard.src = cardData.image;
  let color;
  if (cardData.suit === "SPADES" || cardData.suit === "CLUBS") {
    color = "BLACK";
  } else {
    color = "RED";
  }
  newCard.addEventListener(
    "load",
    () => {
      newCard.valObj = {
        xVal: x,
        yVal: y,
        savedX: 0,
        savedY: 0,
        rotVal: 0,
        xScale: 1,
        yScale: 1,
        cardVal: cardData.value,
        cardSuit: cardData.suit,
        cardColor: color,
        cardImg: cardData.image,
        flipping: false,
        flipabble: false,
      };
      gsap.to(newCard.valObj, {
        rotVal: randRotInRads(),
        xVal: screenWidth / 2 + randOffset(screenWidth / 4),
        yVal: screenHeight / 2 + randOffset(screenHeight / 4),
        ease: "power4.out",
        duration: 1,
      });
      cardArr.push(newCard);
    },
    { once: true },
  );
}

async function genDeck(decks) {
  let deckUrl = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${decks}`;
  try {
    let response = await fetch(deckUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    let data = await response.json();
    return data.deck_id;
  } catch (error) {
    console.log("Fetch failed: ", error);
    return null;
  }
}

async function drawCards(newDeck) {
  let drawCard = `https://deckofcardsapi.com/api/deck/${newDeck}/draw/?count=1`;
  try {
    let response = await fetch(drawCard);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    let data = await response.json();
    console.log(data.cards[0]);
    return data.cards[0];
  } catch (error) {
    console.log("Fetch failed: ", error);
    return null;
  }
}

async function throwCards(amt) {
  for (let i = 0; i < amt; i++) {
    // I like this
    let time = (i + 1) * 500;
    setTimeout(async function () {
      await cardMaker(newDeck, 0, canvas.height);
    }, time);
  }
  setTimeout(async function () {
    memoTimer(countInit * 1000);
  }, amt * 500);
}

async function cardOut(card) {
  card.valObj.flippable = true;
  cardFlip(card);
  gsap.to(card.valObj, {
    rotVal: randRotInRads(),
    xVal: canvas.width + card.width,
    yVal: -canvas.height + card.height,
    ease: "power4.in",
    duration: 1,
    onComplete: () => {
      guessCard.valObj.flippable = true;
      cardFlip(guessCard);
    },
  });
}

function clearScreen() {
  cardArr.forEach((elem) => {
    gsap.to(elem.valObj, {
      duration: 2,
      yVal: screenHeight + elem.height,
      rotVal: randRotInRads(),
      ease: "power2.in",
      onComplete: () => {
        cardArr.length = 0;
      },
    });
  });
}

function jumpingCard(t, a) {
  let time = t;
  let amount = a;
  const scaler = () => {
    const scale = Math.random() * 0.5 + 0.5;
    return scale;
  };
  const direction = () => {
    return -Math.random() * 110 - 35;
  };
  const velDef = () => {
    return Math.random() * 400 + 1100;
  };
  const rotator = () => {
    const rotation = Math.random() / 6.2832;
    if (Math.random() <= 0.5) {
      return -rotation;
    } else {
      return rotation;
    }
  };
  for (let i = 0; i < amount; i++) {
    let mainCard = new Image();
    let scale = scaler();
    mainCard.src = cardBack;
    mainCard.valObj = {
      xVal: screenWidth / 2,
      yVal: screenHeight,
      xScale: scale,
      yScale: scale,
      rotVal: 0,
    };
    let rotation = rotator();
    gsap.set(mainCard, {
      x: mainCard.valObj.xVal,
      y: mainCard.valObj.yVal,
    });
    gsap.set(mainCard.valObj, {
      rotVal: randRotInRads(),
    });
    gsap.to(mainCard, {
      onUpdate: () => {
        // 360 degrees in radians divided by 60
        //(6.2832 / 60)y===
        mainCard.valObj.rotVal += rotation;
        mainCard.valObj.xVal = gsap.getProperty(mainCard, "x");
        mainCard.valObj.yVal = gsap.getProperty(mainCard, "y");
      },
      duration: time,
      physics2D: { velocity: velDef(), angle: direction(), gravity: grav },
    });
    artCards.push(mainCard);
  }
}

function rainCard(t) {
  let spawnPoint = Math.random() * screenWidth;
  let time = t;
  let scale = 0.15;
  let mainCard = new Image();
  mainCard.src = cardBack;
  mainCard.valObj = {
    xVal: 0,
    yVal: 0,
    xScale: scale,
    yScale: scale,
    rotVal: 0,
    opacity: 0.5,
  };
  gsap.set(mainCard, {
    x: spawnPoint,
  });
  gsap.to(mainCard, {
    onUpdate: () => {
      mainCard.valObj.xVal = gsap.getProperty(mainCard, "x");
      mainCard.valObj.yVal = gsap.getProperty(mainCard, "y");
    },
    duration: time,
    physics2D: { velocity: 0, angle: 0, gravity: grav },
  });
  artCards.push(mainCard);
}

// game logic
function selectGuess() {
  if (guessCard === null) {
    guessCard = new Image();
    //guessInd = [Math.floor(Math.random() * (cardArr.length - 1))];
    //let guessVal = cardArr[guessInd].valObj;
    //guessCard.src = guessVal.cardImg;
    //guessCard.src = cardBack;
    guessCard.valObj = {
      xVal: 0,
      yVal: 0,
      xScale: 1,
      flipping: false,
      flippable: false,
      opacity: 0,
      cardImg: null,
    };
    guessCard.addEventListener(
      "load",
      () => {
        guessCard.valObj.opacity = 1;
        guessCard.valObj.xVal = screenWidth + guessCard.width;
        guessCard.valObj.yVal =
          screenHeight - screenHeight + guessCard.height / 1.5;
        gsap.to(guessCard.valObj, {
          xVal: canvas.width - guessCard.width,
          duration: 0.5,
        });
      },
      { once: true },
    );
    guessCard.src = cardBack;
  } else {
    guessCard.valObj.flippable = true;
    cardFlip(guessCard);
  }
}

function newGuess(card) {
  if (guessInd) {
    console.log("splicing array");
    cardArr.splice(guessInd, 1);
  }
  if (cardArr.length > 0) {
    console.log("assigning guessInd");
    guessInd = [Math.floor(Math.random() * (cardArr.length - 1))];
    card.src = cardArr[guessInd].valObj.cardImg;
    card.valObj.cardImg = card.src;
    gsap.to(card.valObj, {
      xScale: 1,
      duration: 0.25,
      flipping: false,
    });
  } else {
    console.log("Round over!");
    gameOn = false;
    if (hearts < maxHearts) {
      hearts = hearts + 1;
      for (let i = heartArr.length - 1; i > -1; i--) {
        if (heartArr[i].valObj.full === false) {
          heartArr[i].valObj.full = true;
          heartArr[i].src = "assets/images/fullContainer.png";
          break;
        }
      }
      //heartArr.length = 0;
      //heartContainers(screenWidth / 2, 0);
    }
    cardAmt = cardAmt + 1;
    if (stageNum > bestScore) {
      bestScore = stageNum;
      scoreCard.innerText = "BEST: " + bestScore;
    }
    cookieTime();
    stageNum = stageNum + 1;
    jumpingCard(5, 50);
    guessCard = null;
    guessInd = null;
    title.style.opacity = 1;
    title.innerText = "CLEAR!";
    setTimeout(async function () {
      title.innerText = "STAGE " + stageNum;
      throwCards(cardAmt);
      selectGuess();
    }, 3000);
  }
}

function checkGuess(guess, currCard) {
  if (guess && guess.valObj.cardImg === currCard.valObj.cardImg) {
    selectGuess();
    return true;
  } else {
    return false;
  }
}

function guessAreaInit() {
  if (guessArea === null) {
    console.log("We null");
    guessArea = new Image();
    guessArea.valObj = {
      xVal: screenWidth,
      yVal: screenHeight,
      rotVal: 0,
      opacity: 0,
    };
    guessArea.addEventListener("load", () => {
      ((guessArea.valObj.xVal = screenWidth - guessArea.width),
        (guessArea.valObj.yVal = screenHeight - guessArea.height / 1.5),
        gsap.to(guessArea.valObj, {
          duration: 1,
          opacity: 0.5,
        }));
    });
    guessArea.src = cardBack;
  } else {
    console.log("We not null");
    gsap.to(guessArea.valObj, {
      duration: 1,
      opacity: 0.5,
    });
  }
}

function evaluator() {
  if (checkGuess(guessCard, currentCard) === true) {
    cardOut(currentCard);
    correctSound.play();
  } else {
    console.log("Not verified!");
    wrongSound.play();
    //cardWiggle(currentCard);
    gsap.to(currentCard.valObj, {
      duration: 0.5,
      xVal: currentCard.valObj.savedX,
      yVal: currentCard.valObj.savedY,
      rotVal: randRotInRads(),
    });
    hearts = hearts - 1;
    if (hearts >= 0) {
      for (let i = 0; i < maxHearts - hearts; i++) {
        console.log("we assigning some wild mess out here");
        if (heartArr[i].valObj.full === true) {
          console.log("heartArr[i].valObj.full: " + heartArr[i].valObj.full);
          heartBreaker(heartArr[i]);
          heartArr[i].valObj.full = false;
          heartArr[i].src = "assets/images/heartContainer.png";
          console.log("heartArr[i].valObj.full: " + heartArr[i].valObj.full);
        }
      }
    }
    if (hearts === 0) {
      console.log("game over");
      clearScreen();
      gameReset();
    }
  }
}

async function gameReset() {
  cardAmt = startingCardAmt;
  hearts = maxHearts;
  stageNum = 1;
  title.innerText = gameTitle;
  guessInd = null;
  gameOn = false;
  gsap.to(guessCard.valObj, {
    xVal: screenWidth + guessCard.width,
    duration: 1,
    onComplete: () => {
      guessCard = null;
    },
  });
  gsap.to(guessArea.valObj, {
    duration: 1,
    opacity: 0,
  });
  gsap.to(tutButt, {
    duration: 1,
    opacity: 1,
    onComplete: () => {
      tutButt.style.pointerEvents = "auto";
      tutButt.style.userSelect = "auto";
    },
  });
  newDeck = await genDeck(decks);
  mainText.textContent = "START";
  mainText.style.display = "inline-block";
  let pElement = document.createElement("button");
  pElement.textContent = "START";
  pElement.id = mainText.id;
  mainText.replaceWith(pElement);
  mainText = pElement;
  mainText.addEventListener("click", () => {
    if (cardArr.length === 0) {
      console.log("Yep");
      mainText.style.pointerEvents = "none";
      mainText.style.userSelect = "none";
      tutButt.style.pointerEvents = "none";
      tutButt.style.userSelect = "none";
      heartContainers(screenWidth / 2, 0);
      selectGuess();
      guessAreaInit();
      gsap.to(mainText, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
          mainText.style.display = "none";
          let pElement = document.createElement("p");
          pElement.id = mainText.id;
          mainText.replaceWith(pElement);
          mainText = pElement;
          mainText.style.pointerEvents = "none";
          mainText.style.userSelect = "none";
          throwCards(cardAmt);
        },
      });
      gsap.to(title, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
          title.style.opacity = 1;
          title.innerText = "STAGE " + stageNum;
        },
      });
      gsap.to(tutButt, {
        duration: 1,
        opacity: 0,
      });
    }
  });
  gsap.to(mainText, {
    opacity: 1,
    duration: 1,
  });
  heartArr.forEach((element) => {
    gsap.to(element.valObj, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        heartArr.length = 0;
      },
    });
  });
  title.style.display = "block";
  gsap.to(title, {
    opacity: 1,
    duration: 1,
  });
}

// countdown logic
async function incrementer() {
  title.style.opacity = 0;
  countVal--;
  console.log(countVal);
  console.log("mainText.style.display: " + mainText.style.display);
  mainText.textContent = countVal;
  mainText.style.display = "unset";
  mainText.style.opacity = 1;
  if (countVal < 1) {
    clearInterval(countDown);
    console.log("ended");
    guessCard.valObj.flippable = true;
    cardFlip(guessCard);
    //canDrag = true;
    gsap.to(mainText, {
      duration: 1,
      opacity: 0,
      onComplete: () => {
        mainText.style.display = "none";
        countVal = countInit;
      },
    });
  }
}

async function memoTimer(time) {
  countDown = setInterval(incrementer, 1000);
  setTimeout(async function () {
    gameOn = true;
    cardArr.forEach((element) => {
      element.valObj.flippable = true;
      cardFlip(element);
    });
  }, time);
}

// cookie handling

function cookieTime() {
  let genDate = new Date();
  genDate.setFullYear(genDate.getFullYear() + 1);
  document.cookie = `score=${bestScore}; expires=${genDate}; path=/`;
}

// update loop
gsap.ticker.add(() => {
  //resizeCanvas()
  //screenWidth = canvas.width;
  //screenHeight = canvas.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (guessArea) {
    ctx.save();
    ctx.translate(guessArea.valObj.xVal, guessArea.valObj.yVal);
    ctx.globalAlpha = guessArea.valObj.opacity;
    ctx.scale(guessArea.valObj.xScale, 1);
    ctx.drawImage(guessArea, -guessArea.width / 2, -guessArea.height / 2);
    ctx.restore();
  }
  if (cardArr.length > 0) {
    for (let i = 0; i < cardArr.length; i++) {
      ctx.save();
      ctx.translate(cardArr[i].valObj.xVal, cardArr[i].valObj.yVal);
      ctx.rotate(cardArr[i].valObj.rotVal);
      ctx.scale(cardArr[i].valObj.xScale, 1);
      ctx.drawImage(cardArr[i], -cardArr[i].width / 2, -cardArr[i].height / 2);
      ctx.restore();
    }
  }
  if (guessCard) {
    ctx.save();
    ctx.translate(guessCard.valObj.xVal, guessCard.valObj.yVal);
    ctx.globalAlpha = guessCard.valObj.opacity;
    ctx.scale(guessCard.valObj.xScale, 1);
    ctx.drawImage(guessCard, -guessCard.width / 2, -guessCard.height / 2);
    ctx.restore();
  }
  if (heartArr.length > 0) {
    for (let i = 0; i < heartArr.length; i++) {
      ctx.save();
      ctx.translate(heartArr[i].valObj.xVal, heartArr[i].valObj.yVal);
      ctx.globalAlpha = heartArr[i].valObj.opacity;
      ctx.drawImage(
        heartArr[i],
        -heartArr[i].width / 2,
        -heartArr[i].height / 2,
      );
      ctx.restore();
    }
  }
  if (brokenHeart.length > 0) {
    for (let i = 0; i < brokenHeart.length; i++) {
      ctx.save();
      ctx.translate(brokenHeart[i].valObj.xVal, brokenHeart[i].valObj.yVal);
      ctx.rotate(brokenHeart[i].valObj.rotVal);
      ctx.drawImage(
        brokenHeart[i],
        -brokenHeart[i].width / 2,
        -brokenHeart[i].height / 2,
      );
      ctx.restore();
    }
    brokenHeart = brokenHeart.filter(
      (card) => card.valObj.yVal <= screenHeight,
    );
  }
  if (artCards.length > 0) {
    for (let i = 0; i < artCards.length; i++) {
      ctx.save();
      ctx.translate(artCards[i].valObj.xVal, artCards[i].valObj.yVal);
      ctx.rotate(artCards[i].valObj.rotVal);
      ctx.globalAlpha = artCards[i].valObj.opacity;
      ctx.scale(artCards[i].valObj.xScale, artCards[i].valObj.yScale);
      ctx.drawImage(
        artCards[i],
        -artCards[i].width / 2,
        -artCards[i].height / 2,
      );
      ctx.restore();
    }
    artCards = artCards.filter((card) => card.valObj.yVal <= screenHeight);
  }
  if (arrMut) {
    arrMut = false;
    newGuess(guessCard);
  }
});
