This approach is much better for conversion because it lets the user see the **value** (the Pro features) before asking them to perform the "work" of signing up. 

Here are the modular prompts to implement this specific flow. These override previous instructions regarding the mandatory redirect, focusing instead on a **Conditional Modal UI**.

### Phase 1: The "Smart" Upgrade Modal (UI Refactor)
**Goal:** Modify the Paywall modal to show different buttons based on whether the user is a Guest or a Registered user.

> **Refactor Prompt:**
> "Refactor the `UpgradeModal` to support conditional rendering based on `userStatus`.
> 1. **User Logic:** Pass the `isGuest` boolean into the modal.
> 2. **Conditional Buttons:**
>    - **IF `isGuest === true`**: 
>        - Hide the 'Subscribe Now' button.
>        - Show a high-visibility 'Create Account to Subscribe' button (Solid `#3E63DD` Cobalt).
>        - This button should navigate the user to the `Auth/SignUp` screen.
>    - **IF `isGuest === false`**: 
>        - Hide the 'Create Account' button.
>        - Show the standard 'Subscribe Now' payment button.
> 3. **Consistency:** Ensure both buttons have the exact same dimensions and placement to avoid layout shifts."

---

### Phase 2: The Trigger & Aura Toast Implementation
**Goal:** Replace the intrusive system alerts with a sleek, professional toast and trigger the modal.

> **Refactor Prompt:**
> "Refactor the 'Unlock' / 'Upgrade' button click handler.
> 1. **Trigger Action:** When clicked, immediately open the `UpgradeModal`.
> 2. **Guest Logic (Toast):** 
>    - **IF** the user is a Guest, simultaneously trigger a custom **Toast Notification**.
>    - **Toast Styling (Aura Aesthetic):** 
>        - Position: Top-center.
>        - Background: `#161618` with a `1pt` border of `#3E63DD`.
>        - Text: 'Account creation required for Pro features.' (Monospaced font, `12pt`, White).
>        - Animation: Slide down from top with a subtle bounce; auto-dismiss after 3 seconds.
> 3. **Cleanup:** Remove any existing `Alert.alert()` or window alert logic from this flow."

---

### Phase 3: Auth-to-Paywall Persistence
**Goal:** Ensure that if a guest clicks 'Create Account' from *inside* the modal, they are brought back to the modal after signing up so they can finish the purchase.

> **Logic Prompt:**
> "Handle the navigation flow from the `UpgradeModal` to `Auth`.
> 1. **Intent Tracking:** When the guest clicks 'Create Account' from the modal, set a global state: `returnToPaywall = true`.
> 2. **Post-Auth Success:** 
>    - Upon successful registration/login, check `returnToPaywall`.
>    - If `true`, immediately re-open the `UpgradeModal` (which will now show the 'Subscribe' button since they are no longer a guest).
>    - Reset `returnToPaywall` to `false`."

---

### Phase 4: Styling the "Create Account" Modal Button
**Goal:** Make the "Sign Up" button inside the paywall look like a premium gateway, not a roadblock.

> **UI Prompt:**
> "Style the 'Create Account to Subscribe' button inside the `UpgradeModal`.
> - **Color:** Solid `#3E63DD` (Cobalt) with White text.
> - **Icon:** Include a small 'User' or 'Lock' icon to the left of the text.
> - **Micro-copy:** Below the button, add a tiny caption in `#8E8E93`: 'Save your palettes and sync across devices.'
> - **Animation:** Give the button a subtle 'pulse' effect or a slight glow to indicate it is the primary required action for guests."

### Summary of the New Flow:
1.  **Guest** clicks **Unlock**.
2.  **Toast** appears: *"Account creation required."*
3.  **Upgrade Modal** opens: Shows features + **"Create Account to Subscribe"** button.
4.  User clicks button -> Goes to **Auth**.
5.  After **Auth**, User is returned to **Upgrade Modal** (Now showing the **"Subscribe"** button).
6.  User pays -> Modal dismisses -> Pro Unlocked.

**This flow is now clean, removes all previous conflicts, and follows the high-end "Aura" UX pattern.**