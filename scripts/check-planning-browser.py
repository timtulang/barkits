"""run local planning journeys against an exported app and an existing chromedriver."""
import argparse
import base64
import json
import time
import urllib.request
from planning_webdriver import Browser

OWNER = '11111111-1111-4111-8111-111111111111'
MEMBER = '22222222-2222-4222-8222-222222222222'

def fixture(url, path, value=None):
    req = urllib.request.Request(url + path, data=json.dumps(value).encode() if value is not None else None,
                                 headers={'Content-Type': 'application/json'}, method='POST' if value is not None else 'GET')
    with urllib.request.urlopen(req) as response:
        payload = response.read()
        if value is not None and not payload:
            return None
        return json.loads(payload)

def selected_value(browser, label):
    return browser.js('return [...document.querySelectorAll("input")].find(e=>e.getBoundingClientRect().width && e.getAttribute("aria-label")===arguments[0]).value', label)

def date_value(browser, kind, value):
    browser.js('const e=document.querySelector(arguments[0]);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,arguments[1]);e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));', 'input[type=' + kind + ']', value)

def guest(args):
    b = Browser(args.driver, args.artifacts, 'guest')
    try:
        b.open(args.app)
        b.wait(lambda: 'Plan a meetup' in b.body())
        b.tap('Plan a meetup'); b.tap('Create meetup & add friends')
        assert 'Enter a meetup name' in b.body()
        b.fill('Meetup name', 'Acceptance catch-up'); b.tap('Create meetup & add friends')
        b.wait(lambda: 'Who is joining?' in b.body())
        b.stage('where'); assert 'Complete starting points' in b.body()
        b.tap('Complete starting points')
        for name, origin in [('Alex', 'Quezon City'), ('Bo', 'Makati')]:
            b.tap('Add friend'); b.fill('Name', name); b.fill('Starting place', origin)
            b.wait(lambda: bool(b.visible('[role=option]')))
            e = b.visible('input[aria-label="Starting place"]')
            b.command('/element/' + e['element-6066-11e4-a52e-4f735466cecf'] + '/value', {'text': '\ue015\ue007'})
            b.tap('Add friend')
        b.wait(lambda: '2 friends ready' in b.body())
        b.click('[aria-label="Edit Alex"]')
        b.js('window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith("barkits.meetups"))throw Error("synthetic storage rejection");return window.originalSetItem.call(this,k,v)}')
        b.tap('Save changes'); b.wait(lambda: 'Changes are not saved' in b.body())
        b.js('Storage.prototype.setItem=window.originalSetItem'); b.tap('Try again')
        b.wait(lambda: 'Plan saved on this device' in b.body())
        b.tap('Review meetup time'); date_value(b, 'date', '2026-12-05')
        b.tap('Save schedule & choose places'); assert 'Choose a time' in b.body()
        b.stage('who'); b.stage('when')
        assert b.js('return document.querySelector("input[type=date]").value') == '2026-12-05'
        date_value(b, 'time', '15:00'); b.tap('Save schedule & choose places')
        b.wait(lambda: 'Where should you meet?' in b.body())
        b.click('[aria-label^="View details for "]'); b.tap('Compare trips here')
        b.wait(lambda: 'Selected for comparison' in b.body())
        assert 'Time incomplete' in b.body() and 'Fare unavailable' in b.body()
        b.tap('See each person’s trip'); b.click('[aria-label="Edit trip for Alex"]')
        b.fill('One-way travel time (minutes)', '20'); b.fill('Travel fare (₱, optional)', '0')
        people = b.js('return [...document.querySelector(\'select[aria-label="Plan and vote as"]\').options].map(e=>[e.text,e.value])')
        bo = next(value for label, value in people if label == 'Bo')
        alex = next(value for label, value in people if label == 'Alex')
        b.tap('Back to meetups'); b.wait(lambda: 'Unsaved planning edits' in b.body()); b.tap('Keep planning')
        b.wait(lambda: selected_value(b, 'One-way travel time (minutes)') == '20')
        b.select('Plan and vote as', bo); b.fill('One-way travel time (minutes)', '40')
        b.select('Plan and vote as', alex); b.wait(lambda: selected_value(b, 'One-way travel time (minutes)') == '20')
        b.tap('Save trip details')
        assert b.js('return JSON.stringify(JSON.parse(localStorage.getItem("barkits.meetups.v1")).at(-1).manualFares).includes(":0")')
        b.tap('Compare ride fares'); b.fill('Angkas app price (₱)', '40'); b.fill('Grab app price (₱)', '30')
        b.tap('Use Grab fare'); assert 'Selected fare · Grab' in b.body()
        b.fill('Travel fare (₱, optional)', '0'); assert 'Selected fare · Grab' not in b.body()
        b.tap('Save trip details'); b.tap('LRT-1 fares'); assert 'Boarding station' in b.body()
        b.js('window.realOpen=window.open;window.open=(url)=>{window.lastDirections=url;return {}}')
        b.tap('Transit directions'); assert 'origin=' in b.js('return window.lastDirections')
        b.js('window.open=window.realOpen')
        b.select('Plan and vote as', bo); b.tap('Save trip details')
        b.tap('Back to place comparisons'); b.tap('Cheapest')
        assert 'Not ranked: this ranking needs complete fares.' in b.body()
        b.tap('Balanced'); b.tap('See each person’s trip'); b.click('[aria-label="Edit trip for Bo"]')
        b.fill('Travel fare (₱, optional)', '50'); b.tap('Save trip details'); b.tap('Back to place comparisons')
        assert 'Longest–shortest trip gap' in b.body()
        b.tap('Show group map'); b.wait(lambda: 'Coral dots show starting points' in b.body()); b.tap('Hide group map')
        b.click('[aria-label^="Review destination,"]'); b.wait(lambda: 'Plan awaiting confirmation' in b.body())
        b.tap('Return to places without confirming')
        assert 'Destination confirmed' not in b.body()
        b.click('[aria-label^="Review destination,"]'); b.wait(lambda: 'Plan awaiting confirmation' in b.body())
        for width in (320, 390, 768, 1440):
            b.viewport(width)
            for stage in ('who', 'when', 'where', 'review'):
                b.stage(stage)
                assert b.js('return document.documentElement.scrollWidth<=innerWidth'), (width, stage)
            b.snapshot('guest-review-' + str(width))
        b.tap('Confirm destination'); b.wait(lambda: 'Destination confirmed' in b.body())
        b.tap('Back to meetups'); b.command('/refresh', {}); b.wait(lambda: 'Acceptance catch-up' in b.body())
        b.click('[aria-label="Open Acceptance catch-up"]')
        b.wait(lambda: 'Destination confirmed' in b.body())
        assert 'Dec 5' in b.body() and 'Confirm destination' not in b.body()
        b.tap('View venue map'); b.tap('Back to planning')
        b.tap('Mark completed'); b.wait(lambda: 'Save the memory' in b.body())
        b.snapshot('guest-completed')
        b.tap('Back to meetups'); b.tap('Plan a meetup'); b.fill('Meetup name', 'Unfinished draft'); b.tap('Save draft')
        b.wait(lambda: 'Who is joining?' in b.body()); b.stage('when'); date_value(b, 'date', '2026-12-10')
        b.tap('Back to meetups'); b.wait(lambda: 'Unsaved planning edits' in b.body()); b.tap('Discard unsaved edits & leave')
        b.click('[aria-label="Open Unfinished draft"]'); b.wait(lambda: 'Who is joining?' in b.body()); b.stage('when')
        assert b.js('return document.querySelector("input[type=date]").value') == '' 
        print('PASS guest: new/incomplete setup, schedule recovery, discovery-to-comparison, zero/unknown fares, per-person drafts, correction, review/cancel/confirm, four widths, failed save/retry, hard-reload resume, leave protection/discard, map/back and completion')
    finally:
        b.close()

def seed_session(browser, user_id):
    encoded = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
    token = encoded({'alg': 'HS256', 'typ': 'JWT'}) + '.' + encoded({'sub': user_id, 'aud': 'authenticated', 'exp': int(time.time()) + 3600}) + '.fixture'
    session = {'access_token': token, 'refresh_token': 'fixture-refresh', 'token_type': 'bearer', 'expires_at': int(time.time()) + 3600,
               'expires_in': 3600, 'user': {'id': user_id, 'email': 'fixture@example.invalid', 'aud': 'authenticated', 'role': 'authenticated', 'app_metadata': {}, 'user_metadata': {}}}
    browser.cdp('Page.addScriptToEvaluateOnNewDocument', {'source': 'localStorage.setItem("sb-127-auth-token",' + json.dumps(json.dumps(session)) + ');'})

def shared(args):
    fixture(args.fixture, '/fixture/reset', {})
    organizer = Browser(args.driver, args.artifacts, 'organizer')
    member = Browser(args.driver, args.artifacts, 'member')
    try:
        for b, uid in [(organizer, OWNER), (member, MEMBER)]:
            seed_session(b, uid); b.open(args.app)
            b.wait(lambda: 'Fixture shared meetup' in b.body())
            b.click('[aria-label="Open Fixture shared meetup"]')
            b.wait(lambda: 'Where should you meet?' in b.body())
            b.tap('Shortlist & vote (2)')
        assert '1 of 2 travel times available' in organizer.body()
        assert 'Member · needs a travel time, needs a fare' in organizer.body()
        assert 'Review destination' not in member.body()
        member.tap('See each person’s trip')
        assert not member.visible('[aria-label="Edit trip for Organizer"]')
        member.click('[aria-label="Edit trip for Member"]')
        member.fill('Travel time (minutes)', '60'); member.fill('One-way fare (₱, optional)', '100')
        member.tap('Save estimate'); member.wait(lambda: 'Your trip estimate' not in member.body())
        assert fixture(args.fixture, '/fixture/state')['ballot'][0]['estimates'][1]['user_id'] == MEMBER
        member.tap('Vote for this place')
        member.wait(lambda: 'Your vote · Fixture Gateway' in member.body())
        member.click('[aria-label="Move my vote here, Fixture Megamall"]')
        member.wait(lambda: 'Your vote · Fixture Megamall' in member.body())
        member.click('[aria-label="Remove my vote, Fixture Megamall"]')
        member.wait(lambda: 'Your vote ·' not in member.body())
        member.click('[aria-label="Vote for this place, Fixture Gateway"]')
        member.wait(lambda: 'Your vote · Fixture Gateway' in member.body())
        organizer.click('[aria-label="Refresh group"]')
        organizer.wait(lambda: '2 of 2 travel times available' in organizer.body())
        organizer.click('[aria-label="Review destination, Fixture Gateway"]')
        organizer.wait(lambda: 'Plan awaiting confirmation' in organizer.body())
        organizer.snapshot('shared-organizer-review')
        fixture(args.fixture, '/fixture/fail-next', {'rpc': 'finalize_shared_venue'})
        organizer.tap('Confirm destination')
        organizer.wait(lambda: 'Synthetic request failure' in organizer.body())
        assert fixture(args.fixture, '/fixture/state')['status'] == 'planning'
        organizer.wait(lambda: organizer.js('return [...document.querySelectorAll("[role=button]")].some(e=>e.innerText==="Confirm destination" && e.getAttribute("aria-disabled")!=="true")'))
        organizer.tap('Confirm destination'); organizer.wait(lambda: 'Destination confirmed' in organizer.body())
        member.click('[aria-label="Refresh group"]'); member.wait(lambda: 'Destination confirmed' in member.body())
        assert 'Confirm destination' not in member.body()
        member.snapshot('shared-member-confirmed')
        result = fixture(args.fixture, '/fixture/state')
        assert result['status'] == 'decided'
        assert all(call['user'] == OWNER for call in result['calls'] if call['rpc'] == 'finalize_shared_venue')
        print('PASS synthetic shared UI: missing estimates/limits, own-member editing, vote, organizer review, failed confirmation/retry and cross-session confirmed refresh; this does not verify hosted auth or database RLS')
    finally:
        organizer.close(); member.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['guest', 'shared'])
    parser.add_argument('--app', required=True)
    parser.add_argument('--driver', default='http://127.0.0.1:9515')
    parser.add_argument('--fixture', default='http://127.0.0.1:5180')
    parser.add_argument('--artifacts', default='.expo/redesign/phase45d')
    args = parser.parse_args()
    (guest if args.mode == 'guest' else shared)(args)
