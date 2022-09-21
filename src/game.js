const Deck = require('./deck.js')
const Player = require('./player.js')
// const GameObject = require('./game_object.js')
const Fuse = require('./fuse.js')
const Clue = require('./clue.js');
const { _ } = require('core-js');


class Game {
    constructor(name1, name2) {
        this.score = 0;
        this.deck = new Deck(this)
        this.player1 = new Player(name1);
        this.player2 = new Player(name2);
        this.players = [this.player1, this.player2]
        this.currentPlayer = this.players[0]
        this.playPiles = [[],[],[],[],[]]
        this.discardPiles = [[],[],[],[],[]]
        this.numClues = 8;
        this.numFuses = 3;
        this.numTurns = 2
        this.playSelected = false;
        this.discardSelected = false;

    }

    //game logic:
    
    //1. player either discards, plays, or gives clue
    //2. if discard --> 
    //  2a. call PlayorDiscard(discard)
    //      2a.a. update discard piles and positions
    //      2a.b if num clues < 8, num clues += 1
    //  2a. switch turns
    //3. if play -->
    //  3a. call play or discard(play)
    //      3a.a check for valid play 
    //          3.a.a if valid --> update play piles and card position
    //          3.a.b if not valid --> move to dsicard, fuse -= 1
    //      switch tunrs
    //4 if clue -->
    //      num clues -=1
    //      clued card.touched = true
    //      if the clue is color 
    //          card.revealedColor = true
    //      else if clue is number
    //          card.revealedNum = true
    //  switch turns
    // 
    draw(ctx, x, y) {
        ctx.roundRect(x, y, 140, 220, 15);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "gray"
        ctx.stroke();
    }

    addCard(hand) {
        hand.unshift(this.deck.deckArray.shift())
    }

    dealCards() {
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i]
            while (player.hand.length < 5) {
                this.addCard(player.hand)
            }
        }
    }

    
    handleDiscardClick(event, discardPositions, allColors) {
        event.preventDefault();
        const cards = this.players[0].hand
        cards.forEach(card => {
            if (card.selected) {
                let cardColorIdx = allColors.indexOf(card.color)
                card.pos = discardPositions[cardColorIdx]
                card.selected = false;
                card.revealedColor = true;
                card.revealedNum = true;
                this.playOrDiscard(card, "discard", discardPositions, allColors)
            }
        })    
    }

    handlePlayClick(event, discardPositions, playPositions, playColors, discardColors) {
        event.preventDefault();
        const cards = this.players[0].hand
        cards.forEach(card => {
            if (card.selected) {
                if (this.validMove(card, playColors)) {
                    this.playOrDiscard(card, "play", playPositions, playColors)
                } //else {
                //     console.log("misplay!")
                //     this.playOrDiscard(card, "discard", discardPositions, discardColors)
                // }
            }
        })    
    }

    handleClueHover(e, type, attribute) {
        e.preventDefault();
        const cards = this.players[1].hand
        if (type === "color") {
                cards.forEach(card => {
                    if (card.color === attribute) {
                        card.secondarySelected = true
                    }
                })
            } else {
                cards.forEach(card => {
                    if(card.num === attribute) {
                        card.secondarySelected = true
                    }
                })
            }
    } 

    error(num) {
        switch(num) {
            case 1:
                return "not enough clues, must discard or play"
                break;
            case "misplay":
                return "misplay!"
                break;
        }
        // console.log("Not a valid move")
    }

    switchTurns() {
        let temp = this.players[0]
        this.players[0] = this.players[1]
        this.players[1] = temp
        this.currentPlayer = this.players[0]
    }

    playOrDiscard(pivotCard, moveType, positions, allColors) {
        console.log("colors array: " + allColors)
        const cards = this.currentPlayer.hand
        let pivotIdx = cards.indexOf(pivotCard)
        let pile;
        // console.log("discard piles " + this.discardPiles)
        if (moveType === "discard") {
            // console.log("moveType = " + moveType)
            // if (this.numClues < 8) {
                this.numClues += 1
                pile = this.discardPiles
                console.log(pile)
            // } //else {
            //     console.log("cannot discard, too many clues")
            // }
        } else {
            pile = this.playPiles;
        } 
        
        this.currentPlayer.hand = this.currentPlayer.hand.slice(0, pivotIdx).concat(this.currentPlayer.hand.slice(pivotIdx + 1))
        
        let colorIdx = allColors.indexOf(pivotCard.color)
        console.log(pile)       
        pile[colorIdx].push(pivotCard)
        console.log(pile)
        pivotCard.revealedColor = true;
        pivotCard.revealedNum = true;
        pivotCard.selected = false;
        pivotCard.pos = positions[colorIdx]
        this.addCard(this.currentPlayer.hand)
        this.switchTurns();
        this.updateScore();
    }

    validMove(currentCard, allColors) {
        let colorIdx = allColors.indexOf(currentCard.color)

        let pile = this.playPiles[colorIdx]

        if (pile.length > 0) {
            if (pile[pile.length - 1].num + 1 === currentCard.num) {
                return true
            }
        } else if (pile.length === 0) {
            if (currentCard.num === 1) return true
        }
        return false;
  
        
    }

    giveClue(cards, info) {
        if (this.numClues >= 0) {
            cards.forEach(card => {
                card.touched = true;
                if (info === "color") {
                    card.revealedColor = true;
                } else if (info === "number") {
                    card.touched = true;
                    card.revealedNum = true;
                }
            })
            this.numClues -= 1
            
        } else {
            console.log("not enough clues")
        }
        
    }

    updateScore() {
        let score = 0
        this.playPiles.forEach(pile => {
            if (pile.length > 0) score += pile[pile.length - 1].num
        })
        return this.score = score
    }

    won() {
        return this.playPiles.every(pile => {
            pile[pile.length - 1] === 5
        })
    }

    lost() {
       return this.over() && !won()
    }

    deckEmpty() {
        return deckArray.length === 0;
    }

    over() {
        return this.numTurns === 0 || this.numFuses === 0
    }

    currentHands() {
        const cards = this.players[0].hand.concat(this.players[1].hand)
        return cards;
    }

    anyCardsSelected() {
        const cards = this.players[0].hand.concat(this.players[1])
        console.log(this.currentHands().some(card => card.selected))
        return this.currentHands().some(card => card.selected)
    }


}



module.exports = Game;