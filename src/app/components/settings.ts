import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { StateService } from '../state';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatListModule
  ],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-4xl font-sans font-medium tracking-tight text-slate-900 mb-8">Settings</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- People Management -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-sans font-medium text-slate-800">People</h2>
            <button mat-icon-button color="primary" (click)="showAddPerson = !showAddPerson">
              <mat-icon>{{ showAddPerson ? 'close' : 'person_add' }}</mat-icon>
            </button>
          </div>

          @if (showAddPerson) {
            <mat-card class="p-4 rounded-2xl border-none shadow-sm bg-white mb-4">
              <div class="flex gap-2">
                <mat-form-field class="flex-1" appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Name</mat-label>
                  <input matInput #personName (keyup.enter)="addPerson(personName.value); personName.value = ''">
                </mat-form-field>
                <button mat-flat-button color="primary" class="h-[56px] rounded-xl" (click)="addPerson(personName.value); personName.value = ''">
                  Add
                </button>
              </div>
            </mat-card>
          }

          <mat-card class="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
            <mat-list>
              @for (person of state.people(); track person.id) {
                <mat-list-item>
                  <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-medium">
                        {{ person.name.charAt(0) }}
                      </div>
                      <span class="text-slate-900">{{ person.name }}</span>
                      @if (person.id === '1') {
                        <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">You</span>
                      }
                    </div>
                    @if (person.id !== '1') {
                      <button mat-icon-button (click)="state.deletePerson(person.id)">
                        <mat-icon class="text-rose-400">delete</mat-icon>
                      </button>
                    }
                  </div>
                </mat-list-item>
                @if (!$last) { <hr class="border-slate-50 mx-4"> }
              }
            </mat-list>
          </mat-card>
        </section>

        <!-- Group Management -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-sans font-medium text-slate-800">Groups</h2>
            <button mat-icon-button color="primary" (click)="showAddGroup = !showAddGroup">
              <mat-icon>{{ showAddGroup ? 'close' : 'group_add' }}</mat-icon>
            </button>
          </div>

          @if (showAddGroup) {
            <mat-card class="p-4 rounded-2xl border-none shadow-sm bg-white mb-4">
              <div class="flex flex-col gap-3">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Group Name</mat-label>
                  <input matInput #groupName>
                </mat-form-field>
                <button mat-flat-button color="primary" class="h-12 rounded-xl" (click)="addGroup(groupName.value); groupName.value = ''">
                  Create Group
                </button>
              </div>
            </mat-card>
          }

          <mat-card class="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
            <mat-list>
              @for (group of state.groups(); track group.id) {
                <mat-list-item>
                  <div class="flex items-center justify-between w-full">
                    <div class="flex flex-col py-2">
                      <span class="font-medium text-slate-900">{{ group.name }}</span>
                      <span class="text-xs text-slate-500">{{ group.memberIds.length }} members</span>
                    </div>
                    <button mat-icon-button (click)="state.deleteGroup(group.id)">
                      <mat-icon class="text-rose-400">delete</mat-icon>
                    </button>
                  </div>
                </mat-list-item>
                @if (!$last) { <hr class="border-slate-50 mx-4"> }
              } @empty {
                <div class="p-8 text-center text-slate-400 italic">No groups created</div>
              }
            </mat-list>
          </mat-card>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SettingsComponent {
  state = inject(StateService);
  showAddPerson = false;
  showAddGroup = false;

  addPerson(name: string) {
    if (name.trim()) {
      this.state.addPerson(name.trim());
      this.showAddPerson = false;
    }
  }

  addGroup(name: string) {
    if (name.trim()) {
      // For simplicity, new groups include everyone for now
      this.state.addGroup(name.trim(), this.state.people().map(p => p.id));
      this.showAddGroup = false;
    }
  }
}
