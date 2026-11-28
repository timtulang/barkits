"""exercise invite and memory flows with the local synthetic account fixture."""
import argparse
from planning_webdriver import Browser, fixture, seed_session

OWNER = '11111111-1111-4111-8111-111111111111'
CAPTION = 'Merienda and stories with the barkada.'


def see(browser, text):
    browser.wait(lambda: text in browser.body())


def refresh(browser):
    browser.click('[aria-label="Refresh group"]')
    browser.wait(lambda: not browser.visible('[aria-label="Refresh group"]:disabled'))


def fits(browser, width):
    browser.viewport(width)
    browser.wait(lambda: browser.js('return innerWidth === arguments[0]', width))
    assert browser.js('return document.documentElement.scrollWidth <= innerWidth'), width


def check_invites(args, owner, member):
    owner.viewport(1440)
    seed_session(owner, OWNER, args.app)
    owner.open(args.app)
    owner.click('[aria-label="Open Fixture shared meetup"]')
    owner.stage('who')
    see(owner, 'You’re the organizer')
    owner.tap('Create invite code')
    see(owner, 'Expires')
    old = fixture(args.fixture, '/fixture/state')['invite']
    assert old
    owner.snapshot('owner-invite-1440')
    owner.js('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>Promise.reject(Error("clipboard unavailable"))}})')
    owner.tap('Copy code')
    see(owner, 'copy it manually')
    owner.tap('Replace code')
    owner.wait(lambda: fixture(args.fixture, '/fixture/state')['invite'] not in (None, old))
    new = fixture(args.fixture, '/fixture/state')['invite']

    member.open(args.app)
    member.tap('Join with code')
    see(member, 'Sign in with Google to enter your meetup invite.')
    member.tap('Sign in with Google')
    see(member, 'Join a meetup')
    member.snapshot('join-after-sign-in-390')
    member.tap('Join meetup')
    see(member, 'Enter the 16-character code.')
    member.fill('Your display name', 'Mika')
    member.fill('Invite code', old)
    member.tap('Join meetup')
    see(member, 'Invalid or expired invite code.')
    member.fill('Invite code', '-'.join(new[i:i + 4] for i in range(0, len(new), 4)).lower())
    member.tap('Join meetup')
    see(member, 'You’re a group member')
    member.stage('who')
    see(member, 'Mika')
    assert not member.visible('[aria-label="Refresh group"]:disabled')
    assert 'Create invite code' not in member.body()
    refresh(owner)
    see(owner, 'Mika')


def check_memories(args, owner, member):
    owner.stage('where')
    owner.tap('Shortlist (2)')
    owner.click('[aria-label="Select destination, Fixture Megamall"]')
    owner.stage('review')
    see(owner, 'Confirming closes voting.')
    owner.tap('Confirm')
    see(owner, 'Destination confirmed')
    refresh(member)
    see(member, 'Destination confirmed')
    assert 'Get directions' in member.body() and 'Mark completed' not in member.body()
    member.snapshot('member-arrival-390')
    owner.tap('Mark completed')
    owner.tap('Cancel')
    assert fixture(args.fixture, '/fixture/state')['status'] == 'decided'
    owner.tap('Mark completed')
    owner.tap('Confirm completion')
    see(owner, 'Meetup memories')
    refresh(member)
    see(member, 'Meetup memories')
    assert 'Archive meetup' not in member.body()

    fits(member, 320)
    member.tap('Write a recap')
    see(member, 'Only you can read this recap')
    member.tap('Save privately')
    see(member, 'Add a caption before saving.')
    member.fill('Recap caption', CAPTION)
    member.snapshot('private-recap-editor-320')
    member.tap('Save privately')
    see(member, 'Recap saved privately.')
    see(member, CAPTION)
    refresh(owner)
    assert CAPTION not in owner.body()
    assert fixture(args.fixture, '/fixture/state')['recaps'][0]['visibility'] == 'private'

    fits(member, 390)
    member.tap('Edit recap')
    member.tap('Meetup members')
    see(member, 'Everyone in this meetup can read it.')
    fixture(args.fixture, '/fixture/fail-next', {'rpc': 'save_shared_recap'})
    member.tap('Publish to group')
    see(member, 'Synthetic request failure')
    assert 'Recap shared with meetup members.' not in member.body()
    assert member.js('return document.querySelector("textarea[aria-label=\'Recap caption\']").value') == CAPTION
    member.tap('Publish to group')
    see(member, 'Recap shared with meetup members.')
    see(member, CAPTION)
    member.click('[aria-label="4 stars"]:not(:disabled)')
    see(member, '4.0 / 5')
    refresh(owner)
    see(owner, CAPTION)
    assert 'Meetup members' in owner.body() and 'Edit recap' not in owner.body()
    assert '4.0 / 5' in owner.body()
    owner.snapshot('group-memory-1440')

    owner.tap('Archive meetup')
    owner.tap('Confirm archive')
    see(owner, 'Archived')
    owner.tap('Back to meetups')
    owner.tap('Past meetups')
    owner.click('[aria-label="Open Fixture shared meetup"]')
    see(owner, CAPTION)
    for width in (320, 390, 768, 1440):
        fits(owner, width)
    refresh(member)
    see(member, 'Archived')
    assert not member.visible('[aria-label="4 stars"]')
    assert 'Write a recap' not in member.body() and 'Edit recap' not in member.body()
    member.snapshot('member-archive-390')
    member.tap('Make private')
    see(member, 'Recap is now private.')
    see(member, 'Only you')
    refresh(owner)
    assert CAPTION not in owner.body()
    member.tap('Remove recap')
    member.tap('Delete recap')
    see(member, 'No recaps yet')
    member.tap('Remove my rating')
    see(member, 'No ratings yet.')
    assert not fixture(args.fixture, '/fixture/state')['recaps']
    assert not fixture(args.fixture, '/fixture/state')['ratings']
    member.click('[aria-label="Your account"]')
    see(member, 'Your on-device plans stay in this browser or app.')
    member.tap('Sign out of this device')
    see(member, 'Sign in')


def main(args):
    fixture(args.fixture, '/fixture/reset', {'invite_required': True})
    owner = Browser(args.driver, args.artifacts, 'lifecycle-owner')
    member = Browser(args.driver, args.artifacts, 'lifecycle-member')
    try:
        check_invites(args, owner, member)
        check_memories(args, owner, member)
        print('PASS synthetic lifecycle: sign-in handoff, invite replacement, member and organizer actions, recap audience, save retry, ratings and archive')
    finally:
        owner.close()
        member.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', required=True)
    parser.add_argument('--driver', default='http://127.0.0.1:9515')
    parser.add_argument('--fixture', default='http://127.0.0.1:5180')
    parser.add_argument('--artifacts', default='.expo/redesign/phase4')
    main(parser.parse_args())
