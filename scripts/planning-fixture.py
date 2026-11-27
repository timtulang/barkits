"""local-only synthetic Barkits API responses for planning browser acceptance."""
import argparse
import json
from functools import partial
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

OWNER = '11111111-1111-4111-8111-111111111111'
MEMBER = '22222222-2222-4222-8222-222222222222'
GROUP = '33333333-3333-4333-8333-333333333333'
STAMP = '2026-11-26T00:00:00Z'

actions = {
    'invite': ('issue_meetup_code', ('target',)),
    'join': ('join_shared_meetup', ('invite_code', 'member_name')),
    'finish': ('finish_shared_meetup', ('target', 'next_status')),
    'recap': ('save_shared_recap', ('target', 'post_id', 'expected_revision', 'heading', 'body', 'audience')),
    'rating': ('rate_shared_meetup', ('target', 'stars_given')),
    'shortlist': ('shortlist_shared_venue', ('target', 'place_key', 'place_name', 'lat', 'lng')),
    'vote': ('set_shared_vote', ('target', 'candidate')),
    'estimate': ('save_shared_fare_estimate', ('target', 'candidate', 'trip_minutes', 'fare', 'provider')),
    'finalize': ('finalize_shared_venue', ('target', 'candidate')),
}

def initial():
    return {'status': 'planning', 'chosen': None, 'fail': '', 'calls': [], 'ballot': [
        {'venue_id': 'venue-a', 'place': {'name': 'Fixture Gateway', 'latitude': 14.621, 'longitude': 121.053, 'catalog_key': 'cub'},
         'votes': [], 'estimates': [{'user_id': OWNER, 'minutes': 30, 'fare_pesos': 50, 'source': 'User-entered', 'calculated_at': STAMP}]},
        {'venue_id': 'venue-b', 'place': {'name': 'Fixture Megamall', 'latitude': 14.585, 'longitude': 121.057, 'catalog_key': 'meg'},
         'votes': [], 'estimates': [{'user_id': OWNER, 'minutes': 35, 'fare_pesos': 60, 'source': 'User-entered', 'calculated_at': STAMP},
                                    {'user_id': MEMBER, 'minutes': 10, 'fare_pesos': 0, 'source': 'User-entered Grab', 'calculated_at': STAMP}]}],
            'joined': True, 'member_name': 'Member', 'issued': 0, 'invite': None, 'recaps': [], 'ratings': []}

state = initial()

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def send(self, value=None, status=200):
        payload = json.dumps(value).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(payload)

    def user(self):
        for entry in self.headers.get('Cookie', '').split(';'):
            name, _, value = entry.strip().partition('=')
            if name == 'barkits_session' and value in (OWNER, MEMBER):
                return value
        return None

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/fixture/state':
            return self.send(state)
        if path == '/api/auth/google/start':
            self.send_response(303)
            self.send_header('Set-Cookie', f'barkits_session={MEMBER}; Path=/; HttpOnly; SameSite=Lax')
            self.send_header('Location', '/')
            self.end_headers()
            return
        uid = self.user()
        if path == '/api/session':
            return self.send({'user': {'id': uid, 'display_name': 'Fixture account'} if uid else None})
        if path in ('/api/shared', '/api/shared/' + GROUP):
            if not uid:
                return self.send({'error': 'Sign in again to continue.'}, 401)
            joined = uid == OWNER or state['joined']
            summary = {'id': GROUP, 'owner_id': OWNER, 'name': 'Fixture shared meetup', 'activity': 'Coffee',
                       'description': 'Synthetic browser acceptance data', 'starts_at': None, 'status': state['status']}
            if path == '/api/shared':
                return self.send([summary] if joined else [])
            if not joined:
                return self.send({'error': 'Couldn’t find this shared meetup.'}, 404)
            roster = [{'user_id': OWNER, 'display_name': 'Organizer'}]
            if state['joined']:
                roster.append({'user_id': MEMBER, 'display_name': state['member_name']})
            finished = state['status'] in ('completed', 'archived')
            origins = [{'user_id': member, 'label': label, 'latitude': None, 'longitude': None, 'mode': 'Public transport',
                        'max_fare_pesos': 100 if member == MEMBER else None, 'max_minutes': 60 if member == MEMBER else None}
                       for member, label in [(OWNER, 'Caloocan'), (MEMBER, 'Quezon City')] if member == OWNER or state['joined']]
            return self.send({'summary': {**summary, 'chosen': state['chosen'], 'ballot': state['ballot']}, 'roster': roster,
                              'origins': [] if finished else origins, 'memories': None if not finished else {
                                  'recaps': [post for post in state['recaps'] if post['author_id'] == uid or post['visibility'] == 'group'],
                                  'ratings': state['ratings']}})
        if re.fullmatch(r'/meetups/[^/]+/?', path):
            self.path = '/index.html'
        super().do_GET()

    def do_POST(self):
        global state
        path = urlparse(self.path).path
        data = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))) or b'{}')
        if path == '/fixture/reset':
            state = initial()
            state['joined'] = not data.get('invite_required')
            return self.send()
        if path == '/fixture/fail-next':
            state['fail'] = data['rpc']
            return self.send()
        if path == '/api/session/logout':
            self.send_response(200)
            self.send_header('Set-Cookie', 'barkits_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"user": null}')
            return
        action = actions.get(path.removeprefix('/api/shared/'))
        if not action:
            return self.send({'error': 'Unsupported fixture action'}, 404)
        uid = self.user()
        if not uid:
            return self.send({'error': 'Sign in again to continue.'}, 401)
        rpc, fields = action
        data = dict(zip(fields, data, strict=True))
        state['calls'].append({'rpc': rpc, 'user': uid})
        if state['fail'] == rpc:
            state['fail'] = ''
            return self.send({'error': 'Synthetic request failure; retry this action.'}, 503)
        if rpc == 'issue_meetup_code' and uid == OWNER and state['status'] == 'planning':
            state['issued'] += 1
            state['invite'] = f'BABC1234{state["issued"]:08X}'
            return self.send(state['invite'])
        if rpc == 'join_shared_meetup':
            if data['invite_code'] != state['invite'] or state['status'] != 'planning':
                return self.send({'error': 'Invalid or expired invite code.'}, 400)
            state['joined'] = True
            state['member_name'] = data['member_name']
            state['invite'] = None
            return self.send(GROUP)
        if rpc == 'finish_shared_meetup':
            expected = {'decided': 'completed', 'completed': 'archived'}.get(state['status'])
            if uid != OWNER or data['next_status'] != expected:
                return self.send({'error': 'Only the organizer can advance this meetup.'}, 403)
            state['status'] = expected
            return self.send()
        if rpc == 'save_shared_recap':
            return self.save_recap(uid, data)
        if rpc == 'rate_shared_meetup':
            stars = data['stars_given']
            if state['status'] != 'completed' and not (state['status'] == 'archived' and stars is None):
                return self.send({'error': 'Ratings are open on completed meetups.'}, 400)
            state['ratings'] = [row for row in state['ratings'] if row['user_id'] != uid]
            if stars is not None:
                state['ratings'].append({'user_id': uid, 'stars': stars})
            return self.send()
        if rpc == 'shortlist_shared_venue':
            if not any(c['place']['catalog_key'] == data['place_key'] for c in state['ballot']):
                state['ballot'].append({'venue_id': data['place_key'], 'place': {'catalog_key': data['place_key'], 'name': data['place_name'],
                    'latitude': data['lat'], 'longitude': data['lng']}, 'votes': [], 'estimates': []})
            return self.send()
        candidate = next((c for c in state['ballot'] if c['venue_id'] == data.get('candidate')), None)
        if rpc == 'set_shared_vote':
            for item in state['ballot']:
                item['votes'] = [v for v in item['votes'] if v['user_id'] != uid]
            if candidate:
                candidate['votes'].append({'user_id': uid})
            return self.send()
        if rpc == 'save_shared_fare_estimate' and candidate:
            candidate['estimates'] = [e for e in candidate['estimates'] if e['user_id'] != uid]
            candidate['estimates'].append({'user_id': uid, 'minutes': data['trip_minutes'], 'fare_pesos': data['fare'],
                'source': 'User-entered' + (' ' + data['provider'] if data.get('provider') else ''), 'calculated_at': STAMP})
            return self.send()
        if rpc == 'finalize_shared_venue' and candidate:
            if uid != OWNER:
                return self.send({'error': 'Only the organizer can confirm.'}, 403)
            member = next((e for e in candidate['estimates'] if e['user_id'] == MEMBER), None)
            if not member or member['minutes'] is None or member['minutes'] > 60 or member['fare_pesos'] is None or member['fare_pesos'] > 100:
                return self.send({'error': 'Member travel limit needs attention.'}, 400)
            state['chosen'] = candidate['place']
            state['status'] = 'decided'
            return self.send()
        self.send({'error': 'Unsupported fixture RPC: ' + rpc}, 404)

    def save_recap(self, uid, data):
        post = next((item for item in state['recaps'] if item['id'] == data['post_id']), None)
        audience = data['audience']
        if post and post['author_id'] != uid:
            return self.send({'error': 'Only the author can change this recap.'}, 403)
        if state['status'] != 'completed' and not (state['status'] == 'archived' and post and audience in ('private', 'delete')):
            return self.send({'error': 'This meetup is not open for recap edits.'}, 400)
        revision = post['revision'] if post else 0
        if data['expected_revision'] != revision:
            return self.send({'error': 'Refresh and reopen this recap.'}, 409)
        if audience == 'delete':
            state['recaps'].remove(post)
        else:
            updated = {'id': data['post_id'], 'author_id': uid, 'title': data['heading'] or None,
                       'caption': data['body'], 'visibility': audience, 'revision': revision + 1, 'created_at': STAMP}
            if post:
                post.update(updated)
            else:
                state['recaps'].insert(0, updated)
        return self.send()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory')
    parser.add_argument('--port', type=int, default=5180)
    args = parser.parse_args()
    print('Synthetic planning fixture API on localhost:' + str(args.port), flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=args.directory)).serve_forever()
