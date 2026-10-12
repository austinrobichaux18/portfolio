import { Routes } from '@angular/router';
import { MyKitchen } from './my-kitchen';
import { KitchenStateService } from './store/kitchen-state.service';
import { unsavedChangesGuard } from './unsaved-changes.guard';

/** Child routes share one KitchenStateService, so the open folder survives navigation. */
export const routes: Routes = [
  {
    path: '',
    component: MyKitchen,
    providers: [KitchenStateService],
    children: [
      {
        path: '',
        loadComponent: () => import('./library/library').then((m) => m.Library),
      },
      {
        path: 'new',
        loadComponent: () => import('./recipe-editor/recipe-editor').then((m) => m.RecipeEditor),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'r/:id',
        loadComponent: () => import('./recipe-view/recipe-view').then((m) => m.RecipeView),
      },
      {
        path: 'r/:id/cook',
        loadComponent: () => import('./cook-mode/cook-mode').then((m) => m.CookMode),
      },
      {
        path: 'r/:id/edit',
        loadComponent: () => import('./recipe-editor/recipe-editor').then((m) => m.RecipeEditor),
        canDeactivate: [unsavedChangesGuard],
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
