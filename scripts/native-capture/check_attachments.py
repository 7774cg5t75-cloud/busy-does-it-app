"""Inert, inexpensive exporter tests. Generated PNGs are unit fixtures only.

All files stay in temporary directories; Apple/Git orchestration is mocked.
This never builds/launches an app, creates native evidence or uses networking.
"""
from contextlib import redirect_stdout
import copy
import io
import importlib.util
import json
import os
from pathlib import Path
import struct
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import zlib

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('attachments', HERE/'export_attachments.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
SOURCE, HARNESS = 'a'*40, 'b'*40
NAME = 'busy-home-midnight-' + SOURCE


def chunk(kind, payload):
    return struct.pack('>I', len(payload))+kind+payload+struct.pack('>I', zlib.crc32(kind+payload) & 0xffffffff)


def unit_png(width=320, height=568, depth=8, colour=2, raw=None):
    # Explicitly artificial all-zero pixels. Never used as screenshot evidence.
    if raw is None:
        raw = (b'\x00' + bytes(width*3))*height
    return (b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, depth, colour, 0, 0, 0))+
            chunk(b'IDAT', zlib.compress(raw))+chunk(b'IEND', b''))


class AttachmentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='busy-unit-attachments-')
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name)
        self.item = {'suggestedHumanReadableName': NAME, 'exportedFileName': 'fixture.png',
                     'isAssociatedWithFailure': False}
        (self.path/'fixture.png').write_bytes(unit_png())

    def select(self, items=None, group=None):
        inventory = [{'testIdentifier': module.TEST_ID, 'attachments': items if items is not None else [self.item]}]
        if group is not None:
            inventory = group
        (self.path/'manifest.json').write_text(json.dumps(inventory))
        return module.select_attachment(self.path, SOURCE)

    def test_exact_attachment(self):
        data, dimensions, name = self.select()
        self.assertEqual(dimensions, (320, 568))
        self.assertEqual(name, NAME)
        self.assertEqual(data, unit_png())

    def test_apple_filename_variants(self):
        for name in (NAME+'.png', NAME+'_1_12345678-1234-ABCD-1234-123456789abc.png'):
            with self.subTest(name=name):
                self.item['suggestedHumanReadableName'] = name
                self.select()

    def test_unrelated_attachments_not_selected(self):
        # Deliberately absent private.txt: selection must not even open it.
        other = dict(self.item, suggestedHumanReadableName='unrelated diagnostics', exportedFileName='private.txt')
        self.assertEqual(self.select([other, self.item])[2], NAME)

    def test_scoped_manifest_without_optional_identifier(self):
        self.select(group=[{'attachments': [self.item]}])

    def test_missing_duplicate_or_wrong_source_denied(self):
        for items in ([], [self.item, self.item], [dict(self.item, suggestedHumanReadableName='busy-home-midnight-'+'c'*40)],
                      [dict(self.item, suggestedHumanReadableName='busy-home-daylight-'+SOURCE)]):
            with self.subTest(items=items), self.assertRaises(ValueError):
                self.select(items)

    def test_failure_or_missing_failure_flag_denied(self):
        for flag in (True, None):
            with self.subTest(flag=flag), self.assertRaises(ValueError):
                self.select([dict(self.item, isAssociatedWithFailure=flag)])

    def test_foreign_test_denied(self):
        with self.assertRaises(ValueError):
            self.select(group=[{'testIdentifier': 'OtherTests/testOther()', 'attachments': [self.item]}])

    def test_ambiguous_or_malformed_inventory_denied(self):
        for value in ({}, [], [{'attachments': [self.item]}]*2, [{'attachments': None}]):
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.select(group=value)

    def test_path_escape_denied(self):
        for name in ('../fixture.png', '/tmp/fixture.png', '..\\fixture.png', 'fixture.txt'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                self.select([dict(self.item, exportedFileName=name)])

    def test_symlink_denied(self):
        (self.path/'link.png').symlink_to(self.path/'fixture.png')
        with self.assertRaises(ValueError):
            self.select([dict(self.item, exportedFileName='link.png')])

    def test_corrupt_image_denied(self):
        (self.path/'fixture.png').write_bytes(b'not an image')
        with self.assertRaises(ValueError):
            self.select()

    def test_png_signature_crc_truncation_and_trailing_bytes(self):
        valid = unit_png()
        corrupt = bytearray(valid)
        corrupt[29] ^= 1
        for data in (b'fake'+valid, bytes(corrupt), valid[:-1], valid+b'extra'):
            with self.subTest(size=len(data)), self.assertRaises(ValueError):
                module.png_dimensions(data)

    def test_png_dimensions_encoding_and_inflate_bound(self):
        for data in (unit_png(568, 320), unit_png(1, 1), unit_png(depth=16), unit_png(colour=0),
                     unit_png(raw=b'\x00'), unit_png(raw=bytes(600000))):
            with self.subTest(size=len(data)), self.assertRaises(ValueError):
                module.png_dimensions(data)

    def test_bad_row_filter_denied(self):
        raw = (b'\x05'+bytes(320*3))*568
        with self.assertRaises(ValueError):
            module.png_dimensions(unit_png(raw=raw))


class ProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='busy-unit-provenance-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)/'root'
        self.work = Path(self.temp.name)/'work'
        self.runner = Path(self.temp.name)/'runner'
        self.runner.mkdir()
        for base in (self.root, self.work):
            (base/'scripts/native-capture').mkdir(parents=True)
        self.template = (HERE/'CaptureTests.swift').read_text()
        self.compiled = self.template.replace('__BUSY_CAPTURE_SOURCE_SHA__', SOURCE).encode()
        transport = (HERE/'transport.cjs').read_bytes()
        for base in (self.root, self.work):
            (base/'scripts/native-capture/transport.cjs').write_bytes(transport)
        (self.root/'scripts/native-capture/CaptureTests.swift').write_text(self.template)
        (self.work/'scripts/native-capture/CaptureTests.swift').write_bytes(self.compiled)
        self.original = b'// fictional unit entry, not an application render\n'
        self.entry = b'require("./scripts/native-capture/transport.cjs").install();\n'+self.original
        (self.work/'App.js').write_bytes(self.entry)
        self.manifest = {'sourceCommit': SOURCE, 'harnessCommit': HARNESS, 'fixture': module.FIXTURE,
                         'productionUIAndControllerUnmodified': True, 'platform': 'iOS Simulator', 'tool': module.TOOL,
                         'expectedScreen': 'Home', 'appearance': 'Midnight', 'captureScope': 'Owner Preview Home, Results and About',
                         'fixtureTransportSha256': module.digest(transport), 'uiTestCompiledSha256': module.digest(self.compiled),
                         'entryInstrumentedSha256': module.digest(self.entry), 'entryOriginalSha256': module.digest(self.original),
                         'nativeStages': {stage: {'stage': stage, 'exit': 0, 'timedOut': False,
                                                'elapsedSeconds': 1, 'deadlineSeconds': 60} for stage in ('build', 'test')},
                         'unreviewedExtension': 'Must never be published'}

    def validate(self, manifest=None):
        module.validate_provenance(manifest or self.manifest, self.root, self.work, SOURCE, HARNESS)

    def test_matching_provenance(self):
        self.validate()

    def test_wrong_commit_scope_fixture_or_owner_boundary_denied(self):
        mutations = {'sourceCommit': 'c'*40, 'harnessCommit': 'c'*40, 'fixture': 'real account',
                     'productionUIAndControllerUnmodified': False, 'expectedScreen': 'Inbox', 'appearance': 'Daylight',
                     'platform': 'HTML', 'captureScope': 'all screens', 'tool': 'mockup'}
        for key, value in mutations.items():
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.validate(dict(self.manifest, **{key: value}))

    def test_failed_or_uncertain_native_stage_denied(self):
        for stage in ('build', 'test'):
            for change in ({'exit': 65}, {'timedOut': True}):
                value = copy.deepcopy(self.manifest)
                value['nativeStages'][stage].update(change)
                with self.subTest(stage=stage, change=change), self.assertRaises(ValueError):
                    self.validate(value)

    def test_modified_instrumentation_transport_or_compiled_test_denied(self):
        for relative in ('App.js', 'scripts/native-capture/transport.cjs', 'scripts/native-capture/CaptureTests.swift'):
            path = self.work/relative
            before = path.read_bytes()
            path.write_bytes(before+b'changed')
            with self.subTest(path=relative), self.assertRaises(ValueError):
                self.validate()
            path.write_bytes(before)

    def setup_main(self):
        self.artifact = self.root/'artifacts/native-screenshots'
        self.artifact.mkdir(parents=True)
        (self.artifact/'manifest.json').write_text(json.dumps(self.manifest))
        (self.runner/'busy-home.xcresult').mkdir()
        self.output = self.runner/'github-output'
        self.calls = []

    def fake_command(self, args, **kwargs):
        self.calls.append((args, kwargs))
        if args[:4] == ['xcrun', 'xcresulttool', 'export', 'attachments']:
            self.assertEqual(args[-2:], ['--test-id', module.TEST_ID])
            self.assertEqual(kwargs['timeout'], 60)
            exported = Path(args[args.index('--output-path')+1])
            exported.mkdir()
            (exported/'fixture.png').write_bytes(unit_png())
            (exported/'private.txt').write_text('Synthetic unrelated diagnostic, never publish')
            items=[]
            for capture in module.CAPTURES:
                filename=capture+'.png'
                (exported/filename).write_bytes(unit_png())
                items.append({'suggestedHumanReadableName':'busy-'+capture+'-'+SOURCE,'exportedFileName':filename,'isAssociatedWithFailure':False})
            (exported/'manifest.json').write_text(json.dumps([{'testIdentifier':module.TEST_ID,'attachments':items}]))
        return subprocess.CompletedProcess(args, 0)

    def run_main(self, runner=None):
        with redirect_stdout(io.StringIO()), patch.object(module, 'ROOT', self.root), patch.object(module.sys, 'argv', ['export_attachments.py']), \
             patch.dict(os.environ, CAPTURE_SOURCE_SHA=SOURCE, GITHUB_SHA=HARNESS, CAPTURE_WORK=str(self.work),
                        RUNNER_TEMP=str(self.runner), GITHUB_OUTPUT=str(self.output)), \
             patch.object(module.subprocess, 'run', side_effect=runner or self.fake_command), \
             patch.object(module.subprocess, 'check_output', return_value=self.original):
            module.main()

    def test_export_orchestration_upload_allowlist_and_no_private_extensions(self):
        self.setup_main()
        self.run_main()
        self.assertEqual({p.name for p in self.artifact.iterdir()}, {name+'.png' for name in module.CAPTURES}|{'manifest.json'})
        public = json.loads((self.artifact/'manifest.json').read_text())
        self.assertNotIn('unreviewedExtension', public)
        self.assertEqual(public['captures']['home-midnight']['sha256'], module.digest(unit_png()))
        self.assertEqual(self.output.read_text(), 'safe=true\n')
        self.assertTrue(any(args[:3] == ['git', 'merge-base', '--is-ancestor'] for args, _ in self.calls))

    def test_missing_required_owner_screen_denies_upload(self):
        self.setup_main()
        def missing(args, **kwargs):
            result = self.fake_command(args, **kwargs)
            if args[:4] == ['xcrun', 'xcresulttool', 'export', 'attachments']:
                path=Path(args[args.index('--output-path')+1])/'manifest.json'
                data=json.loads(path.read_text())
                data[0]['attachments'].pop()
                path.write_text(json.dumps(data))
            return result
        with self.assertRaises(ValueError):
            self.run_main(missing)
        self.assertFalse(self.output.exists())
        self.assertFalse((self.artifact/'home-midnight.png').exists())

    def test_cli_failure_does_not_enable_upload(self):
        self.setup_main()
        def fail(args, **kwargs):
            if args[0] == 'xcrun':
                raise subprocess.CalledProcessError(65, args)
            return self.fake_command(args, **kwargs)
        with self.assertRaises(subprocess.CalledProcessError):
            self.run_main(fail)
        self.assertFalse(self.output.exists())
        self.assertFalse((self.artifact/'home-midnight.png').exists())

    def test_preexisting_artifact_denied(self):
        self.setup_main()
        (self.artifact/'stale.png').write_bytes(unit_png())
        with self.assertRaises(ValueError):
            self.run_main()
        self.assertFalse(self.output.exists())

    def test_missing_real_result_bundle_denied(self):
        self.setup_main()
        (self.runner/'busy-home.xcresult').rmdir()
        with self.assertRaises(ValueError):
            self.run_main()
        self.assertFalse(self.output.exists())

    def test_apple_tool_help_is_scoped_and_bounded(self):
        with redirect_stdout(io.StringIO()), patch.object(module.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, '--path --output-path --test-id')) as run:
            module.check_tool()
            self.assertEqual(run.call_args.args[0], ['xcrun', 'xcresulttool', 'export', 'attachments', '--help'])
            self.assertEqual(run.call_args.kwargs['timeout'], 20)
        with patch.object(module.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, 'old unsupported tool')):
            with self.assertRaises(ValueError):
                module.check_tool()


if __name__ == '__main__':
    result = unittest.main(exit=False).result
    if result.wasSuccessful():
        print('PASS inert attachment validator tests; PNGs are temporary unit fixtures, Apple execution mocked, no native screenshot produced')
    raise SystemExit(0 if result.wasSuccessful() else 1)
