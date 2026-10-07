const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const resource = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('production templates use external scripts and stylesheets only', () => {
    const files = [
        'main/resources/templates/html/login.html',
        'main/resources/html/public/arcanum-logout.html',
        'main/resources/html/user/dashboard.html'
    ];

    for (const file of files) {
        const source = resource(file);
        assert.doesNotMatch(source, /<style(?:\s|>)/i, file);
        assert.doesNotMatch(source, /<script(?![^>]*\bsrc\s*=)[^>]*>/i, file);
        assert.doesNotMatch(source, /\bon[a-z]+\s*=/i, file);
        assert.doesNotMatch(source, /\bstyle\s*=/i, file);
    }
});

test('login assets are registered as same-origin public resources', () => {
    const paths = JSON.parse(resource('main/resources/meta/paths/get_paths.json'));
    assert.deepEqual(paths['/arcanum-login.css'], {
        type: 'GET',
        handler_type: 'FileRequestHandler',
        namespaces: ['public'],
        context: 'css',
        access_level: 'public'
    });
    assert.deepEqual(paths['/arcanum-login.js'], {
        type: 'GET',
        handler_type: 'FileRequestHandler',
        namespaces: ['public'],
        context: 'js',
        access_level: 'public'
    });
});

test('external login script still initializes the quote and submit flow', () => {
    const source = resource('main/resources/js/public/arcanum-login.js');
    assert.match(source, /getElementById\("quoteCardImage"\)/);
    assert.match(source, /getElementById\("loginForm"\)/);
    assert.match(source, /form\.addEventListener\("submit"/);
    assert.match(source, /safeNext\(nextInput\.value\)/);
});

test('dynamic dashboard text is escaped before HTML template insertion', () => {
    const source = resource('main/resources/js/user/build_dashboard.js');
    assert.match(source, /escapeHtml\(subject\.name\)/);
    assert.match(source, /escapeHtml\(topicName\)/);
    assert.match(source, /escapeHtml\(partner\.displayName\)/);
    assert.doesNotMatch(source, /<span style=/);
    assert.match(source, /style\.setProperty\("--arcanum-progress"/);
});

test('escapeHtml protects markup-significant characters', () => {
    const source = resource('main/resources/js/user/build_dashboard.js');
    const start = source.indexOf('function textValue');
    const end = source.indexOf('function renderFatalError');
    const context = {
        document: {
            createElement() {
                let value = '';
                return {
                    set textContent(next) { value = String(next); },
                    get innerHTML() {
                        return value
                            .replaceAll('&', '&amp;')
                            .replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;')
                            .replaceAll('"', '&quot;')
                            .replaceAll("'", '&#39;');
                    }
                };
            }
        }
    };
    vm.createContext(context);
    vm.runInContext(source.slice(start, end), context);

    assert.equal(
        context.escapeHtml(`<>&"'`),
        '&lt;&gt;&amp;&quot;&#39;'
    );
});

test('strict CSP keywords are absent from production resources', () => {
    const files = [
        'main/resources/templates/html/login.html',
        'main/resources/html/public/arcanum-logout.html',
        'main/resources/html/user/dashboard.html',
        'main/resources/css/public/arcanum-login.css',
        'main/resources/js/public/arcanum-login.js',
        'main/resources/js/public/arcanum-logout.js',
        'main/resources/js/user/build_dashboard.js'
    ];

    for (const file of files) {
        const source = resource(file);
        assert.doesNotMatch(source, /unsafe-(?:inline|eval)/i, file);
    }
});
