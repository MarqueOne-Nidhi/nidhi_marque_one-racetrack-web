# Marque One — Multi-page Site Design

**Date:** 2026-08-16
**Status:** Approved for planning
**Repo:** `nidhi-marque-one` (Vite + React 18 + Tailwind 3 + framer-motion)

---

## 1 · Goal

Turn the current single-page `ONE.CLUB` scroll site into a three-page estate site.

The homepage changes what the business is publicly saying. Today the site reads as a private members' club. The new homepage says the estate is **open** — to individuals, to groups, to businesses, and to people who never touch a car. Members exist and get standing access; that is one line, not a theme.

The existing scroll site is not discarded. It becomes the Club page — the private, members-facing expression — and its darkness now does deliberate work as contrast against an open, ivory homepage.

### Deliverables

| Route | Page | Source |
|---|---|---|
| `/` | Homepage, 14 sections | Copy deck Part One |
| `/about` | About | Copy deck Part Two |
| `/club` | ONE.CLUB | Existing `App.jsx`, moved |
| `/contact` | Contact | §14 enquiry, expanded to a page |

### Explicitly out of scope

- **Terms page and liability waiver.** Required before anyone drives, and it must pass a lawyer. Not in this build.
- New photography. Every image slot ships as a named placeholder; see Section 10.

> **Reference convention.** `Section N` means a section of this spec. `§N` means a section of the homepage.
- Any change to the Club page's own content or layout.

---

## 2 · Circuit specification — RESOLVED

This was the launch blocker. It is closed.

### The authoritative figures

> **3.2 km** lap · **800 m** integrated drag strip · **±25 m** elevation · **FIA-graded** · rated for vehicles exceeding **230 km/h**

**No corner count is published.** Client decision — the figure is dropped from Section 3, the FAQ, and the Appendix source table.

### Why this resolves the conflict

Three figure sets were in circulation:

| Set | Lap | Corners | Straight | Elevation | Status |
|---|---|---|---|---|---|
| Measured from client artwork | 3.29 km | 13 | ~600 m | — | superseded |
| Autocar press, Dec 2020 | 5.5 km | 18 | 1.1 km | 40 m | **rejected** |
| Client-supplied, 16 Aug 2026 | 3.2 km | — | 800 m | ±25 m | **authoritative** |

The client figure of 3.2 km lands within 3% of an independent measurement taken off the master plan (Driven International L024-ARR-1201 Rev D) and the circuit trace PNG. Those two drawings agreed with each other to within 1.5%.

**Consequences:**

- The existing circuit trace artwork is **correct and stays**. No new line art needs commissioning.
- The 5.5 km / 18-corner press layout is **not** what is being built. It must not appear anywhere on the site.
- Appendix 3 of the copy deck (the alternate 5.5 km specification block) is **void**. Do not implement it.
- The hero headline variant *"India's longest circuit"* is **void** for the same reason.
- The 800 m drag strip figure, previously irreconcilable with a ~600 m measured straight, is explained: the strip is **integrated into the circuit**, so it is not a straight-line segment of the drawing.

### Two client overrides on record

Both contradict prior material. Both are the client's call, made explicitly, and are implemented as given.

1. **Elevation is ±25 m, written literally with the ± sign.** This supersedes the 40 m figure published by both Autocar (2020) and Driven International (2019). Body copy is phrased to carry the ± honestly — *"climbs and drops twenty-five metres either side of level"* — rather than silently converting it to a 50 m range.
2. **"FIA-graded circuit"** replaces the deck's *"built to FIA standards."* Appendix 2 of the deck records the client previously asking for no grade wording; this reverses that. Noted risk, accepted by the client: an FIA grade is a numbered certificate issued after inspection of a completed circuit, it is externally checkable, and Autocar India is the media partner.

### Implementation

All figures live in **one file**, `src/data/circuit.js`, consumed by Section 3, the FAQ, and any About-page reference. Changing a figure is a one-line edit in one place.

---

## 3 · Routing

**`react-router-dom` v6, clean URLs, shared shell.** Client-selected over hash routing.

```
src/main.jsx           BrowserRouter
src/App.jsx            shell: Navbar + Footer + modals + <Routes>
src/pages/Home.jsx     new
src/pages/About.jsx    new
src/pages/Contact.jsx  new
src/pages/Club.jsx     current App.jsx body, moved wholesale
```

`App.jsx` keeps ownership of the modals (`MembershipModal`, `LightboxModal`) and passes openers down, so any page can trigger them.

### Required changes, and what they cost

Clean URLs were chosen with these tradeoffs understood:

1. **`vite.config.js`: `base: './'` → `base: '/'`.** Relative base breaks asset resolution on nested routes — at `/about`, `./assets/…` resolves against `/`, but the moment a route nests it does not. Must change.
2. **The `file://` double-click bundle stops working.** `index.html` currently sniffs `window.location.protocol === 'file:'` and hand-injects a prebuilt bundle from `assets/bundle/`. Client-side routing cannot work from `file://`. That loader is removed and `index.html` reverts to a plain `<script type="module" src="/src/main.jsx">`.
3. **SPA fallback config must ship** or every URL except `/` 404s on refresh. Included: `public/_redirects` (Netlify) and `vercel.json` (Vercel). If the host is neither, the correct config must be added before deploy — **open question, see Section 13**.
4. `assets/bundle/` and `dist/` are stale build output from the old delivery method. Left untouched in this build; flagged for cleanup.

### Scroll behaviour

A `ScrollToTop` component resets scroll position on route change. Without it, navigating from the bottom of Home to `/about` lands the reader mid-page. Hash links within a page (`#club`, `#drive`) continue to work as they do now.

---

## 4 · Navigation

**Links:** `Home · About · The Club`
**CTA button (right):** `Contact`

This is where `LiquidButton` already sits in the navbar, currently reading "Join the club." Putting Contact there satisfies both the three-item nav requirement and the later "+ contact" addition without crowding the link row.

`NAV_LINKS` in `Navbar.jsx` changes from scroll-to-section buttons to router `<Link>`s. The mobile drawer follows the same list and closes on navigate.

The Club page keeps its own in-page section jumps, but they move into the Club page rather than the global navbar.

---

## 5 · Theme

**The design language does not change.** Same tokens, same type scale, same `LiquidButton`, same motion curves, same `Footer`. What changes is which tone dominates the homepage.

### Existing tokens, retained

| Token | Value |
|---|---|
| `dark.DEFAULT` | `#090909` |
| `dark.secondary` | `#121210` |
| `ivory.DEFAULT` | `#F5F1E8` |
| `ivory.darker` | `#EDE8DE` |
| `font-serif` | Cormorant Garamond 300 |
| `font-sans` | Inter 200–500 |
| `tracking-widest` | `0.25em` |
| `tracking-ultra` | `0.35em` |

### New token: oxblood

The deck specifies oxblood as the accent. The codebase only has Tailwind's generic `red-600` / `red-700`.

```js
oxblood: {
  DEFAULT: '#6B1F2A',
  deep:    '#4A1520',
}
```

Both hold contrast against `#F5F1E8` and read as oxblood rather than as a bright red. **Assumption — client has not confirmed the hex.** Changing it later is a two-line edit in `tailwind.config.js`; nothing else references a literal.

Existing `red-500/600/700` usages in `Footer.jsx` are migrated to the token so the accent is consistent site-wide.

### Structural fix 1 — navbar tone detection

`App.jsx` currently hardcodes `document.querySelectorAll('#hook, #house')` to decide whether the navbar renders light or dark. Those are the Club page's two light sections. This cannot survive three pages with different tonal structures.

**Replacement:** sections declare their own tone with `data-tone="light"` or `data-tone="dark"`. The observer queries `[data-tone]` generically. Adding, removing or reordering a section never requires editing the navbar again.

### Structural fix 2 — cursor scoping

**Client directive: the custom cursor is Club-only. Home and About use the system cursor.**

`src/index.css` currently forces it globally:

```css
@media (pointer: fine) {
  html, body, a, button { cursor: none !important; }
}
```

This is scoped to a `.club-page` wrapper class, and `CursorLens` is rendered only on the Club route. Anything else leaves Home with an invisible pointer.

### Ambient audio

`GlobalAudioButton` becomes Club-only, matching the cursor. Autoplaying ambient audio on a page whose job is to say *"you are welcome here, book a day"* works against the page. **Assumption — client has not confirmed.** It is a one-line move if wrong.

---

## 6 · Homepage layout system — two column

**Client directive: sections run image and content side by side, for better comprehension.**

Implemented as a single reusable primitive, `<SplitSection>`, rather than fourteen hand-built grids. One component owns the column ratio, the gutter, the vertical alignment, the stacking order on mobile and the reveal choreography. Sections pass content and a side.

```jsx
<SplitSection tone="light" media="left" image="surfaces.circuit">
  …content…
</SplitSection>
```

### The alternation rule

Every two-column section flips the image to the opposite side of the one before it. The eye zigzags down the page instead of tracking a single rigid column, which is what stops eleven side-by-side sections reading as a spreadsheet.

```
§3  art ◀        §7   ▶ image      §10b   ▶ image
§4      ▶ image  §8  image ◀       §10c  image ◀
§6  image ◀      §9      ▶ image   §11    ▶ image
                 §10a image ◀      §12  map ◀
```

### Column behaviour

| Property | Value |
|---|---|
| Ratio | `48 / 52` — media slightly narrower than content, so type never feels squeezed |
| Gutter | `clamp(2.5rem, 5vw, 6rem)` |
| Alignment | Vertically centred; content column capped at ~62ch regardless of column width |
| Breakpoint | Stacks below `1024px` |
| Stack order | **Image always first on mobile.** A heading landing under its own image reads as a caption |
| Media ratio | `4/5` portrait on standalone sections, `16/9` on §10's rows |

### Three sections stay single-column

Converting these would cost more than it returns. Each is a deliberate exception, not an oversight:

- **§1 Hero** — full-bleed by definition. A hero in a 48/52 grid is not a hero.
- **§2 Definition** — the deck specifies a narrow centred measure with no image: *"the page pausing to state itself."* It is the section that decides whether a first-time visitor stays, and it works precisely because it is the one moment the page stops showing and just speaks. An image beside it removes the pause. **Compensated** by giving it the page's one distinctive type treatment — see Section 8.
- **§5 Fork** — four equal doors in a 2×2. Forcing it to two columns implies a hierarchy among the four audiences, which is the exact thing the section exists to avoid.

**Say so if you want all fourteen converted anyway** — `SplitSection` already exists at that point, so it is three small edits, not a rebuild.

---

## 7 · Homepage sections

Fourteen sections. Ivory-dominant with two dark beats, per the deck. Client-confirmed against the alternative of matching the Club page's end-to-end darkness — the tonal contrast between the two pages is doing deliberate work.

| § | Component | Tone | Layout | Media |
|---|---|---|---|---|
| 1 | `HomeHero` | dark | Full-bleed, type bottom-left, two CTAs | — |
| 2 | `Definition` | ivory | Centred ~60ch, no image | — |
| 3 | `Circuit` | ivory | Split — line art, then four-figure row | ◀ left |
| 4 | `Surfaces` | ivory | Split, **media pins** while the five cards scroll past | ▶ right |
| 5 | `Fork` | ivory | 2×2 → stacked, equal weight | — |
| 6 | `OnYourOwn` | ivory | Split — three sub-blocks | ◀ left |
| 7 | `WithPeople` | ivory | Split — three sub-blocks | ▶ right |
| 8 | `Business` | **charcoal** | Split — four sub-blocks | ◀ left |
| 9 | `InConfidence` | **charcoal** | Split — sparest section on the page | ▶ right |
| 10 | `Hospitality` | ivory | **Three stacked splits**, one per sub-block | ◀ ▶ ◀ |
| 11 | `Safety` | ivory | Split — understated, small media | ▶ right |
| 12 | `Location` | ivory | Split — stylised map, not an embed | ◀ left |
| 13 | `Questions` | ivory | Split — heading **sticks** left, accordion scrolls right | — |
| 14 | `Enquiry` | **charcoal** | Split — copy left, form right | — |

**§4 and §13 are the two that gain the most from the change.** §4's five surfaces were a horizontal scroll strip in the deck — a pattern people routinely fail to notice is scrollable. Pinning the media and swapping it as each surface scrolls past means the reader sees the surface being described at the moment they read about it, which is exactly the comprehension the directive is after. §13's sticky heading keeps "Questions" anchored while nineteen answers move past it.

**§10 becomes three splits rather than one.** Rooms, clubhouse, spa/gym each get their own row with their own photograph, alternating. This is the section carrying the least-proven part of the proposition, and three specific images argue better than one general one.

Components live in `src/components/home/`. All copy lives in **`src/data/home.js`** — one file to edit words in, not fourteen.

### Reused, unchanged

`LiquidButton` · `ShinyText` · `NumberTicker` (§3 figures) · `FlickeringGrid` (footer) · `Footer` · `Navbar` · `LightboxModal`

### Not on the homepage

`CursorLens` · `GlobalAudioButton` — both Club-only per §5.

### Final copy, with spec decisions applied

Deviations from the copy deck are marked **[CHANGED]** with the reason.

---

**§1 · Hero** — `data-tone="dark"`

> MARQUE ONE MOTOR CLUB
>
> # 219 acres. Drive all of it, or none of it.
>
> A motorsport estate two hours from Bengaluru. Open to drivers, to groups, to business — and to anyone who simply wants the weekend.
>
> `[ Plan a visit ]` `[ For business ]`

Media: reuses `hero.mp4` until the altitude still is supplied. **[CHANGED]** The alternate headline *"India's longest circuit"* is void — see Section 2.

---

**§2 · Definition** — `data-tone="light"`

> ## What this is
>
> A motorsport estate across 219 acres — a circuit, a drag strip, an off-road course, a skid pan, a wet handling track, and a clubhouse built to make a weekend of it.
>
> You do not need a membership, a licence or a fast car. You need a day, and something you want to do with it.
>
> Members hold standing access. Everyone else books.

---

**§3 · The circuit** — `data-tone="light"`

> ## The circuit
>
> | 3.2 km | 800 m | ±25 m | 230 km/h |
> |---|---|---|---|
> | lap | drag strip | elevation | rated beyond |
>
> The road climbs and drops twenty-five metres either side of level. It goes blind over crests. It is never flat and never twice the same.
>
> The drag strip runs on the circuit itself — eight hundred metres from a standing start, timed to the thousandth.
>
> An FIA-graded circuit, with race-grade asphalt run-off, permanent barriers and full trackside electronics. Designed by Driven International.

**[CHANGED]** Corner count removed. Elevation 40 m → ±25 m. "Built to FIA standards" → "An FIA-graded circuit." Drag strip promoted into this section as integrated. All four figures read from `src/data/circuit.js`.

---

**§4 · The surfaces** — `data-tone="light"`

> ## Five ways to use the land
>
> **The circuit and the strip**
> No traffic, no oncoming, no speed limit. Standing start, timed to the thousandth.
>
> **Off-road and rock crawl**
> A course cut through natural rock and elevation. Low range, low speed, no margin.
>
> **Skid pan**
> A deliberately low-grip surface. Where the limit of the car reveals itself at a speed that cannot punish you for finding it.
>
> **Kick plate**
> A plate that throws the car sideways without warning. First you learn to catch it. Then you learn to catch it every time.
>
> **Wet handling track**
> The same instruction, under water.

**[CHANGED]** The deck's header/list mismatch (header said five, list ran six) is resolved by the drag strip being integrated: circuit and strip fold into one card, and the count is genuinely five.

---

**§5 · The fork** — `data-tone="light"`

> ## Who comes here
>
> **On your own** — Your car, the circuit, and someone to teach you how to use it.
> **With people** — A weekend for a group, with the site closed behind you.
> **For business** — Events, launches, hospitality, and days built with us.
> **In confidence** — Manufacturer testing, sole use, gate shut.

Each panel anchors to its section below. Equal visual weight — none may read as primary. This is the first layout to break on mobile; it must stack without establishing a hierarchy.

---

**§6 · On your own** — `data-tone="light"`

> ## On your own
>
> ### First time
> Most people who drive here have never been on a circuit. That is the ordinary case, not the exception. You bring a road-legal car and a driving licence. Everything else is taught on the day.
>
> ### Instruction
> A motorsport academy on the estate. Most drivers who arrive wanting to be quick discover they were never taught how — a fault that answers to a weekend.
>
> ### Storage
> Secure, temperature-controlled storage on site. The car waits where the road is.
>
> **No membership required. No competition licence. No race car.**

The bolded line removes the three assumptions that stop people enquiring. It gets its own typographic weight and space. It must not be buried.

---

**§7 · With people** — `data-tone="light"`

> ## With people
>
> ### The weekend
> Arrive Friday. Drive Saturday and Sunday. Sleep twenty minutes from the car rather than two hours.
>
> ### Your group, your circuit
> Take the road for the day with the garages, the marshals and the gate closed behind you. Car clubs, birthdays, reunions, anything that improves for being held somewhere nobody else can reach.
>
> ### Not everyone drives
> Some of the party will want the pool and the table instead. That is a complete visit here, not a consolation.

---

**§8 · Business** — `data-tone="dark"` — dark beat begins

> ## Business
>
> The estate takes bookings, hosts events, and builds programmes with partners who bring their own idea of what to do with a circuit.
>
> ### Events and race meetings
> The circuit, the paddock and the estate for a competitive weekend, a series round, a club meeting or a format that does not exist yet. Bring the event. We have the ground.
>
> ### Launches and press
> Elevation, surface and straight enough to make the numbers real, with garages and hospitality for a journalist group. Marque One works in partnership with Autocar India.
>
> ### Corporate and dealer programmes
> Customer drive days, product launches, dealer training and incentive weekends, with rooms and dining on site so the programme need not break for the night.
>
> ### Team testing
> Full circuit access, pit lane and garages, on an FIA-graded layout.

**[CHANGED]** "a layout built to FIA standards" → "an FIA-graded layout."

---

**§9 · In confidence** — `data-tone="dark"` — dark beat ends

Kept separate from §8 deliberately. A manufacturer running an unreleased car is not shopping for an events venue; combined, the two propositions weaken each other.

> ## In confidence
>
> ### Sole use
> The estate takes one client at a time. For the duration of the booking there is no second party on site, and no public gate to close because there is not one.
>
> ### What is available
> Circuit, strip, off-road and rock-crawl course, skid pan and wet handling track, in any combination a programme requires. Trackside timing and electronics throughout. Pit garages, workshop space and race control.
>
> ### Distance
> Two hours from an international airport, and far enough from everything else that nobody arrives by accident.

The quietest section on the page. Single column, at most one image.

---

**§10 · Hospitality** — `data-tone="light"` — return to ivory

> ## Around the road
>
> Forty rooms above the circuit, each one different, each one facing either the mountains or the road.
>
> ### The clubhouse
> A pool that looks out over the circuit. Dining that runs long. Somewhere to sit and watch the road without standing beside it.
>
> ### Spa and gym
> Treatment rooms, and a gym that keeps its hours whether or not anyone is driving.
>
> ### Coming for the weekend, not the lap
> Guests who never sit in a car have a full weekend here. The circuit is the reason the place exists. It is not the only reason to arrive.

**This section carries the newest and least-proven part of the proposition and needs the strongest photography on the site.** With weak images it reads as a claim rather than as a place. Three to four wide photographs, minimal type between them.

---

**§11 · Safety** — `data-tone="light"`

> ## Safety
>
> Race-grade asphalt run-off, permanent barriers and marshalled sessions throughout.
>
> A medical facility operates on the estate, with trained staff on site whenever the circuit is live.

Placed after hospitality so it reassures without alarming. Nobody enquires because of this section; a number of people fail to enquire without it.

---

**§12 · Location** — `data-tone="light"`

> ## Getting here
>
> Two hours by road from Kempegowda International Airport, Bengaluru.
>
> Far enough from a city to be quiet. Close enough to reach before noon.

**[CHANGED]** The source material carries both *"110 minutes from the airport"* and *"40 km from Bengaluru"* — these cannot both hold, and it is the one fact a reader checks against a map mid-sentence. **Resolved defensively: the kilometre figure is omitted entirely** and only the travel time is published. This is safe but incomplete; see Section 13, open items.

Stylised map illustration, not an embedded Google Map. Do not overbuild.

---

**§13 · Questions** — `data-tone="light"`

Accordion, closed by default, three groups, hairline rules, no cards.

**Coming to drive**

- *Do I need to be a member?* — No. Members hold standing access; everyone else books a day.
- *Do I need racing experience?* — No. Most people who drive here have never been on a circuit.
- *Do I need a competition licence?* — No. A valid driving licence is enough.
- *What car do I need?* — A road-legal car in sound mechanical condition. Not a fast one — a normal car driven properly teaches more than a fast car driven badly.
- *Is instruction available?* — There is a motorsport academy on the estate.
- *How long is the circuit?* — 3.2 kilometres, with an 800-metre drag strip integrated into the lap and ±25 metres of elevation. **[CHANGED]** — deck had this as a placeholder pending the spec decision.
- *What else is there besides the circuit?* — An off-road and rock-crawl course, a skid pan, a kick plate and a wet handling track. The drag strip runs on the circuit itself. **[CHANGED]** — strip moved, as integrated.
- *Can I keep my car here?* — Secure, temperature-controlled storage is on site.
- *Is there medical cover?* — A medical facility operates on the estate, staffed whenever the circuit is live.

**Coming for the weekend**

- *Can I come without driving?* — Yes. Rooms, pool, spa, gym and dining make a full weekend on their own.
- *Can I bring people who don't drive?* — Yes. It is a complete visit for them, not a wait.
- *Can I stay overnight?* — Forty rooms on the estate, above the circuit.
- *Is there somewhere to watch?* — Viewing from the clubhouse and the pool, across the circuit.

**Business**

- *Can we hold an event here?* — Yes — race meetings, launches, corporate programmes and formats built with us.
- *Can the site be taken privately?* — Yes. Sole use means one client on the estate for the duration.
- *What is available for testing?* — Circuit, strip, off-road course, skid pan and wet handling track, with trackside timing and electronics.
- *Are there garages and workshop space?* — Pit garages, workshop space and race control are on site.
- *Can a programme run across several days?* — Rooms and dining are on the estate.

**Omitted pending client answers.** Ten further questions have no answer in the source material — booking method, defined car standard, hire fleet, helmet policy, passenger policy, damage and insurance, NDAs, commercial filming, hospitality-only booking, and which address takes business enquiries. These are among the questions that most often decide whether an enquiry is sent. **They are omitted rather than stubbed** — a visible question with a blank or evasive answer damages trust more than an absent question does. The data file is structured so each drops in as a one-line addition. See §11.

---

**§14 · Enquiry** — `data-tone="dark"` — runs continuous into the footer

> ## Come and see it.
>
> Tell us what you intend to do. We will tell you how it works.
>
> `[ Drive ]` `[ Stay ]` `[ Business ]`
>
> Name · Email · Phone · What you have in mind
>
> `[ Send ]`
>
> info@marque.one

Three toggles swap the fields beneath. **Five fields maximum** — every extra field costs submissions.

---

## 8 · Motion and component library

**Client directive: animation drawn from shadcn/ui and animated-UI component libraries.**

### Current state

shadcn is **not installed** — no `components.json`, no `@radix-ui/*`, no `cn()` helper. `clsx` and `tailwind-merge` sit in `package.json` unreferenced anywhere in `src/`. The existing `src/components/ui/*` are hand-written Magic UI ports, not shadcn components. This is a first install, not a top-up.

### Dependencies added

```
@radix-ui/react-accordion
@radix-ui/react-tabs
```

Plus `src/lib/utils.js` exporting `cn()` over the already-installed `clsx` + `tailwind-merge`, and `components.json` so future shadcn components install cleanly with the right paths and the ivory/charcoal token names.

Two Radix packages only. shadcn is a copy-in library, not a runtime dependency — everything else is source we own and can restyle.

### From shadcn / Radix — accessibility we should not hand-roll

| Component | Used by | Why Radix rather than hand-rolled |
|---|---|---|
| `Accordion` | §13 Questions | Keyboard navigation, correct ARIA, and `--radix-accordion-content-height` for height animation without measuring in JS |
| `Tabs` | §14 Enquiry, `/contact` | Roving tabindex and arrow-key movement across Drive / Stay / Business |

### From the animated-UI family — extends the existing kit in the same idiom

| Component | Used by | Behaviour |
|---|---|---|
| `BlurFade` | every split section | New component wrapping any node, built on the same treatment as `BlurFadeText`. The page's primary reveal |
| `BoxReveal` | every split section's media | An oxblood panel wipes off the image. The signature move — wipe direction follows the section's media side |
| `StickyScrollReveal` | §4 Surfaces | Media column pins; the active image swaps as each surface scrolls into range |
| `TextReveal` | §2 Definition **only** | Word-by-word opacity as the section scrolls. §2 gives up its image, so it gets the page's one distinctive type treatment instead |
| `ScrollProgress` | site shell | 2px oxblood line at the top edge. Cheap orientation on a fourteen-section page |
| `NumberTicker` | §3 figures | Already in the codebase. Counts the four figures up on entry |

`BlurFadeText` is **not** modified or removed — `Hero.jsx` and `TheHook.jsx` on the Club page both consume it, and the Club page is out of scope for content change. `BlurFade` is a new sibling.

### Deliberately rejected

`BorderBeam` · `ShineBorder` · `Meteors` · `Particles` · `RetroGrid` · `AnimatedGradientText` · `TypingAnimation` · `WordRotate` · `Confetti`

All are competent components and all are wrong here. They read as SaaS landing page. This brand is Cormorant Garamond at 300 weight, oxblood on ivory, and sentences like *"It is never flat and never twice the same."* A beam orbiting a border undoes that in one frame. **Restraint is the brand.**

### Motion specification

House easing is already in the codebase — `cubic-bezier(0.16, 1, 0.3, 1)` — and stays.

| Motion | Duration | Easing | Detail |
|---|---|---|---|
| Section reveal | `700ms` | expo-out | `y: 24px → 0`, `opacity 0 → 1`, `blur 6px → 0` |
| `BoxReveal` wipe | `900ms` | expo-out | Panel `scaleX 1 → 0`, origin follows media side |
| Sub-block stagger | `80ms` apart | — | Max four items; never a long cascade |
| Accordion open | `250ms` | ease-out | Radix height var |
| Tab switch | `200ms` | ease-out | Cross-fade panels; no horizontal slide |
| Image hover | `400ms` | ease | `scale(1.03)`, existing behaviour retained |
| Button press | `120ms` | ease-out | `scale(0.97)` — `LiquidButton` already does this |

**Paired columns animate as one unit.** Media and content in a split share duration and easing, with content offset by `120ms` only. Different curves on the two halves make a single section read as two things arriving separately.

**Viewport trigger:** `{ once: true, margin: '-15%' }`. Reveals start slightly before the section enters, so nothing visibly pops after it is already on screen.

**Transform, opacity and filter only.** The sole exception is Radix's accordion height, which is unavoidable and cheap at this size.

### Reduced motion — currently absent, and now required

The codebase has **no `prefers-reduced-motion` handling at all**. Adding scroll-driven reveals and sticky pinning across a fourteen-section page turns that from an oversight into a real accessibility failure.

- A `useReducedMotion` hook gates every framer-motion variant to a plain 150ms opacity fade.
- `StickyScrollReveal` degrades to a normal stacked list — no pinning, no swapping.
- `ScrollProgress` renders static.
- `TextReveal` renders as ordinary text at full opacity.
- A global CSS fallback collapses transitions and animations for anything not driven by framer-motion.

### Touch devices

Hover effects are guarded with `@media (hover: hover) and (pointer: fine)`. The site already drops the custom cursor on touch; hover-only affordances need the same treatment or they fire on first tap.

### Performance

Two existing canvas loops run `requestAnimationFrame` continuously: `FlickeringGrid` in the footer, and the Hero's fallback particle canvas. On a page this much longer, the footer grid burns battery while far off-screen. Both get an `IntersectionObserver` that cancels the frame loop when out of view. Cheap fix, and the new page length is what makes it worth doing.

---

## 9 · Other pages

### About (`/about`)

Part Two of the deck, implemented as written and unchanged in structure. Shorter than instinct suggests: the homepage sells the place, this page establishes that people with a record built it.

Sections: Header → The group → **Three businesses, one name** (Motor Club / Garage / Classifieds) → The people (Anush Chakravarthi, Shana Parmeshwar, M. G. Chakravarthi Rajan) → Partners (Driven International, Autocar India, Anuadi Constructions) → Close.

The three-businesses section resolves a real naming confusion — someone who has seen the garage on Instagram and the club on a master plan needs one page stating how they relate.

Ivory-dominant to match the homepage.

### Contact (`/contact`)

§14's enquiry, expanded to a full page: the three toggles and form, `info@marque.one`, the stylised location map, and travel time. Charcoal, matching §14, so it runs continuous into the footer.

### Club (`/club`)

The current `App.jsx` body moved wholesale into `pages/Club.jsx`. **No content or layout changes.** It keeps `CursorLens`, `GlobalAudioButton`, its in-page section navigation and its end-to-end darkness. Wrapped in `.club-page` so the cursor CSS scopes to it.

---

## 10 · Images

Client is supplying photography. Every slot is built now as a named placeholder — correct aspect ratio, in-theme, labelled with the filename it expects — so the layout is final before a single photo arrives.

- `src/data/images.js` — the manifest: slot key, path, aspect ratio, alt text, owning section.
- `<ImageSlot />` — renders the image if present, an in-theme labelled frame if not. No broken-image icons, no layout shift on arrival.
- `IMAGE-MANIFEST.md` at repo root — the client-facing list: which file goes where, at what ratio, and what it needs to show.

Existing renders in `public/assets/images/` are mapped to slots where they genuinely fit rather than left unused. Slots with no existing candidate — off-road, skid pan, kick plate, wet handling track, spa, gym, medical — ship as placeholders.

---

## 11 · Forms

`MembershipModal.jsx` holds the Google Apps Script `fetch` inline. The Enquiry section and Contact page need the same call, which would make three copies.

**Extracted to `src/lib/submitToSheet.js`** — one function, one place to change if the endpoint moves. Preserves the existing behaviour exactly: `POST`, `mode: 'no-cors'`, `application/x-www-form-urlencoded`, failure swallowed to a `console.warn` so the user still sees a success state.

The enquiry payload adds an `Enquiry Type` column carrying Drive / Stay / Business.

`GOOGLE_SHEET_SCRIPT_URL` stays in `src/config.js`, unchanged.

---

## 12 · Build notes

Carried from the deck, and binding on implementation.

- **One `<h2>` per section.** A section wanting two is two sections.
- **Nothing past four lines.** Most blocks run two.
- **Rhythm:** ivory throughout, two dark beats only — §8–9 running together, and §14 into the footer. One tonal shift at the middle, one landing at the end.
- **§5 breaks first on mobile.** The four-panel fork must stack with equal weight; none may read as primary.
- **Figures stay live text.** Never images. `NumberTicker` animates them in.
- **§4 is photography or nothing.** No icons.
- **The alternation never breaks.** Two consecutive splits with the media on the same side is a bug, not a variation.
- **Media stacks above content on mobile, always.** A heading landing beneath its own image reads as a caption.
- **One `BoxReveal` per section.** It is a punctuation mark. Used on every element it becomes wallpaper.
- **Content column caps at ~62ch** however wide its grid column gets. Long measure is the failure mode of a two-column layout on a large display.
- Homepage runs ~1,150 words including questions, across fourteen sections. Longer than the previous draft by four sections and only 100 words, because each section got shorter.

---

## 13 · Open items

None of these block implementation. Each is implemented with a stated default that can be overturned without rework.

| # | Item | Default applied | Cost to change |
|---|---|---|---|
| 1 | Oxblood hex | `#6B1F2A` / `#4A1520` | Two lines in `tailwind.config.js` |
| 2 | Distance: 110 min vs 40 km | Km figure omitted; travel time only | One line in `home.js` |
| 3 | Terms page + waiver | Out of scope | New page, and it must pass a lawyer |
| 4 | Ambient audio placement | Club-only, matching the cursor | One line in `App.jsx` |
| 5 | Ten unanswered FAQ questions | Omitted, not stubbed | One line each in `home.js` |
| 6 | Hosting target | Netlify + Vercel configs shipped | Add the host's SPA fallback config |
| 7 | §1, §2 and §5 kept single-column | Protected, with reasons in Section 6 | Three edits — `SplitSection` already exists |

**Item 1 carries more weight than it did.** Oxblood is no longer just an accent on rules and figures — it is the colour of the `BoxReveal` panel that wipes off the media in every split section. It will be the most-seen colour on the page after ivory and charcoal. Worth five seconds of your attention on the hex.

**Item 3 is the one with real consequences.** A liability waiver is required before anyone drives, and item 5's insurance and damage question is where that page needs legal review. Neither belongs in a copy deck, and neither should be drafted by me.

**Item 6 must be answered before deploy.** Without the correct SPA fallback, every URL except `/` returns 404 on refresh — a failure that will not appear in local development.

---

## 14 · Risk register

| Risk | Mitigation |
|---|---|
| "FIA-graded" is externally checkable and Autocar is the media partner | Raised with the client; instruction confirmed and recorded in Section 2. Isolated to one string in `circuit.js` if it must be softened later |
| ±25 m contradicts the 40 m figure already in print | Client-supplied figure treated as authoritative; single source of truth in `circuit.js` |
| Clean URLs break the `file://` delivery method the repo was built around | Tradeoff put to the client and accepted. SPA fallback configs shipped for two hosts; Section 13 item 6 tracks the rest |
| §10 Hospitality reads as a claim without strong photography | Placeholder frames make the gap visible rather than hiding it; `IMAGE-MANIFEST.md` states exactly what each slot needs to show |
| Global `cursor: none` leaves the homepage with an invisible pointer | Explicitly scoped to `.club-page` in Section 5. This is a silent failure if missed — it must be verified in the browser, not assumed |
| Navbar tone observer hardcodes Club-page section IDs | Replaced with generic `[data-tone]` observation in Section 5 |
| Eleven consecutive two-column sections read as monotonous | Alternation rule in Section 6, plus three protected single-column sections breaking the rhythm at §1, §2 and §5. **Verify by scrolling the whole page, not by reviewing sections in isolation** — this failure only appears at full length |
| No `prefers-reduced-motion` handling exists today | `useReducedMotion` gate on every variant, plus a global CSS fallback. Section 8. Must be verified with the OS setting actually enabled |
| Sticky pinning in §4 is the most fragile layout on the page | Degrades to a plain stacked list under reduced motion and below the `1024px` breakpoint. Test on a short viewport — pinned sections misbehave when the pinned element is taller than the window |
| Animated-UI components pull the brand toward SaaS | Explicit reject list in Section 8. Any component added later is checked against Cormorant at 300 weight before it ships |

---

## 15 · Appendix — sources

Superseding entries from this session are marked.

| Claim | Source |
|---|---|
| 219 acres | DriveSpark / Motoroids, 2018 |
| **3.2 km lap · 800 m integrated strip · ±25 m elevation · FIA-graded · 230 km/h+** | **Client, 16 Aug 2026 — supersedes all prior figures** |
| ~~3.3 km, 13 corners~~ | ~~Driven International; measurement~~ — superseded |
| ~~5.5 km, 18 corners, 1.1 km straight~~ | ~~Autocar India, Dec 2020~~ — **rejected, do not publish** |
| ~~40 m elevation~~ | ~~Autocar India 2020; Driven International 2019~~ — superseded |
| Designed by Driven International | Master plan title block; Autocar India |
| Driven's Indian work: Kari, Nanoli | Driven International |
| Race-grade asphalt run-off, barriers, trackside electronics | marque.one |
| Off-road and rock-crawl course · skid pan · kick plate · wet track | marque.one; 2018 press |
| Pit garages, race control | 2018 press; Driven International |
| Temperature-controlled vehicle storage | marque.one |
| Forty rooms, individually designed, mountain or circuit aspect | marque.one |
| Dining and viewing | Driven International |
| Pool, spa, gym, medical facility | Client brief |
| Motorsport academy | Autocar India, Dec 2020 |
| Two hours from Bengaluru airport | marque.one |
| Autocar India partnership | marque.one |
| Group history; Anuadi Constructions 1991 | marqueone.co.in |
| Anush Chakravarthi, M. G. Chakravarthi Rajan — biographies | marqueone.co.in |
| Shana Parmeshwar — biography | YourStory, 8 Sept 2021 |
| Sixteen marques serviced | marqueone.in |
