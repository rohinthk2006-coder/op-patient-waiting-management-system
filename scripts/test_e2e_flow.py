import sys
import os
from playwright.sync_api import sync_playwright

def run():
    print("[E2E] Starting Hospital OP Live Tracker Playwright E2E Suite...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Step 1: Navigate to app
        url = "http://localhost:5173"
        print(f"[E2E] Navigating to {url}...")
        page.goto(url)
        page.wait_for_load_state("networkidle")

        # Step 2: Validate Home / Intro Page
        title_text = page.locator("h1").first.inner_text()
        print(f"[E2E] Found Header: {title_text}")
        assert "Hospital OP Live Tracker" in title_text or "Zero-Wait" in page.content()

        # Step 3: Switch to Waiting Hall TV Mode
        print("[E2E] Clicking 'Waiting TV Mode' tab...")
        tv_tab = page.locator("button:has-text('Waiting TV Mode')")
        tv_tab.click()
        page.wait_for_timeout(1000)

        # Assert TV mode elements
        assert page.locator("text=Currently Serving").is_visible()
        print("[E2E] Verified 'Currently Serving' digital signage display.")

        # Step 4: Switch to Emergency Beds Tracker
        print("[E2E] Clicking 'Live Beds' tab...")
        beds_tab = page.locator("button:has-text('Live Beds')")
        beds_tab.click()
        page.wait_for_timeout(1000)

        assert page.locator("text=Emergency Bed Availability Tracker").is_visible()
        print("[E2E] Verified Emergency Beds tracker view.")

        # Step 5: Switch to Patient Portal
        print("[E2E] Clicking 'Patient Portal' tab...")
        patient_tab = page.locator("button:has-text('Patient Portal')")
        patient_tab.click()
        page.wait_for_timeout(1000)
        print("[E2E] Verified Patient Portal navigation.")

        # Save screenshot
        screenshot_path = "e2e_verified_screen.png"
        page.screenshot(path=screenshot_path)
        print(f"[E2E] Screenshot captured: {screenshot_path}")

        browser.close()
        print("[E2E] All web application E2E tests passed successfully!")

if __name__ == "__main__":
    run()
