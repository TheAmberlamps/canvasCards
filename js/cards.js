const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

gsap.registerPlugin(CustomEase, CustomWiggle);

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
let decks = 1;
let maxHearts = 3;
let hearts = maxHearts;
let heartArr = [];
let brokenHeart = [];
let cardArr = [];
let cardBack = "https://deckofcardsapi.com/static/img/back.png";
let heartContImg = "assets/images/fullContainer.png";
let is_dragging = false;
let gameOver = false;
let currentCard = null;
let cardIndex = null;
let guessCard = null;
let arrMut = false;
let guessInd;
let startX;
let startY;

canvas.onmousedown = mouse_down;
canvas.onmouseup = mouse_up;
canvas.onmousemove = mouse_move;
canvas.onmouseout = mouse_out;

let title = document.getElementById("titleCard");
let mainText = document.getElementById("startButton");
mainText.textContent = "START";
mainText.addEventListener(
  "click",
  () => {
    console.log("Yep");
    heartContainers(screenWidth / 2, 0);
    gsap.to(mainText, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        mainText.style.display = "none";
        let pElement = document.createElement("p");
        pElement.id = mainText.id;
        mainText.replaceWith(pElement);
        mainText = pElement;
        throwCards(5);
      },
    });
    gsap.to(title, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        title.style.display = "none";
      },
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
        //is_dragging = true;
        console.log("guessVal:" + guessCard);
        if (checkGuess(guessCard, currentCard) === true) {
          cardOut(currentCard);
          correctSound.play();
        } else {
          console.log("Not verified!");
          wrongSound.play();
          cardWiggle(currentCard);
          hearts = hearts - 1;
          if (hearts >= 0) {
            for (let i = hearts; i < maxHearts; i++) {
              if (heartArr[i].valObj.full === true) {
                heartBreaker(heartArr[i]);
                heartArr[i].valObj.full = false;
                heartArr[i].src = "assets/images/heartContainer.png";
              }
            }
          }
          if (hearts === 0) {
            console.log("game over");
            gameOver = true;
            clearScreen();
          }
        }
        cardFlip(cardArr[i]);
        break;
      } else {
        console.log("No!");
      }
    }
  }
}

function mouse_up(event) {
  if (!is_dragging) {
    return;
  }
  event.preventDefault();
  is_dragging = false;
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
  heartL.src = "assets/images/bHeartL.png";
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
    onComplete: () => {
      console.log("Be rid of me now!");
    },
  });
  let heartR = new Image();
  heartR.src = "assets/images/bHeartR.png";
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
    onComplete: () => {
      console.log("Be rid of me as well!");
      brokenHeart.length = 0;
    },
  });
  brokenHeart.push(heartL);
  brokenHeart.push(heartR);
}

function heartContainers(x, y) {
  for (let i = 0; i < hearts; i++) {
    let newHeart = new Image();
    newHeart.src = heartContImg;
    let newX = x + newHeart.width * (maxHearts / 2);
    let xVal = newX - i * (newHeart.width * (maxHearts / 2));
    let yVal = y + newHeart.height;
    newHeart.valObj = {
      xVal: xVal,
      yVal: yVal,
      image: newHeart.src,
      full: true,
      opacity: 0,
    };
    gsap.to(newHeart.valObj, {
      duration: 1,
      opacity: 1,
    });
    heartArr.push(newHeart);
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

let newDeck = await genDeck(decks);

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
    memoTimer(amt * 1000 + 1000);
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

// game logic
function selectGuess() {
  if (guessCard === null) {
    guessCard = new Image();
    guessInd = [Math.floor(Math.random() * (cardArr.length - 1))];
    let guessVal = cardArr[guessInd].valObj;
    guessCard.src = guessVal.cardImg;
    guessCard.addEventListener(
      "load",
      () => {
        guessCard.valObj = {
          xVal: canvas.width + guessCard.width,
          yVal: canvas.height / 2,
          xScale: 1,
          flipping: false,
          flippable: false,
          cardImg: guessVal.cardImg,
        };
        gsap.to(guessCard.valObj, {
          xVal: canvas.width - guessCard.width,
          yVal: canvas.height / 2,
          duration: 0.5,
        });
      },
      { once: true },
    );
  } else {
    guessCard.valObj.flippable = true;
    cardFlip(guessCard);
  }
}

function newGuess(card) {
  cardArr.splice(guessInd, 1);
  if (cardArr.length > 0) {
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
  }
}

function checkGuess(guess, currCard) {
  if (guess.valObj.cardImg === currCard.valObj.cardImg) {
    selectGuess();
    return true;
  } else {
    return false;
  }
}

// countdown logic
let countVal = 6;
let countDown;

async function incrementer() {
  countVal--;
  console.log(countVal);
  console.log("mainText.style.display: " + mainText.style.display);
  mainText.textContent = countVal;
  mainText.style.display = "unset";
  mainText.style.opacity = 1;
  if (countVal < 1) {
    clearInterval(countDown);
    console.log("ended");
    selectGuess();
    gsap.to(mainText, {
      duration: 1,
      opacity: 0,
      onComplete: () => {
        mainText.style.display = "none";
      },
    });
  }
}

async function memoTimer(time) {
  countDown = setInterval(incrementer, 1000);
  setTimeout(async function () {
    cardArr.forEach((element) => {
      element.valObj.flippable = true;
      cardFlip(element);
    });
  }, time);
}

// update loop
gsap.ticker.add(() => {
  //resizeCanvas()
  //screenWidth = canvas.width;
  //screenHeight = canvas.height;
  if (cardArr.length > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < cardArr.length; i++) {
      ctx.save();
      ctx.translate(cardArr[i].valObj.xVal, cardArr[i].valObj.yVal);
      ctx.rotate(cardArr[i].valObj.rotVal);
      ctx.scale(cardArr[i].valObj.xScale, 1);
      ctx.drawImage(cardArr[i], -cardArr[i].width / 2, -cardArr[i].height / 2);
      ctx.restore();
    }
    if (guessCard) {
      ctx.save();
      ctx.translate(guessCard.valObj.xVal, guessCard.valObj.yVal);
      ctx.scale(guessCard.valObj.xScale, 1);
      ctx.drawImage(guessCard, -guessCard.width / 2, -guessCard.height / 2);
      ctx.restore();
    }
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
  }
  if (arrMut) {
    arrMut = false;
    newGuess(guessCard);
  }
});
