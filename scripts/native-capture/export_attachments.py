"""Export one source-bound XCTest PNG; never publish the result bundle or diagnostics.

Apple commands execute only on an explicitly requested macOS capture. Pure
selection/PNG checks are exercised locally with clearly synthetic unit fixtures.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import tempfile
import zlib

ROOT = Path(__file__).resolve().parents[2]
TEST_ID = 'CaptureTests/testMidnightHome()'
FIXTURE = 'fictional in-memory transport; no hosted authentication/security proof'
TOOL = 'Apple XCTest screenshot attachment / xcresulttool export attachments'
MAX_PNG = 20 * 1024 * 1024


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def png_dimensions(data):
    require(8 < len(data) < MAX_PNG and data[:8] == b'\x89PNG\r\n\x1a\n', 'Invalid or oversized PNG')
    offset, header, compressed, ended = 8, None, bytearray(), False
    while offset + 12 <= len(data):
        length = struct.unpack('>I', data[offset:offset+4])[0]
        kind = data[offset+4:offset+8]
        end = offset + 12 + length
        require(end <= len(data), 'Truncated PNG chunk')
        require(all(65 <= c <= 90 or 97 <= c <= 122 for c in kind), 'Invalid PNG chunk type')
        require(kind[0] & 32 or kind in (b'IHDR', b'PLTE', b'IDAT', b'IEND'), 'Unknown critical PNG chunk')
        payload = data[offset+8:end-4]
        require(zlib.crc32(kind+payload) & 0xffffffff == struct.unpack('>I', data[end-4:end])[0], 'PNG CRC mismatch')
        if kind == b'IHDR':
            require(offset == 8 and header is None and length == 13, 'Invalid PNG header')
            header = struct.unpack('>IIBBBBB', payload)
        elif kind == b'IDAT':
            require(header is not None and not ended, 'Invalid PNG image-data order')
            compressed.extend(payload)
        elif kind == b'IEND':
            require(length == 0 and end == len(data), 'Invalid PNG ending')
            ended = True
        require(kind != b'acTL', 'Animated images are not supported')
        offset = end
    require(header is not None and ended and offset == len(data), 'Incomplete PNG')
    width, height, depth, colour, compression, filtering, interlace = header
    require(320 <= width <= 2048 and 568 <= height <= 4096 and height > width, 'Expected a portrait iPhone capture')
    require(depth == 8 and colour in (2, 6) and (compression, filtering, interlace) == (0, 0, 0), 'Unsupported PNG encoding')
    stride = 1 + width * (3 if colour == 2 else 4)
    expected = height * stride
    require(expected <= 32 * 1024 * 1024, 'PNG decoded size exceeds bound')
    decoder = zlib.decompressobj()
    decoded = decoder.decompress(bytes(compressed), expected+1)
    require(len(decoded) == expected and decoder.eof and not decoder.unconsumed_tail and not decoder.unused_data,
            'Invalid PNG compressed data')
    require(all(decoded[row*stride] <= 4 for row in range(height)), 'Invalid PNG row filter')
    return width, height


def select_attachment(exported, source):
    require(re.fullmatch('[0-9a-f]{40}', source) is not None, 'Expected exact source commit')
    manifest_file = exported / 'manifest.json'
    require(not manifest_file.is_symlink() and manifest_file.stat().st_size < 1024*1024, 'Invalid attachment inventory')
    inventory = json.loads(manifest_file.read_text())
    require(isinstance(inventory, list) and len(inventory) == 1 and isinstance(inventory[0], dict),
            'Expected exactly one exported test inventory')
    group = inventory[0]
    allowed_ids = {TEST_ID, TEST_ID.removesuffix('()'), 'BusyCaptureUITests/'+TEST_ID,
                   'BusyCaptureUITests/'+TEST_ID.removesuffix('()')}
    if 'testIdentifier' in group:
        require(group['testIdentifier'] in allowed_ids, 'Unexpected exported test identity')
    # --test-id scopes export even on tool versions omitting testIdentifier.
    attachments = group.get('attachments')
    require(isinstance(attachments, list) and len(attachments) <= 1000, 'Invalid attachment list')
    expected = 'busy-home-midnight-' + source
    uuid = r'[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}'
    name_pattern = re.compile(re.escape(expected) + r'(?:\.png|_[0-9]+_'+uuid+r'\.png)?')
    selected = [a for a in attachments if isinstance(a, dict) and
                isinstance(a.get('suggestedHumanReadableName'), str) and
                name_pattern.fullmatch(a['suggestedHumanReadableName'])]
    require(len(selected) == 1, 'Missing or duplicate exact-source Midnight Home attachment')
    item = selected[0]
    require(item.get('isAssociatedWithFailure') is False, 'Failure attachments cannot be published')
    name = item.get('exportedFileName')
    require(isinstance(name, str) and 0 < len(name) <= 240 and Path(name).name == name and
            '/' not in name and '\\' not in name and name.endswith('.png'), 'Unsafe exported attachment path')
    path = exported / name
    require(not path.is_symlink() and path.is_file() and path.resolve().parent == exported.resolve(), 'Invalid exported image file')
    require(path.stat().st_size < MAX_PNG, 'Exported PNG exceeds size bound')
    data = path.read_bytes()
    dimensions = png_dimensions(data)
    return data, dimensions, item['suggestedHumanReadableName']


def validate_provenance(manifest, root, work, source, harness):
    require(re.fullmatch('[0-9a-f]{40}', source) and re.fullmatch('[0-9a-f]{40}', harness), 'Invalid source/harness identity')
    require(manifest.get('sourceCommit') == source and manifest.get('harnessCommit') == harness, 'Source/harness mismatch')
    require(manifest.get('fixture') == FIXTURE and manifest.get('productionUIAndControllerUnmodified') is True,
            'Fictional unchanged-UI capture required')
    require(manifest.get('platform') == 'iOS Simulator' and manifest.get('tool') == TOOL and
            manifest.get('expectedScreen') == 'Home' and manifest.get('appearance') == 'Midnight' and
            manifest.get('captureScope') == 'Midnight Home only', 'Unsupported capture scope')
    for stage in ('build', 'test'):
        result = manifest.get('nativeStages', {}).get(stage, {})
        require(result.get('exit') == 0 and result.get('timedOut') is False and result.get('stage') == stage,
                'Successful native compilation and test receipts required')
    transport = (root / 'scripts/native-capture/transport.cjs').read_bytes()
    require(digest(transport) == manifest.get('fixtureTransportSha256') and
            (work / 'scripts/native-capture/transport.cjs').read_bytes() == transport, 'Fixture transport changed')
    template = (root / 'scripts/native-capture/CaptureTests.swift').read_text()
    require(template.count('__BUSY_CAPTURE_SOURCE_SHA__') == 1, 'Missing compiled source binding')
    compiled = template.replace('__BUSY_CAPTURE_SOURCE_SHA__', source).encode()
    require((work / 'scripts/native-capture/CaptureTests.swift').read_bytes() == compiled and
            digest(compiled) == manifest.get('uiTestCompiledSha256'), 'UI test source binding changed')
    entry = (work / 'App.js').read_bytes()
    prefix = b'require("./scripts/native-capture/transport.cjs").install();\n'
    require(entry.startswith(prefix) and digest(entry) == manifest.get('entryInstrumentedSha256') and
            digest(entry[len(prefix):]) == manifest.get('entryOriginalSha256'), 'Unexpected application instrumentation')


def check_tool():
    help_result = subprocess.run(['xcrun', 'xcresulttool', 'export', 'attachments', '--help'],
                                 check=True, capture_output=True, text=True, timeout=20)
    require(all(flag in help_result.stdout for flag in ('--path', '--output-path', '--test-id')),
            'Installed Apple exporter does not expose required scoped export options')
    print('PASS installed Apple attachment exporter supports scoped export; no application build started')


def main():
    if sys.argv[1:] == ['--check-tool']:
        check_tool()
        return
    require(not sys.argv[1:], 'No arbitrary export paths/options accepted')
    source, harness = os.environ['CAPTURE_SOURCE_SHA'], os.environ['GITHUB_SHA']
    work, temp = Path(os.environ['CAPTURE_WORK']), Path(os.environ['RUNNER_TEMP'])
    artifact = ROOT / 'artifacts/native-screenshots'
    require({p.name for p in artifact.iterdir()} == {'manifest.json'}, 'Unexpected pre-existing public artifacts')
    manifest = json.loads((artifact / 'manifest.json').read_text())
    validate_provenance(manifest, ROOT, work, source, harness)
    subprocess.run(['git', 'merge-base', '--is-ancestor', source, harness], cwd=ROOT, check=True, timeout=10)
    original = subprocess.check_output(['git', 'cat-file', 'blob', source+':App.js'], cwd=ROOT, timeout=10)
    require(digest(original) == manifest['entryOriginalSha256'], 'Original entry does not match source commit')
    subprocess.run(['git', 'diff', '--quiet', '--', 'src', 'BusyDoesItApp.js', 'app.json'], cwd=work, check=True, timeout=10)
    bundle = temp / 'busy-home.xcresult'
    require(bundle.is_dir() and not bundle.is_symlink(), 'Missing actual XCTest result bundle')
    with tempfile.TemporaryDirectory(prefix='busy-xctest-export-', dir=temp) as directory:
        exported = Path(directory) / 'attachments'
        subprocess.run(['xcrun', 'xcresulttool', 'export', 'attachments', '--path', str(bundle),
                        '--output-path', str(exported), '--test-id', TEST_ID], check=True, timeout=60)
        data, (width, height), attachment_name = select_attachment(exported, source)
    # Deliberate output allowlist: do not copy xcresult, raw inventory, logs or other attachments.
    public_keys = ('sourceCommit', 'harnessCommit', 'entryOriginalSha256', 'entryInstrumentedSha256',
                   'platform', 'fixture', 'tool', 'expectedScreen', 'appearance', 'fixtureTransportSha256',
                   'uiTestCompiledSha256', 'productionUIAndControllerUnmodified', 'device', 'runtime',
                   'xcode', 'swift', 'captureScope', 'nativeBuild')
    public = {key: manifest[key] for key in public_keys if key in manifest}
    public['nativeStages'] = {stage: {key: manifest['nativeStages'][stage][key]
                             for key in ('stage', 'exit', 'timedOut', 'elapsedSeconds', 'deadlineSeconds')}
                             for stage in ('build', 'test')}
    public['captures'] = {'home-midnight': {'sha256': digest(data), 'bytes': len(data),
                          'width': width, 'height': height, 'attachmentName': attachment_name, 'testIdentifier': TEST_ID}}
    public['visualInspection'] = 'Pending actual PNG retrieval and inspection; source checks are not visual acceptance'
    (artifact / 'home-midnight.png').write_bytes(data)
    (artifact / 'manifest.json').write_text(json.dumps(public, indent=2))
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        output.write('safe=true\n')
    print(f'Validated source-bound Apple Home attachment: {width}x{height}, {len(data)} bytes, SHA256 {digest(data)}')


if __name__ == '__main__':
    main()
