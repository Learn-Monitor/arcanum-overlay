const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('/srv/arcanum/dev/tooling/playwright/node_modules/playwright');

const overlayRoot = path.join(__dirname, '../src/main/resources');
const coreRoot = '/srv/arcanum/dev/workspace/student-database/src/main/resources';
const pageHtml = fs.readFileSync(path.join(overlayRoot, 'html/user/dashboard.html'));
const css = fs.readFileSync(path.join(overlayRoot, 'css/user/arcanum-student.css'));
const theme = fs.readFileSync(path.join(overlayRoot, 'css/user/arcanum-student-theme.css'));
const dashboardJs = fs.readFileSync(path.join(overlayRoot, 'js/user/build_dashboard.js'));
const sharedJs = fs.readFileSync(path.join(coreRoot, 'js/site/student-database.js'));

const topic = {id: 7001, name: 'Synthetisches Thema'};
const completedTasks = Array.from({length: 30}, (_, index) => ({
    id: 7100 + index,
    name: `Synthetische bestandene Etappe ${String(index + 1).padStart(2, '0')}`,
    tokens: 3,
    niveau: (index % 3) + 1,
    topicId: topic.id,
    topicName: topic.name,
    active: true,
    completed: true,
    awardedTokens: 3,
    inProgress: false
}));
const failedTwice = {
    id: 7200,
    name: 'Synthetische Etappe mit zwei Fehlversuchen',
    tokens: 3,
    niveau: 1,
    topicId: topic.id,
    topicName: topic.name,
    active: false,
    completed: false,
    assessmentStatus: 'FAILED_TWICE',
    failedAttempts: 2,
    inProgress: false
};
const catalog = {
    semesterId: 7000,
    centralTopics: [topic],
    centralTasks: [...completedTasks, failedTwice],
    flexibleTopics: [],
    flexibleTasks: [],
    planned: {
        centralTokens: 93,
        flexibleTokens: 0,
        totalTokens: 93,
        unreleasedCentralTokens: 0,
        regularLimit: 100,
        hardLimit: 105
    },
    progress: {centralTokens: 90, flexibleTokens: 0, totalTokens: 90, semesterId: 7000},
    forecast: {available: false, message: 'Synthetische Browserprüfung.'}
};

function send(response, body, contentType = 'text/html; charset=utf-8', status = 200) {
    response.writeHead(status, {
        'Content-Type': contentType,
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:"
    });
    response.end(body);
}

function startServer() {
    const server = http.createServer((request, response) => {
        const url = new URL(request.url, 'http://127.0.0.1');
        if (url.pathname === '/') return send(response, pageHtml);
        if (url.pathname === '/arcanum-student.css') return send(response, css, 'text/css');
        if (url.pathname === '/arcanum-student-theme.css') return send(response, theme, 'text/css');
        if (url.pathname === '/build_dashboard.js') return send(response, dashboardJs, 'text/javascript');
        if (url.pathname === '/student-database.js') return send(response, sharedJs, 'text/javascript');
        if (url.pathname === '/mydata') return send(response, JSON.stringify({
            id: 7002,
            firstName: 'Synthetischer',
            lastName: 'Browser-Test',
            email: 'synthetic-browser@example.invalid',
            schoolClass: {label: 'Synthetische Klasse'},
            graduationLevel: 'STARTER',
            totalValidCoins: 90,
            ranking: {rankAvailable: false, inTopFifty: false},
            selectedTasks: [],
            lockedTasks: [],
            currentRequests: {}
        }), 'application/json');
        if (url.pathname === '/my-curriculum-subjects') return send(response, JSON.stringify([
            {id: 7003, name: 'Synthetisches Fach', displayName: 'Synthetisches Fach', displayOrder: 1}
        ]), 'application/json');
        if (url.pathname === '/my-curriculum-catalog') return send(response, JSON.stringify(catalog), 'application/json');
        if (url.pathname === '/current-topic') return send(response, JSON.stringify({id: topic.id, name: topic.name}), 'application/json');
        if (url.pathname === '/arcanum-schatzkammer-tuer.png') return send(response, fs.readFileSync(path.join(overlayRoot, 'imgs/login/arcanum-schatzkammer-tuer.png')), 'image/png');
        if (url.pathname === '/arcanum-coin-a5c34f85b21b75d5.webp') return send(response, fs.readFileSync(path.join(overlayRoot, 'imgs/login/arcanum-coin-a5c34f85b21b75d5.webp')), 'image/webp');
        if (url.pathname === '/arcanum-dashboard-background.png') return send(response, fs.readFileSync(path.join(overlayRoot, 'imgs/dashboard/arcanum-dashboard-background.png')), 'image/png');
        if (url.pathname === '/arcanum-neutral-avatar.png') return send(response, fs.readFileSync(path.join(overlayRoot, 'imgs/dashboard/arcanum-neutral-avatar.png')), 'image/png');
        if (url.pathname === '/favicon.ico') return send(response, '', 'image/x-icon', 204);
        send(response, 'Not found', 'text/plain; charset=utf-8', 404);
    });
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function main() {
    const server = await startServer();
    const port = server.address().port;
    const browser = await chromium.launch({headless: true});
    try {
        for (const viewport of [{width: 1440, height: 900}, {width: 390, height: 844}, {width: 360, height: 800}]) {
            const mobile = viewport.width < 600;
            const context = await browser.newContext({viewport, hasTouch: mobile, isMobile: mobile});
            const page = await context.newPage();
            const consoleErrors = [];
            const pageErrors = [];
            page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
            page.on('pageerror', error => pageErrors.push(error.message));
            await page.goto(`http://127.0.0.1:${port}/`, {waitUntil: 'networkidle'});
            const card = page.locator('.arcanum-subject-card');
            await assert.doesNotReject(() => card.waitFor({state: 'visible'}));
            await card.locator('[data-detail-status="not-passed"]').click();
            assert.match(await page.locator('[data-task-dialog-content]').innerText(), /2× nicht bestanden/);
            await page.locator('[data-task-dialog-close]').click();
            await card.locator('[data-detail-status="completed"]').click();
            const dialog = page.locator('#arcanum-task-details-dialog');
            const content = page.locator('[data-task-dialog-content]');
            const close = page.locator('[data-task-dialog-close]');
            const geometry = await page.evaluate(() => {
                const dialog = document.querySelector('#arcanum-task-details-dialog');
                const panel = document.querySelector('.arcanum-task-dialog__panel');
                const content = document.querySelector('[data-task-dialog-content]');
                const close = document.querySelector('[data-task-dialog-close]');
                const rect = element => { const box = element.getBoundingClientRect(); return {top: box.top, bottom: box.bottom, left: box.left, right: box.right}; };
                return {dialog: rect(dialog), panel: rect(panel), content: rect(content), close: rect(close), scrollHeight: content.scrollHeight, clientHeight: content.clientHeight, scrollTop: content.scrollTop, viewportWidth: innerWidth, viewportHeight: innerHeight, bodyWidth: document.body.scrollWidth, documentWidth: document.documentElement.scrollWidth};
            });
            assert.ok(geometry.scrollHeight > geometry.clientHeight, `scroll area is not taller at ${viewport.width}x${viewport.height}: ${JSON.stringify(geometry)}`);
            assert.ok(geometry.dialog.top >= 0 && geometry.dialog.bottom <= viewport.height, 'dialog leaves viewport');
            assert.ok(geometry.close && geometry.close.top >= 0 && geometry.close.bottom <= viewport.height, `close button leaves viewport: ${JSON.stringify(geometry)}`);
            assert.ok(geometry.close.top <= geometry.panel.top + 120, 'close button is not in the reachable header');
            assert.ok(geometry.bodyWidth <= viewport.width && geometry.documentWidth <= viewport.width, 'global horizontal overflow');
            const contentBox = await content.boundingBox();
            await page.mouse.move(contentBox.x + contentBox.width / 2, contentBox.y + contentBox.height / 2);
            await content.click({position: {x: contentBox.width / 2, y: Math.min(100, contentBox.height / 2)}});
            if (mobile) {
                const cdp = await context.newCDPSession(page);
                const x = contentBox.x + contentBox.width / 2;
                const y = contentBox.y + Math.min(240, contentBox.height - 20);
                await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
                await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: Math.max(contentBox.y + 20, y - 420)}]});
                await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
            } else {
                await page.mouse.wheel(0, 1200);
                await page.mouse.wheel(0, 1200);
            }
            await page.waitForTimeout(50);
            const scrollDebug = await page.evaluate(() => ({
                element: document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.className,
                dialog: document.querySelector('#arcanum-task-details-dialog')?.open,
                contentOverflow: getComputedStyle(document.querySelector('[data-task-dialog-content]')).overflowY
            }));
            assert.ok(await content.evaluate(node => node.scrollTop > 0), `content did not scroll with ${mobile ? 'touch' : 'wheel'} input: ${JSON.stringify(scrollDebug)}`);
            await content.evaluate(node => { node.scrollTop = node.scrollHeight; });
            assert.ok(await content.locator('.arcanum-task-row__name').last().isVisible(), 'last completed item is not reachable');
            await content.evaluate(node => { node.scrollTop = 0; });
            assert.equal(await content.evaluate(node => node.scrollTop), 0);
            await close.click();
            assert.equal(await dialog.evaluate(node => node.open), false);
            assert.deepEqual(consoleErrors, [], `console errors at ${viewport.width}x${viewport.height}`);
            assert.deepEqual(pageErrors, [], `page errors at ${viewport.width}x${viewport.height}`);
            await page.close();
            await context.close();
            console.log(`STUDENT_BROWSER_${viewport.width}x${viewport.height}: PASS`);
        }
        console.log('STUDENT_COMPLETED_MODAL_SCROLL_DESKTOP: PASS');
        console.log('STUDENT_COMPLETED_MODAL_SCROLL_MOBILE: PASS');
        console.log('STUDENT_COMPLETED_MODAL_LAST_ITEM_REACHABLE: PASS');
        console.log('STUDENT_MODAL_CLOSE_ALWAYS_REACHABLE: PASS');
        console.log('STUDENT_MODAL_NO_GLOBAL_OVERFLOW: PASS');
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
