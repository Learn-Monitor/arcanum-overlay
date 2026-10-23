const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
    path.join(__dirname, '../../main/resources/js/user/build_dashboard.js'),
    'utf8'
);

function normalizer() {
    const context = { console };
    vm.createContext(context);
    const start = source.indexOf('function curriculumError');
    const end = source.indexOf('function reconcileCurriculumSemesters');
    vm.runInContext(source.slice(start, end), context);
    return context.normalizeCurriculumCatalog;
}

function displayHelpers() {
    const context = {
        console,
        document: { readyState: 'loading', addEventListener() {}, querySelector() { return null; } },
        window: { setTimeout() { return 0; } }
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return context;
}

function catalog(overrides = {}) {
    return {
        semesterId: 1,
        centralTopics: [{ id: 10, name: 'Zentral' }],
        centralTasks: [{ id: 11, name: 'Zentrale Etappe', tokens: 4, niveau: 1,
            topicId: 10, topicName: 'Zentral', completed: false }],
        flexibleTopics: [{ id: 20, name: 'Flexibel' }],
        flexibleTasks: [{ id: 21, name: 'Freigegebene flexible Etappe', tokens: 6,
            topicId: 20, topicName: 'Flexibel', completed: false }],
        planned: { centralTokens: 4, flexibleTokens: 21, totalTokens: 25,
            unreleasedCentralTokens: 0, regularLimit: 100, hardLimit: 105 },
        progress: { centralTokens: 0, flexibleTokens: 0, totalTokens: 0,
            semesterId: 1 },
        ...overrides
    };
}

test('accepts a catalog with unreleased flexible planned stages', () => {
    const result = normalizer()(catalog());
    assert.equal(result.flexibleTasks.length, 1);
    assert.equal(result.planned.flexibleTokens, 21);
});

test('keeps flexible maximums separate from effective earned awards', () => {
    const result = normalizer()(catalog({
        flexibleTasks: [
            {id: 21, name: 'Variable', tokens: 4, variableTokens: true, awardedTokens: 2,
                topicId: 20, topicName: 'Flexibel', completed: true},
            {id: 22, name: 'Legacy', tokens: 3, variableTokens: false, awardedTokens: null,
                topicId: 20, topicName: 'Flexibel', completed: true},
            {id: 23, name: 'Open', tokens: 4, variableTokens: true,
                topicId: 20, topicName: 'Flexibel', completed: false}
        ],
        planned: {centralTokens: 4, flexibleTokens: 21, totalTokens: 25,
            unreleasedCentralTokens: 0, regularLimit: 100, hardLimit: 105},
        progress: {centralTokens: 0, flexibleTokens: 5, totalTokens: 5, semesterId: 1}
    }));
    assert.equal(result.flexibleTasks[0].tokens, 4);
    assert.equal(result.flexibleTasks[0].awardedTokens, 2);
    assert.equal(result.flexibleTasks[1].awardedTokens, 3);
    assert.equal(result.flexibleTasks[2].tokens, 4);
    assert.equal(result.progress.flexibleTokens, 5);
});

test('accepts a completed Nanstein in the subject progress total', () => {
    const result = normalizer()(catalog({
        progress: {
            centralTokens: 0, flexibleTokens: 0, nansteinTokens: 7, totalTokens: 7,
            completedNansteine: [{id: 91, name: 'Synthetischer Nanstein', tokens: 7}], semesterId: 1
        }
    }));
    assert.equal(result.progress.nansteinTokens, 7);
    assert.equal(result.progress.totalTokens, 7);
    assert.equal(result.progress.completedNansteine[0].id, 91);
});

test('keeps Nanstein rewards above the regular 105-coin curriculum cap visible', () => {
    const result = normalizer()(catalog({
        centralTasks: [{id: 11, name: 'Zentrale Etappe', tokens: 100, niveau: 1,
            topicId: 10, topicName: 'Zentral', completed: true}],
        flexibleTasks: [],
        planned: {centralTokens: 100, flexibleTokens: 0, totalTokens: 100,
            unreleasedCentralTokens: 0, regularLimit: 100, hardLimit: 105},
        progress: {centralTokens: 100, flexibleTokens: 0, nansteinTokens: 7, totalTokens: 107, semesterId: 1}
    }));
    assert.equal(result.progress.totalTokens, 107);
});

test('rejects a Nanstein total that is inconsistent with the component totals', () => {
    assert.throws(() => normalizer()(catalog({
        progress: {centralTokens: 0, flexibleTokens: 0, nansteinTokens: 7, totalTokens: 0, semesterId: 1}
    })));
});

test('routes dashboard catalog requests through the shared 429-safe fetch helper', () => {
    assert.match(source, /fetchJsonStrict\('\/my-curriculum-catalog'/);
    assert.match(source, /rateLimitSafe:true/);
});

test('formats open and completed variable stages with maximum context', () => {
    const format = displayHelpers().formatCurriculumTaskCoins;
    assert.equal(format({tokens: 4, variableTokens: true, completed: false}), 'bis zu 4 Münzen');
    assert.equal(format({tokens: 4, variableTokens: true, awardedTokens: 2, completed: true}), '2 von 4 Münzen');
    assert.equal(format({tokens: 4, variableTokens: true, awardedTokens: 4, completed: true}), '4 von 4 Münzen');
    assert.equal(format({tokens: 1, variableTokens: true, completed: false}), 'bis zu 1 Münze');
});

test('keeps fixed task wording compatible while preserving zero awards', () => {
    const format = displayHelpers().formatCurriculumTaskCoins;
    assert.equal(format({tokens: 4, variableTokens: false, completed: false}), '4 mögliche Münzen');
    assert.equal(format({tokens: 4, variableTokens: false, awardedTokens: 4, completed: true}), '4 Münzen');
    assert.equal(format({tokens: 4, variableTokens: true, awardedTokens: 0, completed: true}), '0 von 4 Münzen');
});

test('does not replace an explicit zero award through truthiness fallback', () => {
    const result = normalizer()(catalog({
        flexibleTasks: [{id: 21, name: 'Zero legacy value', tokens: 4,
            awardedTokens: 0, topicId: 20, topicName: 'Flexibel', completed: true}],
        planned: {centralTokens: 4, flexibleTokens: 21, totalTokens: 25,
            unreleasedCentralTokens: 0, regularLimit: 100, hardLimit: 105},
        progress: {centralTokens: 0, flexibleTokens: 0, totalTokens: 0, semesterId: 1}
    }));
    assert.equal(result.flexibleTasks[0].awardedTokens, 0);
});

test('rejects visible flexible stages above the planned total', () => {
    assert.throws(() => normalizer()(catalog({
        flexibleTasks: [{ id: 21, name: 'Zu viele Münzen', tokens: 22,
            topicId: 20, topicName: 'Flexibel', completed: false }]
    })));
});

test('keeps the central hidden-token equality check strict', () => {
    assert.throws(() => normalizer()(catalog({
        planned: { centralTokens: 4, flexibleTokens: 21, totalTokens: 25,
            unreleasedCentralTokens: 1, regularLimit: 100, hardLimit: 105 }
    })));
});

test('accepts only the server-provided forecast as display data', () => {
    const result = normalizer()(catalog({forecast: {
        available: true,
        forecastCoins: 68,
        forecastGrade: 3,
        forecastGradeLabel: 'befriedigend',
        paceCoinsPerDay: 0.2,
        remainingDays: 42,
        remainingStages: 4,
        remainingCoinPotential: 32,
        message: ''
    }}));
    assert.equal(result.forecast.forecastCoins, 68);
    assert.equal(result.forecast.forecastGrade, 3);
    assert.equal(result.forecast.remainingCoinPotential, 32);
});

test('shows no forecast when the server withholds it', () => {
    const result = normalizer()(catalog({forecast: {
        available: false,
        message: 'Noch keine belastbare Prognose. Es liegen bisher zu wenige bestätigte Leistungen vor.'
    }}));
    assert.equal(result.forecast.available, false);
    assert.match(result.forecast.message, /zu wenige bestätigte Leistungen/);
});

test('formats German forecast decimals and motivating messages', () => {
    const context = displayHelpers();
    assert.equal(context.formatGermanDecimal(0.2), '0,2');
    assert.equal(context.formatGermanDecimal(2), '2');
    assert.match(context.forecastMotivation(6), /Versuche mehr/);
    assert.match(context.forecastMotivation(5), /Versuche mehr/);
    assert.match(context.forecastMotivation(4), /Das sieht gut aus/);
    assert.match(context.forecastMotivation(3), /Das sieht gut aus/);
    assert.match(context.forecastMotivation(2), /Super/);
    assert.match(context.forecastMotivation(1), /Super/);
});

test('keeps forecast coin imagery and removes the retired forecast sentence', () => {
    assert.match(source, /arcanum-coin-a5c34f85b21b75d5\.webp/);
    assert.match(source, /arcanum-coin-badge__coin/);
});

test('derives unfinished failed stages and direct locks, excluding administrative locks', () => {
    const context = displayHelpers();
    assert.equal(context.isNotPassedTask({completed: false, assessmentStatus: 'FAILED_ONCE'}), true);
    assert.equal(context.isNotPassedTask({completed: false, assessmentStatus: 'FAILED_TWICE'}), true);
    assert.equal(context.isNotPassedTask({completed: false, assessmentStatus: 'LOCKED', failedAttempts: 0}), true);
    assert.equal(context.isNotPassedTask({completed: false, assessmentStatus: 'LOCKED', failedAttempts: 1}), true);
    assert.equal(context.isNotPassedTask({completed: false, assessmentStatus: 'LOCKED', failedAttempts: 2}), true);
    assert.equal(context.isNotPassedTask({completed: false, assessmentStatus: 'PASSED'}), false);
    assert.equal(context.isNotPassedTask({completed: false}), false);
    assert.equal(context.isNotPassedTask({completed: true, assessmentStatus: 'FAILED_ONCE'}), false);
    assert.equal(context.isNotPassedTask({completed: true, assessmentStatus: 'LOCKED', failedAttempts: 0}), false);
});

test('sorts not-passed stages by urgency', () => {
    const context = displayHelpers();
    const stages = [
        {name: 'Einmal', assessmentStatus: 'FAILED_ONCE', niveau: 1},
        {name: 'Gesperrt', assessmentStatus: 'LOCKED', failedAttempts: 2, niveau: 1},
        {name: 'Zweimal', assessmentStatus: 'FAILED_TWICE', niveau: 1}
    ].sort(context.compareNotPassedTasks);
    assert.deepEqual(stages.map(stage => stage.assessmentStatus), ['LOCKED', 'FAILED_TWICE', 'FAILED_ONCE']);
});
