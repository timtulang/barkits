"""serve the Expo export locally with the same meetup rewrite as Vercel."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
from urllib.parse import urlsplit


class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        if re.fullmatch(r'/meetups/[^/]+/?', urlsplit(self.path).path):
            self.path = '/index.html'
        return super().send_head()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    parser.add_argument('--port', type=int, default=5179)
    args = parser.parse_args()
    if not (args.directory / 'index.html').is_file():
        parser.error('The export directory must contain index.html.')
    with ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=args.directory)) as server:
        server.serve_forever()
