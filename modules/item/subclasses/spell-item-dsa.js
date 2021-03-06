import DSA5_Utility from "../../system/utility-dsa5.js";
import DiceDSA5 from "../../system/dice-dsa5.js"
import DSA5StatusEffects from "../../status/status_effects.js";
import AdvantageRulesDSA5 from "../../system/advantage-rules-dsa5.js";
import Itemdsa5 from "../item-dsa5.js";

export default class SpellItemDSA5 extends Itemdsa5 {
    static chatData(data, name) {
        return [
            this._chatLineHelper("castingTime", data.castingTime.value),
            this._chatLineHelper("AsPCost", data.AsPCost.value),
            this._chatLineHelper("distribution", data.distribution.value),
            this._chatLineHelper("duration", data.duration.value),
            this._chatLineHelper("reach", data.range.value),
            this._chatLineHelper("targetCategory", data.targetCategory.value),
            this._chatLineHelper("effect", DSA5_Utility.replaceDies(data.effect.value))
        ]
    }

    static getCallbackData(testData, html, actor) {
        testData.testModifier = Number(html.find('[name="testModifier"]').val());
        testData.testDifficulty = 0
        testData.situationalModifiers = actor._parseModifiers('[name = "situationalModifiers"]')
        testData.calculatedSpellModifiers = {
            castingTime: html.find(".castingTime").text(),
            cost: html.find(".aspcost").text(),
            reach: html.find(".reach").text(),
            maintainCost: html.find(".maintainCost").text()
        }
        testData.situationalModifiers.push({
            name: game.i18n.localize("removeGestureOrFormula"),
            value: html.find('[name="removeGestureOrFormula"]').is(":checked") ? -2 : 0
        }, {
            name: game.i18n.localize("castingTime"),
            value: html.find(".castingTime").data("mod")
        }, {
            name: game.i18n.localize("cost"),
            value: html.find(".aspcost").data('mod')
        }, {
            name: game.i18n.localize("reach"),
            value: html.find(".reach").data('mod')
        }, {
            name: game.i18n.localize("zkModifier"),
            value: html.find('[name="zkModifier"]').val() || 0
        }, {
            name: game.i18n.localize("skModifier"),
            value: html.find('[name="skModifier"]').val() || 0
        }, {
            name: game.i18n.localize("maintainedSpells"),
            value: Number(html.find('[name="maintainedSpells"]').val()) * -1
        })
    }

    static getSituationalModifiers(situationalModifiers, actor, data) {
        let skMod = 0
        let zkMod = 0

        situationalModifiers.push(...AdvantageRulesDSA5.getVantageAsModifier(actor.data, game.i18n.localize('LocalizedIDs.minorSpirits'), -1))
        situationalModifiers.push(...AdvantageRulesDSA5.getVantageAsModifier(actor.data, game.i18n.localize('LocalizedIDs.magicalAttunement')))
        situationalModifiers.push(...AdvantageRulesDSA5.getVantageAsModifier(actor.data, game.i18n.localize('LocalizedIDs.magicalRestriction'), -1))
        situationalModifiers.push(...AdvantageRulesDSA5.getVantageAsModifier(actor.data, game.i18n.localize('LocalizedIDs.boundToArtifact'), -1))
        if (game.user.targets.size) {
            game.user.targets.forEach(target => {
                skMod = target.actor.data.data.status.soulpower.max * -1
                zkMod = target.actor.data.data.status.toughness.max * -1
            });
        }
        mergeObject(data, {
            SKModifier: skMod,
            ZKModifier: zkMod
        });
    }


    static setupDialog(ev, options, spell, actor) {
        let sheet = "spell"
        if (spell.type == "ceremony" || spell.type == "liturgy")
            sheet = "liturgy"

        let title = spell.name + " " + game.i18n.localize(`${spell.type}Test`);

        let testData = {
            opposable: false,
            source: spell,
            extra: {
                actor: actor.data,
                options: options,
            }
        };

        let data = {
            rollMode: options.rollMode,
            spellCost: spell.data.AsPCost.value,
            maintainCost: spell.data.maintainCost.value,
            spellCastingTime: spell.data.castingTime.value,
            spellReach: spell.data.range.value,
            canChangeCost: spell.data.canChangeCost.value == "true",
            canChangeRange: spell.data.canChangeRange.value == "true",
            canChangeCastingTime: spell.data.canChangeCastingTime.value == "true",
            hasSKModifier: spell.data.resistanceModifier.value == "SK",
            hasZKModifier: spell.data.resistanceModifier.value == "ZK",
            maxMods: Math.floor(Number(spell.data.talentValue.value) / 4),
        }

        let situationalModifiers = actor ? DSA5StatusEffects.getRollModifiers(actor, spell) : []
        this.getSituationalModifiers(situationalModifiers, actor, data)
        data["situationalModifiers"] = situationalModifiers

        let dialogOptions = {
            title: title,
            template: `/systems/dsa5/templates/dialog/${sheet}-dialog.html`,
            data: data,
            callback: (html) => {
                cardOptions.rollMode = html.find('[name="rollMode"]').val();
                this.getCallbackData(testData, html, actor)
                return { testData, cardOptions };
            }
        };

        let cardOptions = actor._setupCardOptions("systems/dsa5/templates/chat/roll/spell-card.html", title)

        return DiceDSA5.setupDialog({
            dialogOptions: dialogOptions,
            testData: testData,
            cardOptions: cardOptions
        });
    }
}