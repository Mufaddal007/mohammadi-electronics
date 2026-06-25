import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, User } from '../../services/mock-data.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private dataService = inject(MockDataService);

  usersList = signal<User[]>([]);
  searchQuery = signal<string>('');
  
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.usersList.set(this.dataService.getUsersList());
  }

  // Reactive computed search filtering
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.usersList();
    if (!query) return list;

    return list.filter(u => 
      u.name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query)
    );
  });

  onDeleteUser(email: string) {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (confirm(`Are you sure you want to delete user ${email}?`)) {
      const res = this.dataService.deleteUser(email);
      if (res.success) {
        this.successMessage.set(res.message);
        this.loadUsers();
      } else {
        this.errorMessage.set(res.message);
      }
    }
  }
}
