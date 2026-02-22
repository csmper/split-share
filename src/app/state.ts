import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Person, Group, Expense } from './models';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  people = signal<Person[]>([
    { id: '1', name: 'You' }
  ]);

  groups = signal<Group[]>([]);
  expenses = signal<Expense[]>([]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadInitialState();
    }
  }

  private async loadInitialState() {
    try {
      const state = await firstValueFrom(this.http.get<{ people: Person[], groups: Group[], expenses: Expense[] }>('/api/state'));
      if (state.people.length > 0) {
        this.people.set(state.people);
      } else {
        // Ensure "You" exists if DB is empty
        this.savePerson(this.people()[0]);
      }
      this.groups.set(state.groups);
      this.expenses.set(state.expenses);
    } catch (error) {
      console.error('Failed to load initial state:', error);
    }
  }

  // Derived state: Balances
  balances = computed(() => {
    const balanceMap = new Map<string, number>();
    
    // Initialize balances for all people
    this.people().forEach(p => balanceMap.set(p.id, 0));

    this.expenses().forEach(expense => {
      // The person who paid gets the full amount added to their "owed" balance
      const currentPaidByBalance = balanceMap.get(expense.paidById) || 0;
      balanceMap.set(expense.paidById, currentPaidByBalance + expense.amount);

      // Each person in the split has their share subtracted from their balance
      expense.splits.forEach(split => {
        const currentSplitBalance = balanceMap.get(split.personId) || 0;
        balanceMap.set(split.personId, currentSplitBalance - split.amount);
      });
    });

    return Array.from(balanceMap.entries()).map(([personId, amount]) => ({
      personId,
      amount
    }));
  });

  async addPerson(name: string) {
    const newPerson: Person = {
      id: Math.random().toString(36).substring(2, 9),
      name
    };
    this.people.update(p => [...p, newPerson]);
    await this.savePerson(newPerson);
    return newPerson;
  }

  private async savePerson(person: Person) {
    try {
      await firstValueFrom(this.http.post('/api/people', person));
    } catch (error) {
      console.error('Failed to save person:', error);
    }
  }

  async addGroup(name: string, memberIds: string[]) {
    const newGroup: Group = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      memberIds
    };
    this.groups.update(g => [...g, newGroup]);
    await this.saveGroup(newGroup);
    return newGroup;
  }

  private async saveGroup(group: Group) {
    try {
      await firstValueFrom(this.http.post('/api/groups', group));
    } catch (error) {
      console.error('Failed to save group:', error);
    }
  }

  async addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense: Expense = {
      ...expense,
      id: Math.random().toString(36).substring(2, 9)
    };
    this.expenses.update(e => [newExpense, ...e]);
    await this.saveExpense(newExpense);
  }

  private async saveExpense(expense: Expense) {
    try {
      await firstValueFrom(this.http.post('/api/expenses', expense));
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  }

  async deleteExpense(id: string) {
    this.expenses.update(e => e.filter(exp => exp.id !== id));
    try {
      await firstValueFrom(this.http.delete(`/api/expenses/${id}`));
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  }

  async deletePerson(id: string) {
    if (id === '1') return;
    this.people.update(p => p.filter(person => person.id !== id));
    this.groups.update(gs => gs.map(g => ({
      ...g,
      memberIds: g.memberIds.filter(mid => mid !== id)
    })));
    
    try {
      await firstValueFrom(this.http.delete(`/api/people/${id}`));
      // Also update groups in DB
      for (const group of this.groups()) {
        await this.saveGroup(group);
      }
    } catch (error) {
      console.error('Failed to delete person:', error);
    }
  }

  async deleteGroup(id: string) {
    this.groups.update(g => g.filter(group => group.id !== id));
    try {
      await firstValueFrom(this.http.delete(`/api/groups/${id}`));
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  }
}
