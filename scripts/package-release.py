"""Package only the committed runtime artifact; deterministic ZIP and checksum."""
import hashlib
import json
from pathlib import Path
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
dist = root / 'dist'
manifest = json.loads((dist / 'manifest.json').read_text())
version = json.loads((root / 'package.json').read_text())['version']
assert manifest['version'] == version
assert manifest == json.loads((root / 'public/manifest.json').read_text())
destination = Path(sys.argv[1])
destination.mkdir(parents=True, exist_ok=True)
archive = destination / f'indexfold-{version}-unpacked.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as output:
    for path in sorted(dist.rglob('*')):
        if not path.is_file():
            continue
        assert not path.is_symlink()
        name = path.relative_to(dist).as_posix()
        assert path.suffix in {'.html', '.js', '.css', '.json', '.svg', '.png'}
        assert not any(part.startswith('.') for part in Path(name).parts)
        info = zipfile.ZipInfo(name, date_time=(2020, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        output.writestr(info, path.read_bytes())
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
(destination / f'{archive.name}.sha256').write_text(f'{checksum}  {archive.name}\n')
print(f'{checksum}  {archive}')
