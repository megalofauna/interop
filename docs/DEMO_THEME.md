# Demo App Theme: Orbital Station Parts Depot

The Interop demo app is set in a permanent space station in near-Earth orbit. The station runs a parts and supplies depot — a hardware store at the edge of atmosphere.

This setting gives demos a cohesive, non-generic identity without requiring visual design work. Item names, categories, and UI copy can all draw from this world.

## Active Theme

**Requisition Order** — a checkbox group representing items on a supply request:

| id | value | label |
|---|---|---|
| `plasma-conduit` | `plasma-conduit` | Plasma conduit |
| `mag-lock` | `mag-lock` | Mag-lock coupling |
| `hull-epoxy` | `hull-epoxy` | Hull epoxy (Type-7) |
| `eva-tether` | `eva-tether` | EVA tether |

Legend: `"Requisition order"`  
Select-all label: `"All items"`

---

## Unused Item Sets (keep for future demos)

### Medical Bay Restocking
Checkbox group for consumable supplies.

| id | label |
|---|---|
| `saline` | Saline IV bags |
| `nano-suture` | Nano-suture kit |
| `o2-canister` | O₂ canister (1L) |
| `rad-patch` | Rad exposure patch |

Legend: `"Bay 7 restock order"`

---

### Airlock Pre-Check
Boolean checklist — each item is a yes/no safety verification.

| id | label |
|---|---|
| `pressure-equalized` | Pressure equalized |
| `suit-integrity` | Suit integrity confirmed |
| `comm-check` | Comm check passed |
| `tether-attached` | Tether attached |

Legend: `"Airlock pre-departure checklist"`

---

### Crew Dietary Preferences
A softer, social context — crew meal planning.

| id | label |
|---|---|
| `no-allergens` | No common allergens |
| `low-sodium` | Low sodium |
| `vegetarian` | Vegetarian |
| `high-protein` | High protein |

Legend: `"Meal preference flags"`

---

### Shore Leave Activity Selection
Multi-select for crew downtime scheduling.

| id | label |
|---|---|
| `simulator` | Flight simulator |
| `hydro-garden` | Hydroponic garden |
| `rec-bay` | Rec bay |
| `comms-lounge` | Comms lounge (Earth call) |

Legend: `"Shore leave activities"`

---

## Tone Notes

- Names should feel functional, not campy. This is a working depot, not a movie set.
- Avoid "laser", "spaceship", "alien". Prefer maintenance, logistics, and industrial vocabulary.
- Numbers and specs add authenticity: `Type-7`, `1L`, `Bay 7`.
- The station has no name yet — leave that open.
