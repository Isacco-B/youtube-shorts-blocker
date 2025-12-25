# YouTube Shorts Blocker

A simple Chrome extension that blocks YouTube Shorts to help you stay focused and take back control of your YouTube experience.

## Features

- Removes Shorts from:
  - Home feed
  - Sidebar / guide
  - Video grids and shelves
- Automatically redirects `/shorts/` pages to the standard watch page
- One-click enable / disable toggle
- Works automatically on YouTube pages
- Lightweight and fast (uses MutationObserver)

## How it works

The extension detects and removes YouTube elements related to Shorts using DOM selectors.
It continuously observes page changes to block Shorts even when YouTube loads content dynamically.

## Usage

1. Install the extension in Chrome
2. Open YouTube
3. Use the popup to enable or disable Shorts blocking

## License

MIT
