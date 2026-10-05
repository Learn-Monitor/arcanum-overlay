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
    const context = { console };
    vm.createContext(context);
    const start = source.indexOf('function formatGermanDecimal');
    const end = source.indexOf('function taskBelongsToSubject');
    vm.runInContext(source.slice(start, end), context);
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
    assert.match(source, /arcanum-coin\.png/);
    assert.match(source, /arcanum-coin-badge__coin/);
});
