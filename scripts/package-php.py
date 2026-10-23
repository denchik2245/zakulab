#!/usr/bin/env python3
"""Archive the generated deployment; private configuration never enters the archive."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
deployment = root / 'build/beget'
if not (deployment / 'public_html/index.php').is_file():
    raise SystemExit('Run npm run build first.')
archive = root / 'build/zakulab-beget.zip'
with ZipFile(archive, 'w', compression=ZIP_DEFLATED, compresslevel=6) as output:
    for source in sorted(deployment.rglob('*')):
        relative = source.relative_to(deployment)
        # Existing installations must back up live data separately before updating.
        if relative.parts[0] not in {'app', 'public_html', 'storage', 'config.example.php', 'console.php', 'README.md'}:
            continue
        if source.is_file() and source.name != 'config.local.php':
            output.write(source, relative)
print(f'Prepared {archive.relative_to(root)} ({archive.stat().st_size / 1024 / 1024:.1f} MiB).')
