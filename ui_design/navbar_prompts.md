To upgrade the **Bottom Navigation Bar** to match the premium "Studio" aesthetic, we should move away from the standard flat bar.

The modern trend for creative apps is a **"Floating Dock"** style—a bar that floats slightly above the bottom edge, has rounded corners, soft shadows, and uses fluid animations.

Here are the modular prompts to build this custom navigation bar.

### Module 1: The "Floating Dock" Container (Visual Structure)

**Goal:** Replace the default flat bar with a custom, floating "Glass" container.

**Prompt:**
> Create a new component named `CustomTabBar.tsx` to replace the default Bottom Tab Bar.
>
> **Visual Design:**
> 1.  **Container Geometry:**
>     *   Instead of stretching full width, make it a **Floating Pill**.
>     *   Margins: 20px from the bottom, 20px from left/right.
>     *   Height: Approx 65px or 70px.
>     *   Border Radius: 35px (Full pill shape).
> 2.  **Background & Depth:**
>     *   Background: Semi-transparent White (`rgba(255, 255, 255, 0.95)`).
>     *   **Shadow:** This is crucial for the "floating" look. Use a high-quality iOS shadow:
>         *   `shadowColor: "#000"`
>         *   `shadowOffset: { width: 0, height: 10 }`
>         *   `shadowOpacity: 0.15`
>         *   `shadowRadius: 20`
>         *   `elevation: 10` (for Android).
> 3.  **Layout:**
>     *   Use `flexDirection: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`.
>     *   Add internal padding (horizontal 10px) to space items comfortably.
>
> **Integration:**
> *   Provide the code to hook this component into `Tab.Navigator` using the `tabBar={(props) => <CustomTabBar {...props} />}` prop.

---

### Module 2: The Tab Item & Icons (Typography & Style)

**Goal:** Style the individual tabs. We will hide the text labels for a cleaner look (or keep them very subtle) and focus on the icons.

**Prompt:**
> Implement the logic for rendering tab items inside `CustomTabBar.tsx`.
>
> **Styling Requirements:**
> 1.  **Icon Styling:**
>     *   **Active State:** The icon should be **Solid Black** (`#1A1A1A`) and slightly larger (scale 1.1).
>     *   **Inactive State:** The icon should be **Medium Gray** (`#A1A1A1`) and normal scale (1.0).
> 2.  **Labels (Optional):**
>     *   *Recommendation:* For a sleek look, **hide the text labels** completely and rely on the icons.
>     *   *If labels are kept:* Use the **Inter** font (size 10px, bold) and only show the label for the *Active* tab (hide inactive labels).
> 3.  **Interaction Area:**
>     *   Make each tab a circular or pill-shaped hit area (`height: 50`, `width: 50`) so it's easy to tap.

---

### Module 3: The "Magic" Active Indicator (Animation)

**Goal:** Add a fluid background circle that slides to the active tab (like a spotlight).

**Prompt:**
> Add a **Sliding Active Indicator** to the `CustomTabBar` using `react-native-reanimated`.
>
> **Animation Logic:**
> 1.  **The Indicator:** Create an absolute positioned `Animated.View` inside the tab bar.
>     *   Shape: A Circle (approx 50x50) or Squircle.
>     *   Color: Very light gray (`#F2F2F7`) or a subtle accent color.
>     *   Z-Index: Place it *behind* the icons.
> 2.  **Movement:**
>     *   Calculate the position of the active tab index.
>     *   Use `useAnimatedStyle` and `withSpring` to animate the indicator's `translateX` value.
>     *   *Result:* When the user taps Tab 2, the background circle creates a physical "sliding" motion from Tab 1 to Tab 2.

---

### Module 4: Micro-Interactions (Scale & Haptics)

**Goal:** Make the bar feel tactile and responsive.

**Prompt:**
> Add micro-interactions to the individual tab buttons.
>
> **Tasks:**
> 1.  **Press Animation:**
>     *   Wrap the tab icon in an `Animated.View`.
>     *   On `onPressIn`: Animate scale down to 0.9.
>     *   On `onPressOut`: Animate scale back to 1.0 (or 1.1 if active).
> 2.  **Haptic Feedback:**
>     *   Trigger `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` immediately when a tab is pressed.

### Summary of the New Look
By running these prompts, your standard bottom bar will transform into a **floating, white, pill-shaped dock**. When you tap an icon, a **subtle light-gray circle slides** underneath it, the icon **snaps** slightly, and the phone gives a gentle **haptic tick**. This matches high-end iOS design standards.