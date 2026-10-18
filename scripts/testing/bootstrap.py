"""Pinned tooling only. Offline by default; never replaces app node_modules."""
import argparse, json, os, pathlib, subprocess, sys
root=pathlib.Path(__file__).resolve().parents[2]
prefix=root/'scripts/offline-tools'
parser=argparse.ArgumentParser()
group=parser.add_mutually_exclusive_group()
group.add_argument('--allow-network',action='store_true')
group.add_argument('--offline',action='store_true')
args=parser.parse_args()
pins=json.loads((prefix/'package.json').read_text())['dependencies']
lock=json.loads((prefix/'package-lock.json').read_text())
chain=json.loads((root/'scripts/testing/toolchain.json').read_text())
for binary in ['node','npm']:
 actual=subprocess.check_output([binary,'--version'],text=True).strip().lstrip('v')
 if actual!=chain[binary]:sys.exit('Select '+binary+' '+chain[binary]+' before setup; no runtime is installed automatically.')
if lock['lockfileVersion']!=3 or lock['packages']['']['dependencies']!=pins:sys.exit('Manifest and reviewed lock differ.')
for name,item in lock['packages'].items():
 if name and (not item.get('integrity') or not item.get('resolved','').startswith('https://registry.npmjs.org/')):sys.exit('Unexpected lock source: '+name)
def installed():
 try:return all(json.loads((prefix/name/'package.json').read_text())['version']==item['version'] for name,item in lock['packages'].items() if name)
 except (OSError,ValueError,KeyError):return False
if not installed():
 command=['npm','ci','--prefix',str(prefix),'--ignore-scripts','--no-audit','--no-fund','--fetch-retries=0','--fetch-timeout=20000']
 if not args.allow_network:command+=['--offline']
 if os.environ.get('BUSY_TEST_NPM_CACHE'):command+=['--cache',str(pathlib.Path(os.environ['BUSY_TEST_NPM_CACHE']).resolve())]
 subprocess.run(command,cwd=root,check=True)
if not installed():sys.exit('Installed package versions do not match the complete lock.')
link=root/'scripts/node_modules'
if link.is_symlink():
 if link.resolve()!=(prefix/'node_modules').resolve():sys.exit('Existing scripts/node_modules points elsewhere; preserved without replacement.')
elif link.exists():sys.exit('Existing scripts/node_modules directory preserved; resolve explicitly before setup.')
else:link.symlink_to('offline-tools/node_modules',target_is_directory=True)
subprocess.run(['node','scripts/testing/health.mjs'],cwd=root,check=True)
