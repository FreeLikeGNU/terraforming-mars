import { expect } from "chai";
import { AsteroidRights } from "../../../src/cards/promo/AsteroidRights";
import { Color } from "../../../src/Color";
import { Player } from "../../../src/Player";
import { Resources } from "../../../src/Resources";
import { Game } from "../../../src/Game";
import { ICard } from "../../../src/cards/ICard";
import { CometAiming } from "../../../src/cards/promo/CometAiming";
import { OrOptions } from "../../../src/inputs/OrOptions";
import { SelectCard } from "../../../src/inputs/SelectCard";
import { SelectOption } from "../../../src/inputs/SelectOption";

describe("AsteroidRights", function () {
    let card : AsteroidRights, player : Player, game : Game;

    beforeEach(function() {
        card = new AsteroidRights();
        player = new Player("test", Color.BLUE, false);
        game = new Game("foobar", [player, player], player);

        player.playedCards.push(card);
        card.play();
    });

    it("Should play", function () {
        expect(card.resourceCount).to.eq(2);
    });

    it("Can't act", function () {
        player.megaCredits = 0;
        card.resourceCount = 0;
        expect(card.canAct(player)).to.eq(false);
    });

    it("Should act - can auto spend asteroid resource", function () {
        player.megaCredits = 0;
        const action = card.action(player, game) as OrOptions;

        // Gain 1 MC prod
        action.options[0].cb();
        expect(player.getProduction(Resources.MEGACREDITS)).to.eq(1);

        // Gain 2 titanium
        action.options[1].cb();
        expect(player.titanium).to.eq(2);
    });

    it("Should play - can auto add asteroid resource to self", function () {
        player.megaCredits = 1;
        card.resourceCount = 0;
        
        card.action(player, game);
        game.deferredActions[0].execute();
        expect(player.megaCredits).to.eq(0);
        expect(card.resourceCount).to.eq(1);
    });

    it("Should play - can add asteroid resource to other card", function () {
        player.megaCredits = 1;
        card.resourceCount = 0;
        const cometAiming = new CometAiming();
        player.playedCards.push(cometAiming);
        
        const action = card.action(player, game) as SelectCard<ICard>;
        action.cb([cometAiming]);
        expect(cometAiming.resourceCount).to.eq(1);
    });

    it("Should play - all options available", function () {
        player.megaCredits = 1;
        const cometAiming = new CometAiming();
        player.playedCards.push(cometAiming);

        const action = card.action(player, game) as OrOptions;
        expect(action instanceof OrOptions).to.eq(true);
        expect(action.options[0] instanceof SelectOption).to.eq(true);
        expect(action.options[1] instanceof SelectCard).to.eq(true);
    });
});
