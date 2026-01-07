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

let cardImg = new Image();
cardImg.addEventListener("load", () => {
  console.log(cardImg.height);
  console.log(cardImg.width);
  ctx.drawImage(
    cardImg,
    canvas.width / 2 - cardImg.width / 2,
    canvas.height / 2 - cardImg.height / 2
  );
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
        cardImg.src = data.cards[0].image;
      });
  });
