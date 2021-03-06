import { expect } from "chai";
import { GreatEscarpmentConsortium } from "../../src/cards/GreatEscarpmentConsortium";
import { Color } from "../../src/Color";
import { Player } from "../../src/Player";
import { Game } from "../../src/Game";
import { Resources } from '../../src/Resources';
import { SelectPlayer } from "../../src/inputs/SelectPlayer";

describe("GreatEscarpmentConsortium", function () {
    let card : GreatEscarpmentConsortium, player : Player, player2 : Player, game : Game;

    beforeEach(function() {
        card = new GreatEscarpmentConsortium();
        player = new Player("test", Color.BLUE, false);
        player2 = new Player("test2", Color.RED, false);
        game = new Game("foobar", [player, player2], player);
    });

    it("Cannot play without steel production", function () {
        expect(card.canPlay(player)).to.eq(false);
    });

    it("Can play if player has steel production", function () {
        player.addProduction(Resources.STEEL);
        expect(card.canPlay(player)).to.eq(true);
    });
    
    it("Should play - auto select if single target", function () {
        player.addProduction(Resources.STEEL);
        card.play(player, game); // can decrease own production
        const input = game.deferredActions[0].execute();
        expect(input).to.eq(undefined);
        expect(player.getProduction(Resources.STEEL)).to.eq(1);
    });

    it("Should play - multiple targets", function () {
        player.addProduction(Resources.STEEL);
        player2.addProduction(Resources.STEEL);
        card.play(player, game);
        expect(player.getProduction(Resources.STEEL)).to.eq(2);

        expect(game.deferredActions.length).to.eq(1);
        const selectPlayer = game.deferredActions[0].execute() as SelectPlayer;
        selectPlayer.cb(player2);
        expect(player2.getProduction(Resources.STEEL)).to.eq(0);
    });

    it("Can play in solo - won't reduce own production", function () {
        game = new Game("foobar", [player], player);
        player.addProduction(Resources.STEEL);
        expect(player.getProduction(Resources.STEEL)).to.eq(1);
        
        card.play(player, game);

        const input = game.deferredActions[0].execute();
        expect(input).to.eq(undefined);
        expect(player.getProduction(Resources.STEEL)).to.eq(2); // should increase
    });
});
