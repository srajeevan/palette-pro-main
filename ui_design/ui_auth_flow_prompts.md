To implement this logic smoothly without breaking existing functionality, these prompts focus on a **"Deferred Intent"** pattern. This ensures that if a guest starts an upgrade, the app "remembers" to show the paywall *after* they finish signing up.

Here are the modular prompts for your coding agent.

### Phase 4.1: The Auth & Subscription Logic Layer
**Goal:** Define the user states and the central "Gatekeeper" function that decides which screen to show based on the user's status.

> **Logic Prompt:**
> "Refine the global Auth and Subscription state logic. 
> 1. **Identify States:** Ensure we have clear flags for `isLoggedIn` (bool), `isGuest` (bool), and `subscriptionStatus` ('free' | 'pro').
> 2. **The Gatekeeper Function:** Create a function `handleUpgradeIntent()`.
>    - **IF** user is `isGuest`: Store an internal flag `pendingUpgrade = true` and navigate the user to the `CreateAccount` screen.
>    - **IF** user is `isLoggedIn` AND `free`: Directly open the `UpgradeModal`.
>    - **IF** user is already `pro`: Show a 'You are already a Pro' toast.
> 3. **Persistence:** Ensure the `pendingUpgrade` flag persists during the account creation process."

---

### Phase 4.2: The "Guest-to-Pro" Handover
**Goal:** Ensure that the moment a guest finishes creating an account, they aren't just dumped on a home screen, but are immediately shown the paywall as promised.

> **UX Flow Prompt:**
> "Modify the `CreateAccount` completion logic to handle redirected guest upgrades.
> 1. **Post-Signup Hook:** In the 'onSuccess' callback of the account creation/registration logic:
>    - Check if `pendingUpgrade === true`.
>    - **IF true:** Reset `pendingUpgrade` to `false` and immediately trigger the `UpgradeModal` to appear over the current screen.
>    - **IF false:** Navigate to the standard `Studio` or `Dashboard` screen.
> 2. **Styling:** The `UpgradeModal` must match the 'Aura' aesthetic: Background `#161618`, Cobalt Primary buttons, and a clear list of Pro features with checkmarks."

---

### Phase 4.3: Post-Purchase Navigation & State Refresh
**Goal:** Provide a seamless transition from "paying" back to "creating" without making the user manually close modals.

> **Navigation Prompt:**
> "Implement the successful purchase callback for the `UpgradeModal`.
> 1. **State Update:** Immediately update the global `subscriptionStatus` to 'pro' and trigger a UI re-render to unlock restricted features.
> 2. **Smart Redirection:** 
>    - Upon successful purchase, show a high-end 'Welcome to Pro' success animation (0.8s).
>    - Automatically dismiss the `UpgradeModal`.
>    - Navigate the user back to the exact screen they were on when they first clicked 'Upgrade' (or the 'next appropriate' screen, such as the feature they were trying to use).
> 3. **Clean Up:** Ensure all 'Create Account' or 'Sign In' stacks are removed from the navigation history so the 'Back' button doesn't take them back to the login flow."

---

### Phase 4.4: UI Consistency for Paywall/Modals
**Goal:** Ensure the new modals look like they belong in the "Midnight Atelier" theme.

> **UI Prompt:**
> "Design the `UpgradeModal` and `Auth` screens to match the established 'Midnight Atelier' / 'Aura' style.
> - **Background:** `#0A0A0B` with an 'Elevation 1' (`#161618`) card for the main content.
> - **Typography:** Use the Serif font for 'Unlock PalettePro' titles and the Monospaced font for pricing details (e.g., $9.99/mo).
> - **Buttons:** Primary 'Subscribe' button should use the 'Electric Cobalt' (`#3E63DD`) solid fill. The 'Cancel' or 'Maybe Later' button should be a ghost button (no fill, simple grey text).
> - **Borders:** Use the `1px` `#28282A` border on all input fields and containers."

### Implementation Tip for your Agent:
If your agent uses **React Navigation**, tell it to use `navigation.replace()` for the final step in Phase 4.3. This replaces the "Login" stack with the "App" stack, preventing users from accidentally navigating "back" into the login screen after they are already paid members.