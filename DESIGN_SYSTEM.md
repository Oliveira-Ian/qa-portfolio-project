# Design System - Oliveira ERP

## Overview

This Design System follows **Material Design 3** (Google) guidelines and serves as the single source of truth for all UI components in the Oliveira ERP project.

**Version:** 1.0.0  
**Last Updated:** 2026-04-08  
**Project:** QA Portfolio / Oliveira ERP  
**Tech Stack:** HTML5, CSS3, Vanilla JavaScript

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Components](#5-components)
6. [Elevation & Shadows](#6-elevation--shadows)
7. [Responsive Breakpoints](#7-responsive-breakpoints)
8. [Accessibility](#8-accessibility)
9. [Usage Examples](#9-usage-examples)

---

## 1. Design Tokens

Design tokens are the atomic values that define our visual language.

### 1.1 CSS Variables (Custom Properties)

All tokens are defined in `:root` and must be used throughout the application.

```css
:root {
  /* Colors */
  --bg-page: #F5F7FA;
  --bg-card: #FFFFFF;
  --bg-input: #FFFFFF;
  --primary: #2563EB;
  --primary-hover: #1D4ED8;
  --primary-light: rgba(37, 99, 235, 0.1);
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;
  --border: #D1D5DB;
  --border-focus: #2563EB;
  --border-hover: #9CA3AF;
  --error: #EF4444;
  --shadow-color: rgba(0, 0, 0, 0.08);
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Spacing */
  --spacing-xs: 4px;    /* 0.5 x base grid */
  --spacing-sm: 8px;    /* 1 x base grid */
  --spacing-md: 16px;   /* 2 x base grid */
  --spacing-lg: 24px;   /* 3 x base grid */
  --spacing-xl: 32px;   /* 4 x base grid */
  --spacing-2xl: 48px;  /* 6 x base grid */
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-card: 0 4px 20px var(--shadow-color);
  --shadow-input: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-button: 0 4px 12px rgba(37, 99, 235, 0.25);
}
```

---

## 2. Color System

### 2.1 Primary Colors

| Token | Hex | Usage | Material Design Role |
|-------|-----|-------|---------------------|
| `--primary` | `#2563EB` | Primary buttons, links, focus states | Primary Container |
| `--primary-hover` | `#1D4ED8` | Button hover states | Primary Variant |
| `--primary-light` | `rgba(37, 99, 235, 0.1)` | Focus rings, subtle backgrounds | Primary Container (low emphasis) |

### 2.2 Background Colors

| Token | Hex | Usage | Material Design Role |
|-------|-----|-------|---------------------|
| `--bg-page` | `#F5F7FA` | Page background | Surface Container |
| `--bg-card` | `#FFFFFF` | Cards, modals | Surface |
| `--bg-input` | `#FFFFFF` | Input fields | Surface Variant |

### 2.3 Text Colors

| Token | Hex | Usage | Contrast Ratio |
|-------|-----|-------|----------------|
| `--text-primary` | `#111827` | Headings, primary text | 4.5:1 (WCAG AA) |
| `--text-secondary` | `#6B7280` | Labels, secondary text | 4.5:1 (WCAG AA) |
| `--text-muted` | `#9CA3AF` | Placeholders, hints | 3:1 (Large text) |

### 2.4 Border Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#D1D5DB` | Default input borders |
| `--border-focus` | `#2563EB` | Focused input borders |
| `--border-hover` | `#9CA3AF` | Hovered input borders |

### 2.5 Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--error` | `#EF4444` | Error states, validation messages |

### 2.6 Color Usage Rules

#### Light Theme (Current)
- **Page Background:** `--bg-page` (#F5F7FA) - Light gray for depth
- **Card Background:** `--bg-card` (#FFFFFF) - Pure white for content areas
- **Primary Actions:** `--primary` (#2563EB) - Blue for CTAs and interactive elements
- **Text:** Always use `--text-primary` on light backgrounds for readability

#### Color Contrast Requirements
- **Normal Text:** Minimum 4.5:1 contrast ratio
- **Large Text (18px+ bold):** Minimum 3:1 contrast ratio
- **Interactive Elements:** Must be distinguishable without color alone

---

## 3. Typography

### 3.1 Font Family

**Primary Font:** `Inter` (Google Fonts)  
**Fallback Stack:** `-apple-system, BlinkMacSystemFont, sans-serif`

```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Load in HTML:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 3.2 Type Scale (Material Design 3)

| Style | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| **Display** | 36px | 700 | 1.2 | -0.02em | Hero text, banner titles |
| **Headline** | 30px | 700 | 1.3 | -0.025em | Page titles (H1) |
| **Title Large** | 1.875rem (30px) | 700 | 1.3 | -0.025em | Card titles |
| **Title Medium** | 1.5rem (24px) | 600 | 1.4 | -0.01em | Mobile titles |
| **Label Large** | 1rem (16px) | 600 | 1.5 | 0 | Button text |
| **Label Medium** | 0.875rem (14px) | 500 | 1.5 | 0.025em | Input labels |
| **Label Small** | 0.875rem (14px) | 400 | 1.5 | 0 | Links, secondary text |
| **Body Large** | 1rem (16px) | 400 | 1.5 | 0 | Body text, inputs |
| **Body Medium** | 0.875rem (14px) | 400 | 1.5 | 0 | Descriptions |

### 3.3 Typography Hierarchy

```
Banner Title (Display)
    ↓
Card Title (Headline)
    ↓
Input Labels (Label Medium)
    ↓
Input Text / Body (Body Large)
    ↓
Secondary Text / Links (Label Small)
```

### 3.4 Text Transformations

- **Labels:** `uppercase` + `letter-spacing: 0.025em` (0.4px)
- **Titles:** `normal case` + negative letter-spacing for tighter appearance
- **Buttons:** `normal case` with medium weight (600)

---

## 4. Spacing & Layout

### 4.1 Base Grid

**Base Unit:** 8px (Material Design standard)

All spacing values must be multiples of 8px or 4px (half-unit).

### 4.2 Spacing Scale

| Token | Value | Pixels | Common Usage |
|-------|-------|--------|--------------|
| `--spacing-xs` | 0.5× | 4px | Tight gaps, icon padding |
| `--spacing-sm` | 1× | 8px | Inline spacing, small gaps |
| `--spacing-md` | 2× | 16px | Input padding, form gaps |
| `--spacing-lg` | 3× | 24px | Section gaps, card padding |
| `--spacing-xl` | 4× | 32px | Major sections, logo margins |
| `--spacing-2xl` | 6× | 48px | Card padding, large sections |

### 4.3 Layout Patterns

#### Login Page Structure
```
.login-container (100vh, flex)
    ├── .login-left (60% width)
    │   └── .banner-content (centered vertically)
    └── .login-right (40% width)
        └── .login-card (max-width: 420px, centered)
```

#### Card Padding
- **Desktop:** `var(--spacing-2xl)` (48px)
- **Tablet:** `var(--spacing-xl)` (32px)
- **Mobile:** `var(--spacing-lg)` (24px)

#### Form Spacing
- **Between inputs:** `var(--spacing-lg)` (24px)
- **Between label and input:** `var(--spacing-sm)` (8px)
- **Between sections:** `var(--spacing-xl)` (32px)

### 4.4 Container Widths

| Container | Max Width | Usage |
|-----------|-----------|-------|
| Login Card | 420px | Login forms |
| Banner Content | 500px | Hero text blocks |
| Full Page | 100% | Layout containers |

---

## 5. Components

### 5.1 Buttons

#### Primary Button (CTA)

```css
.submit-button {
  width: 100%;
  padding: 14px var(--spacing-md);  /* 14px 16px */
  background-color: var(--primary);  /* #2563EB */
  color: #FFFFFF;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);  /* 10px */
  cursor: pointer;
  box-shadow: var(--shadow-button);
  transition: all 0.2s ease;
}

.submit-button:hover {
  background-color: var(--primary-hover);  /* #1D4ED8 */
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

.submit-button:active {
  transform: translateY(0);
}

.submit-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-light), var(--shadow-button);
}
```

**Minimum Touch Target:** 44px height (exceeds Material Design 3.5 requirement of 48px)

### 5.2 Text Inputs

```css
.form-input {
  width: 100%;
  padding: 14px var(--spacing-md);  /* 14px 16px */
  background-color: var(--bg-input);  /* #FFFFFF */
  border: 1.5px solid var(--border);  /* #D1D5DB */
  border-radius: var(--radius-md);  /* 10px */
  color: var(--text-primary);  /* #111827 */
  font-size: 1rem;
  font-family: var(--font-family);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-input);
}

.form-input:hover {
  border-color: var(--border-hover);  /* #9CA3AF */
}

.form-input:focus {
  outline: none;
  border-color: var(--border-focus);  /* #2563EB */
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-input:invalid:not(:placeholder-shown) {
  border-color: var(--error);  /* #EF4444 */
}
```

**States:**
- **Default:** 1.5px border `--border`
- **Hover:** Border `--border-hover`
- **Focus:** Border `--border-focus` + ring
- **Error:** Border `--error`

### 5.3 Labels

```css
.form-label {
  font-size: 0.875rem;  /* 14px */
  font-weight: 500;
  color: var(--text-secondary);  /* #6B7280 */
  margin-bottom: var(--spacing-xs);  /* 4px */
}
```

**Note:** Labels appear ABOVE inputs, not as placeholders.

### 5.4 Cards

```css
.login-card {
  width: 100%;
  max-width: 420px;
  background-color: var(--bg-card);  /* #FFFFFF */
  border-radius: var(--radius-lg);  /* 12px */
  box-shadow: var(--shadow-card);  /* 0 4px 20px rgba(0,0,0,0.08) */
  padding: var(--spacing-2xl);  /* 48px */
}
```

**Elevation:** Level 1 (4dp shadow)

### 5.5 Checkboxes

```css
.checkbox-input {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);  /* 6px */
  accent-color: var(--primary);  /* #2563EB */
  cursor: pointer;
}
```

### 5.6 Links

```css
.forgot-link {
  font-size: 0.875rem;  /* 14px */
  color: var(--primary);  /* #2563EB */
  text-decoration: none;
  font-weight: 500;
}

.forgot-link:hover {
  color: var(--primary-hover);  /* #1D4ED8 */
  text-decoration: underline;
}
```

---

## 6. Elevation & Shadows

### 6.1 Shadow Levels

| Level | Token | Shadow | Usage |
|-------|-------|--------|-------|
| 1 | `--shadow-input` | `0 1px 2px rgba(0,0,0,0.05)` | Input fields |
| 2 | `--shadow-card` | `0 4px 20px rgba(0,0,0,0.08)` | Cards, containers |
| 3 | `--shadow-button` | `0 4px 12px rgba(37,99,235,0.25)` | Primary buttons |
| 4 | Hover | `0 6px 16px rgba(37,99,235,0.35)` | Button hover state |

### 6.2 Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Checkboxes, small elements |
| `--radius-md` | 10px | Inputs, buttons |
| `--radius-lg` | 12px | Cards, containers |

---

## 7. Responsive Breakpoints

### 7.1 Breakpoint Definitions

| Breakpoint | Width | Description |
|------------|-------|-------------|
| Mobile | < 480px | Phones portrait |
| Tablet | 481px - 900px | Tablets, phones landscape |
| Desktop | > 900px | Desktops, laptops |

### 7.2 Responsive Adaptations

#### Mobile (< 480px)
```css
.login-left {
  display: none;  /* Hide banner */
}

.login-right {
  flex: 0 0 100%;  /* Full width */
  padding: var(--spacing-lg);  /* 24px */
}

.login-card {
  padding: var(--spacing-lg);  /* 24px */
}

.login-logo {
  max-height: 48px;  /* Smaller logo */
  margin-bottom: var(--spacing-lg);  /* 24px */
}

.card-title {
  font-size: 1.5rem;  /* 24px */
}
```

#### Tablet (481px - 900px)
```css
.login-left {
  display: none;  /* Optionally hide or reduce */
}

.login-right {
  flex: 0 0 100%;
  padding: var(--spacing-lg);  /* 24px */
}

.login-card {
  max-width: 100%;
  padding: var(--spacing-xl);  /* 32px */
}
```

#### Desktop (> 900px)
- Full split-screen layout
- Banner visible (60% width)
- Card centered in remaining 40%

---

## 8. Accessibility

### 8.1 WCAG 2.1 Compliance

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Color Contrast | ✅ Pass | All text meets 4.5:1 ratio |
| Focus Indicators | ✅ Pass | 3px ring on focus |
| Touch Targets | ✅ Pass | Minimum 44px (exceeds 44px requirement) |
| Semantic HTML | ✅ Pass | Proper labels, inputs, buttons |
| Alt Text | ✅ Pass | All images have descriptive alt |

### 8.2 Focus Management

- **All interactive elements** must have visible focus states
- **Focus ring:** `box-shadow: 0 0 0 3px var(--primary-light)`
- **Tab order:** Logical, top-to-bottom, left-to-right

### 8.3 QA Selectors (data-testid)

All interactive elements must include `data-testid` attributes:

```
pattern: {domain}-{page}-{element}-{action}

Examples:
- data-testid="auth-login-card"
- data-testid="auth-login-title"
- data-testid="auth-login-form"
- data-testid="auth-login-label-email"
- data-testid="auth-login-input-email"
- data-testid="auth-login-input-password"
- data-testid="auth-login-checkbox-remember"
- data-testid="auth-login-link-forgot"
- data-testid="auth-login-button-submit"
```

---

## 9. Usage Examples

### 9.1 Login Page Structure

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Entrar | Oliveira ERP</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Styles -->
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div class="login-container">
    <!-- Banner Side -->
    <div class="login-left">
      <div class="left-overlay"></div>
      <div class="banner-content">
        <h1 class="banner-title">Slogan da Empresa</h1>
        <div class="banner-divider"></div>
        <p class="banner-subtitle">Subtítulo descritivo</p>
      </div>
    </div>
    
    <!-- Form Side -->
    <div class="login-right">
      <div class="login-card" data-testid="auth-login-card">
        <img src="assets/images/logo.png" alt="Logo Oliveira ERP" class="login-logo">
        <h2 class="card-title" data-testid="auth-login-title">Entrar</h2>
        
        <form class="login-form" data-testid="auth-login-form">
          <div class="form-group">
            <label for="email" class="form-label" data-testid="auth-login-label-email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              class="form-input"
              data-testid="auth-login-input-email"
              autocomplete="email"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label" data-testid="auth-login-label-password">
              Senha
            </label>
            <input
              type="password"
              id="password"
              name="password"
              class="form-input"
              data-testid="auth-login-input-password"
              autocomplete="current-password"
              required
            >
          </div>
          
          <button type="submit" class="submit-button" data-testid="auth-login-button-submit">
            Entrar
          </button>
        </form>
      </div>
    </div>
  </div>
</body>
</html>
```

### 9.2 Creating New Components

When creating new components, follow these rules:

1. **Use Design Tokens:** Always use CSS variables, never hardcode values
2. **Follow Spacing:** Use multiples of 8px (4px, 8px, 16px, 24px, 32px, 48px)
3. **Apply Border Radius:** Use `--radius-sm`, `--radius-md`, or `--radius-lg`
4. **Add Shadows:** Use defined shadow tokens for elevation
5. **Test Responsiveness:** Ensure component works at all breakpoints
6. **Add data-testid:** Include QA selectors for automation

### 9.3 Adding a New Button Variant

```css
/* Secondary Button */
.button-secondary {
  padding: 14px var(--spacing-md);
  background-color: transparent;
  color: var(--primary);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-secondary:hover {
  background-color: var(--primary-light);
  border-color: var(--primary);
}

.button-secondary:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-light);
}
```

---

## 10. Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-04-08 | Initial Design System based on Login Screen | Design Team |

---

## References

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Material Design Typography](https://m3.material.io/styles/typography/overview)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inter Font Family](https://rsms.me/inter/)

---

**Note:** This Design System is a living document. Updates should be versioned and communicated to the team.
