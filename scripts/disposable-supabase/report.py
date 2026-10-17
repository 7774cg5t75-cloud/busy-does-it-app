"""Publish an allowlisted, credential-free summary. No artifact/storage charge."""
import json,os,pathlib
work=pathlib.Path(os.environ['BUSY_DB_WORKDIR'])
path=work/'report.json'
if path.exists():
    full=json.loads(path.read_text())
    # Do not include CLI status, raw diagnostics, accounts, data or dump contents.
    safe={k:full[k] for k in ['source','scope','result','stages','candidate','candidateSourceHash','migrationHistory','cliVersion','images','integration','limitations','releaseApproved','failedCommand','integrationProgress','control','localProxy','schedulerContainment'] if k in full}
else:safe={'result':'blocked','reason':'No rehearsal evidence produced; approval/preflight or tool setup failed'}
text=json.dumps(safe,indent=2)
(work/'report-public.json').write_text(text+'\n') if work.exists() else None
print(text)
summary=os.environ.get('GITHUB_STEP_SUMMARY')
if summary:
    with open(summary,'a') as f:
        title='PostgreSQL-only connectivity control' if 'control' in safe else 'Disposable Supabase rehearsal'
        f.write('## '+title+'\n\nResult: **'+safe.get('result','incomplete')+'**. This is not release approval.\n\n')
        for row in safe.get('stages',[]):f.write('- '+row['stage']+': '+row['result']+'\n')
        f.write('\n<details><summary>Reproducible source, migration, tool and check evidence</summary>\n\n```json\n'+text+'\n```\n</details>\n')
