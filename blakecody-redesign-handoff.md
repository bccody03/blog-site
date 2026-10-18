# blakecody.com redesign — handoff

Attached: `blakecody-homepage-mockup.html` (open in a browser) and `blake-cutout.png` (transparent headshot).
Match the mockup's layout, colors and copy. Keep all existing working pieces (Substack signup, article feed, Chapter 1 page, Reflect form, My JRNL link). Ask before removing anything.

## 1. Colors — remove all orange/rust
Replace the current rust theme (#9a3b27) everywhere, including `<meta name="theme-color">`.

| Token | Hex | Use |
|---|---|---|
| Cream | #F6F1E7 | Page background |
| Paper | #FFFDF8 | Cards |
| Ink | #16213A | Headings, body text |
| Navy | #1F2A44 | Photo panel, talk cards, signup block |
| Red | #B4232C | Buttons, eyebrow labels, accents (hover #9C1D25) |
| Muted | #5B6476 | Secondary text |
| Line | #E3DACB | Borders, dividers |

Fonts: Fraunces (headings, quotes) + Inter (body, buttons). Pill-shaped buttons, 20px card radius.

## 2. Homepage, top to bottom
1. **Nav:** "Blake Cody." (red period) · Essays, Book, Speaking, Reflect, About · red Subscribe button.
2. **Hero (two columns):**
   - Left: eyebrow "Writer · Speaker in the making · Michigan"; H1 "Lead with love. Live with intention."; subhead; buttons "Start with my best essays →" (scrolls to Start here) and "Read Chapter 1 free"; italic line "Written from inside the work, not after it."
   - Right: navy rounded panel with `blake-cutout.png` bottom-aligned, a thin red heartbeat line behind him (jagged on the left, calm wave on the right), and a small white card "Hi, I'm Blake. 23 · IT by day · writing the book *Aligned*".
   - Mobile: photo goes above the text.
3. **Start here:** 3 essay cards (tag, title, one-line subtitle, "Read →") linking to the Substack posts. Replace the "Latest articles" loader on the homepage; keep the full feed on the Essays page.
   - I Said I Let Go. I Was Lying.
   - Before You Say It Back
   - The Box Keeps Glowing Until You Stop Opening It (only if published; otherwise swap for another published essay)
4. **About:** big pull quote on the left ("Saying you've let go is easy. Doing it is the whole thing."), short bio on the right, "More about me →".
5. **Speaking (new section + new /speaking page):** 3 navy talk cards (Before You Say It Back · I Said I Let Go · Aligned) and a pink strip "Want me to speak to your team, school or group? Let's talk." with an "Invite me to speak →" button that opens a simple contact form (name, email, organization, event date, message).
6. **Book + Reflect:** two side-by-side cards (stack on mobile).
7. **Signup:** navy block "One honest essay a week." with the existing Substack email form.
8. **Footer:** Substack, Instagram, LinkedIn, My JRNL app, Privacy.

## 3. Copy fixes
- Update every bio from "22" to **23**.
- Remove "aspiring author and life & relationship coach." Use: "I'm Blake Cody, 23, from Michigan. I work in IT, I golf, I lift, and I write every week about the stuff most people only talk about at 2am."
- Remove the duplicate headshot further down the page (the hero has it now).
- Add the Instagram link once the account is ready (leave it hidden until then).

## 4. Rules
- No testimonials, reader counts or stats unless they're real and I provide them.
- Photo `alt`: "Blake Cody smiling in a red polo."
- Compress the headshot (WebP, under ~150 KB) and set width/height to avoid layout shift.
- Mobile first: 16px side padding, no horizontal scroll, buttons at least 44px tall.
- Show me a preview before publishing.
