const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  // Set the internal canvas rendering size to match the browser window dimensions
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Note: Resizing the canvas clears its content.
  // Your drawing code must be called after this to display correctly.

  //drawScene(); // Call your main drawing function here
}

// Initial call to set the canvas size when the page loads
resizeCanvas();

// video to watch to implement drag & drop: https://www.youtube.com/watch?v=7PYvx8u_9Sk

function randRotInRads() {
  if (Math.random() > 0.5) {
    return (Math.floor(Math.random() * 360) * Math.PI) / 180;
  } else {
    return -(Math.floor(Math.random() * 360) * Math.PI) / 180;
  }
}

function randOffset(val) {
  if (Math.random() > 0.5) {
    return Math.floor(Math.random() * val);
  } else {
    return -Math.floor(Math.random() * val);
  }
}

let cardArr = [];

async function cardMaker(deck) {
  let newCard = new Image();
  newCard.src = await drawCards(deck);
  newCard.addEventListener("load", () => {
    newCard.valObj = {
      xVal: 0,
      yVal: canvas.height,
      rotateVal: 0,
    };
    gsap.to(newCard.valObj, {
      rotateVal: randRotInRads(),
      xVal: canvas.width / 2 + randOffset(100),
      yVal: canvas.height / 2 + randOffset(100),
      ease: "power4.out",
      duration: 1,
    });
    cardArr.push(newCard);
  });
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
    return data.cards[0].image;
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
      ctx.save();
      ctx.translate(cardArr[i].valObj.xVal, cardArr[i].valObj.yVal);
      ctx.rotate(cardArr[i].valObj.rotateVal);
      ctx.drawImage(cardArr[i], -cardArr[i].width / 2, -cardArr[i].height / 2);
      ctx.restore();
    }
  }
});
