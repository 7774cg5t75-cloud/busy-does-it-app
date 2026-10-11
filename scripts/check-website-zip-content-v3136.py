"""Verify ZIP32 interoperability, CRC, offline paths and absence of private values."""
from pathlib import Path
from zipfile import ZipFile
from html.parser import HTMLParser
import json

archive=Path("/tmp/busy-v3136-zip/website.zip")
destination=Path("/tmp/busy-v3136-zip/extracted")
destination.mkdir(parents=True,exist_ok=True)
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.images=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=="a" and "href" in attrs:self.links.append(attrs["href"])
        if tag=="img" and "src" in attrs:self.images.append(attrs["src"])
with ZipFile(archive) as z:
    assert z.testzip() is None,"ZIP CRC check must pass"
    names=z.namelist()
    assert names.count("index.html")==1
    assert "pages/meet-our-makers/index.html" in names
    assert "assets/photo-001.png" in names
    assert "EXPORT-MANIFEST.json" in names and "README.txt" in names
    assert len(names)==len(set(names)) and len(names)<=96
    assert all(not n.startswith("/") and ".." not in Path(n).parts for n in names)
    manifest=json.loads(z.read("EXPORT-MANIFEST.json"))
    assert manifest["portable"] and manifest["photos"]==1
    assert all("token" not in n.lower() and "secret" not in n.lower() for n in names)
    assert z.read("assets/photo-001.png").startswith(b"\x89PNG")
    for name in names:
        if name.endswith(".html"):
            source=z.read(name).decode("utf8")
            assert "signed.secret" not in source and "storagePath" not in source
            assert "fictional-private/photos/" not in source
            assert "<script" not in source.lower()
            parsed=Links()
            parsed.feed(source)
            current=(destination/name).parent
            for target in parsed.images+parsed.links:
                if target.startswith(("tel:","mailto:","#")):continue
                assert not target.startswith(("http:","https:","javascript:","data:","file:"))
                file_target=(current/target.split("#",1)[0]).resolve()
                # Only archive-relative self-contained local site resources.
                assert file_target.is_relative_to(destination.resolve())
                assert file_target.is_relative_to(destination.resolve())
    z.extractall(destination)
# Verify all relative links and images exist after extraction.
for page in destination.rglob("*.html"):
    parsed=Links()
    parsed.feed(page.read_text())
    for target in parsed.images+parsed.links:
        if target.startswith(("tel:","mailto:","#")):continue
        dest=(page.parent/target.split("#",1)[0]).resolve()
        assert dest.is_relative_to(destination.resolve()),target
        assert dest.is_file(),f"Broken archived link in {page.name}: {target}"
print("V3.136 ZIPFILE PASS:",len(names),"verified entries and locally resolved page/media references")
