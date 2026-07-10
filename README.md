# LearnToCode Lab

A focused coding practice lab by Luke Giordano.

The site now opens as a working study cockpit instead of a marketing-style page. The first screen contains:
- Language, difficulty, and quiz length controls
- A debugging-themed practice panel
- Local progress stats
- Weak-topic tracking
- Adaptive lesson recommendations
- A lesson library
- Theme, Google sign-in, and progress reset settings

Run locally:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

Upload:
- `index.html`
- `styles.css`
- `script.js`

Do not upload:
- `client_secret_*.json`

Google auth setup:
- Add `http://127.0.0.1:4173` to Authorized JavaScript origins for local testing
- Add the final production domain when the site is deployed
- The client ID is safe for frontend code; the client secret is not
