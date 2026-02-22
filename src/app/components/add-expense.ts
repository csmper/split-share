import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { StateService } from '../state';
import { AIService } from '../ai';
import { SplitType, Split } from '../models';

@Component({
  selector: 'app-add-expense',
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatCheckboxModule
  ],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <button mat-icon-button (click)="router.navigate(['/expenses'])">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-4xl font-sans font-medium tracking-tight text-slate-900">Add Expense</h1>
      </div>

      <mat-card class="p-6 rounded-2xl border-none shadow-sm bg-white mb-6">
        <div class="flex items-center gap-2 mb-4 text-emerald-600">
          <mat-icon class="scale-75">auto_awesome</mat-icon>
          <span class="text-sm font-semibold uppercase tracking-wider">AI Quick Add</span>
        </div>
        <div class="flex gap-2">
          <mat-form-field class="flex-1" appearance="outline" subscriptSizing="dynamic">
            <mat-label>Describe the expense...</mat-label>
            <input matInput #aiInput placeholder="e.g. I paid 1200 for dinner with Alice and Bob">
          </mat-form-field>
          <button mat-flat-button color="accent" class="h-[56px] rounded-xl" (click)="useAI(aiInput.value)">
            Magic
          </button>
        </div>
        <p class="text-xs text-slate-400 mt-2 italic">Try: "Paid 500 for auto rickshaw, Alice owes half"</p>
      </mat-card>

      <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <mat-card class="p-6 rounded-2xl border-none shadow-sm bg-white">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <input matInput formControlName="description" placeholder="What was it for?">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Amount</mat-label>
              <input matInput type="number" formControlName="amount" placeholder="0">
              <span matPrefix>₹&nbsp;</span>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Who paid?</mat-label>
              <mat-select formControlName="paidById">
                @for (person of state.people(); track person.id) {
                  <mat-option [value]="person.id">{{ person.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date</mat-label>
              <input matInput type="date" formControlName="date">
            </mat-form-field>
          </div>
        </mat-card>

        <mat-card class="p-6 rounded-2xl border-none shadow-sm bg-white">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-medium text-slate-900">Split with</h3>
            <mat-form-field appearance="outline" class="w-32" subscriptSizing="dynamic">
              <mat-select formControlName="splitType">
                <mat-option value="equal">Equally</mat-option>
                <mat-option value="percentage">Percentage</mat-option>
                <mat-option value="exact">Exact</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="space-y-3">
            @for (person of state.people(); track person.id; let i = $index) {
              <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <mat-checkbox [checked]="isPersonInvolved(person.id)" (change)="togglePerson(person.id)">
                  {{ person.name }}
                </mat-checkbox>
                
                <div class="flex-1"></div>

                @if (expenseForm.get('splitType')?.value === 'equal') {
                  <div class="text-sm font-medium text-slate-500">
                    {{ calculateEqualShare() | currency:'INR':'symbol':'1.0-0' }}
                  </div>
                } @else if (expenseForm.get('splitType')?.value === 'percentage') {
                  <div class="flex items-center gap-2">
                    <input type="number" class="w-16 text-right border-b border-slate-200 focus:border-emerald-500 outline-none p-1" 
                           [value]="getPersonPercentage(person.id)"
                           (input)="updatePersonPercentage(person.id, $any($event.target).value)">
                    <span class="text-slate-400">%</span>
                  </div>
                } @else {
                  <div class="flex items-center gap-2">
                    <span class="text-slate-400">₹</span>
                    <input type="number" class="w-20 text-right border-b border-slate-200 focus:border-emerald-500 outline-none p-1"
                           [value]="getPersonExact(person.id)"
                           (input)="updatePersonExact(person.id, $any($event.target).value)">
                  </div>
                }
              </div>
            }
          </div>
        </mat-card>

        <div class="flex gap-4">
          <button mat-button type="button" class="flex-1 h-12 rounded-xl" (click)="router.navigate(['/expenses'])">Cancel</button>
          <button mat-flat-button color="primary" type="submit" class="flex-1 h-12 rounded-xl" [disabled]="!expenseForm.valid">
            Save Expense
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
  `]
})
export class AddExpenseComponent {
  fb = inject(FormBuilder);
  state = inject(StateService);
  ai = inject(AIService);
  router = inject(Router);

  involvedPersonIds = signal<string[]>(this.state.people().map(p => p.id));
  customSplits = signal<Record<string, number>>({});

  expenseForm = this.fb.group({
    description: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paidById: ['1', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    splitType: ['equal' as SplitType]
  });

  async useAI(text: string) {
    if (!text) return;
    try {
      const result = await this.ai.parseExpense(text, this.state.people());
      this.expenseForm.patchValue({
        description: result.description,
        amount: result.amount,
        paidById: result.paidByPersonId,
        splitType: result.splitType
      });
      this.involvedPersonIds.set(result.involvedPersonIds);
    } catch (err) {
      console.error('AI parsing failed', err);
    }
  }

  isPersonInvolved(id: string) {
    return this.involvedPersonIds().includes(id);
  }

  togglePerson(id: string) {
    this.involvedPersonIds.update(ids => 
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  calculateEqualShare() {
    const amount = this.expenseForm.get('amount')?.value || 0;
    const count = this.involvedPersonIds().length;
    return count > 0 ? amount / count : 0;
  }

  getPersonPercentage(id: string) {
    return this.customSplits()[id] || 0;
  }

  updatePersonPercentage(id: string, value: string) {
    this.customSplits.update(s => ({ ...s, [id]: parseFloat(value) || 0 }));
  }

  getPersonExact(id: string) {
    return this.customSplits()[id] || 0;
  }

  updatePersonExact(id: string, value: string) {
    this.customSplits.update(s => ({ ...s, [id]: parseFloat(value) || 0 }));
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      const formValue = this.expenseForm.value;
      const amount = formValue.amount || 0;
      const splitType = formValue.splitType as SplitType;
      
      let splits: Split[] = [];

      if (splitType === 'equal') {
        const share = this.calculateEqualShare();
        splits = this.involvedPersonIds().map(id => ({
          personId: id,
          amount: share
        }));
      } else if (splitType === 'percentage') {
        splits = this.involvedPersonIds().map(id => ({
          personId: id,
          amount: (amount * (this.customSplits()[id] || 0)) / 100,
          percentage: this.customSplits()[id]
        }));
      } else {
        splits = this.involvedPersonIds().map(id => ({
          personId: id,
          amount: this.customSplits()[id] || 0
        }));
      }

      this.state.addExpense({
        description: formValue.description!,
        amount: amount,
        paidById: formValue.paidById!,
        date: formValue.date!,
        splitType: splitType,
        splits: splits
      });

      this.router.navigate(['/expenses']);
    }
  }
}
