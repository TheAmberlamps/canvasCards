const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  // Set the internal canvas rendering size to match the browser window dimensions
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Note: Resizing the canvas clears its content.
  // Your drawing code must be called after this to display correctly.
}

// Initial call to set the canvas size when the page loads
resizeCanvas();

// video to watch to implement drag & drop: https://www.youtube.com/watch?v=7PYvx8u_9Sk

let decks = 1;
let cardArr = [];
let cardBack = "https://deckofcardsapi.com/static/img/back.png"
let is_dragging = false;
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
    gsap.to(mainText, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        mainText.style.display = "none";
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

function cardFlip(card) {
  let time = 0.25;
  if (card.valObj.flipping === false && card.valObj.flippable === true) {
    card.valObj.flippable = false
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
          arrMut = cardArr[Math.floor(Math.random() * (cardArr.length - 1))]
          console.log(arrMut)
          console.log(arrMut.valObj.cardImg)
          card.src = arrMut.valObj.cardImg
          card.valObj.cardImg = arrMut.valObj.cardImg
          gsap.to(card.valObj, {
            xScale: 1,
            duration: time,
            flipping: false,
          })
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

function mouse_down(event) {
  event.preventDefault();
  startX = event.clientX;
  startY = event.clientY;
  for (let i = cardArr.length - 1; i > -1; i--) {
    if (inRotatedRect(event.clientX, event.clientY, cardArr[i])) {
      console.log("Yes!");
      console.log(cardArr[i].valObj.cardVal);
      currentCard = cardArr[i];
      cardIndex = i;
      //is_dragging = true;
      console.log("guessVal:" + guessCard)
      if (checkGuess(guessCard, currentCard) === true) {
        cardOut(currentCard)
      } else {
        console.log("Not verified!")
      }
      cardFlip(cardArr[i]);
      break;
    } else {
      console.log("No!");
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

async function cardMaker(deck, x, y) {
  let newCard = new Image();
  let cardData = await drawCards(deck);
  newCard.src = cardData.image;
  let color;
  if (cardData.suit === "SPADES" || cardData.suit === "CLUBS") {
    color = "BLACK"
  } else {
    color = "RED"
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
        flipabble: false
      };
      gsap.to(newCard.valObj, {
        rotVal: randRotInRads(),
        xVal: canvas.width / 2 + randOffset(600),
        yVal: canvas.height / 2 + randOffset(350),
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
  memoTimer((amt * 500) + 2000)
}

let countVal = 6
let countDown;

function selectGuess() {
  if (guessCard === null) {
    guessCard = new Image()
    guessInd = cardArr[Math.floor(Math.random() * (cardArr.length - 1))]
    let guessVal = guessInd.valObj
    guessCard.src = guessVal.cardImg
    guessCard.addEventListener(
    "load",
    () => {
    guessCard.valObj = {
      xVal: canvas.width + guessCard.width,
      yVal: canvas.height / 2,
      xScale: 1,
      flipping: false,
      flippable: false,
      cardImg: guessVal.cardImg
    }
    gsap.to(guessCard.valObj, {
      xVal: canvas.width - guessCard.width,
      yVal: canvas.height / 2,
      duration: 0.5
    })
  }, { once: true} )}
  else {
    guessCard.valObj.flippable = true
    console.log("here we go")
    cardFlip(guessCard)
    //guessInd = cardArr[Math.floor(Math.random() * (cardArr.length - 1))]
    //guessCard.src = guessInd.valObj.cardImg
    //guessCard.valObj.flippable = true
    //cardFlip(guessCard)
  }
  //console.log(`Find a ${guessCard.valObj.cardColor} ${guessCard.valObj.cardVal}`)
}

function checkGuess(guess, currCard) {
  if (guess.valObj.cardImg === currCard.valObj.cardImg) {
    // this splice seems to be breaking everything for some reason
    //cardArr.splice(guessInd, 1)
    // most likely the issue here was splicing the array as it was being accessed
    selectGuess()
    return true
  } else {
    return false
  }
}

async function cardOut(card) {
  card.valObj.flippable = true
  console.log("flipping")
  cardFlip(card)
  gsap.to(card.valObj, {
    rotVal: randRotInRads(),
    xVal: canvas.width + card.width,
    yVal: -canvas.height + card.height,
    ease: "power4.in",
    duration: 1,
    onComplete: () => {
      guessCard.valObj.flippable = true
      cardFlip(guessCard)
      console.log(guessCard)
      console.log("I happened")
    }
  });
}

async function incrementer() {
  countVal--
  console.log(countVal)
  console.log("mainText.style.display: " + mainText.style.display)
  mainText.textContent = countVal
  mainText.style.display = 'unset'
  mainText.style.opacity = 1
  if (countVal < 1) {
    clearInterval(countDown)
    console.log("ended")
    selectGuess()
  }
}

async function memoTimer(time) {
  countDown = setInterval(incrementer, 1000)
  setTimeout(async function () {
    cardArr.forEach(element => {
      console.log(element)
      console.log(element.valObj.flipabble)
      element.valObj.flippable = true
      cardFlip(element)
    });
  }, time)
}

// update loop
gsap.ticker.add(() => {
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
      ctx.save()
      ctx.translate(guessCard.valObj.xVal, guessCard.valObj.yVal)
      ctx.scale(guessCard.valObj.xScale, 1)
      ctx.drawImage(guessCard, -guessCard.width / 2, -guessCard.height / 2)
      ctx.restore()
    }
  }
  if (arrMut) {
    // splice array here to avoid potential array issues
    // OK well splice is working without crashing the program but it's also removing the wrong card; it's removing the /new/ defined guessInd.
    // I suppose the solution is to create a function that conditionally executes here to both splice and assign the array and define the new guessCard 
    arrMut = false
    cardArr.splice(guessInd, 1)
  }
});
