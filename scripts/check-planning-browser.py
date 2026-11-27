"""run local planning journeys against an exported app and an existing chromedriver."""
import argparse
import json
from planning_webdriver import Browser, fixture, seed_session

OWNER = '11111111-1111-4111-8111-111111111111'
MEMBER = '22222222-2222-4222-8222-222222222222'

def selected_value(browser, label):
    return browser.js('return [...document.querySelectorAll("input")].find(e=>e.getBoundingClientRect().width && e.getAttribute("aria-label")===arguments[0]).value', label)

def date_value(browser, kind, value):
    browser.js('const e=document.querySelector(arguments[0]);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,arguments[1]);e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));', 'input[type=' + kind + ']', value)

def ranking(browser, place):
    return browser.js('return document.querySelector("[aria-label^=\'Compare \']").getAttribute("aria-label")') == 'Compare ' + place

def reject_storage_writes(browser):
    browser.js('window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith("barkits.meetups"))throw Error("synthetic storage rejection");return window.originalSetItem.call(this,k,v)}')

def retry_storage(browser):
    browser.js('Storage.prototype.setItem=window.originalSetItem')
    browser.tap('Try again')

def guest(args):
    b = Browser(args.driver, args.artifacts, 'guest')
    try:
        motion = 'reduce' if args.reduced_motion else 'no-preference'
        b.cdp('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-reduced-motion', 'value': motion}]})
        b.open(args.app)
        b.wait(lambda: 'Plan a meetup' in b.body())
        b.snapshot('guest-home-first-390')
        b.click('[aria-label="Open Saturday catch-up"]')
        b.wait(lambda: b.js('return location.pathname') == '/meetups/demo')
        b.command('/back', {})
        b.wait(lambda: b.js('return location.pathname') == '/' and 'Your meetups' in b.body())
        b.command('/forward', {})
        b.wait(lambda: b.js('return location.pathname') == '/meetups/demo')
        b.command('/refresh', {}); b.tap('Places')
        assert b.visible('[aria-label^="View details for "]') and not b.visible('[aria-label="Suggested places map"]')
        b.tap('Compare')
        for mode, place in [('Balanced', 'Gateway Mall'), ('Fairest', 'Gateway Mall'), ('Fastest', 'SM Megamall'), ('Cheapest', 'SM Megamall')]:
            b.tap(mode)
            assert ranking(b, place), mode
        assert 'Demo estimates' in b.body() and 'Travel times incomplete' in b.body()
        b.viewport(320)
        b.wait(lambda: b.visible('[aria-label="Rank by"]'))
        b.select('Rank by', 'Fairest')
        assert ranking(b, 'Gateway Mall')
        b.select('Rank by', 'Cheapest')
        assert ranking(b, 'SM Megamall')
        assert b.js('''const top=document.querySelector('[aria-label="Compare SM Megamall"]').getBoundingClientRect().top;
          const footer=document.querySelector('[aria-label="Planning navigation"]').getBoundingClientRect().top;
          return top + 48 < footer;''')
        b.snapshot('guest-compare-320')
        b.viewport(1440)
        b.wait(lambda: b.visible('[aria-label="Suggested places map"]'))
        assert ranking(b, 'SM Megamall')
        b.snapshot('guest-compare-1440')
        b.viewport(390)
        b.tap('Back to meetups')
        b.tap('Plan a meetup'); b.tap('Create meetup & add friends')
        assert 'Enter a meetup name' in b.body()
        b.fill('Meetup name', 'Acceptance catch-up'); b.tap('Create meetup & add friends')
        b.wait(lambda: 'Who is joining?' in b.body())
        meetup_path = b.js('return location.pathname')
        b.wait(lambda: b.js('return JSON.parse(localStorage.getItem("barkits.meetups.v1")).at(-1).id') == meetup_path.split('/')[-1])
        b.command('/refresh', {}); b.wait(lambda: 'Who is joining?' in b.body())
        b.watch_motion('[aria-live="polite"]:has(> [role="heading"])')
        b.stage('where'); b.wait(lambda: 'Add everyone’s starting point' in b.body())
        assert b.motion_seen() != args.reduced_motion
        b.stage('who')
        for name, origin in [('Alex', 'Quezon City'), ('Bo', 'Quezon City')]:
            b.tap('Add friend'); b.fill('Name', name); b.fill('Starting place', origin)
            b.wait(lambda: bool(b.visible('[role=option]')))
            e = b.visible('input[aria-label="Starting place"]')
            b.command('/element/' + e['element-6066-11e4-a52e-4f735466cecf'] + '/value', {'text': '\ue015\ue007'})
            b.tap('Add friend')
        b.wait(lambda: '2 of 2 starting points on the map · Ready to find a place' in b.body())
        b.click('[aria-label="Edit Alex"]')
        b.fill('Maximum fare (₱)', '50')
        reject_storage_writes(b)
        b.tap('Save changes'); b.wait(lambda: 'Changes are not saved' in b.body())
        retry_storage(b)
        b.wait(lambda: 'Plan saved on this device' in b.body())
        b.tap('Next'); date_value(b, 'date', '2026-12-05')
        b.tap('Next'); assert 'Choose a time' in b.body()
        b.stage('who'); b.stage('when')
        assert b.js('return document.querySelector("input[type=date]").value') == '2026-12-05'
        date_value(b, 'time', '15:00'); b.tap('Next')
        b.wait(lambda: 'Where should you meet?' in b.body())
        b.wait(lambda: b.js('return document.querySelectorAll(".friend-pin").length===2'))
        assert b.js('''const [a,b]=[...document.querySelectorAll('.friend-pin')].map(e=>e.getBoundingClientRect());
          return a.right<=b.left || b.right<=a.left || a.bottom<=b.top || b.bottom<=a.top''')
        assert b.js('''const map=document.querySelector('[aria-label="Suggested places map"]').getBoundingClientRect();
          const expand=document.querySelector('.map-expand').getBoundingClientRect();
          return map.height > 300 && map.right-expand.right===10 && map.bottom-expand.bottom===10''')
        b.snapshot('guest-map-390')
        b.click('.map-expand'); b.wait(lambda: 'Back to planning' in b.body())
        b.wait(lambda: b.js('return document.querySelectorAll(".friend-pin").length===2'))
        b.tap('Back to planning')
        assert b.visible('[aria-label="Where views"]')
        b.click('[aria-label^="Open place 1:"]')
        place = b.js('return document.querySelector("[aria-label^=\'Select destination, \']").getAttribute("aria-label").slice(20)')
        b.click('[aria-label^="Select destination,"]'); b.tap('Review')
        b.wait(lambda: 'Check the group’s trip estimates and limits.' in b.body())
        assert b.js('return document.querySelector(\'[aria-label="Confirm destination"]\').disabled')
        b.tap('Change place'); b.click('[aria-label^="Open place 1:"]')
        b.tap('Trip estimates')
        assert 'Time incomplete' in b.body() and 'Fare unavailable' in b.body()
        b.click('[aria-label="Edit trip for Alex"]')
        b.fill('One-way travel time (minutes)', '-5'); b.fill('Travel fare (₱, optional)', '4.333')
        b.tap('Save trip details')
        assert 'Enter zero or more minutes.' in b.body() and 'Enter a peso fare with up to two decimal places.' in b.body()
        b.fill('One-way travel time (minutes)', '20'); b.fill('Travel fare (₱, optional)', '0')
        b.command('/back', {}); b.wait(lambda: 'Unsaved planning edits' in b.body()); b.tap('Keep planning')
        b.wait(lambda: b.js('return location.pathname') == meetup_path)
        b.tap('Back to meetups'); b.wait(lambda: 'Unsaved planning edits' in b.body()); b.tap('Keep planning')
        b.wait(lambda: selected_value(b, 'One-way travel time (minutes)') == '20')
        b.click('[aria-label="Trip for Bo"]'); b.fill('One-way travel time (minutes)', '40')
        b.click('[aria-label="Trip for Alex"]'); b.wait(lambda: selected_value(b, 'One-way travel time (minutes)') == '20')
        reject_storage_writes(b)
        b.tap('Save trip details'); b.wait(lambda: 'The trip changes are still open.' in b.body())
        assert 'Trip saved on this device.' not in b.body()
        b.js('Storage.prototype.setItem=window.originalSetItem')
        b.tap('Try saving the trip again')
        b.wait(lambda: 'Trip saved on this device.' in b.body())
        assert b.js('return JSON.stringify(JSON.parse(localStorage.getItem("barkits.meetups.v1")).at(-1).manualFares).includes(":0")')
        b.tap('Compare ride fares'); b.fill('Angkas app price (₱)', '40'); b.fill('Grab app price (₱)', '30')
        b.tap('Use Grab fare'); assert 'Selected fare · Grab' in b.body()
        b.fill('Travel fare (₱, optional)', '0'); assert 'Selected fare · Grab' not in b.body()
        b.tap('Save trip details'); b.tap('LRT-1 fares'); assert 'Boarding station' in b.body()
        b.js('window.realOpen=window.open;window.open=(url)=>{window.lastDirections=url;return {}}')
        b.tap('Transit directions'); assert 'origin=' in b.js('return window.lastDirections')
        b.js('window.open=window.realOpen')
        b.click('[aria-label="Trip for Bo"]'); b.fill('Travel fare (₱, optional)', '50'); b.tap('Save trip details')
        b.tap('Map'); b.tap('Compare'); b.tap('Cheapest')
        assert ranking(b, place)
        result = '[aria-label=' + json.dumps('Compare ' + place) + ']'
        b.click(result); b.tap('Trip estimates'); b.click('[aria-label="Edit trip for Alex"]')
        b.tap('Back to comparison')
        assert ranking(b, place) and 'Lowest combined fare' in b.body()
        b.click(result)
        b.click('[aria-label="Vote as Alex"]')
        assert b.js('return document.querySelector(\'[aria-label="Vote as Alex"]\').getAttribute("aria-pressed")==="true"')
        b.tap('Vote')
        b.click('[aria-label^="Select destination,"]')
        b.wait(lambda: 'Selected · ' in b.body())
        b.tap('Review'); b.wait(lambda: 'Confirming closes voting.' in b.body())
        assert b.js('return document.body.innerText.indexOf(arguments[0]) < document.body.innerText.indexOf("Meetup details")', place)
        b.tap('Back'); b.wait(lambda: 'Where should you meet?' in b.body())
        assert 'Destination confirmed' not in b.body()
        b.tap('Review'); b.wait(lambda: 'Confirming closes voting.' in b.body())
        for width in (320, 390, 768, 1440):
            b.viewport(width)
            for stage in ('who', 'when', 'where', 'review'):
                b.stage(stage)
                assert b.js('return document.documentElement.scrollWidth<=innerWidth'), (width, stage)
                assert b.js('''const progress=document.querySelector('[aria-label="Planning stages"]');
                  const steps=[...progress.querySelectorAll('button')];
                  const labels=['Who','When','Where','Review'];
                  return steps.length===labels.length && progress.querySelectorAll('[aria-current="step"]').length===1
                    && steps.every((step,index)=>step.innerText.trim().endsWith(labels[index]) && step.getBoundingClientRect().height>=48);''')
                assert b.js('''const nav=document.querySelector('[aria-label="Planning navigation"]');
                  const [left,right]=[...nav.querySelectorAll('button')].map(e=>e.getBoundingClientRect());
                  return nav.getBoundingClientRect().bottom===innerHeight && (!right ||
                    (left.x<right.x && left.y===right.y && left.width===right.width && left.height===right.height))'''), (width, stage)
            b.snapshot('guest-review-' + str(width))
        b.watch_motion('[aria-label^="4. Review."] > :first-child', scale=True)
        reject_storage_writes(b)
        b.tap('Confirm'); b.wait(lambda: 'Changes are not saved' in b.body() and 'Confirmation pending save' in b.body())
        assert 'Destination confirmed' not in b.body()
        assert not b.motion_seen()
        retry_storage(b)
        b.wait(lambda: 'Destination confirmed' in b.body())
        assert b.motion_seen() != args.reduced_motion
        b.snapshot('guest-confirmed-1440')
        b.js('window.realOpen=window.open;window.open=(url)=>{window.lastDirections=url;return {}}')
        b.tap('Get directions')
        assert b.js('''const meetup=JSON.parse(localStorage.getItem("barkits.meetups.v1")).at(-1);
          const venue=meetup.customVenues.find(item=>item.id===meetup.venue);
          const link=new URL(window.lastDirections);
          return link.pathname==="/maps/dir/" && link.searchParams.get("destination")===venue.point.join(",");''')
        b.js('window.open=window.realOpen')
        b.tap('Back to meetups'); b.command('/refresh', {}); b.wait(lambda: 'Acceptance catch-up' in b.body())
        assert b.js('return document.querySelector("[aria-label^=\'Open \']").getAttribute("aria-label") === "Open Acceptance catch-up"')
        b.viewport(390)
        b.snapshot('guest-home-returning-390')
        b.click('[aria-label="Open Acceptance catch-up"]')
        b.wait(lambda: 'Destination confirmed' in b.body())
        assert 'Dec 5' in b.body() and not b.visible('[aria-label="Confirm destination"]')
        b.snapshot('guest-confirmed-390')
        b.tap('View venue map'); b.tap('Back to planning')
        b.tap('Mark completed'); b.tap('Cancel')
        assert 'Destination confirmed' in b.body()
        b.watch_motion('[style*="translateY"]:has(img[src*="kits"])')
        b.tap('Mark completed'); b.tap('Confirm completion')
        b.wait(lambda: 'Save the memory' in b.body() and 'Saving changes' not in b.body())
        if args.reduced_motion:
            assert not b.motion_seen()
        else:
            b.wait(b.motion_seen)
            b.finish_motion()
        b.fill('Recap caption', 'A local memory in Quezon City.')
        b.tap('Back to meetups'); b.wait(lambda: 'Unsaved planning edits' in b.body()); b.tap('Keep planning')
        b.watch_motion('[style*="translateY"]:has(img[src*="kits"])')
        reject_storage_writes(b)
        b.tap('Save recap'); b.wait(lambda: 'Barkits kept your changes open.' in b.body())
        assert 'Recap saved on this device.' not in b.body()
        b.snapshot('guest-recap-retry-390')
        retry_storage(b)
        b.wait(lambda: 'Recap saved on this device.' in b.body())
        b.click('[aria-label="4 stars"]:not(:disabled)')
        b.wait(lambda: '4.0 / 5' in b.body() and 'Saving changes' not in b.body())
        assert not b.motion_seen()
        b.snapshot('guest-completed')
        b.tap('Back to meetups'); b.tap('Past meetups')
        b.watch_motion('[style*="translateY"]:has(img[src*="kits"])')
        b.click('[aria-label="Open Acceptance catch-up"]')
        b.wait(lambda: 'Save the memory' in b.body())
        b.finish_motion()
        assert not b.motion_seen() and 'Recap saved on this device.' not in b.body()
        b.tap('Archive meetup'); b.tap('Confirm archive')
        b.wait(lambda: 'Archived' in b.body() and 'Saving changes' not in b.body())
        b.tap('Back to meetups'); b.tap('Past meetups')
        b.click('[aria-label="Open Acceptance catch-up"]')
        assert 'A local memory in Quezon City.' in b.body() and '4.0 / 5' in b.body()
        assert not b.visible('[aria-label="Recap caption"]')
        b.snapshot('guest-archived-390')
        b.tap('Back to meetups'); b.tap('Active plans')
        b.tap('Plan a meetup'); b.fill('Meetup name', 'Unfinished draft'); b.tap('Save draft')
        b.wait(lambda: 'Who is joining?' in b.body()); b.stage('when'); date_value(b, 'date', '2026-12-10')
        b.tap('Back to meetups'); b.wait(lambda: 'Unsaved planning edits' in b.body()); b.tap('Discard unsaved edits & leave')
        b.click('[aria-label="Open Unfinished draft"]'); b.wait(lambda: 'Who is joining?' in b.body()); b.stage('when')
        assert b.js('return document.querySelector("input[type=date]").value') == ''
        print(f'PASS guest ({motion} motion): setup, recovery, trip validation, directions, four widths, milestones, recap retry and archive')
    finally:
        b.close()

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
            b.tap('Shortlist (2)')
        organizer.tap('Trip estimates')
        assert '1 of 2 travel times available' in organizer.body()
        assert 'Member · needs a travel time, needs a fare' in organizer.body()
        assert not member.visible('[aria-label^="Select destination,"]')
        member.tap('Trip estimates')
        assert not member.visible('[aria-label="Edit trip for Organizer"]')
        member.click('[aria-label="Edit trip for Member"]')
        member.fill('Travel time (minutes)', '60'); member.fill('One-way fare (₱, optional)', '100')
        member.tap('Save estimate'); member.wait(lambda: 'Your trip estimate' not in member.body())
        assert fixture(args.fixture, '/fixture/state')['ballot'][0]['estimates'][1]['user_id'] == MEMBER
        member.tap('Vote')
        member.wait(lambda: 'Your vote · Fixture Gateway' in member.body())
        member.click('[aria-label="Move my vote here, Fixture Megamall"]')
        member.wait(lambda: 'Your vote · Fixture Megamall' in member.body())
        member.click('[aria-label="Remove my vote, Fixture Megamall"]')
        member.wait(lambda: 'Your vote ·' not in member.body())
        member.click('[aria-label="Vote for this place, Fixture Gateway"]')
        member.wait(lambda: 'Your vote · Fixture Gateway' in member.body())
        organizer.click('[aria-label="Refresh group"]')
        organizer.wait(lambda: '2 of 2 travel times available' in organizer.body())
        organizer.click('[aria-label="Select destination, Fixture Gateway"]')
        organizer.tap('Review')
        organizer.wait(lambda: 'Confirming closes voting.' in organizer.body())
        organizer.snapshot('shared-organizer-review')
        fixture(args.fixture, '/fixture/fail-next', {'rpc': 'finalize_shared_venue'})
        organizer.tap('Confirm')
        organizer.wait(lambda: 'Synthetic request failure' in organizer.body())
        assert fixture(args.fixture, '/fixture/state')['status'] == 'planning'
        organizer.wait(lambda: organizer.js('return [...document.querySelectorAll("[role=button]")].some(e=>e.innerText==="Confirm" && e.getAttribute("aria-disabled")!=="true")'))
        organizer.tap('Confirm'); organizer.wait(lambda: 'Destination confirmed' in organizer.body())
        member.click('[aria-label="Refresh group"]'); member.wait(lambda: 'Destination confirmed' in member.body())
        assert not member.visible('[aria-label="Confirm destination"]')
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
    parser.add_argument('--reduced-motion', action='store_true')
    args = parser.parse_args()
    (guest if args.mode == 'guest' else shared)(args)
