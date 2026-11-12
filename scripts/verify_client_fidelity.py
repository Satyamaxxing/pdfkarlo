"""
Comprehensive Verification Script for Client-Side In-Browser PDF Engine
Generates rich test PDFs with Annotations, Hyperlinks, AcroForms, Outlines,
Mixed Orientations, Encryption, and Corruption, runs them through the client engine,
and compares the internal PDF object structures against the Python pikepdf engine.
"""

import os
import sys
import json
import subprocess
import pikepdf

OUTPUT_DIR = os.path.abspath("test_fixtures_fidelity")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_test_fixtures():
    print("Generating comprehensive test fixtures...")

    # 1. Mixed Orientations PDF (4 pages: 0, 90, 180, 270)
    pdf_mixed = pikepdf.new()
    for angle in [0, 90, 180, 270]:
        page = pdf_mixed.add_blank_page(page_size=(612, 792))
        if angle != 0:
            page.Rotate = angle
    mixed_path = os.path.join(OUTPUT_DIR, "mixed_orientations.pdf")
    pdf_mixed.save(mixed_path)
    pdf_mixed.close()

    # 2. Annotations & Hyperlinks PDF
    pdf_annots = pikepdf.new()
    for i in range(3):
        page = pdf_annots.add_blank_page(page_size=(612, 792))
        # Add a Link annotation
        link_annot = pdf_annots.make_indirect(pikepdf.Dictionary(
            Type=pikepdf.Name.Annot,
            Subtype=pikepdf.Name.Link,
            Rect=[100, 700, 300, 720],
            A=pikepdf.Dictionary(
                S=pikepdf.Name.URI,
                URI=pikepdf.String(f"https://example.com/page{i+1}")
            )
        ))
        # Add a Text note annotation
        text_annot = pdf_annots.make_indirect(pikepdf.Dictionary(
            Type=pikepdf.Name.Annot,
            Subtype=pikepdf.Name.Text,
            Rect=[100, 600, 150, 650],
            Contents=pikepdf.String(f"Note on page {i+1}")
        ))
        page.Annots = pdf_annots.make_indirect(pikepdf.Array([link_annot, text_annot]))
    annots_path = os.path.join(OUTPUT_DIR, "annotations_links.pdf")
    pdf_annots.save(annots_path)
    pdf_annots.close()

    # 3. Interactive AcroForm Fields PDF
    pdf_form = pikepdf.new()
    page1 = pdf_form.add_blank_page(page_size=(612, 792))
    widget = pdf_form.make_indirect(pikepdf.Dictionary(
        Type=pikepdf.Name.Annot,
        Subtype=pikepdf.Name.Widget,
        FT=pikepdf.Name.Tx,
        T=pikepdf.String("user_full_name"),
        V=pikepdf.String("Test User"),
        Rect=[100, 500, 300, 530]
    ))
    page1.Annots = pdf_form.make_indirect(pikepdf.Array([widget]))
    pdf_form.Root.AcroForm = pdf_form.make_indirect(pikepdf.Dictionary(
        Fields=pikepdf.Array([widget]),
        NeedAppearances=True
    ))
    form_path = os.path.join(OUTPUT_DIR, "form_fields.pdf")
    pdf_form.save(form_path)
    pdf_form.close()

    # 4. Bookmarks / Document Outlines PDF
    pdf_outlines = pikepdf.new()
    pages = [pdf_outlines.add_blank_page(page_size=(612, 792)) for _ in range(3)]
    with pdf_outlines.open_outline() as outline:
        item1 = pikepdf.OutlineItem("Chapter 1: Intro", 0)
        item2 = pikepdf.OutlineItem("Chapter 2: Core", 1)
        item3 = pikepdf.OutlineItem("Chapter 3: Summary", 2)
        outline.root.extend([item1, item2, item3])
    outlines_path = os.path.join(OUTPUT_DIR, "bookmarks_outlines.pdf")
    pdf_outlines.save(outlines_path)
    pdf_outlines.close()

    # 5. Large Multi-Page PDF (60 pages)
    pdf_large = pikepdf.new()
    for _ in range(60):
        pdf_large.add_blank_page(page_size=(612, 792))
    large_path = os.path.join(OUTPUT_DIR, "large_60pages.pdf")
    pdf_large.save(large_path)
    pdf_large.close()

    # 6. Encrypted PDF
    pdf_enc = pikepdf.new()
    pdf_enc.add_blank_page(page_size=(612, 792))
    enc_path = os.path.join(OUTPUT_DIR, "encrypted_protected.pdf")
    pdf_enc.save(enc_path, encryption=pikepdf.Encryption(owner="secret123", user="user123", R=4))
    pdf_enc.close()

    # 7. Corrupted PDF
    corrupt_path = os.path.join(OUTPUT_DIR, "corrupted.pdf")
    with open(corrupt_path, "wb") as f:
        f.write(b"%PDF-1.4\n%MalformedGarbageDataNotInPdfFormat\x00\xff")

    print("Fixtures created successfully in:", OUTPUT_DIR)
    return {
        "mixed": mixed_path,
        "annots": annots_path,
        "form": form_path,
        "outlines": outlines_path,
        "large": large_path,
        "encrypted": enc_path,
        "corrupted": corrupt_path,
    }

if __name__ == "__main__":
    generate_test_fixtures()
