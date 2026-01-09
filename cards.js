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

let cardArr = []

async function cardMaker(deck) {
  let newCard = new Image();
  newCard.src = await drawCards(deck)
  newCard.addEventListener("load", () => {
  newCard.valObj = {
    xVal: 0,
    yVal: canvas.height,
    rotateVal: 0,
  };
  gsap.to(newCard.valObj, {
    rotateVal: randRotInRads(),
    xVal: canvas.width / 2,
    yVal: canvas.height / 2,
    ease: "power4.out",
    duration: 1,
  });
  // this should be its own drawing function that clears the screen, loops through all cardArr objects and draws them based on their internal values
  // commiting changes now before experimenting further, lots of progress made so far
  gsap.ticker.add(function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(newCard.valObj.xVal, newCard.valObj.yVal);
    ctx.rotate(newCard.valObj.rotateVal);
    ctx.drawImage(newCard, -newCard.width / 2, -newCard.height / 2);
    ctx.restore();
  });
});
}

let decks = 1;

async function genDeck (decks) {
  let deckUrl = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${decks}`;
  
  try {
    let response = await fetch(deckUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    let data = await response.json();
    return data.deck_id
  } catch (error) {
    console.log("Fetch failed: ", error)
    return null
  }
}

let newDeck = await genDeck(decks)

console.log(newDeck)

async function drawCards(newDeck) {
  let drawCard = `https://deckofcardsapi.com/api/deck/${newDeck}/draw/?count=1`;
  try {
    let response = await fetch(drawCard)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  let data = await response.json();
    console.log(data.cards[0]);
    return data.cards[0].image;
  } catch (error) {
    console.log("Fetch failed: ", error)
    return null
  }
}

for (let i=0; i < 5; i++) {
  await cardMaker(newDeck)
}