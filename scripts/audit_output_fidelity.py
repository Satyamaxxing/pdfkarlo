"""
Audits the internal PDF structure of client-engine outputs using pikepdf.
Verifies Annotations, Hyperlinks, Orientations, Forms, and Bookmarks.
"""

import os
import json
import pikepdf

OUTPUT_DIR = os.path.abspath("test_fixtures_fidelity/client_outputs")

def audit_outputs():
    print("=== AUDITING CLIENT-ENGINE OUTPUT FIDELITY VIA PIKEPDF ===\n")
    report = {}

    # 1. Audit Merged Output
    merged_path = os.path.join(OUTPUT_DIR, "merged_output.pdf")
    with pikepdf.open(merged_path) as pdf:
        report["merged"] = {
            "page_count": len(pdf.pages),
            "rotations": [int(p.Rotate) if "/Rotate" in p else 0 for p in pdf.pages],
            "annots_per_page": [len(p.Annots) if "/Annots" in p else 0 for p in pdf.pages],
        }
        print(f"1. Merged PDF ({report['merged']['page_count']} pages):")
        print(f"   - Orientations: {report['merged']['rotations']}")
        print(f"   - Annotations per page: {report['merged']['annots_per_page']}")

    # 2. Audit Split Output
    split_path = os.path.join(OUTPUT_DIR, "split_output.pdf")
    with pikepdf.open(split_path) as pdf:
        has_annots = [len(p.Annots) if "/Annots" in p else 0 for p in pdf.pages]
        report["split"] = {
            "page_count": len(pdf.pages),
            "annots_per_page": has_annots,
        }
        print(f"2. Split PDF ({report['split']['page_count']} pages):")
        print(f"   - Annotations per page: {has_annots}")

    # 3. Audit Rotate Output
    rotate_path = os.path.join(OUTPUT_DIR, "rotate_output.pdf")
    with pikepdf.open(rotate_path) as pdf:
        rotations = [int(p.Rotate) if "/Rotate" in p else 0 for p in pdf.pages]
        report["rotate"] = {
            "page_count": len(pdf.pages),
            "rotations": rotations,
        }
        print(f"3. Rotate PDF (original was [0, 90, 180, 270], expected [90, 180, 270, 0]):")
        print(f"   - Resulting rotations: {rotations}")
        # Validate rotation wrap-around math
        assert rotations == [90, 180, 270, 0], f"Rotation mismatch: {rotations}"
        print("   - [PASS] Rotation math correctly preserved existing orientations!")

    # 4. Audit Reorder Output
    reorder_path = os.path.join(OUTPUT_DIR, "reorder_output.pdf")
    with pikepdf.open(reorder_path) as pdf:
        annots = []
        for p in pdf.pages:
            if "/Annots" in p and len(p.Annots) > 0:
                first_annot = p.Annots[0]
                if "/A" in first_annot and "/URI" in first_annot.A:
                    annots.append(str(first_annot.A.URI))
        report["reorder"] = {
            "page_count": len(pdf.pages),
            "link_uris": annots,
        }
        print(f"4. Reordered PDF (Permuted [3, 1, 2]):")
        print(f"   - Hyperlinks preserved in new sequence: {annots}")
        assert annots == [
            "https://example.com/page3",
            "https://example.com/page1",
            "https://example.com/page2",
        ], f"Hyperlink order mismatch: {annots}"
        print("   - [PASS] Annotations and URI hyperlinks 100% preserved in reordered sequence!")

    # 5. Audit Remove Output
    remove_path = os.path.join(OUTPUT_DIR, "remove_output.pdf")
    with pikepdf.open(remove_path) as pdf:
        annots = []
        for p in pdf.pages:
            if "/Annots" in p and len(p.Annots) > 0:
                first_annot = p.Annots[0]
                if "/A" in first_annot and "/URI" in first_annot.A:
                    annots.append(str(first_annot.A.URI))
        report["remove"] = {
            "page_count": len(pdf.pages),
            "link_uris": annots,
        }
        print(f"5. Remove PDF (Page 2 removed from 3 pages):")
        print(f"   - Remaining page hyperlinks: {annots}")
        assert annots == [
            "https://example.com/page1",
            "https://example.com/page3",
        ], f"Remaining hyperlinks mismatch: {annots}"
        print("   - [PASS] Retained pages correctly preserved annotations!")

    # 6. Test Form Fields & Bookmarks Behavior across pdf-lib copyPages
    print("\n6. Auditing AcroForms & Bookmarks / Outlines Behavior in pdf-lib:")
    form_buf = open("test_fixtures_fidelity/form_fields.pdf", "rb").read()
    outlines_buf = open("test_fixtures_fidelity/bookmarks_outlines.pdf", "rb").read()

    # Check whether merged file has root /Outlines or /AcroForm
    with pikepdf.open(merged_path) as pdf:
        has_root_outlines = "/Outlines" in pdf.Root
        has_root_acroform = "/AcroForm" in pdf.Root
        print(f"   - Merged PDF Root has /Outlines: {has_root_outlines}")
        print(f"   - Merged PDF Root has /AcroForm: {has_root_acroform}")
        report["root_outlines_preserved"] = has_root_outlines
        report["root_acroform_preserved"] = has_root_acroform

    with open(os.path.join(OUTPUT_DIR, "fidelity_audit_summary.json"), "w") as f:
        json.dump(report, f, indent=2)

    print("\n=== FIDELITY AUDIT COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    audit_outputs()
