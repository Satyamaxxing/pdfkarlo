"""Convert Markdown documentation files to high-quality PDF reports using Chrome Headless."""

import os
import re
import shutil
import subprocess
import sys
import markdown
import pikepdf

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

CSS_STYLES = """
@page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    @bottom-right {
        content: counter(page);
        font-size: 9pt;
        color: #64748b;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 10.5pt;
    margin: 0;
    padding: 0;
}

h1 {
    font-size: 24pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2.5px solid #10b981;
    padding-bottom: 8px;
    margin-top: 0;
    margin-bottom: 16px;
    page-break-after: avoid;
}

h2 {
    font-size: 16pt;
    font-weight: 700;
    color: #1e293b;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 24px;
    margin-bottom: 12px;
    page-break-after: avoid;
}

h3 {
    font-size: 13pt;
    font-weight: 600;
    color: #334155;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
}

h4 {
    font-size: 11pt;
    font-weight: 600;
    color: #475569;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
}

p {
    margin-top: 0;
    margin-bottom: 10px;
}

blockquote {
    margin: 12px 0;
    padding: 10px 16px;
    background-color: #f8fafc;
    border-left: 4px solid #10b981;
    color: #475569;
    border-radius: 0 6px 6px 0;
}

blockquote p {
    margin: 0;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 9pt;
    page-break-inside: avoid;
}

th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
}

td {
    padding: 7px 10px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
}

tr:nth-child(even) td {
    background-color: #f8fafc;
}

code {
    font-family: "Consolas", "Courier New", monospace;
    font-size: 9pt;
    background-color: #f1f5f9;
    padding: 2px 5px;
    border-radius: 4px;
    color: #0f172a;
    border: 1px solid #e2e8f0;
}

pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 14px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 8.5pt;
    line-height: 1.45;
    margin: 14px 0;
    page-break-inside: avoid;
}

pre code {
    background-color: transparent;
    color: #f8fafc;
    padding: 0;
    border: none;
    font-size: inherit;
}

ul, ol {
    margin-top: 0;
    margin-bottom: 12px;
    padding-left: 24px;
}

li {
    margin-bottom: 4px;
}

hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 24px 0;
}

img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    margin: 14px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 8pt;
    font-weight: 600;
    background-color: #d1fae5;
    color: #065f46;
}

.footer-notice {
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    font-size: 8pt;
    color: #94a3b8;
    text-align: center;
}
"""


def convert_markdown_to_pdf(md_path: str, pdf_path: str, title: str):
    print(f"Converting {os.path.basename(md_path)} -> {os.path.basename(pdf_path)}...")

    with open(md_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    # Preprocess mermaid diagrams into clean code blocks or visual indicators
    md_content = re.sub(
        r"```mermaid(.*?)```",
        r"```\n[Architecture Diagram: \1]\n```",
        md_content,
        flags=re.DOTALL,
    )

    html_body = markdown.markdown(
        md_content,
        extensions=["tables", "fenced_code", "toc", "codehilite"],
    )

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <style>
{CSS_STYLES}
    </style>
</head>
<body>
{html_body}
<div class="footer-notice">
    PDFKarlo Platform &bull; Technical Architecture Documentation &bull; Generated November 2026
</div>
</body>
</html>
"""

    temp_html_path = pdf_path.replace(".pdf", ".temp.html")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(full_html)

    # Convert to PDF via Chrome Headless
    html_url = "file:///" + os.path.abspath(temp_html_path).replace("\\", "/")
    abs_pdf_path = os.path.abspath(pdf_path)

    cmd = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={abs_pdf_path}",
        html_url,
    ]

    proc = subprocess.run(cmd, capture_output=True, text=True)
    import time
    for _ in range(10):
        try:
            if os.path.exists(temp_html_path):
                os.remove(temp_html_path)
            break
        except PermissionError:
            time.sleep(0.2)

    if not os.path.exists(abs_pdf_path) or os.path.getsize(abs_pdf_path) == 0:
        raise RuntimeError(f"Failed to generate PDF for {md_path}. Return code: {proc.returncode}")

    size_kb = round(os.path.getsize(abs_pdf_path) / 1024, 1)
    print(f"  [SUCCESS] Created {os.path.basename(pdf_path)} ({size_kb} KB)")


def main():
    docs = [
        (
            r"E:\REA\documentation\01-project-overview.md",
            r"E:\REA\documentation\pdf\Project-Overview.pdf",
            "PDFKarlo Platform — Project Overview",
        ),
        (
            r"E:\REA\documentation\02-sprint-1-completion-report.md",
            r"E:\REA\documentation\pdf\Sprint-1-Completion-Report.pdf",
            "PDFKarlo Platform — Sprint 1 Completion Report",
        ),
        (
            r"E:\REA\documentation\04-developer-setup-handbook.md",
            r"E:\REA\documentation\pdf\Developer-Setup-Handbook.pdf",
            "PDFKarlo Platform — Developer Setup Handbook",
        ),
        (
            r"E:\REA\documentation\08-sprint-2-merge-pdf-report.md",
            r"E:\REA\documentation\pdf\Sprint-2-Merge-PDF-Report.pdf",
            "PDFKarlo Platform — Sprint 2 Merge PDF Report",
        ),
        (
            r"E:\REA\documentation\09-sprint-2-split-pdf-report.md",
            r"E:\REA\documentation\pdf\Sprint-2-Split-PDF-Report.pdf",
            "PDFKarlo Platform — Sprint 2 Split PDF Report",
        ),
    ]

    generated_pdfs = []
    for md_file, pdf_file, title in docs:
        if not os.path.exists(md_file):
            print(f"Error: Markdown file not found: {md_file}", file=sys.stderr)
            sys.exit(1)
        convert_markdown_to_pdf(md_file, pdf_file, title)
        generated_pdfs.append(pdf_file)

    # Merge all into complete documentation
    complete_pdf_path = r"E:\REA\documentation\pdf\PDFKarlo-Platform-Complete-Documentation.pdf"
    print(f"\nMerging all reports into {os.path.basename(complete_pdf_path)}...")
    combined = pikepdf.Pdf.new()
    for p in generated_pdfs:
        with pikepdf.Pdf.open(p) as src:
            combined.pages.extend(src.pages)
    combined.save(complete_pdf_path, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    size_kb = round(os.path.getsize(complete_pdf_path) / 1024, 1)
    print(f"  [SUCCESS] Created {os.path.basename(complete_pdf_path)} ({size_kb} KB)")
    generated_pdfs.append(complete_pdf_path)

    # Sync to downloads directory
    download_dir = r"C:\Users\Satyam Kumar\Downloads\REA-ilovepdf"
    if os.path.exists(download_dir):
        print(f"\nCopying updated PDF artifacts to {download_dir}...")
        for pdf_path in generated_pdfs:
            dest = os.path.join(download_dir, os.path.basename(pdf_path))
            shutil.copy2(pdf_path, dest)
            print(f"  [COPIED] {os.path.basename(pdf_path)}")

    print("\nAll requested PDF documentation artifacts generated and synced successfully.")


if __name__ == "__main__":
    main()
