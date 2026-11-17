"""Inspect a supplied resume; explicitly export a redacted public copy in apply mode."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "artifacts/pdf-tools"))
import pymupdf

source = Path(sys.argv[1])
doc = pymupdf.open(source)
text = "\n".join(page.get_text() for page in doc)
emails = sorted(set(re.findall(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", text)))
private_pattern = re.compile(r"01[016789][\s-]?\d{3,4}[\s-]?\d{4}|생년월일|(?:19|20)\d{2}년\s*\(만\s*\d+세\)|주소|연락처|휴대폰|전화번호")
private_lines = []
for page_index, page in enumerate(doc):
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            value = "".join(span["text"] for span in line["spans"])
            if private_pattern.search(value):
                private_lines.append({"page":page_index+1,"text":value,"bbox":line["bbox"]})
print(json.dumps({"pages":len(doc),"emails":emails,"privateLineCount":len(private_lines)},ensure_ascii=False))

if len(sys.argv) > 2 and sys.argv[2] == "apply":
    if len(emails) != 1:
        raise SystemExit("Expected exactly one verified email")
    if len(private_lines) != 3:
        raise SystemExit("Unexpected private fields; inspect before publication")
    for candidate in private_lines:
        page = doc[candidate["page"] - 1]
        page.add_redact_annot(pymupdf.Rect(candidate["bbox"]), fill=(1,1,1))
    for page in doc:
        page.apply_redactions(images=0, graphics=0)
        for link in page.get_links():
            if link.get("uri", "").startswith("tel:"):
                page.delete_link(link)
    doc.set_metadata({})
    doc.del_xml_metadata()
    destination = ROOT / "public/resume.pdf"
    doc.save(destination, garbage=4, deflate=True, clean=True)
    doc.close()
    public_doc = pymupdf.open(destination)
    public_text = "\n".join(page.get_text() for page in public_doc)
    if private_pattern.search(public_text) or emails[0] not in public_text:
        raise SystemExit("Public resume privacy verification failed")
    output_dir = ROOT / "artifacts/refresh/publication"
    output_dir.mkdir(parents=True, exist_ok=True)
    public_doc[0].get_pixmap(matrix=pymupdf.Matrix(1.5,1.5),clip=pymupdf.Rect(0,0,public_doc[0].rect.width,230)).save(output_dir / "resume-header.png")
    print(json.dumps({"publicResume":"public/resume.pdf","pages":len(public_doc),"email":emails[0],"removedPrivateLines":len(private_lines),"privacyVerified":True},ensure_ascii=False))
