import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard';
import { ExpensesComponent } from './components/expenses';
import { AddExpenseComponent } from './components/add-expense';
import { SettingsComponent } from './components/settings';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'add-expense', component: AddExpenseComponent },
  { path: 'settings', component: SettingsComponent },
];
