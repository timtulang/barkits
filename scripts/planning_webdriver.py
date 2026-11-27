"""minimal standard-library webdriver client for local acceptance scripts."""
import base64
import json
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

class Browser:
    def __init__(self, driver, artifacts, name):
        self.driver = driver.rstrip('/')
        self.artifacts = Path(artifacts)
        self.artifacts.mkdir(parents=True, exist_ok=True)
        result = self.request('POST', '/session', {'capabilities': {'alwaysMatch': {'browserName': 'chrome', 'goog:chromeOptions': {
            'args': ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--user-data-dir=' + tempfile.mkdtemp(prefix='barkits-' + name)]}}}})
        self.session = result['sessionId']
        self.viewport(390)

    def request(self, method, path, data=None):
        req = urllib.request.Request(self.driver + path, data=None if data is None else json.dumps(data).encode(),
                                     headers={'Content-Type': 'application/json'}, method=method)
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                return json.load(response)['value']
        except urllib.error.HTTPError as error:
            raise RuntimeError(error.read().decode()) from error

    def command(self, path, data=None, method='POST'):
        return self.request(method, '/session/' + self.session + path, data)

    def js(self, source, *args):
        return self.command('/execute/sync', {'script': source, 'args': list(args)})

    def wait(self, predicate):
        for _ in range(100):
            value = predicate()
            if value:
                return value
            time.sleep(.1)
        raise AssertionError('Timed out; current interface:\n' + self.body()[-2500:])

    def body(self):
        return self.js('return document.body.innerText')

    def visible(self, selector):
        return self.js('return [...document.querySelectorAll(arguments[0])].find(e=>e.getBoundingClientRect().width)', selector)

    def click_element(self, element):
        assert element, 'No visible element'
        self.command('/element/' + element['element-6066-11e4-a52e-4f735466cecf'] + '/click', {})

    def click(self, selector):
        self.click_element(self.wait(lambda: self.visible(selector)))

    def tap(self, label):
        self.click_element(self.wait(lambda: self.js('const root=[...document.querySelectorAll("[aria-modal=true]")].filter(e=>e.getBoundingClientRect().width).at(-1)||document;return [...root.querySelectorAll("[role=button],button")].find(e=>e.getBoundingClientRect().width && e.innerText.trim().split("\\n").at(-1)===arguments[0])', label)))

    def fill(self, label, text):
        selector = ':is(input, textarea)[aria-label=' + json.dumps(label, ensure_ascii=False) + ']'
        element = self.wait(lambda: self.visible(selector))
        self.command('/element/' + element['element-6066-11e4-a52e-4f735466cecf'] + '/value', {'text': '\ue009a\ue000\ue003' + text})

    def stage(self, name):
        self.click('[aria-label^=' + json.dumps({'who': '1. Who.', 'when': '2. When.', 'where': '3. Where.', 'review': '4. Review.'}[name]) + ']')

    def open(self, url):
        self.command('/url', {'url': url})

    def viewport(self, width):
        self.cdp('Emulation.setDeviceMetricsOverride', {'width': width, 'height': 850, 'deviceScaleFactor': 1, 'mobile': False})

    def cdp(self, name, params):
        return self.command('/goog/cdp/execute', {'cmd': name, 'params': params})

    def select(self, label, value):
        self.js('const e=document.querySelector(arguments[0]);e.value=arguments[1];e.dispatchEvent(new Event("change",{bubbles:true}));',
                'select[aria-label=' + json.dumps(label, ensure_ascii=False) + ']', value)

    def snapshot(self, name):
        self.js('for(const e of document.querySelectorAll("*")) {if(e.scrollHeight>e.clientHeight && getComputedStyle(e).overflowY.match(/auto|scroll/))e.scrollTop=0}')
        self.artifacts.joinpath(name + '.png').write_bytes(base64.b64decode(self.command('/screenshot', method='GET')))

    def watch_motion(self, selector, scale=False):
        self.js('''const [selector,scale]=arguments;
          window.motionObserver?.disconnect();
          window.motionSamples=[];
          const sample=()=>{for(const element of document.querySelectorAll(selector)) {
            const matrix=new DOMMatrixReadOnly(getComputedStyle(element).transform);
            window.motionSamples.push(scale ? Math.hypot(matrix.a,matrix.b)-1 : matrix.f);
          }};
          window.motionObserver=new MutationObserver(sample);
          window.motionObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
          sample();''', selector, scale)

    def motion_seen(self):
        return self.js('return window.motionSamples.some(value=>Math.abs(value)>.05)')

    def finish_motion(self):
        self.command('/execute/async', {'script': 'setTimeout(arguments[0], 400);', 'args': []})

    def close(self):
        self.request('DELETE', '/session/' + self.session)

def fixture(url, path, value=None):
    req = urllib.request.Request(url + path, data=json.dumps(value).encode() if value is not None else None,
                                 headers={'Content-Type': 'application/json'}, method='POST' if value is not None else 'GET')
    with urllib.request.urlopen(req) as response:
        payload = response.read()
        if value is not None and not payload:
            return None
        return json.loads(payload)

def seed_session(browser, user_id):
    encoded = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
    token = encoded({'alg': 'HS256', 'typ': 'JWT'}) + '.' + encoded({'sub': user_id, 'aud': 'authenticated', 'exp': int(time.time()) + 3600}) + '.fixture'
    session = {'access_token': token, 'refresh_token': 'fixture-refresh', 'token_type': 'bearer', 'expires_at': int(time.time()) + 3600,
               'expires_in': 3600, 'user': {'id': user_id, 'email': 'fixture@example.invalid', 'aud': 'authenticated', 'role': 'authenticated', 'app_metadata': {}, 'user_metadata': {}}}
    browser.cdp('Page.addScriptToEvaluateOnNewDocument', {'source': 'localStorage.setItem("sb-127-auth-token",' + json.dumps(json.dumps(session)) + ');'})
