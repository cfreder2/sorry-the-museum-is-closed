# A threaded static server for headless runs (python's plain http.server drops module requests and the boot hangs).
#   python3 tools/dev/serve.py <port> [root]
import http.server, sys, os
class S(http.server.ThreadingHTTPServer): request_queue_size = 256; daemon_threads = True
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
if len(sys.argv) > 2: os.chdir(sys.argv[2])
S(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
