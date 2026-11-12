# Let's KAPE: how to operate the site

## How it works (no database, as in the proposal)
- **Customers** order on index.html. Each order is emailed to the café through Formspree. The email contains a **dashboard link**.
- **Staff** use admin.html. Orders are not shared between devices: the staff phone only shows orders that were imported on it.
- **Menu, prices, hours, payment numbers** are published through the file `data.js` (the proposal's "update the code and publish via GitHub/Vercel").

## Daily routine (staff)
1. Open `yoursite.com/admin.html` on the café phone. First visit: choose a PIN (4+ characters). After that, enter it.
2. When an order email arrives, **tap the dashboard link** in it (or copy the link or code into "Import" on the Orders tab). Enter the PIN if asked. The order appears under **Orders**.
3. GCash/Maya orders: check the app for the payment and the reference number shown on the card, then press **Confirm payment**. Press **Reject** if there is no matching payment. A red warning appears if the same reference number was used on another order.
4. Cash orders: press **Accept order**.
5. Move the order along with the button, or tap any step (**Confirmed / Preparing / Ready / Picked up**) on the card. Tapping an earlier step corrects a mistake.
6. Use **Call**, **Text** or **Email** on the card to tell the customer. The message is pre-filled for Confirmed, Ready and Rejected.
7. Press **Lock** when you leave the phone. "Clear completed & rejected" (Settings) tidies the list.

## Changing the menu, hours or payment numbers
1. Admin → **Menu**: change a price, press **Mark sold out**, **✕** to remove an item, or **Add an item** (photo URL optional, must start with https://).
2. Admin → **Settings**: update the GCash/Maya numbers and the opening hours. The **Accepting orders / Orders paused** button is in the top bar.
3. These are saved as a **draft on that device**. To make them live: Settings → **Publish to the website → Download data.js**, then replace `data.js` in the GitHub repository (or upload it in the Vercel dashboard). The site updates in about a minute.
4. **Discard draft** throws away the draft on this device and goes back to the published data.

## What customers do
Browse the menu, press **Add**, open the cart, choose a pickup time, pay by GCash/Maya and type the reference number (or choose cash), then send. The order is only confirmed on screen after the email has really been sent. If the connection fails, they see an error and can try again. The **Check order status** link shows the order as sent; staff update customers by text or email.

## Setting up / deploying
- Keep these files together: `index.html`, `admin.html`, `script.js`, `store.js`, `data.js`, `styles.css`.
- Upload to GitHub and connect to Vercel (free tier). Open the Formspree dashboard once and confirm the email address; the order emails go there.
- There is no link to the admin on the public site. Staff open `yoursite.com/admin.html` directly. Bookmark it, or use "Add to Home Screen" on the café phone.

## Troubleshooting
- **Forgot the PIN:** on the same device, clear the site's data in the browser (or run `localStorage.removeItem('letskape_admin_lock')` in the console), then choose a new PIN. Orders stored on that device are lost if you clear everything.
- **Order email not arriving:** check spam and that the Formspree address is verified.
- **Menu change not visible to customers:** you must publish `data.js` (see above).
- **Orders disappeared:** they are stored in the browser that imported them. A different browser or phone starts empty, so re-import from the email.

## Limits (same as the proposal)
No automatic GCash/Maya payments (manual verification), no customer accounts, and no live database, so menu changes go through `data.js`.
