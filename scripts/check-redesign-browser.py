"""Check the Barkits web accessibility fixes with Chromium and ChromeDriver."""
import argparse

from planning_webdriver import Browser


def key(browser, value):
    browser.command('/actions', {'actions': [{'type': 'key', 'id': 'keyboard', 'actions': [
        {'type': 'keyDown', 'value': value}, {'type': 'keyUp', 'value': value},
    ]}]})


def focus(browser):
    return browser.js('''const el = document.activeElement;
      return {label: el.getAttribute('aria-label') || el.innerText.trim().split(String.fromCharCode(10)).at(-1),
        inDialog: !!el.closest('[role=dialog]'), visible: parseFloat(getComputedStyle(el).outlineWidth) >= 2};''')


def accessibility_nodes(browser):
    nodes = browser.cdp('Accessibility.getFullAXTree', {})['nodes']
    return {(node['role']['value'], node.get('name', {}).get('value', '')) for node in nodes if not node['ignored']}


def close_with_escape(browser):
    key(browser, '\ue00c')
    browser.wait(lambda: not browser.visible('[role=dialog]'))


def check(args):
    browser = Browser(args.driver, args.artifacts, 'redesign-a11y')
    try:
        browser.open(args.app)
        browser.wait(lambda: 'Plan a meetup' in browser.body())
        assert {('banner', ''), ('main', '')} <= accessibility_nodes(browser)
        for _ in range(15):
            key(browser, '\ue004')
            if focus(browser)['label'] == 'Plan a meetup':
                break
        assert focus(browser)['label'] == 'Plan a meetup' and focus(browser)['visible']
        key(browser, '\ue007')
        browser.wait(lambda: ('dialog', 'Plan a meetup') in accessibility_nodes(browser))
        assert browser.js('''return getComputedStyle(document.querySelector('[aria-label="Meetup name"]'),
          '::placeholder').color === 'rgb(109, 83, 111)';''')
        for _ in range(8):
            key(browser, '\ue004')
            assert focus(browser)['inDialog'] and focus(browser)['visible']
        close_with_escape(browser)
        browser.wait(lambda: focus(browser)['label'] == 'Plan a meetup')

        browser.cdp('Network.enable', {})
        browser.cdp('Network.setBlockedURLs', {'urls': ['*://tile.openstreetmap.org/*']})
        browser.click('[aria-label="Open Saturday catch-up"]')
        browser.wait(lambda: 'Some map tiles could not load' in browser.body())
        browser.click('.map-expand')
        browser.wait(lambda: ('dialog', 'Meetup map') in accessibility_nodes(browser))
        close_with_escape(browser)
        browser.tap('Places')
        browser.click('[aria-label^="View details for "]')
        browser.wait(lambda: any(role == 'dialog' and name for role, name in accessibility_nodes(browser)))
        close_with_escape(browser)

        browser.cdp('Emulation.setDeviceMetricsOverride', {'width': 320, 'height': 425, 'deviceScaleFactor': 2, 'mobile': False})
        browser.stage('who')
        browser.tap('Add friend')
        browser.wait(lambda: ('dialog', 'Add a friend') in accessibility_nodes(browser))
        browser.fill('Starting place', 'Quezon City')
        browser.wait(lambda: browser.visible('[role=option]'))
        key(browser, '\ue00c')
        browser.wait(lambda: not browser.visible('[role=option]'))
        assert focus(browser)['label'] == 'Starting place' and focus(browser)['inDialog']
        assert browser.js('return document.documentElement.scrollWidth === 320 && window.innerWidth === 320')
        browser.snapshot('friend-editor-200-percent')
        close_with_escape(browser)
        print('PASS web accessibility: landmarks, dialog names, placeholder contrast, keyboard focus, map fallback and 200% reflow')
    finally:
        browser.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', required=True)
    parser.add_argument('--driver', default='http://127.0.0.1:9515')
    parser.add_argument('--artifacts', default='.expo/redesign/check/accessibility')
    check(parser.parse_args())
