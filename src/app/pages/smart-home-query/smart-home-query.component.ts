import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, SmartHomeQuery } from '../../services/mock-data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-smart-home-query',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './smart-home-query.component.html',
  styleUrl: './smart-home-query.component.css'
})
export class SmartHomeQueryComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private authService = inject(AuthService);

  queriesList = signal<SmartHomeQuery[]>([]);
  statusFilter = signal<'All' | 'Pending' | 'Responded'>('All');

  // Input Form States
  customerName = signal('');
  phone = signal('');
  email = signal('');
  homeType = signal('Apartment');
  areaOfInterest = signal('Lighting Control');
  problemStatement = signal('');

  successMessage = signal('');
  errorMessage = signal('');

  homeTypes = ['Apartment', 'Independent Villa', 'Duplex House', 'Farm House', 'Commercial Shop / Office'];
  interestAreas = ['Lighting Control', 'Security Cameras', 'Appliance Automation', 'Climate / Fan Control', 'Full Smart Home Conversion'];

  ngOnInit() {
    this.loadQueries();
    this.prefillProfile();
  }

  loadQueries() {
    this.mockDataService.getSmartHomeQueries().subscribe({
      next: (queries) => {
        this.queriesList.set(queries);
      }
    });
  }

  prefillProfile() {
    const emailVal = this.authService.currentUserEmail();
    const usernameVal = this.authService.currentUserUsername();
    this.email.set(emailVal || usernameVal || '');

    const fullName = this.authService.currentUserFullName();
    this.customerName.set(fullName || '');

    const phoneVal = this.authService.currentUserPhone();
    this.phone.set(phoneVal || '');
  }

  submitQuery() {
    if (!this.customerName().trim()) {
      this.errorMessage.set('Please enter your name.');
      return;
    }
    if (!this.phone().trim()) {
      this.errorMessage.set('Please enter your phone number.');
      return;
    }
    if (!this.problemStatement().trim()) {
      this.errorMessage.set('Please explain what you want to automate, monitor, or control.');
      return;
    }

    const payload = {
      customerName: this.customerName().trim(),
      phone: this.phone().trim(),
      email: this.email().trim(),
      homeType: this.homeType(),
      areaOfInterest: this.areaOfInterest(),
      problemStatement: this.problemStatement().trim()
    };

    this.mockDataService.addSmartHomeQuery(payload);
    
    this.successMessage.set('Smart home automation request submitted successfully! Our expert will review it.');
    this.errorMessage.set('');
    
    // Clear inputs except contact details
    this.problemStatement.set('');
    this.loadQueries();

    // Auto clear alert
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  filteredQueries = computed(() => {
    const filter = this.statusFilter();
    const list = this.queriesList();
    
    if (filter === 'All') return list;
    return list.filter(q => q.status === filter);
  });
}
