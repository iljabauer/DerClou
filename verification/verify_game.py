from playwright.sync_api import sync_playwright, expect
import time

def verify_game():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to the game
        # Check port in dev_output_2.log
        page.goto("http://localhost:8080/")

        # Wait for canvas
        page.wait_for_selector("canvas")

        time.sleep(2) # Wait for preload

        # Screenshot Menu
        page.screenshot(path="verification/menu.png")
        print("Menu screenshot taken")

        # Press Enter to start game
        page.keyboard.press("Enter")

        time.sleep(1) # Transition

        # Screenshot Game
        page.screenshot(path="verification/game.png")
        print("Game screenshot taken")

        browser.close()

if __name__ == "__main__":
    verify_game()
