# How to refresh a page with the latest data from the Vault

**Who this is for:** the National Check-in Week content team. No technical knowledge needed.

**What it does:** the website can read the documents in our Vault (reports, statistics, research) and suggest updated text for a page. **Nothing changes on the live website until you review it and click Publish.** Anything you publish can be undone with one click.

---

## The 60-second version

1. Make sure the Vault documents you want used are **Ready** and have a **Source URL**.
2. Open the page in the admin and go to its **Vault Refresh** tab.
3. Click **Refresh from vault** and wait up to a minute.
4. **Review** each suggested change. Tick the ones you want, untick the ones you don't.
5. Click **Publish**.
6. **Check the live page** (the checklist in Part 5).
7. Don't like it? Click **Revert to this version**.

---

## Before you start

- You need an admin login. Sign in at **https://nationalcheckinweek.com/admin/login**.
- Use a laptop or desktop, not a phone.
- **Finish any other editing on that page first.** If a page has unsaved edits, the Refresh button is switched off. Save or discard your edits, then come back.
- Only one person should refresh a given page at a time.

> 📸 **Screenshot 1: Admin login page.** *(save as `images/01-login.png`)*

---

## Part 1: Get the Vault ready

The refresh can only use documents that are in the Vault and fully processed. The links that appear at the bottom of the public page come from these documents, so this step matters.

1. In the left menu, under **AI**, click **Vault library**.
2. Find your document. Its status must say **Ready**. If it says Queued, Extracting, Chunking or Failed, wait a few minutes or ask your developer. The refresh ignores documents that are not Ready.
3. Click the document to open it.
4. Fill in these boxes. Each one saves automatically when you click out of it (you'll briefly see "Saving…"):

| Box | What to enter | Example |
|---|---|---|
| **Author** | Who published it | AIHW |
| **Year** | Year of the data | 2025 |
| **Publisher** | Organisation (optional) | Australian Institute of Health and Welfare |
| **Source URL** | The public web link to the report. **This is what makes the footer link clickable.** | https://www.aihw.gov.au/… |
| **Page / locator** | Optional | p. 14 |

5. Check the link opens the right report when you paste it into a new browser tab.

**What visitors will see:** if a document has a Source URL, it shows at the bottom of the page as a clickable link. If it has no Source URL, the document name still shows, but it can't be clicked.

> 📸 **Screenshot 2: Vault library list showing a "Ready" document.** *(save as `images/02-vault-list.png`)*
> 📸 **Screenshot 3: An open Vault document with Author, Year, Publisher and Source URL filled in.** *(save as `images/03-vault-metadata.png`)*

---

## Part 2: Choose the page to refresh

There are four types of page. Each is refreshed from its own place in the admin.

| Page type | Where to find it in the admin | What gets refreshed |
|---|---|---|
| **Area page** (e.g. Melbourne) | Left menu → **Areas** → click the area | Overview, Prevention, Key stats |
| **State overview page** (e.g. Victoria) | Left menu → **States & Data** → click the state | The state subtitle and the stat and description on each issue card |
| **State issue page** (e.g. Bullying in Victoria) | Same state, then choose it in the **Page to refresh** list | That state's headline stat and description for that issue |
| **National issue page** (e.g. Bullying) | Left menu → **Issues** → click the issue | Short description, Definition, Australian data, Mechanisms, Anchor stat |

### Which updates also change other pages?

| If you refresh… | …these pages change too | These do not change |
|---|---|---|
| A **national issue** | The shared definition, data and mechanisms text on every state's page for that issue | State-specific figures, state cards, area pages |
| A **state issue** page | That issue's card on the state overview page | The national issue page, area pages |
| A **state overview** page | That state's issue pages (they share the same figures) | National issue pages, area pages |
| An **area** page | Only itself | Everything else |

> 📸 **Screenshot 4: Admin left menu with Areas, States & Data, Issues and the AI → Vault library highlighted.** *(save as `images/04-menu.png`)*

---

## Part 3: Run the refresh

1. Open the page in the admin (see Part 2).
2. Click the **Vault Refresh** tab. It sits at the top, next to the other tabs. *(On a State, first choose the page to refresh in the **Page to refresh** list.)*
3. Click **Refresh from vault**.
4. Wait. The button says "Searching vault…" and can take up to a minute. Don't close the page or click again.
5. The **Review changes** screen appears. Nothing has been published yet.

If you see a red message, jump to **Troubleshooting** at the end.

> 📸 **Screenshot 5: The Vault Refresh tab before clicking, showing the Refresh from vault button and "Version history".** *(save as `images/05-refresh-tab.png`)*
> 📸 **Screenshot 6: The "Searching vault…" state.** *(save as `images/06-searching.png`)*

---

## Part 4: Review the changes (the important step)

The review screen shows, for each field, the **Current** text on the left and the **Proposed** text on the right.

### Fields

- A field with the tag **Changed** has a tickbox, ticked by default.
- A field with the tag **No change** means the Vault has nothing newer. It is greyed out and won't be touched.
- **Untick** any field you are not happy with. Only ticked fields are published.

### What to check in each proposed field

- ✅ **Numbers match the document.** Open the source document and check at least one or two figures.
- ✅ **The year of the data is stated** where a statistic appears.
- ✅ **Citations are present:** each statistic ends with *(Source: document name)*.
- ✅ **Tone and length** match the rest of the site: plain, supportive and not alarmist.
- ✅ **Nothing is invented or missing.** If a statistic has no citation, don't publish it.
- ❌ If something looks wrong, **untick that field**. You can always run the refresh again later.

### Yellow warning boxes

| Warning | What to do |
|---|---|
| "The AI changed content without citing any document…" | Treat the change as unverified. Check every number against the source, or untick it. |
| "The vault has nothing newer for this page…" | Nothing to publish. Add newer documents to the Vault, then refresh again. |
| "…cited document has no public link and will show as plain text…" | Fine to publish, but better to add a Source URL to that document first (Part 1). |

### Sources list

Under the fields, **"Sources shown at the bottom of the page"** lists the documents used.

- Tick the documents you want listed in the page footer. Cited ones are ticked by default.
- Each shows **Public link ↗** (clickable on the website) or **No public link** (name only).
- Untick any document you don't want shown.

### Optional note

Type a short note such as "Updated with AIHW 2025 data". It is saved in the version history so everyone knows why the change was made.

> 📸 **Screenshot 7: Review screen with one "Changed" field showing Current vs Proposed side by side.** *(save as `images/07-review-fields.png`)*
> 📸 **Screenshot 8: Review screen showing a yellow warning and the sources list with "Public link" and "No public link" examples.** *(save as `images/08-review-sources.png`)*

---

## Part 5: Publish

1. Check the button at the bottom. It says **Publish N selected fields**, where N is how many you ticked.
2. Click it, then click **OK** on the confirmation message.
3. You'll see "Published. Reloading…" and the page refreshes.
4. The **Version history** now shows your change at the top marked **LIVE**.

If you change your mind before publishing, click **Discard**. Nothing is saved.

> 📸 **Screenshot 9: Publish button and confirmation box.** *(save as `images/09-publish.png`)*
> 📸 **Screenshot 10: Version history after publishing, with the LIVE tag.** *(save as `images/10-version-history.png`)*

---

## Part 6: Check the live pages

Do this **every time** after publishing. Open the pages below in a **new browser tab**. If you still see old text, do a hard refresh (**Ctrl + Shift + R** on Windows, **Cmd + Shift + R** on Mac).

You can use the **View on site** button on the Vault Refresh tab to open the page you just changed.

### Which pages to check

| You refreshed… | Check these pages |
|---|---|
| **An area** (e.g. Melbourne) | `https://nationalcheckinweek.com/areas/melbourne` |
| **A national issue** (e.g. Bullying) | `https://nationalcheckinweek.com/issues/bullying`<br>and one state's page for it, e.g. `https://nationalcheckinweek.com/states/victoria/issues/bullying` |
| **A state issue page** (e.g. Bullying in Victoria) | `https://nationalcheckinweek.com/states/victoria/issues/bullying`<br>and the card on `https://nationalcheckinweek.com/states/victoria` |
| **A state overview page** (e.g. Victoria) | `https://nationalcheckinweek.com/states/victoria`<br>and two of its issue pages, e.g. `/states/victoria/issues/bullying` |

Replace the names in the links with the area, state or issue you updated. Slugs use lowercase words joined by hyphens, for example `new-south-wales` and `school-refusal`.

### What to look for on each page

- [ ] The new text and figures appear, and match what you approved.
- [ ] The text reads well: no strange characters, no cut-off sentences, no broken layout.
- [ ] Statistics show their *(Source: …)* citation and a year.
- [ ] At the **bottom of the page** there is a sources list:
  - Area page: **Sources**
  - National issue page: **Latest data sources**
  - State overview page: **Latest data sources for [State]**
  - State issue page: **Sources for [State] data**, and **Sources for the [issue] overview**
- [ ] **Click every link** in that list. Each should open the right report.
- [ ] Documents without a public link show the name only. That is expected.
- [ ] Nothing else on the page changed unexpectedly.
- [ ] Check it on a **phone** too, or shrink your browser window.

> 📸 **Screenshot 11: A live page bottom showing the sources list with clickable links.** *(save as `images/11-live-footer-sources.png`)*

**Found a problem?** Go straight to Part 7 and revert, then tell your developer what you saw.

---

## Part 7: Undo a published change

You can go back to any earlier version at any time.

1. Open the same page in the admin and click the **Vault Refresh** tab.
2. Scroll to **Version history**.
3. Click **View** on a version to read what it contained.
4. Click **Revert to this version** on the one you want, then **OK**.
5. The page reloads. The old text **and the old sources list** are restored on the live site.

Good to know:

- Reverting never deletes anything. It adds a new entry to the history, so you can always go forward again too.
- The entry called **Original** is the page as it was before the very first refresh. Revert to it to go all the way back.
- Each entry shows who did it, when, and the note they wrote.

> 📸 **Screenshot 12: Version history with several versions and the "Revert to this version" button.** *(save as `images/12-revert.png`)*

---

## Troubleshooting

| What you see | What it means | What to do |
|---|---|---|
| Refresh button is greyed out, with "You have unsaved changes…" | The page has edits that aren't saved | Click **Save Changes** or reload the page, then try again |
| "No relevant, indexed documents were found in the vault for this page." | The Vault has nothing matching this page | Upload documents (AI → Vault upload) and wait for **Ready**, then try again |
| "The vault has nothing newer for this page." | Nothing to update | Add newer documents, or leave the page as it is |
| "The AI returned an unreadable response. Try again." or "…not valid for this page…" | A temporary AI hiccup | Click **Refresh from vault** again |
| "Too many requests. Please try again later." | You tried too many times in a minute | Wait one minute and try again |
| "State has no … entry to refresh" | That state doesn't have that issue saved yet | Add the issue to the state's **Priority Issues** tab, save, then try again |
| A source shows **No public link** | The Vault document has no Source URL | Add one in Part 1. Pages pick it up automatically, with no need to publish again |
| The live page still shows the old text | Your browser is showing a saved copy | Hard refresh (Ctrl/Cmd + Shift + R) |
| Anything else | | Take a screenshot and send it to your developer with the page name and the time |

---

## Quick rules

1. **Vault documents first:** Ready status, Author, Year and Source URL filled in.
2. **Never publish a number you haven't checked** against its source document.
3. **Review every field.** Untick anything doubtful.
4. **Always check the live page** and click the footer links afterwards.
5. **Stuck or unhappy? Revert.** It is always safe.

---

## Glossary

- **Vault:** our library of uploaded reports and research that the site can read.
- **Refresh:** asking the system to suggest updated text from the Vault. It doesn't change the site.
- **Publish:** making the approved text live on the website.
- **Version:** a saved copy of the page each time something is published or reverted.
- **Revert:** restoring an earlier version.
- **Source URL:** the public web link to a document. It makes the page footer link clickable.
- **Slug:** the lowercase-and-hyphens part of a page's web address, such as `school-refusal`.

---

## For whoever is setting up this guide

**Screenshot shot list.** Capture these once the feature is live and replace each grey "📸" note with an image line such as `![Review screen](images/07-review-fields.png)`. Save images in `docs/guides/images/`.

| # | Screen | Save as |
|---|---|---|
| 1 | Admin login page | `images/01-login.png` |
| 2 | Vault library list with a Ready document | `images/02-vault-list.png` |
| 3 | Vault document with Author, Year, Publisher, Source URL filled in | `images/03-vault-metadata.png` |
| 4 | Admin left menu | `images/04-menu.png` |
| 5 | Vault Refresh tab before clicking | `images/05-refresh-tab.png` |
| 6 | "Searching vault…" state | `images/06-searching.png` |
| 7 | Review screen with Current vs Proposed | `images/07-review-fields.png` |
| 8 | Review screen with a warning and the sources list | `images/08-review-sources.png` |
| 9 | Publish button and confirmation | `images/09-publish.png` |
| 10 | Version history with LIVE tag | `images/10-version-history.png` |
| 11 | Live page bottom with sources list | `images/11-live-footer-sources.png` |
| 12 | Version history with Revert button | `images/12-revert.png` |

**Before the team uses this:** both database migrations must be applied (`supabase/migrations/20261026000001_page_refresh_versions.sql`, then `20261026000002_page_refresh_state_issue_pages.sql`). Do a test run on one area page, publish it, check it, and revert it, so that the screenshots show real data.
