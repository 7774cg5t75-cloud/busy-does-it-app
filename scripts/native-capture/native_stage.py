"""Bounded, separately observable native compilation and UI execution.

Only disposable simulator products; no signing, hosted access or retries.
"""
import json
import os
from pathlib import Path
import signal
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


def main():
    stage = sys.argv[1]
    work, temp = Path(os.environ['CAPTURE_WORK']), Path(os.environ['RUNNER_TEMP'])
    args = command(stage, work, temp, os.environ.get('CAPTURE_UDID'))
    limit = 24 * 60 if stage == 'build' else 4 * 60
    if stage == 'test':
        # Wait only for the fixed loopback screenshot receiver, never external I/O.
        import urllib.request
        for attempt in range(20):
            try:
                with urllib.request.urlopen('http://127.0.0.1:8765/health', timeout=1) as response:
                    if response.status == 200:
                        break
            except OSError:
                time.sleep(0.25)
        else:
            raise RuntimeError('Local Apple screenshot receiver did not start')
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
