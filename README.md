# SourceNav

**Research, organized by project.**

SourceNav is a lightweight Chrome extension for organizing web research into project-based collections.

Instead of dumping useful links into one huge bookmarks folder or reading list, SourceNav lets you create focused projects, save the page you are currently viewing, and quickly browse the sources attached to each project.

## Features

- Create multiple research projects
- Choose an active project
- Save the current browser page to the active project
- Store the page title and URL
- See how many pages are saved in each project
- Hover over a project to preview its saved pages in a left-side flyout
- Click a project to keep it active
- Open saved pages in a new tab
- Rename projects
- Delete projects
- Edit a saved page's display name and URL
- Remove individual saved pages
- Persistent local storage with `chrome.storage.local`
- Dark, compact popup interface

## How It Works

SourceNav keeps research organized around **projects**.

For example:

```text
AI Research
├── Attention Is All You Need
├── OpenAI Research Index
└── LLM Evaluation Methods

Apartment Hunting
├── Apartment Listing
├── Neighborhood Guide
└── Rental Requirements
```

Each saved page is linked to a project using a unique project ID, so renaming a project does not break its saved sources.

## Installation

SourceNav is currently designed to be loaded as an unpacked Chrome extension during development.

### 1. Download or clone the repository

```bash
git clone https://github.com/patgrady64/SourceNav.git
```

Then open the project folder.

### 2. Open Chrome Extensions

In Chrome, go to:

```text
chrome://extensions
```

### 3. Enable Developer Mode

Turn on **Developer mode** in the upper-right corner.

### 4. Load SourceNav

Click:

```text
Load unpacked
```

Select the SourceNav project folder.

### 5. Pin SourceNav

Click the Extensions button in the Chrome toolbar and pin **SourceNav** for quick access.

## Using SourceNav

### Create a Project

Open SourceNav, enter a project name, and click **Add**.

Examples:

```text
AI Research
Apartment Hunting
Sci-Fi Lore
Cybersecurity Study
```

### Select a Project

Click a project to make it the active project.

The active project is where newly saved pages will be stored.

### Save the Current Page

Browse to a page you want to keep.

Open SourceNav and click:

```text
Save to Active Project
```

SourceNav stores the page title, URL, save date, and the ID of the project it belongs to.

### View Saved Pages

Hover over a project to preview its saved pages in the flyout panel.

Clicking the project keeps it active.

Each project also displays the number of pages it currently contains.

### Open a Saved Page

Click the saved page title to open it in a new Chrome tab.

### Edit a Project

Click **Edit** next to a project to rename it.

Because saved pages are linked by project ID instead of project name, renaming a project does not affect its saved pages.

### Edit a Saved Page

Click **Edit** next to a saved page to change:

- Its display name
- Its stored URL

### Remove a Saved Page

Click **Remove** next to an individual source.

Only that saved page is removed.

### Delete a Project

Click **Delete** next to a project.

Deleting a project also removes the pages stored inside that project.

## Project Structure

```text
SourceNav/
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
└── README.md
```

## Permissions

SourceNav currently requests:

### `storage`

Used to save projects, saved pages, and the currently active project in Chrome's local extension storage.

### `activeTab`

Used to read the title and URL of the tab you are currently viewing when SourceNav is opened.

SourceNav does not currently require a server or online account.

## Data Storage

SourceNav is currently **local-first**.

Project and source data is stored using:

```javascript
chrome.storage.local
```

This means the current version does not send your project data to a SourceNav server.

## Current Development Status

SourceNav is under active development.

The current version focuses on the basic project-and-source workflow:

```text
Create Project
      ↓
Select Project
      ↓
Browse Web
      ↓
Save Current Page
      ↓
View / Edit / Remove Sources
```

## Planned Features

The larger SourceNav concept includes:

- Duplicate URL detection across projects
- Right-click **Add to Project** context menu
- Keyboard shortcut for quick capture
- Quick notes for saved sources
- Search across projects and saved pages
- Tags
- Local article text or HTML caching
- Highlighting text directly on webpages
- Side-panel annotations
- Export to Markdown
- Export to JSON
- Export to BibTeX
- Better source metadata
- Research backup and restore

These features are planned and are **not all implemented yet**.

## Technology

SourceNav is built with:

- HTML
- CSS
- JavaScript
- Chrome Extensions Manifest V3
- Chrome Storage API
- Chrome Tabs API

No framework is required.

## Development

After changing extension files, open:

```text
chrome://extensions
```

and click **Reload** on SourceNav if Chrome has not automatically picked up the change.

Changes to `manifest.json` always require an extension reload.

## Philosophy

SourceNav is built around a simple idea:

> A useful source is more valuable when it stays connected to the project and context it belongs to.

Instead of saving first and organizing later, SourceNav makes organization part of the capture process.

---

**SourceNav**  
*Research, organized by project.*
