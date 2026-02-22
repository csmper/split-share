import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { StateService } from '../state';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-4xl font-sans font-medium tracking-tight text-slate-900 mb-8">Dashboard</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <mat-card class="p-6 rounded-2xl border-none shadow-sm bg-white">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Balance</span>
            <mat-icon class="text-slate-400">account_balance_wallet</mat-icon>
          </div>
          <div class="text-3xl font-sans font-semibold" [class.text-emerald-600]="totalBalance() > 0" [class.text-rose-600]="totalBalance() < 0">
            {{ totalBalance() | currency:'INR':'symbol':'1.0-0' }}
          </div>
          <p class="text-sm text-slate-500 mt-2">
            {{ totalBalance() >= 0 ? 'You are owed in total' : 'You owe in total' }}
          </p>
        </mat-card>

        <mat-card class="p-6 rounded-2xl border-none shadow-sm bg-white">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Groups</span>
            <mat-icon class="text-slate-400">group</mat-icon>
          </div>
          <div class="text-3xl font-sans font-semibold text-slate-900">
            {{ state.groups().length }}
          </div>
          <p class="text-sm text-slate-500 mt-2">Across all shared expenses</p>
        </mat-card>
      </div>

      <h2 class="text-xl font-sans font-medium text-slate-800 mb-4">Individual Balances</h2>
      <mat-card class="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
        <mat-list>
          @for (balance of otherBalances(); track balance.personId) {
            <mat-list-item class="py-2">
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
                    {{ getPersonName(balance.personId).charAt(0) }}
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">{{ getPersonName(balance.personId) }}</div>
                    <div class="text-xs text-slate-500">
                      {{ balance.amount > 0 ? 'owes you' : balance.amount < 0 ? 'you owe' : 'settled up' }}
                    </div>
                  </div>
                </div>
                <div class="font-semibold" [class.text-emerald-600]="balance.amount > 0" [class.text-rose-600]="balance.amount < 0">
                  {{ Math.abs(balance.amount) | currency:'INR':'symbol':'1.0-0' }}
                </div>
              </div>
            </mat-list-item>
            @if (!$last) { <hr class="border-slate-50 mx-4"> }
          } @empty {
            <div class="p-8 text-center text-slate-400">
              No balances to show. Add some expenses!
            </div>
          }
        </mat-list>
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class DashboardComponent {
  state = inject(StateService);
  Math = Math;

  totalBalance = computed(() => {
    const myBalance = this.state.balances().find(b => b.personId === '1');
    return myBalance ? myBalance.amount : 0;
  });

  otherBalances = computed(() => {
    return this.state.balances().filter(b => b.personId !== '1');
  });

  getPersonName(id: string) {
    return this.state.people().find(p => p.id === id)?.name || 'Unknown';
  }
}
