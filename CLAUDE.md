# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

Expo has changed significantly. Always read the versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any Expo-specific code.

## Commands

```bash
npm run start      # Expo Go / QR code (use this for fastest dev loop)
npm run ios        # iOS Simulator
npm run android    # Android emulator
npx tsc --noEmit   # Type-check without building
```

No test runner or linter is configured yet.

## Stack

- **Expo 56** / **React Native 0.85** / **React 19** / **TypeScript 6** (strict)
- **@react-navigation/native** v7 — stack + bottom tabs
- No backend — all data is local JSON in `src/data/`
- State: React Context (`ShoppingListContext`) — no Zustand/Redux
- Entry: `index.ts` → `App.tsx`

## Architecture

```
App.tsx                         Root navigator (stack wrapping tabs + modal)
src/
  types/index.ts                All shared types + AISLE_LABELS / AISLE_ORDER constants
  theme.ts                      Colors, spacing, border-radius constants
  navigation/types.ts           RootStackParamList, TabParamList, RecipesStackParamList
  data/
    recipes.json                17 mock recipes (Easy/Medium/Hard, incl. Cypriot dishes)
    products.json               ~190 products across 3 supermarkets (AlphaMega, Sklavenitis, Lidl)
    supermarkets.json           3 supermarket entries with id/name/accentColor
  services/
    recipeService.ts            getRecipes(), getRecipeById() — swap JSON for real API here
    productService.ts           matchIngredientToProduct() — matches by ingredientKey (lowercase)
    groceryListService.ts       buildShoppingList() — groups items by aisle using AISLE_ORDER
  context/
    ShoppingListContext.tsx     generateList(), toggleItem(), clearList() — wraps Root
  components/
    DifficultyBadge.tsx         Colour-coded Easy/Medium/Hard chip
    RecipeCard.tsx              Card used in the browse list
  screens/
    RecipeBrowseScreen.tsx      Filter pills + FlatList of RecipeCards
    RecipeDetailScreen.tsx      Ingredients, steps, sticky "Generate Shopping List" CTA
    SupermarketSelectorModal.tsx Modal — picks supermarket, calls generateList(), navigates to tab
    ShoppingListScreen.tsx      SectionList grouped by aisle, checkboxes, Share API export
```

## Navigation flow

```
Root Stack
├── MainTabs (Bottom Tab)
│   ├── RecipesTab → RecipesStack
│   │   ├── RecipeBrowse
│   │   └── RecipeDetail
│   └── ShoppingListTab → ShoppingListScreen
└── SupermarketSelector (modal, slide_from_bottom)
```

"Generate Shopping List" on RecipeDetail → SupermarketSelector modal → `generateList()` → navigates to ShoppingListTab.

## Data layer conventions

- `ingredientKey` in `products.json` must match `ingredient.name.toLowerCase().trim()` in `recipes.json` exactly — this is the lookup key in `productService.ts`.
- Service functions are all `async` returning Promises, even though they currently read local JSON — makes future API swap a drop-in.
- To add a new supermarket: add entry to `supermarkets.json`, add matching product rows to `products.json` using the same `ingredientKey` values.
