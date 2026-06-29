# Trashmasters Scorekeeper

A free web app for scoring a Trashmasters golf round for up to 4 players. It runs in any phone or computer browser, needs no login, and saves each visitor's round in their own browser using localStorage.

Once you finish the steps below, your live site will be at:

**https://jessebiter.github.io/trashmasters-scoring/**

---

## What you are doing

You will put these files on GitHub (a free file host for websites), then run three short commands that build the app and publish it. You do not need to know how to code. Just follow the steps in order.

Plan on about 20 minutes the first time.

---

## Step 1: Make a free GitHub account and repo

1. Go to https://github.com and sign up if you do not already have an account. Your username is **JesseBiter**.
2. Once logged in, click the **+** in the top right corner and choose **New repository**.
3. For **Repository name**, type exactly: `trashmasters-scoring`
   (This must match exactly, or the web address will not work.)
4. Set it to **Public**.
5. Do NOT check "Add a README." Leave everything else blank.
6. Click **Create repository**. Leave this page open.

---

## Step 2: Put the project files into the repo

1. On that new repo page, click the link that says **uploading an existing file**.
2. Unzip the file I gave you (`trashmasters-scoring.zip`) on your computer so you can see the folder of files inside.
3. Open the unzipped folder. Select everything inside it (the `src` folder, `index.html`, `package.json`, `vite.config.js`, `README.md`, and `.gitignore`) and drag it all into the GitHub upload box.
4. Wait for the files to finish uploading, then click **Commit changes**.

Your files now live on GitHub.

---

## Step 3: Install Node.js on your computer

Node.js is the free tool that builds the app.

1. Go to https://nodejs.org
2. Download the version labeled **LTS** (the recommended one).
3. Open the downloaded installer and click through it, accepting the defaults.

You only ever have to do this once.

---

## Step 4: Get the project onto your computer

The easiest way is GitHub Desktop:

1. Go to https://desktop.github.com and download GitHub Desktop. Install it and sign in with your GitHub account.
2. Click **File**, then **Clone repository**.
3. Pick `trashmasters-scoring` from the list and click **Clone**. Note the folder it saves to (usually inside a "GitHub" folder in your Documents).

---

## Step 5: Run the three commands

1. In GitHub Desktop, click the **Repository** menu at the top, then **Open in Terminal** (on Windows it may say **Open in Command Prompt** or **Open in PowerShell**). A black text window opens, already pointed at your project folder.
2. Type this and press Enter. Wait for it to finish (a minute or two):
   ```
   npm install
   ```
3. Type this and press Enter. This builds the app:
   ```
   npm run build
   ```
4. Type this and press Enter. This publishes it to the web:
   ```
   npm run deploy
   ```

If `npm run deploy` asks you to log in to GitHub, follow the prompt. It is just confirming you own the repo.

---

## Step 6: Turn on GitHub Pages

1. Go back to your repo on github.com.
2. Click **Settings** (top right of the repo).
3. In the left menu, click **Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. For **Branch**, choose **gh-pages** and the **/(root)** folder, then click **Save**.

Wait one or two minutes. Then visit:

**https://jessebiter.github.io/trashmasters-scoring/**

Your scorekeeper is live. Share that link with anyone.

---

## How visitors use it

- Open the link, go to the **Setup** tab, enter player names and handicaps, and confirm the par and stroke index against the course card.
- On the **Play** tab, enter each player's gross score and tap the trash they earned. Birdies, eagles, and the bonus combinations fill in automatically.
- The **Leaderboard** tab shows live totals.
- Each person's round is saved in their own browser, so they can close the tab and come back to it.

To add it to a phone home screen: open the link in Safari, tap the Share box, then **Add to Home Screen**.

---

## If you ever want to change the app

Edit the files, then run `npm run build` and `npm run deploy` again. The live site updates in a minute or two.

## If something goes wrong

- **Page is blank or styling is missing:** the repo name must be exactly `trashmasters-scoring`. If you used a different name, open `vite.config.js` and change the `base` line to match, then build and deploy again.
- **404 page not found:** give it a few minutes after enabling Pages, then refresh. Double check Step 6 is set to the **gh-pages** branch.
- **`npm` not recognized:** Node.js did not install correctly. Reinstall it from Step 3 and restart the terminal window.
