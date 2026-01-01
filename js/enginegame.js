function engineGame(options){
  options = options || {};
  var game = new Chess();
  var board;
  var evaluationEl = document.getElementById("evaluation");
  var recommendedEl = document.getElementById("recommended");

  // Load Stockfish 14 JS locally
  var engine = new Worker(options.stockfishjs || "stockfish.js");

  board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDragStart: function(source, piece) {
      if(game.game_over() || (piece.search(/^b/) !== -1)) return false; // player white
    },
    onDrop: function(source, target) {
      var move = game.move({from: source, to: target, promotion: 'q'});
      if(!move) return 'snapback';
      board.position(game.fen());
      askEngine();
    },
    onSnapEnd: function() {
      board.position(game.fen());
    }
  });

  engine.onmessage = function(event){
    var line = event.data;
    if(!line) return;

    if(line.startsWith("uciok") || line.startsWith("readyok")) return;

    // Eval score
    var scoreMatch = line.match(/\bscore (\w+) (-?\d+)/);
    if(scoreMatch){
      if(scoreMatch[1]==="cp")
        evaluationEl.textContent = "Evaluation: " + (parseInt(scoreMatch[2])/100).toFixed(2);
      else if(scoreMatch[1]==="mate")
        evaluationEl.textContent = "Evaluation: Mate in " + scoreMatch[2];
    }

    // Recommended moves (PV)
    var pvMatch = line.match(/\bpv (([a-h][1-8][a-h][1-8][qrbn]? ?)+)/);
    if(pvMatch){
      recommendedEl.textContent = "Recommended: " + pvMatch[1].trim().split(' ').join(', ');
    }
  };

  function askEngine(){
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('setoption name MultiPV value 3');
    engine.postMessage('go depth 12');
  }

  return {
    reset: function(){
      game.reset();
      board.position('start');
      askEngine();
    }
  };
}
