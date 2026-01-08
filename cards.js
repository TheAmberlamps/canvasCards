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

let newCard = new Image();
newCard.addEventListener("load", () => {
  var valObj = {
    xVal: 0,
    yVal: canvas.height,
    rotateVal: 0,
  };
  gsap.to(valObj, {
    rotateVal: randRotInRads(),
    xVal: canvas.width / 2,
    yVal: canvas.height / 2,
    ease: "power4.out",
    duration: 1,
  });
  gsap.ticker.add(function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(valObj.xVal, valObj.yVal);
    ctx.rotate(valObj.rotateVal);
    ctx.drawImage(newCard, -newCard.width / 2, -newCard.height / 2);
    ctx.restore();
  });
});

let decks = 1;

let newDeck = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${decks}`;

fetch(newDeck)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json(); // Or .text(), .blob(), etc., depending on expected response type
  })
  .then((data) => {
    console.log(data);
    console.log(data.deck_id);
    let deckId = data.deck_id;
    let drawCard = `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`;
    fetch(drawCard)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log(data.cards[0]);
        newCard.src = data.cards[0].image;
      });
  });
