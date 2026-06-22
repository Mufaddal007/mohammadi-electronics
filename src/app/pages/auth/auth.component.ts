import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private dataService = inject(MockDataService);
  private router = inject(Router);

  isSignUp = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Form Fields
  signInEmail = '';
  signInPassword = signal('');

  signUpName = '';
  signUpEmail = '';
  signUpPassword = signal('');

  // Reactive Password Strength for Lamp Animation
  passwordStrength = computed(() => {
    const pwd = this.isSignUp() ? this.signUpPassword() : this.signInPassword();
    if (!pwd) return 0; // Off
    if (pwd.length < 6) return 1; // Weak

    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

    if (pwd.length >= 8 && hasUpper && hasNumber && hasSymbol) {
      return 3; // Strong
    }
    return 2; // Medium
  });

  passwordStrengthLabel = computed(() => {
    switch (this.passwordStrength()) {
      case 1: return 'Weak';
      case 2: return 'Medium';
      case 3: return 'Strong';
      default: return 'Empty';
    }
  });

  toggleMode() {
    this.isSignUp.update(val => !val);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.signInPassword.set('');
    this.signUpPassword.set('');
  }

  onSignIn() {
    this.errorMessage.set('');
    this.successMessage.set('');

    const res = this.dataService.signIn(this.signInEmail, this.signInPassword());
    if (res.success) {
      this.successMessage.set(res.message);
      const user = this.dataService.currentUserValue();
      setTimeout(() => {
        if (user && user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      }, 1000);
    } else {
      this.errorMessage.set(res.message);
    }
  }

  onSignUp() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.signUpName.trim()) {
      this.errorMessage.set('Name is required.');
      return;
    }

    const res = this.dataService.signUp(this.signUpEmail, this.signUpPassword(), this.signUpName);
    if (res.success) {
      this.successMessage.set(res.message);
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1200);
    } else {
      this.errorMessage.set(res.message);
    }
  }
}
