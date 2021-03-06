import { expect } from "chai";
import { TitanFloatingLaunchPad } from "../../../src/cards/colonies/TitanFloatingLaunchPad";
import { JupiterFloatingStation } from "../../../src/cards/colonies/JupiterFloatingStation";
import { Color } from "../../../src/Color";
import { Player } from "../../../src/Player";
import { OrOptions } from "../../../src/inputs/OrOptions";
import { Game } from "../../../src/Game";
import { ICard } from "../../../src/cards/ICard";
import { SelectCard } from "../../../src/inputs/SelectCard";
import { Luna } from "../../../src/colonies/Luna";
import { Triton } from "../../../src/colonies/Triton";

describe("TitanFloatingLaunchPad", function () {
    let card : TitanFloatingLaunchPad, player : Player, game : Game;

    beforeEach(function() {
        card = new TitanFloatingLaunchPad();
        player = new Player("test", Color.BLUE, false);
        game = new Game("foobar", [player, player], player);
    });

    it("Should act", function () {
        player.playedCards.push(card);
        expect(card.canAct()).to.eq(true);
        expect(card.getVictoryPoints()).to.eq(1);
    });

    it("Should play with single targets", function() {
        player.playedCards.push(card);

        // No resource and no other card to add to
        card.action(player, game);
        expect(game.deferredActions.length).to.eq(1);
        const input = game.deferredActions[0].execute();
        game.deferredActions.shift();
        expect(input).to.eq(undefined);
        expect(card.resourceCount).to.eq(1);

        // No open colonies and no other card to add to
        card.action(player, game);
        expect(game.deferredActions.length).to.eq(1);
        const input2 = game.deferredActions[0].execute();
        game.deferredActions.shift();
        expect(input2).to.eq(undefined);
        expect(card.resourceCount).to.eq(2);
    });

    it("Should play with multiple targets", function() {
        const card2 = new JupiterFloatingStation();
        player.playedCards.push(card);
        player.playedCards.push(card2);

        card.action(player, game);
        expect(game.deferredActions.length).to.eq(1);
        const selectCard = game.deferredActions[0].execute() as SelectCard<ICard>;
        selectCard.cb([card]);
        expect(card.resourceCount).to.eq(1);
    });

    it("Should play with multiple targets and colonies", function() {
        const colony1 = new Luna();
        const colony2 = new Triton();
        game.colonies.push(colony1);
        game.colonies.push(colony2);

        const card2 = new JupiterFloatingStation();
        player.playedCards.push(card);
        player.playedCards.push(card2);
        player.addResourceTo(card, 7); 

        const orOptions = card.action(player, game) as OrOptions;

        orOptions.options[0].cb(); // Add resource
        expect(game.deferredActions.length).to.eq(1);
        const selectCard = game.deferredActions[0].execute() as SelectCard<ICard>;
        game.deferredActions.shift();
        selectCard.cb([card]);
        expect(card.resourceCount).to.eq(8);

        orOptions.options[1].cb(); // Trade for free
        expect(game.deferredActions.length).to.eq(1);
        const selectTrade = game.deferredActions[0].execute() as OrOptions;
        selectTrade.options[0].cb();
        expect(card.resourceCount).to.eq(7);
        expect(player.megaCredits).to.eq(2);
    });
});
