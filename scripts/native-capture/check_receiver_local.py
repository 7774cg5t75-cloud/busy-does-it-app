"""Explicit local-loopback integration check; requires socket permission.

No Xcode, simulator, hosted service, screenshot or application mutation.
Do not add this network check to the inert offline application selection.
"""
import importlib.util
import os
from pathlib import Path
import tempfile
import urllib.request

spec = importlib.util.spec_from_file_location('native_stage', Path(__file__).with_name('native_stage.py'))
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)

with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    (root / 'ios' / 'App.xcworkspace').mkdir(parents=True)
    build, test = stage.command('build', root, root), stage.command('test', root, root, 'fictional-device')
    assert build[-1] == 'build-for-testing' and 'test-without-building' not in build
    assert test[-1] == 'test-without-building' and 'build-for-testing' not in test
    assert '-only-testing:BusyCaptureUITests/CaptureTests/testMidnightHome' in test
    for args in (build, test):
        assert 'CODE_SIGNING_ALLOWED=NO' in args and 'ARCHS=x86_64' in args
    try:
        stage.command('test', root, root)
    except ValueError:
        pass
    else:
        raise AssertionError('Missing simulator accepted')
    (root / 'ios' / 'Ambiguous.xcworkspace').mkdir()
    try:
        stage.command('build', root, root)
    except ValueError:
        pass
    else:
        raise AssertionError('Ambiguous workspace accepted')
print('PASS exact compile/test commands and malformed-target denial')

original_environment = dict(os.environ)
try:
    os.environ.update(http_proxy='http://127.0.0.1:9', HTTP_PROXY='http://127.0.0.1:9', no_proxy='', NO_PROXY='')
    with stage.receiver_ready():
        try:
            with stage.receiver_ready():
                raise AssertionError('Different process accepted on occupied port')
        except RuntimeError as error:
            assert 'exited during startup: 1' in str(error)
        print('PASS expected occupied-port denial; no other process can satisfy readiness')
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open('http://127.0.0.1:8765/health', timeout=1) as response:
            assert response.read().startswith(b'busy-native-capture-receiver-v1:')
    print('PASS actual loopback health despite unusable external proxy settings')
    try:
        with stage.receiver_ready():
            raise OSError('intentional caller failure')
    except OSError as error:
        assert str(error) == 'intentional caller failure'
    else:
        raise AssertionError('Caller error swallowed')
    with stage.receiver_ready():
        print('PASS caller error preserved, owned process cleaned up, fresh startup succeeds')
finally:
    os.environ.clear()
    os.environ.update(original_environment)
