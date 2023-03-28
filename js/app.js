'use strict';

const WALL = 'WALL';
const FLOOR = 'FLOOR';
const BOX = 'BOX';
const GLUE = 'GLUE';
const GAMER = 'GAMER';
const CLOCK = 'CLOCK';
const TARGET = 'TARGET';
const GOLD = 'GOLD';

const GAMER_IMG = '🧍';
const GLUED_GAMER_IMG = '🤢';
const BOX_IMG = '<img src="img/box.jpg">';
const GLUE_IMG = '⚗️';
const CLOCK_IMG = '⌛';
const GOLD_IMG = '🪙';

var gGamerImg;
var gGlueInterval;
var gClockInterval;
var gGoldInterval;
var gClockIsOn = false;
var gClockSteps = 0;
var gCanMove;

var gBoard;
var gGamerPos;
var gIsGameOn;
var gIsVictory = false;
var gIsGamerGlued;
var gGamerGold;
var gGamerClock;
var gStepCount;
var gScore;

function onInitGame() {
  gGamerPos = { i: 2, j: 2 };
  gIsGameOn = true;
  gIsGamerGlued = false;
  gClockIsOn = false;
  gStepCount = 0;
  gScore = 100;

  gBoard = buildBoard();
  renderBoard(gBoard);

  gGlueInterval = setInterval(addGlue, 10000);
  gClockInterval = setInterval(addClock, 10000);
  gGoldInterval = setInterval(addGold, 10000);

  closeModal();
  var elStepCounter = document.querySelector('.step-count');
  elStepCounter.innerText = '0';
  var elScore = document.querySelector('.score');
  elScore.innerText = gScore;
}

function buildBoard() {
  // Put FLOOR everywhere and WALL at edges
  const rowCount = 9;
  const colCount = 8;
  const board = [];
  for (var i = 0; i < rowCount; i++) {
    board[i] = [];
    for (var j = 0; j < colCount; j++) {
      board[i][j] = { type: FLOOR, gameElement: null };
      if (
        i === 0 ||
        i === rowCount - 1 ||
        j === 0 ||
        j === colCount - 1 ||
        (j === 6 && i <= 5) ||
        (i === 1 && j <= 2) ||
        (i === 3 && j <= 2) ||
        (i === 4 && j == 2) ||
        (i === 4 && j == 3) ||
        (i === 5 && j === 2)
      ) {
        board[i][j].type = WALL;
      }
    }
  }
  // Place the gamer and two balls
  board[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
  board[3][4].gameElement = BOX;
  board[2][3].gameElement = BOX;
  board[4][4].gameElement = BOX;
  board[6][3].gameElement = BOX;
  board[6][4].gameElement = BOX;
  board[6][5].gameElement = BOX;
  board[6][1].gameElement = BOX;
  board[2][1].type = TARGET;
  board[3][5].type = TARGET;
  board[5][4].type = TARGET;
  board[4][1].type = TARGET;
  board[6][6].type = TARGET;
  board[7][4].type = TARGET;

  return board;
}

function renderBoard(board) {
  var strHTML = '';
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < board[0].length; j++) {
      const currCell = board[i][j];
      var cellClass = getClassName({ i: i, j: j }) + ' ';
      if (currCell.type === WALL) cellClass += ' wall';
      else if (currCell.type === TARGET) cellClass += ' target';
      else cellClass += ' floor';

      strHTML += `<td class="cell ${cellClass}"
                    onclick="moveTo(${i},${j})" >`;

      if (currCell.gameElement === GAMER) {
        strHTML += GAMER_IMG;
      } else if (currCell.gameElement === BOX) {
        strHTML += BOX_IMG;
      } else if (currCell.gameElement === CLOCK) {
        strHTML += CLOCK_IMG;
      }

      strHTML += '</td>';
    }
    strHTML += '</tr>';
  }

  const elBoard = document.querySelector('.board');
  elBoard.innerHTML = strHTML;
}

function moveTo(i, j) {
  if (!gIsGameOn || gIsGamerGlued) return;
  // Calculate distance to make sure we are moving to a neighbor cell
  var iDiff = i - gGamerPos.i;
  var jDiff = j - gGamerPos.j;
  const iAbsDiff = Math.abs(i - gGamerPos.i);
  const jAbsDiff = Math.abs(j - gGamerPos.j);

  if (
    (iAbsDiff === 1 && jAbsDiff === 0) ||
    (jAbsDiff === 1 && iAbsDiff === 0) ||
    iAbsDiff === gBoard.length - 1 ||
    jAbsDiff === gBoard[0].length - 1
  ) {
    const targetCell = gBoard[i][j];
    if (targetCell.type === WALL) return;
    // If the clicked Cell is one of the four allowed
    var gCanMove = true;
    var stepsCount = document.querySelector('.step-count');
    var elScore = document.querySelector('.score');

    //moving the Box
    if (targetCell.gameElement === BOX) {
      if (
        gBoard[i + iDiff][j + jDiff].type !== WALL &&
        gBoard[i + iDiff][j + jDiff].gameElement === null
      ) {
        targetCell.gameElement = null;
        gBoard[i + iDiff][j + jDiff].gameElement = BOX;
        renderCell({ i: i + iDiff, j: j + jDiff }, BOX_IMG);
      } else {
        gCanMove = false;
      }
    }//handeling game elements
     else if (targetCell.gameElement === GLUE) handleGlue(i, j);
    else if (targetCell.gameElement === GOLD) handleGold(i, j);
    else if (targetCell.gameElement === CLOCK) {
      handleClock(i, j);
      //starts the 10 steps count
      gClockIsOn = true;
      countClockSteps();
    }

    if (gCanMove) {
      gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
      renderCell(gGamerPos, '');
      //decrement steps count if clock is off
      if (!gClockIsOn) {
        gStepCount++;
        stepsCount.innerHTML = gStepCount;
        gScore--;
        elScore.innerHTML = gScore;
      }
      // Move to next pos
      targetCell.gameElement = GAMER;
      gGamerPos = { i, j };
      if (gIsGamerGlued) gGamerImg = GLUED_GAMER_IMG;
      else if (gGamerClock) gGamerImg = CLOCK_GAMER_IMG;
      else gGamerImg = GAMER_IMG;
      renderCell(gGamerPos, gGamerImg);

      countClockSteps();
      checkLose();
      checkVictory();
    }
  }
}

function handleGold(goldI, goldJ) {
  gScore += 100;
  var currCell = document.querySelector(`.cell-${goldI}-${goldJ}`);
  currCell.style.backgroundColor = 'green';
  var elScore = document.querySelector('.score');
  elScore.innerText = gScore;
  setTimeout(() => {
    currCell.style.backgroundColor = 'rgb(179, 160, 50)';
  }, 3000);
}

function handleGlue(glueI, glueJ) {
  gIsGamerGlued = true;
  gStepCount += 5;
  var stepsCount = document.querySelector('.step-count');
  stepsCount.innerHTML = gStepCount;
  var currCell = document.querySelector(`.cell-${glueI}-${glueJ}`);
  currCell.style.backgroundColor = 'red';
  setTimeout(() => {
    gIsGamerGlued = false;
    currCell.style.backgroundColor = 'rgb(179, 160, 50)';
    renderCell(gGamerPos, GAMER_IMG);
  }, 3000);
}

function handleClock(clockI, clockJ) {
  gClockSteps = 10;
  var currCell = document.querySelector(`.cell-${clockI}-${clockJ}`);
  currCell.style.backgroundColor = 'green';
  setTimeout(() => {
    currCell.style.backgroundColor = 'rgb(179, 160, 50)';
  }, 3000);
}

function countClockSteps() {
  gClockSteps--;
  if (gClockSteps === 0 || gIsVictory) {
    gClockIsOn = false;
    clearInterval(gClockInterval);
  }
}

function addElement(element, elementImg) {
  const emptyPos = getEmptyPos();
  if (!emptyPos) return;
  gBoard[emptyPos.i][emptyPos.j].gameElement = element;
  renderCell(emptyPos, elementImg);
  setTimeout(removeElement, 5000, emptyPos);
}

function addClock() {
  addElement(CLOCK, CLOCK_IMG);

}

function addGlue() {
  addElement(GLUE, GLUE_IMG);
  
}

function addGold() {
  addElement(GOLD, GOLD_IMG);
}

function removeElement(elementPos) {
  const cell = gBoard[elementPos.i][elementPos.j];
  if (cell.gameElement === GAMER) return;
  gBoard[elementPos.i][elementPos.j].gameElement = null;
  renderCell(elementPos, '');
}

function getEmptyPos() {
  const emptyPoss = [];
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (
        gBoard[i][j].type !== WALL &&
        !gBoard[i][j].gameElement &&
        gBoard[i][j].type === FLOOR
      ) {
        emptyPoss.push({ i, j });
      }
    }
  }
  var randIdx = getRandomInt(0, emptyPoss.length);
  return emptyPoss[randIdx];
}

function renderCell(location, value) {
  const cellSelector = '.' + getClassName(location);
  const elCell = document.querySelector(cellSelector);
  elCell.innerHTML = value;
}

// Move the player by keyboard arrows
function onHandleKey(event) {
  const i = gGamerPos.i;
  const j = gGamerPos.j;

  switch (event.key) {
    case 'ArrowLeft':
      moveTo(i, j - 1);
      break;
    case 'ArrowRight':
      moveTo(i, j + 1);
      break;
    case 'ArrowUp':
      moveTo(i - 1, j);
      break;
    case 'ArrowDown':
      moveTo(i + 1, j);
      break;
  }
}

function getClassName(location) {
  const cellClass = 'cell-' + location.i + '-' + location.j;
  return cellClass;
}

function gameOver() {
  gIsGameOn = false;
  clearInterval(gClockInterval);
  clearInterval(gGoldInterval);
  clearInterval(gGlueInterval);
  var msg = gIsVictory ? 'You Won!!!' : 'Game Over';
  openModal(msg);
}

function checkLose() {
  if (gScore < 0) gameOver();
}

function checkVictory() {
  gIsVictory = true;
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      var currCell = gBoard[i][j];
      if (currCell.type === TARGET && currCell.gameElement !== BOX)
        gIsVictory = false;
    }
  }
  if (gIsVictory) gameOver();
}

function openModal(msg) {
  const elModal = document.querySelector('.modal');
  const elSpan = elModal.querySelector('.msg');
  elSpan.innerText = msg;
  elModal.style.display = 'block';
}

function closeModal() {
  const elModal = document.querySelector('.modal');
  elModal.style.display = 'none';
}
