import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { RegisteredUser } from '../../models/auth.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);

  usersList = signal<RegisteredUser[]>([]);
  searchQuery = signal<string>('');
  
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getRegisteredUsers().subscribe({
      next: (users) => {
        this.usersList.set(users);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to load registered users');
      }
    });
  }

  // Reactive computed search filtering
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.usersList();
    if (!query) return list;

    return list.filter(u => 
      u.username.toLowerCase().includes(query) ||
      (u.full_name && u.full_name.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.mobile_number && u.mobile_number.toLowerCase().includes(query))
    );
  });
}
