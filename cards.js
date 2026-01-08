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

let newCard = new Image()
newCard.addEventListener("load", () => {
  var valObj = {
    xVal: 0,
    rotateVal: 0
  }
  gsap.to(valObj, {
    rotateVal: 90,
    xVal: canvas.width / 2,
    duration: 1
  })
  gsap.ticker.add(function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    //ctx.translate(newCard.x - newCard.width / 2, newCard.y - newCard.height / 2)
    //ctx.rotate(valObj.rotateVal * Math.PI / 180)
    ctx.drawImage(newCard, valObj.xVal - (newCard.width / 2), (canvas.height / 2) - newCard.height / 2)
    ctx.restore()
  })
})

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
        newCard.src = data.cards[0].image
      });
  });