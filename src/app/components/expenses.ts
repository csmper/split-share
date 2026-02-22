import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { StateService } from '../state';
import { Expense } from '../models';

@Component({
  selector: 'app-expenses',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatMenuModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-4xl font-sans font-medium tracking-tight text-slate-900">Expenses</h1>
        <button mat-flat-button color="primary" class="rounded-full px-6" (click)="onAddExpense()">
          <mat-icon>add</mat-icon>
          Add Expense
        </button>
      </div>

      <div class="space-y-4">
        @for (expense of state.expenses(); track expense.id) {
          <mat-card class="p-4 rounded-2xl border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                <span class="text-[10px] uppercase font-bold">{{ expense.date | date:'MMM' }}</span>
                <span class="text-lg font-semibold text-slate-700 leading-none">{{ expense.date | date:'dd' }}</span>
              </div>
              
              <div class="flex-1">
                <h3 class="font-medium text-slate-900">{{ expense.description }}</h3>
                <p class="text-sm text-slate-500">
                  {{ getPersonName(expense.paidById) }} paid {{ expense.amount | currency:'INR':'symbol':'1.0-0' }}
                </p>
              </div>

              <div class="text-right">
                <div class="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Your share</div>
                <div class="font-semibold" [class.text-rose-600]="getMyShare(expense) > 0" [class.text-slate-400]="getMyShare(expense) === 0">
                  {{ getMyShare(expense) | currency:'INR':'symbol':'1.0-0' }}
                </div>
              </div>

              <button mat-icon-button [matMenuTriggerFor]="menu" class="text-slate-300">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="state.deleteExpense(expense.id)">
                  <mat-icon class="text-rose-500">delete</mat-icon>
                  <span>Delete</span>
                </button>
              </mat-menu>
            </div>
          </mat-card>
        } @empty {
          <div class="py-20 text-center">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <mat-icon class="text-slate-300 scale-150">receipt_long</mat-icon>
            </div>
            <h3 class="text-lg font-medium text-slate-900">No expenses yet</h3>
            <p class="text-slate-500">Add your first expense to start splitting!</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ExpensesComponent {
  state = inject(StateService);
  router = inject(Router);

  getPersonName(id: string) {
    return this.state.people().find(p => p.id === id)?.name || 'Unknown';
  }

  getMyShare(expense: Expense) {
    if (expense.paidById === '1') return 0; // You paid, so you don't "owe"
    const mySplit = expense.splits.find(s => s.personId === '1');
    return mySplit ? mySplit.amount : 0;
  }

  onAddExpense() {
    this.router.navigate(['/add-expense']);
  }
}
