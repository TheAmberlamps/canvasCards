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

let is_dragging = false;
let currentCard = null;
let cardIndex = null;
let fiddleArr = false;
let mainText = document.getElementById("textPrompt")
mainText.textContent = "START"
let cardBack = "https://deckofcardsapi.com/static/img/back.png";
let startX;
let startY;

canvas.onmousedown = mouse_down;
canvas.onmouseup = mouse_up;
canvas.onmousemove = mouse_move;
canvas.onmouseout = mouse_out;

function cardFlip (card) {
  let time = 0.25
  if (card.valObj.flipping === false) {
    card.valObj.flipping = true
    gsap.to(card.valObj, {
      xScale: 0,
      duration: time,
      onComplete: () => {
        if (card.src === card.valObj.cardImg) {
          card.src = cardBack;
          gsap.to(card.valObj, {
            xScale: 1,
            duration: time,
            flipping: false
          });
        } else {
          card.src = card.valObj.cardImg;
          gsap.to(card.valObj, {
            xScale: 1,
            duration: time,
            flipping: false
          });
        }
      }
    })
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
      cardIndex = i
      is_dragging = true
      cardFlip(cardArr[i])
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

let cardArr = [];

async function cardMaker(deck) {
  let newCard = new Image();
  let cardData = await drawCards(deck);
  newCard.src = cardData.image;
  //newCard.src = cardBack;
  newCard.addEventListener(
    "load",
    () => {
      newCard.valObj = {
        xVal: 0,
        yVal: canvas.height,
        rotVal: 0,
        xScale: 1,
        yScale: 1,
        cardVal: cardData.value,
        cardSuit: cardData.suit,
        cardImg: cardData.image,
        flipping: false
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

let decks = 1;

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

console.log(newDeck);

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

for (let i = 0; i < 5; i++) {
  // I like this
  let time = (i + 1) * 500;
  setTimeout(async function () {
    await cardMaker(newDeck);
  }, time);
}

// update loop
gsap.ticker.add(function () {
  if (cardArr.length > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < cardArr.length; i++) {
      //console.log(cardArr[i].valObj)
      //console.log("cardArr.length: " + cardArr.length)
      //console.log("i: " + i)
      ctx.save();
      ctx.translate(cardArr[i].valObj.xVal, cardArr[i].valObj.yVal);
      ctx.rotate(cardArr[i].valObj.rotVal);
      ctx.scale(cardArr[i].valObj.xScale, 1);
      ctx.drawImage(cardArr[i], -cardArr[i].width / 2, -cardArr[i].height / 2);
      ctx.restore();
    }
  }
});
