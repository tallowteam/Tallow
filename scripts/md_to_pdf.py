"""
Convert TALLOW_100_AGENT_EXPANDED_OPERATIONS_MANUAL.md to a styled PDF.
Uses reportlab for PDF generation with a dark theme matching Tallow's aesthetic.
"""

import re
import sys
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted,
    Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# ── Colors ──────────────────────────────────────────────────────────
BG_DARK    = HexColor("#0a0a14")
BG_CODE    = HexColor("#0f0f1a")
BG_TABLE_H = HexColor("#12122a")
BG_TABLE_R = HexColor("#0c0c18")
BG_TABLE_A = HexColor("#0e0e1e")
TEXT_MAIN  = HexColor("#e8e8f0")
TEXT_DIM   = HexColor("#9494a8")
TEXT_CODE  = HexColor("#c0c0d8")
ACCENT     = HexColor("#6366f1")
ACCENT2    = HexColor("#818cf8")
BORDER     = HexColor("#24243a")
RED        = HexColor("#ef4444")
GREEN      = HexColor("#22c55e")
YELLOW     = HexColor("#eab308")


def build_styles():
    """Create paragraph styles for the PDF."""
    styles = {}

    styles['body'] = ParagraphStyle(
        'body',
        fontName='Helvetica',
        fontSize=9,
        leading=14,
        textColor=TEXT_MAIN,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
    )

    styles['h1'] = ParagraphStyle(
        'h1',
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=28,
        textColor=ACCENT2,
        spaceAfter=12,
        spaceBefore=24,
    )

    styles['h2'] = ParagraphStyle(
        'h2',
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=22,
        textColor=ACCENT,
        spaceAfter=8,
        spaceBefore=18,
    )

    styles['h3'] = ParagraphStyle(
        'h3',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=TEXT_MAIN,
        spaceAfter=6,
        spaceBefore=12,
    )

    styles['code'] = ParagraphStyle(
        'code',
        fontName='Courier',
        fontSize=7,
        leading=9.5,
        textColor=TEXT_CODE,
        spaceAfter=8,
        spaceBefore=4,
        leftIndent=12,
        backColor=BG_CODE,
    )

    styles['blockquote'] = ParagraphStyle(
        'blockquote',
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=ACCENT2,
        spaceAfter=8,
        spaceBefore=4,
        leftIndent=16,
        borderPadding=4,
    )

    styles['bullet'] = ParagraphStyle(
        'bullet',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_MAIN,
        spaceAfter=3,
        leftIndent=24,
        bulletIndent=12,
    )

    styles['table_header'] = ParagraphStyle(
        'table_header',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=ACCENT2,
    )

    styles['table_cell'] = ParagraphStyle(
        'table_cell',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT_MAIN,
    )

    styles['divider_text'] = ParagraphStyle(
        'divider_text',
        fontName='Courier-Bold',
        fontSize=8,
        leading=10,
        textColor=ACCENT,
        alignment=TA_LEFT,
        spaceAfter=2,
        spaceBefore=2,
    )

    styles['footer'] = ParagraphStyle(
        'footer',
        fontName='Courier',
        fontSize=6.5,
        leading=8,
        textColor=TEXT_DIM,
        alignment=TA_CENTER,
    )

    return styles


def on_page(canvas, doc):
    """Draw background and page footer."""
    canvas.saveState()
    # Dark background
    canvas.setFillColor(BG_DARK)
    canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
    # Thin accent line at top
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.5)
    canvas.line(36, letter[1] - 30, letter[0] - 36, letter[1] - 30)
    # Page number
    canvas.setFont("Courier", 7)
    canvas.setFillColor(TEXT_DIM)
    canvas.drawCentredString(letter[0] / 2, 24,
        f"TALLOW OPERATIONS MANUAL — TOP SECRET — PAGE {doc.page}")
    # Thin accent line at bottom
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(36, 38, letter[0] - 36, 38)
    canvas.restoreState()


def on_first_page(canvas, doc):
    """Draw background for the first page (same as others)."""
    on_page(canvas, doc)


def escape_xml(text):
    """Escape XML special characters for reportlab paragraphs."""
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    return text


def apply_inline_formatting(text):
    """Convert markdown inline formatting to reportlab XML tags."""
    # Bold + italic
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'<b><i>\1</i></b>', text)
    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Italic
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    # Inline code
    text = re.sub(r'`([^`]+)`',
        lambda m: f'<font face="Courier" color="#{ACCENT2.hexval()[2:]}">{m.group(1)}</font>',
        text)
    return text


def parse_table(lines):
    """Parse markdown table lines into rows of cells."""
    rows = []
    for line in lines:
        line = line.strip()
        if line.startswith('|'):
            cells = [c.strip() for c in line.split('|')[1:-1]]
            # Skip separator rows (---|---)
            if cells and all(re.match(r'^[-:]+$', c) for c in cells):
                continue
            rows.append(cells)
    return rows


def build_table_flowable(rows, styles):
    """Build a reportlab Table from parsed rows."""
    if not rows:
        return None

    header = rows[0]
    body = rows[1:] if len(rows) > 1 else []

    # Build cell data with Paragraphs
    data = []
    header_row = [Paragraph(escape_xml(c), styles['table_header']) for c in header]
    data.append(header_row)

    for row in body:
        # Pad short rows
        while len(row) < len(header):
            row.append('')
        cell_row = [Paragraph(apply_inline_formatting(escape_xml(c)), styles['table_cell']) for c in row[:len(header)]]
        data.append(cell_row)

    num_cols = len(header)
    col_width = (letter[0] - 2 * inch) / num_cols
    col_widths = [col_width] * num_cols

    # Adjust column widths for common patterns
    if num_cols == 2:
        col_widths = [2.2 * inch, 4.3 * inch]
    elif num_cols == 3:
        col_widths = [1.5 * inch, 2.5 * inch, 2.5 * inch]
    elif num_cols == 6:
        col_widths = [0.4*inch, 1.2*inch, 1.8*inch, 0.8*inch, 0.7*inch, 0.7*inch]

    table = Table(data, colWidths=col_widths, repeatRows=1)
    style_commands = [
        ('BACKGROUND', (0, 0), (-1, 0), BG_TABLE_H),
        ('TEXTCOLOR', (0, 0), (-1, 0), ACCENT2),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    # Alternate row colors
    for i in range(1, len(data)):
        bg = BG_TABLE_R if i % 2 == 1 else BG_TABLE_A
        style_commands.append(('BACKGROUND', (0, i), (-1, i), bg))

    table.setStyle(TableStyle(style_commands))
    return table


def convert_md_to_pdf(md_path, pdf_path):
    """Main conversion function."""
    styles = build_styles()

    md_text = Path(md_path).read_text(encoding='utf-8')
    lines = md_text.split('\n')

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        title="TALLOW 100-Agent Expanded Operations Manual",
        author="RAMSAD (001) — Director-General",
        subject="TOP SECRET // TALLOW // NOFORN",
    )

    story = []
    i = 0
    in_code_block = False
    code_lines = []
    in_table = False
    table_lines = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # ── Code blocks ──
        if stripped.startswith('```'):
            if in_code_block:
                # End code block
                code_text = '\n'.join(code_lines)
                code_text = escape_xml(code_text)
                # Wrap long lines
                wrapped = []
                for cl in code_text.split('\n'):
                    while len(cl) > 95:
                        wrapped.append(cl[:95])
                        cl = cl[95:]
                    wrapped.append(cl)
                code_text = '\n'.join(wrapped)
                story.append(Preformatted(code_text, styles['code']))
                code_lines = []
                in_code_block = False
            else:
                # Flush table if active
                if in_table:
                    rows = parse_table(table_lines)
                    tbl = build_table_flowable(rows, styles)
                    if tbl:
                        story.append(tbl)
                        story.append(Spacer(1, 6))
                    table_lines = []
                    in_table = False
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # ── Tables ──
        if stripped.startswith('|') and '|' in stripped[1:]:
            if not in_table:
                in_table = True
                table_lines = []
            table_lines.append(stripped)
            i += 1
            continue
        elif in_table:
            rows = parse_table(table_lines)
            tbl = build_table_flowable(rows, styles)
            if tbl:
                story.append(tbl)
                story.append(Spacer(1, 6))
            table_lines = []
            in_table = False

        # ── Blank lines ──
        if not stripped:
            i += 1
            continue

        # ── Horizontal rules ──
        if re.match(r'^-{3,}$', stripped) or re.match(r'^\*{3,}$', stripped):
            story.append(Spacer(1, 6))
            story.append(HRFlowable(
                width="100%", thickness=0.5, color=BORDER,
                spaceAfter=6, spaceBefore=6
            ))
            i += 1
            continue

        # ── ASCII art division headers (# ═══ or # ██) ──
        if stripped.startswith('#') and ('═' in stripped or '██' in stripped or '╔' in stripped or '╚' in stripped):
            text = stripped.lstrip('#').strip()
            text = escape_xml(text)
            story.append(Paragraph(text, styles['divider_text']))
            i += 1
            continue

        # ── Comment-style lines (# lines that are division banners) ──
        if re.match(r'^#\s+[A-Z╔╚║├└┌┐│]', stripped) and not stripped.startswith('##'):
            text = stripped.lstrip('#').strip()
            text = escape_xml(text)
            story.append(Paragraph(text, styles['divider_text']))
            i += 1
            continue

        # ── Headings ──
        if stripped.startswith('# ') and not stripped.startswith('## '):
            text = stripped[2:].strip()
            text = apply_inline_formatting(escape_xml(text))
            story.append(Paragraph(text, styles['h1']))
            i += 1
            continue

        if stripped.startswith('## '):
            text = stripped[3:].strip()
            text = apply_inline_formatting(escape_xml(text))
            story.append(Spacer(1, 8))
            story.append(Paragraph(text, styles['h2']))
            i += 1
            continue

        if stripped.startswith('### '):
            text = stripped[4:].strip()
            text = apply_inline_formatting(escape_xml(text))
            story.append(Paragraph(text, styles['h3']))
            i += 1
            continue

        # ── Blockquotes ──
        if stripped.startswith('>'):
            text = stripped.lstrip('>').strip()
            text = apply_inline_formatting(escape_xml(text))
            story.append(Paragraph(text, styles['blockquote']))
            i += 1
            continue

        # ── Bullet points ──
        if re.match(r'^[-*]\s', stripped):
            text = stripped[2:].strip()
            text = apply_inline_formatting(escape_xml(text))
            story.append(Paragraph(f"&bull; {text}", styles['bullet']))
            i += 1
            continue

        # ── Numbered lists ──
        m = re.match(r'^(\d+)\.\s', stripped)
        if m:
            num = m.group(1)
            text = stripped[len(m.group(0)):].strip()
            text = apply_inline_formatting(escape_xml(text))
            story.append(Paragraph(f"{num}. {text}", styles['bullet']))
            i += 1
            continue

        # ── Star footnote lines ──
        if stripped.startswith('★'):
            text = apply_inline_formatting(escape_xml(stripped))
            story.append(Paragraph(text, styles['blockquote']))
            i += 1
            continue

        # ── Regular paragraphs ──
        text = apply_inline_formatting(escape_xml(stripped))
        story.append(Paragraph(text, styles['body']))
        i += 1

    # Flush remaining table
    if in_table:
        rows = parse_table(table_lines)
        tbl = build_table_flowable(rows, styles)
        if tbl:
            story.append(tbl)

    # Build PDF
    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_page)
    print(f"PDF created: {pdf_path}")
    print(f"Pages: ~{doc.page}")


if __name__ == "__main__":
    md_file = Path(r"c:\Users\aamir\Documents\Apps\Tallow\TALLOW_100_AGENT_EXPANDED_OPERATIONS_MANUAL.md")
    pdf_file = md_file.with_suffix('.pdf')
    convert_md_to_pdf(md_file, pdf_file)
