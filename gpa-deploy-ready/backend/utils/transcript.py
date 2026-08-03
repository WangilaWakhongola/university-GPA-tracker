"""
Transcript parsing: extract text from an uploaded PDF and detect course rows
(name, code, credit hours, grade). Nothing here writes to the database -
it only produces a preview list the student confirms or edits before saving.
"""

import re
import pdfplumber
from utils.gpa import SCALES, get_grade_point

MAX_PDF_BYTES = 8 * 1024 * 1024  # 8 MB


class TranscriptParseError(Exception):
    pass


def extract_text(file_stream) -> str:
    """Pull all text out of a PDF file stream. Raises TranscriptParseError
    if the PDF has no extractable text (e.g. it's a scanned image)."""
    try:
        with pdfplumber.open(file_stream) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
    except Exception:
        raise TranscriptParseError(
            "Couldn't open that file as a PDF. Make sure it's a valid, non-corrupted PDF."
        )

    text = "\n".join(pages).strip()
    if not text:
        raise TranscriptParseError(
            "No selectable text found in this PDF. It looks like a scanned image "
            "rather than a text-based document, which we can't read yet — try "
            "entering courses manually, or export a text-based transcript from your portal."
        )
    return text


def _build_line_pattern(scale: str) -> re.Pattern:
    grade_tokens = sorted(SCALES.get(scale, SCALES["4.0"]).keys(), key=len, reverse=True)
    grade_alt = "|".join(re.escape(g) for g in grade_tokens)
    return re.compile(
        r"^(?P<code>[A-Za-z]{2,6}\s?-?\d{2,4}[A-Za-z]?)?\s*[:\-]?\s*"
        r"(?P<name>[A-Za-z][A-Za-z0-9&,/'()\- ]{2,60}?)\s+"
        r"(?P<credits>\d+(?:\.\d+)?)\s*(?:cr|credits?|units?|hrs?)?\s+"
        rf"(?P<grade>{grade_alt})(?=\s|$)",
        re.IGNORECASE,
    )


def parse_courses(text: str, scale: str) -> list[dict]:
    """Scan transcript text line by line and pull out course rows that match
    the pattern: [code] name ... credit_hours grade. Lines that don't match
    (headers, GPA summaries, blank lines) are silently skipped."""
    pattern = _build_line_pattern(scale)
    results = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        match = pattern.search(line)
        if not match:
            continue

        credits = float(match.group("credits"))
        if credits <= 0 or credits > 12:
            continue  # not a plausible credit-hour value, likely a false match

        name = match.group("name").strip(" -:\u2013")
        if len(name) < 3:
            continue

        grade = match.group("grade").upper()
        code = (match.group("code") or "").strip().upper().replace(" ", "")

        results.append({
            "name":         name,
            "code":         code,
            "credit_hours": credits,
            "grade":        grade,
            "grade_point":  get_grade_point(grade, scale),
            "source_line":  line,
        })

    return results
