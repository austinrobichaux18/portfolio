import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Recipe } from '../../../core/models/Recipe';
import { parseIngredientLine } from '../lib/ingredient-parser';
import { newRecipe } from '../lib/recipe-loader';
import { Library } from '../library/library';
import { RecipeEditor } from '../recipe-editor/recipe-editor';
import { RecipeView } from '../recipe-view/recipe-view';
import { InMemoryKitchenStore } from '../store/in-memory-kitchen-store';
import { KitchenStateService } from '../store/kitchen-state.service';
import { unsavedChangesGuard } from '../unsaved-changes.guard';

/** Spec helper: the child screens on real routes, backed by an in-memory library. */
export async function setupKitchen(recipes: Recipe[] = []) {
  TestBed.configureTestingModule({
    providers: [
      KitchenStateService,
      provideRouter([
        { path: '', component: Library },
        { path: 'new', component: RecipeEditor, canDeactivate: [unsavedChangesGuard] },
        { path: 'r/:id', component: RecipeView },
        { path: 'r/:id/edit', component: RecipeEditor, canDeactivate: [unsavedChangesGuard] },
      ]),
    ],
  });
  const store = new InMemoryKitchenStore(recipes, 'Test');
  const state = TestBed.inject(KitchenStateService);
  await state.useStore(store);
  const harness = await RouterTestingHarness.create();
  const router = TestBed.inject(Router);
  return { store, state, harness, router };
}

export function sampleRamen(): Recipe {
  const recipe = newRecipe('ramen', 'Ramen', { rating: 8, frequency: 'staple' });
  recipe.ingredientGroups = [
    { items: [{ ...parseIngredientLine('2 packs ramen noodles'), ingredientId: 'noodles' }] },
  ];
  recipe.stepGroups = [{ steps: [{ text: 'Boil the broth.' }, { text: 'Cook the noodles.' }] }];
  recipe.optionGroups = [
    {
      id: 'toppings',
      name: 'Toppings',
      kind: 'pickAny',
      defaultOptionIds: ['soft-egg'],
      options: [
        {
          id: 'soft-egg',
          name: 'Soft egg',
          ingredients: [parseIngredientLine('1 egg')],
          steps: [{ text: 'Boil the egg 6½ minutes.' }],
        },
        { id: 'broccoli', name: 'Broccoli', ingredients: [parseIngredientLine('1 cup broccoli florets')], steps: [] },
      ],
    },
    {
      id: 'protein',
      name: 'Protein',
      kind: 'pickOne',
      defaultOptionIds: ['chashu'],
      options: [
        { id: 'chashu', name: 'Chashu', ingredients: [parseIngredientLine('4 slices chashu pork')], steps: [] },
        { id: 'tofu', name: 'Tofu', ingredients: [parseIngredientLine('1 block tofu')], steps: [] },
      ],
    },
  ];
  recipe.tags = ['cuisine:japanese', 'meal:dinner'];
  return recipe;
}

export function sampleCake(): Recipe {
  const recipe = newRecipe('cake', 'Chocolate Cake', { trust: 'untested', frequency: 'want-to-try' });
  recipe.ingredientGroups = [{ items: [parseIngredientLine('2 cups flour'), parseIngredientLine('1 cup cocoa')] }];
  recipe.stepGroups = [{ steps: [{ text: 'Bake.' }] }];
  recipe.tags = ['meal:dessert'];
  return recipe;
}

export function text(element: HTMLElement): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ');
}
