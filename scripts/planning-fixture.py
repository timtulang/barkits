"""local-only synthetic supabase responses for planning browser acceptance."""
import argparse
import base64
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

OWNER = '11111111-1111-4111-8111-111111111111'
MEMBER = '22222222-2222-4222-8222-222222222222'
GROUP = '33333333-3333-4333-8333-333333333333'
STAMP = '2026-11-26T00:00:00Z'

def initial():
    return {'status': 'planning', 'chosen': None, 'fail': '', 'calls': [], 'ballot': [
        {'venue_id': 'venue-a', 'place': {'name': 'Fixture Gateway', 'latitude': 14.621, 'longitude': 121.053, 'catalog_key': 'cub'},
         'votes': [], 'estimates': [{'user_id': OWNER, 'minutes': 30, 'fare_pesos': 50, 'source': 'User-entered', 'calculated_at': STAMP}]},
        {'venue_id': 'venue-b', 'place': {'name': 'Fixture Megamall', 'latitude': 14.585, 'longitude': 121.057, 'catalog_key': 'meg'},
         'votes': [], 'estimates': [{'user_id': OWNER, 'minutes': 35, 'fare_pesos': 60, 'source': 'User-entered', 'calculated_at': STAMP},
                                    {'user_id': MEMBER, 'minutes': 10, 'fare_pesos': 0, 'source': 'User-entered Grab', 'calculated_at': STAMP}]}]}

state = initial()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def send(self, value=None, status=200):
        payload = json.dumps(value).encode() if value is not None else b''
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(payload)

    def user(self):
        token = self.headers.get('Authorization', '').removeprefix('Bearer ')
        return json.loads(base64.urlsafe_b64decode(token.split('.')[1] + '==='))['sub']

    def do_OPTIONS(self):
        self.send()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/fixture/state':
            return self.send(state)
        if path == '/auth/v1/user':
            return self.send({'id': self.user(), 'aud': 'authenticated', 'role': 'authenticated', 'email': 'fixture@example.invalid'})
        if path == '/rest/v1/meetups':
            summary = {'id': GROUP, 'owner_id': OWNER, 'name': 'Fixture shared meetup', 'activity': 'Coffee', 'description': 'Synthetic browser acceptance data',
                       'starts_at': None, 'status': state['status'], 'chosen': state['chosen'], 'ballot': state['ballot']}
            return self.send(summary if 'id=eq.' in self.path else [summary])
        if path == '/rest/v1/meetup_members':
            return self.send([{'user_id': OWNER, 'display_name': 'Organizer'}, {'user_id': MEMBER, 'display_name': 'Member'}])
        if path == '/rest/v1/meetup_origins':
            return self.send([{'user_id': uid, 'label': label, 'latitude': None, 'longitude': None, 'mode': 'Public transport',
                               'max_fare_pesos': 100 if uid == MEMBER else None, 'max_minutes': 60 if uid == MEMBER else None}
                              for uid, label in [(OWNER, 'Caloocan'), (MEMBER, 'Quezon City')]])
        self.send({'message': 'Unsupported fixture path: ' + path}, 404)

    def do_POST(self):
        global state
        path = urlparse(self.path).path
        data = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))) or b'{}')
        if path == '/fixture/reset':
            state = initial()
            return self.send()
        if path == '/fixture/fail-next':
            state['fail'] = data['rpc']
            return self.send()
        rpc = path.removeprefix('/rest/v1/rpc/')
        if path == '/auth/v1/logout':
            return self.send()
        uid = self.user()
        state['calls'].append({'rpc': rpc, 'user': uid})
        if state['fail'] == rpc:
            state['fail'] = ''
            return self.send({'message': 'Synthetic request failure; retry this action.'}, 503)
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
                return self.send({'message': 'Only the organizer can confirm.'}, 403)
            member = next((e for e in candidate['estimates'] if e['user_id'] == MEMBER), None)
            if not member or member['minutes'] is None or member['minutes'] > 60 or member['fare_pesos'] is None or member['fare_pesos'] > 100:
                return self.send({'message': 'Member travel limit needs attention.'}, 400)
            state['chosen'] = candidate['place']
            state['status'] = 'decided'
            return self.send()
        self.send({'message': 'Unsupported fixture RPC: ' + rpc}, 404)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=5180)
    args = parser.parse_args()
    print('Synthetic planning fixture API on localhost:' + str(args.port), flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
