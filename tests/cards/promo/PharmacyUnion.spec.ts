import { expect } from "chai";
import { PharmacyUnion } from "../../../src/cards/promo/PharmacyUnion";
import { Color } from "../../../src/Color";
import { Player } from "../../../src/Player";
import { Game } from '../../../src/Game';
import { Tags } from "../../../src/cards/Tags";
import { Ants } from "../../../src/cards/Ants";
import { ViralEnhancers } from "../../../src/cards/ViralEnhancers";
import { SearchForLife } from "../../../src/cards/SearchForLife";
import { LagrangeObservatory } from "../../../src/cards/LagrangeObservatory";
import { OrOptions } from "../../../src/inputs/OrOptions";
import { AdvancedEcosystems } from "../../../src/cards/AdvancedEcosystems";
import { Fish } from "../../../src/cards/Fish";
import { Lichen } from "../../../src/cards/Lichen";
import { Research } from "../../../src/cards/Research";
import { AndOptions } from "../../../src/inputs/AndOptions";

describe("PharmacyUnion", function () {
    let card : PharmacyUnion, player : Player, player2 : Player, game : Game;

    beforeEach(function() {
        card = new PharmacyUnion();
        player = new Player("test", Color.BLUE, false);
        player2 = new Player("test", Color.RED, false);
        game = new Game("foobar", [player, player2], player);

        player.corporationCard = card;
    });

    it("Should play", function () {
        game = new Game("foobar", [player], player);
        const pi = player.getWaitingFor() as AndOptions;
        pi.options[0].cb([card]);
        pi.options[1].cb([]);
        pi.cb();

        expect(card.resourceCount).to.eq(2);
        // Should not pay for the free Science card
        expect(player.megaCredits).to.eq(46);
        expect(player.cardsInHand.length).to.eq(1);
        expect(player.cardsInHand[0].tags.includes(Tags.SCIENCE)).to.eq(true);
    });

    it("Gains diseases and removes MC when ANY player plays microbe cards", function () {
        player.megaCredits = 8;
        player2.megaCredits = 8;
        card.play(player, game);

        const ants = new Ants();
        player.playedCards.push(ants);
        card.onCardPlayed(player, game, ants);
        expect(card.resourceCount).to.eq(3);
        expect(player.megaCredits).to.eq(4);

        const viralEnhancers = new ViralEnhancers();
        player2.playedCards.push(viralEnhancers);
        card.onCardPlayed(player2, game, viralEnhancers);
        expect(player2.megaCredits).to.eq(8); // should not change
        expect(card.resourceCount).to.eq(4);
        expect(player.megaCredits).to.eq(0);
    });
    
    it("Removes diseases and gives TR only when corp owner plays science cards", function () {
        card.play(player, game);

        const searchForLife = new SearchForLife();
        player.playedCards.push(searchForLife);
        card.onCardPlayed(player, game, searchForLife);
        expect(game.deferredActions.length).to.eq(1);
        expect(game.deferredActions[0].execute()).to.eq(undefined);
        game.deferredActions.shift();

        expect(card.resourceCount).to.eq(1);
        expect(player.getTerraformRating()).to.eq(21);

        const lagrangeObservatory = new LagrangeObservatory();
        player2.playedCards.push(lagrangeObservatory);
        card.onCardPlayed(player2, game, lagrangeObservatory);
        expect(game.deferredActions.length).to.eq(0);
        expect(card.resourceCount).to.eq(1);
        expect(player.getTerraformRating()).to.eq(21);
    });

    it("Works correctly with Research", function () {
        card.play(player, game);
        expect(card.resourceCount).to.eq(2);

        const research = new Research();
        player.playedCards.push(research);
        card.onCardPlayed(player, game, research);
        expect(game.deferredActions.length).to.eq(2);
        expect(game.deferredActions[0].execute()).to.eq(undefined);
        game.deferredActions.shift();
        expect(game.deferredActions[0].execute()).to.eq(undefined);
        game.deferredActions.shift();

        expect(card.resourceCount).to.eq(0);
        expect(player.getTerraformRating()).to.eq(22);
    });

    it("Can turn card face down once per game to gain 3 TR if no diseases on card", function () {
        card.resourceCount = 0;

        const searchForLife = new SearchForLife();
        player.playedCards.push(searchForLife);
        card.onCardPlayed(player, game, searchForLife);
        expect(game.deferredActions.length).to.eq(1);
        
        const orOptions = game.deferredActions[0].execute() as OrOptions;
        game.deferredActions.splice(0, 1);
        orOptions.options[0].cb();

        expect(player.getTerraformRating()).to.eq(23);
        expect(card.isDisabled).to.eq(true);
        
        // Cannot trigger once per game effect a second time
        card.onCardPlayed(player, game, searchForLife);
        expect(game.deferredActions.length).to.eq(0);
        expect(player.getTerraformRating()).to.eq(23);
    });

    it("Corporation tags do not count when corporation is disabled", function() {
        expect(player.getTagCount(Tags.MICROBES)).to.eq(2);
        const advancedEcosystems = new AdvancedEcosystems();
        player.playedCards.push(new Fish());
        player.playedCards.push(new Lichen());
        expect(advancedEcosystems.canPlay(player)).to.eq(true);
        
        card.resourceCount = 0;
        card.onCardPlayed(player, game, new SearchForLife());
        
        const orOptions = game.deferredActions[0].execute() as OrOptions;
        orOptions.options[0].cb();
        expect(card.isDisabled).to.eq(true);
        expect(player.getTagCount(Tags.MICROBES)).to.eq(0);
        expect(advancedEcosystems.canPlay(player)).to.eq(false);
    });

    it("Edge Case - Let player pick the tag resolution order", function() {
        // Edge case, let player pick order of resolution
        // see https://github.com/bafolts/terraforming-mars/issues/1286

        player.megaCredits = 12;
        const viralEnhancers = new ViralEnhancers();

        // Another player playing a Science/Microbes card and Pharmacy Union has no resource
        card.resourceCount = 0;
        player2.playedCards.push(viralEnhancers);
        card.onCardPlayed(player2, game, viralEnhancers);
        expect(card.resourceCount).to.eq(1);
        expect(player.megaCredits).to.eq(8);
        expect(game.deferredActions.length).to.eq(0);


        // PU player playing a Science/Microbes card and Pharmacy Union has no resource
        card.resourceCount = 0;
        player.playedCards.push(viralEnhancers);
        card.onCardPlayed(player, game, viralEnhancers);
        expect(game.deferredActions.length).to.eq(1);

        const orOptions = game.deferredActions[0].execute() as OrOptions;
        orOptions.options[1].cb(); // Add disease then remove it
        expect(card.resourceCount).to.eq(0);
        expect(player.megaCredits).to.eq(4);

        orOptions.options[0].cb(); // Turn face down then lose 4MC
        expect(card.isDisabled).to.eq(true);
        expect(card.resourceCount).to.eq(0);
        expect(player.megaCredits).to.eq(0);
    });
});
