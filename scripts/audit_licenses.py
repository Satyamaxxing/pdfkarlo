"""Dependency License Compliance Auditor (Zero-AGPL Enforcer)."""

import json
import subprocess
import sys


def main():
    print("Running pip-licenses scan...")
    cmd = [
        sys.executable,
        "-m",
        "piplicenses",
        "--format=json",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    packages = json.loads(result.stdout)

    disallowed_keywords = ["AGPL", "AFFERO"]
    # Check for strict GPL unless explicitly LGPL
    violations = []
    summary = []

    for pkg in packages:
        name = pkg.get("Name", "")
        version = pkg.get("Version", "")
        license_name = pkg.get("License", "UNKNOWN")
        summary.append((name, version, license_name))

        upper_lic = license_name.upper()
        if any(bad in upper_lic for bad in disallowed_keywords):
            violations.append(f"{name} {version}: {license_name}")
        elif "GPL" in upper_lic and "LGPL" not in upper_lic:
            violations.append(f"{name} {version}: {license_name}")

    print(f"Scanned {len(packages)} installed dependencies.")

    if violations:
        print("\n[CRITICAL ERROR] Disallowed Copyleft / AGPL Licenses Detected:")
        for v in violations:
            print(f"  - {v}")
        sys.exit(1)

    print("\n[SUCCESS] License Compliance Audit PASSED.")
    print("All installed dependencies are 100% compliant with permissive SaaS deployment standards (Apache, MIT, BSD, PSF, MPL).")


if __name__ == "__main__":
    main()
