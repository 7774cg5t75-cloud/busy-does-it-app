"""Bounded, separately observable native compilation and UI execution.

Only disposable simulator products; no signing, hosted access or retries.
"""
from contextlib import contextmanager
import json
import os
from pathlib import Path
import signal
import secrets
import subprocess
import sys
import time


def command(stage, work, temp, udid=None):
    workspaces = list((work / 'ios').glob('*.xcworkspace'))
    if len(workspaces) != 1:
        raise ValueError('Expected exactly one generated application workspace')
    base = ['xcodebuild', '-workspace', str(workspaces[0]), '-scheme', 'BusyCapture',
            '-configuration', 'Release', '-derivedDataPath', str(temp / 'busy-derived'),
            'CODE_SIGNING_ALLOWED=NO', 'ONLY_ACTIVE_ARCH=YES', 'ARCHS=x86_64',
            'GCC_OPTIMIZATION_LEVEL=0', 'SWIFT_OPTIMIZATION_LEVEL=-Onone',
            '-parallel-testing-enabled', 'NO']
    if stage == 'build':
        return base + ['-destination', 'generic/platform=iOS Simulator', '-jobs', '3',
                       '-showBuildTimingSummary', 'build-for-testing']
    if stage != 'test' or not udid:
        raise ValueError('Expected build or test with a simulator identity')
    return base + ['-destination', 'platform=iOS Simulator,id=' + udid,
                   '-destination-timeout', '30', '-maximum-concurrent-test-simulator-destinations', '1',
                   '-test-timeouts-enabled', 'YES', '-default-test-execution-time-allowance', '180',
                   '-maximum-test-execution-time-allowance', '180',
                   '-only-testing:BusyCaptureUITests/CaptureTests/testMidnightHome',
                   '-resultBundlePath', str(temp / 'busy-home.xcresult'), 'test-without-building']


@contextmanager
def receiver_ready():
    """Own the receiver, expose startup errors, and probe only literal loopback."""
    import urllib.request
    nonce = secrets.token_hex(16)
    receiver_environment = dict(os.environ, BUSY_CAPTURE_RECEIVER_NONCE=nonce)
    receiver = subprocess.Popen([sys.executable, str(Path(__file__).with_name('receiver.py'))],
                                start_new_session=True, env=receiver_environment)
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    deadline = time.monotonic() + 15
    last_error = 'No response'
    ready = False
    try:
        while time.monotonic() < deadline:
            if receiver.poll() is not None:
                raise RuntimeError(f'Apple screenshot receiver exited during startup: {receiver.returncode}')
            try:
                with opener.open('http://127.0.0.1:8765/health', timeout=1) as response:
                    if response.status == 200 and response.read(128) == ('busy-native-capture-receiver-v1:' + nonce).encode():
                        ready = True
                    else:
                        last_error = 'Unexpected local receiver identity'
            except OSError as error:
                last_error = type(error).__name__
            if ready:
                break
            time.sleep(0.25)
        if not ready:
            raise RuntimeError('Apple screenshot receiver not ready within15s: ' + last_error)
        print('NATIVE receiver ready: fixed loopback health verified', flush=True)
        yield
    finally:
        if receiver.poll() is None:
            try:
                os.killpg(receiver.pid, signal.SIGTERM)
                receiver.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(receiver.pid, signal.SIGKILL)
                receiver.wait()
            except ProcessLookupError:
                receiver.wait()


def main():
    stage = sys.argv[1]
    if stage == 'receiver-check':
        with receiver_ready():
            print('PASS local receiver preflight; no simulator, screenshot or external request', flush=True)
        return 0
    if stage == 'test':
        with receiver_ready():
            return execute(stage)
    return execute(stage)


def execute(stage):
    work, temp = Path(os.environ['CAPTURE_WORK']), Path(os.environ['RUNNER_TEMP'])
    args = command(stage, work, temp, os.environ.get('CAPTURE_UDID'))
    limit = 24 * 60 if stage == 'build' else 4 * 60
    print(f'NATIVE stage={stage} deadline={limit}s; simulator Release with embedded JS, '
          'single x86_64 architecture, optimisations disabled; no Metro server', flush=True)
    print('Command:', ' '.join(args), flush=True)
    start = time.monotonic()
    process = subprocess.Popen(args, start_new_session=True)
    timed_out = False
    while process.poll() is None:
        elapsed = time.monotonic() - start
        if elapsed >= limit:
            timed_out = True
            print(f'::error::NATIVE {stage} exceeded {limit}s; terminating its process group', flush=True)
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
            break
        print(f'NATIVE heartbeat stage={stage} elapsed={int(elapsed)}s remaining={int(limit-elapsed)}s', flush=True)
        # Process names and utilisation only: no environment, credentials or command arguments.
        diagnostic = subprocess.run(['ps', '-eo', 'pid,ppid,pcpu,pmem,comm'],
                                    capture_output=True, text=True, timeout=5)
        for line in diagnostic.stdout.splitlines():
            if any(name in line for name in ('clang', 'swift-frontend', 'xcodebuild', 'xctest', 'Simulator')):
                print(line, flush=True)
        try:
            process.wait(timeout=min(60, max(1, limit-elapsed)))
        except subprocess.TimeoutExpired:
            pass
    code = 124 if timed_out else process.returncode
    result = {'stage': stage, 'exit': code, 'timedOut': timed_out,
              'elapsedSeconds': round(time.monotonic()-start, 1), 'deadlineSeconds': limit}
    manifest_path = Path('artifacts/native-screenshots/manifest.json')
    manifest = json.loads(manifest_path.read_text())
    manifest.setdefault('nativeStages', {})[stage] = result
    manifest['captureScope'] = 'Midnight Home only'
    manifest['nativeBuild'] = 'Release, embedded JS, x86_64 only, compiler optimisations disabled'
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print('NATIVE result:', json.dumps(result), flush=True)
    return code


if __name__ == '__main__':
    sys.exit(main())
