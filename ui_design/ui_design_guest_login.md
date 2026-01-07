This is a critical fix for both **Revenue Recovery** and **User Experience**. Allowing a guest to pay without an account often leads to "lost" subscriptions and restoration issues.

The solution is a **"Mandatory Handshake"** logic: The "Unlock" button must act as a guard that checks for an account *before* ever showing the paywall.

Here are the modular prompts for your coding agent to fix this specific flow.

### Phase 5.1: The "Upgrade Guard" Logic
**Goal:** Prevent the paywall from opening for guests and redirect them to sign up first.

> **Logic Prompt:**
> "Refactor the 'Unlock' / 'Upgrade' button click handler. 
> 1. **The Check:** When the user clicks 'Unlock', intercept the action. 
>    - **IF** `user.isGuest === true`: Do NOT show the paywall. Instead, navigate the user to the `SignUp` screen.
>    - **Pass State:** Pass a navigation parameter or set a global state flag: `redirectAfterAuth = 'UPGRADE_MODAL'`.
>    - **IF** `user.isRegistered === true`: Proceed directly to showing the `UpgradeModal`.
> 2. **Feedback:** If the user is a guest, show a brief 'Soft-Wall' message or toast before navigating: 'Create an account to secure your Pro features across devices.'"

---

### Phase 5.2: The Post-Signup "Auto-Trigger"
**Goal:** Once the guest completes the account creation, the app must automatically fulfill the original "intent" by popping up the paywall.

> **Logic Prompt:**
> "Modify the `AuthSuccess` logic (the function called after a user successfully creates an account).
> 1. **Check Intent:** Upon successful login/registration, check for the `redirectAfterAuth` flag.
> 2. **Auto-Trigger Paywall:** 
>    - **IF** `redirectAfterAuth === 'UPGRADE_MODAL'`: 
>        - Clear the flag immediately to prevent loops.
>        - Automatically trigger the `UpgradeModal` to open with a smooth slide-up animation.
>    - **ELSE:** Proceed to the standard app landing screen (Studio).
> 3. **Context Retention:** Ensure that if the user was in the middle of a specific feature (like the Palette Generator), the account creation happens 'on top' or returns them to that exact context before the paywall appears."

---

### Phase 5.3: The Purchase Success "Cleanup"
**Goal:** Fix the issue where the modal 'stays there' after payment. It should automatically dismiss and unlock the UI.

> **UX Prompt:**
> "Refactor the `onPurchaseSuccess` callback within the `UpgradeModal`.
> 1. **Dismissal:** Immediately call `modal.dismiss()` or `navigation.goBack()` as soon as the payment provider (App Store/Play Store) confirms success.
> 2. **State Refresh:** Call a global `refreshUserStatus()` function to ensure all 'Locked' UI elements (icons, buttons, overlays) instantly update to their 'Unlocked' states.
> 3. **Success Toast:** Show a high-end, Aura-style success confirmation: 
>    - Background: `#D1FF52` (Volt Green) with Black text.
>    - Message: 'Pro Features Unlocked. Welcome to the Atelier.'
>    - Duration: 2.0s."

---

### Phase 5.4: UI Polish - The "Why Sign Up?" Bridge
**Goal:** Since you are interrupting the user's desire to pay, you need to explain *why* they must create an account first so they don't get frustrated.

> **UI Prompt:**
> "Redesign the `SignUp` screen when accessed via an upgrade intent.
> - **Contextual Header:** Display a small banner at the top: 'Complete your profile to unlock PalettePro.'
> - **Value Prop:** Add a small 'Cloud' icon with text: 'Your palettes and subscriptions will be synced and safe.'
> - **Visuals:** Keep the 'Midnight Atelier' theme. Use the Monospaced font for the 'Why Sign Up' list items to maintain the professional tool aesthetic."

### Why this fixes your problem:
*   **No "Ghost" Payments:** Every payment is now tied to a permanent `UserID`.
*   **Seamless Flow:** The user clicks "Unlock," signs up, and the paywall appears exactly as they expected, just one step later.
*   **Clean Exit:** By automating the modal dismissal in Phase 5.3, you remove the "stuck modal" bug that is currently frustrating users.