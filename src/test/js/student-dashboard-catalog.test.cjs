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
